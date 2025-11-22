// Serverless function: auth
// Provides OTP-based signup verification and session token issuance.
// Actions: startSignup, verifyOtp
// Requires AUTH_SECRET env. If DEMO_SHOW_OTP==='true', returns otp for testing.

const crypto = require('crypto');
const nodemailer = require('nodemailer');

function jsonResponse(statusCode, body){
  return { statusCode, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}, body: JSON.stringify(body) };
}

function sign(data){
  const secret = process.env.AUTH_SECRET || 'dev-secret';
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function encode(obj){
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function decode(b64){
  try { return JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')); } catch { return null; }
}

function makeSignupToken(payload){
  const body = encode(payload);
  const sig = sign(body);
  return body + '.' + sig;
}

function verifyToken(token){
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (sign(body) !== sig) return null;
  return decode(body);
}

function hashOtp(otp){
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

async function sendEmailOtp(email, otp){
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT)||587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: `2goWhere Auth <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your 2goWhere verification code',
      html: `<p>Your verification code is:</p><p style="font-size:26px;font-weight:600;letter-spacing:4px">${otp}</p><p>This code expires in 5 minutes.</p>`
    });
    return true;
  } catch(err){
    console.error('Email OTP send failed:', err);
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode:200, headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}, body:'' };
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok:false, error:'Method Not Allowed' });
  }
  let body;
  try { body = JSON.parse(event.body||'{}'); } catch { return jsonResponse(400, { ok:false, error:'Invalid JSON' }); }
  const action = body.action;

  if (action === 'startSignup') {
    const email = (body.email||'').trim().toLowerCase();
    const name = (body.name||'').trim();
    if (!email) return jsonResponse(400,{ ok:false, error:'Email required' });
    // Generate OTP
    const otp = '' + Math.floor(100000 + Math.random()*900000);
    const otpHash = hashOtp(otp);
    const expires = Date.now() + 5*60*1000; // 5 minutes
    const signupToken = makeSignupToken({ email, name, otpHash, exp: expires });
    // Send email if possible
    const emailSent = await sendEmailOtp(email, otp);
    return jsonResponse(200, { ok:true, signupToken, expiresIn:300, emailSent, demoOtp: process.env.DEMO_SHOW_OTP==='true' ? otp : undefined });
  }

  if (action === 'verifyOtp') {
    const { signupToken, otp } = body;
    if (!signupToken || !otp) return jsonResponse(400,{ ok:false, error:'signupToken and otp required' });
    const payload = verifyToken(signupToken);
    if (!payload) return jsonResponse(400,{ ok:false, error:'Invalid token' });
    if (Date.now() > payload.exp) return jsonResponse(400,{ ok:false, error:'OTP expired' });
    if (hashOtp(otp) !== payload.otpHash) return jsonResponse(400,{ ok:false, error:'Incorrect code' });
    // Issue session token
    const sessionPayload = { sub: payload.email, name: payload.name||'', iat: Date.now(), exp: Date.now() + 24*60*60*1000 }; // 24h
    const sessionBody = encode(sessionPayload);
    const sessionSig = sign(sessionBody);
    const sessionToken = sessionBody + '.' + sessionSig;
    return jsonResponse(200,{ ok:true, sessionToken, email: payload.email, name: payload.name });
  }

  return jsonResponse(400,{ ok:false, error:'Unknown action' });
};
