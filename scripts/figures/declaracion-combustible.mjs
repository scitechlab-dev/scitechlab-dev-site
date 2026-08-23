#!/usr/bin/env node
/**
 * Generates the four figures for the weekly fuel-price declaration article:
 *
 *   assets/figures/cadena-costo-combustible.svg  the three clocks
 *   assets/figures/consumo-especifico.svg        heat rate curve -> CVC
 *   assets/figures/semana-combustible.svg        the operating week
 *   assets/figures/inventario-minimo.svg         stock floor vs reservoir level
 *
 *   node scripts/figures/declaracion-combustible.mjs
 *
 * The example unit is the article's: 60 MW net, 20 MW minimum, fuel oil, with
 * a second-order specific heat consumption polynomial in MMBtu/MWh. The
 * polynomial form and the least-squares fit are the ones the ROBCP mandates
 * (Anexo 16, apendice 3, num. 2.2); the coefficients are invented, and the
 * captions say so.
 *
 * Every number that appears in the SVGs is COMPUTED here and checked at the
 * bottom against what the article prints. The build cost chain is summed from
 * its line items rather than typed twice, so an edit to one component cannot
 * silently disagree with the total.
 *
 * The day counts in inventario-minimo.svg are NOT invented: they are numeral
 * 9.1 of Anexo 04, which ties the fuel stock floor to the Cerron Grande
 * reservoir level. Those are read off the regulation and the checks below
 * pin them.
 *
 * Colours are style.css tokens, hardcoded because the file is referenced with
 * <img> and cannot inherit the page's custom properties. If the palette moves,
 * it moves here too.
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
const r3 = (n) => Math.round(n * 1000) / 1000;

/** Small SVG builder shared by the four figures. */
function canvas(W, H) {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<rect width="${W}" height="${H}" fill="${PAPER}" />`,
  ];
  const api = {
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
  parts.push(
    `<defs>` +
      [
        ['ah-ink', INK],
        ['ah-amber', AMBER],
        ['ah-teal', TEAL],
        ['ah-dim', INK_FAINT],
      ]
        .map(
          ([id, c]) =>
            `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}" /></marker>`
        )
        .join('') +
      `</defs>`
  );
  return api;
}

// ---------------------------------------------------------------------------
// The example unit and its cost chain. Everything the article prints comes
// out of here.

const PMAX = 60; // MW net
const PMIN = 20; // MW, declared technical minimum
const RPF = 0.03; // Anexo 11, 2.1: 3 % of active power reserve for primary regulation

// C_ESP(P) = a + b P + c P^2, in MMBtu/MWh. Illustrative coefficients.
const A = 10.53, B = -0.078, C = 0.00075;
const cesp = (p) => A + B * p + C * p * p;

// The five test points the audit would produce, per Anexo 16 apendice 3 num 3.4
// (five or more pairs). Drawn on the curve with a small scatter so the figure
// reads as measured data rather than as the polynomial itself.
const TEST = [
  { p: 20, d: +0.06 },
  { p: 30, d: -0.05 },
  { p: 40, d: +0.04 },
  { p: 50, d: -0.03 },
  { p: 60, d: +0.02 },
].map((t) => ({ ...t, y: r3(cesp(t.p) + t.d) }));

// Fuel price put in the plant tank, built the way Anexo 04 num. 4.2 builds it.
const CHAIN = [
  { k: 'a', label: 'Precio FOB de la referencia internacional', v: 78.40, group: 'cif' },
  { k: 'b', label: 'Flete marítimo', v: 4.10, group: 'cif' },
  { k: 'c', label: 'Seguro marítimo', v: 0.35, group: 'cif' },
  { k: 'e', label: 'Derechos de internación', v: 0.83, group: 'int' },
  { k: 'f', label: 'Gastos de internación (agente de aduana)', v: 0.22, group: 'int' },
  { k: 'h', label: 'Servicio de descarga', v: 0.95, group: 'tanque' },
  { k: 'i', label: 'Muestreo y análisis', v: 0.08, group: 'tanque' },
  { k: 'j', label: 'Transporte terrestre', v: 1.60, group: 'tanque' },
  { k: 'k', label: 'Prima de póliza (descarga, transporte y almacenaje)', v: 0.12, group: 'tanque' },
  { k: 'l', label: 'Otros impuestos no acreditables', v: 0.30, group: 'tanque' },
];
const sum = (g) => r2(CHAIN.filter((x) => g.includes(x.group)).reduce((s, x) => s + x.v, 0));
const CIF = sum(['cif']);
const CIF_INT = sum(['cif', 'int']);
const PUESTO_TANQUES = sum(['cif', 'int', 'tanque']);

const PCI = 6.20; // MMBtu per barrel, illustrative
const PCPEP = r3(PUESTO_TANQUES / PCI); // USD/MMBtu

const cvc = (p) => cesp(p) * PCPEP;
const CVNC = 6.80; // USD/MWh, illustrative, the subject of the next article
const P_EVAL = r2(PMAX * (1 - RPF)); // Anexo 09, 3.1.5
const CVC_EVAL = r2(cvc(P_EVAL));
const CV_TOTAL = r2(CVC_EVAL + CVNC);
const CVC_MIN_TEC = r2(cvc(PMIN));
const SPREAD = r2(CVC_MIN_TEC - CVC_EVAL);

// Minimum fuel stock, Anexo 04 num. 9.1: days at full load, by reservoir level.
const STOCK = [
  { cota: 'Bajo 235.50 m.s.n.m.', alto: 10, bajo: 5 },
  { cota: 'Entre 235.50 y 242', alto: 8, bajo: 4 },
  { cota: 'Arriba de 242', alto: 7, bajo: 3 },
];

// ---------------------------------------------------------------------------
// Checks. These are the numbers the article quotes.

const expect = (got, want, what) => {
  if (got !== want) {
    console.error(`Check failed: ${what} is ${got}, expected ${want}.`);
    process.exit(1);
  }
};
expect(CIF, 82.85, 'CIF price');
expect(CIF_INT, 83.90, 'CIF internado');
expect(PUESTO_TANQUES, 86.95, 'costo puesto en tanques');
expect(PCPEP, 14.024, 'PCpep');
expect(P_EVAL, 58.2, 'evaluation point');
expect(r2(cesp(P_EVAL)), 8.53, 'heat rate at evaluation point');
expect(CVC_EVAL, 119.64, 'CVC at evaluation point');
expect(CV_TOTAL, 126.44, 'total variable cost');
expect(r2(cesp(PMIN)), 9.27, 'heat rate at technical minimum');
expect(CVC_MIN_TEC, 130.0, 'CVC at technical minimum');
expect(SPREAD, 10.36, 'CVC spread across the operating range');
expect(STOCK[0].alto, 10, 'stock floor, low reservoir, high plant factor');

// ---------------------------------------------------------------------------
// cadena-costo-combustible.svg  the three clocks

{
  const W = 1200, H = 660;
  const g = canvas(W, H);
  const BANDS = [
    {
      y: 66,
      tag: 'CADA DOS AÑOS',
      sub: 'auditoría y aprobación',
      color: TEAL,
      boxes: [
        ['Auditoría de consumo de calor', 'auditor externo del registro de la UT,\ncon la UT como observador', 'Anexo 16, 2.2 y 2.8'],
        ['Polinomio de consumo específico', 'C_ESP(P) = a + bP + cP²,\nmínimos cuadrados sobre 5 puntos o más', 'Anexo 16, ap. 3, 2.2'],
        ['Estructura de costos del combustible', 'fuente internacional, fórmula FOB,\ncostos de internación y su actualización', 'Anexo 04, 4.1 y 4.3'],
      ],
    },
    {
      y: 268,
      tag: 'CADA SEMANA',
      sub: 'declaración y validación',
      color: AMBER,
      boxes: [
        ['El generador reporta su PCpep', 'jueves antes de las 10:00. Se publica\ncada mañana; no entra al despacho', 'Anexo 04, 10.1 y 11.1'],
        ['La UT calcula el precio que despacha', 'aplica la fórmula aprobada sobre la\nreferencia internacional publicada', 'Anexo 04, 3.1 y 7.1'],
        ['Lunes: variación de inventarios', 'existencia a las cero horas, con tablas\nde calibración auditadas', 'Anexo 04, 8.2'],
      ],
    },
    {
      y: 470,
      tag: 'CADA HORA',
      sub: 'despacho y precio',
      color: INK,
      boxes: [
        ['Costo variable de la unidad', 'CVC = C_ESP × PCpep, evaluado a\npotencia máxima neta menos reserva', 'Anexo 09, 3.1.5'],
        ['Orden de mérito en el SAM', 'el parque se ordena por costo variable\ny se despacha a mínimo costo', 'ROBCP, 10.1.1 y 10.2.1'],
        ['Precio del MRS', 'costo marginal de operación más los\ncargos del sistema', 'Anexo 09, 3.3.1'],
      ],
    },
  ];

  const BX = 250, BW = 290, BH = 130, GAP = 26;

  g.text(60, 38, 'El recorrido de un dato, de la auditoría al precio de una hora', {
    size: 17, weight: 600, fill: INK, anchor: 'start',
  });

  BANDS.forEach((band, bi) => {
    // the band label, left rail
    g.rect(60, band.y, 4, BH, { fill: band.color, r: 2 });
    g.text(76, band.y + 20, band.tag, { size: 11.5, weight: 600, fill: band.color, anchor: 'start', spacing: '0.08em' });
    g.text(76, band.y + 40, band.sub, { size: 12, fill: INK_FAINT, anchor: 'start' });

    band.boxes.forEach((b, i) => {
      const x = BX + i * (BW + GAP);
      g.rect(x, band.y, BW, BH, { fill: WASH, stroke: LINE, r: 6 });
      g.rect(x, band.y, BW, 3, { fill: band.color, r: 1.5 });
      g.text(x + 18, band.y + 30, b[0], { size: 13.5, weight: 600, fill: INK, anchor: 'start' });
      b[1].split('\n').forEach((ln, k) =>
        g.text(x + 18, band.y + 54 + k * 17, ln, { size: 12, fill: INK_DIM, anchor: 'start' })
      );
      g.text(x + 18, band.y + BH - 14, b[2], { size: 11, font: MONO, fill: INK_FAINT, anchor: 'start' });
      if (i < 2) g.line(x + BW + 5, band.y + BH / 2, x + BW + GAP - 5, band.y + BH / 2, { stroke: LINE_2, w: 1.6, marker: 'ah-dim' });
    });

    // the drop to the next band
    if (bi < BANDS.length - 1) {
      const nx = BX + BW / 2;
      g.line(nx, band.y + BH + 6, nx, BANDS[bi + 1].y - 8, { stroke: LINE_2, w: 1.6, dash: '5 5', marker: 'ah-dim' });
      const mid = (band.y + BH + BANDS[bi + 1].y) / 2;
      const note = bi === 0
        ? 'la estructura aprobada es la referencia contra la que se valida cada semana'
        : 'al modelo entra el precio que calcula la UT, no el que reporta el generador';
      g.text(nx + 16, mid + 4, note, { size: 12, fill: INK_FAINT, anchor: 'start' });
    }
  });

  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, 'cadena-costo-combustible.svg'), g.done());
}

// ---------------------------------------------------------------------------
// consumo-especifico.svg  the heat rate curve and the cost it produces

{
  const W = 1200, H = 700;
  // T leaves room for the axis unit labels, which sit above the plot and would
  // otherwise run into the title.
  const L = 96, R = 1080, T = 118, Bo = 560;
  const g = canvas(W, H);
  const PLO = 10, PHI = 68;
  const YLO = 8.2, YHI = 9.8;
  const x = (p) => L + ((p - PLO) / (PHI - PLO)) * (R - L);
  const y = (v) => Bo - ((v - YLO) / (YHI - YLO)) * (Bo - T);

  g.text(60, 38, 'Curva de consumo específico de calor y el costo variable que produce', {
    size: 17, weight: 600, fill: INK, anchor: 'start',
  });

  // the invalid range outside the tested band
  g.rect(x(PLO), T, x(PMIN) - x(PLO), Bo - T, { fill: WASH });
  g.rect(x(PMAX), T, x(PHI) - x(PMAX), Bo - T, { fill: WASH });
  g.text((x(PLO) + x(PMIN)) / 2, T + 20, 'fuera de', { size: 11, fill: INK_FAINT });
  g.text((x(PLO) + x(PMIN)) / 2, T + 35, 'la curva', { size: 11, fill: INK_FAINT });
  g.text((x(PMAX) + x(PHI)) / 2, T + 20, 'fuera de', { size: 11, fill: INK_FAINT });
  g.text((x(PMAX) + x(PHI)) / 2, T + 35, 'la curva', { size: 11, fill: INK_FAINT });

  // axes
  g.line(L, T, L, Bo, { stroke: LINE_2 });
  g.line(L, Bo, R, Bo, { stroke: LINE_2 });
  for (let p = 10; p <= 68; p += 10) {
    g.line(x(p), Bo, x(p), Bo + 6, { stroke: LINE_2 });
    g.text(x(p), Bo + 24, String(p), { font: MONO, size: 12, fill: INK_FAINT });
  }
  g.text(R, Bo + 44, 'MW netos', { font: MONO, size: 12, fill: INK_FAINT, anchor: 'end' });
  for (let v = 8.2; v <= 9.81; v += 0.2) {
    const vv = r2(v);
    g.line(L - 6, y(vv), L, y(vv), { stroke: LINE_2 });
    g.text(L - 14, y(vv) + 4, vv.toFixed(1), { font: MONO, size: 12, fill: INK_FAINT, anchor: 'end' });
    g.line(L, y(vv), R, y(vv), { stroke: LINE, w: 0.8 });
  }
  g.text(L - 14, T - 46, 'C_ESP', { font: MONO, size: 12, fill: TEAL, anchor: 'end', weight: 600 });
  g.text(L - 14, T - 30, 'MMBtu/MWh', { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'end' });

  // right-hand axis: the same curve read as USD/MWh
  g.line(R, T, R, Bo, { stroke: LINE_2 });
  for (let v = 8.2; v <= 9.81; v += 0.2) {
    const vv = r2(v);
    g.line(R, y(vv), R + 6, y(vv), { stroke: LINE_2 });
    g.text(R + 14, y(vv) + 4, (vv * PCPEP).toFixed(1), { font: MONO, size: 12, fill: AMBER, anchor: 'start' });
  }
  g.text(R + 14, T - 46, 'CVC', { font: MONO, size: 12, fill: AMBER, anchor: 'start', weight: 600 });
  g.text(R + 14, T - 30, 'USD/MWh', { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'start' });

  // the polynomial, drawn only where it is valid
  const pts = [];
  for (let p = PMIN; p <= PMAX + 0.001; p += 0.5) pts.push(`${r2(x(p))},${r2(y(cesp(p)))}`);
  g.raw(`<polyline points="${pts.join(' ')}" fill="none" stroke="${TEAL}" stroke-width="3" />`);
  // dashed continuation, to make the invalid extrapolation visible
  const ext = [];
  for (let p = PLO; p <= PMIN + 0.001; p += 0.5) ext.push(`${r2(x(p))},${r2(y(cesp(p)))}`);
  g.raw(`<polyline points="${ext.join(' ')}" fill="none" stroke="${LINE_2}" stroke-width="2" stroke-dasharray="5 5" />`);
  const ext2 = [];
  for (let p = PMAX; p <= PHI + 0.001; p += 0.5) ext2.push(`${r2(x(p))},${r2(y(cesp(p)))}`);
  g.raw(`<polyline points="${ext2.join(' ')}" fill="none" stroke="${LINE_2}" stroke-width="2" stroke-dasharray="5 5" />`);

  // the five audited test points
  TEST.forEach((t) => {
    g.dot(x(t.p), y(t.y), 5.5, PAPER);
    g.raw(`<circle cx="${x(t.p)}" cy="${y(t.y)}" r="5" fill="none" stroke="${INK}" stroke-width="2" />`);
  });

  // technical minimum and maximum
  [[PMIN, 'mínimo técnico'], [PMAX, 'potencia máxima neta']].forEach(([p, lab]) => {
    g.line(x(p), T, x(p), Bo, { stroke: INK_FAINT, w: 1.3, dash: '4 4' });
    g.text(x(p), T - 12, lab, { size: 12, fill: INK_FAINT });
  });

  // the point the regulation actually evaluates
  g.line(x(P_EVAL), y(cesp(P_EVAL)), x(P_EVAL), Bo, { stroke: AMBER, w: 2, dash: '6 4' });
  g.line(L, y(cesp(P_EVAL)), x(P_EVAL), y(cesp(P_EVAL)), { stroke: AMBER, w: 2, dash: '6 4' });
  g.dot(x(P_EVAL), y(cesp(P_EVAL)), 6, AMBER);
  // the callout sits above the dashed price line so it crosses neither it nor
  // the curve
  g.text(x(P_EVAL) - 20, y(cesp(P_EVAL)) - 36, `${P_EVAL} MW`, { size: 12.5, weight: 600, fill: AMBER, anchor: 'end' });
  g.text(x(P_EVAL) - 20, y(cesp(P_EVAL)) - 20, `${CVC_EVAL} USD/MWh`, { size: 12.5, weight: 600, fill: AMBER, anchor: 'end' });

  // the spread across the operating range, bracketed inside the left band where
  // nothing else is drawn
  const bx = L + 34;
  g.line(L, y(cesp(PMIN)), x(PMIN), y(cesp(PMIN)), { stroke: INK_FAINT, w: 1.1, dash: '3 4' });
  g.line(bx, y(cesp(PMIN)), bx, y(cesp(P_EVAL)), { stroke: INK, w: 1.4 });
  g.line(bx - 4, y(cesp(PMIN)), bx + 4, y(cesp(PMIN)), { stroke: INK, w: 1.4 });
  g.line(bx - 4, y(cesp(P_EVAL)), bx + 4, y(cesp(P_EVAL)), { stroke: INK, w: 1.4 });
  const my = (y(cesp(PMIN)) + y(cesp(P_EVAL))) / 2;
  g.text(bx + 12, my - 12, `${SPREAD} USD/MWh`, { size: 12.5, weight: 600, fill: INK, anchor: 'start' });
  g.text(bx + 12, my + 4, 'de diferencia', { size: 11.5, fill: INK_DIM, anchor: 'start' });
  g.text(bx + 12, my + 19, 'en el mismo rango', { size: 11.5, fill: INK_DIM, anchor: 'start' });

  // footer: the arithmetic in one line
  g.line(60, 612, 1140, 612, { stroke: LINE });
  g.text(60, 638, `C_ESP(${P_EVAL}) = ${r2(cesp(P_EVAL))} MMBtu/MWh   ×   PCpep = ${PCPEP} USD/MMBtu   =   CVC ${CVC_EVAL} USD/MWh   +   CVNC ${CVNC.toFixed(2)}   =   CV ${CV_TOTAL} USD/MWh`, {
    font: MONO, size: 13, fill: INK, anchor: 'start',
  });
  g.text(60, 662, 'los cinco círculos son los puntos de ensayo que exige el procedimiento; la curva es el polinomio de segundo grado ajustado por mínimos cuadrados', {
    size: 12, fill: INK_FAINT, anchor: 'start',
  });

  await writeFile(path.join(OUT, 'consumo-especifico.svg'), g.done());
}

// ---------------------------------------------------------------------------
// semana-combustible.svg  the operating week

{
  const W = 1200, H = 510;
  const g = canvas(W, H);
  const L = 80, R = 1120, AX = 254;
  const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const dw = (R - L) / 7;
  const dx = (i) => L + i * dw;

  g.text(60, 38, 'La semana operativa del precio del combustible', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'lo que ocurre cada semana con el mismo dato, y quién lo mueve', { size: 12.5, fill: INK_FAINT, anchor: 'start' });

  // day columns
  DAYS.forEach((d, i) => {
    if (i % 2 === 0) g.rect(dx(i), 92, dw, 306, { fill: WASH, r: 0 });
    g.text(dx(i) + dw / 2, 112, d, { size: 12.5, weight: 600, fill: INK_DIM });
  });
  g.line(L, AX, R, AX, { stroke: LINE_2, w: 1.6 });

  // Only the dated obligations get a box. The daily publication is a band
  // across the whole week, because drawing it on one day would say it happens
  // on that day.
  const EVENTS = [
    { day: 0, off: 0.28, side: 'up', who: 'GENERADOR', color: AMBER, title: 'Variación de inventarios', body: 'existencia a las 00:00, en gal o bbl\npara líquidos y en MMBtu para gas', ref: 'Anexo 04, 8.2' },
    { day: 0, off: 0.72, side: 'down', who: 'UT', color: TEAL, title: 'Consolidado de inventarios', body: 'publicado el mismo día y remitido\nal regulador', ref: 'Anexo 04, 8.2' },
    { day: 3, off: 0.24, side: 'up', who: 'GENERADOR', color: AMBER, title: 'Reporte del PCpep', body: 'antes de las 10:00, en el formulario del\nAnexo 06. Se publica, no despacha', ref: 'Anexo 04, 10.1' },
    { day: 3, off: 0.74, side: 'down', who: 'UT', color: TEAL, title: 'Precio de la programación semanal', body: 'lo calcula la UT con la fórmula\naprobada. Ese es el que despacha', ref: 'Anexo 04, 11.2' },
  ];

  const BH = 116, BW = 274;
  EVENTS.forEach((e) => {
    const px = dx(e.day) + dw * e.off;
    const up = e.side === 'up';
    const by = up ? 128 : 272;
    const bx = Math.min(Math.max(px - BW / 2, L + 4), R - BW - 4);
    g.line(px, AX, px, up ? by + BH : by, { stroke: e.color, w: 1.6 });
    g.dot(px, AX, 6, e.color);
    g.rect(bx, by, BW, BH, { fill: PAPER, stroke: LINE, r: 6 });
    g.rect(bx, by, 3, BH, { fill: e.color, r: 1.5 });
    g.text(bx + 16, by + 24, e.who, { size: 10.5, weight: 600, fill: e.color, anchor: 'start', spacing: '0.08em' });
    g.text(bx + 16, by + 44, e.title, { size: 13.5, weight: 600, fill: INK, anchor: 'start' });
    e.body.split('\n').forEach((ln, k) => g.text(bx + 16, by + 66 + k * 16, ln, { size: 11.5, fill: INK_DIM, anchor: 'start' }));
    g.text(bx + 16, by + BH - 14, e.ref, { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'start' });
  });

  // the daily publication, as a band rather than a day
  const BY = 418;
  g.line(L, BY, R, BY, { stroke: TEAL, w: 1.4, dash: '5 5' });
  DAYS.forEach((_, i) => g.dot(dx(i) + dw / 2, BY, 4.5, TEAL));
  g.text(L, BY + 24, 'TODOS LOS DÍAS, 8 A 9 H', { size: 10.5, weight: 600, fill: TEAL, anchor: 'start', spacing: '0.08em' });
  g.text(L + 190, BY + 24, 'la UT publica los PCpep reportados por cada participante para el día en curso, junto con el nivel de los embalses', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(R, BY + 24, 'Anexo 04, 11.1', { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });

  g.text(60, 476, 'Las dos cifras del jueves son distintas y las dos son públicas. La que reporta el generador cumple el artículo 60 literal c de la Ley General', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 494, 'de Electricidad y no se usa en la programación (Anexo 06, 7.4.3.7.1). La que calcula la UT rige los siete días de la semana programada (7.1).', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'semana-combustible.svg'), g.done());
}

// ---------------------------------------------------------------------------
// inventario-minimo.svg  the stock floor as a function of the reservoir

{
  const W = 1200, H = 560;
  const g = canvas(W, H);
  const L = 300, R = 980, T = 130, Bo = 430;
  const DMAX = 12;
  const x = (d) => L + (d / DMAX) * (R - L);

  g.text(60, 38, 'El piso de inventario de combustible depende del embalse', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'Anexo 04, numeral 9.1: cuanto menos agua hay en Cerrón Grande, más combustible se exige en tanque', { size: 12.5, fill: INK_FAINT, anchor: 'start' });

  // axis
  for (let d = 0; d <= DMAX; d += 2) {
    g.line(x(d), T - 14, x(d), Bo + 8, { stroke: d === 0 ? LINE_2 : LINE, w: d === 0 ? 1.4 : 0.8 });
    g.text(x(d), Bo + 28, String(d), { font: MONO, size: 12, fill: INK_FAINT });
  }
  g.text(R + 16, Bo + 28, 'días a plena carga', { size: 12, fill: INK_FAINT, anchor: 'start' });

  // legend
  g.rect(L, 84, 14, 14, { fill: AMBER, r: 3 });
  g.text(L + 22, 96, 'factor de planta ≥ 0.75 en la programación semanal', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.rect(L + 400, 84, 14, 14, { fill: TEAL, r: 3 });
  g.text(L + 422, 96, 'factor de planta < 0.75', { size: 12, fill: INK_DIM, anchor: 'start' });

  const rowH = (Bo - T) / 3;
  STOCK.forEach((s, i) => {
    const cy = T + i * rowH + rowH / 2;
    g.text(L - 24, cy - 8, s.cota, { size: 13.5, weight: 600, fill: INK, anchor: 'end' });
    g.text(L - 24, cy + 12, 'cota del embalse', { size: 11.5, fill: INK_FAINT, anchor: 'end' });
    const bh = 22;
    g.rect(L, cy - bh - 6, x(s.alto) - L, bh, { fill: AMBER, r: 3 });
    g.text(x(s.alto) + 12, cy - 10, `${s.alto} días`, { size: 12.5, weight: 600, fill: AMBER, anchor: 'start', font: MONO });
    g.rect(L, cy + 6, x(s.bajo) - L, bh, { fill: TEAL, r: 3 });
    g.text(x(s.bajo) + 12, cy + 22, `${s.bajo} días`, { size: 12.5, weight: 600, fill: TEAL, anchor: 'start', font: MONO });
    if (i < 2) g.line(L - 260, T + (i + 1) * rowH, R, T + (i + 1) * rowH, { stroke: LINE, w: 0.8 });
  });

  g.line(60, 470, 1140, 470, { stroke: LINE });
  g.text(60, 496, 'Para factor de planta menor que 0.75 el piso es el mayor entre los días de la barra y el consumo de la programación semanal más 35 %.', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, 516, 'Quien no lo cumple no recibe una multa: se le penaliza la tasa de salida forzada con horas de indisponibilidad equivalente por déficit de', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, 536, 'combustible, medidas a las 00:00 del lunes, y eso le baja la capacidad firme que cobra (Anexo 04, 9.4, con el Anexo 15).', { size: 12, fill: INK_DIM, anchor: 'start' });

  await writeFile(path.join(OUT, 'inventario-minimo.svg'), g.done());
}

console.log('cadena-costo-combustible.svg, consumo-especifico.svg, semana-combustible.svg, inventario-minimo.svg written to assets/figures/');
console.log(`  PCpep ${PCPEP} USD/MMBtu · CVC ${CVC_EVAL} · CV ${CV_TOTAL} USD/MWh`);
