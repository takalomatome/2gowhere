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

		// Send notification to Discord/Slack webhook
		const webhookUrl = process.env.BOOKING_WEBHOOK_URL;
		if (webhookUrl) {
			try {
				// Format booking details
				let detailsText = '';
				if (booking.type === 'attraction') {
					detailsText = `📍 **${booking.attractionName || 'Attraction'}**\n📅 Visit: ${booking.visitDate || 'N/A'}\n👥 Guests: ${booking.guests || 'N/A'}`;
				} else if (booking.type === 'hotel' || booking.itemType === 'hotel') {
					detailsText = `🏨 **${booking.hotelName || booking.itemName || 'Hotel'}**\n📅 Check-in: ${booking.checkin || booking.checkIn || 'N/A'}\n📅 Check-out: ${booking.checkout || booking.checkOut || 'N/A'}\n👥 Guests: ${booking.guests || 'N/A'}`;
				} else if (booking.type === 'car') {
					detailsText = `🚗 **${booking.carType || 'Car Rental'}**\n📅 Pickup: ${booking.pickupDate || 'N/A'}\n📅 Return: ${booking.returnDate || 'N/A'}\n📍 Location: ${booking.pickupLocation || 'N/A'}`;
				} else if (booking.type === 'flight') {
					detailsText = `✈️ **${booking.from || 'N/A'} → ${booking.to || 'N/A'}**\n📅 Departure: ${booking.departureDate || 'N/A'}\n📅 Return: ${booking.returnDate || 'N/A'}\n👥 Passengers: ${booking.passengers || 'N/A'}`;
				}

				await fetch(webhookUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						embeds: [{
							title: '🎯 New Booking Received!',
							color: 0x1a5490,
							fields: [
								{ name: '🆔 Booking ID', value: `\`${bookingId}\``, inline: true },
								{ name: '📋 Type', value: (booking.type || booking.itemType || 'booking').toUpperCase(), inline: true },
								{ name: '\u200b', value: '\u200b', inline: true },
								{ name: '👤 Customer', value: booking.name, inline: true },
								{ name: '📧 Email', value: booking.email, inline: true },
								{ name: '📱 Phone', value: booking.phone, inline: true },
								{ name: '📝 Details', value: detailsText || 'No details', inline: false }
							],
							footer: { text: '2goWhere Booking System' },
							timestamp: new Date().toISOString()
						}]
					})
				});
			} catch (webhookError) {
				console.error('Webhook notification failed:', webhookError);
				// Don't fail the booking if webhook fails
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
