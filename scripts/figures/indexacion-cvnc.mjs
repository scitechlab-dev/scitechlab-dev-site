#!/usr/bin/env node
/**
 * Generates the three figures for the CVNC indexation article:
 *
 *   assets/figures/cvnc-clasificacion.svg   fixed / hybrid / variable, decided
 *   assets/figures/indexacion-doce-meses.svg  the monthly formula, 12 months
 *   assets/figures/ajuste-despacho.svg      why the same indices move the CVNC
 *
 *   node scripts/figures/indexacion-cvnc.mjs
 *
 * The decision thresholds in the first figure (ICVNC >= 7, 4 <= ICVNC < 7,
 * ICVNC < 4) and the goodness-of-fit criteria (R^2 > 0.9, t > 2) are NOT
 * invented: they are Anexo 17 numerals 4.4.9 and 4.5.6. The index series and
 * the cost breakdown ARE invented, and the captions say so.
 *
 * The indexation formula is Anexo 17, 9.1.5.3, and the dispatch adjustment is
 * 9.3.4. Both are implemented here rather than typed as results, so the chart
 * and the article cannot drift from the arithmetic. Every value the article
 * prints is checked at the bottom.
 *
 * Colours are style.css tokens, hardcoded because the file is referenced with
 * <img> and cannot inherit the page's custom properties.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'assets', 'figures');

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
const r2 = (n) => Math.round(n * 100) / 100;
const r4 = (n) => Math.round(n * 10000) / 10000;

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

// ---------------------------------------------------------------------------
// The example unit: the same 60 MW fuel-oil machine as the previous article,
// so the two pieces of its variable cost can be read together.

const CVONC0 = 2.45; // USD/MWh at 31 December of the base year
const CH0 = 0.85;    // variable part of the hybrid costs, from the regression
const CVM0 = 3.50;   // maintenance, the component the dispatch adjustment moves
const CVNC0 = r2(CVONC0 + CH0 + CVM0);

const PCT_IPC = 0.35; // national inputs including local labour
const PCT_PPI = 0.65; // imported inputs

// Illustrative index series. Month 0 is December of the base year.
const IPC = [118.40, 118.62, 118.85, 119.10, 119.44, 119.71, 119.95, 120.26, 120.58, 120.81, 121.09, 121.40, 121.66];
const PPI = [262.10, 263.05, 264.20, 265.10, 264.70, 265.90, 267.30, 268.45, 269.10, 270.05, 271.20, 272.35, 273.10];
const MESES = ['dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Anexo 17, 9.1.5.3. Note it is referred to the BASE, not chained. */
const factorCVNC = (i) => PCT_IPC * (IPC[i] / IPC[0]) + PCT_PPI * (PPI[i] / PPI[0]);
const serie = IPC.map((_, i) => ({ i, f: factorCVNC(i), cvnc: CVNC0 * factorCVNC(i) }));
const F12 = r4(factorCVNC(12));
const CVNC12 = r2(CVNC0 * factorCVNC(12));

// Anexo 17, 9.3.4. Single fuel, so R12 = 1 and the sum has one term.
const Ea = 320000, HOa = 6400;   // base year: 320 GWh in 6 400 h, 50 MW average
const E12 = 248000, HO12 = 6900; // last 12 months: less energy in more hours
const AJUSTE = (Ea / E12) * (HO12 / HOa);
const CVNC_AJ = r2((CVONC0 + CH0) * factorCVNC(12) + CVM0 * factorCVNC(12) * AJUSTE);
const CARGA_BASE = r2(Ea / HOa);
const CARGA_12 = r2(E12 / HO12);

// Anexo 17, 9.2.5.3: the CAyD formula adds the fuel price term, which is the
// bridge back to the previous article.
const CAYD0 = 1.85;
const PCT_C_IPC = 0.20, PCT_C_PPI = 0.35, PCT_C_COMB = 0.45;
const PCOMB0 = 13.10, PCOMB12 = 14.024; // USD/MMBtu, the PCpep of the last article
const F_CAYD = r4(PCT_C_IPC * (IPC[12] / IPC[0]) + PCT_C_PPI * (PPI[12] / PPI[0]) + PCT_C_COMB * (PCOMB12 / PCOMB0));
const CAYD12 = r2(CAYD0 * F_CAYD);

// ---------------------------------------------------------------------------

const expect = (got, want, what) => {
  if (got !== want) {
    console.error(`Check failed: ${what} is ${got}, expected ${want}.`);
    process.exit(1);
  }
};
expect(CVNC0, 6.80, 'base CVNC');
expect(F12, 1.0369, 'index factor at month 12');
expect(CVNC12, 7.05, 'indexed CVNC');
expect(r4(AJUSTE), 1.3911, 'dispatch adjustment factor');
expect(CVNC_AJ, 8.47, 'adjusted CVNC');
expect(CARGA_BASE, 50, 'base year average load');
expect(CARGA_12, 35.94, 'last 12 months average load');
expect(F_CAYD, 1.0519, 'CAyD index factor');
expect(CAYD12, 1.95, 'indexed CAyD');
expect(r2(PCT_IPC + PCT_PPI), 1, 'CVNC participations sum to one');
expect(r2(PCT_C_IPC + PCT_C_PPI + PCT_C_COMB), 1, 'CAyD participations sum to one');

// ---------------------------------------------------------------------------
// cvnc-clasificacion.svg  how a cost item becomes variable, or does not

{
  const W = 1200, H = 690;
  const g = canvas(W, H);
  g.text(60, 38, 'Cómo un rubro de costo termina siendo variable, híbrido o fijo', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'Anexo 17: método analítico para clasificar, método estadístico para segregar lo que quedó en el medio', { size: 12.5, fill: INK_FAINT, anchor: 'start' });

  const box = (x, y, w, h, title, body, ref, color, fill) => {
    g.rect(x, y, w, h, { fill: fill ?? WASH, stroke: LINE, r: 6 });
    if (color) g.rect(x, y, w, 3, { fill: color, r: 1.5 });
    g.text(x + 16, y + 28, title, { size: 13.5, weight: 600, fill: INK, anchor: 'start' });
    (body ?? '').split('\n').filter(Boolean).forEach((ln, k) => g.text(x + 16, y + 50 + k * 16, ln, { size: 11.5, fill: INK_DIM, anchor: 'start' }));
    if (ref) g.text(x + w - 16, y + h - 12, ref, { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });
  };

  // step 1
  box(60, 96, 300, 96, 'Rubro de costo de operación', 'listado de la central en el formato\nF.01, sin los costos especiales', '17, 7.3.1.1 a', INK);
  g.line(360, 144, 418, 144, { stroke: LINE_2, w: 1.6, marker: 'ah-dim' });

  // step 2, the matrix
  box(420, 96, 340, 152, 'Método analítico: el ICVNC', '¿solo se genera con la unidad en marcha? 25 %\n¿es proporcional a la energía o a las horas? 25 %\n¿es un ítem de operación o mantenimiento? 25 %\n¿modifica el estado o condición del equipo? 25 %', '17, 4.4.8', TEAL);
  g.text(436, 232, 'cada respuesta vale de 0 a 10 puntos', { size: 11, font: MONO, fill: INK_FAINT, anchor: 'start' });

  // three outcomes
  const OUT3 = [
    { y: 300, tag: 'ICVNC ≥ 7', title: 'Candidato a CVONC', body: 'condición necesaria, no suficiente:\nfalta justificar la función consumo', color: AMBER },
    { y: 424, tag: '4 ≤ ICVNC < 7', title: 'Costo híbrido', body: 'ni claramente fijo ni claramente\nvariable, va al método estadístico', color: TEAL },
    { y: 548, tag: 'ICVNC < 4', title: 'Costo fijo', body: 'no entra al CVNC por ninguna vía', color: INK_FAINT },
  ];
  OUT3.forEach((o) => {
    g.line(590, 248, 590, o.y + 40, { stroke: LINE_2, w: 1.4, dash: '4 4' });
    g.line(590, o.y + 40, 636, o.y + 40, { stroke: LINE_2, w: 1.4, marker: 'ah-dim' });
    g.text(584, o.y + 32, o.tag, { size: 11.5, font: MONO, weight: 600, fill: o.color, anchor: 'end' });
    box(640, o.y, 268, 88, o.title, o.body, null, o.color, PAPER);
  });

  // the statistical method, to the right of the hybrid row
  box(940, 300, 200, 88, 'Función consumo', 'el agregado consumible que\nexplica el gasto', '17, 4.3.1', AMBER, PAPER);
  g.line(908, 344, 936, 344, { stroke: LINE_2, w: 1.4, marker: 'ah-dim' });

  box(940, 424, 200, 88, 'Regresión y = ax + b', 'x es la energía generada,\ny el costo híbrido', '17, 4.5.4', TEAL, PAPER);
  g.line(908, 468, 936, 468, { stroke: LINE_2, w: 1.4, marker: 'ah-dim' });

  // the goodness of fit gate
  g.rect(940, 524, 200, 108, { fill: WASH, stroke: LINE_2, r: 6 });
  g.text(956, 552, 'El filtro', { size: 12.5, weight: 600, fill: INK, anchor: 'start' });
  g.text(956, 572, 'R² > 0.9  y  t > 2', { size: 12.5, font: MONO, weight: 600, fill: INK, anchor: 'start' });
  g.text(956, 592, 'si se cumple, el coeficiente a', { size: 11, fill: INK_DIM, anchor: 'start' });
  g.text(956, 607, 'es la parte variable; si no,', { size: 11, fill: INK_DIM, anchor: 'start' });
  g.text(956, 622, 'la parte variable es cero', { size: 11, fill: AMBER, anchor: 'start', weight: 600 });
  g.line(1040, 512, 1040, 524, { stroke: LINE_2, w: 1.4, marker: 'ah-dim' });
  g.text(1124, 640, '17, 4.5.6 y 4.5.7', { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });

  // the CVM branch, which never passes through the ICVNC matrix
  box(60, 404, 300, 108, 'La otra rama: el CVM', 'mantenimiento programado, por valor\npresente del flujo del ciclo. No pasa\npor el ICVNC: es variable por diseño', '17, 4.2', TEAL);

  // what the three branches add up to
  g.rect(60, 540, 300, 96, { fill: PAPER, stroke: LINE_2, r: 6 });
  g.text(76, 566, 'Lo que se suma al final', { size: 13, weight: 600, fill: INK, anchor: 'start' });
  g.text(76, 590, 'CVNC = CVONC', { font: MONO, size: 12.5, fill: INK, anchor: 'start' });
  g.text(76, 608, '     + parte variable de CH', { font: MONO, size: 12.5, fill: INK, anchor: 'start' });
  g.text(76, 626, '     + CVM', { font: MONO, size: 12.5, fill: INK, anchor: 'start' });

  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, 'cvnc-clasificacion.svg'), g.done());
}

// ---------------------------------------------------------------------------
// indexacion-doce-meses.svg

{
  const W = 1200, H = 640;
  // T leaves room for the axis unit label, which would otherwise run into the
  // subtitle.
  const L = 96, R = 1040, T = 132, Bo = 470;
  const g = canvas(W, H);
  const x = (i) => L + (i / 12) * (R - L);
  const YLO = 0.995, YHI = 1.05;
  const y = (v) => Bo - ((v - YLO) / (YHI - YLO)) * (Bo - T);

  g.text(60, 38, 'Doce meses de indexación, referidos siempre a la misma base', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'la fórmula no encadena mes contra mes: cada mes se compara contra diciembre del año base', { size: 12.5, fill: INK_FAINT, anchor: 'start' });

  // grid
  for (let v = 1.0; v <= 1.0501; v += 0.01) {
    const vv = r2(v);
    g.line(L, y(vv), R, y(vv), { stroke: LINE, w: 0.8 });
    g.text(L - 12, y(vv) + 4, vv.toFixed(2), { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'end' });
  }
  g.line(L, y(1), R, y(1), { stroke: LINE_2, w: 1.4 });
  g.line(L, T, L, Bo, { stroke: LINE_2 });
  MESES.forEach((m, i) => {
    g.line(x(i), Bo, x(i), Bo + 6, { stroke: LINE_2 });
    g.text(x(i), Bo + 24, m, { size: 11.5, fill: INK_FAINT });
  });
  g.text(L - 12, T - 50, 'índice', { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'end' });
  g.text(L - 12, T - 34, 'relativo', { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'end' });

  const poly = (vals, color, w, dash) => {
    const pts = vals.map((v, i) => `${r2(x(i))},${r2(y(v))}`).join(' ');
    g.raw(`<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} />`);
  };
  poly(IPC.map((v) => v / IPC[0]), TEAL, 2, '5 4');
  poly(PPI.map((v) => v / PPI[0]), AMBER, 2, '5 4');
  poly(serie.map((s) => s.f), INK, 3.2);
  serie.forEach((s) => g.dot(x(s.i), y(s.f), 3.6, INK));

  // labels at the right end
  g.text(R + 12, y(IPC[12] / IPC[0]) + 4, `IPC  ${r4(IPC[12] / IPC[0])}`, { font: MONO, size: 12, fill: TEAL, anchor: 'start', weight: 600 });
  g.text(R + 12, y(PPI[12] / PPI[0]) + 4, `PPI  ${r4(PPI[12] / PPI[0])}`, { font: MONO, size: 12, fill: AMBER, anchor: 'start', weight: 600 });
  g.text(R + 12, y(serie[12].f) - 12, `factor  ${F12}`, { font: MONO, size: 12.5, fill: INK, anchor: 'start', weight: 600 });

  // the weights, called out on the curve
  g.rect(L + 24, T + 12, 300, 68, { fill: PAPER, stroke: LINE, r: 6 });
  g.text(L + 40, T + 34, 'factor = 0.35 · IPC(i)/IPC(0)', { font: MONO, size: 12.5, fill: INK, anchor: 'start' });
  g.text(L + 40, T + 54, '        + 0.65 · PPI(i)/PPI(0)', { font: MONO, size: 12.5, fill: INK, anchor: 'start' });
  g.text(L + 40, T + 72, 'la ponderación la valida el auditor', { size: 11, fill: INK_FAINT, anchor: 'start' });

  // the money line
  g.line(60, 520, 1140, 520, { stroke: LINE });
  g.text(60, 548, `CVNC(0) = ${CVNC0.toFixed(2)} USD/MWh   ×   factor ${F12}   =   CVNC(12) = ${CVNC12.toFixed(2)} USD/MWh`, { font: MONO, size: 13.5, fill: INK, anchor: 'start' });
  g.text(60, 574, `Veinticinco centavos en un año. El PPI pesa el doble que el IPC porque los repuestos son importados, y por eso el factor se`, { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 592, `pega a la curva ámbar y no a la de en medio. Cambiar esa ponderación mueve más el resultado que cambiar los índices.`, { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 618, `Índices ilustrativos. Las fuentes reales son la DIGESTYC para el IPC y la serie PCUOMFG del Bureau of Labor Statistics para el PPI.`, { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'indexacion-doce-meses.svg'), g.done());
}

// ---------------------------------------------------------------------------
// ajuste-despacho.svg

{
  const W = 1200, H = 620;
  const g = canvas(W, H);
  g.text(60, 38, 'Dos causas mueven el CVNC, y la más grande no es la inflación', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'la misma máquina, el mismo año base, y un régimen de despacho distinto', { size: 12.5, fill: INK_FAINT, anchor: 'start' });

  // operating data, two panels
  const panel = (x, title, sub, e, h, carga, color) => {
    g.rect(x, 96, 340, 128, { fill: WASH, stroke: LINE, r: 6 });
    g.rect(x, 96, 340, 3, { fill: color, r: 1.5 });
    g.text(x + 18, 124, title, { size: 13.5, weight: 600, fill: INK, anchor: 'start' });
    g.text(x + 18, 143, sub, { size: 11.5, fill: INK_FAINT, anchor: 'start' });
    g.text(x + 18, 172, `energía neta   ${e}`, { font: MONO, size: 12.5, fill: INK_DIM, anchor: 'start' });
    g.text(x + 18, 191, `horas de operación   ${h}`, { font: MONO, size: 12.5, fill: INK_DIM, anchor: 'start' });
    g.text(x + 18, 212, `carga media   ${carga} MW`, { font: MONO, size: 12.5, weight: 600, fill: color, anchor: 'start' });
  };
  panel(60, 'Año base', 'sobre el que se calculó el CVNC', `${(Ea / 1000).toFixed(0)} GWh`, `${HOa} h`, CARGA_BASE.toFixed(0), TEAL);
  panel(440, 'Últimos doce meses', 'medidos por el SIMEC', `${(E12 / 1000).toFixed(0)} GWh`, `${HO12} h`, CARGA_12.toFixed(1), AMBER);

  g.rect(820, 96, 320, 128, { fill: PAPER, stroke: LINE_2, r: 6 });
  g.text(838, 124, 'El factor de ajuste', { size: 13.5, weight: 600, fill: INK, anchor: 'start' });
  g.text(838, 152, `Ea/E12 · HO12/HOa`, { font: MONO, size: 13, fill: INK_DIM, anchor: 'start' });
  g.text(838, 176, `${(Ea / E12).toFixed(4)} · ${(HO12 / HOa).toFixed(4)} = ${r4(AJUSTE)}`, { font: MONO, size: 13, weight: 600, fill: INK, anchor: 'start' });
  g.text(838, 202, 'más horas por cada MWh entregado', { size: 11.5, fill: INK_FAINT, anchor: 'start' });
  g.text(838, 217, 'es más mantenimiento por MWh', { size: 11.5, fill: INK_FAINT, anchor: 'start' });

  // the stacked bars
  const BT = 280, BB = 500, VMAX = 9;
  const yv = (v) => BB - (v / VMAX) * (BB - BT);
  for (let v = 0; v <= VMAX; v += 3) {
    g.line(200, yv(v), 1140, yv(v), { stroke: v === 0 ? LINE_2 : LINE, w: v === 0 ? 1.4 : 0.8 });
    g.text(190, yv(v) + 4, String(v), { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'end' });
  }
  g.text(190, BT - 22, 'USD/MWh', { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'end' });

  const f = factorCVNC(12);
  const BARS = [
    { x: 300, label: 'CVNC del año base', sub: 'al 31 de diciembre', segs: [['CVONC', CVONC0, TEAL], ['parte variable de CH', CH0, INK_FAINT], ['CVM', CVM0, AMBER]], total: CVNC0 },
    { x: 620, label: 'Indexado al mes 12', sub: 'fórmula 9.1.5.3', segs: [['CVONC', CVONC0 * f, TEAL], ['parte variable de CH', CH0 * f, INK_FAINT], ['CVM', CVM0 * f, AMBER]], total: CVNC12 },
    { x: 940, label: 'Ajustado por despacho', sub: 'fórmula 9.3.4', segs: [['CVONC', CVONC0 * f, TEAL], ['parte variable de CH', CH0 * f, INK_FAINT], ['CVM', CVM0 * f * AJUSTE, AMBER]], total: CVNC_AJ },
  ];
  const BW = 132;
  BARS.forEach((b) => {
    let acc = 0;
    b.segs.forEach(([, v, c]) => {
      g.rect(b.x - BW / 2, yv(acc + v), BW, yv(acc) - yv(acc + v), { fill: c, r: 0 });
      acc += v;
    });
    g.text(b.x, yv(acc) - 14, `${b.total.toFixed(2)}`, { font: MONO, size: 16, weight: 600, fill: INK });
    g.text(b.x, BB + 26, b.label, { size: 13, weight: 600, fill: INK });
    g.text(b.x, BB + 44, b.sub, { size: 11.5, font: MONO, fill: INK_FAINT });
  });

  // deltas between bars
  const delta = (x1, x2, from, to, note) => {
    // sits in the gap between the data panels and the chart, so it touches
    // neither
    const yy = BT - 16;
    g.line(x1, yy, x2, yy, { stroke: INK_FAINT, w: 1.2, marker: 'ah-dim' });
    g.text((x1 + x2) / 2, yy - 32, `+${(to - from).toFixed(2)} USD/MWh`, { size: 12.5, weight: 600, fill: INK, font: MONO });
    g.text((x1 + x2) / 2, yy - 16, note, { size: 11.5, fill: INK_FAINT });
  };
  delta(370, 550, CVNC0, CVNC12, 'inflación de insumos');
  delta(690, 870, CVNC12, CVNC_AJ, 'el despacho real de los últimos doce meses');

  // legend
  let lx = 300;
  [['CVONC', TEAL], ['parte variable de los costos híbridos', INK_FAINT], ['CVM, mantenimiento programado', AMBER]].forEach(([lab, c]) => {
    g.rect(lx, 556, 13, 13, { fill: c, r: 2 });
    g.text(lx + 20, 567, lab, { size: 11.5, fill: INK_DIM, anchor: 'start' });
    lx += lab.length * 6.2 + 60;
  });
  g.text(60, 596, 'Solo el mantenimiento se reescala: es el único componente cuyo costo por MWh depende de cuántas horas se operó para entregar esa energía.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'ajuste-despacho.svg'), g.done());
}

console.log('cvnc-clasificacion.svg, indexacion-doce-meses.svg, ajuste-despacho.svg written to assets/figures/');
console.log(`  CVNC ${CVNC0} -> ${CVNC12} (factor ${F12}) -> ${CVNC_AJ} (ajuste ${r4(AJUSTE)})`);
console.log(`  CAyD ${CAYD0} -> ${CAYD12} (factor ${F_CAYD})`);
