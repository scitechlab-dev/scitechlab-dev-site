#!/usr/bin/env node
/**
 * Figuras conceptuales del artículo de pandas.
 *
 *   assets/figures/pd-ventanas.svg    rolling, expanding y ewm, comparadas
 *   assets/figures/pd-merge.svg       los cuatro how, sobre las mismas tablas
 *   assets/figures/pd-largo-ancho.svg melt y pivot, con las celdas a la vista
 *
 *   node scripts/figures/pandas-lab.mjs
 *
 * Estas tres son DIAGRAMAS, no gráficas de datos: lo que hay que entender es
 * qué celdas se leen y cuáles se producen, no qué valor toma una serie. Por eso
 * van dibujadas a mano en SVG y no salen de matplotlib, que dibujaría bien los
 * números y mal la estructura.
 *
 * Los datos de la figura de ventanas sí son reales: se leen del laboratorio.
 *
 * Los colores son los tokens de style.css, escritos a mano porque el archivo se
 * referencia con <img> y no puede heredar las variables de la página.
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

await mkdir(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// pd-ventanas.svg
//
// Qué celdas lee cada ventana para producir el valor del período t. Es la
// pregunta que decide si una transformación se puede usar para pronosticar.

{
  const W = 1200, H = 500;
  const g = canvas(W, H);
  g.text(60, 38, 'Qué pasado lee cada ventana, y cuál mira al futuro', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'cada fila es la misma serie; lo sombreado es lo que se usa para calcular el valor del período marcado', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const N = 12, CW = 46, CH = 30, X0 = 300, T = 100, OBJ = 8;
  const FILAS = [
    { t: 'rolling(4)', s: '.rolling(4).mean()', lee: [5, 6, 7, 8], c: TEAL, ok: true,
      nota: 'los 4 últimos, incluido t' },
    { t: 'rolling(4, center=True)', s: '.rolling(4, center=True)', lee: [7, 8, 9, 10], c: AMBER, ok: false,
      nota: 'incluye t+1 y t+2: mira al futuro' },
    { t: 'expanding()', s: '.expanding().mean()', lee: [0, 1, 2, 3, 4, 5, 6, 7, 8], c: TEAL, ok: true,
      nota: 'todo el pasado, sin olvidar nada' },
    { t: 'ewm(span=4)', s: '.ewm(span=4).mean()', lee: [0, 1, 2, 3, 4, 5, 6, 7, 8], c: TEAL, ok: true,
      nota: 'todo el pasado, con peso decreciente' },
  ];

  // Encabezado de columnas
  for (let i = 0; i < N; i++) {
    const et = i === OBJ ? 't' : i < OBJ ? `t−${OBJ - i}` : `t+${i - OBJ}`;
    g.text(X0 + i * CW + CW / 2, T - 10, et, { size: 10.5, font: MONO, fill: i === OBJ ? INK : INK_FAINT, weight: i === OBJ ? 600 : 400 });
  }

  FILAS.forEach((f, k) => {
    const y = T + k * (CH + 26);
    g.text(60, y + 20, f.t, { size: 12.5, weight: 600, fill: INK, anchor: 'start' });
    g.text(60, y + 36, f.nota, { size: 10.5, fill: f.ok ? INK_FAINT : AMBER, anchor: 'start' });

    for (let i = 0; i < N; i++) {
      const leido = f.lee.includes(i);
      // El peso decreciente de ewm se dibuja con opacidad, que es lo que lo
      // distingue de expanding: las dos leen lo mismo, no con el mismo peso.
      const op = f.t.startsWith('ewm') && leido
        ? Math.max(0.14, Math.pow(0.55, OBJ - i)).toFixed(2) : leido ? 1 : 1;
      const relleno = leido ? f.c : WASH;
      g.raw(`<rect x="${X0 + i * CW}" y="${y}" width="${CW - 3}" height="${CH}" rx="3" fill="${relleno}" opacity="${leido ? op : 1}" stroke="${LINE}" stroke-width="1" />`);
      if (i === OBJ) {
        g.raw(`<rect x="${X0 + i * CW}" y="${y}" width="${CW - 3}" height="${CH}" rx="3" fill="none" stroke="${INK}" stroke-width="2.2" />`);
      }
    }
  });

  const YB = T + FILAS.length * (CH + 26) + 16;
  g.line(60, YB, 1140, YB, { stroke: LINE });
  g.raw(`<rect x="60" y="${YB + 18}" width="16" height="16" rx="3" fill="${AMBER}" />`);
  g.text(84, YB + 31, 'La fila ámbar es la única que no se puede usar para pronosticar: para calcular el valor de t necesita datos de t+1 y t+2,', { size: 12, fill: INK, anchor: 'start' });
  g.text(84, YB + 49, 'que en producción todavía no existen. Para describir el pasado en una gráfica está bien, y de hecho es lo correcto porque no', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(84, YB + 67, 'desfasa la curva.', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, YB + 96, 'expanding y ewm leen las mismas celdas: la diferencia es el peso. En ewm el degradado del color ES el peso, y por eso reacciona', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, YB + 114, 'más rápido a un cambio reciente sin perder del todo la memoria de lo viejo.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'pd-ventanas.svg'), g.done());
}

// ---------------------------------------------------------------------------
// pd-merge.svg
//
// Los cuatro how, con las filas concretas que produce cada uno. Un diagrama de
// Venn diría lo mismo peor: lo que uno necesita ver es cuántas FILAS salen.

{
  const W = 1200, H = 620;
  const g = canvas(W, H);
  g.text(60, 38, 'Los cuatro how de un merge, sobre las mismas dos tablas', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'cuatro trimestres a la izquierda, cuatro a la derecha, dos en común. Lo que cambia es cuántas filas salen y cuántos nulos', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const IZQ = ['2008Q1', '2008Q2', '2008Q3', '2008Q4'];
  const DER = ['2008Q3', '2008Q4', '2009Q1', '2009Q2'];
  const COMUN = IZQ.filter((k) => DER.includes(k));

  // Las dos tablas de entrada
  const TX = 60, TY = 96, RW = 108, RH = 26;
  [['izquierda', IZQ, TEAL, TX], ['derecha', DER, AMBER, TX + 150]].forEach(([nom, keys, col, x]) => {
    g.text(x + RW / 2, TY - 10, nom, { size: 11.5, weight: 600, fill: col });
    keys.forEach((k, i) => {
      const enComun = COMUN.includes(k);
      g.rect(x, TY + i * (RH + 4), RW, RH, { fill: enComun ? col : WASH, stroke: LINE, r: 3 });
      g.text(x + RW / 2, TY + i * (RH + 4) + 18, k,
             { size: 11, font: MONO, fill: enComun ? PAPER : INK_DIM, weight: enComun ? 600 : 400 });
    });
  });
  g.text(TX, TY + 4 * (RH + 4) + 20, 'en color, las claves', { size: 10.5, fill: INK_FAINT, anchor: 'start' });
  g.text(TX, TY + 4 * (RH + 4) + 36, 'que están en las dos', { size: 10.5, fill: INK_FAINT, anchor: 'start' });

  // Los cuatro resultados
  const HOWS = [
    { h: 'inner', desc: 'solo lo que está en ambas', filas: COMUN.map((k) => [k, true, true]) },
    { h: 'left', desc: 'todo lo de la izquierda', filas: IZQ.map((k) => [k, true, DER.includes(k)]) },
    { h: 'right', desc: 'todo lo de la derecha', filas: DER.map((k) => [k, IZQ.includes(k), true]) },
    { h: 'outer', desc: 'la unión de las dos', filas: [...new Set([...IZQ, ...DER])].sort().map((k) => [k, IZQ.includes(k), DER.includes(k)]) },
  ];
  const OX = 400, OW = 178, OGAP = 20;
  HOWS.forEach((o, i) => {
    const x = OX + i * (OW + OGAP);
    const alto = 62 + o.filas.length * (RH + 4) + 44;
    g.rect(x, TY - 28, OW, alto, { fill: WASH, stroke: LINE, r: 6 });
    g.text(x + 14, TY - 8, `how="${o.h}"`, { size: 12.5, font: MONO, weight: 600, fill: INK, anchor: 'start' });
    g.text(x + 14, TY + 8, o.desc, { size: 10.5, fill: INK_FAINT, anchor: 'start' });
    o.filas.forEach(([k, hayI, hayD], j) => {
      const y = TY + 22 + j * (RH + 4);
      g.rect(x + 14, y, 66, RH, { fill: hayI ? TEAL : PAPER, stroke: hayI ? 'none' : LINE_2, r: 3, dash: hayI ? null : '3 2' });
      g.text(x + 47, y + 18, hayI ? k : 'NaN', { size: 10, font: MONO, fill: hayI ? PAPER : INK_FAINT });
      g.rect(x + 84, y, 66, RH, { fill: hayD ? AMBER : PAPER, stroke: hayD ? 'none' : LINE_2, r: 3, dash: hayD ? null : '3 2' });
      g.text(x + 117, y + 18, hayD ? 'evento' : 'NaN', { size: 10, font: MONO, fill: hayD ? PAPER : INK_FAINT });
    });
    const nulos = o.filas.filter(([, a, b]) => !a || !b).length;
    const yc = TY + 22 + o.filas.length * (RH + 4) + 16;
    g.text(x + 14, yc, `${o.filas.length} filas`, { size: 12, font: MONO, weight: 600, fill: INK, anchor: 'start' });
    g.text(x + 14, yc + 16, `${nulos} con nulos`, { size: 11, font: MONO, fill: nulos ? AMBER : INK_FAINT, anchor: 'start' });
  });

  // El bloque de validate
  const VY = 360;
  g.rect(60, VY, 1080, 132, { fill: PAPER, stroke: AMBER, r: 8, w: 1.6 });
  g.text(82, VY + 28, 'Y el argumento que evita el error más caro: validate=', { size: 14, weight: 600, fill: AMBER, anchor: 'start' });
  g.text(82, VY + 54, 'Si en la tabla derecha se cuela UN duplicado de 2008Q3, el merge no falla: devuelve 5 filas en vez de 4.', { size: 12, fill: INK, anchor: 'start' });
  g.text(82, VY + 74, 'La fila extra no se ve, no rompe nada, y cualquier suma posterior queda inflada. El error aparece tres pasos después,', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(82, VY + 94, 'como un total que no cuadra y que ya nadie asocia con el merge.', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(82, VY + 118, 'izq.merge(der, on="trimestre", how="left", validate="one_to_one")   →   MergeError, en vez de una fila de más', { size: 11.5, font: MONO, weight: 600, fill: INK, anchor: 'start' });

  g.text(60, 540, 'Los cuatro valores admitidos son one_to_one, one_to_many, many_to_one y many_to_many. Declarar cuál se espera cuesta doce', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 558, 'caracteres y convierte un error silencioso en una excepción. Es el mismo criterio que gobierna el validador de la serie del', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 576, 'mercado eléctrico: si el sistema puede detectar que un supuesto se violó, tiene que fallar, no adivinar.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'pd-merge.svg'), g.done());
}

// ---------------------------------------------------------------------------
// pd-largo-ancho.svg

{
  const W = 1200, H = 480;
  const g = canvas(W, H);
  g.text(60, 38, 'Largo y ancho: la misma información, dos formas', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'melt va de ancho a largo; pivot vuelve. El 80 % del trabajo real de preparación de datos es ir y venir entre estas dos', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const TRIM = ['2007Q1', '2007Q2', '2007Q3'];
  const SERIES = [['unemp', ['4.5', '4.5', '4.7'], TEAL], ['infl', ['4.58', '2.75', '3.45'], AMBER]];

  // Ancho, a la izquierda
  const AX = 60, AY = 110, CW = 92, CH = 28;
  g.text(AX, AY - 14, 'ANCHO: una columna por serie', { size: 11.5, weight: 600, fill: INK, anchor: 'start', spacing: '0.06em' });
  g.rect(AX, AY, CW, CH, { fill: WASH, stroke: LINE, r: 3 });
  g.text(AX + CW / 2, AY + 19, 'trimestre', { size: 10.5, font: MONO, fill: INK_DIM });
  SERIES.forEach(([nom, , col], j) => {
    g.rect(AX + (j + 1) * (CW + 3), AY, CW, CH, { fill: col, r: 3 });
    g.text(AX + (j + 1) * (CW + 3) + CW / 2, AY + 19, nom, { size: 10.5, font: MONO, fill: PAPER, weight: 600 });
  });
  TRIM.forEach((t, i) => {
    const y = AY + (i + 1) * (CH + 3);
    g.rect(AX, y, CW, CH, { fill: WASH, stroke: LINE, r: 3 });
    g.text(AX + CW / 2, y + 19, t, { size: 10.5, font: MONO, fill: INK_DIM });
    SERIES.forEach(([, vals, col], j) => {
      g.rect(AX + (j + 1) * (CW + 3), y, CW, CH, { fill: PAPER, stroke: col, r: 3, w: 1.4 });
      g.text(AX + (j + 1) * (CW + 3) + CW / 2, y + 19, vals[i], { size: 10.5, font: MONO, fill: INK });
    });
  });
  g.text(AX, AY + 4 * (CH + 3) + 22, '3 filas × 3 columnas', { size: 11, font: MONO, fill: INK_FAINT, anchor: 'start' });
  g.text(AX, AY + 4 * (CH + 3) + 40, 'lo que quiere una gráfica', { size: 11, fill: INK_FAINT, anchor: 'start' });

  // Flechas
  const MX = 400;
  g.line(MX, AY + 46, MX + 90, AY + 46, { stroke: INK, w: 1.8, marker: 'ah-ink' });
  g.text(MX + 45, AY + 36, '.melt()', { size: 12, font: MONO, weight: 600, fill: INK });
  g.line(MX + 90, AY + 96, MX, AY + 96, { stroke: INK, w: 1.8, marker: 'ah-ink' });
  g.text(MX + 45, AY + 116, '.pivot()', { size: 12, font: MONO, weight: 600, fill: INK });

  // Largo, a la derecha
  const LX = 560, LCW = 100;
  g.text(LX, AY - 14, 'LARGO: una fila por observación', { size: 11.5, weight: 600, fill: INK, anchor: 'start', spacing: '0.06em' });
  ['trimestre', 'serie', 'valor'].forEach((h, j) => {
    g.rect(LX + j * (LCW + 3), AY, LCW, CH, { fill: WASH, stroke: LINE, r: 3 });
    g.text(LX + j * (LCW + 3) + LCW / 2, AY + 19, h, { size: 10.5, font: MONO, fill: INK_DIM });
  });
  let fila = 0;
  SERIES.forEach(([nom, vals, col]) => {
    TRIM.forEach((t, i) => {
      const y = AY + (fila + 1) * (CH + 3);
      g.rect(LX, y, LCW, CH, { fill: WASH, stroke: LINE, r: 3 });
      g.text(LX + LCW / 2, y + 19, t, { size: 10.5, font: MONO, fill: INK_DIM });
      g.rect(LX + LCW + 3, y, LCW, CH, { fill: col, r: 3 });
      g.text(LX + LCW + 3 + LCW / 2, y + 19, nom, { size: 10.5, font: MONO, fill: PAPER, weight: 600 });
      g.rect(LX + 2 * (LCW + 3), y, LCW, CH, { fill: PAPER, stroke: col, r: 3, w: 1.4 });
      g.text(LX + 2 * (LCW + 3) + LCW / 2, y + 19, vals[i], { size: 10.5, font: MONO, fill: INK });
      fila++;
    });
  });
  g.text(LX, AY + 7 * (CH + 3) + 22, '6 filas × 3 columnas', { size: 11, font: MONO, fill: INK_FAINT, anchor: 'start' });
  g.text(LX, AY + 7 * (CH + 3) + 40, 'lo que devuelve casi cualquier base de datos', { size: 11, fill: INK_FAINT, anchor: 'start' });

  g.line(60, 404, 1140, 404, { stroke: LINE });
  g.text(60, 430, 'La diferencia que importa: pivot FALLA si hay claves duplicadas, y pivot_table las agrega en silencio. Si no se sabe cuál se está', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, 448, 'usando, un promedio que nadie pidió puede colarse en el resultado. Cuando quiero una reorganización pura uso pivot, justamente', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, 466, 'porque falla.', { size: 12, fill: INK_DIM, anchor: 'start' });

  await writeFile(path.join(OUT, 'pd-largo-ancho.svg'), g.done());
}

console.log('pd-ventanas.svg, pd-merge.svg, pd-largo-ancho.svg escritas en assets/figures/');
