const nodemailer = require('nodemailer');

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

		// Log the booking
		console.log('New booking:', {
			id: bookingId,
			type: booking.type,
			name: booking.name,
			email: booking.email,
			timestamp: new Date().toISOString()
		});

		// Format booking details
		let detailsHtml = '';
		let detailsText = '';
		
		if (booking.type === 'attraction') {
			detailsHtml = `
				<p><strong>Attraction:</strong> ${booking.attractionName || 'N/A'}</p>
				<p><strong>Visit Date:</strong> ${booking.visitDate || 'N/A'}</p>
				<p><strong>Number of Guests:</strong> ${booking.guests || 'N/A'}</p>
			`;
			detailsText = `📍 **${booking.attractionName || 'Attraction'}**\n📅 Visit: ${booking.visitDate || 'N/A'}\n👥 Guests: ${booking.guests || 'N/A'}`;
		} else if (booking.type === 'hotel' || booking.itemType === 'hotel') {
			detailsHtml = `
				<p><strong>Hotel:</strong> ${booking.hotelName || booking.itemName || 'N/A'}</p>
				<p><strong>Check-in:</strong> ${booking.checkin || booking.checkIn || 'N/A'}</p>
				<p><strong>Check-out:</strong> ${booking.checkout || booking.checkOut || 'N/A'}</p>
				<p><strong>Guests:</strong> ${booking.guests || 'N/A'}</p>
				<p><strong>Room Type:</strong> ${booking.roomType || 'Standard'}</p>
			`;
			detailsText = `🏨 **${booking.hotelName || booking.itemName || 'Hotel'}**\n📅 Check-in: ${booking.checkin || booking.checkIn || 'N/A'}\n📅 Check-out: ${booking.checkout || booking.checkOut || 'N/A'}\n👥 Guests: ${booking.guests || 'N/A'}`;
		} else if (booking.type === 'car') {
			detailsHtml = `
				<p><strong>Car Type:</strong> ${booking.carType || 'N/A'}</p>
				<p><strong>Pickup Date:</strong> ${booking.pickupDate || 'N/A'}</p>
				<p><strong>Return Date:</strong> ${booking.returnDate || 'N/A'}</p>
				<p><strong>Pickup Location:</strong> ${booking.pickupLocation || 'N/A'}</p>
			`;
			detailsText = `🚗 **${booking.carType || 'Car Rental'}**\n📅 Pickup: ${booking.pickupDate || 'N/A'}\n📅 Return: ${booking.returnDate || 'N/A'}\n📍 Location: ${booking.pickupLocation || 'N/A'}`;
		} else if (booking.type === 'flight') {
			detailsHtml = `
				<p><strong>From:</strong> ${booking.from || 'N/A'}</p>
				<p><strong>To:</strong> ${booking.to || 'N/A'}</p>
				<p><strong>Departure:</strong> ${booking.departureDate || 'N/A'}</p>
				<p><strong>Return:</strong> ${booking.returnDate || 'N/A'}</p>
				<p><strong>Passengers:</strong> ${booking.passengers || 'N/A'}</p>
			`;
			detailsText = `✈️ **${booking.from || 'N/A'} → ${booking.to || 'N/A'}**\n📅 Departure: ${booking.departureDate || 'N/A'}\n📅 Return: ${booking.returnDate || 'N/A'}\n👥 Passengers: ${booking.passengers || 'N/A'}`;
		}

		// Send Discord/Slack webhook notification
		const webhookUrl = process.env.BOOKING_WEBHOOK_URL;
		if (webhookUrl) {
			try {
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
			}
		}

		// Send emails via nodemailer
		let emailSent = false;
		if (process.env.SMTP_USER && process.env.SMTP_PASS) {
			try {
				const transporter = nodemailer.createTransport({
					host: process.env.SMTP_HOST || 'smtp.gmail.com',
					port: parseInt(process.env.SMTP_PORT) || 587,
					secure: false,
					auth: {
						user: process.env.SMTP_USER,
						pass: process.env.SMTP_PASS
					}
				});

				// Email to admin/service provider
				const recipientEmails = {
					attraction: process.env.ATTRACTIONS_EMAIL || process.env.ADMIN_EMAIL,
					hotel: process.env.HOTELS_EMAIL || process.env.ADMIN_EMAIL,
					car: process.env.CARS_EMAIL || process.env.ADMIN_EMAIL,
					flight: process.env.FLIGHTS_EMAIL || process.env.ADMIN_EMAIL
				};
				const recipientEmail = recipientEmails[booking.type] || process.env.ADMIN_EMAIL || process.env.SMTP_USER;

				const providerEmail = {
					from: `"2goWhere Bookings" <${process.env.SMTP_USER}>`,
					to: recipientEmail,
					subject: `New ${(booking.type || 'booking').charAt(0).toUpperCase() + (booking.type || 'booking').slice(1)} Booking - ${bookingId}`,
					html: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
							<h2 style="color: #1a5490;">New Booking Request</h2>
							<p><strong>Booking ID:</strong> ${bookingId}</p>
							<p><strong>Type:</strong> ${(booking.type || 'booking').toUpperCase()}</p>
							<hr>
							<h3>Customer Information</h3>
							<p><strong>Name:</strong> ${booking.name}</p>
							<p><strong>Email:</strong> ${booking.email}</p>
							<p><strong>Phone:</strong> ${booking.phone}</p>
							<hr>
							<h3>Booking Details</h3>
							${detailsHtml}
							${booking.message ? `<p><strong>Special Requests:</strong><br>${booking.message}</p>` : ''}
							<hr>
							<p style="color: #666; font-size: 12px;">Received: ${new Date().toLocaleString()}</p>
						</div>
					`
				};

				// Confirmation email to customer
				const customerEmail = {
					from: `"2goWhere" <${process.env.SMTP_USER}>`,
					to: booking.email,
					subject: `Booking Confirmation - ${bookingId}`,
					html: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
							<h2 style="color: #1a5490;">Thank You for Your Booking!</h2>
							<p>Dear ${booking.name},</p>
							<p>We've received your booking request and it's being processed.</p>
							<p><strong>Booking ID:</strong> ${bookingId}</p>
							<hr>
							<h3>Your Details</h3>
							${detailsHtml}
							<hr>
							<p>You will receive a confirmation from the service provider shortly.</p>
							<p style="color: #666; font-size: 12px;">This is an automated message from 2goWhere.com</p>
						</div>
					`
				};

				await transporter.sendMail(providerEmail);
				await transporter.sendMail(customerEmail);
				emailSent = true;
			} catch (emailError) {
				console.error('Email sending failed:', emailError);
				// Continue - booking still recorded
			}
		}

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				ok: true,
				bookingId,
				message: emailSent ? 'Booking confirmed - confirmation email sent' : 'Booking confirmed',
				emailSent,
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
