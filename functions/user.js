// Serverless function: user
// Actions: getProfile, updateProfile, refreshSession, logout
// Uses same token format as auth.js (base64url.payload + HMAC signature)

const crypto = require('crypto');
let supabase = null;
function getSupabase(){
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try { supabase = require('@supabase/supabase-js').createClient(url, key); } catch(e){ console.error('Supabase init failed:', e); }
  }
  return supabase;
}
function sign(data){ return crypto.createHmac('sha256', process.env.AUTH_SECRET || 'dev-secret').update(data).digest('hex'); }
function decode(token){ try { return JSON.parse(Buffer.from(token,'base64url').toString('utf8')); } catch { return null; } }
function verifySession(token){ if (!token||!token.includes('.')) return null; const [body,sig]=token.split('.'); if (sign(body)!==sig) return null; return decode(body); }
function encode(obj){ return Buffer.from(JSON.stringify(obj)).toString('base64url'); }
function json(status, body){ return { statusCode:status, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}, body: JSON.stringify(body) }; }

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}, body:'' };
  if (event.httpMethod !== 'POST') return json(405,{ ok:false, error:'Method Not Allowed' });
  let body; try { body = JSON.parse(event.body||'{}'); } catch { return json(400,{ ok:false, error:'Invalid JSON'}); }
  const action = body.action;

  if (action === 'getProfile') {
    const session = verifySession(body.sessionToken);
    if (!session) return json(401,{ ok:false, error:'Invalid session'});
    let profile = { email: session.sub, name: session.name||'', role: session.role||'user' };
    try {
      const sb = getSupabase();
      if (sb) {
        const { data, error } = await sb.from('users').select('email,name,role').eq('email', session.sub).maybeSingle();
        if (!error && data) profile = data;
      }
    } catch(e){ console.warn('Profile fetch failed:', e.message); }
    return json(200,{ ok:true, profile });
  }

  if (action === 'updateProfile') {
    const session = verifySession(body.sessionToken);
    if (!session) return json(401,{ ok:false, error:'Invalid session'});
    const name = (body.name||'').trim();
    try {
      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.from('users').update({ name, updated_at: new Date().toISOString() }).eq('email', session.sub);
        if (error) console.error('Update error:', error.message);
      }
    } catch(e){ console.warn('Update failed:', e.message); }
    return json(200,{ ok:true });
  }

  if (action === 'refreshSession') {
    const session = verifySession(body.sessionToken);
    if (!session) return json(401,{ ok:false, error:'Invalid session'});
    const now = Date.now();
    // If exp within next 4 hours, issue new token (24h lifetime)
    if (session.exp - now < 4*60*60*1000) {
      const fresh = { sub: session.sub, name: session.name||'', role: session.role||'user', iat: now, exp: now + 24*60*60*1000 };
      const bodyStr = encode(fresh); const sig = sign(bodyStr); const newToken = bodyStr + '.' + sig;
      return json(200,{ ok:true, sessionToken: newToken, refreshed:true });
    }
    return json(200,{ ok:true, sessionToken: body.sessionToken, refreshed:false });
  }

  if (action === 'logout') {
    // Stateless tokens: client just discards. Could maintain blacklist if needed.
    return json(200,{ ok:true, loggedOut:true });
  }

  return json(400,{ ok:false, error:'Unknown action' });
};
