"""Reglas de validación de una declaración semanal de precio de combustible.

Cada regla es un objeto declarativo, no una rama dentro de una función larga.
Eso permite tres cosas que un `if` anidado no da: enumerar el catálogo de reglas
sin ejecutarlo, versionarlo, y emitir un hallazgo trazable que dice contra qué
numeral del reglamento se evaluó.

El ámbito de una regla dice qué necesita para decidir:

    CAMPO     un solo valor del registro
    REGISTRO  varios campos del mismo registro, entre sí
    SERIE     el mismo participante a lo largo de varias semanas
    CRUCE     el registro contra una fuente independiente (SIMEC, referencia
              internacional, estructura aprobada)

La distinción importa porque el ámbito determina qué se puede validar cuando
falta información. Una regla de CAMPO siempre se puede evaluar; una de CRUCE
queda en NO_EVALUABLE si la contraparte no llegó, y eso es un resultado, no un
silencio.

La severidad responde a una sola pregunta: ¿el dato observado puede entrar a la
programación de la operación?

    RECHAZO   no. El valor no es utilizable y la declaración no se procesa.
    ALERTA    sí, pero alguien tiene que mirarlo antes de que se repita.
    INFO      sí. Queda registrado por trazabilidad.

El criterio para separar RECHAZO de ALERTA es si la discrepancia admite una
explicación legítima. Una identidad aritmética que no cierra no la admite: o el
declarante se equivocó o el dato está mal, y en cualquier caso el número no
sirve. Un salto de precio grande sí la admite: el mercado internacional se movió.
Por eso lo primero rechaza y lo segundo alerta.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Optional


class Severidad(str, Enum):
    RECHAZO = "RECHAZO"
    ALERTA = "ALERTA"
    INFO = "INFO"


class Ambito(str, Enum):
    CAMPO = "CAMPO"
    REGISTRO = "REGISTRO"
    SERIE = "SERIE"
    CRUCE = "CRUCE"


@dataclass(frozen=True)
class Resultado:
    """Lo que devuelve una regla. `ok=None` significa que no se pudo evaluar."""

    ok: Optional[bool]
    observado: object = None
    esperado: object = None
    detalle: str = ""


@dataclass(frozen=True)
class Regla:
    id: str
    titulo: str
    ambito: Ambito
    severidad: Severidad
    referencia: str
    evaluar: Callable[..., Resultado] = field(repr=False)


# Tolerancias. Se declaran acá y no dentro de cada regla para que estén todas a
# la vista: son el único parámetro subjetivo de todo el archivo.
TOL_ARITMETICA = 0.005      # 0.5 %, redondeos de la hoja del declarante
TOL_BALANCE = 0.01          # 1 %, mermas y precisión de tanque
TOL_CONSUMO_SIMEC = 0.05    # 5 %, el consumo específico es una curva, no un punto
TOL_INTERNACION = 0.001     # 0.1 %, la fórmula de actualización es determinista
UMBRAL_SALTO = 0.15         # 15 % semana contra semana dispara revisión
SEMANAS_CONGELADO = 3       # mismo valor exacto N semanas seguidas


def _rel(a: float, b: float) -> float:
    """Diferencia relativa, con el denominador protegido."""
    if b == 0:
        return 0.0 if a == 0 else float("inf")
    return abs(a - b) / abs(b)


# ---------------------------------------------------------------------------
# CAMPO y REGISTRO


def _estructura_vigente(d, ctx) -> Resultado:
    est = ctx.estructuras.get((d.participante, d.combustible))
    if est is None:
        return Resultado(None, detalle="no hay estructura registrada para ese participante y combustible")
    if not (est["vigente_desde"] <= d.semana <= est["vigente_hasta"]):
        # El Anexo 04, 4.7 dice que la estructura vencida se sigue aplicando
        # mientras no se apruebe una nueva. Vencida no es lo mismo que ausente.
        return Resultado(
            False,
            observado=d.semana,
            esperado=f'{est["vigente_desde"]} a {est["vigente_hasta"]}',
            detalle="declaración fuera de la vigencia registrada de la estructura",
        )
    return Resultado(True, observado=est["id"])


def _fuente_aprobada(d, ctx) -> Resultado:
    est = ctx.estructuras.get((d.participante, d.combustible))
    if est is None:
        return Resultado(None, detalle="sin estructura contra la cual comparar")
    ok = d.fuente_referencia == est["fuente_referencia"]
    return Resultado(ok, observado=d.fuente_referencia, esperado=est["fuente_referencia"])


def _ventana_promedio(d, ctx) -> Resultado:
    est = ctx.estructuras.get((d.participante, d.combustible))
    if est is None:
        return Resultado(None, detalle="sin estructura contra la cual comparar")
    ok = d.dias_promedio_fob == est["dias_promedio_fob"]
    return Resultado(ok, observado=d.dias_promedio_fob, esperado=est["dias_promedio_fob"],
                     detalle="mover la ventana de promedio mueve el precio sin cambiar ningún dato")


def _plazo_envio(d, ctx) -> Resultado:
    ok = d.dia_envio == "jueves" and d.hora_envio <= "10:00"
    return Resultado(ok, observado=f"{d.dia_envio} {d.hora_envio}", esperado="jueves <= 10:00")


def _aritmetica_pcpep(d, ctx) -> Resultado:
    esperado = (d.precio_fob + d.costos_internacion) / d.poder_calorifico
    ok = _rel(d.pcpep_declarado, esperado) <= TOL_ARITMETICA
    return Resultado(ok, observado=round(d.pcpep_declarado, 4), esperado=round(esperado, 4),
                     detalle="(FOB + internación) / poder calorífico inferior")


def _referenciacion_inventario(d, ctx) -> Resultado:
    esperado = "60F" if d.estado_fisico == "liquido" else "ISO13443"
    ok = d.referencia_inventario == esperado and d.instrumentos_certificados
    return Resultado(
        ok,
        observado=f"{d.referencia_inventario}, certificados={d.instrumentos_certificados}",
        esperado=f"{esperado}, certificados=True",
    )


def _balance_inventario(d, ctx) -> Resultado:
    esperado = d.inventario_inicial + d.compras - d.consumo
    ok = _rel(d.inventario_final, esperado) <= TOL_BALANCE
    return Resultado(ok, observado=round(d.inventario_final, 2), esperado=round(esperado, 2),
                     detalle="inicial + compras - consumo")


# ---------------------------------------------------------------------------
# CRUCE contra fuentes independientes


def _internacion_por_formula(d, ctx) -> Resultado:
    prev = ctx.semana_anterior(d)
    est = ctx.estructuras.get((d.participante, d.combustible))
    if prev is None or est is None:
        return Resultado(None, detalle="sin semana anterior o sin estructura")
    esperado = prev.costos_internacion * est["factor_actualizacion_internacion"]
    ok = _rel(d.costos_internacion, esperado) <= TOL_INTERNACION
    return Resultado(ok, observado=round(d.costos_internacion, 4), esperado=round(esperado, 4),
                     detalle="cambiar un componente comprobable es un cambio de estructura, no una actualización")


def _consumo_vs_simec(d, ctx) -> Resultado:
    if d.generacion_simec is None or d.consumo_especifico is None:
        return Resultado(None, detalle="falta generación medida o curva vigente")
    esperado = d.generacion_simec * d.consumo_especifico / d.poder_calorifico
    ok = _rel(d.consumo, esperado) <= TOL_CONSUMO_SIMEC
    return Resultado(ok, observado=round(d.consumo, 2), esperado=round(esperado, 2),
                     detalle="único cruce que no depende de ningún documento del declarante")


def _piso_inventario(d, ctx) -> Resultado:
    piso = ctx.piso_inventario(d)
    if piso is None:
        return Resultado(None, detalle="sin cota del embalse ni factor de planta")
    ok = d.inventario_final >= piso
    return Resultado(ok, observado=round(d.inventario_final, 2), esperado=round(piso, 2),
                     detalle="el incumplimiento se penaliza en la tasa de salida forzada")


def _salto_contra_referencia(d, ctx) -> Resultado:
    prev = ctx.semana_anterior(d)
    if prev is None:
        return Resultado(None, detalle="primera semana de la serie")
    var_declarada = _rel(d.pcpep_declarado, prev.pcpep_declarado)
    var_referencia = _rel(d.precio_fob, prev.precio_fob)
    if var_declarada < UMBRAL_SALTO:
        return Resultado(True, observado=round(var_declarada, 4))
    # Un salto grande no es una irregularidad. Lo es que el salto no siga a la
    # referencia internacional.
    ok = _rel(var_declarada, var_referencia) <= 0.5
    return Resultado(ok, observado=round(var_declarada, 4), esperado=round(var_referencia, 4),
                     detalle="la pregunta no es cuánto subió sino si la referencia subió lo mismo")


# ---------------------------------------------------------------------------
# SERIE


def _valor_congelado(d, ctx) -> Resultado:
    serie = ctx.serie_hasta(d, SEMANAS_CONGELADO)
    if len(serie) < SEMANAS_CONGELADO:
        return Resultado(None, detalle="serie más corta que la ventana")
    precios = {round(x.pcpep_declarado, 6) for x in serie}
    referencias = {round(x.precio_fob, 6) for x in serie}
    if len(precios) == 1 and len(referencias) > 1:
        return Resultado(False, observado=f"{SEMANAS_CONGELADO} semanas idénticas",
                         esperado="variación acorde a la referencia",
                         detalle="valor congelado: la referencia se movió y el declarado no")
    return Resultado(True)


CATALOGO: tuple[Regla, ...] = (
    Regla("R01", "Vigencia de la estructura de costos", Ambito.CRUCE, Severidad.RECHAZO,
          "Anexo 04, 4.3 y 4.7", _estructura_vigente),
    Regla("R02", "Fuente internacional aprobada", Ambito.CRUCE, Severidad.RECHAZO,
          "Anexo 04, 4.9", _fuente_aprobada),
    Regla("R03", "Ventana de promedio del FOB", Ambito.CRUCE, Severidad.RECHAZO,
          "Anexo 04, 4.1 b", _ventana_promedio),
    Regla("R04", "Plazo y canal de envío", Ambito.CAMPO, Severidad.RECHAZO,
          "Anexo 04, 10.1 y 12.1 a", _plazo_envio),
    Regla("R05", "Actualización de costos de internación por fórmula", Ambito.CRUCE, Severidad.RECHAZO,
          "Anexo 04, 7.2", _internacion_por_formula),
    Regla("R06", "Aritmética del precio puesto en planta", Ambito.REGISTRO, Severidad.RECHAZO,
          "Anexo 04, 4.2", _aritmetica_pcpep),
    Regla("R07", "Referenciación del inventario", Ambito.CAMPO, Severidad.RECHAZO,
          "Anexo 04, 4.12.3 d", _referenciacion_inventario),
    Regla("R08", "Balance de inventario", Ambito.REGISTRO, Severidad.RECHAZO,
          "Anexo 04, 8.2", _balance_inventario),
    Regla("R09", "Consumo declarado contra generación medida", Ambito.CRUCE, Severidad.ALERTA,
          "Anexo 04, 8.3 con Anexo 16", _consumo_vs_simec),
    Regla("R10", "Piso de inventario por cota del embalse", Ambito.CRUCE, Severidad.ALERTA,
          "Anexo 04, 9.1 y 9.4", _piso_inventario),
    Regla("R11", "Salto de precio contra la referencia internacional", Ambito.SERIE, Severidad.ALERTA,
          "Anexo 04, 7.1", _salto_contra_referencia),
    Regla("R12", "Valor congelado", Ambito.SERIE, Severidad.ALERTA,
          "criterio propio de calidad de datos", _valor_congelado),
)
