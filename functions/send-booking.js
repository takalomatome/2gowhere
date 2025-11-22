exports.handler = async (event) => {
	// Set CORS headers
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Content-Type': 'application/json'
	};

	// Handle OPTIONS preflight
	if (event.httpMethod === 'OPTIONS') {
		return { statusCode: 200, headers, body: '' };
	}

	if (event.httpMethod !== 'POST') {
		return { 
			statusCode: 405, 
			headers,
			body: JSON.stringify({ ok: false, error: 'Method Not Allowed' })
		};
	}
	
	try {
		const booking = JSON.parse(event.body || '{}');
		const bookingId = `BK${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
		
		// Validate required fields
		if (!booking.type && !booking.itemType) {
			booking.type = booking.itemType || 'booking';
		}
		if (!booking.name || !booking.email || !booking.phone) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ ok: false, error: 'Missing required fields: name, email, or phone' })
			};
		}

		// Log the booking (in production, this goes to Netlify logs)
		console.log('New booking:', {
			id: bookingId,
			type: booking.type,
			name: booking.name,
			email: booking.email,
			timestamp: new Date().toISOString()
		});

		// If you have a webhook URL (like Discord, Slack, or Zapier), send notification
		const webhookUrl = process.env.BOOKING_WEBHOOK_URL;
		if (webhookUrl) {
			try {
				await fetch(webhookUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						content: `🎯 New ${booking.type} Booking!\n**ID:** ${bookingId}\n**Name:** ${booking.name}\n**Email:** ${booking.email}\n**Phone:** ${booking.phone}`,
						embeds: [{
							title: `New ${booking.type.toUpperCase()} Booking`,
							color: 0x1a5490,
							fields: [
								{ name: 'Booking ID', value: bookingId, inline: true },
								{ name: 'Customer', value: booking.name, inline: true },
								{ name: 'Email', value: booking.email, inline: false },
								{ name: 'Phone', value: booking.phone, inline: false },
								{ name: 'Details', value: JSON.stringify(booking, null, 2).substring(0, 1000) }
							],
							timestamp: new Date().toISOString()
						}]
					})
				});
			} catch (webhookError) {
				console.error('Webhook failed:', webhookError);
			}
		}

		// TODO: In production, you can:
		// 1. Save to a database (Supabase, Firebase, MongoDB Atlas)
		// 2. Send email via SendGrid/Mailgun API (no nodemailer needed)
		// 3. Forward to a Google Sheet via API
		// 4. Send to Airtable/Notion
		
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				ok: true,
				bookingId,
				message: 'Booking received successfully',
				timestamp: new Date().toISOString()
			})
		};
		
	} catch (error) {
		console.error('Booking error:', error);
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				ok: false,
				error: error.message || 'Failed to process booking',
				details: process.env.NODE_ENV === 'development' ? error.stack : undefined
			})
		};
	}
};
