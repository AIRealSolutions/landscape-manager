import { NextRequest, NextResponse } from 'next/server'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

export async function POST(request: NextRequest) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      )
    }

    const { phone, message, jobId, customerId } = await request.json()

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      )
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
          To: phone,
          Body: message,
        }).toString(),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send SMS')
    }

    return NextResponse.json({
      success: true,
      messageId: data.sid,
      status: data.status,
      jobId,
      customerId,
      notificationId: `notif_${Date.now()}`,
    })
  } catch (error: any) {
    console.error('SMS Send Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
}
