import { supabase } from './supabase'

export interface Property {
  id?: string
  customer_id: string
  label: string
  address: string
  property_type?: string | null
  lot_size?: string | null
  lawn_area_sqft?: number | null
  property_notes?: string | null
  created_at?: string
  updated_at?: string
}

export async function getProperties(customerId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getProperty(propertyId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createProperty(property: Property) {
  const { data, error } = await supabase
    .from('properties')
    .insert([property])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProperty(propertyId: string, updates: Partial<Property>) {
  const { data, error } = await supabase
    .from('properties')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', propertyId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Deletes a property with its photos and workflow (jobs keep their history,
// their property link just clears). Refuses when it's the customer's only
// property so every customer always has at least one.
export async function deleteProperty(propertyId: string, customerId: string) {
  const { count } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)

  if ((count ?? 0) <= 1) {
    throw new Error("This is the customer's only property — every customer needs at least one.")
  }

  const { data: photos } = await supabase
    .from('property_photos')
    .select('storage_path')
    .eq('property_id', propertyId)

  if (photos && photos.length > 0) {
    await supabase.storage.from('property-photos').remove(photos.map((p) => p.storage_path))
  }

  const { error } = await supabase.from('properties').delete().eq('id', propertyId)
  if (error) throw error
}
