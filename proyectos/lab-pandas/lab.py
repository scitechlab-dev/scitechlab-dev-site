"""Laboratorio de análisis de datos con pandas, sobre datos reales y sin red.

    python lab.py            corre las ocho secciones e imprime lo que sale
    python lab.py --seccion 3  corre solo una

Los datos son `macrodata` de statsmodels: 203 trimestres de macroeconomía de
Estados Unidos, de 1959Q1 a 2009Q3, empaquetados con la biblioteca. No hay
descarga, así que el laboratorio corre igual sin internet y da el mismo
resultado en cualquier máquina.

Cada sección imprime su salida. Lo que el artículo cita son esas salidas, no
números escritos a mano.
"""

from __future__ import annotations

import argparse

import numpy as np
import pandas as pd
import statsmodels.api as sm

pd.set_option("display.width", 100)
pd.set_option("display.max_columns", 20)


def cargar() -> pd.DataFrame:
    """Carga macrodata y le pone un índice temporal de verdad.

    El dataset trae `year` y `quarter` como columnas float. Mientras sigan así,
    pandas no sabe que esto es una serie de tiempo: no se puede remuestrear, ni
    tomar una ventana de dos años, ni cortar por fecha. `PeriodIndex` convierte
    esas dos columnas en un índice trimestral, y a partir de ahí toda la
    maquinaria temporal de pandas queda disponible.
    """
    d = sm.datasets.macrodata.load_pandas().data
    # from_fields en vez del constructor: desde pandas 2.2 construir un
    # PeriodIndex pasándole year= y quarter= al constructor está deprecado.
    idx = pd.PeriodIndex.from_fields(
        year=d["year"].astype(int), quarter=d["quarter"].astype(int), freq="Q"
    )
    d = d.drop(columns=["year", "quarter"]).set_index(idx)
    d.index.name = "trimestre"
    return d


# ---------------------------------------------------------------------------


def s1_inspeccion(d: pd.DataFrame) -> None:
    """Lo primero que se hace con cualquier tabla, y casi nadie hace completo."""
    print(f"forma: {d.shape[0]} filas × {d.shape[1]} columnas")
    print(f"rango: {d.index.min()} a {d.index.max()}")
    print(f"memoria: {d.memory_usage(deep=True).sum() / 1024:.1f} KiB")
    print(f"nulos totales: {int(d.isna().sum().sum())}")
    print()
    # describe() por defecto oculta los percentiles que más importan para
    # detectar colas. Pedirlos explícitamente cuesta lo mismo.
    print(d[["realgdp", "unemp", "infl", "tbilrate"]]
          .describe(percentiles=[0.01, 0.25, 0.5, 0.75, 0.99])
          .round(2).to_string())


def s2_seleccion(d: pd.DataFrame) -> None:
    """`.loc` contra `[]`, y por qué la diferencia no es estilística."""
    # Un corte por etiqueta con .loc INCLUYE el extremo derecho. Un corte
    # posicional con .iloc no. Es la fuente de errores por un elemento más
    # frecuente de pandas.
    por_etiqueta = d.loc["2008Q1":"2008Q4", ["realgdp", "unemp"]]
    por_posicion = d.iloc[-4:, :2]
    print("d.loc['2008Q1':'2008Q4'] devuelve", len(por_etiqueta), "filas (extremo incluido)")
    print("d.iloc[-4:] devuelve         ", len(por_posicion), "filas")
    print()
    print(por_etiqueta.to_string())
    print()
    # Filtro booleano: la forma correcta de preguntar "¿cuándo pasó X?"
    crisis = d[(d["unemp"] > 8) & (d["infl"] < 3)]
    print(f"trimestres con desempleo > 8 % e inflación < 3 %: {len(crisis)}")
    print(f"  {', '.join(str(p) for p in crisis.index[:8])} …")


def s3_derivadas(d: pd.DataFrame) -> pd.DataFrame:
    """Columnas nuevas: variaciones, tasas anualizadas y rezagos."""
    x = d.copy()
    # pct_change() sobre un trimestre da la variación trimestral. Anualizarla
    # es elevar a la cuarta, no multiplicar por cuatro: el interés compuesto no
    # es lineal y la diferencia se nota en las colas.
    x["gdp_qoq"] = x["realgdp"].pct_change() * 100
    x["gdp_anualizado"] = ((1 + x["realgdp"].pct_change()) ** 4 - 1) * 100
    x["gdp_yoy"] = x["realgdp"].pct_change(periods=4) * 100
    x["unemp_delta"] = x["unemp"].diff()

    muestra = x.loc["2008Q3":"2009Q2", ["realgdp", "gdp_qoq", "gdp_anualizado", "gdp_yoy"]]
    print(muestra.round(2).to_string())
    print()
    peor = x["gdp_anualizado"].idxmin()
    print(f"peor trimestre anualizado: {peor} con {x.loc[peor, 'gdp_anualizado']:.2f} %")
    print(f"  (la variación trimestral simple fue {x.loc[peor, 'gdp_qoq']:.2f} %,")
    print(f"   así que multiplicar por 4 habría dado {x.loc[peor, 'gdp_qoq'] * 4:.2f} %,")
    print(f"   un error de {abs(x.loc[peor, 'gdp_qoq'] * 4 - x.loc[peor, 'gdp_anualizado']):.2f} puntos)")
    return x


def s4_agrupar(x: pd.DataFrame) -> None:
    """groupby y agg: una tabla por década, con varias funciones a la vez."""
    x = x.copy()
    x["decada"] = (x.index.year // 10) * 10
    tabla = x.groupby("decada").agg(
        trimestres=("realgdp", "size"),
        gdp_medio=("gdp_anualizado", "mean"),
        gdp_peor=("gdp_anualizado", "min"),
        desempleo_medio=("unemp", "mean"),
        desempleo_max=("unemp", "max"),
        inflacion_media=("infl", "mean"),
    )
    print(tabla.round(2).to_string())
    print()
    # transform() devuelve algo del mismo largo que el original, así que sirve
    # para normalizar dentro del grupo sin perder filas. agg() colapsa; esto no.
    x["gdp_z_decada"] = x.groupby("decada")["gdp_anualizado"].transform(
        lambda s: (s - s.mean()) / s.std()
    )
    extremos = x.reindex(x["gdp_z_decada"].abs().sort_values(ascending=False).index[:5])
    print("trimestres más atípicos respecto de su propia década:")
    print(extremos[["gdp_anualizado", "gdp_z_decada", "decada"]].round(2).to_string())


def s5_ventanas(x: pd.DataFrame) -> None:
    """rolling, expanding y ewm: tres maneras distintas de suavizar."""
    v = pd.DataFrame(index=x.index)
    v["desempleo"] = x["unemp"]
    v["movil_4"] = x["unemp"].rolling(4).mean()
    v["movil_4_centrada"] = x["unemp"].rolling(4, center=True).mean()
    v["acumulada"] = x["unemp"].expanding().mean()
    v["exponencial"] = x["unemp"].ewm(span=4, adjust=False).mean()
    print(v.loc["2008Q2":"2009Q3"].round(2).to_string())
    print()
    print("El primer NaN de cada una dice cuánto pasado necesita:")
    print(v.notna().idxmax().to_string())
    print()
    print("La centrada mira al futuro: en producción no se puede usar para")
    print("pronosticar, solo para describir el pasado.")


def s6_pivot(x: pd.DataFrame) -> None:
    """De formato largo a ancho y de vuelta, que es el 80 % del trabajo real."""
    largo = (
        x.loc["2007Q1":"2009Q3", ["unemp", "infl", "tbilrate"]]
        .reset_index()
        .melt(id_vars="trimestre", var_name="serie", value_name="valor")
    )
    print("formato largo (lo que sale de casi cualquier base de datos):")
    print(largo.head(4).to_string(index=False))
    print(f"  {len(largo)} filas")
    print()
    ancho = largo.pivot(index="trimestre", columns="serie", values="valor")
    print("formato ancho (lo que quiere casi cualquier gráfica):")
    print(ancho.head(4).round(2).to_string())
    print()
    # pivot_table agrega; pivot no. Si hay duplicados, pivot falla y
    # pivot_table los promedia en silencio. Saber cuál se está usando importa.
    x2 = x.copy()
    x2["decada"] = (x2.index.year // 10) * 10
    x2["mitad"] = np.where(x2.index.quarter <= 2, "H1", "H2")
    tabla = x2.pivot_table(index="decada", columns="mitad", values="unemp", aggfunc="mean")
    print("pivot_table agrega, y por eso admite duplicados:")
    print(tabla.round(2).to_string())


def s7_unir(x: pd.DataFrame) -> None:
    """merge y join, y el chequeo que evita el error más caro."""
    izq = x.loc["2008Q1":"2008Q4", ["realgdp", "unemp"]].reset_index()
    der = pd.DataFrame({
        "trimestre": pd.period_range("2008Q3", "2009Q2", freq="Q"),
        "evento": ["Lehman", "TARP", "estímulo", "recuperación"],
    })
    print("izquierda:", len(izq), "filas | derecha:", len(der), "filas")
    print()
    for como in ("inner", "left", "outer"):
        r = izq.merge(der, on="trimestre", how=como)
        print(f"how={como:6s} → {len(r)} filas, {int(r['evento'].isna().sum())} eventos nulos")
    print()
    # validate= es el argumento que más errores evita y que casi nadie usa.
    # Si la relación no es la declarada, falla en vez de duplicar filas en
    # silencio, que es como un merge mal hecho infla un total sin avisar.
    try:
        izq.merge(der, on="trimestre", how="left", validate="one_to_one")
        print("validate='one_to_one' pasó: la relación es la esperada")
    except Exception as e:
        print(f"validate atrapó el problema: {type(e).__name__}")
    print()
    dup = pd.concat([der, der.iloc[[0]]], ignore_index=True)
    try:
        izq.merge(dup, on="trimestre", how="left", validate="one_to_one")
        print("con duplicados: pasó sin avisar (no debería llegar acá)")
    except Exception as e:
        print(f"con un duplicado en la derecha, validate falla: {type(e).__name__}")
        print(f"  sin validate el merge habría devuelto {len(izq.merge(dup, on='trimestre', how='left'))}")
        print(f"  filas en vez de {len(izq)}, inflando cualquier suma posterior")


def s8_faltantes(x: pd.DataFrame) -> None:
    """Nulos: las cuatro estrategias y cuándo cada una miente."""
    s = x["unemp"].loc["2007Q1":"2008Q4"].copy()
    s.iloc[3:5] = np.nan
    tabla = pd.DataFrame({
        "original": s,
        "ffill": s.ffill(),
        "interpolar": s.interpolate(),
        "temporal": s.interpolate(method="time") if isinstance(s.index, pd.DatetimeIndex) else s.interpolate(),
        "media": s.fillna(s.mean()),
    })
    print(tabla.round(2).to_string())
    print()
    print("ffill arrastra el último valor: correcto para un stock, falso para un flujo.")
    print("interpolate() supone linealidad entre extremos conocidos.")
    print("fillna(media) destruye la varianza y sesga cualquier desviación estándar")
    print("que se calcule después. Es la más usada y la más peligrosa.")


SECCIONES = [
    ("Inspección", s1_inspeccion),
    ("Selección", s2_seleccion),
    ("Columnas derivadas", s3_derivadas),
    ("Agrupar", s4_agrupar),
    ("Ventanas", s5_ventanas),
    ("Pivotear", s6_pivot),
    ("Unir tablas", s7_unir),
    ("Faltantes", s8_faltantes),
]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--seccion", type=int, help="corre solo esa sección (1 a 8)")
    args = ap.parse_args()

    d = cargar()
    # s3 produce las columnas que usan s4 a s8, así que se calculan siempre,
    # incluso cuando se pide una sola sección con --seccion.
    x = d.copy()
    x["gdp_qoq"] = x["realgdp"].pct_change() * 100
    x["gdp_anualizado"] = ((1 + x["realgdp"].pct_change()) ** 4 - 1) * 100
    x["gdp_yoy"] = x["realgdp"].pct_change(periods=4) * 100
    x["unemp_delta"] = x["unemp"].diff()

    for i, (nombre, fn) in enumerate(SECCIONES, start=1):
        if args.seccion and args.seccion != i:
            continue
        print(f"\n{'=' * 78}\n{i}. {nombre.upper()}\n{'=' * 78}")
        fn(d if i <= 3 else x)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
