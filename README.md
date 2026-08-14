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
│                         #   hero → selected work (3, in depth)
│                         #   → index of other work + currently learning
│                         #   → contact
├── articles/
│   └── _template.html    # copy this to start a new article
├── assets/
│   ├── style.css         # light/dark theme via CSS variables
│   ├── main.js           # footer year + scroll reveal
│   ├── portrait.jpg
│   ├── favicon.svg       # site icon (favicon.png / apple-touch-icon.png are fallbacks)
│   └── share.png         # 1200x627 og:image used by LinkedIn preview cards
├── _headers              # security + cache headers (Cloudflare Pages)
├── robots.txt
├── sitemap.xml           # add a <url> block per published article
└── README.md
```

## Design rules

Worth keeping in mind before adding anything:

- **One layout idiom.** Horizontal rules plus a left meta column. No card
  grids, no boxed panels. The only ornament is the small open-breaker square
  sitting on each section rule (`.section::before`).
- **Monospace is for data only** — status, stack, contact values, dates, the
  diagram labels. Everything else is IBM Plex Sans. Spreading mono across every
  small label is what made the previous version read as a template.
- **Nothing animates above the fold.** The scroll reveal in `main.js` is
  deliberately scoped to `.work-item` and `.idx-row`.
- **Light is the default theme**, dark comes from `prefers-color-scheme` in
  `assets/style.css`. To flip the default, swap the two variable blocks at the
  top of that file. The dark accent (`#ffb000`) is the one `favicon.svg` and
  `share.png` are drawn in, so leave it alone unless you regenerate both.

## Deploy

Connected to Cloudflare Pages via Git. Pushes to `main` redeploy automatically.

- **Framework preset:** None
- **Build command:** *(none)*
- **Build output directory:** `/`

For a manual/CLI deploy instead: `wrangler pages deploy . --project-name=scitechlab-dev-site`

## Editing content

Work lives in two tiers, on purpose. Three projects get real space; everything
else is a one-line row. Resist letting the featured list grow — the moment
every project looks equally important, none of them do.

- **Featured** (`#work`): an `<article class="work-item">` with a `.w-meta`
  column (domain + status) and a `.w-body` (title, prose, `.stack`, optional
  `.w-link`).
- **Index** (`#more`): an `<li class="idx-row">` with domain, title, one
  sentence, and a status. Add a year with
  `<span class="idx-year">2024</span>` as the first child of `.idx-body`.
- **Learning** (`.learn-list`): aspirational items go here, not in the two
  lists above. Keeping them separate is what stops the portfolio from reading
  as eight things in progress and nothing finished.

Status is `<p class="w-status" data-state="on">In progress</p>`; drop the
`data-state` for finished work. Nothing is counted automatically anymore,
because nothing displays a count.

Colors and fonts are CSS variables at the top of `assets/style.css`.

### Writing the copy

Two failure modes to avoid, both of which the earlier version had:

1. **Uniform descriptions.** If every entry is one sentence of the same length
   opening with a gerund ("Building…", "Designing…", "Exploring…"), the list
   reads as generated. Let the lengths differ.
2. **Abstractions instead of facts.** "Measurable KPI improvement" says
   nothing. How many IEDs, how many poles, how many feeders, how long the study
   used to take. One hard number per project is worth more than a paragraph of
   positioning.

## Publishing an article

1. `cp articles/_template.html articles/my-slug.html`
2. Replace every `{{PLACEHOLDER}}` in the `<head>`: title, summary, slug, date.
3. Write the article inside `<div class="post-body">`.
4. Add a `<url>` block for it in `sitemap.xml`.
5. Commit and push. Cloudflare redeploys automatically. Share the article by
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

Currently at `style.css?v=8` and `main.js?v=6`.

## Commits

Write short imperative messages that say what changed
(`Add article: relay setting groups`, `Fix contact links`). The early history
is full of `x` placeholders; it is already pushed so it stays, but don't
repeat it.
