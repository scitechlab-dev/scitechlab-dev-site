/**
 * The markdown dialect this site writes in: GitHub-flavoured markdown plus two
 * extensions, math and study notes.
 *
 * Kept out of build.mjs because both extensions are fiddly for the same
 * reason — they have to claim their text BEFORE marked's own inline rules see
 * it. A naive "render markdown, then look for $...$ in the HTML" pass is what
 * makes LaTeX come out as plain text on most static sites: by the time you look
 * at the HTML, marked has already eaten the backslashes and turned the two
 * underscores in `x_1 \cdot y_2` into an <em>. Registering a tokenizer at
 * `level: 'inline'` puts us ahead of that, and the raw TeX survives untouched.
 *
 * Verified with the four cases in content/_prueba-formulas.md, plus the two
 * that must NOT be treated as math: `$5 por MWh` inside a code span, and a
 * fenced block containing dollar signs. Both survive because the lexer walks
 * positionally — at a backtick our tokenizer does not match, so codespan takes
 * the whole span first.
 */

import { Marked } from 'marked';
import katex from 'katex';

/** Escape for use as HTML text. */
const text = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * KaTeX in strict-ish mode: a formula that does not parse FAILS THE BUILD
 * rather than rendering a red error string into the published article.
 *
 * This is deliberate and matches how the rest of the build treats bad input.
 * The default `throwOnError: false` is the wrong trade for a study notebook —
 * a silently mangled formula is worse than no page at all, because you would
 * study from it.
 *
 * `output` stays at the default 'htmlAndMathml': KaTeX emits a MathML copy
 * alongside the visual HTML, which is what a screen reader reads. That is free
 * accessibility and there is no reason to turn it off.
 */
function render(tex, { displayMode, file, onError }) {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: true,
      output: 'htmlAndMathml',
      // No \href, \htmlClass or \includegraphics from inside a formula.
      trust: false,
    });
  } catch (err) {
    const one = tex.replace(/\s+/g, ' ').trim();
    onError(file, `LaTeX no parsea — ${err.message.split('\n')[0]}\n      en: ${one}`);
    return '';
  }
}

/**
 * Display math: $$ ... $$ sitting on its own lines.
 *
 * Registered at block level so it is not wrapped in a <p>. KaTeX's own
 * .katex-display already handles the centring and the vertical rhythm.
 */
const mathBlock = (ctx) => ({
  name: 'mathBlock',
  level: 'block',
  start(src) {
    return src.indexOf('$$');
  },
  tokenizer(src) {
    const match = /^\$\$([\s\S]+?)\$\$(?:\n+|$)/.exec(src);
    if (match) return { type: 'mathBlock', raw: match[0], text: match[1].trim() };
  },
  renderer(token) {
    return render(token.text, { displayMode: true, ...ctx });
  },
});

/**
 * Inline math: $ ... $ inside a paragraph.
 *
 * The rule refuses to span a newline, so an unclosed `$` cannot swallow the
 * rest of the document — it just stays a literal dollar sign. It also refuses
 * an empty body, which keeps "$$" from being read as inline math when the block
 * rule has already declined it.
 */
const mathInline = (ctx) => ({
  name: 'mathInline',
  level: 'inline',
  start(src) {
    return src.indexOf('$');
  },
  tokenizer(src) {
    const match = /^\$([^\n$]+?)\$/.exec(src);
    if (match) return { type: 'mathInline', raw: match[0], text: match[1] };
  },
  renderer(token) {
    return render(token.text, { displayMode: false, ...ctx });
  },
});

/**
 * Study notes: a fenced container that becomes an <aside>.
 *
 *     ::: nota
 *     Whatever I want to say, in markdown.
 *     :::
 *
 * An optional label goes on the opening line — `::: nota Cómo se conecta con
 * SCADA` — and replaces the default one. The label lives inside the aside
 * rather than as an <h2> above it, so the whole note is one landmark for a
 * screen reader and you do not need a heading in the markdown as well.
 *
 * The body is re-lexed as block markdown, so lists, formulas and code all work
 * inside a note.
 */
const studyNote = {
  name: 'studyNote',
  level: 'block',
  start(src) {
    return src.indexOf('\n::: ');
  },
  tokenizer(src) {
    const match = /^::: *nota *([^\n]*)\n([\s\S]*?)\n::: *(?:\n+|$)/.exec(src);
    if (!match) return;
    return {
      type: 'studyNote',
      raw: match[0],
      label: match[1].trim() || 'Nota de estudio',
      tokens: this.lexer.blockTokens(match[2].trim() + '\n'),
    };
  },
  renderer(token) {
    const body = this.parser.parse(token.tokens);
    return (
      `<aside class="study-note" role="note">\n` +
      `<p class="study-note-label">${text(token.label)}</p>\n` +
      `${body}</aside>\n`
    );
  },
};

/**
 * Fenced code blocks, wrapped so they can carry a copy button.
 *
 * The button ships in the HTML but starts `hidden`; main.js reveals it only
 * where `navigator.clipboard` exists. That ordering matters: a visitor without
 * JS, or on a browser that blocks the clipboard, never sees a dead control, and
 * the code is still selectable by hand. Same progressive-enhancement shape as
 * the email copy button on the home page.
 *
 * The language, when the fence declares one, is printed as a label. It is
 * decoration for the reader, not a hook for a highlighter: this site does not
 * ship one, because syntax colouring in a study notebook is the kind of weight
 * that buys very little.
 */
function codeBlock() {
  return {
    name: 'code',
    level: 'block',
    renderer(token) {
      const lang = (token.lang || '').trim().split(/\s+/)[0];
      const label = lang ? `<span class="code-lang">${text(lang)}</span>` : '';
      const cls = lang ? ` class="language-${text(lang)}"` : '';
      return (
        `<div class="code-wrap">\n` +
        `<div class="code-bar">${label}` +
        `<button type="button" class="code-copy" hidden>Copiar</button></div>\n` +
        `<pre><code${cls}>${text(token.text)}\n</code></pre>\n` +
        `</div>\n`
      );
    },
  };
}

/**
 * Build a markdown renderer.
 *
 * `math` is per-file on purpose, driven by `math: true` in the front matter.
 * With it off, `$` is an ordinary character — which matters, because this site
 * writes about prices and "$5 por MWh" must not become a formula. Marked
 * instances are cheap, so each article gets one configured for itself rather
 * than everything sharing one global registration.
 */
export function createMarkdown({ math = false, file = '', onError } = {}) {
  const md = new Marked({ gfm: true, breaks: false });
  const ctx = { file, onError };

  const extensions = [studyNote, codeBlock()];
  if (math) extensions.push(mathBlock(ctx), mathInline(ctx));
  md.use({ extensions });

  return md;
}

/**
 * Does this source look like it wants math? Used to catch the two ways the
 * `math:` flag can be wrong: set on an article with no formulas (harmless, but
 * it loads a stylesheet for nothing) and missing from one that has them (the
 * formulas would ship as literal dollar signs, which is the exact bug this
 * whole module exists to prevent).
 *
 * Deliberately crude: it strips fenced blocks and code spans first, then looks
 * for a `$...$` pair on one line. False positives are cheap here — the result
 * only drives a build warning.
 */
export function looksLikeMath(body) {
  const stripped = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  return /\$\$[\s\S]+?\$\$/.test(stripped) || /\$[^\n$]+\$/.test(stripped);
}
