#!/usr/bin/env node
/**
 * Generates the two supporting figures for the who-is-who article:
 *
 *   assets/figures/linea-de-tiempo.svg     thirty years of reform, nine dates
 *   assets/figures/contratos-despacho.svg  the contract/dispatch split
 *
 *   node scripts/figures/quien-es-quien.mjs
 *
 * Linea de tiempo. The ticks are EVENLY SPACED, deliberately not to scale: a
 * true scale would pile 2021, 2024 and the two 2026 reforms into the last
 * sixth of the axis and starve the 1999-2008 gap of room, and the point of the
 * figure is the ORDER plus the one gap the article argues about (ROBCP
 * approved 2008, in force 2011), which the caption names outright. Every date
 * comes from a source the article already cites: the LGE copy in normativa/
 * (1996, 2024, both 2026 entries), the ROBCP cover (2008, 2011, and the 1999
 * regulation it displaced), the UT site (1998) and the Asamblea source (2021,
 * July 2026).
 *
 * Contratos-despacho. The article's hardest paragraph is that a contract does
 * not decide which machine runs: the financial plane and the physical plane
 * only meet at settlement. The figure draws the two planes as parallel arrows
 * and the MRS as the place the gap between them is priced. The quantities are
 * an example; the caption says so in bold, per the series' rule.
 *
 * Colours are style.css tokens, hardcoded because the files are referenced
 * with <img> and cannot inherit the page's custom properties. They also match
 * mapa-institucional.svg on purpose: ink is the physical plane, amber the
 * money plane, teal the settlement and information flows, so the three
 * figures read as one set.
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

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function makeSvg(w, h) {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `<rect width="${w}" height="${h}" fill="${PAPER}" />`,
    `<defs>`,
    `<marker id="ah-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${INK}" /></marker>`,
    `<marker id="ah-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${AMBER}" /></marker>`,
    `<marker id="ah-teal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${TEAL}" /></marker>`,
    `</defs>`,
  ];
  return {
    parts,
    text(x, y, s, { size = 12.5, fill = INK_DIM, weight = 400, anchor = 'middle', font = SANS } = {}) {
      parts.push(
        `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`
      );
    },
    line(x1, y1, x2, y2, { stroke = INK, w = 2.4, dash, marker, markerStart } = {}) {
      const d = dash ? ` stroke-dasharray="${dash}"` : '';
      const m = marker ? ` marker-end="url(#ah-${marker})"` : '';
      const ms = markerStart ? ` marker-start="url(#ah-${markerStart})"` : '';
      parts.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}"${d}${m}${ms} />`
      );
    },
    box(x, y, w, h, { stroke = LINE_2, sw = 1.4 } = {}) {
      parts.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${PAPER}" stroke="${stroke}" stroke-width="${sw}" />`
      );
    },
    dot(x, y, r, fill) {
      parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" />`);
    },
    done(name) {
      parts.push(`</svg>`);
      return writeFile(path.join(OUT, name), parts.join('\n')).then(() =>
        console.log(`  → assets/figures/${name}`)
      );
    },
  };
}

// ---------------------------------------------------------------------------
// linea-de-tiempo.svg
// ---------------------------------------------------------------------------

const CAT = { ley: INK, reg: AMBER, regulador: TEAL };

const EVENTS = [
  { year: '1996', l1: 'Ley General de', l2: 'Electricidad (D. 843)', cat: CAT.ley },
  { year: '1998', l1: 'La UT entra', l2: 'en operación', cat: CAT.ley },
  { year: '1999', l1: 'Primer reglamento', l2: 'de operación', cat: CAT.reg },
  { year: '2008', l1: 'Se aprueba', l2: 'el ROBCP', cat: CAT.reg },
  { year: '2011', l1: 'El ROBCP entra', l2: 'en vigencia', cat: CAT.reg },
  { year: '2021', l1: 'Se crea la DGEHM;', l2: 'absorbe al CNE', cat: CAT.ley },
  { year: '2024', l1: 'La DGEHM reforma', l2: 'el ROBCP', cat: CAT.reg },
  { year: '2026', l1: 'abr · LGE: generación', l2: 'distribuida (D. 548)', cat: CAT.ley },
  { year: '2026', l1: 'jul · la regulación', l2: 'pasa a la DGEHM', cat: CAT.regulador },
];

{
  const svg = makeSvg(1200, 460);
  const Y = 250;

  svg.line(40, Y, 1160, Y, { stroke: LINE_2, w: 2 });

  EVENTS.forEach((e, i) => {
    const x = 70 + i * 132.5;
    const up = i % 2 === 0;
    svg.dot(x, Y, 4.5, e.cat);
    if (up) {
      svg.line(x, Y - 6, x, 164, { stroke: LINE_2, w: 1.4 });
      svg.text(x, 120, e.year, { font: MONO, size: 12.5, weight: 600, fill: e.cat });
      svg.text(x, 140, e.l1, { size: 12 });
      svg.text(x, 156, e.l2, { size: 12 });
    } else {
      svg.line(x, Y + 6, x, 336, { stroke: LINE_2, w: 1.4 });
      svg.text(x, 360, e.year, { font: MONO, size: 12.5, weight: 600, fill: e.cat });
      svg.text(x, 380, e.l1, { size: 12 });
      svg.text(x, 396, e.l2, { size: 12 });
    }
  });

  const legend = [
    { x: 70, cat: CAT.ley, label: 'instituciones y leyes' },
    { x: 330, cat: CAT.reg, label: 'reglamento de operación' },
    { x: 640, cat: CAT.regulador, label: 'cambio de regulador' },
  ];
  for (const item of legend) {
    svg.dot(item.x, 438, 4.5, item.cat);
    svg.text(item.x + 14, 442, item.label, { font: MONO, size: 12, fill: INK_FAINT, anchor: 'start' });
  }

  await svg.done('linea-de-tiempo.svg');
}

// ---------------------------------------------------------------------------
// contratos-despacho.svg
// ---------------------------------------------------------------------------

{
  const svg = makeSvg(1200, 520);

  svg.box(60, 170, 250, 140, { stroke: INK, sw: 1.6 });
  svg.text(185, 212, 'Generador', { size: 15, fill: INK, weight: 600 });
  svg.text(185, 236, 'vende con contrato', { size: 12 });

  svg.box(890, 170, 250, 140, { stroke: INK, sw: 1.6 });
  svg.text(1015, 212, 'Distribuidor', { size: 15, fill: INK, weight: 600 });
  svg.text(1015, 236, 'compra para abastecer', { size: 12 });

  // The financial plane: the contract binds the two parties at a agreed price.
  svg.line(310, 205, 886, 205, { stroke: AMBER, marker: 'amber' });
  svg.text(600, 188, 'plano financiero · contrato: 100 MWh a precio pactado', { size: 12.5, fill: AMBER });

  // The physical plane: dispatch decides what actually flows, contract or not.
  svg.line(310, 275, 886, 275, { stroke: INK, marker: 'ink' });
  svg.text(600, 302, 'plano físico · despacho: 80 MWh inyectados', { size: 12.5 });

  // Settlement: the gap between the two planes is priced at the MRS.
  svg.box(450, 390, 300, 80, { stroke: TEAL, sw: 1.6 });
  svg.text(600, 424, 'MRS', { size: 15, fill: INK, weight: 600 });
  svg.text(600, 448, 'precio horario', { size: 12 });

  svg.line(600, 312, 600, 384, { stroke: TEAL, w: 2, dash: '7 5', marker: 'teal', markerStart: 'teal' });
  svg.text(614, 338, 'liquidación: la brecha', { size: 12, fill: TEAL, anchor: 'start' });
  svg.text(614, 356, '(20 MWh) se liquida', { size: 12, fill: TEAL, anchor: 'start' });
  svg.text(614, 374, 'al precio horario', { size: 12, fill: TEAL, anchor: 'start' });

  await svg.done('contratos-despacho.svg');
}
