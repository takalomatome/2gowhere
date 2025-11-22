const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Initialize Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Verify admin session token
function verifyAdminToken(token) {
  if (!token || !process.env.AUTH_SECRET) return null;
  
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', process.env.AUTH_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    if (signature !== expectedSig) return null;
    
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check if token is expired
    if (data.exp && Date.now() > data.exp) return null;
    
    // Check if user is admin
    if (data.role !== 'admin') return null;
    
    return data;
  } catch {
    return null;
  }
}

// Send status update email to owner
async function sendStatusEmail(listing, status, notes = '') {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const statusText = status === 'approved' ? 'Approved' : 'Rejected';
  const statusColor = status === 'approved' ? '#4caf50' : '#f44336';
  
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: listing.owner_email,
    subject: `Your ${listing.type} Listing Has Been ${statusText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColor};">Listing ${statusText}</h2>
        <p>Dear ${listing.owner_name},</p>
        <p>Your listing "<strong>${listing.name}</strong>" has been <strong>${statusText.toLowerCase()}</strong>.</p>
        
        ${status === 'approved' ? `
          <p>🎉 Congratulations! Your property is now live on 2goWhere and visible to thousands of potential customers.</p>
          <p><a href="${process.env.URL || 'https://2gowhere.com'}" style="display: inline-block; padding: 12px 24px; background: #1a5490; color: white; text-decoration: none; border-radius: 6px;">View Your Listing</a></p>
        ` : `
          <p>Unfortunately, we cannot approve your listing at this time.</p>
          ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ''}
          <p>You may resubmit your listing after addressing the concerns mentioned above.</p>
        `}
        
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666;">
          If you have any questions, please contact us at ${process.env.CONTACT_EMAIL || 'takalomatome@gmail.com'}
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Status email failed:', error);
    return false;
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify admin authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    const admin = verifyAdminToken(token);
    if (!admin) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
      };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ error: 'Database not configured' }),
      };
    }

    const { action } = JSON.parse(event.body || '{}');

    // GET: Fetch all pending listings
    if (event.httpMethod === 'GET' || action === 'list') {
      const status = event.queryStringParameters?.status || 'pending';
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', status)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ listings: data || [] }),
      };
    }

    // POST: Approve or reject listing
    if (event.httpMethod === 'POST' || action === 'update_status') {
      const { listing_id, status, notes } = JSON.parse(event.body);

      if (!listing_id || !status || !['approved', 'rejected'].includes(status)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid request. Provide listing_id and status (approved/rejected)' }),
        };
      }

      // Get listing details first
      const { data: listing, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listing_id)
        .single();

      if (fetchError || !listing) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Listing not found' }),
        };
      }

      // Update listing status
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
          approved_by: admin.email,
          rejection_notes: status === 'rejected' ? notes : null,
        })
        .eq('id', listing_id);

      if (updateError) throw updateError;

      // Send notification email to owner
      await sendStatusEmail(listing, status, notes);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Listing ${status} successfully`,
        }),
      };
    }

    // DELETE: Remove listing
    if (event.httpMethod === 'DELETE' || action === 'delete') {
      const { listing_id } = JSON.parse(event.body);

      if (!listing_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing listing_id' }),
        };
      }

      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing_id);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Listing deleted' }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' }),
    };

  } catch (error) {
    console.error('Manage listings error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server error',
        details: error.message,
      }),
    };
  }
};
