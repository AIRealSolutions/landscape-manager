import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if using scheduled tasks
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.NOTIFICATION_WEBHOOK_SECRET

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date().toISOString()

    const { data: pendingNotifications } = await supabase
      .from('notifications')
      .select('*, customers(phone)')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .limit(50)

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    let sent = 0
    let failed = 0

    for (const notification of pendingNotifications) {
      if (!notification.customers?.phone) {
        await supabase
          .from('notifications')
          .update({ status: 'failed' })
          .eq('id', notification.id)
        failed++
        continue
      }

      try {
        const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
        const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
          throw new Error('Twilio not configured')
        }

        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: TWILIO_PHONE_NUMBER,
              To: notification.customers.phone,
              Body: notification.message,
            }).toString(),
          }
        )

        if (response.ok) {
          const data = await response.json()
          await supabase
            .from('notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              delivery_response: data.sid,
            })
            .eq('id', notification.id)
          sent++
        } else {
          throw new Error('SMS send failed')
        }
      } catch (error) {
        console.error(`Error sending notification ${notification.id}:`, error)
        await supabase
          .from('notifications')
          .update({ status: 'failed' })
          .eq('id', notification.id)
        failed++
      }
    }

    return NextResponse.json({
      processed: pendingNotifications.length,
      sent,
      failed,
    })
  } catch (error: any) {
    console.error('Notification processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Processing failed' },
      { status: 500 }
    )
  }
}
