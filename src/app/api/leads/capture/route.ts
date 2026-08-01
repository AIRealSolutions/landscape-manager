import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      first_name,
      last_name,
      email,
      phone,
      address,
      property_size,
      service_interested,
      lead_source,
      notes,
    } = body

    if (!first_name || !last_name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate lead score
    let leadScore = 0
    if (email) leadScore += 10
    if (phone) leadScore += 5
    if (address) leadScore += 15
    if (property_size) leadScore += 10
    if (service_interested?.length > 1) leadScore += 20

    const sourceScores: { [key: string]: number } = {
      referral: 25,
      phone: 20,
      website: 15,
      social: 10,
      advertisement: 10,
      other: 5,
    }
    leadScore += sourceScores[lead_source] || 5
    leadScore = Math.min(leadScore, 100)

    // Insert through the capture_lead SECURITY DEFINER function: the form
    // posts anonymously, and leads RLS blocks direct anonymous inserts
    const { data: leadId, error: leadError } = await supabase.rpc('capture_lead', {
      p_first_name: first_name,
      p_last_name: last_name,
      p_phone: phone,
      p_email: email || null,
      p_address: address || null,
      p_property_size: property_size || null,
      p_service_interested: service_interested || [],
      p_lead_source: lead_source || 'website',
      p_lead_score: leadScore,
      p_notes: notes || null,
    })

    if (leadError) throw leadError

    if (leadId) {
      // Send notification email to admin (mock for now)
      console.log(`New lead captured: ${first_name} ${last_name} - ${phone}`)

      // Could integrate with Twilio/SendGrid here
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: process.env.ADMIN_PHONE_NUMBER || '+1234567890',
            message: `New lead: ${first_name} ${last_name} - ${phone}. Services: ${service_interested.join(', ')}`,
          }),
        })
      } catch (error) {
        console.log('Note: SMS notification would be sent to admin')
      }
    }

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Lead captured successfully',
    })
  } catch (error: any) {
    console.error('Lead capture error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture lead' },
      { status: 500 }
    )
  }
}
