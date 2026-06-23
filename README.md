# scitechlab-dev-site

Personal landing page for **Josué Aldana** — Electrical Engineer working across
grid protection & operations (SCADA/ADMS), and high-altitude balloon (HAB) /
embedded systems research. Static HTML/CSS/JS, zero build step, deployed on
**Cloudflare Pages**.

Live at [scitechlab-dev.com](https://scitechlab-dev.com). Individual project
work that outgrows a single page (e.g. ongoing HAB telemetry work) gets its
own subdomain, such as `hab.scitechlab-dev.com`, with this site linking out
to it.

## Structure

```
.
├── index.html        # single-page site (hero, work, about, research, contact)
├── assets/
│   ├── style.css     # dark grid-telemetry theme, CSS variables
│   ├── main.js       # scroll-reveal animations (no dependencies)
│   └── portrait.jpg
├── _headers          # security + cache headers (Cloudflare Pages)
└── README.md
```

## Deploy

Connected to Cloudflare Pages via Git — pushes to `main` redeploy automatically.

- **Framework preset:** None
- **Build command:** *(none)*
- **Build output directory:** `/`

For a manual/CLI deploy instead: `wrangler pages deploy . --project-name=scitechlab-dev-site`

## Editing content

Everything lives in `index.html`. Project cards are the `<article class="card">`
blocks under `#work`. Colors and fonts are CSS variables at the top of
`assets/style.css` (`--accent` is the amber signal color).
