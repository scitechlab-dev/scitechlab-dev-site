"""Validación con origen móvil, y métricas desagregadas por horizonte.

    python backtest.py                  corre y reporta por consola
    python backtest.py --json out.json  además escribe el resultado

Por qué origen móvil y no una partición aleatoria: en una serie de tiempo,
partir al azar deja días futuros dentro del entrenamiento y días pasados dentro
de la prueba. El modelo aprende del futuro y la métrica sale espectacular. La
única evaluación que reproduce la situación real es avanzar el origen: entrenar
con todo lo anterior al origen, pronosticar los siete días siguientes, mover el
origen una semana y repetir.

Por qué desagregar por horizonte: un MAE promedio sobre siete días mezcla el
día uno, que es fácil, con el día siete, que no lo es. La programación semanal
necesita saber cuánto se degrada, no un número que promedie las dos cosas.

Las exógenas del futuro se toman como conocidas. En operación no lo son: vienen
de un pronóstico meteorológico que tiene su propio error, y ese error se suma al
del modelo. Está dicho acá porque un backtest que asume clima perfecto reporta
un error optimista, y quien lea el número tiene derecho a saberlo.
"""

from __future__ import annotations

import argparse
import json
import time
from dataclasses import dataclass, asdict

import numpy as np
import pandas as pd

from modelos import GradientBoosting, HORIZONTE, LineaBaseEstacional, Sarimax
from serie import construir

ORIGENES = 26              # 26 semanas de prueba, medio año
MIN_ENTRENAMIENTO = 730    # dos años antes del primer origen


@dataclass
class Fila:
    modelo: str
    origen: str
    horizonte: int
    real: float
    pred: float
    p10: float | None = None
    p90: float | None = None


def _mape(real, pred):
    return float(np.mean(np.abs((real - pred) / real)) * 100)


def _pinball(real, pred, q):
    d = real - pred
    return float(np.mean(np.maximum(q * d, (q - 1) * d)))


def correr() -> tuple[pd.DataFrame, dict]:
    df = construir()
    n = len(df)
    ultimo_origen = n - HORIZONTE
    origenes = [ultimo_origen - k * HORIZONTE for k in range(ORIGENES)][::-1]
    if origenes[0] < MIN_ENTRENAMIENTO:
        raise SystemExit("serie demasiado corta para el número de orígenes pedido")

    filas: list[Fila] = []
    tiempos: dict[str, float] = {}

    for Modelo in (LineaBaseEstacional, Sarimax, GradientBoosting):
        t0 = time.perf_counter()
        for o in origenes:
            historia = df.iloc[:o]
            futuro = df.iloc[o: o + HORIZONTE]
            m = Modelo().ajustar(historia)
            pred = m.predecir(futuro)
            lo = hi = [None] * HORIZONTE
            if isinstance(m, GradientBoosting):
                lo, hi = m.predecir_intervalo(futuro)
            for h in range(HORIZONTE):
                filas.append(Fila(
                    modelo=Modelo.nombre, origen=str(df.index[o].date()), horizonte=h + 1,
                    real=float(futuro["energia"].iloc[h]), pred=float(pred[h]),
                    p10=None if lo[h] is None else float(lo[h]),
                    p90=None if hi[h] is None else float(hi[h]),
                ))
        tiempos[Modelo.nombre] = round(time.perf_counter() - t0, 1)

    res = pd.DataFrame([asdict(f) for f in filas])
    res["error"] = res["real"] - res["pred"]

    meta = {
        "serie": "sintética, energía diaria en MWh",
        "observaciones": n,
        "primer_dia": str(df.index[0].date()),
        "ultimo_dia": str(df.index[-1].date()),
        "origenes": len(origenes),
        "horizonte": HORIZONTE,
        "pronosticos_evaluados": len(res) // 3,
        "primer_origen": str(df.index[origenes[0]].date()),
        "ultimo_origen": str(df.index[origenes[-1]].date()),
        "segundos_por_modelo": tiempos,
    }
    return res, meta


def resumen(res: pd.DataFrame) -> pd.DataFrame:
    g = res.groupby("modelo")
    out = pd.DataFrame({
        "MAE": g["error"].apply(lambda e: float(np.mean(np.abs(e)))),
        "RMSE": g["error"].apply(lambda e: float(np.sqrt(np.mean(e ** 2)))),
        "MAPE": g.apply(lambda d: _mape(d["real"].to_numpy(), d["pred"].to_numpy()), include_groups=False),
        "sesgo": g["error"].mean(),
    })
    base = out.loc["Línea base estacional", "MAE"]
    out["mejora vs base"] = (1 - out["MAE"] / base) * 100
    return out.round(2)


def por_horizonte(res: pd.DataFrame) -> pd.DataFrame:
    t = res.pivot_table(index="horizonte", columns="modelo",
                        values="error", aggfunc=lambda e: float(np.mean(np.abs(e))))
    return t.round(1)


def intervalos(res: pd.DataFrame) -> dict:
    gb = res[res["modelo"] == "Gradient boosting"].dropna(subset=["p10", "p90"])
    dentro = ((gb["real"] >= gb["p10"]) & (gb["real"] <= gb["p90"])).mean()
    return {
        "cobertura_p10_p90": round(float(dentro) * 100, 1),
        "cobertura_nominal": 80.0,
        "pinball_p10": round(_pinball(gb["real"].to_numpy(), gb["p10"].to_numpy(), 0.10), 1),
        "pinball_p90": round(_pinball(gb["real"].to_numpy(), gb["p90"].to_numpy(), 0.90), 1),
        "ancho_medio": round(float((gb["p90"] - gb["p10"]).mean()), 1),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--json", metavar="RUTA")
    args = ap.parse_args()

    res, meta = correr()
    tabla = resumen(res)
    horiz = por_horizonte(res)
    inter = intervalos(res)

    print("BACKTESTING CON ORIGEN MÓVIL")
    print("=" * 78)
    print(f"serie                 {meta['serie']}")
    print(f"observaciones         {meta['observaciones']}  ({meta['primer_dia']} a {meta['ultimo_dia']})")
    print(f"orígenes              {meta['origenes']}, uno por semana, de {meta['primer_origen']} a {meta['ultimo_origen']}")
    print(f"horizonte             {meta['horizonte']} días")
    print(f"pronósticos por modelo {meta['pronosticos_evaluados']}")
    print(f"segundos por modelo   {meta['segundos_por_modelo']}")
    print()
    print("── MÉTRICAS GLOBALES (MWh/día, salvo MAPE en %)")
    print("─" * 78)
    print(tabla.to_string())
    print()
    print("── MAE POR HORIZONTE (MWh/día)")
    print("─" * 78)
    print(horiz.to_string())
    print()
    print("── INTERVALOS DEL BOOSTING")
    print("─" * 78)
    for k, v in inter.items():
        print(f"{k:24s} {v}")

    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump({
                "meta": meta,
                "global": tabla.reset_index().to_dict(orient="records"),
                "por_horizonte": horiz.reset_index().to_dict(orient="records"),
                "intervalos": inter,
            }, fh, ensure_ascii=False, indent=2)
        print(f"\nJSON escrito en {args.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
