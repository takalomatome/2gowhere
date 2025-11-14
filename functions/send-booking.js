exports.handler = async (event) => {
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, body: 'Method Not Allowed' };
	}
	try {
		const payload = JSON.parse(event.body||'{}');
		// In production, forward this to your CRM/email/inbox, e.g. via SendGrid/Mailgun/API.
		// Here we just echo back a basic receipt.
		const id = Math.random().toString(36).slice(2);
		const receivedAt = new Date().toISOString();
		return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:true, id, receivedAt, payload }) };
	} catch (e) {
		return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:false }) };
	}
}
