/**
 * Cloudflare Pages Function — /api/yelp
 * File: functions/api/yelp.js
 *
 * This file deploys automatically as part of your Pages site.
 * No separate Worker or route setup needed.
 *
 * Add your Yelp key in Cloudflare Pages:
 * → marianas-treats project → Settings → Environment Variables
 * → Add: YELP_API_KEY = your_yelp_key  (mark as Secret)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export async function onRequestGet({ request, env }) {
  const url    = new URL(request.url);
  const name   = url.searchParams.get('name');
  const lat    = url.searchParams.get('lat');
  const lng    = url.searchParams.get('lng');

  if (!name || !lat || !lng) {
    return json({ error: 'Missing name, lat or lng' }, 400);
  }

  if (!env.YELP_API_KEY) {
    return json({ error: 'YELP_API_KEY not set in Pages environment variables' }, 500);
  }

  try {
    const yelp = await fetch(
      `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(name)}&latitude=${lat}&longitude=${lng}&limit=1&radius=200`,
      { headers: { Authorization: `Bearer ${env.YELP_API_KEY}` } }
    );

    if (!yelp.ok) return json({ error: `Yelp ${yelp.status}` }, 502);

    const data = await yelp.json();
    const biz  = data.businesses?.[0];
    if (!biz)  return json({ error: 'No match' }, 404);

    // Basic name sanity check
    if (!biz.name.toLowerCase().includes(name.toLowerCase().split(' ')[0])) {
      return json({ error: 'Name mismatch' }, 404);
    }

    return json({ rating: biz.rating, review_count: biz.review_count, url: biz.url });

  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
