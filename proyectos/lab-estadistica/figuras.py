"""Genera las animaciones del artículo y exporta los datos de las figuras SVG.

    python figuras.py

Produce tres cosas:

    datos-figuras.json   lo que lee scripts/figures/estadistica.mjs
    est-tlc.gif          el teorema central del límite, animado
    est-cobertura.gif    qué significa "intervalo de confianza del 95 %"

Las dos animaciones existen porque son los dos conceptos del artículo donde el
movimiento enseña algo que una figura estática no puede. En el resto de los
casos una figura quieta es mejor: se puede mirar todo el tiempo que haga falta.

El TLC animado muestra cómo la distribución de la MEDIA MUESTRAL se vuelve
simétrica al crecer n, aunque la población de partida no lo sea. La cobertura
muestra el experimento que define un intervalo de confianza: repetir el muestreo
muchas veces y contar cuántos intervalos atrapan la media verdadera.

Backend Agg: sin ventana, escribe archivos.
"""

from __future__ import annotations

import json
import pathlib

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation, PillowWriter
from scipy import stats

from lab import cargar

AQUI = pathlib.Path(__file__).parent
SALIDA_FIG = AQUI.parent.parent / "assets" / "figures"
RNG = np.random.default_rng(20260812)

INK, INK_DIM, INK_FAINT = "#14161a", "#565a63", "#6e737e"
LINE, LINE_2 = "#d7dae0", "#b4b9c2"
AMBER, TEAL, PAPER, WASH = "#8a5200", "#0e7490", "#ffffff", "#f6f7f9"


def _limpio(ax):
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines[["left", "bottom"]].set_color(LINE_2)
    ax.tick_params(colors=INK_FAINT, labelsize=9)


# ---------------------------------------------------------------------------


def datos_figuras(d) -> None:
    """Exporta a JSON lo que las figuras SVG necesitan."""
    puntos = [{"unemp": round(float(u), 2), "infl": round(float(i), 2)}
              for u, i in zip(d["unemp"], d["infl"])]
    r, p = stats.pearsonr(d["unemp"], d["infl"])

    decadas = []
    for dec, g in d.groupby("decada"):
        if len(g) < 10:
            continue
        rr, pp = stats.pearsonr(g["unemp"], g["infl"])
        decadas.append({
            "decada": int(dec), "n": len(g),
            "r": round(float(rr), 4), "p": round(float(pp), 6),
            "puntos": [{"unemp": round(float(u), 2), "infl": round(float(i), 2)}
                       for u, i in zip(g["unemp"], g["infl"])],
        })

    a = d.loc[d["decada"] == 1980, "unemp"].to_numpy()
    b = d.loc[d["decada"] == 1990, "unemp"].to_numpy()
    dof = len(a) + len(b) - 2
    s_pool = np.sqrt(((len(a) - 1) * a.var(ddof=1) + (len(b) - 1) * b.var(ddof=1)) / dof)
    t, pv = stats.ttest_ind(a, b, equal_var=False)

    n_pruebas = 10
    payload = {
        "phillips": {
            "global": {"r": round(float(r), 4), "p": round(float(p), 4), "n": len(d)},
            "decadas": decadas,
            "puntos": puntos,
        },
        "efecto": {
            "cohen": round(float((a.mean() - b.mean()) / s_pool), 3),
            "p": float(pv),
            "media_a": round(float(a.mean()), 3),
            "media_b": round(float(b.mean()), 3),
            "sd": round(float(s_pool), 3),
        },
        "multiples": {
            "n_pruebas": n_pruebas,
            "prob_falso": round(1 - 0.95 ** n_pruebas, 4),
        },
    }
    (AQUI / "datos-figuras.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print("datos-figuras.json escrito")


def gif_tlc(d) -> None:
    """El teorema central del límite, animado.

    Cada cuadro toma 4000 muestras de tamaño n de la MISMA población asimétrica
    y dibuja el histograma de sus medias. Al crecer n, la nube se vuelve
    simétrica y se angosta: las dos cosas que el teorema promete.

    Se anima n y no el número de repeticiones a propósito. Animar repeticiones
    mostraría el histograma llenándose, que es otra cosa y se confunde con esta.
    """
    poblacion = d["infl"].to_numpy()
    tamanos = [1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 40, 60, 80, 100]
    sk0 = abs(stats.skew(poblacion))

    fig, (ax0, ax1) = plt.subplots(1, 2, figsize=(9.6, 3.9), facecolor=PAPER)
    fig.subplots_adjust(left=0.07, right=0.97, top=0.80, bottom=0.16, wspace=0.26)

    ax0.hist(poblacion, bins=32, color=INK_FAINT, alpha=0.75)
    ax0.set_title("La población: inflación trimestral\n"
                  f"asimetría {stats.skew(poblacion):+.2f}, cola derecha larga",
                  fontsize=10, color=INK, loc="left")
    ax0.set_xlabel("inflación (%)", fontsize=9, color=INK_FAINT)
    _limpio(ax0)

    def cuadro(k):
        n = tamanos[k]
        medias = RNG.choice(poblacion, size=(4000, n), replace=True).mean(axis=1)
        ax1.clear()
        ax1.hist(medias, bins=44, range=(-2, 11), color=TEAL, alpha=0.8)
        sk = stats.skew(medias)
        ax1.set_title(f"Distribución de la media de n = {n}\n"
                      f"asimetría {sk:+.3f}  ({abs(sk)/sk0:.0%} de la inicial)",
                      fontsize=10, color=INK, loc="left")
        ax1.set_xlabel("media muestral (%)", fontsize=9, color=INK_FAINT)
        ax1.set_xlim(-2, 11)
        ax1.axvline(poblacion.mean(), color=AMBER, lw=1.6, ls="--")
        ax1.text(poblacion.mean() + 0.25, ax1.get_ylim()[1] * 0.9,
                 "media real", fontsize=8.5, color=AMBER)
        _limpio(ax1)
        return ()

    anim = FuncAnimation(fig, cuadro, frames=len(tamanos), blit=False)
    ruta = SALIDA_FIG / "est-tlc.gif"
    anim.save(ruta, writer=PillowWriter(fps=1.6))
    plt.close(fig)
    print(f"est-tlc.gif  {ruta.stat().st_size/1024:.0f} KiB")


def gif_cobertura(d) -> None:
    """Qué significa, exactamente, "intervalo de confianza del 95 %".

    Se toma la población, se conoce su media verdadera, y se repite: sacar una
    muestra, construir su intervalo, ver si atrapa la media. Los que fallan se
    pintan en ámbar. Al final, la proporción de aciertos ronda el 95 %.

    Es el experimento que DEFINE el intervalo, y verlo correr es la única forma
    en que la definición frecuentista deja de sonar a trampa verbal.
    """
    poblacion = d["unemp"].to_numpy()
    mu = poblacion.mean()
    n, total = 20, 60

    muestras = [RNG.choice(poblacion, size=n, replace=True) for _ in range(total)]
    ics = []
    for s in muestras:
        lo, hi = stats.t.interval(0.95, n - 1, loc=s.mean(), scale=stats.sem(s))
        ics.append((lo, hi, s.mean(), lo <= mu <= hi))

    fig, ax = plt.subplots(figsize=(9.6, 4.4), facecolor=PAPER)
    fig.subplots_adjust(left=0.09, right=0.97, top=0.84, bottom=0.12)

    def cuadro(k):
        ax.clear()
        ax.axvline(mu, color=INK, lw=1.8)
        ax.text(mu + 0.03, total + 1.5, f"media verdadera = {mu:.2f} %",
                fontsize=9, color=INK)
        aciertos = 0
        for i, (lo, hi, m, ok) in enumerate(ics[:k + 1]):
            col = TEAL if ok else AMBER
            ax.plot([lo, hi], [i, i], color=col, lw=1.6, solid_capstyle="butt")
            ax.plot([m], [i], marker="o", ms=2.6, color=col)
            aciertos += ok
        ax.set_xlim(4.6, 7.2)
        ax.set_ylim(-2, total + 4)
        ax.set_yticks([])
        ax.set_xlabel("desempleo medio (%)", fontsize=9, color=INK_FAINT)
        pct = aciertos / (k + 1) * 100
        ax.set_title(
            f"Cada línea es una muestra de n = {n} y su intervalo del 95 %\n"
            f"{k+1} muestras: {aciertos} atrapan la media verdadera ({pct:.0f} %),"
            f" {k+1-aciertos} no",
            fontsize=10, color=INK, loc="left")
        _limpio(ax)
        return ()

    anim = FuncAnimation(fig, cuadro, frames=total, blit=False)
    ruta = SALIDA_FIG / "est-cobertura.gif"
    anim.save(ruta, writer=PillowWriter(fps=7))
    plt.close(fig)
    cobertura = sum(x[3] for x in ics) / total * 100
    print(f"est-cobertura.gif  {ruta.stat().st_size/1024:.0f} KiB  "
          f"cobertura observada en la animación: {cobertura:.1f} % sobre {total} muestras")

    # Sesenta muestras NO alcanzan para estimar una cobertura del 95 %: el error
    # estándar de esa proporción es ~2.8 puntos, así que el número de la
    # animación puede caer lejos del nominal sin que nada esté mal. Se calcula
    # la cobertura de verdad con 20 000 repeticiones para poder decirlo con
    # respaldo, y de paso el ejercicio ilustra la aritmética de la raíz de n de
    # la sección 4.
    conv = []
    for reps in (60, 200, 1000, 5000, 20000):
        m = RNG.choice(poblacion, size=(reps, n), replace=True)
        med, ee = m.mean(axis=1), m.std(axis=1, ddof=1) / np.sqrt(n)
        ok = float((np.abs(med - mu) <= stats.t.ppf(0.975, n - 1) * ee).mean())
        se = float(np.sqrt(ok * (1 - ok) / reps))
        conv.append({"repeticiones": reps, "cobertura": round(ok * 100, 1),
                     "margen": round(1.96 * se * 100, 1)})
    print("  cobertura estimada según cuántas veces se repita el experimento:")
    for c in conv:
        print(f"    {c['repeticiones']:>6d} repeticiones → "
              f"{c['cobertura']:.1f} % ± {c['margen']:.1f}")
    return cobertura, conv


def main() -> int:
    SALIDA_FIG.mkdir(parents=True, exist_ok=True)
    d = cargar()
    datos_figuras(d)
    gif_tlc(d)
    cob, conv = gif_cobertura(d)
    # Se guardan las dos cifras para que el artículo las cite sin copiarlas a
    # mano: la de la animación y la convergencia que demuestra que 60
    # repeticiones no alcanzaban para estimarla.
    p = AQUI / "datos-figuras.json"
    payload = json.loads(p.read_text(encoding="utf-8"))
    payload["cobertura"] = {"en_la_animacion": round(float(cob), 1),
                            "convergencia": conv}
    p.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
