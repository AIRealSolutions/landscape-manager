import { supabase } from './supabase'

export interface Lead {
  id?: string
  first_name: string
  last_name: string
  email?: string
  phone: string
  address?: string
  property_size?: string
  service_interested: string[]
  lead_source: string
  status: 'new' | 'contacted' | 'qualified' | 'quoted' | 'negotiating' | 'won' | 'lost' | 'archived'
  lead_score?: number
  estimated_value?: number
  notes?: string
}

export interface LeadInteraction {
  lead_id: string
  interaction_type: 'call' | 'email' | 'meeting' | 'sms' | 'note'
  subject: string
  notes?: string
  next_follow_up?: string
}

export async function createLead(lead: Lead & { company_id: string }) {
  try {
    const { data, error } = await supabase.from('leads').insert([lead]).select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error creating lead:', error)
    throw error
  }
}

export async function updateLead(leadId: string, updates: Partial<Lead>) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating lead:', error)
    throw error
  }
}

export async function getLeads(companyId: string, status?: string) {
  try {
    let query = supabase.from('leads').select('*').eq('company_id', companyId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching leads:', error)
    throw error
  }
}

export async function getLead(leadId: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*, lead_interactions(*), lead_quotes(*)')
      .eq('id', leadId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching lead:', error)
    throw error
  }
}

export async function addLeadInteraction(interaction: LeadInteraction & { user_id: string }) {
  try {
    const { data, error } = await supabase.from('lead_interactions').insert([interaction]).select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding interaction:', error)
    throw error
  }
}

export async function getLeadInteractions(leadId: string) {
  try {
    const { data, error } = await supabase
      .from('lead_interactions')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching interactions:', error)
    throw error
  }
}

export async function createLeadQuote(
  leadId: string,
  services: string[],
  estimatedCost: number,
  validUntilDays: number = 30
) {
  try {
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validUntilDays)

    const quoteNumber = `QUOTE-${Date.now()}`

    const { data, error } = await supabase
      .from('lead_quotes')
      .insert([
        {
          lead_id: leadId,
          quote_number: quoteNumber,
          services,
          estimated_cost: estimatedCost,
          valid_until: validUntil.toISOString().split('T')[0],
          status: 'draft',
        },
      ])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error creating quote:', error)
    throw error
  }
}

export async function sendLeadQuote(quoteId: string) {
  try {
    const { data, error } = await supabase
      .from('lead_quotes')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error sending quote:', error)
    throw error
  }
}

export async function calculateLeadScore(lead: Lead): Promise<number> {
  let score = 0

  // Email provided = 10 points
  if (lead.email) score += 10

  // Phone provided = 5 points
  if (lead.phone) score += 5

  // Address provided = 15 points
  if (lead.address) score += 15

  // Property size provided = 10 points
  if (lead.property_size) score += 10

  // Multiple services interested = 20 points
  if (lead.service_interested?.length > 1) score += 20

  // Quality lead sources
  const qualitySources: { [key: string]: number } = {
    referral: 25,
    phone: 20,
    website: 15,
    social: 10,
    advertisement: 10,
    other: 5,
  }
  score += qualitySources[lead.lead_source] || 5

  return Math.min(score, 100) // Cap at 100
}

export async function convertLeadToCustomer(
  leadId: string,
  customerId: string
) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        status: 'won',
        converted_to_customer_id: customerId,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error converting lead:', error)
    throw error
  }
}

export async function getLeadFunnelStats(companyId: string) {
  try {
    const leads = await getLeads(companyId)

    const stats = {
      new: leads.filter((l) => l.status === 'new').length,
      contacted: leads.filter((l) => l.status === 'contacted').length,
      qualified: leads.filter((l) => l.status === 'qualified').length,
      quoted: leads.filter((l) => l.status === 'quoted').length,
      negotiating: leads.filter((l) => l.status === 'negotiating').length,
      won: leads.filter((l) => l.status === 'won').length,
      lost: leads.filter((l) => l.status === 'lost').length,
      total: leads.length,
    }

    const conversionRate =
      stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : '0'

    return {
      stats,
      conversionRate,
      avgLeadValue: leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0) / Math.max(leads.length, 1),
    }
  } catch (error) {
    console.error('Error getting funnel stats:', error)
    return { stats: {}, conversionRate: 0, avgLeadValue: 0 }
  }
}
