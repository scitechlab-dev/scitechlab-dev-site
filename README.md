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
│                         #   hero → work (tabbed by domain)
│                         #   → contact
├── articles/
│   └── _template.html    # copy this to start a new article
├── assets/
│   ├── style.css         # minimal dark theme, CSS variables
│   ├── main.js           # footer year + work tabs
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

Projects are the `<li class="project">` blocks inside `#panel-ee` (Electrical
Engineering), `#panel-el` (Electronics) and `#panel-cs` (Computer Science) in
`index.html`. Colors and fonts are CSS variables at the top of
`assets/style.css` (`--accent` is the amber signal color).

**When adding or removing a project, update the count** in its tab button
(`<span class="tab-c">`). Nothing counts them automatically.

Each card carries a kind tag next to its status pill:
`<span class="p-kind">Project</span>` or
`<span class="p-kind" data-kind="learning">Learning</span>`.

The tabs are progressive enhancement: all three panels ship unhidden, so the
page still reads as one long list if JavaScript fails. `assets/main.js` hides
the inactive ones on load.

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

## Commits

Write short imperative messages that say what changed
(`Add article: relay setting groups`, `Fix contact links`). The early history
is full of `x` placeholders; it is already pushed so it stays, but don't
repeat it.
