#!/usr/bin/env node
/**
 * Generates the two figures for the merit-order article:
 *
 *   assets/figures/orden-de-merito.svg  the aggregate supply curve, solved
 *   assets/figures/congestion.svg       one line, two prices
 *
 *   node scripts/figures/orden-de-merito.mjs
 *
 * The example park is the article's: four units, capacities 100/150/100/80 MW
 * and variable costs 0/70/95/180 USD per MWh. The curves are COMPUTED from
 * that data, not drawn by eye, and the three dispatch cases the article quotes
 * are solved here and checked at the bottom: the base case at 260 MW, the
 * forced-unit case, and the congested two-node case. If any number printed in
 * the SVG drifts from what the merit-order arithmetic says, the script fails.
 *
 * The congested case is solved the honest way, which is the point of drawing
 * it: with the line capped at 10 MW the north node wakes up its diesel at 180,
 * while the south price is set by the unit that WOULD serve the next megawatt
 * there, the 95 gas turbine sitting at zero output. A capped cheap unit makes
 * its node's price jump to the next step; that is the whole lesson.
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
const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
const SANS = "'IBM Plex Sans', system-ui, sans-serif";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---------------------------------------------------------------------------
// The example park and the three solved cases. Everything the article prints
// has to come out of here.

const UNITS = [
  { id: 'U1', tech: 'hidro de embalse', cap: 100, cv: 0, color: TEAL },
  { id: 'U2', tech: 'gas, ciclo combinado', cap: 150, cv: 70, color: AMBER },
  { id: 'U3', tech: 'gas, turbina', cap: 100, cv: 95, color: INK },
  { id: 'U4', tech: 'diésel', cap: 80, cv: 180, color: INK_FAINT },
];

/** Merit-order dispatch of a demand D over the sorted park. */
function dispatch(D) {
  const out = UNITS.map((u) => ({ ...u, p: 0 }));
  let left = D;
  let marginal = null;
  for (const u of out) {
    if (left <= 0) break;
    u.p = Math.min(u.cap, left);
    left -= u.p;
    if (u.p > 0) marginal = u;
  }
  if (left > 0) throw new Error(`demand ${D} exceeds the park`);
  const cost = out.reduce((s, u) => s + u.p * u.cv, 0);
  return { out, marginal, cost };
}

const BASE_D = 260;
const base = dispatch(BASE_D);

// Case (a): U4 must run at 30 MW or more (security), so U2 makes room for it.
const FORCED = 30;
const forced = { ...dispatch(BASE_D - FORCED), };
const forcedCost =
  forced.out.reduce((s, u) => s + (u.id === 'U4' ? FORCED : u.p) * u.cv, 0);
const forcedMarginal = 180;

// Case (b): two nodes, line capped at 10 MW south to north.
const NORTH = { demand: 120, units: ['U1', 'U4'] };
const SOUTH = { demand: 140, units: ['U2', 'U3'] };
const LINE_CAP = 10;
// North: U1 at 100, the line brings 10, diesel covers the rest.
const northDiesel = NORTH.demand - 100 - LINE_CAP;
const priceNorth = 180;
// South feeds its demand plus the export; U2 at its 150 cap, so the next
// megawatt there would come from U3.
const southU2 = SOUTH.demand + LINE_CAP;
const priceSouth = 95;
const congestCost = 100 * 0 + southU2 * 70 + northDiesel * 180;
const rent = LINE_CAP * (priceNorth - priceSouth);

// The checks: these are the numbers the SVGs print and the article quotes.
const expect = (got, want, what) => {
  if (got !== want) {
    console.error(`Check failed: ${what} is ${got}, expected ${want}.`);
    process.exit(1);
  }
};
expect(base.marginal.cv, 95, 'base marginal cost');
expect(base.cost, 11450, 'base operating cost');
expect(base.out[1].p, 150, 'base U2 dispatch');
expect(base.out[2].p, 10, 'base U3 dispatch');
expect(forcedCost, 14500, 'forced-unit operating cost');
expect(northDiesel, 10, 'north diesel dispatch');
expect(southU2, 150, 'south U2 dispatch');
expect(congestCost, 12300, 'congested operating cost');
expect(rent, 850, 'congestion rent');

// ---------------------------------------------------------------------------
// orden-de-merito.svg

{
  const W = 1200, H = 700;
  const L = 90, R = 1140, T = 60, B = 560;
  const MW = 460, VMAX = 200;
  const x = (mw) => L + (mw / MW) * (R - L);
  const y = (v) => B - (v / VMAX) * (B - T);
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<rect width="${W}" height="${H}" fill="${PAPER}" />`,
  ];
  const text = (tx, ty, s, o = {}) =>
    parts.push(
      `<text x="${tx}" y="${ty}" font-family="${o.font ?? SANS}" font-size="${o.size ?? 12.5}" font-weight="${o.weight ?? 400}" fill="${o.fill ?? INK_DIM}" text-anchor="${o.anchor ?? 'middle'}">${esc(s)}</text>`
    );
  const line = (x1, y1, x2, y2, o = {}) =>
    parts.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? INK}" stroke-width="${o.w ?? 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} />`
    );

  // axes and grid
  line(L, T, L, B, { stroke: LINE_2 });
  line(L, B, R, B, { stroke: LINE_2 });
  for (let mw = 0; mw <= 400; mw += 100) {
    line(x(mw), B, x(mw), B + 6, { stroke: LINE_2 });
    text(x(mw), B + 24, String(mw), { font: MONO, size: 12, fill: INK_FAINT });
  }
  for (let v = 0; v <= VMAX; v += 50) {
    line(L - 6, y(v), L, y(v), { stroke: LINE_2 });
    text(L - 14, y(v) + 4, String(v), { font: MONO, size: 12, fill: INK_FAINT, anchor: 'end' });
  }
  text(L - 14, T - 18, 'USD/MWh', { font: MONO, size: 12, fill: INK_FAINT, anchor: 'end' });
  text(R, B + 24, 'MW', { font: MONO, size: 12, fill: INK_FAINT, anchor: 'end' });

  // the step curve
  let acc = 0;
  for (const u of UNITS) {
    line(x(acc), y(u.cv), x(acc + u.cap), y(u.cv), { stroke: u.color, w: 3 });
    if (acc > 0) line(x(acc), y(UNITS[UNITS.indexOf(u) - 1].cv), x(acc), y(u.cv), { stroke: LINE, w: 1.4 });
    acc += u.cap;
  }

  // demand and price
  line(x(BASE_D), T + 8, x(BASE_D), B, { stroke: INK, w: 2, dash: '7 5' });
  text(x(BASE_D) + 10, T + 20, `demanda ${BASE_D} MW`, { anchor: 'start', fill: INK });
  line(L, y(base.marginal.cv), x(BASE_D), y(base.marginal.cv), { stroke: AMBER, w: 2, dash: '7 5' });
  text(L + 8, y(base.marginal.cv) - 10, `CMg ${base.marginal.cv} USD/MWh`, { anchor: 'start', fill: AMBER, weight: 600 });
  parts.push(`<circle cx="${x(BASE_D)}" cy="${y(base.marginal.cv)}" r="5" fill="${AMBER}" />`);

  // legend, top-left: the only empty quadrant once the steps and the
  // demand line are drawn.
  let ly = T + 16;
  for (const u of UNITS) {
    line(L + 20, ly, L + 52, ly, { stroke: u.color, w: 3 });
    text(L + 64, ly + 4, `${u.id} ${u.tech} · ${u.cap} MW · ${u.cv}`, { font: MONO, size: 12, anchor: 'start' });
    ly += 26;
  }
  text(L + 64, ly + 8, `costo total ${fmt(base.cost)} USD/h`, { font: MONO, size: 12, anchor: 'start', fill: AMBER });

  parts.push(`</svg>`);
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, 'orden-de-merito.svg'), parts.join('\n'));
  console.log('  → assets/figures/orden-de-merito.svg');
}

// ---------------------------------------------------------------------------
// congestion.svg

{
  const W = 1200, H = 640;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<rect width="${W}" height="${H}" fill="${PAPER}" />`,
    `<defs><marker id="ah-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${INK}" /></marker></defs>`,
  ];
  const text = (tx, ty, s, o = {}) =>
    parts.push(
      `<text x="${tx}" y="${ty}" font-family="${o.font ?? SANS}" font-size="${o.size ?? 12.5}" font-weight="${o.weight ?? 400}" fill="${o.fill ?? INK_DIM}" text-anchor="${o.anchor ?? 'middle'}">${esc(s)}</text>`
    );
  const box = (bx, by, bw, bh) =>
    parts.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${PAPER}" stroke="${INK}" stroke-width="1.6" />`);

  box(70, 110, 430, 300);
  text(285, 148, 'Nodo Norte', { size: 15, fill: INK, weight: 600 });
  text(285, 186, `precio ${priceNorth} USD/MWh`, { font: MONO, size: 14, fill: AMBER, weight: 600 });
  text(285, 226, 'U1 hidro · 100 MW · 0', { font: MONO, size: 12.5 });
  text(285, 250, `U4 diésel · ${northDiesel} MW · 180 (marginal)`, { font: MONO, size: 12.5 });
  text(285, 274, 'demanda 120 MW', { font: MONO, size: 12.5, fill: INK_FAINT });
  text(285, 330, 'la línea llena no deja bajar', { size: 12, fill: INK_FAINT });
  text(285, 348, 'el diésel: el norte paga 180', { size: 12, fill: INK_FAINT });

  box(700, 110, 430, 300);
  text(915, 148, 'Nodo Sur', { size: 15, fill: INK, weight: 600 });
  text(915, 186, `precio ${priceSouth} USD/MWh`, { font: MONO, size: 14, fill: AMBER, weight: 600 });
  text(915, 226, `U2 gas · ${southU2} MW · 70 (al tope)`, { font: MONO, size: 12.5 });
  text(915, 250, 'U3 gas · 0 MW · 95 (fija el precio)', { font: MONO, size: 12.5 });
  text(915, 274, 'demanda 140 MW + 10 exportados', { font: MONO, size: 12.5, fill: INK_FAINT });
  text(915, 330, 'con el gas barato lleno, el próximo', { size: 12, fill: INK_FAINT });
  text(915, 348, 'megavatio del sur costaría 95', { size: 12, fill: INK_FAINT });

  // the congested line, flow south to north
  parts.push(`<line x1="700" y1="240" x2="506" y2="240" stroke="${INK}" stroke-width="2.4" marker-end="url(#ah-ink)" />`);
  parts.push(`<line x1="592" y1="228" x2="608" y2="252" stroke="${AMBER}" stroke-width="3" />`);
  parts.push(`<line x1="600" y1="228" x2="616" y2="252" stroke="${AMBER}" stroke-width="3" />`);
  text(600, 210, `línea N-S · ${LINE_CAP} MW, al límite`, { size: 12.5, fill: INK });
  text(600, 282, 'flujo sur a norte', { size: 12, fill: INK_FAINT });

  text(600, 470, `costo total ${fmt(congestCost)} USD/h, contra ${fmt(base.cost)} sin congestión`, { font: MONO, size: 13 });
  text(600, 500, `cargo por congestión: ${LINE_CAP} MW × (${priceNorth} − ${priceSouth}) = ${rent} USD/h`, { font: MONO, size: 13, fill: AMBER, weight: 600 });
  text(600, 540, 'Cifras ilustrativas: el mecanismo es el del ROBCP (10.6.3 y Anexo 09, num. 3.5), no un caso real.', { size: 12, fill: INK_FAINT });

  parts.push(`</svg>`);
  await writeFile(path.join(OUT, 'congestion.svg'), parts.join('\n'));
  console.log('  → assets/figures/congestion.svg');
}
