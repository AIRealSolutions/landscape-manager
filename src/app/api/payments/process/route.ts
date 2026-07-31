import { NextRequest, NextResponse } from 'next/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured. Add STRIPE_SECRET_KEY to environment.' },
        { status: 500 }
      )
    }

    const { invoice_id, amount, payment_method, stripe_payment_intent_id } = await request.json()

    if (!invoice_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If using mock mode (for testing without Stripe)
    if (process.env.NEXT_PUBLIC_PAYMENT_MODE === 'mock') {
      return NextResponse.json({
        success: true,
        payment_id: `mock_${Date.now()}`,
        invoice_id,
        amount,
        status: 'succeeded',
        message: 'Mock payment - configure Stripe for real payments',
      })
    }

    // Real Stripe payment processing
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: (amount * 100).toString(), // Stripe uses cents
        currency: 'usd',
        payment_method: payment_method || 'card',
        confirm: 'true',
      }).toString(),
    })

    const stripeData = await stripeResponse.json()

    if (!stripeResponse.ok) {
      throw new Error(stripeData.error?.message || 'Stripe payment failed')
    }

    return NextResponse.json({
      success: true,
      payment_id: stripeData.id,
      invoice_id,
      amount,
      status: stripeData.status,
      client_secret: stripeData.client_secret,
    })
  } catch (error: any) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Payment processing failed' },
      { status: 500 }
    )
  }
}
