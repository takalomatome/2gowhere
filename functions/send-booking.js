const nodemailer = require('nodemailer');

exports.handler = async (event) => {
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, body: 'Method Not Allowed' };
	}
	
	try {
		const booking = JSON.parse(event.body || '{}');
		const bookingId = `BK${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
		
		// Validate required fields
		if (!booking.type || !booking.name || !booking.email || !booking.phone) {
			return {
				statusCode: 400,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ok: false, error: 'Missing required fields' })
			};
		}
		
		// Email configuration (using environment variables)
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || 'smtp.gmail.com',
			port: process.env.SMTP_PORT || 587,
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS
			}
		});
		
		// Determine recipient email based on booking type
		const recipientEmails = {
			attraction: process.env.ATTRACTIONS_EMAIL || process.env.ADMIN_EMAIL,
			hotel: process.env.HOTELS_EMAIL || process.env.ADMIN_EMAIL,
			car: process.env.CARS_EMAIL || process.env.ADMIN_EMAIL,
			flight: process.env.FLIGHTS_EMAIL || process.env.ADMIN_EMAIL
		};
		
		const recipientEmail = recipientEmails[booking.type] || process.env.ADMIN_EMAIL;
		
		// Format booking details based on type
		let detailsHtml = '';
		if (booking.type === 'attraction') {
			detailsHtml = `
				<p><strong>Attraction:</strong> ${booking.attractionName || 'N/A'}</p>
				<p><strong>Visit Date:</strong> ${booking.visitDate || 'N/A'}</p>
				<p><strong>Number of Guests:</strong> ${booking.guests || 'N/A'}</p>
			`;
		} else if (booking.type === 'hotel') {
			detailsHtml = `
				<p><strong>Hotel:</strong> ${booking.hotelName || 'N/A'}</p>
				<p><strong>Check-in:</strong> ${booking.checkIn || 'N/A'}</p>
				<p><strong>Check-out:</strong> ${booking.checkOut || 'N/A'}</p>
				<p><strong>Guests:</strong> ${booking.guests || 'N/A'}</p>
				<p><strong>Room Type:</strong> ${booking.roomType || 'N/A'}</p>
			`;
		} else if (booking.type === 'car') {
			detailsHtml = `
				<p><strong>Car Type:</strong> ${booking.carType || 'N/A'}</p>
				<p><strong>Pickup Date:</strong> ${booking.pickupDate || 'N/A'}</p>
				<p><strong>Return Date:</strong> ${booking.returnDate || 'N/A'}</p>
				<p><strong>Pickup Location:</strong> ${booking.pickupLocation || 'N/A'}</p>
			`;
		} else if (booking.type === 'flight') {
			detailsHtml = `
				<p><strong>From:</strong> ${booking.from || 'N/A'}</p>
				<p><strong>To:</strong> ${booking.to || 'N/A'}</p>
				<p><strong>Departure:</strong> ${booking.departureDate || 'N/A'}</p>
				<p><strong>Return:</strong> ${booking.returnDate || 'N/A'}</p>
				<p><strong>Passengers:</strong> ${booking.passengers || 'N/A'}</p>
			`;
		}
		
		// Email to service provider
		const providerEmail = {
			from: `"2goWhere Bookings" <${process.env.SMTP_USER}>`,
			to: recipientEmail,
			subject: `New ${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Booking - ${bookingId}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #1a5490;">New Booking Request</h2>
					<p><strong>Booking ID:</strong> ${bookingId}</p>
					<p><strong>Type:</strong> ${booking.type.toUpperCase()}</p>
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
		
		// Send emails
		if (process.env.SMTP_USER && process.env.SMTP_PASS) {
			await transporter.sendMail(providerEmail);
			await transporter.sendMail(customerEmail);
		}
		
		return {
			statusCode: 200,
			headers: { 'Content-Type': 'application/json' },
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
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ok: false,
				error: 'Failed to process booking'
			})
		};
	}
};
