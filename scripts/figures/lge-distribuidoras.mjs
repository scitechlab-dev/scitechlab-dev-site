#!/usr/bin/env node
/**
 * Generates the three figures for the article on the LGE read from the
 * distributor's side:
 *
 *   assets/figures/lge-cuatro-frentes.svg   the four fronts and their articles
 *   assets/figures/lge-generacion-distribuida.svg  the 2026 retail-market reform
 *   assets/figures/lge-infracciones.svg     what a distributor can be fined for
 *
 *   node scripts/figures/lge-distribuidoras.mjs
 *
 * Every article number in these figures is read off the Ley General de
 * Electricidad, Decreto Legislativo 843 con reformas hasta el Decreto 548 del 9
 * de abril de 2026 (copia local en normativa/). Ninguno se infiere ni se
 * recuerda: si un numeral no estaba en el texto, no está acá.
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
// lge-cuatro-frentes.svg

{
  const W = 1200, H = 600;
  const g = canvas(W, H);
  g.text(60, 38, 'La ley, leída desde la distribuidora: cuatro frentes abiertos a la vez', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'la misma empresa responde por la red, por sus compras, por sus usuarios y por su información, y cada frente tiene su propio artículo', { size: 12, fill: INK_FAINT, anchor: 'start' });

  // Las líneas están cortadas a mano a unos 38 caracteres: la columna mide 262
  // px y con el número de artículo al lado no entraría nada.
  const FRENTES = [
    {
      tag: 'HACIA LA RED', color: TEAL,
      lead: 'Interconectar es obligación, no favor',
      items: [
        ['27', 'permitir la interconexión y el transporte,\nsalvo peligro para la operación'],
        ['28', 'las condiciones necesitan visto bueno\nprevio y expreso de la DGEHM'],
        ['30', 'salvo pacto en contrario, los costos de\nla interconexión los paga el solicitante'],
        ['31', 'responsabilidad por los daños que las\npropias instalaciones causen a terceros'],
      ],
    },
    {
      tag: 'HACIA EL MERCADO', color: AMBER,
      lead: 'Lo que compra define lo que cobra',
      items: [
        ['79', 'el pliego se basa en contratos de largo\nplazo adjudicados por libre concurrencia\ny en contratos de naturaleza pública'],
        ['78', 'presentar anualmente el pliego tarifario\na aprobación del regulador'],
        ['80', 'el pliego debe incluir una fórmula de\najuste'],
        ['67', 'los cargos de red se calculan sobre una\ndistribuidora eficiente, no sobre la real'],
      ],
    },
    {
      tag: 'HACIA EL USUARIO', color: INK,
      lead: 'Obligaciones con plazo y con metro',
      items: [
        ['77-C', 'expandir hasta cien metros a costa propia;\nmás allá, a costa del usuario, con\nfinanciamiento de doce cuotas sin interés'],
        ['76', 'separar en la factura el cargo de red del\ncargo por energía'],
        ['77', 'se tiene por no escrito cualquier cargo\npor cambio de comercializador'],
        ['83', 'el corte procede solo en los cinco casos\nque la ley enumera'],
      ],
    },
    {
      tag: 'HACIA EL REGULADOR', color: INK_FAINT,
      lead: 'Informar es obligación tipificada',
      items: [
        ['32', 'informe semestral: energía por tipo de\nconsumidor, fallas, compensaciones\npagadas y calidad del servicio'],
        ['67-bis', 'sistema auditable de medición de calidad,\ninformar incumplimientos y pagar las\ncompensaciones reguladas'],
        ['29-A', 'remitir a la DGEHM copia de solicitudes y\nresoluciones de interconexión, en cinco\ndías hábiles'],
        ['8', 'contabilidad separada por actividad y\nregistrada ante el regulador'],
      ],
    },
  ];

  const CW = 262, CGAP = 18;
  FRENTES.forEach((f, i) => {
    const x = 60 + i * (CW + CGAP);
    g.rect(x, 96, CW, 404, { fill: WASH, stroke: LINE, r: 8 });
    g.rect(x, 96, CW, 3, { fill: f.color, r: 1.5 });
    g.text(x + 16, 124, f.tag, { size: 11, weight: 600, fill: f.color, anchor: 'start', spacing: '0.08em' });
    g.text(x + 16, 146, f.lead, { size: 12.5, weight: 600, fill: INK, anchor: 'start' });
    let y = 178;
    f.items.forEach(([art, txt]) => {
      const lineas = txt.split('\n');
      g.rect(x + 16, y - 11, 46, 16, { fill: f.color, r: 3 });
      g.text(x + 39, y, art, { size: 10, font: MONO, weight: 600, fill: PAPER });
      lineas.forEach((ln, k) => g.text(x + 16, y + 20 + k * 14, ln, { size: 10.5, fill: INK_DIM, anchor: 'start' }));
      y += 20 + lineas.length * 14 + 16;
    });
  });

  g.text(60, 536, 'Los cuatro frentes no son independientes. El artículo 67 dice que los cargos de red se calculan sobre una empresa eficiente y dimensionada al', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 554, 'mercado actual, no sobre la red que la distribuidora efectivamente tiene: la diferencia entre las dos la absorbe la empresa, y por eso la eficiencia', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 572, 'operativa del frente de red aparece como margen en el frente de mercado.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'lge-cuatro-frentes.svg'), g.done());
}

// ---------------------------------------------------------------------------
// lge-generacion-distribuida.svg

{
  const W = 1200, H = 600;
  const g = canvas(W, H);
  g.text(60, 38, 'Lo que cambió en abril de 2026: el mercado minorista y el contrato de abastecimiento en distribución', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'Decreto 548. Reordena quién decide qué sobre la generación conectada a la red de distribución, y le da a la distribuidora obligaciones nuevas', { size: 12, fill: INK_FAINT, anchor: 'start' });

  // three actors, three columns of responsibility
  const ACTORES = [
    {
      x: 60, tag: 'DGEHM', color: TEAL,
      items: [
        ['32-B', 'emite los lineamientos de los procesos\ncompetitivos y fija los precios de los CAD'],
        ['32-C', 'responsable de los estudios de integración\nque fijan la capacidad máxima por circuito'],
        ['28-A', 'regula los cargos de interconexión de\ngeneración distribuida'],
      ],
    },
    {
      x: 440, tag: 'DISTRIBUIDORA', color: AMBER,
      items: [
        ['32-A', 'es la única compradora posible: el generador\ndistribuido del minorista solo puede venderle\na ella'],
        ['32-B', 'debe suscribir los contratos que resulten\nde los procesos'],
        ['32-D', 'pone a disposición de la UT las señales de\nregistro, monitoreo y control de esas plantas'],
        ['32-K', 'entrega la información de sus redes para los\nestudios de integración, actualizada'],
        ['28-A', 'revisa sin costo adicional los estudios de\ninterconexión que haga un tercero'],
      ],
    },
    {
      x: 820, tag: 'GENERADOR DISTRIBUIDO', color: INK,
      items: [
        ['32-D', 'entrega a la distribuidora las señales de\nregistro, monitoreo y control'],
        ['32-E', 'aporta reserva de regulación primaria y\nsecundaria, propia o comprada'],
        ['32-I', 'instala medición comercial conforme al\nReglamento de Operación'],
        ['32-H', 'puede instalar almacenamiento para dar su\npropia reserva'],
      ],
    },
  ];
  const AW = 320;
  ACTORES.forEach((a) => {
    g.rect(a.x, 96, AW, 300, { fill: WASH, stroke: LINE, r: 8 });
    g.rect(a.x, 96, AW, 3, { fill: a.color, r: 1.5 });
    g.text(a.x + 16, 124, a.tag, { size: 11.5, weight: 600, fill: a.color, anchor: 'start', spacing: '0.08em' });
    let y = 156;
    a.items.forEach(([art, txt]) => {
      g.text(a.x + 16, y, art, { size: 10.5, font: MONO, weight: 600, fill: a.color, anchor: 'start' });
      txt.split('\n').forEach((ln, k) => g.text(a.x + 62, y + k * 14, ln, { size: 10.5, fill: INK_DIM, anchor: 'start' }));
      y += txt.split('\n').length * 14 + 18;
    });
  });

  // the two exclusions
  const EXCL = [
    { x: 60, y: 420, art: '32-A', t: 'Una planta no puede estar en los dos mercados a la vez', b: 'mayorista o minorista, no ambos. La decisión de en cuál entrar\nes de una sola vez y condiciona todo lo demás.' },
    { x: 620, y: 420, art: '32-G', t: 'El generador con CAD no participa en capacidad firme', b: 'no se le reconoce potencia firme, así que su retribución sale\nentera del contrato y no del mecanismo de confiabilidad.' },
  ];
  EXCL.forEach((e) => {
    g.rect(e.x, e.y, 520, 96, { fill: PAPER, stroke: LINE_2, r: 8 });
    g.text(e.x + 20, e.y + 28, e.art, { size: 10.5, font: MONO, weight: 600, fill: AMBER, anchor: 'start' });
    g.text(e.x + 66, e.y + 28, e.t, { size: 12.5, weight: 600, fill: INK, anchor: 'start' });
    e.b.split('\n').forEach((ln, k) => g.text(e.x + 20, e.y + 52 + k * 16, ln, { size: 11.5, fill: INK_DIM, anchor: 'start' }));
  });

  g.text(60, 554, 'El artículo 32-A convierte a la distribuidora en compradora única de la generación distribuida del mercado minorista, pero el 32-B le quita el', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 572, 'precio y la obliga a suscribir. Es una posición monopsónica sin margen de negociación: todo el poder de decisión está aguas arriba.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'lge-generacion-distribuida.svg'), g.done());
}

// ---------------------------------------------------------------------------
// lge-infracciones.svg

{
  const W = 1200, H = 640;
  const g = canvas(W, H);
  g.text(60, 38, 'Por qué se sanciona a una distribuidora', { size: 17, weight: 600, fill: INK, anchor: 'start' });
  g.text(60, 60, 'la ley tipifica; no deja la calificación al criterio del inspector. Lo que cambia entre grave y muy grave suele ser una sola palabra: reiterada', { size: 12, fill: INK_FAINT, anchor: 'start' });

  const NIVELES = [
    {
      x: 60, color: AMBER, tag: 'GRAVES', art: 'art. 104-bis', multa: 'hasta 50 000 colones',
      items: [
        'No inscribir en plazo los contratos de transmisión y distribución',
        'La negativa ocasional y aislada a facilitar información al regulador',
        'Proporcionar información incompleta, inexacta o en forma distinta a la establecida',
        'Contabilidad de distribución que no cumple las normas del regulador',
        'Aplicación irregular, intencionada o negligente, de las normas de calidad de servicio',
        'Aplicar cargos por conexión y reconexión que no cumplen el método aprobado',
      ],
    },
    {
      x: 620, color: INK, tag: 'MUY GRAVES', art: 'art. 105', multa: 'hasta 500 000 colones',
      items: [
        'Negarse a interconectar la red sin justa causa, o no permitir su uso',
        'Desconectar las instalaciones de un operador sin causa justificada',
        'Aplicar cargos por uso de redes que no cumplen el método del regulador',
        'La negativa reiterada a facilitar información que hay obligación de suministrar',
        'El suministro de datos falsos o indebidamente manipulados',
        'La aplicación irregular reiterada de los pliegos tarifarios autorizados',
        'No separar los sistemas de contabilidad entre actividades',
      ],
    },
  ];
  NIVELES.forEach((n) => {
    g.rect(n.x, 96, 520, 340, { fill: WASH, stroke: LINE, r: 8 });
    g.rect(n.x, 96, 520, 3, { fill: n.color, r: 1.5 });
    g.text(n.x + 22, 126, n.tag, { size: 13, weight: 600, fill: n.color, anchor: 'start', spacing: '0.08em' });
    g.text(n.x + 520 - 22, 126, n.art, { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'end' });
    g.text(n.x + 22, 148, n.multa, { size: 12, fill: INK_DIM, anchor: 'start' });
    g.line(n.x + 22, 162, n.x + 498, 162, { stroke: LINE, w: 1 });
    n.items.forEach((it, k) => {
      g.dot(n.x + 28, 186 + k * 34 - 4, 2.5, n.color);
      const corte = it.length > 62 ? it.lastIndexOf(' ', 62) : -1;
      const lineas = corte > 0 ? [it.slice(0, corte), it.slice(corte + 1)] : [it];
      lineas.forEach((ln, j) => g.text(n.x + 42, 186 + k * 34 + j * 14, ln, { size: 11.5, fill: INK_DIM, anchor: 'start' }));
    });
  });

  // escalation
  g.rect(60, 456, 1080, 116, { fill: PAPER, stroke: LINE_2, r: 8 });
  g.text(82, 484, 'Y la reincidencia escala sola', { size: 13, weight: 600, fill: INK, anchor: 'start' });
  const ESC = [
    ['2.ª infracción', '+10 % sobre el monto', 'art. 107'],
    ['3.ª infracción', '+25 % sobre el monto', 'art. 107'],
    ['4.ª reincidencia', 'se inicia el proceso para declarar la terminación', 'art. 107'],
    ['incumplir una resolución firme', 'hasta 150 000 colones diarios', 'art. 106'],
  ];
  ESC.forEach((e, i) => {
    const ex = 82 + i * 268;
    g.text(ex, 512, e[0], { size: 11.5, weight: 600, fill: AMBER, anchor: 'start' });
    g.text(ex, 530, e[1], { size: 11, fill: INK_DIM, anchor: 'start' });
    g.text(ex, 548, e[2], { size: 10.5, font: MONO, fill: INK_FAINT, anchor: 'start' });
  });

  g.text(60, 606, 'La lista de agravantes del artículo 106 incluye el peligro para la vida y la salud, el daño causado, los perjuicios a la continuidad del suministro,', { size: 12, fill: INK_FAINT, anchor: 'start' });
  g.text(60, 624, 'el beneficio obtenido, la intencionalidad, la reincidencia en tres años y el efecto sobre terceros.', { size: 12, fill: INK_FAINT, anchor: 'start' });

  await writeFile(path.join(OUT, 'lge-infracciones.svg'), g.done());
}

console.log('lge-cuatro-frentes.svg, lge-generacion-distribuida.svg, lge-infracciones.svg written to assets/figures/');
