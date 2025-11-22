// Serverless function: get-crime
// Provides crime statistics for a given location. If CRIME_API_KEY not set, returns mock data.
// Query parameters: ?lat= -30.1 &lng= 22.9 &place=Cape%20Town
// Optional: radiusMeters (default 5000)

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok:false, error:'Method Not Allowed' }) };
  }

  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const place = params.get('place') || 'Unknown Area';
    const radiusMeters = parseInt(params.get('radiusMeters') || '5000');
    const apiKey = process.env.CRIME_API_KEY;
    const endpoint = process.env.CRIME_API_ENDPOINT;
    const cacheMinutes = parseInt(process.env.CRIME_CACHE_MINUTES || '30');

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:'lat and lng required' }) };
    }

    let data;
    if (apiKey && endpoint) {
      // Real API call (example payload for Crimeometer style API)
      try {
        const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(); // last 30 days
        const until = new Date().toISOString();
        const bodyPayload = {
          lat, lon: lng, distance: radiusMeters, datetime_ini: since, datetime_end: until
        };
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'x-api-key': apiKey },
          body: JSON.stringify(bodyPayload)
        });
        if (!resp.ok) throw new Error(`Crime API error ${resp.status}`);
        const apiJson = await resp.json();
        // Map external schema to internal categories if possible.
        data = normalizeCrimeData(apiJson);
      } catch (apiErr) {
        console.error('Crime API failed, falling back to mock:', apiErr);
        data = buildMockData(place);
      }
    } else {
      // No credentials, use mock
      data = buildMockData(place);
    }

    const riskScore = computeRiskScore(data.categories);
    const riskLevel = riskScore < 30 ? 'Low' : riskScore < 60 ? 'Moderate' : riskScore < 85 ? 'High' : 'Severe';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        place,
        coords: { lat, lng },
        radiusMeters,
        generatedAt: new Date().toISOString(),
        cacheTtlMinutes: cacheMinutes,
        risk: { score: riskScore, level: riskLevel },
        categories: data.categories,
        topIncidents: data.topIncidents || [],
        disclaimer: 'Data is indicative only and may not represent official real-time statistics.'
      })
    };
  } catch (err) {
    console.error('Crime function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: err.message || 'Internal Error' }) };
  }
};

function buildMockData(place){
  // Simple randomized mock dataset
  const base = place.length * 3 + Date.now() % 100;
  const categories = {
    assaults: randRange(base * 0.3, base * 0.5),
    robberies: randRange(base * 0.2, base * 0.4),
    burglaries: randRange(base * 0.15, base * 0.35),
    vehicle_theft: randRange(base * 0.05, base * 0.2),
    sexual_offences: randRange(base * 0.02, base * 0.08),
    homicide: randRange(base * 0.01, base * 0.04)
  };
  return { categories, topIncidents: buildTopIncidents(categories) };
}

function randRange(min, max){
  return Math.round(min + Math.random() * (max - min));
}

function buildTopIncidents(categories){
  return Object.entries(categories)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)
    .map(([type,count])=>({ type, count }));
}

function computeRiskScore(categories){
  // Weighted scoring (simple heuristic)
  const weights = {
    assaults: 1.2,
    robberies: 1.3,
    burglaries: 1.0,
    vehicle_theft: 0.9,
    sexual_offences: 1.5,
    homicide: 2.0
  };
  let score = 0, total = 0;
  for (const [k,v] of Object.entries(categories)){
    score += (v * (weights[k] || 1));
    total += v;
  }
  // Normalize to 0-100
  const normalized = Math.min(100, Math.round((score / (total || 1)) * 100));
  return normalized;
}

function normalizeCrimeData(apiJson){
  // Placeholder normalization for a hypothetical external API
  // Expecting apiJson.incidents array with incident_type
  const categories = {};
  if (Array.isArray(apiJson.incidents)) {
    for (const inc of apiJson.incidents) {
      const key = mapIncidentType(inc.incident_type || 'other');
      categories[key] = (categories[key] || 0) + 1;
    }
  }
  // Ensure all expected keys present
  for (const k of ['assaults','robberies','burglaries','vehicle_theft','sexual_offences','homicide']){
    categories[k] = categories[k] || 0;
  }
  return { categories, topIncidents: buildTopIncidents(categories) };
}

function mapIncidentType(raw){
  raw = raw.toLowerCase();
  if (raw.includes('assault')) return 'assaults';
  if (raw.includes('robbery')) return 'robberies';
  if (raw.includes('burglary')|| raw.includes('break')) return 'burglaries';
  if (raw.includes('vehicle')|| raw.includes('car')) return 'vehicle_theft';
  if (raw.includes('sexual')) return 'sexual_offences';
  if (raw.includes('homicide')|| raw.includes('murder')) return 'homicide';
  return 'other';
}
