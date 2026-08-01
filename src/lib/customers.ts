import { supabase } from './supabase'

export interface Customer {
  id?: string
  company_id?: string
  name: string
  email?: string | null
  phone?: string | null
  address: string
  preferred_contact?: 'sms' | 'email' | 'call'
  notes?: string | null
  property_type?: string | null
  lot_size?: string | null
  lawn_area_sqft?: number | null
  property_notes?: string | null
  service_history_count?: number
  created_at?: string
  updated_at?: string
}

export async function getCustomers(search?: string) {
  let query = supabase.from('customers').select('*').order('created_at', { ascending: false })

  if (search?.trim()) {
    const q = `%${search.trim()}%`
    query = query.or(`name.ilike.${q},email.ilike.${q},phone.ilike.${q},address.ilike.${q}`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createCustomer(customer: Customer & { company_id: string }) {
  const { data, error } = await supabase
    .from('customers')
    .insert([{ service_history_count: 0, ...customer }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCustomer(customerId: string, updates: Partial<Customer>) {
  const { data, error } = await supabase
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', customerId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Deletes a customer and their property data (photos, workflow steps cascade
// in the database). Fails with a clear message if the customer has jobs or
// invoices, since those are business records that shouldn't silently vanish.
export async function deleteCustomer(customerId: string) {
  const { count: jobCount } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)

  if (jobCount && jobCount > 0) {
    throw new Error(
      `This customer has ${jobCount} job${jobCount > 1 ? 's' : ''} on record. ` +
        'Delete or reassign their jobs first, or keep the customer for history.'
    )
  }

  // Remove stored photo files before the rows cascade away
  const { data: photos } = await supabase
    .from('property_photos')
    .select('storage_path')
    .eq('customer_id', customerId)

  if (photos && photos.length > 0) {
    await supabase.storage.from('property-photos').remove(photos.map((p) => p.storage_path))
  }

  const { error } = await supabase.from('customers').delete().eq('id', customerId)
  if (error) throw error
}
