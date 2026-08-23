#!/usr/bin/env node
/**
 * Assembles the whole deployable site into dist/.
 *
 *   node scripts/build.mjs
 *
 * Two jobs:
 *   1. Render content/*.md into dist/articles/*.html. Drop a markdown file in
 *      content/, push, and the Worker build runs this. Nothing renders markdown
 *      in the browser — each article ships as plain static HTML so the og:* tags
 *      LinkedIn scrapes are really in the document.
 *   2. Copy the hand-written files (index.html, assets/, _headers, robots.txt)
 *      next to them, injecting the article list into index.html on the way.
 *
 * dist/ is an ALLOWLIST, and that is the point. The Worker serves this
 * directory and nothing else, so .git, node_modules, content/ and scripts/
 * cannot leak no matter what lands in the repo root. An earlier setup pointed
 * the Worker at the repo root and served /.git/config to the public.
 *
 * Nothing here writes back into the source tree: `git status` stays clean.
 */

import { readFile, writeFile, readdir, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';
import { createMarkdown, looksLikeMath } from './markdown.mjs';

const require = createRequire(import.meta.url);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const DIST = path.join(ROOT, 'dist');
const OUT_DIR = path.join(DIST, 'articles');
const TPL_DIR = path.join(ROOT, 'scripts', 'templates');
const INDEX = path.join(ROOT, 'index.html');
const SITE = 'https://scitechlab-dev.com';

/** Standalone pages that are not articles — pages/*.md becomes /<slug>. */
const PAGES_DIR = path.join(ROOT, 'pages');
/** Series manifests — series/*.yml becomes /serie/<slug>. */
const SERIES_DIR = path.join(ROOT, 'series');

/**
 * KaTeX ships its stylesheet and 20 font files inside node_modules. They are
 * copied into dist/assets/katex/ at build time rather than committed, so
 * `npm update katex` is the whole upgrade — nothing in the repo to re-vendor by
 * hand and get wrong.
 *
 * Only the .woff2 files are copied. KaTeX also ships .woff and .ttf for
 * browsers that predate 2020, which quadruples the payload from 296 KB to
 * 1.2 MB for a compatibility window nobody here is in. The stylesheet is
 * rewritten on the way out to drop the src entries that point at them.
 */
const KATEX_DIR = path.dirname(require.resolve('katex/package.json'));
const KATEX_VERSION = require('katex/package.json').version;

/**
 * The only things that reach the public. Adding a file to the site means adding
 * it here — a deliberate speed bump, since the whole safety of the setup rests
 * on this list staying short and explicit.
 */
const STATIC = ['assets', '_headers', 'robots.txt'];

/** How many of the most recent articles the home page lists. */
const HOME_LIMIT = 4;

const START = '<!-- ARTICLES:START -->';
const END = '<!-- ARTICLES:END -->';

const problems = [];
const fail = (file, msg) => problems.push(`${file}: ${msg}`);

/** Escape for use inside a double-quoted HTML attribute. */
const attr = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Escape for use as HTML text. */
const text = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Front matter: a `---` fenced YAML block at the top of the file.
 *
 * This used to be a hand-rolled `key: value` line parser, which was fine while
 * every field was a scalar. It stopped being fine the moment articles needed
 * `tags: [a, b]` — the old parser stored that as the literal string "[a, b]"
 * and reported no error, which is the worst way for a build to be wrong.
 *
 * js-yaml parses `date: 2026-08-22` as a STRING, not a Date, so the
 * YYYY-MM-DD check downstream still sees what it expects. Do not "fix" that by
 * switching schemas.
 */
function parseFrontMatter(raw, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) {
    fail(file, 'missing the --- front matter block at the top of the file');
    return { data: {}, body: raw };
  }

  let data;
  try {
    data = loadYaml(match[1]) ?? {};
  } catch (err) {
    fail(file, `front matter is not valid YAML — ${err.message.split('\n')[0]}`);
    return { data: {}, body: raw.slice(match[0].length) };
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    fail(file, 'front matter must be a block of key: value pairs');
    data = {};
  }

  return { data, body: raw.slice(match[0].length) };
}

/**
 * Read a front matter field that may be written either as a YAML list or as a
 * bare scalar, so `tags: costos` and `tags: [costos, despacho]` both work.
 * Empty and missing both come back as [].
 */
function asList(value) {
  if (value == null || value === '') return [];
  return (Array.isArray(value) ? value : [value])
    .map((v) => String(v).trim())
    .filter(Boolean);
}

/**
 * The asset cache-busting versions are the ones index.html already uses, read
 * at build time rather than duplicated in the templates — otherwise the
 * articles drift behind the home page every time style.css is bumped.
 */
function assetVersions(indexHtml) {
  const pick = (file, fallback) => {
    const m = new RegExp(`assets/${file}\\?v=(\\d+)`).exec(indexHtml);
    return m ? m[1] : fallback;
  };
  return { style: pick('style\\.css', '1'), main: pick('main\\.js', '1') };
}

/**
 * Indent a block of HTML so the generated page stays readable — but never
 * inside <pre>, where leading whitespace is part of the code the reader sees.
 */
function indent(html, pad) {
  let inPre = false;
  return html
    .trimEnd()
    .split('\n')
    .map((line) => {
      const out = inPre ? line : line.trim() ? pad + line : '';
      if (/<pre[\s>]/.test(line) && !/<\/pre>/.test(line)) inPre = true;
      else if (/<\/pre>/.test(line)) inPre = false;
      return out;
    })
    .join('\n');
}

/**
 * The handful of shell strings that have to follow the page's own language.
 *
 * This is not an i18n framework and should not grow into one. Each article
 * lives in exactly ONE language — there are no translated pairs, no language
 * switcher and no hreflang, because a switcher implies every article exists
 * twice and stays in sync forever. What this fixes is narrower and real: a
 * Spanish page whose chrome says "Skip to content" and "← Writing" reads as a
 * translation someone abandoned halfway.
 *
 * If a language is ever missing here the build falls back to English rather
 * than emitting an empty nav.
 */
const T = {
  en: {
    skip: 'Skip to content',
    work: 'Work',
    writing: 'Writing',
    contact: 'Contact',
    back: '← Writing',
  },
  es: {
    skip: 'Ir al contenido',
    work: 'Trabajo',
    writing: 'Escritos',
    contact: 'Contacto',
    back: '← Escritos',
  },
};
const t = (lang) => T[lang] ?? T.en;

/** Apply the shell strings and the language attribute to a rendered template. */
const localise = (html, lang) => {
  const s = t(lang);
  return html
    .replace(/\{\{LANG\}\}/g, attr(lang))
    .replace(/\{\{T_SKIP\}\}/g, text(s.skip))
    .replace(/\{\{T_WORK\}\}/g, text(s.work))
    .replace(/\{\{T_WRITING\}\}/g, text(s.writing))
    .replace(/\{\{T_CONTACT\}\}/g, text(s.contact))
    .replace(/\{\{T_BACK\}\}/g, text(s.back));
};

/**
 * Links and canonical URLs drop the .html: Workers static assets serve
 * foo.html at /foo and 307-redirect /foo.html to it. Pointing og:url or a link
 * at the .html form just adds a redirect hop and makes the canonical tag
 * disagree with the URL that actually serves the page.
 */
function articleList(posts, { hrefPrefix, pad }) {
  if (posts.length === 0) {
    return indent('<p class="articles-empty">Nothing published yet.</p>', pad);
  }
  const rows = posts
    .map(
      (p) => `  <li class="article-row">
    <a href="${hrefPrefix}${p.slug}">
      <time datetime="${p.date}">${p.date}</time>
      <span class="a-title">${text(p.title)}</span>
      <span class="a-desc">${text(p.summary)}</span>
      <span class="a-lang" lang="${attr(p.lang)}">${text(p.lang)}</span>
    </a>
  </li>`
    )
    .join('\n');
  return indent(`<ol class="articles">\n${rows}\n</ol>`, pad);
}

/**
 * Copy KaTeX's stylesheet and woff2 fonts into dist/assets/katex/.
 *
 * The stylesheet is rewritten, not copied verbatim: every @font-face in KaTeX
 * lists woff2, woff and ttf, and a browser only downloads the first format it
 * understands — but shipping all three still puts 900 KB of dead weight in the
 * repo's deploy for browsers that predate 2020. The rewrite strips the woff and
 * ttf sources and leaves the woff2 one.
 *
 * The version query comes from KaTeX's own package.json, so upgrading the
 * dependency busts the immutable one-year cache on /assets/* automatically.
 * This is the one asset version that is NOT hand-maintained.
 */
async function vendorKatex() {
  const outDir = path.join(DIST, 'assets', 'katex');
  await mkdir(path.join(outDir, 'fonts'), { recursive: true });

  const css = await readFile(path.join(KATEX_DIR, 'dist', 'katex.min.css'), 'utf8');
  const woff2Only = css.replace(/src:([^;]+);/g, (whole, list) => {
    const keep = list
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.includes('.woff2'));
    return keep.length ? `src:${keep.join(',')};` : whole;
  });
  await writeFile(path.join(outDir, 'katex.min.css'), woff2Only);

  const fontsIn = path.join(KATEX_DIR, 'dist', 'fonts');
  const fonts = (await readdir(fontsIn)).filter((f) => f.endsWith('.woff2'));
  if (fonts.length === 0) {
    console.error('Build failed: no .woff2 files in katex/dist/fonts.');
    process.exit(1);
  }
  for (const f of fonts) {
    await cp(path.join(fontsIn, f), path.join(outDir, 'fonts', f));
  }
  console.log(`  → dist/assets/katex/ (katex ${KATEX_VERSION}, ${fonts.length} fonts)`);
}

/**
 * The <link> that pulls in KaTeX's stylesheet, or nothing at all. An article
 * without formulas must not pay for the stylesheet, which is the whole reason
 * `math:` is a per-article flag rather than a site-wide setting.
 */
const katexHead = (post, prefix) =>
  post.math
    ? `\n<link rel="stylesheet" href="${prefix}assets/katex/katex.min.css?v=${KATEX_VERSION}" />`
    : '';

/**
 * Standalone pages: pages/*.md becomes dist/<slug>.html, served at /<slug>.
 *
 * They live in their own directory rather than in content/ because content/ is
 * the article scanner — anything dropped there becomes a dated, listed article
 * with a summary and a slot in the archive. A sources page is not an article.
 * Same front matter minus `date`, same markdown dialect, same math flag.
 */
async function readPages() {
  if (!existsSync(PAGES_DIR)) return [];
  const files = (await readdir(PAGES_DIR)).filter((f) => f.endsWith('.md')).sort();
  const pages = [];

  for (const file of files) {
    const raw = await readFile(path.join(PAGES_DIR, file), 'utf8');
    const { data, body } = parseFrontMatter(raw, `pages/${file}`);
    if (!data.summary && data.excerpt) data.summary = data.excerpt;
    for (const key of ['title', 'summary']) {
      if (!data[key]) fail(`pages/${file}`, `front matter is missing "${key}"`);
    }
    if (!body.trim()) fail(`pages/${file}`, 'has no body below the front matter');

    const slug = data.slug ? String(data.slug) : file.replace(/\.md$/, '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      fail(`pages/${file}`, `slug "${slug}" must be lowercase letters, digits and dashes`);
    }

    const wantsMath = data.math === true;
    if (!wantsMath && looksLikeMath(body)) {
      fail(`pages/${file}`, 'has $...$ math but no `math: true` in its front matter');
    }
    const md = createMarkdown({ math: wantsMath, file: `pages/${file}`, onError: fail });

    pages.push({
      file,
      slug,
      title: String(data.title ?? ''),
      summary: String(data.summary ?? ''),
      math: wantsMath,
      lang: data.lang ? String(data.lang) : 'en',
      html: md
        .parse(body)
        .replace(/<table>/g, '<div class="table-scroll"><table>')
        .replace(/<\/table>/g, '</table></div>'),
    });
  }
  return pages;
}

/**
 * Series manifests: series/*.yml becomes dist/serie/<slug>.html.
 *
 * A series index has to list articles that DO NOT EXIST YET — that is most of
 * its value while the series is being written. So the running order lives in a
 * manifest rather than being derived from content/, and each entry is matched
 * against the built posts by slug: found means a link plus that article's real
 * `estado`, missing means it renders as planned-but-unwritten. Nothing here
 * invents a status; a written article's state always comes from its own front
 * matter.
 */
async function readSeries(posts) {
  if (!existsSync(SERIES_DIR)) return [];
  const files = (await readdir(SERIES_DIR)).filter((f) => /\.ya?ml$/.test(f)).sort();
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const out = [];

  for (const file of files) {
    const where = `series/${file}`;
    let data;
    try {
      data = loadYaml(await readFile(path.join(SERIES_DIR, file), 'utf8')) ?? {};
    } catch (err) {
      fail(where, `not valid YAML — ${err.message.split('\n')[0]}`);
      continue;
    }
    for (const key of ['title', 'summary']) {
      if (!data[key]) fail(where, `is missing "${key}"`);
    }
    if (!Array.isArray(data.articulos) || data.articulos.length === 0) {
      fail(where, 'needs an `articulos:` list');
      continue;
    }

    const entries = data.articulos.map((a, i) => {
      if (!a || !a.slug || !a.titulo) {
        fail(where, `articulos[${i}] needs both "slug" and "titulo"`);
        return null;
      }
      const post = bySlug.get(String(a.slug));
      return {
        n: i + 1,
        slug: String(a.slug),
        titulo: String(a.titulo),
        resumen: a.resumen ? String(a.resumen) : '',
        // `escrito` is derived, never declared: it is whether the build found a
        // matching article, so the manifest cannot claim something is published
        // when no file exists.
        escrito: Boolean(post),
        estado: post ? post.estado || 'publicado' : 'no-escrito',
      };
    });

    out.push({
      slug: data.slug ? String(data.slug) : file.replace(/\.ya?ml$/, ''),
      title: String(data.title),
      summary: String(data.summary),
      lang: data.lang ? String(data.lang) : 'en',
      entries: entries.filter(Boolean),
    });
  }
  return out;
}

/** Human labels for the `estado` values, plus the derived not-written-yet one. */
const ESTADO_LABEL = {
  borrador: 'Borrador',
  'en-revision': 'En revisión',
  publicado: 'Publicado',
  'no-escrito': 'Sin escribir',
};

/** The ordered list on a series index page. */
function seriesList(s, pad) {
  const rows = s.entries
    .map((e) => {
      const label = ESTADO_LABEL[e.estado] ?? e.estado;
      const inner = `<span class="serie-n">${String(e.n).padStart(2, '0')}</span>
    <span class="serie-title">${text(e.titulo)}</span>
    <span class="serie-desc">${text(e.resumen)}</span>
    <span class="serie-estado" data-estado="${attr(e.estado)}">${text(label)}</span>`;
      return `  <li class="serie-row">
    ${e.escrito ? `<a href="../articles/${e.slug}">${inner}</a>` : `<div>${inner}</div>`}
  </li>`;
    })
    .join('\n');
  return indent(`<ol class="serie">\n${rows}\n</ol>`, pad);
}

async function main() {
  if (!existsSync(CONTENT_DIR)) {
    console.error(`No content/ directory at ${CONTENT_DIR} — nothing to build.`);
    process.exit(1);
  }

  const indexHtml = await readFile(INDEX, 'utf8');
  const v = assetVersions(indexHtml);
  const articleTpl = await readFile(path.join(TPL_DIR, 'article.html'), 'utf8');
  const archiveTpl = await readFile(path.join(TPL_DIR, 'archive.html'), 'utf8');

  const files = (await readdir(CONTENT_DIR))
    .filter((f) => f.endsWith('.md'))
    .sort();

  const posts = [];
  const seen = new Map();

  for (const file of files) {
    const raw = await readFile(path.join(CONTENT_DIR, file), 'utf8');
    const { data, body } = parseFrontMatter(raw, file);

    if (data.draft === true) {
      console.log(`  · skipping draft ${file}`);
      continue;
    }

    // `excerpt` is accepted as a synonym for `summary`: the series drafts were
    // written against that name, and failing a build over which of two words
    // means the same thing helps nobody.
    if (!data.summary && data.excerpt) data.summary = data.excerpt;

    for (const key of ['title', 'summary', 'date']) {
      if (!data[key]) fail(file, `front matter is missing "${key}"`);
    }
    if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(String(data.date))) {
      fail(file, `date must be YYYY-MM-DD, got "${data.date}"`);
    }
    if (!body.trim()) fail(file, 'has no body below the front matter');

    // The math flag is per-article and load-bearing, so both ways of getting it
    // wrong are caught here rather than discovered by reading the published
    // page. Without it, `$` stays an ordinary character — which is what you
    // want in an article that quotes prices in dollars.
    const wantsMath = data.math === true;
    if (!wantsMath && looksLikeMath(body)) {
      fail(
        file,
        'looks like it contains $...$ math but has no `math: true` in its front ' +
          'matter — the formulas would ship as literal dollar signs'
      );
    }
    if (wantsMath && !looksLikeMath(body)) {
      console.log(`  · ${file} sets math: true but has no formulas`);
    }

    const estado = data.estado ? String(data.estado) : '';
    const ESTADOS = ['borrador', 'en-revision', 'publicado'];
    if (estado && !ESTADOS.includes(estado)) {
      fail(file, `estado "${estado}" must be one of ${ESTADOS.join(', ')}`);
    }

    // A filename may carry a date prefix for ordering on disk; the URL never
    // does. `slug:` in the front matter wins if you need to rename the file
    // without breaking a link you already shared.
    const slug =
      data.slug || file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      fail(file, `slug "${slug}" must be lowercase letters, digits and dashes`);
    }
    if (seen.has(slug)) {
      fail(file, `slug "${slug}" is already used by ${seen.get(slug)}`);
    }
    seen.set(slug, file);

    const md = createMarkdown({ math: wantsMath, file, onError: fail });

    posts.push({
      file,
      slug,
      title: String(data.title ?? ''),
      summary: String(data.summary ?? ''),
      date: String(data.date ?? ''),
      topic: data.topic ? String(data.topic) : '',
      categories: asList(data.categories),
      tags: asList(data.tags),
      estado,
      math: wantsMath,
      // The site is in English; the mercado-eléctrico series is in Spanish.
      // Rather than translate the shell, each article declares its own language
      // and the template puts it on <html lang>. That is what a screen reader
      // switches voices on and what Google reads to decide who to show it to.
      lang: data.lang ? String(data.lang) : 'en',
      // Wrap tables the way the publications table is wrapped: a table wider
      // than the 660px article column scrolls in its own box rather than
      // pushing the page sideways on a phone.
      html: md
        .parse(body)
        .replace(/<table>/g, '<div class="table-scroll"><table>')
        .replace(/<\/table>/g, '</table></div>'),
    });
  }

  const pages = await readPages();
  const series = await readSeries(posts);

  if (problems.length) {
    console.error('\nBuild failed:\n' + problems.map((p) => `  ✗ ${p}`).join('\n') + '\n');
    process.exit(1);
  }

  // Newest first; same-day posts fall back to slug so the order is stable.
  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

  // dist/ is rebuilt from scratch, so a renamed or deleted source file can
  // never leave an orphaned page live.
  await rm(DIST, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  for (const entry of STATIC) {
    const from = path.join(ROOT, entry);
    if (!existsSync(from)) {
      console.error(`Build failed: ${entry} is listed in STATIC but does not exist.`);
      process.exit(1);
    }
    await cp(from, path.join(DIST, entry), { recursive: true });
  }
  console.log(`  → dist/ ${STATIC.join(', ')}`);

  // After the static copy, never before: STATIC copies assets/ wholesale, and
  // KaTeX is written inside it.
  if (posts.some((p) => p.math) || pages.some((p) => p.math)) await vendorKatex();

  for (const post of posts) {
    const page = articleTpl
      .replace(/\{\{CONTENT\}\}/g, indent(post.html, '        '))
      .replace(/\{\{TITLE\}\}/g, attr(post.title))
      .replace(/\{\{SUMMARY\}\}/g, attr(post.summary))
      .replace(/\{\{SLUG\}\}/g, post.slug)
      .replace(/\{\{DATE\}\}/g, post.date)
      .replace(/\{\{MATH_HEAD\}\}/g, katexHead(post, '../'))
      .replace(/\{\{TOPIC\}\}/g, post.topic ? `\n        <span>${text(post.topic)}</span>` : '')
      .replace(/\{\{STYLE_V\}\}/g, v.style)
      .replace(/\{\{MAIN_V\}\}/g, v.main);

    const localised = localise(page, post.lang);
    const left = localised.match(/\{\{[A-Z_]+\}\}/g);
    if (left) {
      console.error(`Build failed: ${post.file} left ${left.join(', ')} unreplaced.`);
      process.exit(1);
    }

    await writeFile(path.join(OUT_DIR, `${post.slug}.html`), localised);
    console.log(`  → dist/articles/${post.slug}.html`);
  }

  await writeFile(
    path.join(OUT_DIR, 'index.html'),
    archiveTpl
      .replace(/\{\{ARTICLES\}\}/g, articleList(posts, { hrefPrefix: '', pad: '      ' }))
      .replace(/\{\{STYLE_V\}\}/g, v.style)
      .replace(/\{\{MAIN_V\}\}/g, v.main)
  );
  console.log('  → dist/articles/index.html');

  const pageTpl = await readFile(path.join(TPL_DIR, 'page.html'), 'utf8');

  for (const page of pages) {
    const html = pageTpl
      .replace(/\{\{CONTENT\}\}/g, indent(page.html, '        '))
      .replace(/\{\{TITLE\}\}/g, attr(page.title))
      .replace(/\{\{SUMMARY\}\}/g, attr(page.summary))
      .replace(/\{\{SLUG\}\}/g, page.slug)
      .replace(/\{\{MATH_HEAD\}\}/g, katexHead(page, ''))
      .replace(/\{\{UP\}\}/g, '')
      .replace(/\{\{STYLE_V\}\}/g, v.style)
      .replace(/\{\{MAIN_V\}\}/g, v.main);
    await writeFile(path.join(DIST, `${page.slug}.html`), localise(html, page.lang));
    console.log(`  → dist/${page.slug}.html`);
  }

  if (series.length) await mkdir(path.join(DIST, 'serie'), { recursive: true });
  for (const s of series) {
    const html = pageTpl
      .replace(/\{\{CONTENT\}\}/g, seriesList(s, '        '))
      .replace(/\{\{TITLE\}\}/g, attr(s.title))
      .replace(/\{\{SUMMARY\}\}/g, attr(s.summary))
      .replace(/\{\{SLUG\}\}/g, `serie/${s.slug}`)
      .replace(/\{\{MATH_HEAD\}\}/g, '')
      .replace(/\{\{UP\}\}/g, '../')
      .replace(/\{\{STYLE_V\}\}/g, v.style)
      .replace(/\{\{MAIN_V\}\}/g, v.main);
    await writeFile(path.join(DIST, 'serie', `${s.slug}.html`), localise(html, s.lang));
    console.log(`  → dist/serie/${s.slug}.html`);
  }

  // Home page list, between the markers. The marker's own indentation sets the
  // indentation of everything written between them, so the block lands aligned
  // with the surrounding markup no matter where the section is moved to.
  const marker = /([ \t]*)<!-- ARTICLES:START -->[\s\S]*?<!-- ARTICLES:END -->/;
  const found = marker.exec(indexHtml);
  if (!found) {
    console.error(`Build failed: index.html is missing the ${START} / ${END} markers.`);
    process.exit(1);
  }

  const pad = found[1];
  const recent = posts.slice(0, HOME_LIMIT);
  let block = articleList(recent, { hrefPrefix: 'articles/', pad });
  if (posts.length > recent.length) {
    block +=
      `\n${pad}<p class="articles-more"><a href="articles/">All writing <span aria-hidden="true">→</span></a></p>`;
  }

  // Replacement via callback: a title containing "$&" must not be treated as a
  // substitution pattern. The result goes to dist/, never back into the source
  // index.html — the repo keeps the empty placeholder and `git status` stays
  // clean whether or not you have run a build.
  const home = indexHtml.replace(marker, () => `${pad}${START}\n${block}\n${pad}${END}`);
  await writeFile(path.join(DIST, 'index.html'), home);
  console.log('  → dist/index.html');

  // robots.txt points at this, so it has to exist even with zero articles.
  const urls = [
    `  <url><loc>${SITE}/</loc></url>`,
    `  <url><loc>${SITE}/articles/</loc></url>`,
    ...posts.map(
      (p) =>
        `  <url><loc>${SITE}/articles/${p.slug}</loc><lastmod>${p.date}</lastmod></url>`
    ),
  ];
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  );
  console.log('  → dist/sitemap.xml');

  console.log(`\nBuilt ${posts.length} article${posts.length === 1 ? '' : 's'} into dist/.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
