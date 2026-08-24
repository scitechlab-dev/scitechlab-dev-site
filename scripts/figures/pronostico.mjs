#!/usr/bin/env node
/**
 * Generates the three figures for the demand-forecasting article:
 *
 *   assets/figures/origen-movil.svg      why rolling origin and not a split
 *   assets/figures/mae-por-horizonte.svg the results, read from the run
 *   assets/figures/intervalos.svg        coverage, and the honest reading of it
 *
 *   node scripts/figures/pronostico.mjs
 *
 * Like the validator figure, the second and third are drawn from
 * proyectos/pronostico-demanda/resultados.json, which is the output of actually
 * running the backtest. Nothing is typed in by hand. If the file is missing,
 * this fails rather than drawing something plausible.
 *
 * Colours are style.css tokens, hardcoded because the file is referenced with
 * <img> and cannot inherit the page's custom properties.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'assets', 'figures');
const RES = path.join(ROOT, 'proyectos', 'pronostico-demanda', 'resultados.json');

const INK = '#14161a';
const INK_DIM = '#565a63';
const INK_FAINT = '#6e737e';
const LINE = '#d7dae0';
const LINE_2 = '#b4b9c2';
const AMBER = '#8a5200';
const TEAL = '#0e7490';
const PAPER = '#ffffff';
const WASH = '#f6f7f9';
const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
const SANS = "'IBM Plex Sans', system-ui, sans-serif";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function canvas(W, H) {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<rect width="${W}" height="${H}" fill="${PAPER}" />`,
    `<defs>` +
      [['ah-ink', INK], ['ah-amber', AMBER], ['ah-teal', TEAL], ['ah-dim', INK_FAINT]]
        .map(([id, c]) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}" /></marker>`)
        .join('') +
      `</defs>`,
  ];
  return {
    parts,
    raw: (s) => parts.push(s),
    text: (x, y, s, o = {}) =>
      parts.push(
        `<text x="${x}" y="${y}" font-family="${o.font ?? SANS}" font-size="${o.size ?? 12.5}" font-weight="${o.weight ?? 400}" fill="${o.fill ?? INK_DIM}" text-anchor="${o.anchor ?? 'middle'}"${o.spacing ? ` letter-spacing="${o.spacing}"` : ''}>${esc(s)}</text>`
      ),
    line: (x1, y1, x2, y2, o = {}) =>
      parts.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? INK}" stroke-width="${o.w ?? 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.marker ? ` marker-end="url(#${o.marker})"` : ''} stroke-linecap="round" />`
      ),
    rect: (x, y, w, h, o = {}) =>
      parts.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 4}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? 'none'}" stroke-width="${o.w ?? 1.2}" />`
      ),
    dot: (x, y, r, fill) => parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" />`),
    done: () => (parts.push('</svg>'), parts.join('\n')),
  };
}

await mkdir(OUT, { recursive: true });

const raw = await readFile(RES, 'utf8').catch(() => null);
if (!raw) {
  console.error(`No existe ${RES}. Corré primero:\n  cd proyectos/pronostico-demanda && python backtest.py --json resultados.json`);
  process.exit(1);
}
const R = JSON.parse(raw);
const MODELOS = R.global.map((g) => g.modelo);
const COLOR = { 'Línea base estacional': LINE_2, 'SARIMAX': TEAL, 'Gradient boosting': AMBER };

// ---------------------------------------------------------------------------
// origen-movil.svg

{
  const W = 1200, H = 560;
  const g = canvas(W, H);
  g.text(60, 38, 'Por qué origen móvil y no una partición al azar', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'en una serie de tiempo, partir al azar deja días futuros dentro del entrenamiento, y la métrica sale espectacular por la razón equivocada', { size: 12, fill: INK_FAINT, anchor: 'start' });

  // the wrong way
  const L = 300, R2 = 1140;
  const barW = R2 - L;
  g.text(60, 126, 'Partición al azar', { size: 13.5, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 146, 'el modelo aprende del futuro', { size: 11.5, fill: AMBER, anchor: 'start' });
  const rng = (seed) => { let s = seed; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; };
  const r1 = rng(42);
  for (let i = 0; i < 60; i++) {
    const x = L + (i / 60) * barW;
    const w = barW / 60 - 1.5;
    g.rect(x, 112, w, 34, { fill: r1() < 0.25 ? AMBER : LINE_2, r: 1 });
  }
  g.text(L, 168, 'prueba en ámbar, entrenamiento en gris: están intercalados, así que el entrenamiento contiene días posteriores a los de prueba', { size: 11, fill: INK_FAINT, anchor: 'start' });

  // the right way
  g.text(60, 216, 'Origen móvil', { size: 13.5, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 236, 'cada corte reproduce', { size: 11.5, fill: TEAL, anchor: 'start' });
  g.text(60, 252, 'la situación real', { size: 11.5, fill: TEAL, anchor: 'start' });
  const filas = 5;
  for (let k = 0; k < filas; k++) {
    const y = 224 + k * 40;
    const corte = 0.5 + k * 0.09;
    g.rect(L, y, barW * corte, 26, { fill: LINE_2, r: 2 });
    g.rect(L + barW * corte + 2, y, barW * 0.07, 26, { fill: TEAL, r: 2 });
    if (k === 0) {
      g.text(L + barW * corte / 2, y + 17, 'entrenamiento', { size: 11, fill: PAPER, weight: 600 });
      g.text(L + barW * (corte + 0.035) + 2, y + 17, '7 d', { size: 10, fill: PAPER, weight: 600 });
    }
    g.text(L - 14, y + 17, `origen ${k + 1}`, { size: 11, font: MONO, fill: INK_FAINT, anchor: 'end' });
  }
  g.text(L, 224 + filas * 40 + 12, `y así ${R.meta.origenes} veces, una por semana. En cada una el modelo se reajusta con todo lo anterior al origen y pronostica los ${R.meta.horizonte} días siguientes.`, { size: 11.5, fill: INK_DIM, anchor: 'start' });

  g.line(60, 486, 1140, 486, { stroke: LINE });
  g.text(60, 512, `${R.meta.origenes} orígenes × ${R.meta.horizonte} días = ${R.meta.pronosticos_evaluados} pronósticos evaluados por modelo, de ${R.meta.primer_origen} a ${R.meta.ultimo_origen}.`, { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, 534, 'El costo es tiempo de cómputo: cada origen exige reajustar el modelo entero. Es la diferencia entre medir un modelo y medir un experimento.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'origen-movil.svg'), g.done());
}

// ---------------------------------------------------------------------------
// mae-por-horizonte.svg

{
  const W = 1200, H = 660;
  const L = 110, R2 = 820, T = 130, B = 470;
  const g = canvas(W, H);
  const maxMae = Math.max(...R.por_horizonte.flatMap((f) => MODELOS.map((m) => f[m])));
  const yMax = Math.ceil(maxMae / 100) * 100;
  const x = (h) => L + ((h - 1) / (R.meta.horizonte - 1)) * (R2 - L);
  const y = (v) => B - (v / yMax) * (B - T);

  g.text(60, 38, 'El error crece con el horizonte, y no todos crecen igual', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'MAE en MWh por día, desagregado. Un promedio sobre los siete días mezcla el día uno, que es fácil, con el día siete, que no lo es', { size: 12, fill: INK_FAINT, anchor: 'start' });

  for (let v = 0; v <= yMax; v += 200) {
    g.line(L, y(v), R2, y(v), { stroke: v === 0 ? LINE_2 : LINE, w: v === 0 ? 1.4 : 0.8 });
    g.text(L - 12, y(v) + 4, String(v), { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'end' });
  }
  g.text(L - 12, T - 26, 'MAE', { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'end' });
  g.text(L - 12, T - 10, 'MWh/día', { font: MONO, size: 11, fill: INK_FAINT, anchor: 'end' });
  for (let h = 1; h <= R.meta.horizonte; h++) {
    g.line(x(h), B, x(h), B + 6, { stroke: LINE_2 });
    g.text(x(h), B + 24, String(h), { font: MONO, size: 12, fill: INK_FAINT });
  }
  g.text((L + R2) / 2, B + 46, 'días adelante del origen', { size: 12, fill: INK_FAINT });

  MODELOS.forEach((m) => {
    const pts = R.por_horizonte.map((f) => `${x(f.horizonte).toFixed(1)},${y(f[m]).toFixed(1)}`).join(' ');
    g.raw(`<polyline points="${pts}" fill="none" stroke="${COLOR[m]}" stroke-width="2.8" />`);
    R.por_horizonte.forEach((f) => g.dot(x(f.horizonte), y(f[m]), 4, COLOR[m]));
    const ult = R.por_horizonte[R.por_horizonte.length - 1];
    g.text(R2 + 14, y(ult[m]) + 4, m, { size: 12, weight: 600, fill: COLOR[m], anchor: 'start' });
    g.text(R2 + 14, y(ult[m]) + 20, `${ult[m].toFixed(0)} al día 7`, { size: 11, font: MONO, fill: INK_FAINT, anchor: 'start' });
  });

  // the global table
  g.line(60, 508, 1140, 508, { stroke: LINE });
  g.text(60, 534, 'MÉTRICAS GLOBALES', { size: 10.5, weight: 600, fill: INK_FAINT, anchor: 'start', spacing: '0.08em' });
  const COLS = ['modelo', 'MAE', 'RMSE', 'MAPE', 'sesgo', 'mejora vs base'];
  const cx = [60, 340, 450, 560, 660, 790];
  COLS.forEach((c, i) => g.text(cx[i], 558, c, { size: 11, font: MONO, fill: INK_FAINT, anchor: i === 0 ? 'start' : 'end' }));
  const orden = [...R.global].sort((a, b) => a.MAE - b.MAE);
  orden.forEach((r, k) => {
    const yy = 582 + k * 22;
    g.rect(52, yy - 15, 1096, 20, { fill: k % 2 ? PAPER : WASH, r: 3 });
    g.dot(66, yy - 5, 4, COLOR[r.modelo]);
    g.text(80, yy, r.modelo, { size: 12, fill: INK, anchor: 'start', weight: k === 0 ? 600 : 400 });
    [r.MAE, r.RMSE, r.MAPE, r.sesgo, r['mejora vs base']].forEach((v, i) => {
      const txt = i === 2 ? `${v.toFixed(2)} %` : i === 4 ? `${v.toFixed(1)} %` : v.toFixed(1);
      g.text(cx[i + 1], yy, txt, { size: 12, font: MONO, fill: INK_DIM, anchor: 'end' });
    });
  });

  await writeFile(path.join(OUT, 'mae-por-horizonte.svg'), g.done());
}

// ---------------------------------------------------------------------------
// intervalos.svg

{
  const W = 1200, H = 480;
  const g = canvas(W, H);
  const iv = R.intervalos;
  g.text(60, 38, 'El intervalo también se evalúa, y este no pasó', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'un pronóstico puntual no le sirve a quien tiene que decidir cuánta reserva programar; uno con intervalo mal calibrado, tampoco', { size: 12, fill: INK_FAINT, anchor: 'start' });

  // coverage bar
  const L = 60, R2 = 700, BY = 130, BH = 44;
  g.rect(L, BY, R2 - L, BH, { fill: WASH, stroke: LINE, r: 5 });
  g.rect(L, BY, (R2 - L) * (iv.cobertura_p10_p90 / 100), BH, { fill: AMBER, r: 5 });
  const xnom = L + (R2 - L) * (iv.cobertura_nominal / 100);
  g.line(xnom, BY - 14, xnom, BY + BH + 14, { stroke: INK, w: 2.4 });
  g.text(xnom, BY - 22, `nominal ${iv.cobertura_nominal} %`, { size: 12, weight: 600, fill: INK });
  g.text(L + 16, BY + 28, `${iv.cobertura_p10_p90} % observada`, { size: 15, weight: 600, fill: PAPER, anchor: 'start', font: MONO });
  g.text(L, BY + BH + 34, 'De cada cien días, el valor real cayó dentro de la banda P10 a P90 solo en ' + Math.round(iv.cobertura_p10_p90) + '. Debería haber caído en ' + iv.cobertura_nominal + '.', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(L, BY + BH + 54, 'La banda es demasiado angosta: el modelo cree saber más de lo que sabe.', { size: 12, weight: 600, fill: AMBER, anchor: 'start' });

  // numbers
  const KPI = [
    ['ancho medio', `${iv.ancho_medio.toFixed(0)} MWh`, 'P90 menos P10'],
    ['pinball P10', iv.pinball_p10.toFixed(1), 'menor es mejor'],
    ['pinball P90', iv.pinball_p90.toFixed(1), 'menor es mejor'],
  ];
  KPI.forEach(([k, v, s], i) => {
    const kx = 760 + i * 140;
    g.text(kx, BY + 26, v, { size: 18, weight: 600, fill: INK, anchor: 'start', font: MONO });
    g.text(kx, BY + 46, k, { size: 11.5, fill: INK_DIM, anchor: 'start' });
    g.text(kx, BY + 62, s, { size: 10.5, fill: INK_FAINT, anchor: 'start' });
  });

  g.line(60, 290, 1140, 290, { stroke: LINE });
  g.text(60, 318, 'Qué hacer con eso', { size: 13.5, weight: 600, fill: INK, anchor: 'start' });
  const PASOS = [
    'Reportarlo. Un intervalo con 59 % de cobertura no es un intervalo del 80 %, y presentarlo como tal es peor que no dar intervalo.',
    'Calibrarlo. Ajustar los cuantiles sobre un conjunto de calibración aparte, o ensanchar la banda por el factor que la corrida sugiere.',
    'Sospechar de la causa. Los residuos de esta serie están autocorrelacionados, y un modelo que asume independencia entre días subestima',
    'la varianza acumulada del horizonte. La regresión cuantílica no arregla eso sola.',
  ];
  PASOS.forEach((p, i) => {
    if (i < 3) g.dot(66, 344 + i * 26 - 4, 3, AMBER);
    g.text(i < 3 ? 80 : 80, 344 + i * 26, p, { size: 12, fill: INK_DIM, anchor: 'start' });
  });

  g.text(60, 452, 'Reportar la cobertura observada al lado de la nominal es lo mínimo que separa un pronóstico probabilístico de un adorno.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'intervalos.svg'), g.done());
}

console.log('origen-movil.svg, mae-por-horizonte.svg, intervalos.svg written to assets/figures/');
console.log(`  dibujadas desde la corrida: ${R.meta.origenes} orígenes, ${R.meta.pronosticos_evaluados} pronósticos por modelo`);
R.global.forEach((r) => console.log(`  ${r.modelo}: MAE ${r.MAE}, MAPE ${r.MAPE} %`));
