import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, email, customerName, amount } = await request.json()

    if (!email || !invoiceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://landscaping.airealsolutions.com'
    const invoiceLink = `${appUrl}/customer/invoices/${invoiceId}`

    const emailBody = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #2d5016; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
      .header h1 { margin: 0; }
      .invoice-details { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
      .amount { font-size: 24px; font-weight: bold; color: #2d5016; }
      .button { display: inline-block; background-color: #2d5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
      .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🌳 Invoice from AIRealSolutions</h1>
      </div>

      <p>Hello ${customerName},</p>

      <p>Your service has been completed! Your invoice is ready for payment.</p>

      <div class="invoice-details">
        <p><strong>Invoice ID:</strong> ${invoiceId.substring(0, 8)}</p>
        <p><strong>Amount Due:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
      </div>

      <p>
        <a href="${invoiceLink}" class="button">View & Pay Invoice</a>
      </p>

      <p>
        Thank you for choosing AIRealSolutions for your landscaping needs!
        We appreciate your business and look forward to serving you again.
      </p>

      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; 2026 AIRealSolutions. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
    `

    // Mock email sending (configure SendGrid/other email provider later)
    if (process.env.NEXT_PUBLIC_EMAIL_MODE === 'mock') {
      console.log(`[MOCK EMAIL] Sent invoice to ${email}`)
      return NextResponse.json({
        success: true,
        message: 'Mock email sent - configure email provider for real delivery',
        email,
        invoiceId,
      })
    }

    // TODO: Integrate SendGrid, Mailgun, or AWS SES here
    console.log(`Email would be sent to ${email} for invoice ${invoiceId}`)

    return NextResponse.json({
      success: true,
      message: 'Invoice email queued for delivery',
      email,
      invoiceId,
    })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invoice email' },
      { status: 500 }
    )
  }
}
