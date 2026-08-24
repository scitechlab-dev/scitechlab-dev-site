"""Las cuatro bibliotecas de gráficos, sobre los mismos datos.

    python graficas.py        genera los cuatro archivos en salida/

Matplotlib, seaborn, plotly y el método .plot de pandas resuelven el mismo
problema con contratos distintos. Este archivo hace deliberadamente la MISMA
figura con las cuatro, para que la comparación sea sobre la herramienta y no
sobre el ejemplo.

La elección, resumida:

    pandas .plot   una línea, para mirar algo ahora mismo. No para publicar.
    matplotlib     control total y salida estática reproducible. Verboso.
    seaborn        estadístico: agrupa, agrega y calcula intervalos por vos.
    plotly         interactivo, sale a HTML. Pesa, y no sirve para un PDF.

Backend Agg: sin ventana, sin display, escribe archivos. Es lo que hay que usar
en un script, en CI o en un servidor. Si se omite, el mismo código puede
bloquearse esperando una ventana que nunca se abre.
"""

from __future__ import annotations

import pathlib

import matplotlib
matplotlib.use("Agg")           # antes de importar pyplot, no después

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import statsmodels.api as sm

SALIDA = pathlib.Path(__file__).parent / "salida"
SALIDA.mkdir(exist_ok=True)


def datos() -> pd.DataFrame:
    d = sm.datasets.macrodata.load_pandas().data
    idx = pd.PeriodIndex.from_fields(
        year=d["year"].astype(int), quarter=d["quarter"].astype(int), freq="Q"
    )
    d = d.drop(columns=["year", "quarter"]).set_index(idx)
    d["decada"] = (d.index.year // 10) * 10
    # to_timestamp() porque matplotlib y plotly no entienden PeriodIndex.
    # pandas sí, y ahí está media hora de depuración que nadie quiere repetir.
    d["fecha"] = d.index.to_timestamp()
    return d


def con_pandas(d: pd.DataFrame) -> None:
    """Una línea. El punto es que a veces una línea alcanza."""
    ax = d.set_index("fecha")[["unemp", "infl"]].plot(
        figsize=(10, 4), title="Desempleo e inflación, 1959 a 2009"
    )
    ax.set_xlabel("")
    ax.set_ylabel("porcentaje")
    ax.figure.savefig(SALIDA / "1-pandas.png", dpi=110, bbox_inches="tight")
    plt.close(ax.figure)


def con_matplotlib(d: pd.DataFrame) -> None:
    """Lo mismo, controlando cada elemento.

    Es más código, y a cambio no hay nada que la biblioteca decida por su
    cuenta. Para una figura que va a un informe, eso es exactamente lo que se
    quiere: que el resultado no cambie porque cambió una versión.
    """
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(d["fecha"], d["unemp"], color="#0e7490", lw=1.8, label="desempleo")
    ax.plot(d["fecha"], d["infl"], color="#8a5200", lw=1.4, label="inflación")
    ax.axhline(0, color="#b4b9c2", lw=0.8)

    # Sombrear las recesiones que el propio dato muestra: dos trimestres
    # seguidos de caída del PIB real.
    caida = d["realgdp"].pct_change() < 0
    recesion = caida & caida.shift(1)
    for f in d.loc[recesion, "fecha"]:
        ax.axvspan(f - pd.Timedelta(days=91), f, color="#14161a", alpha=0.07, lw=0)

    ax.set_title("Desempleo e inflación, con recesiones sombreadas", loc="left")
    ax.set_ylabel("porcentaje")
    ax.legend(frameon=False, loc="upper right")
    ax.spines[["top", "right"]].set_visible(False)
    fig.savefig(SALIDA / "2-matplotlib.png", dpi=110, bbox_inches="tight")
    plt.close(fig)


def con_seaborn(d: pd.DataFrame) -> None:
    """Seaborn hace la estadística, no solo el dibujo.

    boxplot calcula cuartiles y atípicos; lmplot ajusta una regresión con su
    banda de confianza. Eso es lo que lo distingue de matplotlib: no es una
    capa de estilo, es una capa de agregación.
    """
    sns.set_theme(style="whitegrid", font_scale=0.9)
    fig, axes = plt.subplots(1, 2, figsize=(11, 4))

    sns.boxplot(data=d, x="decada", y="unemp", ax=axes[0],
                color="#0e7490", fill=False, linewidth=1.3)
    axes[0].set_title("Distribución del desempleo por década", loc="left")
    axes[0].set_xlabel("")
    axes[0].set_ylabel("desempleo (%)")

    # La curva de Phillips: la relación negativa entre desempleo e inflación
    # que la teoría predice y los datos no siempre respetan.
    sns.regplot(data=d, x="unemp", y="infl", ax=axes[1],
                scatter_kws={"s": 14, "alpha": 0.55, "color": "#565a63"},
                line_kws={"color": "#8a5200", "lw": 2})
    axes[1].set_title("¿Curva de Phillips? Cada punto es un trimestre", loc="left")
    axes[1].set_xlabel("desempleo (%)")
    axes[1].set_ylabel("inflación (%)")

    fig.tight_layout()
    fig.savefig(SALIDA / "3-seaborn.png", dpi=110, bbox_inches="tight")
    plt.close(fig)
    sns.reset_defaults()


def con_plotly(d: pd.DataFrame) -> None:
    """Plotly sale a HTML y se explora con el mouse.

    include_plotlyjs='cdn' deja el archivo en decenas de kilobytes en vez de
    varios megabytes, a cambio de exigir internet para verlo. Con True queda
    autocontenido y pesado; es la decisión que hay que tomar a conciencia según
    dónde va a vivir el archivo.
    """
    import plotly.express as px

    fig = px.scatter(
        d, x="unemp", y="infl", color="decada", hover_name=d.index.astype(str),
        labels={"unemp": "desempleo (%)", "infl": "inflación (%)", "decada": "década"},
        title="Desempleo contra inflación, coloreado por década",
        color_continuous_scale="Viridis",
    )
    fig.update_traces(marker=dict(size=8, line=dict(width=0.5, color="white")))
    fig.update_layout(template="simple_white", height=460)
    fig.write_html(SALIDA / "4-plotly.html", include_plotlyjs="cdn")


def main() -> int:
    d = datos()
    for fn in (con_pandas, con_matplotlib, con_seaborn, con_plotly):
        fn(d)
        print(f"ok  {fn.__name__}")
    print()
    for f in sorted(SALIDA.iterdir()):
        print(f"{f.name:20s} {f.stat().st_size / 1024:8.1f} KiB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
