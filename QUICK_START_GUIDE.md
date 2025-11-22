# Quick Start Guide - Property Listing System

## For You (Admin) - How to Accept Listings

### Step 1: Setup Supabase (One-time, 10 minutes)

1. **Go to** https://supabase.com and sign up
2. **Create new project** → Choose a name and password
3. **Wait** for project to initialize (2-3 minutes)
4. **Go to SQL Editor** (left sidebar)
5. **Click "New query"**
6. **Copy and paste** the entire contents of `supabase-schema.sql`
7. **Click "Run"** button
8. **Go to Settings → API**
9. **Copy these values** to your Netlify environment variables:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role secret key

### Step 2: Make Yourself Admin (One-time, 2 minutes)

1. **Visit your site** and sign up with your email
2. **Go to Supabase Dashboard** → Table Editor → `users` table
3. **Find your email** in the list
4. **Click on the `role` cell** and change `user` to `admin`
5. **Click save** (checkmark icon)

### Step 3: Review Listings (Daily workflow)

1. **Visit** `https://yourdomain.com/admin.html`
2. **Login** with your admin email
3. **See pending listings** on the dashboard
4. **Click on each listing** to review:
   - Property details
   - Owner information
   - Images and amenities
   - Description

5. **Take action:**
   - ✅ **Approve** → Listing goes live, owner gets approval email
   - ❌ **Reject** → Add reason, owner gets feedback email
   - 🗑️ **Delete** → Remove permanently

### Step 4: Share the Form

Send property owners to: `https://yourdomain.com/list-property.html`

## For Property Owners - How It Works

### Their Process:

1. **Visit** the listing page
2. **Fill the form:**
   - Select property type (hotel, attraction, car, mall, restaurant)
   - Enter name, location, description
   - Add their contact info
   - Select amenities (if hotel)
   - Add image URLs
3. **Submit**
4. **Wait** for your approval (they get email notification)

### What They Need:

- Basic property information
- Good description (at least 100 words)
- Their contact details (name, email, phone)
- Image URLs (they can use Imgur, Cloudinary, or any image host)
- Price range (optional)

## Email Notifications

### You Receive:
- ✉️ **New listing submitted** → Details + link to admin panel

### Owner Receives:
- ✉️ **Listing approved** → Congrats + link to view listing
- ✉️ **Listing rejected** → Your reason + encourage to resubmit

## Quick Checklist

Before going live:

- [ ] Supabase project created
- [ ] SQL schema executed
- [ ] Environment variables set in Netlify
- [ ] Made yourself admin in Supabase
- [ ] Tested submission form
- [ ] Tested admin panel login
- [ ] Tested approve/reject actions
- [ ] Verified emails are working
- [ ] Shared listing page URL with owners

## Netlify Environment Variables

Add these in Netlify Dashboard → Site settings → Environment variables:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=your-email@gmail.com
URL=https://2gowhere.com
```

## What Happens When You Approve?

1. ✅ Listing status changes to "approved" in database
2. 📧 Owner gets approval email
3. 📊 Stats update in admin panel
4. 💾 Listing is stored but NOT automatically shown on site yet

## Making Approved Listings Visible

Currently approved listings are in the database but not displayed. Two options:

### Option A: Manual (Recommended)
Review approved listings → Copy best ones → Add to your data arrays in `index.html`

### Option B: Automatic (Advanced)
Create an API endpoint that fetches approved listings and merges them with existing data

## Support & Troubleshooting

### Common Issues:

**"Database not configured"**
→ Add Supabase environment variables to Netlify

**Can't login to admin**
→ Check if your role is "admin" in Supabase users table

**Not receiving emails**
→ Use Gmail App Password, not regular password
→ Enable 2-Step Verification first

**Property owner gets error**
→ Check Netlify function logs for details
→ Verify environment variables are set

## Contact for Help

If stuck, you have:
- ✅ Full setup documentation in `LISTING_SYSTEM_SETUP.md`
- ✅ Database schema in `supabase-schema.sql`
- ✅ Working code in all files

Test everything locally first, then deploy!

---

**Built for 2goWhere** 🇿🇦
Making South African travel accessible to everyone.
