const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url  = new URL(request.url);
  const name = url.searchParams.get('name');
  const lat  = url.searchParams.get('lat');
  const lng  = url.searchParams.get('lng');

  let apiKey;
  try { apiKey = FSQ_API_KEY; } catch(e) { apiKey = null; }
  if (!apiKey) return respond({ error: 'FSQ_API_KEY not set' }, 500);

  // Debug: return raw Foursquare response
  if (url.searchParams.get('debug') === '2') {
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?query=coffee&ll=40.7357,-74.1724&radius=5000&limit=3&fields=fsq_id,name,rating,stats`,
      { headers: { Authorization: apiKey, Accept: 'application/json' } }
    );
    const raw = await res.text();
    return new Response(raw, { headers: CORS });
  }

  if (!name || !lat || !lng) {
    return respond({ error: 'Missing params' }, 400);
  }

  try {
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(name)}&ll=${lat},${lng}&radius=500&limit=1&fields=fsq_id,name,rating,stats`,
      { headers: { Authorization: apiKey, Accept: 'application/json' } }
    );

    const data  = await res.json();
    const place = data.results && data.results[0];
    if (!place) return respond({ error: 'No match', raw: data }, 404);

    const raw    = place.rating != null ? place.rating : null;
    const rating = raw != null ? Math.round((raw / 2) * 10) / 10 : null;
    const votes  = (place.stats && (place.stats.total_ratings || place.stats.total_tips)) || 0;

    return respond({ rating, raw_rating: raw, votes, name: place.name, fsq_id: place.fsq_id });
  } catch(e) {
    return respond({ error: e.message }, 500);
  }
}

function respond(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: CORS });
}
