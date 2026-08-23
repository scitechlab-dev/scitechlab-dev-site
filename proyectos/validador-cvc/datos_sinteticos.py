"""Datos sintéticos con estructura realista y defectos sembrados a propósito.

No hay ninguna cifra atribuida a un generador real. Lo que se copia de la
realidad es la ESTRUCTURA: cuatro participantes, dos combustibles, doce semanas,
una estructura de costos aprobada por participante y combustible, y una serie de
precios internacionales que se mueve como se mueve una cotización.

Los defectos se siembran en posiciones conocidas para poder verificar que el
validador los encuentra. Están declarados abajo en DEFECTOS, y el `self-check`
al final del archivo comprueba que la corrida los reporta todos: un validador
que no detecta lo que se le sembró no sirve, y eso hay que probarlo, no
suponerlo.
"""

from __future__ import annotations

import math
import random

from validador import Declaracion

SEMANAS = list(range(1, 13))

# (participante, central, combustible, estado físico, poder calorífico, unidad)
PARQUE = [
    ("PM-ALFA", "CT-Acajutla", "fuel_oil", "liquido", 6.20),
    ("PM-BETA", "CT-Nejapa", "diesel", "liquido", 5.80),
    ("PM-GAMMA", "CT-Talnique", "gas_natural", "gas", 1.00),
    ("PM-DELTA", "CT-Soyapango", "fuel_oil", "liquido", 6.20),
]

ESTRUCTURAS = {
    ("PM-ALFA", "fuel_oil"): {
        "id": "EST-2025-014", "fuente_referencia": "PLATTS-USGC-HSFO", "dias_promedio_fob": 7,
        "factor_actualizacion_internacion": 1.0020, "vigente_desde": 1, "vigente_hasta": 52,
    },
    ("PM-BETA", "diesel"): {
        "id": "EST-2025-021", "fuente_referencia": "PLATTS-USGC-ULSD", "dias_promedio_fob": 5,
        "factor_actualizacion_internacion": 1.0015, "vigente_desde": 1, "vigente_hasta": 52,
    },
    ("PM-GAMMA", "gas_natural"): {
        "id": "EST-2026-003", "fuente_referencia": "HENRY-HUB-NYMEX", "dias_promedio_fob": 30,
        "factor_actualizacion_internacion": 1.0008, "vigente_desde": 6, "vigente_hasta": 52,
    },
    ("PM-DELTA", "fuel_oil"): {
        "id": "EST-2024-009", "fuente_referencia": "PLATTS-USGC-HSFO", "dias_promedio_fob": 7,
        "factor_actualizacion_internacion": 1.0020, "vigente_desde": 1, "vigente_hasta": 52,
    },
}

# Defectos sembrados: (participante, semana, regla que debe dispararse)
DEFECTOS = [
    ("PM-GAMMA", 1, "R01"),   # declara antes de que su estructura entre en vigencia
    ("PM-BETA", 4, "R02"),    # cambia la fuente internacional por una no aprobada
    ("PM-DELTA", 5, "R03"),   # amplía la ventana de promedio del FOB
    ("PM-GAMMA", 7, "R04"),   # envía el viernes
    ("PM-ALFA", 6, "R05"),    # actualiza internación con un valor nuevo, no por fórmula
    ("PM-DELTA", 8, "R06"),   # el PCpep declarado no cuadra con sus componentes
    ("PM-BETA", 9, "R07"),    # inventario sin referenciar a 60 °F
    ("PM-ALFA", 10, "R08"),   # el balance de inventario no cierra
    ("PM-GAMMA", 11, "R09"),  # consumo incompatible con la generación medida
    ("PM-BETA", 12, "R10"),   # inventario por debajo del piso con embalse bajo
    ("PM-DELTA", 3, "R11"),   # salto de precio que la referencia no acompaña
    ("PM-ALFA", 4, "R12"),    # precio congelado tres semanas con referencia móvil
]


def _serie_fob(base: float, semillas: int) -> list[float]:
    """Una cotización internacional: tendencia suave más ruido."""
    rng = random.Random(semillas)
    v, out = base, []
    for _ in SEMANAS:
        v *= 1 + rng.gauss(0.004, 0.018)
        out.append(round(v, 3))
    return out


def construir() -> tuple[list[Declaracion], dict]:
    decls: list[Declaracion] = []
    defectos = {(p, s): r for p, s, r in DEFECTOS}

    for idx, (pm, central, comb, estado, pci) in enumerate(PARQUE):
        est = ESTRUCTURAS[(pm, comb)]
        fob = _serie_fob(base=(78.4 if comb == "fuel_oil" else 96.5 if comb == "diesel" else 3.85),
                         semillas=1000 + idx)
        internacion = 8.55 if comb == "fuel_oil" else 9.10 if comb == "diesel" else 0.62
        # Línea base holgada contra el piso del numeral 9.1, para que la regla
        # R10 dispare por el defecto sembrado y no por el nivel de partida.
        inventario = 62000.0 if estado == "liquido" else 300000.0
        consumo_especifico = 8.53 if comb == "fuel_oil" else 9.90 if comb == "diesel" else 7.10
        consumo_dia = 5200.0 if estado == "liquido" else 26000.0

        # Las semanas del tramo congelado: la del defecto y las dos anteriores.
        # Se calculan de una vez para que las tres compartan exactamente el mismo
        # precio declarado, que es lo que la regla R12 busca.
        semana_r12 = next((s for p, s, r in DEFECTOS if p == pm and r == "R12"), None)
        congeladas = set()
        pcpep_congelado = None
        if semana_r12 is not None:
            congeladas = {semana_r12 - 2, semana_r12 - 1, semana_r12}
            pcpep_congelado = round((fob[min(congeladas) - 1] + internacion) / pci, 4)

        for w in SEMANAS:
            d_fob = fob[w - 1]
            d_int = round(internacion, 4)
            fuente = est["fuente_referencia"]
            dias = est["dias_promedio_fob"]
            dia, hora = "jueves", "09:12"
            ref_inv = "60F" if estado == "liquido" else "ISO13443"
            certificados = True

            defecto = defectos.get((pm, w))
            congelado = w in congeladas   # la referencia sigue moviéndose igual

            if defecto == "R02":
                fuente = "FUENTE-NO-APROBADA"
            if defecto == "R03":
                dias = est["dias_promedio_fob"] + 8
            if defecto == "R04":
                dia, hora = "viernes", "08:40"
            if defecto == "R05":
                d_int = round(internacion * 1.085, 4)   # salto que la fórmula no explica
            if defecto == "R07":
                ref_inv = "sin_referenciar"
                certificados = False
            if defecto == "R11":
                d_fob = round(fob[w - 1] * 1.01, 3)     # la referencia casi no se movió

            pcpep = (d_fob + d_int) / pci
            if defecto == "R11":
                pcpep *= 1.22                            # pero el declarado salta 22 %
            if congelado:
                pcpep = pcpep_congelado                  # el mismo valor tres semanas seguidas
            if defecto == "R06":
                pcpep *= 1.031                           # no cuadra con sus componentes

            generacion = round(11000 + 900 * math.sin(w / 2) + 300 * ((idx % 3) - 1), 1)
            consumo = generacion * consumo_especifico / pci
            if defecto == "R09":
                consumo *= 1.19                          # más combustible del que explica lo generado

            compras = round(consumo * 1.02, 2)
            inv_final = inventario + compras - consumo
            if defecto == "R08":
                inv_final += 1900.0                      # el balance no cierra

            cota = 238.4 if w < 9 else 233.9             # el embalse baja al final del período
            fp = 0.81 if idx % 2 == 0 else 0.62
            if defecto == "R10":
                inv_final = consumo_dia * 2              # muy por debajo del piso

            decls.append(Declaracion(
                participante=pm, central=central, combustible=comb, estado_fisico=estado,
                semana=w, dia_envio=dia, hora_envio=hora,
                fuente_referencia=fuente, dias_promedio_fob=dias,
                precio_fob=d_fob, costos_internacion=d_int, poder_calorifico=pci,
                pcpep_declarado=round(pcpep, 4),
                inventario_inicial=round(inventario, 2), compras=compras,
                consumo=round(consumo, 2), inventario_final=round(inv_final, 2),
                referencia_inventario=ref_inv, instrumentos_certificados=certificados,
                generacion_simec=generacion, consumo_especifico=consumo_especifico,
                cota_embalse=cota, factor_planta=fp, consumo_plena_carga_dia=consumo_dia,
            ))
            inventario = inv_final
            internacion *= est["factor_actualizacion_internacion"]

    return decls, ESTRUCTURAS


def self_check() -> int:
    """Comprueba que la corrida encuentra cada defecto sembrado."""
    from validador import validar

    decls, estructuras = construir()
    hallazgos, _ = validar(decls, estructuras)
    fallas = {(h.clave.split("/")[0], int(h.clave.split("/S")[1]), h.regla)
              for h in hallazgos if h.estado == "FALLA"}
    faltantes = [d for d in DEFECTOS if d not in fallas]
    if faltantes:
        print("defectos sembrados que el validador NO detectó:")
        for f in faltantes:
            print("   ", f)
        return 1
    print(f"self-check: los {len(DEFECTOS)} defectos sembrados fueron detectados")
    return 0


if __name__ == "__main__":
    raise SystemExit(self_check())
