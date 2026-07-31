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

    // Get default company (first company, or create if none exists)
    const { data: companies } = await supabase.from('companies').select('id').limit(1)

    let companyId = companies?.[0]?.id

    if (!companyId) {
      const { data: newCompany } = await supabase
        .from('companies')
        .insert([{ name: 'Default Company' }])
        .select()
        .single()
      companyId = newCompany?.id
    }

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          company_id: companyId,
          first_name,
          last_name,
          email: email || null,
          phone,
          address: address || null,
          property_size: property_size || null,
          service_interested: service_interested || [],
          lead_source: lead_source || 'website',
          status: 'new',
          lead_score: leadScore,
          notes: notes || null,
        },
      ])
      .select()

    if (leadError) throw leadError

    if (lead?.[0]) {
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
      leadId: lead?.[0]?.id,
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
