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
		// Normalise booking type early so downstream logic always has booking.type
		booking.type = booking.type || booking.itemType || 'booking';
		const bookingId = `BK${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
		
		// Validate required fields
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
		} else if (booking.type === 'ride') {
			detailsHtml = `
				<p><strong>Pickup Location:</strong> ${booking.pickupLocation || 'N/A'}</p>
				<p><strong>Destination:</strong> ${booking.destination || 'N/A'}</p>
				<p><strong>Pickup Date:</strong> ${booking.pickupDate || 'N/A'}</p>
				<p><strong>Pickup Time:</strong> ${booking.pickupTime || 'N/A'}</p>
				<p><strong>Passengers:</strong> ${booking.passengers || '1'}</p>
			`;
			detailsText = `🚕 **Ride Request**\n📍 From: ${booking.pickupLocation || 'N/A'}\n📍 To: ${booking.destination || 'N/A'}\n📅 ${booking.pickupDate || 'N/A'} at ${booking.pickupTime || 'N/A'}\n👥 Passengers: ${booking.passengers || '1'}`;
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

		// Send SMS notification for ride bookings (instant alert to drivers)
		if (booking.type === 'ride' && process.env.SMS_API_KEY) {
			try {
				const smsBody = new URLSearchParams({
					username: process.env.SMS_USERNAME || 'sandbox',
					to: booking.phone,
					message: `2goWhere: Your ride from ${booking.pickupLocation} to ${booking.destination} on ${booking.pickupDate} at ${booking.pickupTime} is confirmed. Booking ID: ${bookingId}. A driver will contact you soon.`
				});
				
				// Africa's Talking SMS API
				await fetch('https://api.africastalking.com/version1/messaging', {
					method: 'POST',
					headers: {
						'apiKey': process.env.SMS_API_KEY,
						'Content-Type': 'application/x-www-form-urlencoded',
						'Accept': 'application/json'
					},
					body: smsBody
				});
			} catch (smsError) {
				console.error('SMS notification failed:', smsError);
			}
		}

		// Dispatch ride request to ride service API (Uber/Bolt or local network)
		let rideDispatchSuccess = false;
		if (booking.type === 'ride' && process.env.RIDE_API_KEY && process.env.RIDE_API_ENDPOINT) {
			try {
				const ridePayload = {
					pickup_location: booking.pickupLocation,
					destination: booking.destination,
					pickup_datetime: `${booking.pickupDate}T${booking.pickupTime}:00`,
					passengers: parseInt(booking.passengers) || 1,
					customer_name: booking.name,
					customer_phone: booking.phone,
					customer_email: booking.email,
					payment_method: booking.paymentMethod || 'cash',
					special_requests: booking.message || '',
					booking_reference: bookingId
				};

				const rideResponse = await fetch(process.env.RIDE_API_ENDPOINT, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${process.env.RIDE_API_KEY}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(ridePayload)
				});

				if (rideResponse.ok) {
					const rideData = await rideResponse.json();
					console.log('Ride dispatched successfully:', rideData);
					rideDispatchSuccess = true;
				}
			} catch (rideApiError) {
				console.error('Ride API dispatch failed:', rideApiError);
				// Continue - email notification will still go through
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
					flight: process.env.FLIGHTS_EMAIL || process.env.ADMIN_EMAIL,
					ride: process.env.RIDES_EMAIL || process.env.ADMIN_EMAIL
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
				
				// Send additional instant notification to provider via SMS (for urgent bookings)
				if (booking.type === 'hotel' || booking.type === 'attraction') {
					const providerPhone = process.env[`${booking.type.toUpperCase()}_PHONE`];
					if (providerPhone && process.env.SMS_API_KEY) {
						try {
							const providerSms = new URLSearchParams({
								username: process.env.SMS_USERNAME || 'sandbox',
								to: providerPhone,
								message: `NEW BOOKING! ${bookingId} - ${booking.type.toUpperCase()}: ${booking.name} (${booking.phone}). Check email for details.`
							});
							await fetch('https://api.africastalking.com/version1/messaging', {
								method: 'POST',
								headers: {
									'apiKey': process.env.SMS_API_KEY,
									'Content-Type': 'application/x-www-form-urlencoded',
									'Accept': 'application/json'
								},
								body: providerSms
							});
						} catch (providerSmsError) {
							console.error('Provider SMS failed:', providerSmsError);
						}
					}
				}
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
				rideDispatched: rideDispatchSuccess || undefined,
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
