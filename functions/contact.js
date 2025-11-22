// Serverless function: contact
// Accepts POST { name, email, subject, message } and sends email to site owner.
// Uses existing SMTP credentials. Returns { ok:true } on success.

const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers, body:'' };
  if (event.httpMethod !== 'POST') return { statusCode:405, headers, body: JSON.stringify({ ok:false, error:'Method Not Allowed' }) };

  let bodyObj;
  try { bodyObj = JSON.parse(event.body||'{}'); } catch { return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:'Invalid JSON' }) }; }

  const { name='', email='', subject='', message='' } = bodyObj;
  if (!email || !message || !subject) {
    return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:'Missing required fields (email, subject, message)' }) };
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // Fallback: simulate success in demo
    return { statusCode:200, headers, body: JSON.stringify({ ok:true, demo:true }) };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT)||587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const toEmail = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    await transporter.sendMail({
      from: `2goWhere Contact <${process.env.SMTP_USER}>`,
      to: toEmail,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">`
        + `<h2 style="margin:0 0 12px">New Contact Message</h2>`
        + `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`
        + `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`
        + `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>`
        + `<p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g,'<br>')}</p>`
        + `<hr><p style="font-size:11px;color:#666">Sent at ${new Date().toLocaleString()}</p></div>`
    });

    return { statusCode:200, headers, body: JSON.stringify({ ok:true }) };
  } catch(err) {
    console.error('Contact email failed:', err);
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:'Failed to send message' }) };
  }
};

function escapeHtml(str){
  return String(str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}
