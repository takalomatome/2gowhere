// Local test harness for send-booking Netlify function
// Run: node functions/test-send-booking.js
// NOTE: This uses placeholder env vars; replace with real credentials for a full test.

process.env.SMTP_USER = process.env.SMTP_USER || 'test@example.com';
process.env.SMTP_PASS = process.env.SMTP_PASS || 'dummy-pass'; // Will fail if real SMTP not available
process.env.SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || '';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const { handler } = require('./send-booking.js');

async function run() {
  const sampleBooking = {
    type: 'hotel',
    hotelName: 'Sample Hotel',
    name: 'Test User',
    email: 'customer@example.com',
    phone: '+1234567890',
    checkin: '2025-12-01',
    checkout: '2025-12-05',
    guests: 2,
    roomType: 'Deluxe',
    paymentMethod: 'online',
    message: 'Late check-in if possible.'
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[INFO] SMTP credentials missing: emails will be skipped.');
  }

  const event = {
    httpMethod: 'POST',
    body: JSON.stringify(sampleBooking)
  };

  try {
    const result = await handler(event);
    console.log('Function response:', result.statusCode, result.body);
    const parsed = JSON.parse(result.body);
    if (!parsed.emailSent) {
      console.log('[INFO] Email not sent. Message:', parsed.message);
    }
  } catch (err) {
    console.error('Test harness error:', err);
  }
}

run();
