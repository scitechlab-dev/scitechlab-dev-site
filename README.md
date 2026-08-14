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
│                         #   hero → statement → work (one row per
│                         #   domain) → contact, divided by label bands
├── articles/
│   └── _template.html    # copy this to start a new article
├── assets/
│   ├── style.css         # minimal dark theme, CSS variables
│   ├── main.js           # footer year + scroll reveal
│   ├── portrait.jpg
│   ├── favicon.svg       # site icon (favicon.png / apple-touch-icon.png are fallbacks)
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

Each domain is a full-bleed `<div class="domain">` row (glyph, name, count)
followed by a `<div class="wrap domain-projects">` holding that domain's
`<li class="project">` cards. Colors and fonts are CSS variables at the top of
`assets/style.css` (`--accent` is the amber signal color).

**When adding or removing a project, update the count** in its domain row
(`<span class="domain-count">`). Nothing counts them automatically.

Each card carries a kind tag next to its status pill:
`<span class="p-kind">Project</span>` or
`<span class="p-kind" data-kind="learning">Learning</span>`.

There is no JavaScript behind the work section anymore — the tabs are gone and
every project is visible on load.

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

## Cache busting

`/assets/*` is served with a one-year `immutable` cache header (see `_headers`).
If you change a file under `assets/` without renaming it, browsers and
Cloudflare's edge cache keep serving the old version. Bump the query string
wherever it's referenced (`style.css?v=2` → `?v=3`) so it counts as a new URL.
This applies to `index.html` **and** every page in `articles/`.

Currently at `style.css?v=9` and `main.js?v=7`. Versions 8 and 6 were burned by
a deploy that has since been reverted; don't reuse them, the edge still has
that content cached as immutable.

## Commits

Write short imperative messages that say what changed
(`Add article: relay setting groups`, `Fix contact links`). The early history
is full of `x` placeholders; it is already pushed so it stays, but don't
repeat it.
