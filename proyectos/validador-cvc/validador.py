"""Motor de validación y registro auditable.

    python validador.py                 corre sobre los datos sintéticos
    python validador.py --json out.json escribe el informe para otras piezas

El motor no sabe nada del dominio: recorre el catálogo, evalúa cada regla contra
cada declaración y colecciona hallazgos. Todo lo que sabe de combustibles vive en
reglas.py. Esa separación es lo que permite que agregar una regla no toque el
motor, y que el catálogo se pueda auditar leyéndolo.

El registro auditable no es un log. Un log dice qué pasó; un registro auditable
dice contra qué se validó. Guarda el hash del insumo, la versión del catálogo,
la versión de la estructura aplicada a cada participante y el resultado de cada
regla, incluidas las que pasaron y las que no se pudieron evaluar. Sin las que
pasaron no se puede demostrar después que se revisaron.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Iterable, Optional

from reglas import CATALOGO, Ambito, Regla, Resultado, Severidad

VERSION_CATALOGO = "2026.08.1"


@dataclass(frozen=True)
class Declaracion:
    participante: str
    central: str
    combustible: str
    estado_fisico: str          # liquido | gas
    semana: int
    dia_envio: str
    hora_envio: str
    fuente_referencia: str
    dias_promedio_fob: int
    precio_fob: float           # USD por unidad física
    costos_internacion: float   # USD por unidad física
    poder_calorifico: float     # MMBtu por unidad física
    pcpep_declarado: float      # USD/MMBtu
    inventario_inicial: float
    compras: float
    consumo: float
    inventario_final: float
    referencia_inventario: str
    instrumentos_certificados: bool
    generacion_simec: Optional[float] = None      # MWh de la semana
    consumo_especifico: Optional[float] = None    # MMBtu/MWh vigente
    cota_embalse: Optional[float] = None
    factor_planta: Optional[float] = None
    consumo_plena_carga_dia: Optional[float] = None

    @property
    def clave(self) -> str:
        return f"{self.participante}/{self.central}/{self.combustible}/S{self.semana:02d}"


@dataclass(frozen=True)
class Hallazgo:
    clave: str
    regla: str
    titulo: str
    ambito: str
    severidad: str
    referencia: str
    estado: str           # FALLA | NO_EVALUABLE | OK
    observado: object
    esperado: object
    detalle: str


class Contexto:
    """Fuentes independientes y acceso a la serie. Es lo único con estado."""

    def __init__(self, declaraciones: Iterable[Declaracion], estructuras: dict):
        self.declaraciones = sorted(declaraciones, key=lambda d: (d.participante, d.central, d.combustible, d.semana))
        self.estructuras = estructuras
        self._por_serie: dict[tuple, list[Declaracion]] = {}
        for d in self.declaraciones:
            self._por_serie.setdefault((d.participante, d.central, d.combustible), []).append(d)

    def semana_anterior(self, d: Declaracion) -> Optional[Declaracion]:
        serie = self._por_serie[(d.participante, d.central, d.combustible)]
        i = serie.index(d)
        return serie[i - 1] if i > 0 else None

    def serie_hasta(self, d: Declaracion, n: int) -> list[Declaracion]:
        serie = self._por_serie[(d.participante, d.central, d.combustible)]
        i = serie.index(d)
        return serie[max(0, i - n + 1): i + 1]

    def piso_inventario(self, d: Declaracion) -> Optional[float]:
        """Anexo 04, 9.1: días a plena carga según cota de Cerrón Grande."""
        if d.cota_embalse is None or d.factor_planta is None or d.consumo_plena_carga_dia is None:
            return None
        if d.cota_embalse < 235.50:
            dias_alto, dias_bajo = 10, 5
        elif d.cota_embalse <= 242.0:
            dias_alto, dias_bajo = 8, 4
        else:
            dias_alto, dias_bajo = 7, 3
        if d.factor_planta >= 0.75:
            return dias_alto * d.consumo_plena_carga_dia
        # Para factor de planta menor, el piso es el mayor entre los días de la
        # tabla y el consumo de la programación semanal más 35 %.
        return max(dias_bajo * d.consumo_plena_carga_dia, d.consumo * 1.35)


def validar(declaraciones: list[Declaracion], estructuras: dict) -> tuple[list[Hallazgo], dict]:
    ctx = Contexto(declaraciones, estructuras)
    hallazgos: list[Hallazgo] = []
    for d in ctx.declaraciones:
        for regla in CATALOGO:
            try:
                r: Resultado = regla.evaluar(d, ctx)
            except Exception as exc:  # una regla rota no puede tumbar la corrida
                r = Resultado(None, detalle=f"error al evaluar la regla: {exc!r}")
            estado = "NO_EVALUABLE" if r.ok is None else ("OK" if r.ok else "FALLA")
            hallazgos.append(Hallazgo(
                clave=d.clave, regla=regla.id, titulo=regla.titulo,
                ambito=regla.ambito.value, severidad=regla.severidad.value,
                referencia=regla.referencia, estado=estado,
                observado=r.observado, esperado=r.esperado, detalle=r.detalle,
            ))
    registro = _registro(ctx, hallazgos)
    return hallazgos, registro


def _registro(ctx: Contexto, hallazgos: list[Hallazgo]) -> dict:
    payload = json.dumps([asdict(d) for d in ctx.declaraciones], sort_keys=True, default=str).encode()
    fallas = [h for h in hallazgos if h.estado == "FALLA"]
    rechazadas = {h.clave for h in fallas if h.severidad == Severidad.RECHAZO.value}
    return {
        "corrida": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "version_catalogo": VERSION_CATALOGO,
        "hash_insumo_sha256": hashlib.sha256(payload).hexdigest(),
        "declaraciones": len(ctx.declaraciones),
        "reglas": len(CATALOGO),
        "evaluaciones": len(hallazgos),
        "estructuras_aplicadas": {f"{k[0]}/{k[1]}": v["id"] for k, v in sorted(ctx.estructuras.items())},
        "conteo_estado": {e: sum(1 for h in hallazgos if h.estado == e) for e in ("OK", "FALLA", "NO_EVALUABLE")},
        "conteo_severidad_falla": {
            s.value: sum(1 for h in fallas if h.severidad == s.value) for s in Severidad
        },
        "declaraciones_rechazadas": sorted(rechazadas),
        "tasa_aceptacion": round(1 - len(rechazadas) / len(ctx.declaraciones), 4),
    }


def informe(hallazgos: list[Hallazgo], registro: dict) -> str:
    orden = {Severidad.RECHAZO.value: 0, Severidad.ALERTA.value: 1, Severidad.INFO.value: 2}
    fallas = sorted((h for h in hallazgos if h.estado == "FALLA"),
                    key=lambda h: (orden[h.severidad], h.regla, h.clave))
    no_eval = [h for h in hallazgos if h.estado == "NO_EVALUABLE"]

    out = ["INFORME DE VALIDACIÓN DE DECLARACIONES SEMANALES", "=" * 78, ""]
    out.append(f"corrida            {registro['corrida']}")
    out.append(f"catálogo           v{registro['version_catalogo']}  ({registro['reglas']} reglas)")
    out.append(f"insumo sha256      {registro['hash_insumo_sha256'][:32]}…")
    out.append(f"declaraciones      {registro['declaraciones']}")
    out.append(f"evaluaciones       {registro['evaluaciones']}  "
               f"(OK {registro['conteo_estado']['OK']}, "
               f"falla {registro['conteo_estado']['FALLA']}, "
               f"no evaluable {registro['conteo_estado']['NO_EVALUABLE']})")
    out.append(f"tasa de aceptación {registro['tasa_aceptacion']:.1%}")
    out.append("")

    sev_actual = None
    for h in fallas:
        if h.severidad != sev_actual:
            sev_actual = h.severidad
            n = registro["conteo_severidad_falla"][sev_actual]
            out += ["", f"── {sev_actual}  ({n})", "─" * 78]
        out.append(f"{h.regla}  {h.clave}")
        out.append(f"      {h.titulo}   [{h.ambito}]   {h.referencia}")
        if h.observado is not None or h.esperado is not None:
            out.append(f"      observado: {h.observado}   esperado: {h.esperado}")
        if h.detalle:
            out.append(f"      {h.detalle}")
        out.append("")

    if no_eval:
        out += ["", f"── NO EVALUABLES  ({len(no_eval)})", "─" * 78]
        agrupado: dict[str, list[str]] = {}
        for h in no_eval:
            agrupado.setdefault(f"{h.regla}  {h.detalle}", []).append(h.clave)
        for k, claves in sorted(agrupado.items()):
            out.append(f"{k}  ({len(claves)})")
        out.append("")

    out += ["", "── DECLARACIONES RECHAZADAS", "─" * 78]
    if registro["declaraciones_rechazadas"]:
        out += [f"  {c}" for c in registro["declaraciones_rechazadas"]]
    else:
        out.append("  ninguna")
    return "\n".join(out)


def main() -> int:
    from datos_sinteticos import construir

    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--json", metavar="RUTA", help="escribe el informe completo en JSON")
    args = ap.parse_args()

    declaraciones, estructuras = construir()
    hallazgos, registro = validar(declaraciones, estructuras)
    print(informe(hallazgos, registro))

    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump({"registro": registro, "hallazgos": [asdict(h) for h in hallazgos]},
                      fh, ensure_ascii=False, indent=2, default=str)
        print(f"\nJSON escrito en {args.json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
