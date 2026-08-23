#!/usr/bin/env node
/**
 * Generates the three figures for the regional-market article:
 *
 *   assets/figures/predespacho-regional.svg  the two passes, and how a link
 *                                            enters the national model
 *   assets/figures/piso-oferta-mer.svg       the floor under an export offer
 *   assets/figures/recorrido-mwh.svg         one MWh, from program to invoice
 *
 *   node scripts/figures/mercado-regional.mjs
 *
 * The mechanism is ROBCP chapter 11 and chapter 18. The two modelling rules
 * (an exporting link is an inflexible demand at the link node, an importing
 * link an inflexible generator) are 11.5.4 and 11.5.5, verbatim. The offer
 * floor is 11.4.4.1.1.
 *
 * piso-oferta-mer.svg carries the same example unit as articles III and IV of
 * the series: a 60 MW fuel-oil machine whose CVC came out at 119.64 USD/MWh and
 * whose CVNC, once indexed and adjusted for the real dispatch, came out at
 * 8.47. Those two numbers are NOT retyped here as a total: the total is summed
 * from them, and checked, so the three articles cannot drift apart.
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
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 4}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? 'none'}" stroke-width="${o.w ?? 1.2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} />`
      ),
    dot: (x, y, r, fill) => parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" />`),
    done: () => (parts.push('</svg>'), parts.join('\n')),
  };
}

// ---------------------------------------------------------------------------
// The offer floor, built from the same unit as the two previous articles.

const CVC = 119.64;      // artículo III: consumo específico por PCpep
const CVNC_AJ = 8.47;    // artículo IV: indexado y ajustado por despacho real
const CSIS = 7.20;       // promedio horario del último DTE, ilustrativo
const CV = r2(CVC + CVNC_AJ);
const PISO = r2(CV + CSIS);
const PRECIO_MER = 148.00; // ilustrativo
const MARGEN = r2(PRECIO_MER - PISO);

const expect = (got, want, what) => {
  if (got !== want) {
    console.error(`Check failed: ${what} is ${got}, expected ${want}.`);
    process.exit(1);
  }
};
expect(CV, 128.11, 'variable cost of the example unit');
expect(PISO, 135.31, 'offer floor');
expect(MARGEN, 12.69, 'margin over the floor');

// ---------------------------------------------------------------------------
// predespacho-regional.svg

{
  const W = 1200, H = 700;
  const g = canvas(W, H);
  g.text(60, 38, 'El predespacho se corre dos veces, y la segunda ya tiene al MER adentro', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'ROBCP 10.1.3 y 11.5: primero un predespacho nacional inicial sin transacciones regionales, después el definitivo con lo que el EOR casó', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const STEPS = [
    { tag: '1', color: TEAL, title: 'Predespacho inicial', body: 'sin transacciones regionales.\nSale un despacho, un costo\nmarginal y, unidad por unidad,\ncuánta energía queda sin\nrequerir', ref: 'ROBCP 10.1.3' },
    { tag: '2', color: AMBER, title: 'Ofertas al MER', body: 'los participantes ofertan lo\nno requerido, con piso de\nprecio, y la UT las traslada al\nEOR. Lo hidráulico, solo si\nestá vertiendo', ref: 'ROBCP 11.4.4.1' },
    { tag: '3', color: AMBER, title: 'El EOR casa el MER', body: 'devuelve, por enlace, el\nprograma de importación o\nexportación. Primero los\ncontratos firmes, después los\nflexibles, al final oportunidad', ref: 'ROBCP 11.3.4' },
    { tag: '4', color: INK, title: 'Predespacho definitivo', body: 'la UT vuelve a correr el SAM\ncon los enlaces adentro y\nverifica las restricciones\ntécnicas que la inclusión\nprovoque', ref: 'ROBCP 11.5.6' },
  ];
  const SW = 244, SGAP = 34;
  STEPS.forEach((s, i) => {
    const sx = 60 + i * (SW + SGAP);
    g.rect(sx, 96, SW, 160, { fill: WASH, stroke: LINE, r: 7 });
    g.rect(sx, 96, SW, 3, { fill: s.color, r: 1.5 });
    g.dot(sx + 20, 124, 11, s.color);
    g.text(sx + 20, 129, s.tag, { size: 12, weight: 600, fill: PAPER });
    g.text(sx + 38, 129, s.title, { size: 12.5, weight: 600, fill: INK, anchor: 'start' });
    s.body.split('\n').forEach((ln, k) => g.text(sx + 16, 154 + k * 15, ln, { size: 11, fill: INK_DIM, anchor: 'start' }));
    g.text(sx + SW - 14, 246, s.ref, { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });
    if (i < 3) g.line(sx + SW + 4, 176, sx + SW + SGAP - 4, 176, { stroke: LINE_2, w: 1.6, marker: 'ah-dim' });
  });

  // the two modelling rules
  g.text(60, 300, 'Y una vez casado, un enlace deja de ser una frontera y pasa a ser un elemento más del modelo', { size: 14, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 322, 'esta es la parte que hace que la importación afecte al orden de mérito nacional sin ninguna regla especial', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const CASES = [
    {
      x: 60, color: AMBER, tag: 'ENLACE EXPORTADOR', ref: 'ROBCP 11.5.4',
      rule: 'se modela como una demanda inflexible en el nodo de enlace',
      effect: 'La demanda nacional sube. El despacho tiene que subir por la curva\nde oferta, así que el costo marginal nacional sube con ella.',
      arrow: 'out',
    },
    {
      x: 620, color: TEAL, tag: 'ENLACE IMPORTADOR', ref: 'ROBCP 11.5.5',
      rule: 'se modela como un generador inflexible en el nodo de enlace',
      effect: 'Entra generación que el orden de mérito no tiene que despachar.\nDesplaza a la unidad más cara en línea y el costo marginal baja.',
      arrow: 'in',
    },
  ];
  const KW = 520;
  CASES.forEach((c) => {
    g.rect(c.x, 348, KW, 214, { fill: PAPER, stroke: LINE, r: 8 });
    g.rect(c.x, 348, KW, 3, { fill: c.color, r: 1.5 });
    g.text(c.x + 22, 378, c.tag, { size: 11.5, weight: 600, fill: c.color, anchor: 'start', spacing: '0.08em' });
    g.text(c.x + KW - 22, 378, c.ref, { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });

    // a small node sketch, centred on its own row
    const cx = c.x + KW / 2, ny = 424;
    g.rect(cx - 42, ny - 17, 84, 34, { fill: WASH, stroke: LINE_2, r: 5 });
    g.text(cx, ny + 5, 'nodo RTR', { size: 11, fill: INK_DIM });
    if (c.arrow === 'out') {
      g.line(cx + 48, ny, cx + 104, ny, { stroke: c.color, w: 2.2, marker: 'ah-amber' });
      g.raw(`<rect x="${cx + 110}" y="${ny - 18}" width="32" height="36" rx="4" fill="none" stroke="${c.color}" stroke-width="2" stroke-dasharray="4 3" />`);
      g.text(cx + 126, ny + 36, 'demanda inflexible', { size: 10.5, fill: c.color, weight: 600 });
      g.text(cx + 76, ny - 12, 'exporta', { size: 11, fill: c.color, weight: 600 });
    } else {
      g.raw(`<circle cx="${cx - 126}" cy="${ny}" r="17" fill="none" stroke="${c.color}" stroke-width="2" stroke-dasharray="4 3" />`);
      g.text(cx - 126, ny + 36, 'generador inflexible', { size: 10.5, fill: c.color, weight: 600 });
      g.line(cx - 104, ny, cx - 48, ny, { stroke: c.color, w: 2.2, marker: 'ah-teal' });
      g.text(cx - 76, ny - 12, 'importa', { size: 11, fill: c.color, weight: 600 });
    }

    g.text(c.x + 22, 486, c.rule, { size: 12.5, weight: 600, fill: INK, anchor: 'start' });
    c.effect.split('\n').forEach((ln, k) => g.text(c.x + 22, 510 + k * 17, ln, { size: 11.5, fill: INK_DIM, anchor: 'start' }));
    g.text(c.x + 22, 552, 'el valor programado por el EOR entra tal cual: no se re-optimiza', { size: 11, fill: INK_FAINT, anchor: 'start' });
  });

  g.line(60, 596, 1140, 596, { stroke: LINE });
  g.text(60, 622, 'Cuando el sistema nacional queda en déficit, la UT presenta a nombre de quienes retiran una oferta de Retiro Regional para sustitución de déficit,', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 640, 'y su precio es el del último escalón despachado de la unidad de racionamiento forzado (11.4.6). Importar para no racionar se paga al precio del', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 658, 'racionamiento que se evitó, que es el único precio que hace la comparación honesta.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, 'predespacho-regional.svg'), g.done());
}

// ---------------------------------------------------------------------------
// piso-oferta-mer.svg

{
  const W = 1200, H = 600;
  const g = canvas(W, H);
  g.text(60, 38, 'Nadie puede exportar por debajo de su propio costo validado', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'ROBCP 11.4.4.1.1: la oferta de inyección regional debe ser mayor o igual al costo variable que la UT usó en el predespacho inicial, más los Csis', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const L = 300, R = 1080, T = 120, Bo = 420;
  const VMAX = 160;
  const x = (v) => L + (v / VMAX) * (R - L);

  const SEGS = [
    { v: CVC, color: TEAL, label: 'CVC', sub: 'consumo específico × PCpep', art: 'artículo III' },
    { v: CVNC_AJ, color: AMBER, label: 'CVNC', sub: 'indexado y ajustado', art: 'artículo IV' },
    { v: CSIS, color: INK_FAINT, label: 'Csis', sub: 'promedio horario del DTE', art: 'artículo II' },
  ];

  // the stacked bar
  let acc = 0;
  const BY = 200, BH = 56;
  SEGS.forEach((s) => {
    g.rect(x(acc), BY, x(acc + s.v) - x(acc), BH, { fill: s.color, r: 0 });
    acc += s.v;
  });
  // Labels go on a single row below, evenly spaced, with a leader from each
  // segment. Two of the three segments are narrow, so centring the labels on
  // them puts the text on top of itself.
  acc = 0;
  SEGS.forEach((s, i) => {
    const cx = (x(acc) + x(acc + s.v)) / 2;
    const ax = L + (i + 0.5) * ((R - L) / 3);
    const y0 = BY + BH + 4, y1 = BY + BH + 18, y2 = BY + BH + 32;
    g.raw(`<polyline points="${cx},${y0} ${cx},${y1} ${ax},${y2} ${ax},${y2 + 8}" fill="none" stroke="${s.color}" stroke-width="1.2" />`);
    g.text(ax, y2 + 26, `${s.label}  ${s.v.toFixed(2)}`, { font: MONO, size: 12.5, weight: 600, fill: s.color });
    g.text(ax, y2 + 43, s.sub, { size: 11, fill: INK_FAINT });
    g.text(ax, y2 + 58, s.art, { size: 10.5, font: MONO, fill: INK_FAINT });
    acc += s.v;
  });

  // the floor mark
  g.line(x(PISO), BY - 34, x(PISO), BY + BH + 8, { stroke: INK, w: 2 });
  g.text(x(PISO), BY - 42, `piso  ${PISO} USD/MWh`, { font: MONO, size: 13.5, weight: 600, fill: INK, anchor: 'end' });

  // scale
  g.line(L, Bo, R, Bo, { stroke: LINE_2 });
  for (let v = 0; v <= VMAX; v += 40) {
    g.line(x(v), Bo, x(v), Bo + 6, { stroke: LINE_2 });
    g.text(x(v), Bo + 24, String(v), { font: MONO, size: 12, fill: INK_FAINT });
  }
  g.text(R + 18, Bo + 24, 'USD/MWh', { font: MONO, size: 12, fill: INK_FAINT, anchor: 'start' });

  // the two outcomes
  g.line(x(PRECIO_MER), BY - 70, x(PRECIO_MER), Bo, { stroke: TEAL, w: 2, dash: '6 4' });
  g.text(x(PRECIO_MER) + 10, BY - 62, `precio del MER  ${PRECIO_MER.toFixed(2)}`, { font: MONO, size: 12.5, weight: 600, fill: TEAL, anchor: 'start' });
  g.text(x(PRECIO_MER) + 10, BY - 45, `margen  ${MARGEN.toFixed(2)}`, { font: MONO, size: 12, fill: TEAL, anchor: 'start' });
  g.raw(`<rect x="${x(PISO)}" y="${BY}" width="${x(PRECIO_MER) - x(PISO)}" height="${BH}" fill="none" stroke="${TEAL}" stroke-width="2" stroke-dasharray="5 4" />`);

  // the left-hand label block
  g.text(60, BY + 22, 'La misma unidad de los dos', { size: 12.5, fill: INK_DIM, anchor: 'start' });
  g.text(60, BY + 40, 'artículos anteriores: 60 MW,', { size: 12.5, fill: INK_DIM, anchor: 'start' });
  g.text(60, BY + 58, 'fuel oil, evaluada a 58.2 MW', { size: 12.5, fill: INK_DIM, anchor: 'start' });
  g.text(60, BY + 82, `CV = ${CV} USD/MWh`, { font: MONO, size: 12.5, weight: 600, fill: INK, anchor: 'start' });

  g.line(60, 462, 1140, 462, { stroke: LINE });
  g.text(60, 488, 'Tres reglas más acotan la oferta, y las tres apuntan a lo mismo: que exportar no sea una forma de esquivar la validación nacional.', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, 510, 'La cantidad ofertada no puede superar la cantidad ofertable que la UT informa (11.4.4.1.2). La oferta no puede provenir de unidades bajo prueba,', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 528, 'en mantenimiento o indisponibles (11.4.4.1.4). Y la inyección hidráulica al MER solo puede venir de centrales que estén vertiendo o que la', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 546, 'programación prevea que llegarán a esa condición (11.4.4.1.3): no se vacía un embalse para vender afuera.', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 574, 'Csis y precio del MER ilustrativos. El CVC y el CVNC son los que salieron resueltos en los artículos III y IV de esta serie.', { size: 11.5, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'piso-oferta-mer.svg'), g.done());
}

// ---------------------------------------------------------------------------
// recorrido-mwh.svg

{
  const W = 1200, H = 640;
  const g = canvas(W, H);
  g.text(60, 38, 'El recorrido de un megavatio hora, de la programación a la factura', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'y dónde interviene cada dato que se declara, se valida o se mide', { size: 12, fill: INK_FAINT, anchor: 'start' });

  // Lines are hand-wrapped to about 22 characters: the boxes are 165 px wide
  // and anything longer runs into the next one.
  const PASOS = [
    { t: 'Predespacho', b: 'el SAM programa la\ninyección de la unidad\npara cada intervalo', ref: '10.1.1', c: TEAL, dato: 'costo variable declarado y validado' },
    { t: 'Inyección real', b: 'la unidad opera. Lo\nque hace no es lo que\nse programó', ref: '13', c: TEAL, dato: 'desviación contra el programa' },
    { t: 'Medición', b: 'el SIMEC registra. La\nUT no puede alterar\nlos valores medidos', ref: '18.2.5.3', c: AMBER, dato: 'energía medida en el punto' },
    { t: 'Posdespacho', b: 'se recalcula el costo\nmarginal ex post con\nlas lecturas reales', ref: 'A09 3.8', c: AMBER, dato: 'precio que sí liquida' },
    { t: 'Conciliación', b: 'contratos, MRS,\nregional, servicios\nauxiliares y cargos\ndel sistema', ref: '18.6', c: INK, dato: 'posición neta mensual' },
    { t: 'DTE', b: 'memoria de cálculo\nde los documentos de\ncobro y pago que\nemite la UT', ref: '18.7', c: INK, dato: 'deudor o acreedor' },
  ];

  const L = 70, R = 1130;
  const n = PASOS.length;
  const bw = (R - L - (n - 1) * 14) / n;
  PASOS.forEach((p, i) => {
    const bx = L + i * (bw + 14);
    g.rect(bx, 100, bw, 150, { fill: WASH, stroke: LINE, r: 7 });
    g.rect(bx, 100, bw, 3, { fill: p.c, r: 1.5 });
    g.text(bx + 14, 128, p.t, { size: 13, weight: 600, fill: INK, anchor: 'start' });
    p.b.split('\n').forEach((ln, k) => g.text(bx + 14, 152 + k * 15, ln, { size: 11, fill: INK_DIM, anchor: 'start' }));
    g.text(bx + bw - 14, 238, p.ref, { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });
    if (i < n - 1) g.line(bx + bw + 1, 175, bx + bw + 12, 175, { stroke: LINE_2, w: 1.5, marker: 'ah-dim' });
    // the datum each step introduces
    g.line(bx + bw / 2, 254, bx + bw / 2, 288, { stroke: LINE_2, w: 1, dash: '3 3' });
    p.dato.split(' ').reduce((acc, w) => acc, null);
    const words = p.dato.split(' ');
    const lines = [];
    let cur = '';
    words.forEach((w) => {
      if ((cur + ' ' + w).trim().length > 22) { lines.push(cur.trim()); cur = w; } else cur = `${cur} ${w}`;
    });
    lines.push(cur.trim());
    lines.forEach((ln, k) => g.text(bx + bw / 2, 302 + k * 14, ln, { size: 10.5, fill: INK_FAINT }));
  });

  // the two clocks
  const CLOCKS = [
    { y: 380, color: TEAL, tag: 'CADA DÍA HÁBIL', title: 'Estimación indicativa', body: 'La UT pone a disposición una estimación de la energía comprada y vendida y de los cargos que surjan, como los de\ncongestión y pérdidas, del día anterior. Es indicativa: sirve para que cada participante vea su posición, no para cobrar.', ref: 'ROBCP 18.4.2' },
    { y: 490, color: INK, tag: 'CADA MES', title: 'Liquidación oficial', body: 'Las transacciones se liquidan mensualmente. Al cierre, la UT determina el resultado neto de cada participante, emite el\nDTE y con él los documentos de cobro y pago, por cuenta y orden de acreedores y deudores.', ref: 'ROBCP 18.4.1, 18.9.1' },
  ];
  CLOCKS.forEach((c) => {
    g.rect(60, c.y, 1080, 92, { fill: PAPER, stroke: LINE, r: 8 });
    g.rect(60, c.y, 3, 92, { fill: c.color, r: 1.5 });
    g.text(84, c.y + 26, c.tag, { size: 10.5, weight: 600, fill: c.color, anchor: 'start', spacing: '0.08em' });
    g.text(240, c.y + 26, c.title, { size: 13, weight: 600, fill: INK, anchor: 'start' });
    g.text(1116, c.y + 26, c.ref, { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });
    c.body.split('\n').forEach((ln, k) => g.text(84, c.y + 52 + k * 17, ln, { size: 11.5, fill: INK_DIM, anchor: 'start' }));
  });

  g.text(60, 614, 'Un costo variable mal validado en la semana no se detiene en su casilla: ordena mal el parque, produce un costo marginal que no correspondía y', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 632, 'sale por el otro extremo como un monto equivocado en el DTE de alguien. Ese es el recorrido completo.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'recorrido-mwh.svg'), g.done());
}

console.log('predespacho-regional.svg, piso-oferta-mer.svg, recorrido-mwh.svg written to assets/figures/');
console.log(`  CV ${CV} + Csis ${CSIS} = piso ${PISO} USD/MWh`);
