# 2goWhere - Real-time Booking System Setup

## Booking System Overview

Your website now has a complete real-time booking system that allows users to:
- 📍 Book attractions and tours
- 🏨 Reserve hotel rooms
- 🚗 Rent cars
- ✈️ Book flights

Bookings are sent via email to service providers and customers receive instant confirmation.

## Setup Instructions

### 1. Install Dependencies

```powershell
npm install
```

### 2. Configure Email Settings

Copy the example environment file:
```powershell
Copy-Item .env.example .env
```

Edit `.env` and add your SMTP credentials:

**For Gmail:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use that app password (not your regular password)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here

ADMIN_EMAIL=bookings@2gowhere.com
ATTRACTIONS_EMAIL=attractions@2gowhere.com
HOTELS_EMAIL=hotels@2gowhere.com
CARS_EMAIL=cars@2gowhere.com
FLIGHTS_EMAIL=flights@2gowhere.com
```

### 3. Add Environment Variables to Netlify

In your Netlify dashboard:
1. Go to Site Settings → Environment Variables
2. Add each variable from your `.env` file
3. Redeploy your site

### 4. Test Locally

```powershell
netlify dev
```

Then visit http://localhost:8888 and test a booking.

## How It Works

### User Flow:
1. User clicks "Book Now" on any attraction, hotel, car, or flight
2. A booking modal appears with a form
3. User fills in their details and submits
4. Booking is sent to `/.netlify/functions/send-booking`
5. Emails are sent to:
   - Service provider (e.g., attractions@2gowhere.com)
   - Customer (confirmation email)
6. User sees success message with booking ID

### Booking IDs:
Each booking gets a unique ID like: `BK1732188400000AB12C`
- Format: BK + timestamp + random code
- Customers can reference this ID when contacting you

## Email Templates

### Service Provider Email:
- Booking ID
- Customer name, email, phone
- Booking type-specific details (dates, guests, etc.)
- Special requests/notes

### Customer Confirmation:
- Thank you message
- Booking ID for reference
- Summary of their booking
- Next steps message

## Customization

### Change Email Recipients:
Edit the environment variables to route bookings to different emails.

### Customize Email Templates:
Edit `functions/send-booking.js` - look for the `providerEmail` and `customerEmail` objects.

### Add More Booking Types:
1. Add a new type in `openBookingModal()` function
2. Add recipient email in environment variables
3. Update the switch statement in `send-booking.js`

## Alternative Email Providers

### SendGrid:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### Mailgun:
```javascript
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});
```

## Troubleshooting

### Emails not sending:
- Check Netlify function logs
- Verify SMTP credentials are correct
- Check Gmail app password is used (not regular password)
- Make sure environment variables are set in Netlify

### Modal not appearing:
- Check browser console for JavaScript errors
- Ensure `index.html` has the booking modal code

### Form validation errors:
- All forms require: name, email, phone
- Date fields must be today or future dates
- Specific requirements per booking type

## Security Notes

- Never commit `.env` file to git (already in `.gitignore`)
- Use app passwords, not regular passwords
- Environment variables are encrypted in Netlify
- Consider rate limiting for production (Netlify has built-in DDoS protection)

## Next Steps

1. Set up dedicated email addresses for each service
2. Consider integrating with a CRM system
3. Add payment processing (Stripe, PayFast, etc.)
4. Set up automated confirmation workflows
5. Add SMS notifications via Twilio
6. Create admin dashboard to manage bookings
