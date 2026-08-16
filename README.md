# scitechlab-dev-site

Personal site for **Josué Aldana-Aguilar**, Electrical Engineer, currently a grid
operations analyst building data-driven tools for energy utilities. Static
HTML/CSS/JS, zero build step, deployed on **Cloudflare Pages**.

Live at [scitechlab-dev.com](https://scitechlab-dev.com). Project work that
outgrows a single page (e.g. ongoing HAB telemetry work) gets its own subdomain,
such as `hab.scitechlab-dev.com`, with this site linking out to it.

## Structure

```
.
├── index.html            # single-page site
│                         #   hero → signal chain → statement → work (one row
│                         #   per domain) → publications → contact,
│                         #   divided by label bands
├── articles/
│   └── _template.html    # copy this to start a new article
├── assets/
│   ├── style.css         # minimal dark theme, CSS variables
│   ├── main.js           # footer year + scroll reveal
│   ├── portrait.jpg
│   ├── favicon.svg       # JA monogram (favicon.png / apple-touch-icon.png are fallbacks)
│   └── share.png         # 1200x627 og:image used by LinkedIn preview cards
├── _headers              # security + cache headers (Cloudflare Pages)
└── README.md
```

## Deploy

Connected to Cloudflare Pages via Git. Pushes to `main` redeploy automatically.

- **Framework preset:** None
- **Build command:** *(none)*
- **Build output directory:** `/`

For a manual/CLI deploy instead: `wrangler pages deploy . --project-name=scitechlab-dev-site`

## Editing content

### Colors

Every color lives in the `:root` block at the top of `assets/style.css`, hex
values and the matching `--*-rgb` channel triplets that the partial-alpha
values use. Nothing downstream hard-codes a color, so retheming the whole site
means editing that one block. If you change `--accent`, change `--accent-rgb`,
`--accent-hi` and `--on-accent` with it or the glows and buttons drift out of
sync.

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

**When adding or removing a project, update the count** in its domain row
(`<span class="domain-count">`). Nothing counts them automatically.

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

Three things are load-bearing:

- **Draw inside the `y 38..106` band.** The viewBox is deliberately much taller
  than the 84px strip so width always drives the scale (same trick as
  `.feeder`); anything outside that band gets cropped vertically on wide cards.
- **`currentColor` for structure.** It inherits `--line-2` and brightens on card
  hover. Never hard-code a grey.
- **One amber idea per thumbnail, `class="th-acc"`** (or `th-acc-f` when it is
  filled rather than stroked); wrap it in a `<g>` if it takes several paths.
  That is what glows on hover. Two unrelated amber things in one thumbnail and
  neither reads as the point.

## Design rules

The layout is deliberately editorial, so a few things are load-bearing:

- **Bands divide the page.** `<div class="band">` is a full-bleed pair of
  hairlines with a dotted label on the content column. Sections that follow a
  band carry `sec-flush` and drop their own padding and top border.
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
- **The close bookends the hero.** `.contact-body` repeats the hero's dot grid
  and amber glow from the opposite corner. It is the only other place that
  texture appears; putting it on a third section would make it wallpaper.
- **One primary action in the close.** Email gets its own panel, the other
  profiles stay hairline rows. Promoting a second link flattens it back into
  the four-row list it replaced.

## Publishing an article

1. `cp articles/_template.html articles/my-slug.html`
2. Replace every `{{PLACEHOLDER}}` in the `<head>`: title, summary, slug, date.
3. Write the article inside `<div class="post-body">`.
4. Commit and push. Cloudflare redeploys automatically. Share the article by
   direct link; LinkedIn builds the preview card from the og tags.

The home page does not currently show an articles list. To bring it back, add
an `<ol class="articles">` block in `index.html` with one
`<li class="article-row">` per article; the matching styles already exist in
`assets/style.css`.

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

`assets/favicon.svg` is the source of truth: a JA monogram, J in ink and A in
the signal amber, on the black plate. The two PNGs are generated from it, not
drawn separately — regenerate both whenever the SVG changes:

- `favicon.png` (64×64, RGBA) is the same artwork, rounded plate and hairline.
- `apple-touch-icon.png` (180×180, RGB) drops the rounding and the border ring
  and insets the mark, because iOS applies its own mask and would clip a ring.

There is no build step, so they were rasterized with headless Chrome:

```
chrome --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=64,64 \
  --screenshot=favicon.png file:///path/to/wrapper.html
```

Nothing thinner than 5 units on the 64 grid — that is what survives being
scaled to a 16px browser tab. Check any redraw at 16px, not at 64.

The favicon URLs carry `?v=` like everything else under `/assets/`; bump it or
the year-long immutable cache keeps serving the old icon.

## Cache busting

`/assets/*` is served with a one-year `immutable` cache header (see `_headers`).
If you change a file under `assets/` without renaming it, browsers and
Cloudflare's edge cache keep serving the old version. Bump the query string
wherever it's referenced (`style.css?v=2` → `?v=3`) so it counts as a new URL.
This applies to `index.html` **and** every page in `articles/`.

Currently at `style.css?v=11` and `main.js?v=9`. Versions 8 and 6 were burned by
a deploy that has since been reverted; don't reuse them, the edge still has
that content cached as immutable.

## Commits

Write short imperative messages that say what changed
(`Add article: relay setting groups`, `Fix contact links`). The early history
is full of `x` placeholders; it is already pushed so it stays, but don't
repeat it.
