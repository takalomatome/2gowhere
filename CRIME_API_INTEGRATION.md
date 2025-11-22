# Crime Monitor API Integration Guide

This guide explains how to connect real crime data providers to the Crime Monitor feature and display safety warnings on attraction and hotel pages.

## Features

### Current Implementation
- ✅ Mock crime data (works without API key)
- ✅ Geolocation-based crime lookup
- ✅ Manual place search with geocoding
- ✅ Interactive map with risk markers
- ✅ Risk scoring (Low/Moderate/High/Severe)
- ✅ Category breakdown (assaults, robberies, burglaries, etc.)
- ✅ Real-time stats dashboard
- ✅ Safety warnings on hotel & attraction pages

### Data Sources

Crime data can be integrated from:
1. **Crimeometer** - Global crime analytics API
2. **SpotCrime** - US & international crime mapping
3. **South African Police Service (SAPS)** - Official SA crime statistics
4. **Local Government Open Data** - City-specific APIs
5. **Custom Database** - Your own crime incident database

---

## Quick Start (Mock Data)

The system works out of the box with mock data. No setup needed.

```bash
# Just deploy and visit:
https://your-site.netlify.app
# Navigate to Crime Monitor → Use My Location
```

---

## Production Setup

### Option 1: Crimeometer API (Recommended)

**Best for**: Global coverage, real-time data, rich incident details

#### Step 1: Get API Access

1. Visit https://www.crimeometer.com/developers
2. Sign up for Developer account
3. Choose pricing tier (Free tier: 500 requests/month)
4. Copy your API key

#### Step 2: Configure Environment

Add to Netlify Environment Variables:

```env
CRIME_API_KEY=your_crimeometer_api_key_here
CRIME_API_ENDPOINT=https://api.crimeometer.com/v1/incidents/raw-data
CRIME_CACHE_MINUTES=30
```

#### Step 3: Update Function Code

The current `functions/get-crime.js` is pre-configured for Crimeometer-style APIs. Verify the request format:

```javascript
// Expected payload (already in code):
{
  lat: -33.9249,
  lon: 18.4241,
  distance: 5000,
  datetime_ini: "2025-10-22T00:00:00Z",
  datetime_end: "2025-11-22T00:00:00Z"
}
```

Response mapping is automatic via `normalizeCrimeData()`.

---

### Option 2: SAPS CrimeStats API

**Best for**: Official South African crime statistics

#### Step 1: Register

1. Visit https://www.saps.gov.za/services/crimestats.php
2. Request API access (government approval required)
3. Receive credentials

#### Step 2: Adapt Function

Replace the API call section in `functions/get-crime.js`:

```javascript
// Around line 40
const bodyPayload = {
  province: 'Western Cape',
  station: 'closest_to_coords', // You'll need geocoding
  period: 'last_30_days'
};

const resp = await fetch(endpoint, {
  method: 'GET', // SAPS uses GET
  headers: { 
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  }
});
```

Update `normalizeCrimeData()` to map SAPS categories:

```javascript
function normalizeCrimeData(apiJson){
  // SAPS schema example
  const categories = {
    assaults: apiJson.assault_common + apiJson.assault_gbh,
    robberies: apiJson.robbery_aggravated + apiJson.robbery_common,
    burglaries: apiJson.burglary_residential + apiJson.burglary_business,
    vehicle_theft: apiJson.vehicle_theft + apiJson.vehicle_hijacking,
    sexual_offences: apiJson.rape + apiJson.sexual_assault,
    homicide: apiJson.murder
  };
  return { categories, topIncidents: buildTopIncidents(categories) };
}
```

---

### Option 3: Custom Database

**Best for**: Proprietary incident data, private security feeds

#### Step 1: Create Database Schema

```sql
CREATE TABLE crime_incidents (
  id SERIAL PRIMARY KEY,
  incident_type VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  occurred_at TIMESTAMP,
  severity VARCHAR(20),
  description TEXT
);

CREATE INDEX idx_coords ON crime_incidents (latitude, longitude);
CREATE INDEX idx_occurred ON crime_incidents (occurred_at);
```

#### Step 2: Build Custom Endpoint

Create a new serverless function or microservice:

```javascript
// Example endpoint: /api/crime/search
app.post('/api/crime/search', async (req, res) => {
  const { lat, lon, distance, datetime_ini, datetime_end } = req.body;
  
  // Spatial query (PostgreSQL with PostGIS)
  const incidents = await db.query(`
    SELECT incident_type, COUNT(*) as count
    FROM crime_incidents
    WHERE 
      ST_DWithin(
        ST_MakePoint(longitude, latitude)::geography,
        ST_MakePoint($1, $2)::geography,
        $3
      )
      AND occurred_at BETWEEN $4 AND $5
    GROUP BY incident_type
  `, [lon, lat, distance, datetime_ini, datetime_end]);
  
  res.json({ incidents });
});
```

#### Step 3: Configure

```env
CRIME_API_ENDPOINT=https://your-api.com/crime/search
CRIME_API_KEY=your_internal_api_key
```

---

## Advanced Features

### Caching Strategy

To reduce API costs and improve performance:

```javascript
// Add to get-crime.js (before API call)
const cacheKey = `crime_${lat}_${lng}_${radiusMeters}`;
const cached = await getCached(cacheKey); // Implement with KV store
if (cached && (Date.now() - cached.timestamp < cacheMinutes * 60000)) {
  return { statusCode: 200, headers, body: JSON.stringify(cached.data) };
}
```

Implement caching with:
- **Netlify Blobs** (recommended for Netlify)
- **Redis** (for self-hosted)
- **In-memory cache** (simple, per-instance)

### Heatmap Overlay

Add visual density maps:

```javascript
// In index.html, after map initialization
const heatData = incidents.map(i => [i.lat, i.lng, i.severity]);
const heat = L.heatLayer(heatData, {radius: 25}).addTo(map);
```

Requires: `leaflet-heat` plugin

### Historical Trends

Track crime over time:

```javascript
// Extend get-crime.js
const trends = await fetchMonthlyTrends(lat, lng, 12); // 12 months
return {
  ...existingData,
  trends: {
    labels: ['Nov 24', 'Dec 24', ...],
    values: [45, 38, 52, ...]
  }
};
```

Display with Chart.js on frontend.

---

## Safety Warnings on Bookings

### How It Works

When users view hotel or attraction details, the system:

1. Extracts location coordinates
2. Fetches crime data for that area
3. Displays risk badge (if Moderate/High/Severe)
4. Shows top 3 incident types
5. Offers "View Full Crime Stats" link

### Hotel Example

```html
<!-- Auto-injected in hotel detail view -->
<div class="safety-warning" style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 16px 0;">
  <strong>⚠️ Safety Notice</strong>
  <p>Crime Risk: <strong>Moderate</strong> (Score: 58)</p>
  <p style="font-size: 12px; margin: 4px 0 0 0;">
    Common incidents: Robberies (34), Assaults (28), Burglaries (19)
  </p>
  <a href="#" onclick="showPage('crime'); fetchCrimeStats({lat:-33.92,lng:18.42,place:'Cape Town'})">
    View Full Crime Stats →
  </a>
</div>
```

### Attraction Example

Similar integration in `showAttractionDetail()`.

---

## Testing

### Test with Mock Data

```bash
# Visit your site
curl 'https://your-site.netlify.app/.netlify/functions/get-crime?lat=-33.9249&lng=18.4241&place=Cape%20Town'

# Expected response:
{
  "ok": true,
  "place": "Cape Town",
  "coords": {"lat": -33.9249, "lng": 18.4241},
  "risk": {"score": 52, "level": "Moderate"},
  "categories": {
    "assaults": 28,
    "robberies": 34,
    ...
  }
}
```

### Test with Real API

1. Set `CRIME_API_KEY` in Netlify
2. Deploy changes
3. Check function logs: Netlify → Functions → get-crime → Logs
4. Verify API calls succeed (no "falling back to mock" messages)

### Test Geolocation

1. Open site on HTTPS (required for geolocation)
2. Navigate to Crime Monitor
3. Click "Use My Location"
4. Allow browser location permission
5. Verify stats load for your coordinates

---

## Cost Optimization

### API Usage Limits

| Provider | Free Tier | Paid |
|----------|-----------|------|
| Crimeometer | 500 req/mo | $29/mo (5K req) |
| SpotCrime | No free tier | Contact sales |
| SAPS | Free (approval required) | N/A |

### Reduce Costs

1. **Cache aggressively**: Set `CRIME_CACHE_MINUTES=60` or higher
2. **Lazy load**: Only fetch when user views Crime Monitor page
3. **Batch requests**: Combine nearby locations
4. **Rate limit**: Max 1 request per user per minute
5. **CDN cache**: Cache function responses at edge (Netlify Edge Functions)

---

## Compliance & Legal

### Data Privacy

- Crime data is **public information** (no personal data)
- Complies with GDPR/POPIA (aggregate statistics only)
- No user tracking required

### Disclaimers

Always display:

```
"Crime statistics are indicative only and should not be used as the sole basis 
for safety decisions. Consult official SAPS reports and local authorities."
```

Already included in UI and API responses.

### Liability

- Data accuracy depends on provider
- 2goWhere is not liable for outdated or incorrect crime data
- Recommend adding Terms of Service clause

---

## Troubleshooting

### "Geocoding failed"

**Cause**: Nominatim rate limit or invalid place name

**Fix**:
- Wait 1 minute between searches
- Use more specific names: "Cape Town, South Africa" not "CT"
- Consider paid geocoding (Google Maps, Mapbox)

### "Crime API error 401"

**Cause**: Invalid API key

**Fix**:
- Verify `CRIME_API_KEY` is correct in Netlify
- Check API key is active (not expired)
- Ensure no extra spaces in env var

### "Risk score always 0"

**Cause**: No incidents returned by API

**Fix**:
- Verify API endpoint is correct
- Check date range (last 30 days may have no data for rural areas)
- Expand radius: Add `&radiusMeters=10000` to query

### Map not displaying

**Cause**: Leaflet.js not loaded

**Fix**:
- Ensure `<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">` in `<head>`
- Check browser console for errors
- Verify element `id="crimeMap"` exists

---

## Production Checklist

Before going live:

- [ ] API key configured in Netlify (not in code)
- [ ] Cache duration set (`CRIME_CACHE_MINUTES`)
- [ ] Disclaimers visible on all crime data
- [ ] Tested geolocation on HTTPS
- [ ] Rate limiting implemented (if high traffic expected)
- [ ] Error handling displays user-friendly messages
- [ ] Mobile responsive (crime dashboard tiles adapt)
- [ ] Analytics tracking crime page visits
- [ ] Legal review of disclaimers completed

---

## Future Enhancements

### Planned Features

1. **Push Notifications**: Alert users if crime risk changes for saved locations
2. **Crime Trends**: Line charts showing 12-month trends
3. **Neighborhood Comparison**: Compare crime between 2+ areas
4. **User Reports**: Let users submit witnessed incidents (moderated)
5. **Safety Tips**: Context-aware safety recommendations
6. **Police Station Locator**: Show nearest SAPS stations on map

### Community Contributions

Want to add a feature? Submit a PR:
1. Fork the repo
2. Create feature branch
3. Test thoroughly
4. Submit PR with description

---

## Support

### Resources

- **Crimeometer Docs**: https://www.crimeometer.com/api-documentation
- **Leaflet.js Docs**: https://leafletjs.com/reference.html
- **Nominatim API**: https://nominatim.org/release-docs/latest/api/Search/
- **SAPS Crime Stats**: https://www.saps.gov.za/services/crimestats.php

### Get Help

- **GitHub Issues**: Report bugs or request features
- **Email**: support@2gowhere.com
- **Discord**: Join our community server (link in README)

---

## License

Crime Monitor feature is part of 2goWhere platform.  
Data providers have separate terms - review before production use.

**Last Updated**: November 22, 2025
