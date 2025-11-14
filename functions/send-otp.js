// Demo OTP issuer. In production, send via SMS/Email provider
// and NEVER return the OTP in the response.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const body = JSON.parse(event.body||'{}');
    const { channel, to } = body; // e.g. channel: 'sms'|'email'

    const otp = ('' + Math.floor(100000 + Math.random() * 900000));
    const expiresInSecs = 5 * 60;

    // TODO: integrate provider here (Twilio, SendGrid, etc.)
    // await sendOTP({ channel, to, otp });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, otp, expiresInSecs })
    };
  } catch (e) {
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:false }) };
  }
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { email, phone } = JSON.parse(event.body||'{}');
    // In a real system, send the OTP via email/SMS provider here
    const code = String(Math.floor(100000 + Math.random()*900000));
    // For demo purposes we return the code; do not do this in production
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:true, code, sentTo: { email, phone } }) };
  } catch (e) {
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:false }) };
  }
};