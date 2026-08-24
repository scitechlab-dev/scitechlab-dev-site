#!/usr/bin/env node
/**
 * Genera las figuras estáticas del artículo de fundamentos de estadística:
 *
 *   assets/figures/est-phillips-decadas.svg  la correlación que se evapora
 *   assets/figures/est-significancia.svg     p contra tamaño del efecto
 *
 *   node scripts/figures/estadistica.mjs
 *
 * Los números NO están escritos a mano: se leen de
 * proyectos/lab-estadistica/datos-figuras.json, que produce el propio
 * laboratorio. Si el laboratorio cambia, las figuras cambian con él; si el
 * archivo no está, este script falla en vez de dibujar algo verosímil.
 *
 * Las dos animaciones del artículo (teorema central del límite y cobertura del
 * intervalo de confianza) se generan con matplotlib desde el laboratorio, no
 * desde acá: animar con SVG a mano sería mucho trabajo para un resultado peor.
 *
 * Los colores son los tokens de style.css, escritos a mano porque el archivo se
 * referencia con <img> y no puede heredar las variables de la página.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'assets', 'figures');
const DATOS = path.join(ROOT, 'proyectos', 'lab-estadistica', 'datos-figuras.json');

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
    dot: (x, y, r, fill, o = {}) =>
      parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.w ?? 1.5}"` : ''}${o.opacity ? ` opacity="${o.opacity}"` : ''} />`),
    done: () => (parts.push('</svg>'), parts.join('\n')),
  };
}

await mkdir(OUT, { recursive: true });
const raw = await readFile(DATOS, 'utf8').catch(() => null);
if (!raw) {
  console.error(`No existe ${DATOS}. Corré primero:\n  cd proyectos/lab-estadistica && python lab.py --figuras`);
  process.exit(1);
}
const D = JSON.parse(raw);

// ---------------------------------------------------------------------------
// est-phillips-decadas.svg
//
// El hallazgo central del artículo: la relación existe dentro de cada década y
// se evapora al juntarlas. Se dibuja como cinco paneles pequeños más uno
// grande, porque la comparación es justamente entre "por separado" y "juntos".

{
  const W = 1200, H = 660;
  const g = canvas(W, H);
  g.text(60, 38, 'La misma relación, medida por separado y medida junta', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'desempleo en el eje horizontal, inflación en el vertical. Cada punto es un trimestre', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const todos = D.phillips.puntos;
  const xs = todos.map((p) => p.unemp), ys = todos.map((p) => p.infl);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);

  // Cinco paneles chicos arriba, uno por década.
  const PW = 210, PH = 190, PGAP = 18, PY = 100;
  D.phillips.decadas.forEach((dec, i) => {
    const px = 60 + i * (PW + PGAP);
    const fx = (v) => px + 34 + ((v - xmin) / (xmax - xmin)) * (PW - 46);
    const fy = (v) => PY + PH - 30 - ((v - ymin) / (ymax - ymin)) * (PH - 52);

    g.rect(px, PY, PW, PH, { fill: WASH, stroke: LINE, r: 6 });
    // Color por fuerza: solo la década significativa se destaca.
    const fuerte = dec.p < 0.01;
    const col = fuerte ? TEAL : LINE_2;

    dec.puntos.forEach((p) => g.dot(fx(p.unemp), fy(p.infl), 2.6, fuerte ? TEAL : INK_FAINT, { opacity: 0.55 }));

    // Recta de mínimos cuadrados de esa década.
    const n = dec.puntos.length;
    const mx = dec.puntos.reduce((s, p) => s + p.unemp, 0) / n;
    const my = dec.puntos.reduce((s, p) => s + p.infl, 0) / n;
    const b = dec.puntos.reduce((s, p) => s + (p.unemp - mx) * (p.infl - my), 0) /
              dec.puntos.reduce((s, p) => s + (p.unemp - mx) ** 2, 0);
    const a = my - b * mx;
    const x1 = Math.min(...dec.puntos.map((p) => p.unemp));
    const x2 = Math.max(...dec.puntos.map((p) => p.unemp));
    g.line(fx(x1), fy(a + b * x1), fx(x2), fy(a + b * x2), { stroke: col, w: fuerte ? 2.6 : 1.8 });

    g.text(px + 12, PY + 22, `${dec.decada}s`, { size: 13, weight: 600, fill: INK, anchor: 'start' });
    g.text(px + PW - 12, PY + 22, `r = ${dec.r >= 0 ? '+' : ''}${dec.r.toFixed(3)}`,
           { size: 12, font: MONO, weight: 600, fill: col, anchor: 'end' });
    g.text(px + PW - 12, PY + 38, `p = ${dec.p < 0.0001 ? '<0.0001' : dec.p.toFixed(3)}`,
           { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });
  });

  // Panel grande abajo: los 203 trimestres juntos.
  const BX = 60, BY = 322, BW = 540, BH = 250;
  const fx = (v) => BX + 60 + ((v - xmin) / (xmax - xmin)) * (BW - 90);
  const fy = (v) => BY + BH - 44 - ((v - ymin) / (ymax - ymin)) * (BH - 78);
  g.rect(BX, BY, BW, BH, { fill: WASH, stroke: LINE, r: 6 });
  todos.forEach((p) => g.dot(fx(p.unemp), fy(p.infl), 2.8, INK_FAINT, { opacity: 0.45 }));
  {
    const n = todos.length;
    const mx = xs.reduce((s, v) => s + v, 0) / n, my = ys.reduce((s, v) => s + v, 0) / n;
    const b = todos.reduce((s, p) => s + (p.unemp - mx) * (p.infl - my), 0) /
              todos.reduce((s, p) => s + (p.unemp - mx) ** 2, 0);
    const a = my - b * mx;
    g.line(fx(xmin), fy(a + b * xmin), fx(xmax), fy(a + b * xmax), { stroke: AMBER, w: 3 });
  }
  g.text(BX + 16, BY + 26, 'Los 203 trimestres juntos', { size: 14, weight: 600, fill: INK, anchor: 'start' });
  g.text(BX + BW - 16, BY + 26, `r = ${D.phillips.global.r >= 0 ? '+' : ''}${D.phillips.global.r.toFixed(3)}`,
         { size: 13, font: MONO, weight: 600, fill: AMBER, anchor: 'end' });
  g.text(BX + BW - 16, BY + 44, `p = ${D.phillips.global.p.toFixed(4)}, no significativa`,
         { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });
  g.text(BX + 16, BY + BH - 10, 'desempleo (%)', { size: 11, fill: INK_FAINT, anchor: 'start' });

  // Explicación al costado.
  const EX = 632;
  g.text(EX, BY + 30, 'Por qué desaparece', { size: 14, weight: 600, fill: INK, anchor: 'start' });
  [
    'Cada década ocupa una región distinta del plano.',
    'Al juntarlas, la variación ENTRE décadas domina',
    'sobre la variación DENTRO de cada una, que es',
    'donde vive la relación.',
    '',
    'La nube resultante no tiene pendiente porque es la',
    'superposición de cinco nubes desplazadas, no el',
    'promedio de cinco pendientes.',
    '',
    'Es confusión por una variable omitida, el régimen.',
  ].forEach((ln, i) => g.text(EX, BY + 56 + i * 18, ln, { size: 12, fill: ln ? INK_DIM : INK_FAINT, anchor: 'start' }));

  // Recuadro de cierre, separado de la lista para que no se encimen.
  g.rect(EX - 14, BY + 244, 522, 46, { fill: WASH, stroke: LINE, r: 6 });
  g.text(EX, BY + 265, 'Antes de correlacionar una serie larga: ¿el mecanismo que', { size: 12, weight: 600, fill: AMBER, anchor: 'start' });
  g.text(EX, BY + 282, 'generó los datos fue el mismo durante todo el período?', { size: 12, weight: 600, fill: AMBER, anchor: 'start' });

  await writeFile(path.join(OUT, 'est-phillips-decadas.svg'), g.done());
}

// ---------------------------------------------------------------------------
// est-significancia.svg
//
// Cuatro cuadrantes: la combinación de p y tamaño del efecto, y qué se hace en
// cada caso. Es la figura que responde "¿y esto importa?".

{
  const W = 1200, H = 600;
  const g = canvas(W, H);
  g.text(60, 38, 'El valor p y el tamaño del efecto responden preguntas distintas', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'reportar solo uno de los dos deja la mitad de la respuesta afuera', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const L = 240, R = 760, T = 110, B = 470;
  const mx = (L + R) / 2, my = (T + B) / 2;

  const CUAD = [
    { x: L, y: T, w: mx - L, h: my - T, fill: '#f2f6f7',
      t: 'Detectable y grande', s: 'reportar y actuar', c: TEAL },
    { x: mx, y: T, w: R - mx, h: my - T, fill: WASH,
      t: 'Grande pero no detectable', s: 'muestra insuficiente,\nno "no hay efecto"', c: AMBER },
    { x: L, y: my, w: mx - L, h: B - my, fill: WASH,
      t: 'Detectable pero chico', s: 'estadísticamente real,\nprácticamente irrelevante', c: AMBER },
    { x: mx, y: my, w: R - mx, h: B - my, fill: '#f7f7f8',
      t: 'Ni detectable ni grande', s: 'no hay nada acá', c: INK_FAINT },
  ];
  CUAD.forEach((q) => {
    g.rect(q.x, q.y, q.w, q.h, { fill: q.fill, stroke: LINE, r: 0 });
    g.text(q.x + 18, q.y + 30, q.t, { size: 13, weight: 600, fill: q.c, anchor: 'start' });
    q.s.split('\n').forEach((ln, i) => g.text(q.x + 18, q.y + 52 + i * 16, ln, { size: 11.5, fill: INK_DIM, anchor: 'start' }));
  });

  // Ejes
  g.line(L, B, R, B, { stroke: LINE_2, w: 1.4 });
  g.line(L, T, L, B, { stroke: LINE_2, w: 1.4 });
  g.line(mx, T, mx, B, { stroke: INK, w: 1.6, dash: '5 4' });
  g.line(L, my, R, my, { stroke: INK, w: 1.6, dash: '5 4' });
  g.text(mx, T - 12, 'p = 0.05', { size: 11.5, font: MONO, weight: 600, fill: INK });
  g.text(L - 12, my + 4, 'd = 0.5', { size: 11.5, font: MONO, weight: 600, fill: INK, anchor: 'end' });
  g.text((L + R) / 2, B + 34, 'valor p        (izquierda: significativo)', { size: 12, fill: INK_FAINT });
  g.text(L - 12, T - 30, 'tamaño', { size: 12, fill: INK_FAINT, anchor: 'end' });
  g.text(L - 12, T - 14, 'del efecto', { size: 12, fill: INK_FAINT, anchor: 'end' });

  // El caso medido del laboratorio, ubicado en su cuadrante. En dos líneas
  // para que no se desborde al cuadrante vecino.
  const c = D.efecto;
  g.dot(L + 26, T + 92, 6, INK);
  g.text(L + 40, T + 96, 'desempleo 1980s vs 1990s', { size: 11.5, weight: 600, fill: INK, anchor: 'start' });
  g.text(L + 40, T + 113, `d = ${c.cohen.toFixed(2)}   p = ${c.p.toExponential(1)}`,
         { size: 11.5, font: MONO, fill: INK_DIM, anchor: 'start' });

  // Panel derecho: las dos distribuciones que producen esa d.
  const PX = 800, PW = 340, PY = 110, PH = 200;
  g.rect(PX, PY, PW, PH, { fill: WASH, stroke: LINE, r: 6 });
  g.text(PX + 16, PY + 26, 'Qué significa d = 1.17', { size: 13, weight: 600, fill: INK, anchor: 'start' });
  const gx = (v) => PX + 24 + ((v - 3) / 9) * (PW - 48);
  const gauss = (x, mu, sd) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd));
  [[c.media_a, c.sd, AMBER, '1980s'], [c.media_b, c.sd, TEAL, '1990s']].forEach(([mu, sd, col, lab]) => {
    const pts = [];
    for (let v = 3; v <= 12; v += 0.1) pts.push(`${gx(v).toFixed(1)},${(PY + PH - 34 - gauss(v, mu, sd) * 110).toFixed(1)}`);
    g.raw(`<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="2.2" />`);
    g.line(gx(mu), PY + PH - 34, gx(mu), PY + PH - 34 - 110, { stroke: col, w: 1, dash: '3 3' });
    g.text(gx(mu), PY + PH - 16, lab, { size: 11, weight: 600, fill: col });
  });
  g.line(PX + 24, PY + PH - 34, PX + PW - 24, PY + PH - 34, { stroke: LINE_2 });
  g.text(PX + 16, PY + PH + 22, 'Poco más de una desviación estándar separa a las', { size: 11.5, fill: INK_DIM, anchor: 'start' });
  g.text(PX + 16, PY + PH + 38, 'dos décadas. El desempleo MEDIO de los ochenta', { size: 11.5, fill: INK_DIM, anchor: 'start' });
  g.text(PX + 16, PY + PH + 54, 'supera al 88 % de los trimestres de los noventa;', { size: 11.5, fill: INK_DIM, anchor: 'start' });
  g.text(PX + 16, PY + PH + 70, 'un trimestre cualquiera, al 80 %. Las dos cifras', { size: 11.5, fill: INK_DIM, anchor: 'start' });
  g.text(PX + 16, PY + PH + 86, 'salen de la misma d y no son la misma pregunta.', { size: 11.5, fill: INK_DIM, anchor: 'start' });

  g.line(60, 512, 1140, 512, { stroke: LINE });
  g.text(60, 538, 'El cuadrante superior derecho es el que más daño hace, porque se reporta como "no hay diferencia" cuando lo correcto es "esta muestra no', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 556, 'alcanza para detectarla". Ausencia de evidencia no es evidencia de ausencia, y la manera de distinguirlas es mirar el tamaño del efecto.', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 580, `Con ${D.multiples.n_pruebas} pruebas al 5 %, la probabilidad de al menos un falso positivo es ${(D.multiples.prob_falso * 100).toFixed(1)} %. Contar cuántas pruebas se hicieron es parte del reporte.`, { size: 12, weight: 600, fill: AMBER, anchor: 'start' });

  await writeFile(path.join(OUT, 'est-significancia.svg'), g.done());
}

console.log('est-phillips-decadas.svg, est-significancia.svg escritas en assets/figures/');
console.log(`  dibujadas desde la corrida del laboratorio: r global ${D.phillips.global.r.toFixed(3)}, ` +
            `r de los sesenta ${D.phillips.decadas.find((x) => x.decada === 1960).r.toFixed(3)}`);
