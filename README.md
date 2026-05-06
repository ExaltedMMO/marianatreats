# 🐱 Mariana's Treats

NJ independent coffee & bakery route planner with safety ratings.
**No API key required** — powered by OpenStreetMap + Overpass API + OSRM.

**Live:** https://marianastreats.pages.dev

## Deploy to Cloudflare Pages

1. Push this repo to GitHub
2. In Cloudflare Pages → Create project → Connect to Git
3. Build settings:

| Setting               | Value         |
|-----------------------|---------------|
| Framework preset      | None          |
| Build command         | *(leave blank)* |
| Build output directory| `/` (root)    |

That's it — no environment variables, no build step needed.

## Local development

Just open `index.html` in a browser. No server required.
