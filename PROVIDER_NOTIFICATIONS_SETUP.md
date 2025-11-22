# Provider Real-Time Notifications Setup

This guide explains how to enable instant notifications to service providers (hotels, attractions, car rentals, flights, rides) when bookings are made.

## Features

### 1. Email Notifications (Already Enabled)
- **Hotel bookings** → Sent to `HOTELS_EMAIL`
- **Attraction bookings** → Sent to `ATTRACTIONS_EMAIL`
- **Car rentals** → Sent to `CARS_EMAIL`
- **Flight bookings** → Sent to `FLIGHTS_EMAIL`
- **Ride requests** → Sent to `RIDES_EMAIL`

### 2. SMS Alerts (Optional - For Instant Notifications)
Providers receive instant SMS when bookings arrive.

### 3. Ride Service API Integration
Automatically dispatch ride requests to Uber, Bolt, or your local driver network.

### 4. Payment Processing
- **Online payments** for all booking types (rides, hotels, attractions, cars, flights)
- **Cash payments** for rides (pay driver directly)

---

## Setup Instructions

### Step 1: Configure Provider Email Addresses

In your Netlify environment variables, set:

```
HOTELS_EMAIL=reservations@yourhotel.com
ATTRACTIONS_EMAIL=bookings@yourattractions.com
CARS_EMAIL=rentals@yourcarservice.com
FLIGHTS_EMAIL=flights@yourairline.com
RIDES_EMAIL=dispatch@yourrides.com
ADMIN_EMAIL=admin@2gowhere.com
```

### Step 2: Enable SMS Notifications (Optional)

#### Option A: Africa's Talking (Recommended for South Africa)

1. Sign up at https://africastalking.com
2. Get your API key and username
3. Add to Netlify environment variables:

```
SMS_API_KEY=your_africastalking_api_key
SMS_USERNAME=your_username
SMS_SENDER_ID=2goWhere
```

4. Add provider phone numbers (for instant alerts):

```
HOTEL_PHONE=+27821234567
ATTRACTION_PHONE=+27821234568
CAR_PHONE=+27821234569
FLIGHT_PHONE=+27821234570
```

#### Option B: Twilio

1. Sign up at https://twilio.com
2. Get your Account SID and Auth Token
3. Adjust the SMS code in `send-booking.js` to use Twilio's API

### Step 3: Ride Service API Integration

#### Option A: Local Driver Network (Webhook)

Set up a simple webhook endpoint that forwards ride requests to your drivers:

```
RIDE_API_ENDPOINT=https://your-dispatch-system.com/api/rides
RIDE_API_KEY=your_api_key
```

Your endpoint should accept:
```json
{
  "pickup_location": "OR Tambo Airport",
  "destination": "Sandton City",
  "pickup_datetime": "2025-11-23T14:30:00",
  "passengers": 2,
  "customer_name": "John Doe",
  "customer_phone": "+27821234567",
  "customer_email": "john@example.com",
  "payment_method": "cash",
  "special_requests": "Baby seat needed",
  "booking_reference": "BK1732123456ABC"
}
```

#### Option B: Uber/Bolt Integration

Contact Uber API (https://developer.uber.com) or Bolt Business API for access, then update the ride dispatch code with their endpoints.

### Step 4: WhatsApp Notifications (Optional)

For instant WhatsApp alerts to providers:

1. Set up WhatsApp Business API (https://business.whatsapp.com)
2. Add credentials:

```
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER=+27821234567
```

3. Update `send-booking.js` to send WhatsApp messages (similar to SMS)

---

## Testing

### Test Email Notifications

1. Make a hotel booking on your site
2. Check that `HOTELS_EMAIL` receives the booking email
3. Customer should receive confirmation at their email

### Test SMS Notifications

1. Ensure `SMS_API_KEY` is set with valid credits
2. Make a booking
3. Provider phone number should receive SMS alert
4. Customer phone should receive confirmation SMS (for rides)

### Test Ride Dispatch

1. Configure `RIDE_API_ENDPOINT` and `RIDE_API_KEY`
2. Request a ride on your site
3. Check your dispatch system logs for the API call
4. Driver should receive ride assignment

---

## How It Works

### Booking Flow

1. **Customer submits booking** → Frontend sends to `/functions/send-booking`
2. **Backend validates data** → Checks name, email, phone required fields
3. **Discord/Slack webhook** → Instant notification to your admin channel (optional)
4. **SMS to customer** (rides only) → Confirmation via Africa's Talking
5. **Ride API dispatch** (rides only) → Sends to Uber/Bolt or local network
6. **Email to provider** → Detailed booking info sent to service provider
7. **SMS to provider** (optional) → Instant alert for urgent bookings
8. **Email to customer** → Confirmation with booking ID
9. **Response to frontend** → Success with booking ID

### Provider Notification Timeline

- **Instant (< 2 seconds)**: Discord/Slack webhook, SMS alerts
- **Fast (5-10 seconds)**: Email notifications
- **API dispatch**: Ride service receives request immediately

---

## Costs

### Email (Gmail SMTP)
- **Free** up to 500 emails/day per account

### SMS (Africa's Talking)
- ~$0.01 - $0.02 per SMS in South Africa
- Buy credits in bulk for discounts

### WhatsApp Business
- Check current pricing on WhatsApp Business Platform

### Ride APIs
- Uber/Bolt: Commission-based (typically 20-30% per ride)
- Custom driver network: Your own pricing

---

## Troubleshooting

### Providers not receiving emails

1. Check Netlify environment variables are set correctly
2. Verify `SMTP_PASS` is a valid Gmail app password
3. Check provider email inbox (and spam folder)
4. Review Netlify function logs for errors

### SMS not sending

1. Verify `SMS_API_KEY` is active with credits
2. Check phone numbers are in E.164 format: `+27821234567`
3. Check Africa's Talking dashboard for delivery status
4. Review function logs for API errors

### Ride dispatch failing

1. Verify `RIDE_API_ENDPOINT` is accessible
2. Check `RIDE_API_KEY` is valid
3. Test your ride API endpoint independently
4. Review function logs for error details

### Payment processing issues

1. Online payments use `processOnlinePayment` (simulated)
2. For real payments, integrate Stripe/PayFast
3. See `PAYMENT_INTEGRATION.md` (create separately if needed)

---

## Security Notes

- Never commit `.env` file (already in `.gitignore`)
- Rotate API keys regularly
- Use environment variables only (not hard-coded)
- Enable 2FA on all service accounts
- Monitor API usage for unusual patterns

---

## Next Steps

1. Set up provider email addresses in Netlify
2. Sign up for Africa's Talking SMS (optional)
3. Configure ride dispatch system
4. Test all notification channels
5. Train providers on booking confirmations
6. Monitor booking flow for issues

For payment gateway integration (Stripe/PayFast), see separate guide.
