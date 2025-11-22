# Property Listing System - Setup Guide

This guide explains how to set up and use the property listing system for 2goWhere.

## Overview

The property listing system allows property owners to submit their hotels, attractions, car rentals, malls, and restaurants for listing on 2goWhere. You (the admin) can review, approve, or reject these submissions through an admin panel.

## Features

✅ **Owner Submission Form** - Professional form at `/list-property.html`
✅ **Admin Review Panel** - Manage listings at `/admin.html`
✅ **Email Notifications** - Automatic emails to admin on submission and to owners on status changes
✅ **Database Storage** - Persistent storage in Supabase (optional, falls back to email)
✅ **Multi-Type Support** - Hotels, attractions, car rentals, malls, restaurants
✅ **Image Upload** - Support for multiple property images via URLs
✅ **Amenities Selection** - Checkboxes for common amenities (WiFi, parking, pool, etc.)

## Setup Instructions

### 1. Supabase Database Setup (Recommended)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the schema in `supabase-schema.sql`
4. Copy your project URL and keys from Settings → API
5. Add to your `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Environment Variables

Update your `.env` file with these required variables:

```env
# SMTP for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Admin email (receives new listing notifications)
ADMIN_EMAIL=your-admin@email.com
CONTACT_EMAIL=takalomatome@gmail.com

# Website URL (for email links)
URL=https://2gowhere.com

# Authentication (already configured)
AUTH_SECRET=your-secret-key-minimum-32-characters
```

**Note:** To get a Gmail app password:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use that 16-character password as `SMTP_PASS`

### 3. Deploy Functions

The system uses two serverless functions:

- **`functions/submit-listing.js`** - Handles owner submissions
- **`functions/manage-listings.js`** - Admin panel API (approve/reject/delete)

These are automatically deployed with Netlify. No additional setup needed if you're already using Netlify.

## How It Works

### For Property Owners

1. **Visit** `https://yourdomain.com/list-property.html`
2. **Fill out the form** with property details:
   - Property type (hotel, attraction, car rental, etc.)
   - Name, location, description
   - Contact information
   - Price range, amenities, images
3. **Submit** - Form sends data to serverless function
4. **Confirmation** - Owner sees success message
5. **Wait for approval** - Typically 24-48 hours
6. **Email notification** - Receives approval or rejection email

### For You (Admin)

1. **Get notified** - Receive email when new listing is submitted
2. **Login to admin panel** - Visit `https://yourdomain.com/admin.html`
3. **Review submissions** - See all pending listings with full details
4. **Take action**:
   - **Approve** - Listing goes live, owner gets approval email
   - **Reject** - Provide reason, owner gets rejection email with feedback
   - **Delete** - Permanently remove listing
5. **Track stats** - Dashboard shows pending/approved/rejected counts

## Admin Panel Access

### First Time Login

1. Go to `https://yourdomain.com/admin.html`
2. Enter your email address
3. The system will send you an OTP (One-Time Password)
4. In demo mode, the OTP appears in the response
5. After verification, you're logged in

### Checking If User is Admin

To make yourself an admin, you need to update the user's role in Supabase:

1. Go to Supabase Dashboard → Table Editor → `users` table
2. Find your user record (by email)
3. Change the `role` column from `user` to `admin`
4. Save

Now you can access the admin panel.

## Email Templates

### New Submission Notification (to admin)
- Subject: "New [type] Listing Submitted - [name]"
- Includes: property details, owner contact info, link to admin panel

### Approval Notification (to owner)
- Subject: "Your [type] Listing Has Been Approved"
- Includes: congratulations message, link to view listing

### Rejection Notification (to owner)
- Subject: "Your [type] Listing Has Been Rejected"
- Includes: rejection reason, encouragement to resubmit

## Making Approved Listings Live

Currently, approved listings are stored in the database but not automatically displayed on the main site. To integrate approved listings:

### Option 1: Manual Integration (Quick)
1. Review approved listings in admin panel
2. Manually add the best ones to your attraction/hotel data arrays in `index.html`

### Option 2: Automatic Integration (Advanced)
You can extend the system to automatically fetch and display approved listings:

```javascript
// Add this to your index.html script section
async function loadApprovedListings(type) {
  const response = await fetch(`/.netlify/functions/manage-listings?status=approved&type=${type}`);
  const result = await response.json();
  return result.listings || [];
}

// Use in your existing render functions
const liveHotels = await loadApprovedListings('hotel');
// Merge with your existing hotelsData array
```

## Testing

### Test Without Database (Email Only)

If you haven't set up Supabase yet, the system will still work using email notifications:

1. Configure SMTP settings in `.env`
2. Submit a test listing
3. Check your admin email for notification
4. Note: You won't be able to use the admin panel without Supabase

### Test With Database

1. Set up Supabase as described above
2. Submit a test listing via the form
3. Check your email for notification
4. Login to admin panel
5. Approve/reject the test listing
6. Check owner email for status notification

## Troubleshooting

### "Database not configured" error
- Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are in your `.env`
- Check that the environment variables are deployed to Netlify

### Not receiving emails
- Verify SMTP credentials are correct
- Check spam folder
- For Gmail, make sure you're using an App Password, not your regular password
- Ensure 2-Step Verification is enabled on your Google account

### Admin panel login fails
- Ensure your user has `role='admin'` in Supabase users table
- Check that `AUTH_SECRET` is configured in `.env`
- Clear browser cache and try again

### Listings not appearing
- Approved listings are stored in database but need manual or automatic integration
- Use the admin panel to view all approved listings
- Export data and add to your main site's data arrays

## Security Notes

🔒 **Admin access** - Only users with `role='admin'` can access the management panel
🔒 **RLS enabled** - Supabase Row Level Security prevents unauthorized database access
🔒 **CORS configured** - Serverless functions only accept requests from your domain
🔒 **Input validation** - All submissions are validated before storage
🔒 **Email sanitization** - HTML is escaped to prevent XSS attacks

## Support

If you need help setting this up, check:
- Supabase documentation: https://supabase.com/docs
- Netlify Functions docs: https://docs.netlify.com/functions/overview/
- Gmail App Passwords: https://support.google.com/accounts/answer/185833

## Next Steps

1. ✅ Set up Supabase database
2. ✅ Configure environment variables
3. ✅ Deploy to Netlify
4. ✅ Make yourself admin in Supabase
5. ✅ Test the submission form
6. ✅ Test the admin panel
7. ✅ Share the listing page with property owners
8. ⏳ Integrate approved listings into main site (optional)

---

**Built for 2goWhere** - Making South African travel booking easier and safer.
