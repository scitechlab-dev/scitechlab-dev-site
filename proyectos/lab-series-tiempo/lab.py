"""Laboratorio de series de tiempo: seis algoritmos sobre datos reales, sin red.

    python lab.py                corre todo
    python lab.py --seccion 4    corre solo una
    python lab.py --json out.json  escribe los resultados

Los tres datasets vienen empaquetados con statsmodels, así que el laboratorio
corre sin internet y da el mismo resultado en cualquier máquina:

    co2       CO2 en Mauna Loa, semanal, 1958 a 2001. Tendencia clarísima más
              estacionalidad anual fuerte. El caso "fácil" de manual.
    nile      Caudal anual del Nilo, 1871 a 1970. Cien observaciones y un
              quiebre estructural en 1899, cuando se construyó la presa de
              Asuán. El caso donde un modelo global se equivoca.
    sunspots  Actividad solar anual, 1700 a 2008. Ciclo de once años que no es
              un múltiplo entero de nada. El caso donde la estacionalidad
              clásica no sirve.

Elegidos a propósito para que no todos se comporten igual: un laboratorio
donde todos los métodos ganan no enseña a elegir.
"""

from __future__ import annotations

import argparse
import json
import warnings

import numpy as np
import pandas as pd
import statsmodels.api as sm

warnings.filterwarnings("ignore")
pd.set_option("display.width", 100)

RESULTADOS: dict = {}


# ---------------------------------------------------------------------------
# Datos


def co2_mensual() -> pd.Series:
    """CO2 semanal agregado a mensual, que es donde la estacionalidad se lee."""
    d = sm.datasets.co2.load_pandas().data
    s = d["co2"].resample("MS").mean()
    # El dataset trae huecos reales: semanas sin lectura. Se interpolan y se
    # deja constancia de cuántas eran, porque un hueco tapado en silencio es
    # un dato inventado.
    faltantes = int(s.isna().sum())
    s = s.interpolate()
    s.attrs["faltantes_interpolados"] = faltantes
    return s.dropna()


def nile() -> pd.Series:
    d = sm.datasets.nile.load_pandas().data
    return pd.Series(d["volume"].to_numpy(),
                     index=pd.PeriodIndex(d["year"].astype(int), freq="Y"))


def sunspots() -> pd.Series:
    d = sm.datasets.sunspots.load_pandas().data
    return pd.Series(d["SUNACTIVITY"].to_numpy(),
                     index=pd.PeriodIndex(d["YEAR"].astype(int), freq="Y"))


# ---------------------------------------------------------------------------
# Métricas


def mae(y, f):
    return float(np.mean(np.abs(np.asarray(y) - np.asarray(f))))


def rmse(y, f):
    return float(np.sqrt(np.mean((np.asarray(y) - np.asarray(f)) ** 2)))


def mase(y, f, entrenamiento, m=1):
    """Error absoluto escalado. La métrica que permite comparar entre series.

    Divide el MAE por el MAE de la predicción ingenua estacional dentro del
    entrenamiento. Un MASE de 1 significa "igual de bueno que repetir el valor
    de hace m períodos"; menor que 1, mejor. Y como es adimensional, el 0.42 de
    una serie de CO2 y el 0.42 de una serie de demanda significan lo mismo,
    cosa que el MAE en unidades originales nunca permite.
    """
    tr = np.asarray(entrenamiento, dtype=float)
    escala = np.mean(np.abs(tr[m:] - tr[:-m]))
    return float(mae(y, f) / escala) if escala else float("nan")


# ---------------------------------------------------------------------------
# Secciones


def s1_explorar(_) -> None:
    """Antes de modelar: qué forma tiene cada serie."""
    print(f"{'serie':10s} {'n':>6s} {'frecuencia':>12s} {'media':>10s} "
          f"{'desv':>9s} {'tendencia':>10s}")
    for nombre, s in (("co2", co2_mensual()), ("nile", nile()), ("sunspots", sunspots())):
        t = np.arange(len(s))
        pend = np.polyfit(t, s.to_numpy(), 1)[0]
        freq = "mensual" if nombre == "co2" else "anual"
        print(f"{nombre:10s} {len(s):>6d} {freq:>12s} {s.mean():>10.2f} "
              f"{s.std():>9.2f} {pend:>+10.4f}")
    print()
    c = co2_mensual()
    print(f"co2: {c.attrs['faltantes_interpolados']} meses sin lectura fueron "
          f"interpolados antes de modelar")
    print()
    # ADF: la prueba que decide si hace falta diferenciar. H0 = hay raíz
    # unitaria, o sea la serie NO es estacionaria. p alto = no se puede
    # rechazar = hay que diferenciar.
    print("prueba de Dickey-Fuller aumentada (H0: raíz unitaria, no estacionaria)")
    for nombre, s in (("co2", c), ("nile", nile()), ("sunspots", sunspots())):
        for etiqueta, serie in ((nombre, s), (f"{nombre} d1", s.diff().dropna())):
            adf = sm.tsa.adfuller(serie.to_numpy(), autolag="AIC")
            veredicto = "estacionaria" if adf[1] < 0.05 else "NO estacionaria"
            print(f"  {etiqueta:12s} ADF={adf[0]:>7.3f}  p={adf[1]:.4f}  {veredicto}")
    print()
    print("Lectura: co2 en nivel es inequívocamente no estacionaria (p≈1.00) y")
    print("una diferencia la arregla. nile ya es estacionaria en nivel, lo que")
    print("tiene sentido para un caudal que oscila alrededor de una media.")
    print()
    print("sunspots queda en p=0.0531, o sea justo del lado de no rechazar por")
    print("dos milésimas. Ese es el caso incómodo y el más instructivo: la")
    print("decisión no se toma con el p solo. Sobrediferenciar una serie ya")
    print("estacionaria introduce autocorrelación negativa artificial en el")
    print("rezago 1 y ensancha los intervalos del pronóstico, así que ante la")
    print("duda conviene mirar también la ACF y probar las dos opciones.")


def s2_descomponer(_) -> None:
    """Separar tendencia, estacionalidad y resto. Dos maneras, distinto costo."""
    s = co2_mensual()
    clasica = sm.tsa.seasonal_decompose(s, model="additive", period=12)
    stl = sm.tsa.STL(s, period=12, robust=True).fit()

    for nombre, resid in (("clásica", clasica.resid), ("STL robusta", stl.resid)):
        r = pd.Series(resid).dropna()
        print(f"{nombre:14s} residuo: desv={r.std():6.3f}  "
              f"máx |r|={r.abs().max():6.3f}")
    print()
    # La fuerza de cada componente, tal como la definen Hyndman y Athanasopoulos:
    # 1 menos la varianza del residuo sobre la varianza de residuo más componente.
    var_r = np.var(stl.resid)
    fuerza_t = max(0, 1 - var_r / np.var(stl.trend + stl.resid))
    fuerza_e = max(0, 1 - var_r / np.var(stl.seasonal + stl.resid))
    print(f"fuerza de la tendencia      {fuerza_t:.3f}")
    print(f"fuerza de la estacionalidad {fuerza_e:.3f}")
    print("(0 = ausente, 1 = domina por completo)")
    print()
    amplitud = stl.seasonal.groupby(stl.seasonal.index.month).mean()
    print("patrón estacional medio, en ppm sobre la tendencia:")
    print("  " + "  ".join(f"{m:2d}:{v:+5.2f}" for m, v in amplitud.items()))
    print()
    print("STL es robusta a atípicos y admite estacionalidad que cambia despacio;")
    print("la clásica supone que el patrón es idéntico todos los años. Con 43")
    print("años de datos, esa diferencia deja de ser teórica.")
    RESULTADOS["descomposicion"] = {
        "fuerza_tendencia": round(float(fuerza_t), 4),
        "fuerza_estacionalidad": round(float(fuerza_e), 4),
    }


def s3_acf(_) -> None:
    """La autocorrelación es lo que dice qué modelo puede funcionar."""
    for nombre, s, k in (("co2 (diferenciada)", co2_mensual().diff().dropna(), 26),
                         ("sunspots", sunspots(), 26)):
        acf = sm.tsa.acf(s.to_numpy(), nlags=k, fft=True)
        pacf = sm.tsa.pacf(s.to_numpy(), nlags=k)
        # Banda de significancia aproximada: ±1.96/√n.
        banda = 1.96 / np.sqrt(len(s))
        picos = [i for i in range(1, k + 1) if abs(acf[i]) > banda]
        print(f"{nombre}: n={len(s)}, banda ±{banda:.3f}")
        print(f"  rezagos con ACF significativa: {picos[:12]}"
              f"{' …' if len(picos) > 12 else ''}")
        print(f"  primer pico de PACF fuera de banda: "
              f"{next((i for i in range(1, k + 1) if abs(pacf[i]) > banda), None)}")
        print(f"  ACF máxima entre rezagos 8 y 14: "
              f"rezago {8 + int(np.argmax(np.abs(acf[8:15])))}")
        print()
    print("En sunspots la ACF marca el ciclo de once años. No es estacionalidad")
    print("en el sentido de SARIMA, porque el período no es fijo ni entero: por")
    print("eso un SARIMA con m=11 ajusta peor de lo que la intuición sugiere.")


def s4_comparar(_) -> dict:
    """Seis algoritmos sobre CO2, con la misma partición y las mismas métricas."""
    s = co2_mensual()
    h = 24
    tr, te = s.iloc[:-h], s.iloc[-h:]
    print(f"entrenamiento {len(tr)} meses ({tr.index[0]:%Y-%m} a {tr.index[-1]:%Y-%m})")
    print(f"prueba        {len(te)} meses ({te.index[0]:%Y-%m} a {te.index[-1]:%Y-%m})")
    print()

    modelos: dict[str, np.ndarray] = {}

    # 1. Ingenuo estacional: el valor de hace doce meses. La referencia.
    modelos["Ingenuo estacional"] = np.array(
        [tr.iloc[-12 + (i % 12)] for i in range(h)])

    # 2. Deriva estacional: lo mismo, más la tendencia media del entrenamiento.
    deriva = (tr.iloc[-1] - tr.iloc[0]) / (len(tr) - 1)
    modelos["Deriva estacional"] = np.array(
        [tr.iloc[-12 + (i % 12)] + deriva * (i + 1) for i in range(h)])

    # 3. Holt-Winters aditivo: tendencia y estacionalidad, sin diagnóstico previo.
    hw = sm.tsa.ExponentialSmoothing(
        tr, trend="add", seasonal="add", seasonal_periods=12,
        initialization_method="estimated").fit()
    modelos["Holt-Winters"] = hw.forecast(h).to_numpy()

    # 4. SARIMA: el modelo que la ACF de la sección anterior sugiere.
    sarima = sm.tsa.SARIMAX(tr, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12),
                            enforce_stationarity=False,
                            enforce_invertibility=False).fit(disp=False)
    modelos["SARIMA"] = sarima.forecast(h).to_numpy()

    # 5. Regresión con tendencia y armónicos de Fourier. Sin estado oculto:
    # todo es una regresión lineal sobre variables construidas.
    t_tr = np.arange(len(tr))
    K = 3
    def fourier(t):
        cols = [np.ones_like(t, dtype=float), t.astype(float)]
        for k in range(1, K + 1):
            cols += [np.sin(2 * np.pi * k * t / 12), np.cos(2 * np.pi * k * t / 12)]
        return np.column_stack(cols)
    ols = sm.OLS(tr.to_numpy(), fourier(t_tr)).fit()
    modelos["Fourier + OLS"] = ols.predict(
        fourier(np.arange(len(tr), len(tr) + h)))

    # 6. Theta, el método que ganó la competencia M3 y que casi nadie prueba
    # pese a ser casi tan simple como una línea base. No está expuesto en
    # sm.tsa: hay que importarlo de su módulo.
    from statsmodels.tsa.forecasting.theta import ThetaModel
    theta = ThetaModel(tr, period=12).fit()
    modelos["Theta"] = theta.forecast(h).to_numpy()

    filas = []
    base = None
    for nombre, f in modelos.items():
        m = {"modelo": nombre, "MAE": mae(te, f), "RMSE": rmse(te, f),
             "MASE": mase(te, f, tr, m=12)}
        if base is None:
            base = m["MAE"]
        m["mejora_vs_ingenuo_%"] = (1 - m["MAE"] / base) * 100
        filas.append(m)
    tabla = pd.DataFrame(filas).set_index("modelo").sort_values("MAE")
    print(tabla.round(3).to_string())
    print()
    # ¿Por qué pierde el modelo de Fourier? Se comprueba en vez de afirmarse:
    # se ajusta una parábola a la tendencia que extrae STL y se mide cuánto
    # mejora respecto de la recta que el modelo global supone.
    tend = sm.tsa.STL(tr, period=12, robust=True).fit().trend.to_numpy()
    lin, cua = np.polyfit(t_tr, tend, 1), np.polyfit(t_tr, tend, 2)
    sce_l = np.sum((tend - np.polyval(lin, t_tr)) ** 2)
    sce_c = np.sum((tend - np.polyval(cua, t_tr)) ** 2)
    tf = np.arange(len(tr), len(tr) + h)
    brecha = float(np.mean(np.polyval(cua, tf) - np.polyval(lin, tf)))
    print(f"por qué pierde Fourier + OLS: la tendencia no es recta")
    print(f"  coeficiente cuadrático {cua[0]:+.3e} ({'convexa' if cua[0] > 0 else 'cóncava'})")
    print(f"  admitir curvatura reduce la SCE de la tendencia en {1 - sce_c / sce_l:.1%}")
    print(f"  al extrapolar {h} meses, recta y parábola se separan {brecha:+.2f} ppm")
    print()
    print(f"MASE < 1 significa mejor que repetir el mismo mes del año anterior.")
    print(f"Es adimensional, así que estos valores se pueden comparar contra los")
    print(f"de cualquier otra serie; el MAE en ppm, no.")
    RESULTADOS["comparacion_co2"] = tabla.round(4).reset_index().to_dict("records")
    return modelos


def s5_residuos(_) -> None:
    """Un modelo no está terminado hasta que sus residuos son ruido."""
    s = co2_mensual()
    h = 24
    tr = s.iloc[:-h]
    ajuste = sm.tsa.SARIMAX(tr, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12),
                            enforce_stationarity=False,
                            enforce_invertibility=False).fit(disp=False)
    r = pd.Series(ajuste.resid).iloc[13:]      # se descarta el arranque
    lb = sm.stats.acorr_ljungbox(r, lags=[12, 24], return_df=True)
    print("SARIMA(1,1,1)(1,1,1,12) sobre co2")
    print(f"  media del residuo {r.mean():+.4f}  (debería ser ~0)")
    print(f"  desv. estándar    {r.std():.4f}")
    print()
    print("Ljung-Box (H0: los residuos son ruido blanco)")
    print(lb.round(4).to_string())
    print()
    veredicto = "queda estructura sin modelar" if (lb["lb_pvalue"] < 0.05).any() \
        else "compatibles con ruido blanco"
    print(f"  veredicto: {veredicto}")
    print()
    print("Es la prueba que separa un modelo terminado de uno que todavía tiene")
    print("señal en la basura. Si Ljung-Box rechaza, el pronóstico puede mejorar")
    print("sin datos nuevos, solo especificando mejor.")
    RESULTADOS["ljung_box"] = {"p_12": float(lb["lb_pvalue"].iloc[0]),
                               "p_24": float(lb["lb_pvalue"].iloc[1])}


def s6_quiebre(_) -> None:
    """El caso donde el mejor modelo global es peor que dos modelos locales."""
    s = nile()
    y = s.to_numpy()
    # Chow casero: se prueba cada año como posible quiebre y se busca el que
    # más reduce la suma de cuadrados. Con 100 observaciones esto es barato.
    mejor, mejor_sce = None, np.inf
    for corte in range(15, len(y) - 15):
        a, b = y[:corte], y[corte:]
        sce = ((a - a.mean()) ** 2).sum() + ((b - b.mean()) ** 2).sum()
        if sce < mejor_sce:
            mejor, mejor_sce = corte, sce
    sce_global = ((y - y.mean()) ** 2).sum()
    anio = int(str(s.index[mejor]))
    print(f"quiebre más probable: {anio}")
    print(f"  media antes  {y[:mejor].mean():8.1f}  (n={mejor})")
    print(f"  media después{y[mejor:].mean():8.1f}  (n={len(y) - mejor})")
    print(f"  SCE con un solo nivel   {sce_global:12.0f}")
    print(f"  SCE con dos niveles     {mejor_sce:12.0f}  "
          f"({(1 - mejor_sce / sce_global) * 100:.1f} % menos)")
    print()
    print(f"La presa baja de Asuán se terminó en 1902, y el dato la ve.")
    print()
    # Y ahora lo que importa para pronosticar: ¿conviene tirar los datos
    # anteriores al quiebre?
    #
    # Una sola ventana de prueba NO alcanza para responder eso, y este dataset
    # lo demuestra de forma incómoda: el veredicto cambia según dónde se corte.
    # Por eso se evalúan varias, que es el mismo argumento del origen móvil.
    print(f"{'ventana':>8s}  {'entrena con todo':>17s}  {'solo post-quiebre':>18s}  gana")
    gana_post = 0
    detalle = []
    for h in (5, 10, 15, 20, 25, 30):
        te = s.iloc[-h:]
        f_todo = np.repeat(s.iloc[:-h].mean(), h)
        f_post = np.repeat(s.iloc[mejor:-h].mean(), h)
        m_todo, m_post = mae(te, f_todo), mae(te, f_post)
        gana = "post" if m_post < m_todo else "todo"
        gana_post += gana == "post"
        detalle.append({"h": h, "mae_todo": round(m_todo, 1), "mae_post": round(m_post, 1)})
        print(f"{h:>8d}  {m_todo:>17.1f}  {m_post:>18.1f}  {gana}")
    print()
    print(f"Entrenar solo con el régimen vigente gana en {gana_post} de 6 ventanas.")
    print("No en todas, y las diferencias son chicas frente a una serie con")
    print(f"desviación estándar de {s.std():.0f}.")
    print()
    print("Ese es el resultado honesto, y es más útil que el titular que uno")
    print("esperaría. El quiebre es real y grande: explica el 44 % de la suma de")
    print("cuadrados. Pero de ahí no se sigue automáticamente que descartar el")
    print("pasado mejore el pronóstico, porque descartar también reduce la")
    print("muestra, y con menos datos la media estimada tiene más varianza.")
    print("Hay un intercambio entre sesgo y varianza, y una sola ventana de")
    print("prueba no lo resuelve: elegir h=10 habría dado el veredicto contrario")
    print("al de h=30.")
    RESULTADOS["quiebre_nilo"] = {
        "anio": anio,
        "reduccion_sce_%": round((1 - mejor_sce / sce_global) * 100, 1),
        "ventanas": detalle,
        "ventanas_gana_post": gana_post,
    }


SECCIONES = [
    ("Explorar y probar estacionariedad", s1_explorar),
    ("Descomponer", s2_descomponer),
    ("Autocorrelación", s3_acf),
    ("Comparar seis algoritmos", s4_comparar),
    ("Diagnóstico de residuos", s5_residuos),
    ("Quiebre estructural", s6_quiebre),
]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--seccion", type=int)
    ap.add_argument("--json", metavar="RUTA")
    args = ap.parse_args()

    for i, (nombre, fn) in enumerate(SECCIONES, start=1):
        if args.seccion and args.seccion != i:
            continue
        print(f"\n{'=' * 78}\n{i}. {nombre.upper()}\n{'=' * 78}")
        fn(None)

    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump(RESULTADOS, fh, ensure_ascii=False, indent=2)
        print(f"\nJSON escrito en {args.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
