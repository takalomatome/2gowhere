const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Send email notification
async function sendNotificationEmail(listing) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL;
  
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: adminEmail,
    subject: `New ${listing.type} Listing Submitted - ${listing.name}`,
    html: `
      <h2>New Property Listing Submission</h2>
      <p><strong>Type:</strong> ${listing.type}</p>
      <p><strong>Name:</strong> ${listing.name}</p>
      <p><strong>Owner:</strong> ${listing.owner_name}</p>
      <p><strong>Email:</strong> ${listing.owner_email}</p>
      <p><strong>Phone:</strong> ${listing.owner_phone || 'N/A'}</p>
      <p><strong>Location:</strong> ${listing.location}</p>
      <p><strong>Price:</strong> ${listing.price || 'N/A'}</p>
      <p><strong>Description:</strong> ${listing.description}</p>
      <hr>
      <p>Please review this listing in your admin panel: <a href="${process.env.URL || 'https://2gowhere.com'}/admin.html">Admin Panel</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email notification failed:', error);
    return false;
  }
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Validate required fields
    const requiredFields = ['type', 'name', 'owner_name', 'owner_email', 'location', 'description'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Missing required field: ${field}` }),
        };
      }
    }

    // Prepare listing data
    const listing = {
      type: data.type, // hotel, attraction, car, mall, etc.
      name: data.name,
      location: data.location,
      city: data.city || '',
      province: data.province || '',
      description: data.description,
      price: data.price || null,
      owner_name: data.owner_name,
      owner_email: data.owner_email,
      owner_phone: data.owner_phone || '',
      amenities: data.amenities || [],
      images: data.images || [],
      status: 'pending', // pending, approved, rejected
      submitted_at: new Date().toISOString(),
      approved_at: null,
      approved_by: null,
      rating: data.rating || null,
      hours: data.hours || null,
      coordinates: data.coordinates || null,
      website: data.website || '',
      social_media: data.social_media || {},
      additional_info: data.additional_info || {},
    };

    const supabase = getSupabase();
    
    if (supabase) {
      // Store in Supabase
      const { data: insertedData, error } = await supabase
        .from('listings')
        .insert([listing])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error('Failed to save listing');
      }

      // Send notification email
      await sendNotificationEmail(listing);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Listing submitted successfully and is pending approval',
          listing_id: insertedData.id,
        }),
      };
    } else {
      // Fallback: send email only (no database)
      const emailSent = await sendNotificationEmail(listing);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Listing submitted successfully via email. Database not configured.',
          demo: !emailSent,
        }),
      };
    }
  } catch (error) {
    console.error('Submit listing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to submit listing',
        details: error.message,
      }),
    };
  }
};
