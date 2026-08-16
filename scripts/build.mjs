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
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const DIST = path.join(ROOT, 'dist');
const OUT_DIR = path.join(DIST, 'articles');
const TPL_DIR = path.join(ROOT, 'scripts', 'templates');
const INDEX = path.join(ROOT, 'index.html');
const SITE = 'https://scitechlab-dev.com';

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

marked.setOptions({ gfm: true, breaks: false });

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
 * Minimal front matter: a `---` fenced block of `key: value` lines at the top
 * of the file. Not YAML — no nesting, no lists. Values may be quoted, and
 * `true`/`false` become booleans so `draft: true` works.
 */
function parseFrontMatter(raw, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) {
    fail(file, 'missing the --- front matter block at the top of the file');
    return { data: {}, body: raw };
  }

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const sep = line.indexOf(':');
    if (sep === -1) {
      fail(file, `front matter line is not "key: value" — ${line.trim()}`);
      continue;
    }
    const key = line.slice(0, sep).trim();
    let value = line.slice(sep + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    data[key] = value;
  }

  return { data, body: raw.slice(match[0].length) };
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

function articleList(posts, { hrefPrefix, pad }) {
  if (posts.length === 0) {
    return indent('<p class="articles-empty">Nothing published yet.</p>', pad);
  }
  const rows = posts
    .map(
      (p) => `  <li class="article-row">
    <a href="${hrefPrefix}${p.slug}.html">
      <time datetime="${p.date}">${p.date}</time>
      <span class="a-title">${text(p.title)}</span>
      <span class="a-desc">${text(p.summary)}</span>
    </a>
  </li>`
    )
    .join('\n');
  return indent(`<ol class="articles">\n${rows}\n</ol>`, pad);
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

    for (const key of ['title', 'summary', 'date']) {
      if (!data[key]) fail(file, `front matter is missing "${key}"`);
    }
    if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(String(data.date))) {
      fail(file, `date must be YYYY-MM-DD, got "${data.date}"`);
    }
    if (!body.trim()) fail(file, 'has no body below the front matter');

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

    posts.push({
      file,
      slug,
      title: String(data.title ?? ''),
      summary: String(data.summary ?? ''),
      date: String(data.date ?? ''),
      topic: data.topic ? String(data.topic) : '',
      // Wrap tables the way the publications table is wrapped: a table wider
      // than the 660px article column scrolls in its own box rather than
      // pushing the page sideways on a phone.
      html: marked
        .parse(body)
        .replace(/<table>/g, '<div class="table-scroll"><table>')
        .replace(/<\/table>/g, '</table></div>'),
    });
  }

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

  for (const post of posts) {
    const page = articleTpl
      .replace(/\{\{CONTENT\}\}/g, indent(post.html, '        '))
      .replace(/\{\{TITLE\}\}/g, attr(post.title))
      .replace(/\{\{SUMMARY\}\}/g, attr(post.summary))
      .replace(/\{\{SLUG\}\}/g, post.slug)
      .replace(/\{\{DATE\}\}/g, post.date)
      .replace(/\{\{TOPIC\}\}/g, post.topic ? `\n        <span>${text(post.topic)}</span>` : '')
      .replace(/\{\{STYLE_V\}\}/g, v.style)
      .replace(/\{\{MAIN_V\}\}/g, v.main);

    const left = page.match(/\{\{[A-Z_]+\}\}/g);
    if (left) {
      console.error(`Build failed: ${post.file} left ${left.join(', ')} unreplaced.`);
      process.exit(1);
    }

    await writeFile(path.join(OUT_DIR, `${post.slug}.html`), page);
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
        `  <url><loc>${SITE}/articles/${p.slug}.html</loc><lastmod>${p.date}</lastmod></url>`
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
