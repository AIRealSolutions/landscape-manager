import { supabase } from './supabase'

export interface Service {
  id?: string
  company_id?: string
  type: string
  name: string
  description?: string | null
  base_price: number
  frequency: 'one-time' | 'weekly' | 'biweekly' | 'monthly'
  seasonal_availability?: string[] | null
  created_at?: string
}

export const SERVICE_CATEGORIES = [
  { id: 'mowing', label: 'Mowing & Lawn Care' },
  { id: 'aeration', label: 'Aeration & Seeding' },
  { id: 'landscaping', label: 'Landscaping & Design' },
  { id: 'mulching', label: 'Mulch & Bedding' },
  { id: 'tree-service', label: 'Tree & Shrub Service' },
  { id: 'hardscape', label: 'Hardscape' },
  { id: 'irrigation', label: 'Irrigation' },
  { id: 'cleanup', label: 'Cleanup' },
  { id: 'snow', label: 'Snow Removal' },
  { id: 'maintenance', label: 'General Maintenance' },
  { id: 'other', label: 'Other' },
]

export const FREQUENCIES = [
  { id: 'one-time', label: 'One-time' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly' },
]

export const SEASONS = ['spring', 'summer', 'fall', 'winter']

export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createService(service: Service & { company_id: string }) {
  const { data, error } = await supabase.from('services').insert([service]).select().single()
  if (error) throw error
  return data
}

export async function updateService(serviceId: string, updates: Partial<Service>) {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteService(serviceId: string) {
  const { error } = await supabase.from('services').delete().eq('id', serviceId)
  if (error) throw error
}
