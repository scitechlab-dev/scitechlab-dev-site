#!/usr/bin/env node
/**
 * Generates the institutional map for the who-is-who article:
 *
 *   assets/figures/mapa-institucional.svg
 *
 *   node scripts/figures/mapa-institucional.mjs
 *
 * The figure is the study exercise the first module of the plan sets: the
 * actors, the energy flows, the money flows and the information flows, on one
 * page, reproducible on a whiteboard from memory. Nothing here is computed —
 * it is a topology, not a plot — but it is still generated rather than drawn
 * in a graphics tool, for the same reason as the other figures: the labels
 * must stay word-for-word consistent with the article, and a checked-in
 * generator is what makes that diff-able.
 *
 * Layout logic. Three horizontal layers: the state (DGEHM) on top, the
 * operator and its two markets in the middle, the participants at the bottom,
 * with ETESAL's grid as the bus between the operator and the participants.
 * The three flows are separated by colour AND by route, so they never fight
 * for the same corridor: energy (ink, solid) crosses the bus where it
 * physically must; money (amber, solid) loops around the outside margins,
 * buyers up to the UT and the UT down to the generators; information (teal,
 * dashed) runs between the generators and the UT. Routing the money loop
 * around the margins is deliberate — payments do not flow through the
 * transmission network, and drawing them through it would say they do.
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
const LINE_2 = '#b4b9c2';
const AMBER = '#8a5200';
const TEAL = '#0e7490';
const PAPER = '#ffffff';
const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
const SANS = "'IBM Plex Sans', system-ui, sans-serif";

const W = 1200;
const H = 800;

/** Escape the one character in the labels that XML cares about. */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const parts = [];

function box(x, y, w, h, { stroke = LINE_2, sw = 1.4 } = {}) {
  parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${PAPER}" stroke="${stroke}" stroke-width="${sw}" />`
  );
}

function label(x, y, s, { size = 12.5, fill = INK_DIM, weight = 400, anchor = 'middle', font = SANS } = {}) {
  parts.push(
    `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`
  );
}

function line(x1, y1, x2, y2, { stroke = INK, w = 2.4, dash, marker = 'ink' } = {}) {
  const d = dash ? ` stroke-dasharray="${dash}"` : '';
  parts.push(
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}"${d} marker-end="url(#ah-${marker})" />`
  );
}

function polyline(pts, { stroke = AMBER, w = 2.4, marker = 'amber' } = {}) {
  parts.push(
    `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${w}" marker-end="url(#ah-${marker})" />`
  );
}

// ---------------------------------------------------------------------------

parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
  `<rect width="${W}" height="${H}" fill="${PAPER}" />`,
  `<defs>`,
  `<marker id="ah-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${INK}" /></marker>`,
  `<marker id="ah-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${AMBER}" /></marker>`,
  `<marker id="ah-teal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${TEAL}" /></marker>`,
  `</defs>`
);

// --- the state -------------------------------------------------------------

box(440, 30, 320, 78, { stroke: INK, sw: 1.6 });
label(600, 62, 'DGEHM', { size: 15.5, fill: INK, weight: 600 });
label(600, 86, 'política sectorial · regulación y supervisión', { size: 12.5 });

line(600, 108, 600, 162);
label(614, 142, 'aprueba el ROBCP y supervisa', { anchor: 'start' });

// --- the operator and its two markets ---------------------------------------

box(300, 166, 600, 178, { stroke: INK, sw: 1.6 });
label(600, 196, 'Unidad de Transacciones (UT)', { size: 15.5, fill: INK, weight: 600 });
label(600, 217, 'sociedad privada · opera el sistema y administra el mercado mayorista', { size: 12.5 });

box(322, 234, 270, 92);
label(457, 266, 'Mercado de Contratos', { size: 13.5, fill: INK, weight: 600 });
label(457, 288, 'bilaterales, a plazo', { size: 12 });

box(608, 234, 270, 92);
label(743, 266, 'MRS', { size: 13.5, fill: INK, weight: 600 });
label(743, 288, 'balance de corto plazo', { size: 12 });
label(743, 306, 'precio horario', { size: 12 });

// --- the grid ----------------------------------------------------------------
// ETESAL is drawn AS the bus rather than as another box: it owns the physical
// network, so representing it as the network keeps the map honest about which
// of the four titulares is a flow and which are institutions.

parts.push(
  `<line x1="150" y1="468" x2="1108" y2="468" stroke="${INK}" stroke-width="2" />`,
  `<line x1="150" y1="474" x2="1108" y2="474" stroke="${INK}" stroke-width="2" />`
);
label(629, 452, 'red de transmisión · propiedad de ETESAL · 115 y 230 kV', { size: 12.5 });

// --- the participants ---------------------------------------------------------

box(70, 580, 240, 112);
label(190, 616, 'Generadores', { size: 14.5, fill: INK, weight: 600 });
label(190, 640, 'inyectan energía al sistema', { size: 12 });

box(350, 580, 240, 112);
label(470, 616, 'Distribuidores', { size: 14.5, fill: INK, weight: 600 });
label(470, 640, 'entregan a usuarios finales', { size: 12 });

box(630, 580, 240, 112);
label(750, 616, 'Comercializadores', { size: 14.5, fill: INK, weight: 600 });
label(750, 640, 'compran para revender', { size: 12 });

box(910, 580, 228, 112);
label(1024, 616, 'Grandes usuarios', { size: 14.5, fill: INK, weight: 600 });
label(1024, 640, 'compran para uso propio', { size: 12 });

// --- energy: generators in, demand out, all through the bus --------------------

line(190, 580, 190, 478);
line(470, 474, 470, 576);
line(1024, 474, 1024, 576);

// --- information: declarations up, dispatch down --------------------------------

line(268, 580, 404, 346, { stroke: TEAL, w: 2, dash: '7 5', marker: 'teal' });
line(368, 346, 212, 576, { stroke: TEAL, w: 2, dash: '7 5', marker: 'teal' });
label(311, 528, 'declaraciones de costos', { size: 12, fill: TEAL, anchor: 'start' });
label(242, 528, 'programación y despacho', { size: 12, fill: TEAL, anchor: 'end' });

// --- money: buyers pay the market, the market settles with the generators --------
// Routed around the margins on purpose, so the loop never touches the grid.

polyline('1138,636 1164,636 1164,254 902,254');
polyline('300,254 36,254 36,636 66,636');

parts.push(
  `<text x="1182" y="445" font-family="${SANS}" font-size="12" fill="${AMBER}" text-anchor="middle" transform="rotate(-90 1182 445)">pagos de compradores</text>`,
  `<text x="18" y="445" font-family="${SANS}" font-size="12" fill="${AMBER}" text-anchor="middle" transform="rotate(-90 18 445)">liquidación a generadores</text>`
);

// --- legend ----------------------------------------------------------------------

const legend = [
  { x: 70, stroke: INK, dash: '', text: 'flujo de energía' },
  { x: 330, stroke: AMBER, dash: '', text: 'flujo de dinero' },
  { x: 590, stroke: TEAL, dash: '7 5', text: 'flujo de información' },
];
for (const item of legend) {
  const d = item.dash ? ` stroke-dasharray="${item.dash}"` : '';
  parts.push(
    `<line x1="${item.x}" y1="744" x2="${item.x + 56}" y2="744" stroke="${item.stroke}" stroke-width="2.4"${d} />`,
    `<text x="${item.x + 68}" y="748" font-family="${MONO}" font-size="12" fill="${INK_FAINT}">${esc(item.text)}</text>`
  );
}

parts.push(`</svg>`);

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, 'mapa-institucional.svg'), parts.join('\n'));
console.log('  → assets/figures/mapa-institucional.svg');
