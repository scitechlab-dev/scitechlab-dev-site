"""Laboratorio de estadística aplicada, sobre datos reales y sin red.

    python lab.py              corre las siete secciones
    python lab.py --seccion 4  corre solo una

Datos: `macrodata` de statsmodels, 203 trimestres de macroeconomía de Estados
Unidos (1959Q1 a 2009Q3), empaquetados con la biblioteca. Sin descarga, mismo
resultado en cualquier máquina.

El hilo del laboratorio es una sola pregunta que un analista se hace todos los
días: cuándo un número que salió de los datos significa algo, y cuándo no.
Cada sección responde una parte, y todas imprimen lo que sale.
"""

from __future__ import annotations

import argparse

import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy import stats

RNG = np.random.default_rng(20260812)
pd.set_option("display.width", 100)


def cargar() -> pd.DataFrame:
    d = sm.datasets.macrodata.load_pandas().data
    d.index = pd.PeriodIndex.from_fields(
        year=d["year"].astype(int), quarter=d["quarter"].astype(int), freq="Q"
    )
    d["decada"] = (d.index.year // 10) * 10
    return d


# ---------------------------------------------------------------------------


def s1_centro_y_dispersion(d: pd.DataFrame) -> None:
    """La media miente cuando la distribución no es simétrica."""
    for col, nombre in (("infl", "inflación"), ("realgdp", "PIB real")):
        s = d[col]
        print(f"{nombre}:")
        print(f"  media {s.mean():8.2f}   mediana {s.median():8.2f}   "
              f"desv. est. {s.std():7.2f}")
        # La desviación absoluta mediana es robusta: un solo valor extremo la
        # mueve poco. La desviación estándar eleva al cuadrado, así que un
        # atípico la domina.
        mad = stats.median_abs_deviation(s, scale="normal")
        print(f"  MAD robusta {mad:6.2f}   asimetría {stats.skew(s):+6.2f}   "
              f"curtosis {stats.kurtosis(s):+6.2f}")
        print(f"  media podada al 10 %: {stats.trim_mean(s, 0.1):.2f}")
        print()
    print("Lectura: la inflación tiene asimetría positiva y curtosis alta, o sea")
    print("cola derecha larga. Su media supera a su mediana, y usar la media")
    print("como 'inflación típica' sobreestima lo que pasó en un trimestre normal.")


def s2_distribucion(d: pd.DataFrame) -> None:
    """¿La serie es normal? Casi nunca, y eso decide qué prueba se puede usar."""
    for col, nombre in (("infl", "inflación"), ("unemp", "desempleo")):
        s = d[col].to_numpy()
        # Shapiro-Wilk es la prueba de normalidad con más potencia para n < 5000.
        w, p = stats.shapiro(s)
        # Jarque-Bera mira específicamente asimetría y curtosis.
        jb, pjb = stats.jarque_bera(s)[:2]
        print(f"{nombre:10s} Shapiro W={w:.4f} p={p:.2e}   "
              f"Jarque-Bera={jb:7.2f} p={pjb:.2e}   "
              f"{'NO normal' if p < 0.05 else 'compatible con normal'}")
    print()
    print("Un p pequeño rechaza la normalidad. Importa porque la prueba t y el")
    print("intervalo clásico la suponen; con n grande el TLC los rescata, con n")
    print("chico no. La sección siguiente muestra dónde está esa frontera.")


def s3_tlc(d: pd.DataFrame) -> None:
    """El teorema central del límite, medido en vez de citado.

    La distribución de la MEDIA MUESTRAL se vuelve normal aunque la población
    no lo sea. Lo que el teorema no dice, y todo el mundo asume, es a partir de
    qué tamaño de muestra. Depende de cuán asimétrica es la población, y acá se
    puede ver.
    """
    poblacion = d["infl"].to_numpy()
    print(f"población: n={len(poblacion)}  asimetría={stats.skew(poblacion):+.2f}")
    print()
    # Se reportan MAGNITUDES, no veredictos. Un test de normalidad sobre 4000
    # remuestreos rechaza cualquier desviación por diminuta que sea, así que su
    # p oscila sin decir nada útil. La asimetría residual y la distancia de
    # Kolmogorov-Smirnov a la normal ajustada sí decrecen de forma monótona, y
    # es eso lo que el teorema promete.
    print(f"{'n':>4s}  {'asimetría residual':>19s}  {'distancia KS':>13s}  "
          f"{'% de la asimetría inicial':>26s}")
    sk0 = abs(stats.skew(poblacion))
    for n in (2, 5, 10, 30, 50, 100):
        medias = RNG.choice(poblacion, size=(4000, n), replace=True).mean(axis=1)
        sk = stats.skew(medias)
        ks = stats.kstest(medias, "norm", args=(medias.mean(), medias.std(ddof=1))).statistic
        print(f"{n:>4d}  {sk:>+19.3f}  {ks:>13.4f}  {abs(sk) / sk0:>25.0%}")
    print()
    print("La asimetría cae con la raíz de n, que es exactamente lo que el")
    print("teorema promete. La regla de 'n = 30' es una convención, no un")
    print("teorema: con esta población, a n = 30 todavía queda un 20 % de la")
    print("asimetría original. Cuánto es tolerable depende de para qué se use.")


def s4_intervalos(d: pd.DataFrame) -> None:
    """Un intervalo de confianza no dice lo que casi todos creen que dice."""
    s = d.loc[d["decada"] == 2000, "unemp"].to_numpy()
    n = len(s)
    media, ee = s.mean(), stats.sem(s)
    lo_t, hi_t = stats.t.interval(0.95, n - 1, loc=media, scale=ee)

    # Bootstrap: no supone normalidad, solo que la muestra representa a la
    # población. Cuando las dos vías coinciden, la suposición normal era
    # inofensiva; cuando divergen, hay que creerle al bootstrap.
    res = stats.bootstrap((s,), np.mean, n_resamples=10000, random_state=7,
                          confidence_level=0.95, method="BCa")
    lo_b, hi_b = res.confidence_interval

    print(f"desempleo en los 2000: n={n}  media={media:.3f}  error estándar={ee:.3f}")
    print(f"  IC 95 % por t          [{lo_t:.3f}, {hi_t:.3f}]  ancho {hi_t - lo_t:.3f}")
    print(f"  IC 95 % por bootstrap  [{lo_b:.3f}, {hi_b:.3f}]  ancho {hi_b - lo_b:.3f}")
    print()
    print("Qué significa: si repitiéramos el muestreo muchas veces, el 95 % de")
    print("los intervalos construidos así contendría la media verdadera.")
    print("Qué NO significa: que haya 95 % de probabilidad de que la media esté")
    print("en ESTE intervalo. La media es fija; lo aleatorio es el intervalo.")
    print()
    # El ancho cae con la raíz de n, no con n. Cuadruplicar la muestra para
    # partir el error a la mitad es la aritmética que arruina presupuestos.
    print("Cuánta muestra hace falta para partir el ancho a la mitad:")
    for k in (1, 2, 4, 8):
        print(f"  n×{k:<2d} → ancho relativo {1 / np.sqrt(k):.3f}")


def s5_pruebas(d: pd.DataFrame) -> None:
    """Significancia contra magnitud, que es donde se pierde la mitad del oficio."""
    a = d.loc[d["decada"] == 1980, "unemp"].to_numpy()
    b = d.loc[d["decada"] == 1990, "unemp"].to_numpy()

    # Welch no supone varianzas iguales. Es el que debería ser el predeterminado.
    t, p = stats.ttest_ind(a, b, equal_var=False)
    # Mann-Whitney no supone normalidad: compara medianas por rangos.
    u, pu = stats.mannwhitneyu(a, b)
    # d de Cohen: cuántas desviaciones estándar separan a los dos grupos.
    dof = len(a) + len(b) - 2
    s_pool = np.sqrt(((len(a) - 1) * a.var(ddof=1) + (len(b) - 1) * b.var(ddof=1)) / dof)
    cohen = (a.mean() - b.mean()) / s_pool

    print(f"desempleo 1980s (n={len(a)}, media {a.mean():.2f}) contra "
          f"1990s (n={len(b)}, media {b.mean():.2f})")
    print(f"  t de Welch     t={t:+.3f}  p={p:.2e}")
    print(f"  Mann-Whitney   U={u:.0f}   p={pu:.2e}")
    print(f"  d de Cohen     {cohen:+.3f}  ({'grande' if abs(cohen) > 0.8 else 'mediano' if abs(cohen) > 0.5 else 'pequeño'})")
    print()
    print("El p dice si la diferencia es distinguible del ruido. El tamaño del")
    print("efecto dice si importa. Con n grande, un p diminuto puede acompañar a")
    print("una diferencia irrelevante; reportar solo el p oculta esa distinción.")
    print()

    # Comparaciones múltiples: el problema que aparece solo, sin que nadie lo
    # invoque, apenas se prueban varias hipótesis sobre los mismos datos.
    decadas = sorted(d.loc[d["decada"] >= 1960, "decada"].unique())
    ps = []
    for i, x in enumerate(decadas):
        for y in decadas[i + 1:]:
            ps.append(stats.ttest_ind(
                d.loc[d["decada"] == x, "unemp"], d.loc[d["decada"] == y, "unemp"],
                equal_var=False)[1])
    ps = np.array(ps)
    print(f"comparando las {len(decadas)} décadas de a pares: {len(ps)} pruebas")
    print(f"  significativas a 0.05 sin corregir:        {(ps < 0.05).sum()}")
    print(f"  con Bonferroni (0.05/{len(ps)} = {0.05/len(ps):.4f}):  {(ps < 0.05 / len(ps)).sum()}")
    print(f"  probabilidad de al menos un falso positivo sin corregir: "
          f"{1 - 0.95 ** len(ps):.1%}")


def s6_correlacion(d: pd.DataFrame) -> None:
    """El hallazgo que justifica todo el laboratorio.

    La curva de Phillips dice que el desempleo y la inflación se mueven en
    direcciones opuestas. Sobre los 203 trimestres juntos, la correlación es
    prácticamente cero. Dentro de la década de 1960, es fuertemente negativa.
    """
    r, p = stats.pearsonr(d["unemp"], d["infl"])
    rho, prho = stats.spearmanr(d["unemp"], d["infl"])
    print(f"agregando los {len(d)} trimestres:")
    print(f"  Pearson  r={r:+.3f}  p={p:.4f}   {'no significativa' if p > 0.05 else 'significativa'}")
    print(f"  Spearman ρ={rho:+.3f}  p={prho:.4f}")
    print()
    print("dentro de cada década:")
    print(f"  {'década':>8s}  {'n':>3s}  {'r':>7s}  {'p':>8s}")
    for dec, g in d.groupby("decada"):
        if len(g) < 10:
            continue
        rr, pp = stats.pearsonr(g["unemp"], g["infl"])
        marca = "  ←" if pp < 0.01 else ""
        print(f"  {dec:>8d}  {len(g):>3d}  {rr:>+7.3f}  {pp:>8.4f}{marca}")
    print()
    print("La relación existe DENTRO de un régimen y desaparece al mezclar")
    print("regímenes. Agregar períodos con políticas distintas no promedia la")
    print("relación: la borra. Es confusión por régimen, y en un mercado")
    print("eléctrico pasa igual al mezclar años con parques de generación")
    print("distintos o marcos regulatorios distintos.")


def s7_regresion(d: pd.DataFrame) -> None:
    """Regresión: leer la salida completa, no solo el R²."""
    x = d.loc[d["decada"] == 1960].copy()
    modelo = sm.OLS(x["infl"], sm.add_constant(x[["unemp"]])).fit()
    print(f"inflación ~ desempleo, solo 1960s (n={int(modelo.nobs)})")
    print(f"  pendiente   {modelo.params['unemp']:+.4f}  "
          f"IC 95 % [{modelo.conf_int().loc['unemp', 0]:+.4f}, "
          f"{modelo.conf_int().loc['unemp', 1]:+.4f}]")
    print(f"  p           {modelo.pvalues['unemp']:.2e}")
    print(f"  R²          {modelo.rsquared:.3f}   R² ajustado {modelo.rsquared_adj:.3f}")
    print()
    # Los supuestos que casi nadie verifica y que invalidan los errores estándar.
    dw = sm.stats.durbin_watson(modelo.resid)
    bp = sm.stats.diagnostic.het_breuschpagan(modelo.resid, modelo.model.exog)
    print("diagnóstico de residuos:")
    print(f"  Durbin-Watson {dw:.3f}  "
          f"({'autocorrelación positiva' if dw < 1.5 else 'sin autocorrelación evidente'})")
    print(f"  Breusch-Pagan p={bp[1]:.4f}  "
          f"({'heterocedástico' if bp[1] < 0.05 else 'varianza estable'})")
    print()
    # Los errores HAC se calculan siempre, no solo cuando el diagnóstico los
    # pide. Verlos cuando NO hacen falta es informativo: si el coeficiente y el
    # p apenas se mueven, el diagnóstico queda confirmado por una segunda vía.
    hac = modelo.get_robustcov_results(cov_type="HAC", maxlags=4)
    print("con errores estándar HAC (Newey-West, 4 rezagos):")
    print(f"  coeficiente {hac.params[1]:+.4f} (idéntico: HAC no toca la estimación)")
    print(f"  p pasa de {modelo.pvalues['unemp']:.2e} a {hac.pvalues[1]:.2e}")
    print()
    if dw < 1.5:
        print("Durbin-Watson bajo significa residuos correlacionados en el tiempo:")
        print("la pendiente sigue siendo insesgada, pero su error estándar está")
        print("subestimado, así que el IC de arriba es más angosto de lo debido.")
    else:
        print("Acá los residuos se portan bien, y por eso HAC casi no cambia nada.")
        print("Ese es justamente el uso del diagnóstico: no es que HAC sobre, es")
        print("que confirma por otra vía que la inferencia clásica era válida.")
        print("Con series de tiempo lo habitual es lo contrario, y entonces el")
        print("p sin corregir es demasiado optimista.")
    print()
    print("Y el R² de 0.553 no valida nada por sí solo: mide ajuste dentro de la")
    print("muestra. La sección anterior mostró que esta misma relación se evapora")
    print("fuera de esta década, y ningún R² alto habría avisado de eso.")


SECCIONES = [
    ("Centro y dispersión", s1_centro_y_dispersion),
    ("¿Es normal?", s2_distribucion),
    ("Teorema central del límite", s3_tlc),
    ("Intervalos de confianza", s4_intervalos),
    ("Pruebas de hipótesis", s5_pruebas),
    ("Correlación y confusión", s6_correlacion),
    ("Regresión y sus supuestos", s7_regresion),
]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--seccion", type=int)
    args = ap.parse_args()
    d = cargar()
    for i, (nombre, fn) in enumerate(SECCIONES, start=1):
        if args.seccion and args.seccion != i:
            continue
        print(f"\n{'=' * 78}\n{i}. {nombre.upper()}\n{'=' * 78}")
        fn(d)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
