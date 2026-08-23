#!/usr/bin/env node
/**
 * Generates the three figures for the programming-horizons article:
 *
 *   assets/figures/horizontes.svg        the three horizons, chained
 *   assets/figures/valor-del-agua.svg    water value against reservoir level
 *   assets/figures/disparadores.svg      what forces a reprogramming
 *
 *   node scripts/figures/horizontes-programacion.mjs
 *
 * The horizons, their coverage and their detail are ROBCP 7.2 to 7.4; the
 * calendar dates are 8.1.2, 8.1.3 and 9.1.1; the triggers are 9.2.1 and
 * 13.10.1. Those are read off the regulation and pinned by the checks below.
 *
 * valor-del-agua.svg is the one figure with invented numbers. The SHAPE is not
 * invented: a reservoir's water value rises as the reservoir empties, and the
 * merit order re-sorts as it crosses each thermal unit's variable cost. The
 * thermal costs it crosses are the same example park as the second article of
 * the series, so the two figures can be read together. The crossing points are
 * SOLVED here, not eyeballed, and checked against what the article prints.
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
const r1 = (n) => Math.round(n * 10) / 10;

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
// The water-value curve and where it crosses the example park.

const VA0 = 200;   // USD/MWh with the reservoir at its useful floor
const K = 3.7;     // decay across the useful volume
const va = (x) => VA0 * Math.exp(-K * x);         // x in [0, 1], fraction of useful volume
const nivel = (v) => -Math.log(v / VA0) / K;      // inverse: level at which VA equals v

// The same four units as the merit-order article.
const PARQUE = [
  { id: 'U2', tech: 'gas, ciclo combinado', cv: 70, color: AMBER },
  { id: 'U3', tech: 'gas, turbina', cv: 95, color: INK },
  { id: 'U4', tech: 'diésel', cv: 180, color: INK_FAINT },
];
const CRUCES = PARQUE.map((u) => ({ ...u, x: nivel(u.cv) }));

const expect = (got, want, what) => {
  if (got !== want) {
    console.error(`Check failed: ${what} is ${got}, expected ${want}.`);
    process.exit(1);
  }
};
expect(r1(CRUCES[0].x * 100), 28.4, 'level where water value equals the CC gas cost');
expect(r1(CRUCES[1].x * 100), 20.1, 'level where water value equals the gas turbine cost');
expect(r1(CRUCES[2].x * 100), 2.8, 'level where water value equals the diesel cost');
expect(r1(va(1)), 4.9, 'water value at a full reservoir');
expect(r1(va(0)), 200, 'water value at the useful floor');

// ---------------------------------------------------------------------------
// horizontes.svg

{
  const W = 1200, H = 740;
  const g = canvas(W, H);
  g.text(60, 38, 'Tres horizontes, no cuatro, y cada uno decide algo que el siguiente ya no puede', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'ROBCP 7.1.2: la UT efectúa una programación anual, una semanal y una diaria. Lo mensual no es un horizonte: es la cadencia con que se actualiza la anual', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const COLS = [
    { x: 150, tag: 'ANUAL', color: TEAL, span: '52 semanas, detalle semanal', ref: 'ROBCP 7.2, 8' },
    { x: 505, tag: 'SEMANAL', color: AMBER, span: '7 días, lunes a domingo, detalle horario', ref: 'ROBCP 7.3, 9' },
    { x: 860, tag: 'DIARIA (PREDESPACHO)', color: INK, span: '24 horas del día siguiente, detalle horario', ref: 'ROBCP 7.4, 10' },
  ];
  const CW = 290;

  const ROWS = [
    {
      label: 'DECIDE',
      h: 96,
      cells: [
        'la política de operación de los\nembalses y el programa anual de\nmantenimientos mayores',
        'el valor del agua de la semana y\nqué unidades se comprometen,\ncon arranques y mínimos técnicos',
        'la inyección de cada unidad hora\npor hora y los servicios auxiliares\nque acompañan al despacho',
      ],
    },
    {
      label: 'INSUMOS',
      h: 128,
      cells: [
        'hidrología histórica y pronóstico de\ncaudales, proyección de demanda,\ndatos técnicos, PAMM aprobado,\nprecios de combustible constantes\npara todo el horizonte',
        'pronóstico determinístico de\ncaudales, vientos e irradiación,\ndemanda horaria por barra,\ncostos variables vigentes,\ncostos de arranque',
        'la programación semanal del día,\nactualizada con la información\nmás reciente, ofertas de retiro de\noportunidad y transacciones\nregionales coordinadas con el EOR',
      ],
    },
    {
      label: 'PRODUCTO',
      h: 128,
      cells: [
        'generación por central, cotas de\nembalse, riesgos de déficit y una\nproyección de costo marginal en\ntres hidrologías: 20 %, 50 % y 90 %\nde probabilidad de excedencia',
        'despacho horario, costos\nmarginales horarios por MRS,\nlíneas congestionadas con su\ncosto asociado y políticas ante\ncontingencias',
        'programa de inyección y retiro por\nintervalo, costo marginal ex ante\nde carácter indicativo, y los\nprogramas de racionamiento\nforzado previstos, de existir',
      ],
    },
    {
      label: 'CUÁNDO',
      h: 108,
      cells: [
        'informe anual al 1 de mayo, de la\nsemana 20 a la 19 del año\nsiguiente. Actualización mensual\nel viernes previo a cada mes',
        'cada semana, con reprogramación\nsi cambian de forma significativa\nlos caudales, la disponibilidad o\nlas transacciones regionales',
        'cada día, con redespacho si se\nrompen las condiciones previstas\nen el predespacho definitivo',
      ],
    },
  ];

  let y = 120;
  COLS.forEach((c) => {
    g.rect(c.x, y, CW, 3, { fill: c.color, r: 1.5 });
    g.text(c.x, y + 24, c.tag, { size: 11.5, weight: 600, fill: c.color, anchor: 'start', spacing: '0.08em' });
    g.text(c.x, y + 44, c.span, { size: 12, fill: INK_DIM, anchor: 'start' });
    g.text(c.x + CW, y + 24, c.ref, { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });
  });
  y += 62;

  ROWS.forEach((row, ri) => {
    g.line(40, y, 1160, y, { stroke: LINE, w: 1 });
    COLS.forEach((c) => {
      if (ri % 2 === 0) g.rect(c.x - 12, y + 2, CW + 24, row.h - 6, { fill: WASH, r: 5 });
    });
    g.text(60, y + 24, row.label, { size: 10.5, weight: 600, fill: INK_FAINT, anchor: 'start', spacing: '0.08em' });
    COLS.forEach((c, ci) => {
      row.cells[ci].split('\n').forEach((ln, k) =>
        g.text(c.x, y + 40 + k * 17, ln, { size: 12, fill: ri === 0 ? INK : INK_DIM, weight: ri === 0 ? 500 : 400, anchor: 'start' })
      );
    });
    y += row.h;
  });
  g.line(40, y, 1160, y, { stroke: LINE, w: 1 });

  // the chaining arrows, drawn between the column headers
  [0, 1].forEach((i) => {
    const x1 = COLS[i].x + CW + 16, x2 = COLS[i + 1].x - 16;
    g.line(x1, 144, x2, 144, { stroke: LINE_2, w: 1.6, marker: 'ah-dim' });
  });

  // the feedback arrow, running back along the bottom
  g.line(COLS[2].x + CW / 2, y + 16, COLS[0].x + CW / 2, y + 16, { stroke: TEAL, w: 1.6, dash: '5 5', marker: 'ah-teal' });
  g.text(620, y + 42, 'La operación real vuelve al principio: los caudales medidos, las cotas alcanzadas y las salidas forzadas entran a la siguiente actualización', { size: 12, fill: INK_DIM });
  g.text(620, y + 60, 'mensual de la anual, y un vertimiento no previsto obliga a reprogramar la semana en curso (13.10.2).', { size: 12, fill: INK_DIM });

  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, 'horizontes.svg'), g.done());
}

// ---------------------------------------------------------------------------
// valor-del-agua.svg

{
  const W = 1200, H = 700;
  const L = 100, R = 980, T = 130, Bo = 540;
  const g = canvas(W, H);
  const VMAX = 210;
  const x = (f) => L + f * (R - L);
  const y = (v) => Bo - (v / VMAX) * (Bo - T);

  g.text(60, 38, 'El agua no tiene precio: tiene costo de oportunidad, y sube cuando el embalse baja', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'por eso una hidro de embalse se mueve dentro del orden de mérito sin que nadie cambie una declaración', { size: 12, fill: INK_FAINT, anchor: 'start' });

  // axes
  g.line(L, T - 20, L, Bo, { stroke: LINE_2 });
  g.line(L, Bo, R, Bo, { stroke: LINE_2 });
  for (let f = 0; f <= 1.001; f += 0.2) {
    g.line(x(f), Bo, x(f), Bo + 6, { stroke: LINE_2 });
    g.text(x(f), Bo + 24, `${Math.round(f * 100)} %`, { font: MONO, size: 12, fill: INK_FAINT });
  }
  g.text(R, Bo + 48, 'volumen útil del embalse', { size: 12, fill: INK_FAINT, anchor: 'end' });
  for (let v = 0; v <= VMAX; v += 50) {
    g.line(L - 6, y(v), L, y(v), { stroke: LINE_2 });
    g.text(L - 14, y(v) + 4, String(v), { font: MONO, size: 12, fill: INK_FAINT, anchor: 'end' });
  }
  g.text(L - 14, T - 46, 'valor', { size: 12, fill: TEAL, anchor: 'end', weight: 600 });
  g.text(L - 14, T - 31, 'del agua', { size: 12, fill: TEAL, anchor: 'end', weight: 600 });
  g.text(L - 14, T - 15, 'USD/MWh', { font: MONO, size: 11.5, fill: INK_FAINT, anchor: 'end' });

  // the thermal costs it crosses, as bands
  const bands = [
    { from: 0, to: 70, label: 'la hidro entra antes que el gas de ciclo combinado', fill: '#f2f6f7' },
    { from: 70, to: 95, label: 'entre las dos máquinas de gas', fill: '#eef1f3' },
    { from: 95, to: 180, label: 'después del gas, antes del diésel', fill: '#eaedf0' },
    { from: 180, to: VMAX, label: 'más cara que el diésel: el agua se guarda', fill: '#e4e7eb' },
  ];
  bands.forEach((b) => {
    g.rect(L, y(b.to), R - L, y(b.from) - y(b.to), { fill: b.fill, r: 0 });
    g.text(R - 12, (y(b.from) + y(b.to)) / 2 + 4, b.label, { size: 11.5, fill: INK_FAINT, anchor: 'end' });
  });

  PARQUE.forEach((u) => {
    g.line(L, y(u.cv), R, y(u.cv), { stroke: u.color, w: 1.6, dash: '6 4' });
    g.text(R + 12, y(u.cv) + 4, `${u.id}  ${u.cv}`, { font: MONO, size: 12, fill: u.color, anchor: 'start', weight: 600 });
    g.text(R + 12, y(u.cv) + 19, u.tech, { size: 11, fill: INK_FAINT, anchor: 'start' });
  });

  // the curve
  const pts = [];
  for (let f = 0; f <= 1.0001; f += 0.005) pts.push(`${x(f).toFixed(1)},${y(Math.min(va(f), VMAX)).toFixed(1)}`);
  g.raw(`<polyline points="${pts.join(' ')}" fill="none" stroke="${TEAL}" stroke-width="3.2" />`);

  // the crossings
  CRUCES.forEach((c) => {
    g.dot(x(c.x), y(c.cv), 6, PAPER);
    g.raw(`<circle cx="${x(c.x).toFixed(1)}" cy="${y(c.cv).toFixed(1)}" r="5.5" fill="none" stroke="${TEAL}" stroke-width="2.4" />`);
    g.line(x(c.x), y(c.cv), x(c.x), Bo, { stroke: TEAL, w: 1.1, dash: '3 4' });
    g.text(x(c.x), Bo + 44, `${r1(c.x * 100)} %`, { font: MONO, size: 12, weight: 600, fill: TEAL });
  });

  // the spill rule
  g.rect(L + 24, T - 6, 360, 74, { fill: PAPER, stroke: LINE, r: 6 });
  g.text(L + 40, T + 18, 'Y una discontinuidad que no es un error', { size: 12.5, weight: 600, fill: INK, anchor: 'start' });
  g.text(L + 40, T + 38, 'si la central está vertiendo, el valor del agua de ese', { size: 11.5, fill: INK_DIM, anchor: 'start' });
  g.text(L + 40, T + 54, 'intervalo es cero, sin importar la cota (Anexo 09, 3.1.12)', { size: 11.5, fill: INK_DIM, anchor: 'start' });

  g.line(60, 606, 1140, 606, { stroke: LINE });
  g.text(60, 632, 'La curva no la dibuja nadie a mano: sale de simular la operación del sistema por el año hidrológico en curso más dos completos, y es la derivada', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 650, 'de la función de costo futuro respecto del volumen al final de la semana (ROBCP 9.5.2 y 9.5.3). Solo se calcula para embalses que puedan generar', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 668, 'al menos siete días a plena capacidad (9.5.5); las centrales de pasada no tienen valor del agua (9.5.4).', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 690, 'Curva ilustrativa. Los costos térmicos son los del parque de ejemplo del segundo artículo de la serie, no los de El Salvador.', { size: 11.5, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'valor-del-agua.svg'), g.done());
}

// ---------------------------------------------------------------------------
// disparadores.svg

{
  const W = 1200, H = 520;
  const g = canvas(W, H);
  g.text(60, 38, 'Qué rompe un programa ya publicado', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'los dos mecanismos de corrección no son intercambiables: uno rehace la semana, el otro rehace lo que queda del día', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const CARDS = [
    {
      x: 60, color: AMBER, tag: 'REPROGRAMACIÓN SEMANAL', ref: 'ROBCP 9.2.1',
      lead: 'Vale por el resto de la semana en curso',
      items: [
        'La generación hidroeléctrica acumulada desde el\ninicio de la semana difiere en más de 5 % de la\nprogramada para el mismo período',
        'Cambios significativos en caudales afluentes,\ndisponibilidad de unidades o líneas, o en las\ntransacciones regionales, que muevan el valor del agua',
        'El propietario de una central señala riesgo de\nvertimiento o de agotamiento del embalse no previsto',
      ],
    },
    {
      x: 620, color: INK, tag: 'REDESPACHO', ref: 'ROBCP 13.10.1',
      lead: 'Vale para lo que resta del día',
      items: [
        'Indisponibilidad confirmada de una unidad con energía\nasignada, por tres intervalos consecutivos o más, que\nrepresente al menos el margen de reserva rodante',
        'Diferencia entre demanda pronosticada y real mayor\nque el porcentaje de reserva rodante',
        'Indisponibilidad de un elemento de transmisión por\nmás de cuatro intervalos consecutivos que afecte los\nparámetros de operación normal',
        'Solicitudes o redespachos en el mercado regional que\nafecten las transacciones programadas',
      ],
    },
  ];

  const CW = 520;
  CARDS.forEach((c) => {
    g.rect(c.x, 92, CW, 300, { fill: WASH, stroke: LINE, r: 8 });
    g.rect(c.x, 92, CW, 3, { fill: c.color, r: 1.5 });
    g.text(c.x + 22, 122, c.tag, { size: 11.5, weight: 600, fill: c.color, anchor: 'start', spacing: '0.08em' });
    g.text(c.x + CW - 22, 122, c.ref, { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });
    g.text(c.x + 22, 146, c.lead, { size: 13, weight: 600, fill: INK, anchor: 'start' });
    let iy = 178;
    c.items.forEach((it) => {
      g.dot(c.x + 27, iy - 4, 3, c.color);
      it.split('\n').forEach((ln, k) => g.text(c.x + 42, iy + k * 16, ln, { size: 11.5, fill: INK_DIM, anchor: 'start' }));
      iy += it.split('\n').length * 16 + 16;
    });
  });

  // the one that is neither
  g.rect(60, 412, 1080, 76, { fill: PAPER, stroke: LINE_2, r: 8 });
  g.text(82, 440, 'Y un caso que no dispara ninguno de los dos', { size: 13, weight: 600, fill: INK, anchor: 'start' });
  g.text(82, 462, 'Si los caudales reales se desvían de los pronosticados y las cotas se apartan de lo esperado, pero el propietario no prevé vertimiento, no hace falta', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(82, 480, 'redespachar en tiempo real: el ajuste se programa en los predespachos de los días siguientes (13.10.3).', { size: 12, fill: INK_DIM, anchor: 'start' });

  await writeFile(path.join(OUT, 'disparadores.svg'), g.done());
}

console.log('horizontes.svg, valor-del-agua.svg, disparadores.svg written to assets/figures/');
console.log(`  cruces del valor del agua: ${CRUCES.map((c) => `${c.id} a ${r1(c.x * 100)} %`).join(', ')}`);
