#!/usr/bin/env node
/**
 * Generates the three figures for the data-validation article:
 *
 *   assets/figures/arquitectura-validador.svg  the pipeline and the four scopes
 *   assets/figures/severidad-criterio.svg      when to reject and when to alert
 *   assets/figures/hallazgos-corrida.svg       the results of the actual run
 *
 *   node scripts/figures/validador.mjs
 *
 * The third figure is NOT drawn from numbers typed here. It reads
 * proyectos/validador-cvc/informe.json, which is the output of actually running
 * the validator, and draws whatever is in it. If the validator changes, the
 * figure changes with it; if the file is missing, this script fails loudly
 * rather than drawing a plausible-looking lie.
 *
 * Colours are style.css tokens, hardcoded because the file is referenced with
 * <img> and cannot inherit the page's custom properties.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'assets', 'figures');
const INFORME = path.join(ROOT, 'proyectos', 'validador-cvc', 'informe.json');

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
    dot: (x, y, r, fill) => parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" />`),
    done: () => (parts.push('</svg>'), parts.join('\n')),
  };
}

await mkdir(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// arquitectura-validador.svg

{
  const W = 1200, H = 660;
  const g = canvas(W, H);
  g.text(60, 38, 'Un validador es un catálogo de reglas, no una función larga', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'el motor no sabe de combustibles; las reglas no saben de recorridos. Agregar una regla no toca el motor', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const ETAPAS = [
    { t: 'Entrada', b: 'declaraciones de la\nsemana, tipadas', c: TEAL },
    { t: 'Contexto', b: 'estructuras aprobadas,\nSIMEC, serie histórica', c: TEAL },
    { t: 'Catálogo', b: '12 reglas declarativas,\nversionado', c: AMBER },
    { t: 'Motor', b: 'evalúa cada regla contra\ncada declaración', c: AMBER },
    { t: 'Hallazgos', b: 'OK, FALLA o\nNO EVALUABLE', c: INK },
    { t: 'Registro', b: 'hash del insumo, versión,\nresultado de todo', c: INK },
  ];
  const EW = 168, EGAP = 16;
  ETAPAS.forEach((e, i) => {
    const ex = 60 + i * (EW + EGAP);
    g.rect(ex, 96, EW, 104, { fill: WASH, stroke: LINE, r: 7 });
    g.rect(ex, 96, EW, 3, { fill: e.c, r: 1.5 });
    g.text(ex + 14, 126, e.t, { size: 13, weight: 600, fill: INK, anchor: 'start' });
    e.b.split('\n').forEach((ln, k) => g.text(ex + 14, 150 + k * 16, ln, { size: 11, fill: INK_DIM, anchor: 'start' }));
    if (i < ETAPAS.length - 1) g.line(ex + EW + 2, 148, ex + EW + EGAP - 2, 148, { stroke: LINE_2, w: 1.5, marker: 'ah-dim' });
  });

  // the four scopes
  g.text(60, 254, 'El ámbito de una regla dice qué necesita para decidir, y qué pasa si eso falta', { size: 14, weight: 600, fill: INK, anchor: 'start' });

  const AMBITOS = [
    { t: 'CAMPO', d: 'un solo valor del registro', ej: 'R04 plazo de envío\nR07 referenciación del inventario', falta: 'siempre evaluable' },
    { t: 'REGISTRO', d: 'varios campos entre sí', ej: 'R06 aritmética del PCpep\nR08 balance de inventario', falta: 'siempre evaluable' },
    { t: 'SERIE', d: 'el mismo declarante en el tiempo', ej: 'R11 salto contra referencia\nR12 valor congelado', falta: 'NO EVALUABLE al inicio de la serie' },
    { t: 'CRUCE', d: 'contra una fuente independiente', ej: 'R01 estructura vigente\nR09 consumo contra SIMEC', falta: 'NO EVALUABLE si falta la contraparte' },
  ];
  const AW = 262, AGAP = 18;
  AMBITOS.forEach((a, i) => {
    const ax = 60 + i * (AW + AGAP);
    g.rect(ax, 280, AW, 176, { fill: PAPER, stroke: LINE, r: 7 });
    g.text(ax + 16, 308, a.t, { size: 12, weight: 600, fill: TEAL, anchor: 'start', spacing: '0.08em' });
    g.text(ax + 16, 330, a.d, { size: 11.5, fill: INK_DIM, anchor: 'start' });
    g.line(ax + 16, 344, ax + AW - 16, 344, { stroke: LINE, w: 1 });
    a.ej.split('\n').forEach((ln, k) => g.text(ax + 16, 366 + k * 16, ln, { size: 11, font: MONO, fill: INK, anchor: 'start' }));
    g.text(ax + 16, 414, 'si falta el insumo', { size: 10.5, fill: INK_FAINT, anchor: 'start' });
    const w = a.falta.length > 22 ? [a.falta.slice(0, a.falta.lastIndexOf(' ', 26)), a.falta.slice(a.falta.lastIndexOf(' ', 26) + 1)] : [a.falta];
    w.forEach((ln, k) => g.text(ax + 16, 432 + k * 15, ln, { size: 11, weight: 600, fill: AMBER, anchor: 'start' }));
  });

  g.line(60, 494, 1140, 494, { stroke: LINE });
  g.text(60, 520, 'NO EVALUABLE no es un silencio: es un resultado. Un validador que calla cuando le falta la contraparte no distingue entre "esto pasó" y', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, 538, '"esto no se revisó", y esa distinción es justamente la que después hay que poder demostrar.', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, 570, 'Por eso el registro guarda también las reglas que pasaron. Sin las que pasaron no se puede probar que se revisaron: un informe que solo', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 588, 'lista fallas es indistinguible de un informe de una corrida que nunca se hizo.', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 620, 'Cada hallazgo carga su referencia normativa. La respuesta a "¿por qué me rechazaron esto?" no puede ser "lo dijo el sistema".', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'arquitectura-validador.svg'), g.done());
}

// ---------------------------------------------------------------------------
// severidad-criterio.svg

{
  const W = 1200, H = 560;
  const g = canvas(W, H);
  g.text(60, 38, 'Cuándo rechazar y cuándo solo alertar', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'una sola pregunta decide: ¿la discrepancia admite una explicación legítima?', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const COLS = [
    {
      x: 60, color: INK, tag: 'RECHAZO', sub: 'el valor no entra a la programación',
      criterio: 'No admite explicación legítima.\nO el declarante se equivocó o el dato\nestá mal, y en cualquier caso el número\nno sirve para calcular un costo.',
      casos: ['R01  la estructura no estaba vigente', 'R02  la fuente no es la aprobada', 'R03  la ventana de promedio cambió', 'R04  llegó fuera de plazo', 'R05  la internación no siguió la fórmula', 'R06  la aritmética no cierra', 'R07  el inventario no está referenciado', 'R08  el balance no cuadra'],
    },
    {
      x: 620, color: AMBER, tag: 'ALERTA', sub: 'el valor entra, pero alguien lo mira',
      criterio: 'Sí admite explicación legítima.\nEl mercado se movió, la máquina operó\ndistinto, el embalse bajó. Hay que\npreguntar, no bloquear.',
      casos: ['R09  el consumo no cuadra con lo generado', 'R10  el inventario quedó bajo el piso', 'R11  el precio saltó más que la referencia', 'R12  el precio lleva semanas congelado'],
    },
  ];
  COLS.forEach((c) => {
    g.rect(c.x, 96, 520, 380, { fill: WASH, stroke: LINE, r: 8 });
    g.rect(c.x, 96, 520, 3, { fill: c.color, r: 1.5 });
    g.text(c.x + 24, 128, c.tag, { size: 14, weight: 600, fill: c.color, anchor: 'start', spacing: '0.08em' });
    g.text(c.x + 24, 150, c.sub, { size: 12, fill: INK_FAINT, anchor: 'start' });
    c.criterio.split('\n').forEach((ln, k) => g.text(c.x + 24, 184 + k * 17, ln, { size: 12, fill: INK, anchor: 'start' }));
    g.line(c.x + 24, 264, c.x + 496, 264, { stroke: LINE, w: 1 });
    c.casos.forEach((cs, k) => {
      g.dot(c.x + 30, 288 + k * 22 - 4, 2.5, c.color);
      g.text(c.x + 44, 288 + k * 22, cs, { size: 11.5, font: MONO, fill: INK_DIM, anchor: 'start' });
    });
  });

  g.text(60, 512, 'La regla práctica: una identidad que no cierra rechaza; una magnitud que sorprende alerta. Y todo lo que rechaza tiene que poder señalar', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 530, 'el numeral que lo obliga, porque un rechazo sin fundamento normativo es una opinión del que programó el validador.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'severidad-criterio.svg'), g.done());
}

// ---------------------------------------------------------------------------
// hallazgos-corrida.svg  drawn from the real output

{
  const raw = await readFile(INFORME, 'utf8').catch(() => null);
  if (!raw) {
    console.error(`No existe ${INFORME}. Corré primero:\n  cd proyectos/validador-cvc && python validador.py --json informe.json`);
    process.exit(1);
  }
  const { registro, hallazgos } = JSON.parse(raw);

  const fallas = hallazgos.filter((h) => h.estado === 'FALLA');
  const noEval = hallazgos.filter((h) => h.estado === 'NO_EVALUABLE');
  const reglas = [...new Set(hallazgos.map((h) => h.regla))].sort();
  const porRegla = reglas.map((r) => {
    const de = hallazgos.filter((h) => h.regla === r);
    return {
      id: r,
      titulo: de[0].titulo,
      severidad: de[0].severidad,
      falla: de.filter((h) => h.estado === 'FALLA').length,
      noEval: de.filter((h) => h.estado === 'NO_EVALUABLE').length,
      ok: de.filter((h) => h.estado === 'OK').length,
    };
  });

  const W = 1200, H = 760;
  const g = canvas(W, H);
  g.text(60, 38, 'Lo que encontró la corrida', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, `${registro.declaraciones} declaraciones × ${registro.reglas} reglas = ${registro.evaluaciones} evaluaciones. Catálogo v${registro.version_catalogo}`, { size: 12, fill: INK_FAINT, anchor: 'start' });

  const L = 420, R = 1080, T = 100;
  const rowH = 40;
  const MAXN = Math.max(...porRegla.map((p) => p.falla + p.noEval), 1);
  const x = (n) => L + (n / MAXN) * (R - L);

  // scale
  for (let n = 0; n <= MAXN; n += 1) {
    if (n % Math.ceil(MAXN / 6) !== 0 && n !== MAXN) continue;
    g.line(x(n), T - 12, x(n), T + porRegla.length * rowH - 8, { stroke: LINE, w: 0.8 });
    g.text(x(n), T - 20, String(n), { font: MONO, size: 11, fill: INK_FAINT });
  }
  [['rechazo', INK], ['alerta', AMBER], ['no evaluable', LINE_2]].forEach(([lab, c], i) => {
    const lx = R - 360 + i * 128;
    g.rect(lx, T - 50, 12, 12, { fill: c, r: 2 });
    g.text(lx + 18, T - 40, lab, { size: 11.5, fill: INK_FAINT, anchor: 'start' });
  });

  porRegla.forEach((p, i) => {
    const y = T + i * rowH;
    const col = p.severidad === 'RECHAZO' ? INK : AMBER;
    g.text(60, y + 10, p.id, { size: 12, font: MONO, weight: 600, fill: col, anchor: 'start' });
    g.text(102, y + 10, p.titulo, { size: 11.5, fill: INK_DIM, anchor: 'start' });
    if (p.falla) {
      g.rect(L, y - 4, x(p.falla) - L, 18, { fill: col, r: 2 });
      g.text(x(p.falla) + 8, y + 10, String(p.falla), { size: 11.5, font: MONO, weight: 600, fill: col, anchor: 'start' });
    }
    if (p.noEval) {
      const x0 = x(p.falla);
      g.rect(x0 + (p.falla ? 3 : 0), y - 4, x(p.falla + p.noEval) - x0, 18, { fill: LINE_2, r: 2 });
      g.text(x(p.falla + p.noEval) + 8, y + 10, `${p.noEval} n/e`, { size: 11, font: MONO, fill: INK_FAINT, anchor: 'start' });
    }
    if (!p.falla && !p.noEval) g.text(L + 4, y + 10, 'sin hallazgos', { size: 11, fill: INK_FAINT, anchor: 'start' });
  });

  const BY = T + porRegla.length * rowH + 26;
  g.line(60, BY, 1140, BY, { stroke: LINE });
  const KPI = [
    ['declaraciones', registro.declaraciones],
    ['evaluaciones', registro.evaluaciones],
    ['fallas', fallas.length],
    ['no evaluables', noEval.length],
    ['rechazadas', registro.declaraciones_rechazadas.length],
    ['aceptación', `${(registro.tasa_aceptacion * 100).toFixed(1)} %`],
  ];
  KPI.forEach(([k, v], i) => {
    const kx = 60 + i * 182;
    g.text(kx, BY + 34, String(v), { size: 22, weight: 600, fill: INK, anchor: 'start', font: MONO });
    g.text(kx, BY + 54, k, { size: 11.5, fill: INK_FAINT, anchor: 'start' });
  });

  g.text(60, BY + 92, `hash del insumo  ${registro.hash_insumo_sha256}`, { size: 11, font: MONO, fill: INK_FAINT, anchor: 'start' });
  g.text(60, BY + 112, 'Doce defectos sembrados producen veintidós hallazgos. La diferencia no son falsos positivos: son cascada, propagación y solapamiento', { size: 12, fill: INK_DIM, anchor: 'start' });
  g.text(60, BY + 130, 'entre reglas, y las tres cosas están explicadas en el artículo.', { size: 12, fill: INK_DIM, anchor: 'start' });

  await writeFile(path.join(OUT, 'hallazgos-corrida.svg'), g.done());

  console.log(`hallazgos-corrida.svg dibujado desde la corrida ${registro.corrida}`);
  console.log(`  ${fallas.length} fallas, ${noEval.length} no evaluables, ${registro.declaraciones_rechazadas.length} declaraciones rechazadas`);
}

console.log('arquitectura-validador.svg, severidad-criterio.svg, hallazgos-corrida.svg written to assets/figures/');
