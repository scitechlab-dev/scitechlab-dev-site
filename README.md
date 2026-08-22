# scitechlab-dev-site

Personal site for **Josué Aldana-Aguilar**, Electrical Engineer, currently a grid
operations analyst building data-driven tools for energy utilities. Static
HTML/CSS/JS served by a **Cloudflare Worker** (static assets, no `main`),
deployed by Workers Builds on every push to `main`.

The pages are hand-written HTML. The one build step assembles `dist/` — the
deployable site — and turns `content/*.md` into `dist/articles/*.html`, so
publishing an article means adding a markdown file and pushing, nothing more.

Live at [scitechlab-dev.com](https://scitechlab-dev.com). Project work that
outgrows a single page (e.g. ongoing HAB telemetry work) gets its own subdomain,
such as `hab.scitechlab-dev.com`, with this site linking out to it.

## Structure

```
.
├── index.html            # single-page site
│                         #   hero → signal chain → statement → work (one row
│                         #   per domain) → publications → writing → contact,
│                         #   divided by label bands, all on one .sheet
├── content/              # SOURCE: one markdown file per article
│   └── _example.md       #   a draft; copy it to start writing
├── dist/                 # GENERATED, gitignored — the deployed site
├── scripts/
│   ├── build.mjs         # assembles dist/; content/*.md → dist/articles/*.html
│   └── templates/
│       ├── article.html  # shell every article shares
│       └── archive.html  # the /articles/ index
├── assets/
│   ├── style.css         # drawing-sheet theme, CSS variables
│   ├── main.js           # footer year + scroll reveal
│   ├── portrait.jpg
│   ├── favicon.svg       # JA badge, SEL-style (the two PNGs are generated from it)
│   └── share.png         # 1200x627 og:image used by LinkedIn preview cards
├── _headers              # security + cache headers
├── robots.txt
├── wrangler.jsonc        # Worker config: assets dir + build command
└── README.md
```

## Deploy

A Cloudflare Worker serving static assets, built and deployed by Workers Builds
on every push to `main`. All of it is configured in `wrangler.jsonc` — the only
dashboard settings that matter are the Git connection and the deploy command
(`npx wrangler deploy`, the default).

The build runs from `wrangler.jsonc`'s `build.command`, not from the dashboard
"Build command" field, which can stay empty. Wrangler runs it before reading the
assets directory, including for assets-only Workers.

If the build fails, the previous version stays live — a broken article cannot
take the site down, it just does not ship.

Manual deploy: `npx wrangler deploy` (it runs the build itself).

### dist/ is an allowlist, and that is load-bearing

`assets.directory` points at `dist/`, which `scripts/build.mjs` assembles from an
explicit list of files. **Never point it at `"."`.** Workers static assets
exclude nothing by default, so serving the repo root published the entire git
repository — `/.git/config` and `/.git/index` were fetchable by anyone, which
means the full history was downloadable. `.assetsignore` is the documented fix
but did not filter anything when tested against wrangler 4.103; the allowlist
does not depend on it working.

To add a new top-level file to the site, add it to the `STATIC` array in
`scripts/build.mjs`. If it is not on that list, it is not published.

## Editing content

### Colors

Every color lives in the `:root` block at the top of `assets/style.css`, hex
values and the matching `--*-rgb` channel triplets that the partial-alpha
values use. Nothing downstream hard-codes a color, so retheming the whole site
means editing that one block.

**The amber exists at two lightnesses, and that is the one thing to get right.**
On black a single `#ffb000` could both carry text and glow; on paper it cannot.

- `--accent` (`#8a5200`) is the **text** amber — links, DOIs, `View live
  project`, the schematics' one accent stroke. It is 6.4:1 on the plate, so it
  passes AA at body size. Anything a reader has to *read* uses this.
- `--accent-mark` (`#f0a500`) is the **mark** amber — the closed breaker, the
  band squares, the hero ticks, the scroll bar, the corner brackets, and every
  glow. Never put text on it and never use it for text.
- `--accent-rgb` tracks `--accent-mark`, because every partial-alpha use in the
  stylesheet is a glow or a wash.

Change one and you almost always want to change all four, plus `--accent-hi`
(the hover step) and `--on-accent` (text on a filled `--accent`).

`--ink-dim` and `--ink-faint` are set at the contrast floor for their sizes
(6.9:1 and 4.8:1). `--ink-faint` carries 10–12px mono labels, so lightening it
is what breaks accessibility first.

### Publications

`#publications` is a plain `<table>` mirroring the ORCID record at
`0000-0002-7686-5065`, newest first. Nothing fetches it at runtime — adding a
paper means adding a `<tr>` by hand. Every row should carry a resolvable DOI;
when a new paper has none yet, leave the cell with the venue rather than
linking to something that 404s. The table sits in `.table-scroll` because the
DOI column cannot wrap without looking broken, so on a phone the table scrolls
inside its own box instead of pushing the page sideways.

### Work section

Each domain is a full-bleed `<div class="domain">` row (glyph, name, count)
followed by a `<div class="wrap domain-projects">` holding that domain's
`<li class="project">` cards. Colors and fonts are CSS variables at the top of
`assets/style.css` (`--accent` is the amber signal color).

**When adding or removing a project, update two things by hand:** the count in
its domain row (`<span class="domain-count">`) and the detail designations
(`<span class="desig">`) on the cards after it. Nothing renumbers them
automatically. Designations run `EE-01…`, `DS-01…`, `EL-01…` per domain, in the
order the cards appear — they are the sheet's way of numbering its detail
views, and a gap or a duplicate reads as a mistake rather than as a style.

A card is a thumbnail, an `<h4>`, a sentence and a stack list — nothing else.
There are deliberately no status pills or kind tags on them: labelling every
card `Project` / `Ongoing` reads as filler, and the sentence already says what
the thing is. Don't reintroduce them.

There is no JavaScript behind the work section anymore — the tabs are gone and
every project is visible on load.

### Adding a thumbnail

Each `<li class="project">` opens with an inline SVG schematic. Copy the shell
from any existing card:

```html
<svg class="thumb" viewBox="0 0 440 140" preserveAspectRatio="xMidYMid slice"
     aria-hidden="true" focusable="false" fill="none" stroke="currentColor"
     stroke-width="1.5" stroke-linecap="round">
```

Four things are load-bearing:

- **Draw inside the `y 38..106` band.** With `preserveAspectRatio="slice"`,
  width drives the scale and the strip shows a horizontal band through the
  middle of the 440x140 box. **Which band is set by the strip's aspect ratio,
  not by its pixel height** — that is why `.thumb` carries
  `aspect-ratio: 440 / 80` and `height: auto` rather than a fixed height.
  440/80 shows `y 30..110` at every card width. A fixed height re-crops every
  drawing whenever the column width changes, and it fails silently: it once
  clipped all ten schematics at the same time. `30..110` is the margin that
  absorbs the handful of existing drawings that stray a little past the
  `38..106` contract — do not rely on it for new ones.
- **`currentColor` for structure.** It inherits `--line-2` and brightens on card
  hover. Never hard-code a grey.
- **One amber idea per thumbnail, `class="th-acc"`** (or `th-acc-f` when it is
  filled rather than stroked); wrap it in a `<g>` if it takes several paths.
  That is what glows on hover. Two unrelated amber things in one thumbnail and
  neither reads as the point. `.th-acc` resolves to the **text** amber, not the
  mark amber — a hairline in `#f0a500` disappears against a white cell.
- **Thumbnails whose accent is a measurement or a model output** carry
  `class="thumb thumb-2"` on the `<svg>` and switch to the teal. That is what
  makes the work section read warm through Electrical Engineering and cool
  through Data Science without a single label saying so.

## Design rules

The layout is deliberately editorial, so a few things are load-bearing:

- **The page is one sheet.** Everything lives inside `<div class="sheet">`, a
  bordered white plate centred on grey paper, with the header sticky inside it.
  Below 720px the plate loses its border and margin, because on a phone a frame
  is only wasted width. `.wrap` no longer sets a max-width — the sheet caps it,
  and `.wrap` only insets the content column.
- **Never use the `padding` shorthand on a `.wrap` element.** `.wrap`'s inline
  padding *is* the content column, so `padding: 24px 0` silently resets it to
  zero and that section slides out to the sheet's edge while every other one
  stays on the column. Use `padding-block`. This already broke five sections
  once (`.statement-inner`, `.domain-inner`, `.domain-projects`, `.pubs-body`,
  `.writing-body`) and it fails quietly — the page still looks deliberate,
  just misaligned. The `.wrap` elements are: `header-inner`, `hero-inner`,
  `band-inner`, `statement-inner`, `domain-inner`, `domain-projects`,
  `pubs-body`, `writing-body`, `contact-grid`, `footer-inner`, `post-inner`.
- **Bands divide the page.** `<div class="band">` is a full-bleed ruled strip
  with a mono label on the content column, and it sticks under the header for
  as long as its own section is on screen. Sections that follow a band carry
  `sec-flush` and drop their own padding and top border.
- **Rules go edge to edge, content stays on the column.** That contrast is
  what makes the page read as designed rather than as a centered document.
- **One loud moment.** The amber underlines in `.statement` are the only
  emphasis of their kind; the headline deliberately has none. Adding a second
  emphasis style anywhere cancels the effect.
- **Big jumps in type scale.** 11px band labels against a display headline,
  with little in between.
- **Nothing animates above the fold** (`assets/main.js`).
- **No photography in the work section.** Each project opens with an inline
  `<svg class="thumb">` drawn in the feeder's line vocabulary: grey symbols for
  structure, exactly one amber element for the point. They are schematics of
  what the project actually produces, not decoration, and never stock imagery.
  See "Adding a thumbnail" below.
- **The close bookends the hero.** `.contact-body` repeats the hero's blueprint
  ruling, faded in from the bottom instead of out towards it. It is the only
  other place that texture appears; putting it on a third section would make it
  wallpaper.
- **The title block is not decoration.** The four cells under the portrait
  (`Drawn by / Sheet / Location / UTC`) are what make the page read as a drawing
  rather than as a light theme. If they ever go, the sheet frame goes with them
  — half the device is worse than neither half.
- **One primary action in the close.** Email gets its own panel, the other
  profiles stay hairline rows. Promoting a second link flattens it back into
  the four-row list it replaced.

## Publishing an article

Add one markdown file to `content/` and push. That is the whole workflow — the
file can be committed from a laptop or straight from the GitHub web UI, because
the conversion runs on Cloudflare at deploy time.

```markdown
---
title: Relay setting groups, one is never enough
summary: Why a single group of protection settings breaks when a feeder is reconfigured.
date: 2026-08-10
topic: Grid operations
---

Body in normal markdown: headings, lists, links, quotes, code fences, images.
```

- `title`, `summary` and `date` are **required**. The build fails loudly rather
  than publishing a page whose LinkedIn card would come out empty.
- `topic` is optional and shows next to the date.
- `draft: true` keeps the file in the repo and out of the site.
- `slug` is optional; only needed to keep a URL stable after renaming the file.

The file name becomes the URL: `content/relay-setting-groups.md` publishes at
`/articles/relay-setting-groups` — no `.html`, because Workers static assets
serve `foo.html` at `/foo` and redirect the `.html` form to it. Links, `og:url`,
`canonical` and the sitemap all use the extensionless URL so nothing points at a
redirect. A `YYYY-MM-DD-` prefix on the file name is allowed and gets stripped
from the slug, if you prefer the folder sorted by date.

To preview locally before pushing:

```
npm install                      # once
npm run build
cd dist && python -m http.server 8787   # then open http://localhost:8787
```

The build injects the newest four articles (then a link to the archive) between
the `ARTICLES:START` / `ARTICLES:END` markers **on the way into `dist/`**. The
source `index.html` keeps its `Nothing published yet.` placeholder and is never
written to, so `git status` stays clean whether or not you have built.

The full archive lives at `/articles/`, generated from
`scripts/templates/archive.html`.

### Changing how articles look

Edit `scripts/templates/article.html`, not the generated pages — anything typed
into `dist/articles/*.html` is overwritten on the next build. The body styles
(`.post-body h2`, `pre`, `blockquote`, `img`, …) are in `assets/style.css`.

### Sharing on LinkedIn

The `og:*` tags in each article's `<head>` are what LinkedIn reads to build the
preview card. They **must be absolute URLs** (`https://scitechlab-dev.com/...`);
relative paths are silently ignored and you get a bare link with no card.

LinkedIn caches previews aggressively. After editing a published article, run the
URL through the [Post Inspector](https://www.linkedin.com/post-inspector/) to
force a re-scrape.

`og:image` points at `assets/share.png`, a dedicated 1200×627 card matching the
site theme (dark background, amber signal mark). If the name or tagline ever
changes, regenerate it at the same size and force LinkedIn to re-scrape with
the Post Inspector above.

### Favicon

`assets/favicon.svg` is the source of truth: a **JA badge** — a rounded ink
plate, a white keyline inset from its edge, and the two initials inside it.
That construction is lifted from the SEL (Schweitzer Engineering Laboratories)
mark, which is the reference this was designed against.

**Greyscale, and only site tokens.** The plate is `--ink` (`#14161a`) and
everything on it is `--on-ink` (`#ffffff`), 18.4:1. SEL's own plate is `#003a5d`,
a navy that appears nowhere on this site, so it was never a candidate, and an
earlier pass sat on the `--accent-2` teal before this went greyscale.

Of the greys available, ink under white is the only pairing that stays crisp at
16px. `--ink-dim` (`#565a63`) under white goes muddy, and a plate one step up
from ink at `#2b2f36` sinks into the background of a dark tab.

**This mark carries the tab by itself** — see *Page titles* below, the title is
deliberately blank. Greyscale gives up the trick of being recognised by hue, so
the icon leans entirely on silhouette and contrast — which is precisely why the
plate has to be the darkest token rather than a mid grey. A solid near-black
block reads as one thing on a light strip and on a dark one; a grey block reads
as neither. With no title text beside it, being *identifiable* beats being
*readable*.

Geometry on the 64 grid: plate radius 8; the keyline is inset 3.5 at stroke 4,
so it occupies 1.5–5.5 and still resolves to a clean 1px at 16; the letters sit
in x 10..54 and y 15..49 at stroke 7.5. That leaves **4.5 units of air between
the keyline and the J**. A badge is the one place the mark may not run full
bleed, and crowding the keyline is exactly what makes these go muddy. Nothing
may go below 7 units.

The two PNGs are generated from the SVG, not drawn separately — regenerate both
whenever it changes:

- `favicon.png` (64×64, RGBA) is the artwork unchanged, rounded plate included,
  so the corners are transparent.
- `apple-touch-icon.png` (180×180, RGB) drops the plate's rounding — iOS applies
  its own mask — and scales the badge to **0.84** so that mask cannot cut
  through the keyline.

There is no build step, so they were rasterized with headless Chromium against
a wrapper page that sizes the SVG to the target box:

```
chrome --headless=new --disable-gpu --hide-scrollbars   --force-device-scale-factor=1 --window-size=64,64   --screenshot=favicon.png file:///path/to/wrapper.html
```

Pass `--default-background-color=00000000` for `favicon.png` and omit it for the
touch icon. **Judge any redraw at 16px inside a mock tab strip with no title
text next to it**, light (`#dee1e6`) and dark (`#202124`), because that is how it
ships. Everything looks good at 64.

### Page titles

`index.html` ships `<title>&#160;</title>` — a non-breaking space, on purpose.
The home page's title was nothing but the owner's name, and the tab is meant to
show the badge alone.

Two things about this that will bite you if you forget them:

- **It cannot be an empty `<title>`, and the tag cannot be removed.** Chrome
  falls back to displaying the URL when the title is empty or absent, so you get
  `scitechlab-dev.com` in the tab instead of nothing. The NBSP is what makes it
  render blank.
- **It has a real cost, and it was accepted knowingly.** `<title>` is what Google
  uses as the search-result headline, what names a bookmark and a history entry,
  and what a screen reader announces on load. The home page gives all of that up;
  Google now synthesises a headline from the `h1` and the meta description.

Article and archive pages keep real titles — they only dropped the
`· Josué Aldana-Aguilar` suffix. A blank title on an article would make it
unfindable, which is not what was asked for.

`og:title` is **untouched** everywhere. It feeds LinkedIn and other share cards,
not the tab, and blanking it would break the previews described under *Sharing
on LinkedIn*.

### Cache busting the icon

The favicon URLs carry `?v=` like everything else under `/assets/`; bump it or
the year-long immutable cache keeps serving the old icon. Unlike `style.css`,
this one is **not** injected by the build — it is hand-written in `index.html`
and in both files under `scripts/templates/`, so a favicon change means
editing three files. Currently at `?v=7`.

Chrome also keeps favicons in a separate store that ignores cache headers, so a
`?v=` bump alone may not refresh what you see locally. Close and reopen the tab,
or check in a private window.

## Cache busting

`/assets/*` is served with a one-year `immutable` cache header (see `_headers`).
If you change a file under `assets/` without renaming it, browsers and
Cloudflare's edge cache keep serving the old version. Bump the query string
wherever it's referenced (`style.css?v=2` → `?v=3`) so it counts as a new URL.
This applies to `index.html` **and** every page in `articles/`.

Currently at `style.css?v=16` and `main.js?v=9`. Versions 8 and 6 were burned by
a deploy that has since been reverted; don't reuse them, the edge still has
that content cached as immutable.

The favicon URLs are the exception to the automatic part below: they carry a
hand-written `?v=7` in `index.html` **and** in both files under
`scripts/templates/`, so a favicon change means bumping three files.

Article pages no longer need bumping by hand: `scripts/build.mjs` reads the
versions out of `index.html` and injects them, so bumping `index.html` is enough
to carry every generated page with it.

## Commits

Write short imperative messages that say what changed
(`Add article: relay setting groups`, `Fix contact links`). The early history
is full of `x` placeholders; it is already pushed so it stays, but don't
repeat it.
