"""Serie sintética de energía diaria, con la estructura de una demanda real.

La serie es sintética y no corresponde a El Salvador. Lo que sí es real es todo
lo demás del proyecto: los modelos se ajustan de verdad sobre estos datos, el
backtesting corre de verdad y las métricas que se reportan son las que salieron.
La alternativa honesta sería no publicar números, no publicar números inventados.

Qué se copia de una demanda real, y por qué cada cosa importa para el ejercicio:

    tendencia          crecimiento suave, para que un modelo sin deriva pierda
    estacionalidad anual   un ciclo de 365 días
    estacionalidad semanal fin de semana más bajo que día hábil, y el sábado
                       distinto del domingo
    feriados           caídas grandes en fechas fijas, que ningún modelo puede
                       aprender de la serie sola: hay que decírselo
    temperatura        una serie exógena con su propio ciclo y su propio ruido,
                       que empuja la demanda por aire acondicionado
    ruido autocorrelacionado   AR(1), porque los errores de un día se parecen a
                       los del anterior y eso rompe los intervalos ingenuos

El objetivo es la ENERGÍA DIARIA en MWh, que es el producto que la programación
semanal necesita (ROBCP 9.3.1 a). El horizonte de evaluación es de uno a siete
días, que es exactamente lo que cubre esa programación.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

INICIO = "2022-01-01"
FIN = "2025-12-31"
SEMILLA = 20260823

# Feriados de estructura fija. No se afirma que sean los de ningún país: son
# fechas fijas con caída fuerte, que es lo que hace falta para el ejercicio.
FERIADOS_FIJOS = [(1, 1), (5, 1), (8, 6), (9, 15), (11, 2), (12, 25), (12, 31)]


def _es_feriado(idx: pd.DatetimeIndex) -> np.ndarray:
    return np.array([(d.month, d.day) in FERIADOS_FIJOS for d in idx])


def construir() -> pd.DataFrame:
    rng = np.random.default_rng(SEMILLA)
    idx = pd.date_range(INICIO, FIN, freq="D")
    n = len(idx)
    t = np.arange(n)
    doy = idx.dayofyear.to_numpy()
    dow = idx.dayofweek.to_numpy()

    # Temperatura: ciclo anual más ruido AR(1). Es la exógena del ejercicio.
    temp_base = 26.0 + 2.6 * np.sin(2 * np.pi * (doy - 100) / 365.25)
    ruido_t = np.zeros(n)
    for i in range(1, n):
        ruido_t[i] = 0.72 * ruido_t[i - 1] + rng.normal(0, 0.9)
    temperatura = temp_base + ruido_t

    # Grados de refrigeración sobre una base de confort. La respuesta de la
    # demanda a la temperatura no es lineal: solo pesa por encima del umbral.
    cdd = np.clip(temperatura - 24.0, 0, None)

    nivel = 27500 + 3.1 * t                       # MWh/día, con tendencia
    anual = 900 * np.sin(2 * np.pi * (doy - 40) / 365.25)
    semanal = np.select(
        [dow <= 3, dow == 4, dow == 5, dow == 6],
        [420.0, 260.0, -900.0, -1600.0],
    )
    clima = 520 * cdd
    feriado = _es_feriado(idx)
    efecto_feriado = np.where(feriado, -2600.0, 0.0)

    ruido = np.zeros(n)
    for i in range(1, n):
        ruido[i] = 0.35 * ruido[i - 1] + rng.normal(0, 240)

    energia = nivel + anual + semanal + clima + efecto_feriado + ruido

    return pd.DataFrame(
        {"energia": energia, "temperatura": temperatura, "cdd": cdd, "feriado": feriado.astype(int)},
        index=idx,
    )


if __name__ == "__main__":
    df = construir()
    print(df.describe().round(1).to_string())
    print()
    print("energía media por día de semana (MWh):")
    print(df.groupby(df.index.dayofweek)["energia"].mean().round(0).to_string())
    print()
    print(f"feriados en la muestra: {int(df['feriado'].sum())}")
