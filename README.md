# scitechlab-dev-site

Personal site for **Josué Aldana-Aguilar** — Electrical Engineer, currently a grid
operations analyst building data-driven tools for energy utilities. Static
HTML/CSS/JS, zero build step, deployed on **Cloudflare Pages**.

Live at [scitechlab-dev.com](https://scitechlab-dev.com). Project work that
outgrows a single page (e.g. ongoing HAB telemetry work) gets its own subdomain,
such as `hab.scitechlab-dev.com`, with this site linking out to it.

## Structure

```
.
├── index.html            # single-page site
│                         #   hero → 01 Electrical Engineering → 02 Electronics
│                         #   → 03 Computer Science → 04 Articles → 05 Contact
├── articles/
│   ├── _template.html    # copy this to start a new article
│   └── sample-note.html  # placeholder — delete after the first real post
├── assets/
│   ├── style.css         # minimal dark theme, CSS variables
│   ├── main.js           # footer year only
│   └── portrait.jpg
├── _headers              # security + cache headers (Cloudflare Pages)
└── README.md
```

## Deploy

Connected to Cloudflare Pages via Git — pushes to `main` redeploy automatically.

- **Framework preset:** None
- **Build command:** *(none)*
- **Build output directory:** `/`

For a manual/CLI deploy instead: `wrangler pages deploy . --project-name=scitechlab-dev-site`

## Editing content

Projects are the `<li class="project">` blocks under `#electrical`, `#electronics`
and `#computer-science` in `index.html`. Colors and fonts are CSS variables at the
top of `assets/style.css` (`--accent` is the amber signal color).

## Publishing an article

1. `cp articles/_template.html articles/my-slug.html`
2. Replace every `{{PLACEHOLDER}}` in the `<head>` — title, summary, slug, date.
3. Write the article inside `<div class="post-body">`.
4. Add a row at the **top** of the `<ol class="articles">` list in `index.html`:

   ```html
   <li class="article-row">
     <a href="articles/my-slug.html">
       <time datetime="2026-08-15">2026-08-15</time>
       <span class="a-title">Title of the note</span>
       <span class="a-desc">One or two sentences of summary.</span>
     </a>
   </li>
   ```

5. Commit and push. Cloudflare redeploys automatically.

### Sharing on LinkedIn

The `og:*` tags in each article's `<head>` are what LinkedIn reads to build the
preview card. They **must be absolute URLs** (`https://scitechlab-dev.com/...`);
relative paths are silently ignored and you get a bare link with no card.

LinkedIn caches previews aggressively. After editing a published article, run the
URL through the [Post Inspector](https://www.linkedin.com/post-inspector/) to
force a re-scrape.

`og:image` currently points at `assets/portrait.jpg`, which is square and small.
LinkedIn prefers roughly **1200×627**; a dedicated share image at that size would
render a noticeably better card.

## Cache busting

`/assets/*` is served with a one-year `immutable` cache header (see `_headers`).
If you change a file under `assets/` without renaming it, browsers and
Cloudflare's edge cache keep serving the old version. Bump the query string
wherever it's referenced (`style.css?v=2` → `?v=3`) so it counts as a new URL.
This applies to `index.html` **and** every page in `articles/`.
