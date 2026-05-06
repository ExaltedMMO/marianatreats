/**
 * Cloudflare Worker — Yelp API Proxy
 * Handles CORS and keeps the Yelp API key server-side.
 *
 * Deploy: wrangler deploy  (or paste into Cloudflare Workers dashboard)
 * Route:  marianastreats.pages.dev/api/yelp
 *
 * Required secret (set via wrangler or dashboard):
 *   YELP_API_KEY = your_yelp_fusion_key
 *
 * Query params: ?name=Blue+Moon+Cafe&lat=40.73&lng=-74.17
 * Returns: { rating, review_count, url } or { error }
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    // Handle any path — worker only does one thing
    const name = url.searchParams.get('name');
    const lat  = url.searchParams.get('lat');
    const lng  = url.searchParams.get('lng');

    if (!name || !lat || !lng) {
      return json({ error: 'Missing name, lat or lng' }, 400);
    }

    if (!env.YELP_API_KEY) {
      return json({ error: 'YELP_API_KEY secret not configured' }, 500);
    }

    try {
      // Search Yelp by name + coordinates
      const yelp = await fetch(
        `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(name)}&latitude=${lat}&longitude=${lng}&limit=1&radius=200`,
        { headers: { Authorization: `Bearer ${env.YELP_API_KEY}` } }
      );

      if (!yelp.ok) {
        return json({ error: `Yelp returned ${yelp.status}` }, 502);
      }

      const data = await yelp.json();
      const biz  = data.businesses?.[0];

      if (!biz) return json({ error: 'No match found' }, 404);

      // Fuzzy name check — avoid returning wrong business
      const nameMatch = similarity(biz.name.toLowerCase(), name.toLowerCase()) > 0.5;
      if (!nameMatch) return json({ error: 'Name mismatch' }, 404);

      return json({
        rating:       biz.rating,
        review_count: biz.review_count,
        url:          biz.url,
        yelp_id:      biz.id,
      });

    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Simple Dice coefficient for fuzzy name matching
function similarity(a, b) {
  if (a===b) return 1;
  if (a.length<2||b.length<2) return 0;
  const bigrams = s => {
    const m=new Map();
    for (let i=0;i<s.length-1;i++) { const bg=s.slice(i,i+2); m.set(bg,(m.get(bg)||0)+1); }
    return m;
  };
  const aB=bigrams(a), bB=bigrams(b);
  let intersection=0;
  aB.forEach((cnt,bg)=>{ if(bB.has(bg)) intersection+=Math.min(cnt,bB.get(bg)); });
  const total=[...aB.values()].reduce((s,v)=>s+v,0)+[...bB.values()].reduce((s,v)=>s+v,0);
  return (2*intersection)/total;
}
