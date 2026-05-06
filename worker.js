/**
 * Cloudflare Worker — Foursquare Places Proxy
 * Keeps the Foursquare API key server-side, handles CORS.
 *
 * Paste this into your Worker in the Cloudflare dashboard → Edit code → Deploy
 *
 * Required secret:
 *   FSQ_API_KEY = your Foursquare API key
 *   (Worker → Settings → Variables and Secrets → Add Secret)
 *
 * Query params: ?name=Blue+Moon+Cafe&lat=40.73&lng=-74.17
 * Returns: { rating, votes, fsq_id, url } or { error }
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url  = new URL(request.url);
    const name = url.searchParams.get('name');
    const lat  = url.searchParams.get('lat');
    const lng  = url.searchParams.get('lng');

    if (!name || !lat || !lng) {
      return json({ error: 'Missing name, lat or lng' }, 400);
    }

    if (!env.FSQ_API_KEY) {
      return json({ error: 'FSQ_API_KEY secret not set in Worker' }, 500);
    }

    try {
      const fsqUrl = 'https://api.foursquare.com/v3/places/search'
        + `?query=${encodeURIComponent(name)}`
        + `&ll=${lat},${lng}`
        + `&radius=300`
        + `&limit=1`
        + `&fields=fsq_id,name,rating,stats,link`;

      const fsqRes = await fetch(fsqUrl, {
        headers: {
          Authorization: env.FSQ_API_KEY,
          Accept: 'application/json',
        },
      });

      if (!fsqRes.ok) return json({ error: `Foursquare ${fsqRes.status}` }, 502);

      const data  = await fsqRes.json();
      const place = data.results?.[0];
      if (!place) return json({ error: 'No match' }, 404);

      // Foursquare rates 0–10, convert to 0–5 for star display
      const rawRating = place.rating ?? null;
      const rating    = rawRating != null ? Math.round((rawRating / 2) * 10) / 10 : null;
      const votes     = place.stats?.total_ratings ?? place.stats?.total_tips ?? 0;

      return json({
        rating,
        raw_rating: rawRating,
        votes,
        fsq_id: place.fsq_id,
        url: `https://foursquare.com/v/${place.fsq_id}`,
      });

    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function similarity(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = s => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      m.set(bg, (m.get(bg) || 0) + 1);
    }
    return m;
  };
  const aB = bigrams(a), bB = bigrams(b);
  let intersection = 0;
  aB.forEach((cnt, bg) => { if (bB.has(bg)) intersection += Math.min(cnt, bB.get(bg)); });
  const total = [...aB.values()].reduce((s, v) => s + v, 0)
              + [...bB.values()].reduce((s, v) => s + v, 0);
  return (2 * intersection) / total;
}
