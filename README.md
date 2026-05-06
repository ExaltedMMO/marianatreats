# 🐱 Mariana's Treats

NJ independent coffee shop & bakery route planner with area safety ratings.

**Live site:** https://marianastreats.pages.dev

---

## Deploying to Cloudflare Pages

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/marianas-treats.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages
1. Go to [Cloudflare Pages](https://pages.cloudflare.com/) → **Create a project** → **Connect to Git**
2. Select your `marianas-treats` repository
3. Configure the build:

| Setting | Value |
|---|---|
| **Framework preset** | None |
| **Build command** | `node build.js` |
| **Build output directory** | `dist` |

### 3. Add your API key as an environment variable
In Cloudflare Pages → your project → **Settings → Environment Variables → Add variable**:

| Variable name | Value |
|---|---|
| `GOOGLE_MAPS_API_KEY` | `AIza...your key here...` |

> ⚠️ Add it for **both** Production and Preview environments.

### 4. Deploy
Every push to `main` triggers a new build. Cloudflare injects the env var, `build.js` replaces `%%MAPS_KEY%%` in the HTML, and the built file goes to `dist/`.

---

## Google Maps API Key Setup

In [Google Cloud Console](https://console.cloud.google.com/):

1. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Directions API

2. Restrict the key to your domain:
   - **Application restrictions** → HTTP referrers
   - Add: `marianastreats.pages.dev/*`
   - Add: `*.marianastreats.pages.dev/*` (for preview deployments)

---

## Local development

```bash
# Create a local .env (never commit this)
echo "GOOGLE_MAPS_API_KEY=AIza..." > .env

# Build locally
GOOGLE_MAPS_API_KEY=$(cat .env | cut -d= -f2) node build.js

# Open in browser
open dist/index.html
```
