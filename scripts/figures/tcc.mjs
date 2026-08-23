#!/usr/bin/env node
/**
 * Generates the two figures for the overcurrent-coordination article:
 *
 *   assets/figures/tcc-coordination.svg   time-current curves, log-log
 *   assets/figures/reference-feeder.svg   the one-line of the reference feeder
 *
 *   node scripts/figures/tcc.mjs
 *
 * The curves are COMPUTED from IEEE C37.112, not drawn by eye. That is the
 * whole point of generating them: the article makes a quantitative argument
 * about where the curves sit, so a figure traced by hand would be a decoration
 * that could quietly contradict the text. Every value plotted here comes out of
 * the same equation and the same settings the article prints, and the check at
 * the bottom of this file re-derives the four numbers the article quotes and
 * fails if any of them drifts.
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

/** IEEE C37.112 extremely inverse. */
const EI = { A: 28.2, B: 0.1217, p: 2 };

/** t(I) for one element. Returns null below pickup, where the curve does not exist. */
function tOperate(I, { pickup, td }, k = EI) {
  const M = I / pickup;
  if (M <= 1) return null;
  return (td / 7) * (k.A / (Math.pow(M, k.p) - 1) + k.B);
}

/** The reference feeder's slow curves, exactly as the article's settings table prints them. */
const DEVICES = [
  { id: 'R1', label: 'R1 · head', pickup: 400, td: 6.7, color: AMBER },
  { id: 'R2', label: 'R2', pickup: 200, td: 5.6, color: TEAL },
  { id: 'R3', label: 'R3', pickup: 100, td: 4.0, color: INK },
];

/**
 * Conductor thermal damage, as I²t = K. K is taken from the two numbers the
 * article computes, so the curves cannot disagree with the prose: the trunk at
 * 2.24e8 A²s, and the #4 ACSR tap from its stated 0.37 s at 3 855 A.
 *
 * These are the reason the lower third of the plot is worth drawing. The
 * article's sharpest point is that the binding limit is the smallest conductor
 * in the zone, not the trunk — and on the plot you can see R1's curve pass
 * ABOVE the #4 tap's damage curve at node B, which is the violation stated in
 * the text made visible.
 */
const DAMAGE = [
  // Both are grey, not amber. Amber is R1's colour, and an amber dashed line
  // running beside an amber solid one reads as the same object twice; the dash
  // pattern is what separates these two from each other. Damage limits are
  // reference lines rather than devices, so being visually subordinate to the
  // relay curves is also the correct hierarchy.
  { id: 'trunk', label: '266.8 MCM trunk', K: 2.24e8, dash: '8 5' },
  { id: 'tap', label: '#4 ACSR tap', K: 0.37 * 3855 * 3855, dash: '2 3' },
];

/** Fault currents at each node, from the article's short-circuit table. */
const NODES = [
  { at: 1000, label: '1 000 A', note: 'high-impedance fault', emphasis: true },
  { at: 1839, label: '1 839 A', note: 'node C' },
  { at: 3855, label: '3 855 A', note: 'node B' },
  { at: 10500, label: '10 500 A', note: 'bus' },
];

// ---------------------------------------------------------------- plot frame

const W = 760;
const H = 560;
const M = { top: 18, right: 116, bottom: 52, left: 66 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const I_MIN = 100;
const I_MAX = 20000;
const T_MIN = 0.03;
const T_MAX = 10;

const lx = (I) =>
  M.left + ((Math.log10(I) - Math.log10(I_MIN)) / (Math.log10(I_MAX) - Math.log10(I_MIN))) * PW;
const ly = (t) =>
  M.top + ((Math.log10(T_MAX) - Math.log10(t)) / (Math.log10(T_MAX) - Math.log10(T_MIN))) * PH;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (v) => Math.round(v * 100) / 100;

/** Decade and minor gridlines for a log axis. */
function logTicks(min, max) {
  const out = [];
  for (let d = Math.floor(Math.log10(min)); d <= Math.ceil(Math.log10(max)); d++) {
    for (let m = 1; m <= 9; m++) {
      const v = m * Math.pow(10, d);
      if (v >= min && v <= max) out.push({ v, major: m === 1 });
    }
  }
  return out;
}

function curvePath(dev) {
  const pts = [];
  const start = Math.max(dev.pickup * 1.02, I_MIN);
  const steps = 400;
  for (let i = 0; i <= steps; i++) {
    const I = start * Math.pow(I_MAX / start, i / steps);
    const t = tOperate(I, dev);
    if (t == null || t > T_MAX || t < T_MIN) continue;
    pts.push(`${n(lx(I))},${n(ly(t))}`);
  }
  return pts.length ? 'M' + pts.join(' L') : '';
}

function buildTcc() {
  const s = [];
  s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img"
     aria-label="Time-current curves for R1, R2 and R3 on log-log axes. At 1000 amperes R1 operates in 5.26 seconds.">`);
  s.push(`<rect width="${W}" height="${H}" fill="${PAPER}"/>`);

  // grid
  for (const { v, major } of logTicks(I_MIN, I_MAX)) {
    s.push(
      `<line x1="${n(lx(v))}" y1="${M.top}" x2="${n(lx(v))}" y2="${M.top + PH}" stroke="${
        major ? LINE_2 : LINE
      }" stroke-width="${major ? 1 : 0.5}"/>`
    );
  }
  for (const { v, major } of logTicks(T_MIN, T_MAX)) {
    s.push(
      `<line x1="${M.left}" y1="${n(ly(v))}" x2="${M.left + PW}" y2="${n(ly(v))}" stroke="${
        major ? LINE_2 : LINE
      }" stroke-width="${major ? 1 : 0.5}"/>`
    );
  }

  // axis labels
  for (const I of [100, 1000, 10000]) {
    s.push(
      `<text x="${n(lx(I))}" y="${M.top + PH + 20}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${INK_DIM}">${I.toLocaleString('en-US').replace(/,/g, ' ')}</text>`
    );
  }
  for (const t of [0.1, 1, 10]) {
    s.push(
      `<text x="${M.left - 10}" y="${n(ly(t)) + 4}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${INK_DIM}">${t}</text>`
    );
  }
  s.push(
    `<text x="${n(M.left + PW / 2)}" y="${H - 12}" text-anchor="middle" font-family="${SANS}" font-size="12" fill="${INK_DIM}">Fault current (A)</text>`
  );
  s.push(
    `<text x="16" y="${n(M.top + PH / 2)}" text-anchor="middle" font-family="${SANS}" font-size="12" fill="${INK_DIM}" transform="rotate(-90 16 ${n(M.top + PH / 2)})">Operating time (s)</text>`
  );

  // node markers
  for (const nd of NODES) {
    const x = n(lx(nd.at));
    s.push(
      `<line x1="${x}" y1="${M.top}" x2="${x}" y2="${M.top + PH}" stroke="${
        nd.emphasis ? AMBER : INK_FAINT
      }" stroke-width="${nd.emphasis ? 1.4 : 1}" stroke-dasharray="${nd.emphasis ? '5 3' : '2 4'}"/>`
    );
    s.push(
      `<text x="${x}" y="${M.top - 5}" text-anchor="middle" font-family="${MONO}" font-size="9.5" fill="${
        nd.emphasis ? AMBER : INK_FAINT
      }">${esc(nd.label)}</text>`
    );
  }

  // conductor damage, dashed and behind the relay curves
  for (const dmg of DAMAGE) {
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const I = I_MIN * Math.pow(I_MAX / I_MIN, i / 200);
      const t = dmg.K / (I * I);
      if (t > T_MAX || t < T_MIN) continue;
      pts.push(`${n(lx(I))},${n(ly(t))}`);
    }
    if (!pts.length) continue;
    s.push(
      `<path d="M${pts.join(' L')}" fill="none" stroke="${LINE_2}" stroke-width="1.6" stroke-dasharray="${dmg.dash}"/>`
    );
  }

  // curves
  for (const dev of DEVICES) {
    s.push(
      `<path d="${curvePath(dev)}" fill="none" stroke="${dev.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  // the point the whole article turns on: R1 at 1000 A
  const r1 = DEVICES[0];
  const tBad = tOperate(1000, r1);
  s.push(
    `<circle cx="${n(lx(1000))}" cy="${n(ly(tBad))}" r="5" fill="${PAPER}" stroke="${AMBER}" stroke-width="2.4"/>`
  );
  s.push(
    `<text x="${n(lx(1000)) + 12}" y="${n(ly(tBad)) - 6}" font-family="${MONO}" font-size="12" font-weight="600" fill="${AMBER}">${tBad.toFixed(2)} s</text>`
  );

  // legend, in the right margin
  let ly0 = M.top + 16;
  for (const dev of DEVICES) {
    s.push(
      `<line x1="${M.left + PW + 14}" y1="${ly0}" x2="${M.left + PW + 34}" y2="${ly0}" stroke="${dev.color}" stroke-width="2.4"/>`
    );
    s.push(
      `<text x="${M.left + PW + 40}" y="${ly0 + 4}" font-family="${MONO}" font-size="11" fill="${INK}">${esc(dev.id)}</text>`
    );
    s.push(
      `<text x="${M.left + PW + 14}" y="${ly0 + 19}" font-family="${MONO}" font-size="9.5" fill="${INK_FAINT}">${dev.pickup} A · TD ${dev.td}</text>`
    );
    ly0 += 42;
  }
  ly0 += 4;
  for (const dmg of DAMAGE) {
    s.push(
      `<line x1="${M.left + PW + 14}" y1="${ly0}" x2="${M.left + PW + 34}" y2="${ly0}" stroke="${LINE_2}" stroke-width="1.6" stroke-dasharray="${dmg.dash}"/>`
    );
    s.push(
      `<text x="${M.left + PW + 14}" y="${ly0 + 17}" font-family="${MONO}" font-size="9.5" fill="${INK_FAINT}">${esc(dmg.label)}</text>`
    );
    ly0 += 38;
  }
  s.push(
    `<text x="${M.left + PW + 14}" y="${ly0 + 12}" font-family="${SANS}" font-size="10" fill="${INK_FAINT}">Extremely</text>`
  );
  s.push(
    `<text x="${M.left + PW + 14}" y="${ly0 + 25}" font-family="${SANS}" font-size="10" fill="${INK_FAINT}">inverse, C37.112</text>`
  );

  s.push(
    `<rect x="${M.left}" y="${M.top}" width="${PW}" height="${PH}" fill="none" stroke="${INK}" stroke-width="1.2"/>`
  );
  s.push('</svg>');
  return s.join('\n');
}

// -------------------------------------------------------------- the one-line

function buildFeeder() {
  const w = 760;
  const h = 210;
  const x0 = 84;
  const x1 = 690;
  const y = 84;
  const km = (d) => x0 + (d / 12) * (x1 - x0);

  const pts = [
    { d: 0, node: 'A', dev: 'R1', kind: 'breaker', icc: '10 500 A' },
    { d: 3, node: 'B', dev: 'R2', kind: 'recloser', icc: '3 855 A' },
    { d: 8, node: 'C', dev: 'R3', kind: 'recloser', icc: '1 839 A' },
    { d: 12, node: 'D', dev: 'Fuse', kind: 'fuse', icc: '1 295 A' },
  ];

  const s = [];
  s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img"
     aria-label="Radial 13.8 kV feeder with four nodes: R1 at the substation, R2 at 3 km, R3 at 8 km and a fuse at 12 km.">`);
  s.push(`<rect width="${w}" height="${h}" fill="${PAPER}"/>`);

  // source
  s.push(
    `<line x1="26" y1="${y}" x2="${x0}" y2="${y}" stroke="${INK}" stroke-width="2"/>`
  );
  s.push(`<circle cx="26" cy="${y}" r="9" fill="none" stroke="${INK}" stroke-width="2"/>`);
  s.push(
    `<text x="26" y="${y - 20}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${INK_DIM}">250 MVA</text>`
  );
  s.push(
    `<text x="26" y="${y + 30}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${INK_FAINT}">13.8 kV</text>`
  );

  // trunk
  s.push(`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${INK}" stroke-width="2"/>`);

  for (const p of pts) {
    const x = km(p.d);
    if (p.kind === 'breaker') {
      s.push(
        `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" fill="${PAPER}" stroke="${AMBER}" stroke-width="2.2"/>`
      );
    } else if (p.kind === 'recloser') {
      s.push(
        `<circle cx="${x}" cy="${y}" r="9" fill="${PAPER}" stroke="${AMBER}" stroke-width="2.2"/>`
      );
    } else {
      s.push(
        `<rect x="${x - 5}" y="${y - 11}" width="10" height="22" fill="${PAPER}" stroke="${INK_DIM}" stroke-width="2"/>`
      );
    }
    s.push(
      `<text x="${x}" y="${y - 24}" text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="600" fill="${INK}">${esc(p.dev)}</text>`
    );
    s.push(
      `<text x="${x}" y="${y + 34}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${INK}">${esc(p.node)} · ${p.d} km</text>`
    );
    s.push(
      `<text x="${x}" y="${y + 50}" text-anchor="middle" font-family="${MONO}" font-size="10.5" fill="${TEAL}">${esc(p.icc)}</text>`
    );
  }

  // the ratio annotations that decide whether current grading is available
  const ratios = [
    { from: 0, to: 3, r: '2.72', ok: true },
    { from: 3, to: 8, r: '2.10', ok: true },
    { from: 8, to: 12, r: '1.42', ok: false },
  ];
  for (const r of ratios) {
    const xm = (km(r.from) + km(r.to)) / 2;
    s.push(
      `<text x="${xm}" y="${y + 78}" text-anchor="middle" font-family="${MONO}" font-size="10.5" fill="${
        r.ok ? INK_FAINT : AMBER
      }">×${r.r}</text>`
    );
  }
  s.push(
    `<text x="${x0}" y="${y + 98}" font-family="${SANS}" font-size="10.5" fill="${INK_FAINT}">Fault-current ratio between adjacent nodes. Below 1.5, current grading stops working.</text>`
  );

  s.push('</svg>');
  return s.join('\n');
}

// ------------------------------------------------------------------- checks

/**
 * Re-derive the numbers the article prints. If the settings, the constants or
 * the equation ever drift, this fails loudly instead of shipping a figure that
 * disagrees with the prose beside it.
 */
function check() {
  const [r1, r2, r3] = DEVICES;
  const near = (got, want, tol, what) => {
    if (Math.abs(got - want) > tol) {
      throw new Error(`${what}: figure computes ${got.toFixed(3)}, article states ${want}`);
    }
  };
  near(tOperate(1000, r3), 0.232, 0.001, 'R3 at 1000 A');
  near(tOperate(1000, r2), 1.037, 0.001, 'R2 at 1000 A');
  near(tOperate(1000, r1), 5.26, 0.005, 'R1 at 1000 A');
  near(tOperate(10500, r1), 0.156, 0.001, 'R1 at the bus');
  near(tOperate(1839, r2) - tOperate(1839, r3), 0.25, 0.002, 'margin at node C');
  near(tOperate(3855, r1) - tOperate(3855, r2), 0.252, 0.002, 'margin at node B');
  console.log('  ✓ all six values the article prints re-derive from C37.112');
}

check();
await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, 'tcc-coordination.svg'), buildTcc());
await writeFile(path.join(OUT, 'reference-feeder.svg'), buildFeeder());
console.log('  → assets/figures/tcc-coordination.svg');
console.log('  → assets/figures/reference-feeder.svg');
