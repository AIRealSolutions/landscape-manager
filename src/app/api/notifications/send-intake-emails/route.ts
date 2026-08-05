import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Send intake notification emails via Resend
// This can be called manually or set up as a cron job
export async function POST(req: Request) {
  try {
    // Verify the request is authorized (optional: add API key check)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pending notifications
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from('intake_notifications')
      .select('*')
      .eq('status', 'pending')
      .limit(10)

    if (fetchError) throw fetchError

    if (!notifications || notifications.length === 0) {
      return Response.json({ message: 'No pending notifications' })
    }

    // Get Resend API key
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Send emails
    const results = []
    for (const notif of notifications) {
      try {
        const emailHtml = generateIntakeEmail(notif)

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'intakes@landscape-manager.app',
            to: notif.recipient_email,
            subject: `New Property Intake: ${notif.customer_name} - ${notif.property_address}`,
            html: emailHtml,
            reply_to: notif.customer_email,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          // Mark as sent
          await supabaseAdmin
            .from('intake_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notif.id)

          results.push({ id: notif.id, status: 'sent' })
        } else {
          // Mark as failed
          await supabaseAdmin
            .from('intake_notifications')
            .update({
              status: 'failed',
              error_message: (data as any).message || 'Unknown error',
            })
            .eq('id', notif.id)

          results.push({ id: notif.id, status: 'failed', error: (data as any).message })
        }
      } catch (err) {
        // Mark as failed
        await supabaseAdmin
          .from('intake_notifications')
          .update({
            status: 'failed',
            error_message: (err as Error).message,
          })
          .eq('id', notif.id)

        results.push({ id: notif.id, status: 'failed', error: (err as Error).message })
      }
    }

    return Response.json({ sent: results.length, results })
  } catch (err) {
    console.error('Error sending notifications:', err)
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}

function generateIntakeEmail(notif: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #16a34a, #10b981); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-item { background: #f3f4f6; padding: 16px; border-radius: 6px; }
    .info-label { font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
    .info-value { font-size: 16px; color: #111827; font-weight: 500; }
    .cost-box { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; text-align: center; }
    .cost-amount { font-size: 36px; font-weight: bold; color: #16a34a; }
    .cost-label { font-size: 12px; color: #059669; font-weight: 600; }
    .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌱 New Property Intake</h1>
      <p>A new customer submitted their property details</p>
    </div>

    <div class="section">
      <h2>Customer Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">NAME</div>
          <div class="info-value">${notif.customer_name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">EMAIL</div>
          <div class="info-value">${notif.customer_email}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Property Details</h2>
      <div class="info-item" style="margin-bottom: 0;">
        <div class="info-label">ADDRESS</div>
        <div class="info-value">${notif.property_address}</div>
      </div>
    </div>

    <div class="section">
      <div class="cost-box">
        <div class="cost-label">ESTIMATED MONTHLY COST</div>
        <div class="cost-amount">$${notif.estimated_cost}</div>
      </div>
    </div>

    <div class="section">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/onboarding" class="button">
        Review Full Details in Admin
      </a>
    </div>

    <div class="footer">
      <p>This is an automated notification. Reply to this email to contact the customer.</p>
    </div>
  </div>
</body>
</html>
  `
}
