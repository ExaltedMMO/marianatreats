# 🐱 Mariana's Treats

NJ independent coffee & bakery route planner with Yelp ratings and safety overlay.
**Live:** https://marianastreats.pages.dev

## Stack (all free)
| Feature | Service |
|---|---|
| Map | OpenStreetMap + Leaflet |
| Places | Overpass API |
| Routing | OSRM |
| Geocoding | Nominatim |
| Ratings | Yelp Fusion API (free tier) |
| Yelp proxy | Cloudflare Worker (free tier) |

## 1. Deploy site to Cloudflare Pages
Push repo to GitHub, connect to Cloudflare Pages:
- Build command: (leave blank)
- Build output directory: /

## 2. Get free Yelp API key
https://www.yelp.com/developers → Create app → copy API Key

## 3. Deploy Worker (Yelp proxy)
```bash
npm install -g wrangler
wrangler login
wrangler deploy
wrangler secret put YELP_API_KEY   # paste key when prompted
```

## Alternative: Deploy Worker via Dashboard
1. Workers & Pages → Create → Worker → paste worker.js → Deploy
2. Settings → Variables → add secret: YELP_API_KEY = your_key
3. Triggers → Routes → add: marianastreats.pages.dev/api/yelp
