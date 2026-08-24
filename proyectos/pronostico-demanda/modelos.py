"""Tres enfoques con la misma interfaz, para que la comparación sea justa.

    ajustar(historia, exogenas)   entrena con todo lo disponible hasta el origen
    predecir(futuro_exogenas)     devuelve h pasos adelante

La interfaz común importa más de lo que parece. Si cada modelo se evalúa con su
propio recorte de datos o su propio criterio de corte, la comparación deja de
medir modelos y pasa a medir quién armó mejor su experimento.

Los tres:

    LineaBaseEstacional  el mismo día de la semana anterior. Es la línea base
                         que casi nadie reporta y contra la que hay que ganar
                         antes de hablar de cualquier otra cosa.
    Sarimax              SARIMAX con estacionalidad semanal y dos exógenas,
                         grados de refrigeración y feriado.
    GradientBoosting     un modelo por horizonte (estrategia directa), con
                         rezagos, medias móviles y calendario. Usa
                         HistGradientBoostingRegressor de scikit-learn en vez de
                         LightGBM para que el proyecto corra sin instalar nada.

El boosting trae además dos modelos cuantílicos, P10 y P90, para poder reportar
pérdida pinball. Un pronóstico puntual sin intervalo no le sirve a quien tiene
que decidir cuánta reserva programar.
"""

from __future__ import annotations

import warnings

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

warnings.filterwarnings("ignore")

HORIZONTE = 7          # días, el horizonte de la programación semanal
REZAGOS = (1, 2, 3, 7, 14, 28, 364)


class LineaBaseEstacional:
    """y(t+h) = y(t+h-7). El día equivalente de la semana pasada."""

    nombre = "Línea base estacional"

    def ajustar(self, historia: pd.DataFrame) -> "LineaBaseEstacional":
        self._ultimos = historia["energia"].iloc[-7:].to_numpy()
        return self

    def predecir(self, futuro: pd.DataFrame) -> np.ndarray:
        h = len(futuro)
        return np.array([self._ultimos[i % 7] for i in range(h)])


class Sarimax:
    """SARIMAX(1,1,1)(1,1,1,7) con grados de refrigeración y feriado."""

    nombre = "SARIMAX"

    def __init__(self, orden=(1, 1, 1), orden_estacional=(1, 1, 1, 7)):
        self.orden = orden
        self.orden_estacional = orden_estacional

    def ajustar(self, historia: pd.DataFrame) -> "Sarimax":
        from statsmodels.tsa.statespace.sarimax import SARIMAX

        # Dos años de historia bastan para la estacionalidad semanal y mantienen
        # el ajuste en segundos. Con la serie completa el tiempo se dispara sin
        # que la métrica mejore.
        h = historia.iloc[-730:]
        self._modelo = SARIMAX(
            h["energia"], exog=h[["cdd", "feriado"]],
            order=self.orden, seasonal_order=self.orden_estacional,
            enforce_stationarity=False, enforce_invertibility=False,
        ).fit(disp=False)
        return self

    def predecir(self, futuro: pd.DataFrame) -> np.ndarray:
        pred = self._modelo.get_forecast(steps=len(futuro), exog=futuro[["cdd", "feriado"]])
        return np.asarray(pred.predicted_mean)


def _rasgos(df: pd.DataFrame, objetivo: pd.Series, h: int) -> pd.DataFrame:
    """Rasgos para predecir el día `d`, con la información disponible en `d - h`.

    Las filas están indexadas por el DÍA OBJETIVO, no por el origen. El
    calendario y el clima son los del día objetivo, porque en operación se
    conocen de antemano: el almanaque siempre y el clima por pronóstico. Los
    rezagos, en cambio, se desplazan `h` días para que ninguno mire más allá del
    origen.

    Alinear mal estas dos cosas es el error más caro de este tipo de modelo. Si
    se entrena con el calendario del origen y se predice con el del día
    objetivo, el modelo aprende una relación que en producción no existe, y la
    degradación no aparece en ninguna métrica de entrenamiento.
    """
    x = pd.DataFrame(index=df.index)
    x["dow"] = df.index.dayofweek
    x["doy_sin"] = np.sin(2 * np.pi * df.index.dayofyear / 365.25)
    x["doy_cos"] = np.cos(2 * np.pi * df.index.dayofyear / 365.25)
    x["mes"] = df.index.month
    x["cdd"] = df["cdd"].to_numpy()
    x["temperatura"] = df["temperatura"].to_numpy()
    x["feriado"] = df["feriado"].to_numpy()
    for r in REZAGOS:
        # lag1 es el valor en el origen, lag2 el del día anterior, y así.
        x[f"lag{r}"] = objetivo.shift(h + r - 1).to_numpy()
    base = objetivo.shift(h)
    x["media7"] = base.rolling(7).mean().to_numpy()
    x["media28"] = base.rolling(28).mean().to_numpy()
    x["desv7"] = base.rolling(7).std().to_numpy()
    return x


class GradientBoosting:
    """Estrategia directa: un modelo por horizonte, más P10 y P90."""

    nombre = "Gradient boosting"

    def __init__(self, horizonte: int = HORIZONTE, cuantiles: bool = True):
        self.horizonte = horizonte
        self.cuantiles = cuantiles

    @staticmethod
    def _reg(loss="squared_error", quantile=None):
        return HistGradientBoostingRegressor(
            loss=loss, quantile=quantile, max_iter=300, learning_rate=0.06,
            max_depth=6, min_samples_leaf=20, l2_regularization=1.0,
            early_stopping=False, random_state=7,
        )

    def ajustar(self, historia: pd.DataFrame) -> "GradientBoosting":
        y = historia["energia"]
        self._historia = historia
        self._modelos, self._p10, self._p90 = {}, {}, {}
        for h in range(1, self.horizonte + 1):
            X = _rasgos(historia, y, h)
            valido = X.notna().all(axis=1)
            Xh, yh = X[valido], y[valido]
            self._modelos[h] = self._reg().fit(Xh, yh)
            if self.cuantiles:
                self._p10[h] = self._reg("quantile", 0.10).fit(Xh, yh)
                self._p90[h] = self._reg("quantile", 0.90).fit(Xh, yh)
        return self

    def _filas_futuro(self, futuro: pd.DataFrame) -> dict[int, pd.DataFrame]:
        """Una fila de rasgos por horizonte, construida sobre historia + futuro.

        Los rezagos se resuelven contra la serie concatenada, cuyo tramo futuro
        es NaN. Como el rezago mínimo del horizonte h es el valor del origen,
        ninguna fila necesita un dato que todavía no exista.
        """
        y_ext = pd.concat([self._historia["energia"],
                           pd.Series(np.nan, index=futuro.index)])
        df_ext = pd.concat([self._historia[["cdd", "temperatura", "feriado"]],
                            futuro[["cdd", "temperatura", "feriado"]]])
        filas = {}
        for h in range(1, len(futuro) + 1):
            X = _rasgos(df_ext, y_ext, h)
            filas[h] = X.loc[[futuro.index[h - 1]]]
        return filas

    def predecir(self, futuro: pd.DataFrame) -> np.ndarray:
        filas = self._filas_futuro(futuro)
        return np.array([float(self._modelos[h].predict(filas[h])[0])
                         for h in range(1, len(futuro) + 1)])

    def predecir_intervalo(self, futuro: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        filas = self._filas_futuro(futuro)
        lo = [float(self._p10[h].predict(filas[h])[0]) for h in range(1, len(futuro) + 1)]
        hi = [float(self._p90[h].predict(filas[h])[0]) for h in range(1, len(futuro) + 1)]
        return np.array(lo), np.array(hi)


CATALOGO = (LineaBaseEstacional, Sarimax, GradientBoosting)
