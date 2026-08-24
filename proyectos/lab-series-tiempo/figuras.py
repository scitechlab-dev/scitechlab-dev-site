"""Figuras del artículo de series de tiempo.

    python figuras.py

Produce cinco archivos en assets/figures/:

    ts-descomposicion.png   CO2 separado en tendencia, estacionalidad y resto
    ts-acf.png              ACF y PACF de las dos series que se comportan distinto
    ts-pronosticos.png      los seis modelos contra lo que realmente pasó
    ts-quiebre.png          el Nilo, con el quiebre que el método encuentra solo
    ts-horizonte.gif        cómo se abren los pronósticos al alejarse el horizonte

Todo se calcula acá, con los mismos datos y los mismos modelos que `lab.py`, así
que las figuras no pueden desincronizarse de las cifras del artículo. La única
animación es la del horizonte, porque es el único concepto de este laboratorio
donde el movimiento muestra algo que una figura quieta no: que el error no está
repartido de forma pareja a lo largo del horizonte.

Backend Agg: sin ventana, escribe archivos.
"""

from __future__ import annotations

import pathlib
import warnings

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import statsmodels.api as sm
from matplotlib.animation import FuncAnimation, PillowWriter

from lab import co2_mensual, mae, mase, nile, sunspots

warnings.filterwarnings("ignore")

SALIDA = pathlib.Path(__file__).parent.parent.parent / "assets" / "figures"
SALIDA.mkdir(parents=True, exist_ok=True)

INK, INK_DIM, INK_FAINT = "#14161a", "#565a63", "#6e737e"
LINE, LINE_2 = "#d7dae0", "#b4b9c2"
AMBER, TEAL, PAPER, WASH = "#8a5200", "#0e7490", "#ffffff", "#f6f7f9"
H = 24


def _x(serie):
    """Eje temporal en algo que matplotlib entienda.

    co2 llega con DatetimeIndex porque pasó por resample; nile y sunspots con
    PeriodIndex. Matplotlib no entiende el segundo, así que se convierte solo
    cuando hace falta en vez de suponer uno de los dos.
    """
    idx = serie.index
    return idx.to_timestamp() if isinstance(idx, pd.PeriodIndex) else idx


def _limpio(ax):
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines[["left", "bottom"]].set_color(LINE_2)
    ax.tick_params(colors=INK_FAINT, labelsize=8.5)
    ax.grid(axis="y", color=LINE, lw=0.6)
    ax.set_axisbelow(True)


def descomposicion() -> None:
    """Los cuatro paneles clásicos, que son la forma de mirar una serie."""
    s = co2_mensual()
    stl = sm.tsa.STL(s, period=12, robust=True).fit()
    x = _x(s)

    fig, axes = plt.subplots(4, 1, figsize=(10, 7), sharex=True, facecolor=PAPER)
    fig.subplots_adjust(left=0.08, right=0.97, top=0.93, bottom=0.07, hspace=0.28)

    for ax, (serie, titulo, col) in zip(axes, [
        (s, "Serie observada (ppm)", INK),
        (stl.trend, "Tendencia: lo que queda al quitar el ciclo anual", TEAL),
        (stl.seasonal, "Estacionalidad: el mismo patrón, año tras año", AMBER),
        (stl.resid, "Residuo: lo que ninguna de las dos explica", INK_FAINT),
    ]):
        ax.plot(x, np.asarray(serie), color=col, lw=1.1)
        ax.set_title(titulo, fontsize=10, color=INK, loc="left", pad=4)
        _limpio(ax)
    axes[3].axhline(0, color=LINE_2, lw=0.8)

    # La escala del residuo, dicha explícitamente: es lo que separa una
    # descomposición útil de una decorativa.
    r = pd.Series(stl.resid).dropna()
    axes[3].text(0.995, 0.06, f"desviación del residuo: {r.std():.3f} ppm, "
                              f"frente a un rango de {s.max() - s.min():.0f} ppm en la serie",
                 transform=axes[3].transAxes, ha="right", fontsize=8.5, color=INK_DIM)
    fig.suptitle("Descomposición STL robusta del CO2 de Mauna Loa, 1958 a 2001",
                 fontsize=12, color=INK, x=0.08, ha="left")
    fig.savefig(SALIDA / "ts-descomposicion.png", dpi=110, bbox_inches="tight")
    plt.close(fig)
    print("ts-descomposicion.png")


def acf_pacf() -> None:
    """Dos series con autocorrelación de forma distinta, lado a lado."""
    series = [("CO2, una vez diferenciada", co2_mensual().diff().dropna(), 26),
              ("Manchas solares, en nivel", sunspots(), 26)]
    fig, axes = plt.subplots(2, 2, figsize=(10, 5.6), facecolor=PAPER)
    fig.subplots_adjust(left=0.07, right=0.97, top=0.88, bottom=0.10,
                        hspace=0.42, wspace=0.18)

    for fila, (nombre, s, k) in enumerate(series):
        y = s.to_numpy()
        banda = 1.96 / np.sqrt(len(y))
        for col, (fn, etiqueta) in enumerate([(sm.tsa.acf, "ACF"), (sm.tsa.pacf, "PACF")]):
            v = fn(y, nlags=k) if etiqueta == "PACF" else fn(y, nlags=k, fft=True)
            ax = axes[fila][col]
            ax.axhspan(-banda, banda, color=LINE, alpha=0.55, lw=0)
            ax.vlines(range(1, k + 1), 0, v[1:k + 1],
                      color=TEAL if fila == 0 else AMBER, lw=2.2)
            ax.axhline(0, color=LINE_2, lw=0.9)
            ax.set_title(f"{etiqueta} — {nombre}", fontsize=9.5, color=INK, loc="left")
            ax.set_xlabel("rezago", fontsize=8.5, color=INK_FAINT)
            ax.set_xlim(0, k + 1)
            _limpio(ax)
            ax.grid(False)

    axes[0][0].text(0.98, 0.9, "cae despacio: hay estructura\nen muchos rezagos",
                    transform=axes[0][0].transAxes, ha="right", va="top",
                    fontsize=8.5, color=INK_DIM)
    axes[1][0].text(0.98, 0.9, "ondula con período ~10:\nel ciclo solar",
                    transform=axes[1][0].transAxes, ha="right", va="top",
                    fontsize=8.5, color=INK_DIM)
    fig.suptitle("La banda gris es ±1.96/√n: fuera de ella, el rezago dice algo",
                 fontsize=12, color=INK, x=0.07, ha="left")
    fig.savefig(SALIDA / "ts-acf.png", dpi=110, bbox_inches="tight")
    plt.close(fig)
    print("ts-acf.png")


def _modelos(tr, h):
    """Los mismos seis de lab.py. Se reimplementan acá para que la figura no
    dependa del orden en que se corran las secciones."""
    from statsmodels.tsa.forecasting.theta import ThetaModel
    m = {}
    m["Ingenuo estacional"] = np.array([tr.iloc[-12 + (i % 12)] for i in range(h)])
    deriva = (tr.iloc[-1] - tr.iloc[0]) / (len(tr) - 1)
    m["Deriva estacional"] = np.array(
        [tr.iloc[-12 + (i % 12)] + deriva * (i + 1) for i in range(h)])
    m["Holt-Winters"] = sm.tsa.ExponentialSmoothing(
        tr, trend="add", seasonal="add", seasonal_periods=12,
        initialization_method="estimated").fit().forecast(h).to_numpy()
    m["SARIMA"] = sm.tsa.SARIMAX(
        tr, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12),
        enforce_stationarity=False, enforce_invertibility=False
    ).fit(disp=False).forecast(h).to_numpy()
    t = np.arange(len(tr))
    K = 3
    def fourier(tt):
        cols = [np.ones_like(tt, dtype=float), tt.astype(float)]
        for k in range(1, K + 1):
            cols += [np.sin(2 * np.pi * k * tt / 12), np.cos(2 * np.pi * k * tt / 12)]
        return np.column_stack(cols)
    m["Fourier + OLS"] = sm.OLS(tr.to_numpy(), fourier(t)).fit().predict(
        fourier(np.arange(len(tr), len(tr) + h)))
    m["Theta"] = ThetaModel(tr, period=12).fit().forecast(h).to_numpy()
    return m


COLORES = {
    "Holt-Winters": TEAL, "SARIMA": AMBER, "Deriva estacional": "#7a8290",
    "Theta": "#9a6b3f", "Ingenuo estacional": LINE_2, "Fourier + OLS": "#b03a2e",
}


def pronosticos() -> None:
    """Los seis, contra lo que realmente pasó."""
    s = co2_mensual()
    tr, te = s.iloc[:-H], s.iloc[-H:]
    m = _modelos(tr, H)
    xt = _x(te)

    fig, (ax0, ax1) = plt.subplots(1, 2, figsize=(11, 4.4), facecolor=PAPER,
                                   gridspec_kw={"width_ratios": [1.35, 1]})
    fig.subplots_adjust(left=0.06, right=0.985, top=0.86, bottom=0.13, wspace=0.22)

    ctx = s.iloc[-H - 48:]
    ax0.plot(_x(ctx), ctx.to_numpy(), color=INK, lw=1.5, label="observado")
    ax0.axvline(xt[0], color=LINE_2, lw=1, ls="--")
    ax0.text(xt[0], ctx.max(), " inicio del pronóstico", fontsize=8.5, color=INK_FAINT)
    for nombre, f in sorted(m.items(), key=lambda kv: mae(te, kv[1])):
        ax0.plot(xt, f, color=COLORES[nombre], lw=1.6, alpha=0.95, label=nombre)
    ax0.set_title("Cuatro años de contexto y los 24 meses pronosticados",
                  fontsize=10.5, color=INK, loc="left")
    ax0.set_ylabel("CO2 (ppm)", fontsize=9, color=INK_FAINT)
    ax0.legend(frameon=False, fontsize=8.2, loc="upper left", ncol=2)
    _limpio(ax0)

    # Panel derecho: el error, que es donde se ve la diferencia de verdad.
    # Las etiquetas se separan verticalmente si dos curvas terminan cerca: sin
    # esto, los dos mejores modelos escriben su MASE uno encima del otro.
    finales = []
    for nombre, f in sorted(m.items(), key=lambda kv: mae(te, kv[1])):
        e = np.asarray(te) - f
        ax1.plot(range(1, H + 1), e, color=COLORES[nombre], lw=1.6)
        y = e[-1]
        while any(abs(y - otro) < 0.22 for otro in finales):
            y -= 0.22
        finales.append(y)
        ax1.text(H + 0.4, y, f" {mase(te, f, tr, 12):.2f}",
                 fontsize=8.2, color=COLORES[nombre], va="center")
    ax1.axhline(0, color=INK, lw=1.1)
    ax1.set_title("Error mes a mes, y el MASE de cada uno a la derecha",
                  fontsize=10.5, color=INK, loc="left")
    ax1.set_xlabel("meses adelante del origen", fontsize=9, color=INK_FAINT)
    ax1.set_ylabel("observado menos pronosticado (ppm)", fontsize=9, color=INK_FAINT)
    ax1.set_xlim(0.5, H + 3)
    _limpio(ax1)

    fig.savefig(SALIDA / "ts-pronosticos.png", dpi=110, bbox_inches="tight")
    plt.close(fig)
    print("ts-pronosticos.png")


def quiebre() -> None:
    """El Nilo: el quiebre que el método encuentra sin ayuda."""
    s = nile()
    y = s.to_numpy()
    anios = np.array([int(str(a)) for a in s.index])
    mejor, mejor_sce = None, np.inf
    sces = []
    for corte in range(15, len(y) - 15):
        a, b = y[:corte], y[corte:]
        sce = ((a - a.mean()) ** 2).sum() + ((b - b.mean()) ** 2).sum()
        sces.append((anios[corte], sce))
        if sce < mejor_sce:
            mejor, mejor_sce = corte, sce
    sce_global = ((y - y.mean()) ** 2).sum()

    fig, (ax0, ax1) = plt.subplots(2, 1, figsize=(10, 5.4), facecolor=PAPER,
                                   gridspec_kw={"height_ratios": [1.7, 1]})
    fig.subplots_adjust(left=0.08, right=0.97, top=0.89, bottom=0.10, hspace=0.42)

    ax0.plot(anios, y, color=INK_FAINT, lw=1.1, marker="o", ms=2.6)
    ax0.axhline(y.mean(), color=LINE_2, lw=1.4, ls="--")
    ax0.text(anios[-1], y.mean(), f" un solo nivel: {y.mean():.0f}",
             fontsize=8.5, color=INK_FAINT, va="center")
    ax0.plot(anios[:mejor], np.repeat(y[:mejor].mean(), mejor), color=TEAL, lw=2.6)
    ax0.plot(anios[mejor:], np.repeat(y[mejor:].mean(), len(y) - mejor), color=AMBER, lw=2.6)
    ax0.axvline(anios[mejor], color=INK, lw=1.4, ls=":")
    ax0.text(anios[mejor] + 1, y.max(), f"quiebre detectado: {anios[mejor]}",
             fontsize=9, color=INK, va="top")
    ax0.set_title("Caudal anual del Nilo, y los dos niveles que el método separa",
                  fontsize=11, color=INK, loc="left")
    ax0.set_ylabel("caudal", fontsize=9, color=INK_FAINT)
    _limpio(ax0)

    ax1.plot([a for a, _ in sces], [v for _, v in sces], color=TEAL, lw=1.6)
    ax1.axvline(anios[mejor], color=INK, lw=1.4, ls=":")
    ax1.axhline(sce_global, color=LINE_2, lw=1.2, ls="--")
    ax1.text(anios[-16], sce_global, " sin quiebre", fontsize=8.5,
             color=INK_FAINT, va="bottom", ha="right")
    ax1.set_title(f"Suma de cuadrados según dónde se ponga el corte: el mínimo "
                  f"reduce un {(1 - mejor_sce / sce_global) * 100:.1f} %",
                  fontsize=10, color=INK, loc="left")
    ax1.set_xlabel("año del corte propuesto", fontsize=9, color=INK_FAINT)
    _limpio(ax1)

    fig.savefig(SALIDA / "ts-quiebre.png", dpi=110, bbox_inches="tight")
    plt.close(fig)
    print("ts-quiebre.png")


def gif_horizonte() -> None:
    """Cómo se abren los pronósticos al alejarse el horizonte.

    Es el único concepto de este laboratorio donde animar aporta: en una figura
    quieta, las seis curvas de pronóstico se ven como seis líneas. Al avanzar
    mes a mes se ve QUÉ modelo se despega y CUÁNDO, que es la información que
    decide a qué horizonte sirve cada uno.
    """
    s = co2_mensual()
    tr, te = s.iloc[:-H], s.iloc[-H:]
    m = _modelos(tr, H)
    xt = _x(te)
    ctx = s.iloc[-H - 30:-H]

    fig, ax = plt.subplots(figsize=(9.6, 4.4), facecolor=PAPER)
    fig.subplots_adjust(left=0.08, right=0.99, top=0.84, bottom=0.13)
    orden = sorted(m.items(), key=lambda kv: mae(te, kv[1]))

    def cuadro(k):
        ax.clear()
        ax.plot(_x(ctx), ctx.to_numpy(), color=INK_FAINT, lw=1.3)
        ax.plot(xt[:k + 1], te.to_numpy()[:k + 1], color=INK, lw=2.2, label="observado")
        for nombre, f in orden:
            ax.plot(xt[:k + 1], f[:k + 1], color=COLORES[nombre], lw=1.6, label=nombre)
        ax.axvline(xt[0], color=LINE_2, lw=1, ls="--")
        ax.set_xlim(_x(ctx)[0], xt[-1])
        ax.set_ylim(365, 376)
        ax.set_ylabel("CO2 (ppm)", fontsize=9, color=INK_FAINT)
        peor = max(orden, key=lambda kv: abs(te.to_numpy()[k] - kv[1][k]))
        ax.set_title(
            f"Mes {k+1} de {H} adelante del origen\n"
            f"peor error hasta acá: {peor[0]}, "
            f"{abs(te.to_numpy()[k] - peor[1][k]):.2f} ppm",
            fontsize=10.5, color=INK, loc="left")
        ax.legend(frameon=False, fontsize=8, loc="upper left", ncol=2)
        _limpio(ax)
        return ()

    anim = FuncAnimation(fig, cuadro, frames=H, blit=False)
    ruta = SALIDA / "ts-horizonte.gif"
    anim.save(ruta, writer=PillowWriter(fps=3))
    plt.close(fig)
    print(f"ts-horizonte.gif  {ruta.stat().st_size/1024:.0f} KiB")


def main() -> int:
    descomposicion()
    acf_pacf()
    pronosticos()
    quiebre()
    gif_horizonte()
    print()
    for f in sorted(SALIDA.glob("ts-*")):
        print(f"{f.name:26s} {f.stat().st_size/1024:8.1f} KiB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
