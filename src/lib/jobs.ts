import { supabase } from './supabase'

export interface Job {
  id?: string
  customer_id: string
  property_id?: string | null
  service_ids: string[]
  crew_ids: string[]
  scheduled_date: string
  start_time: string
  estimated_duration: number
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'paid'
  notes?: string | null
  key_aspects?: string[]
  completion_criteria?: string | null
  price: number
  actual_duration?: number | null
}

export const JOB_STATUSES = ['scheduled', 'confirmed', 'in-progress', 'completed', 'paid'] as const

export async function getJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, customers(id, name, phone), properties(id, label, address)')
    .order('scheduled_date', { ascending: false })
    .order('start_time', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getJob(jobId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, customers(id, name, phone, email), properties(id, label, address)')
    .eq('id', jobId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateJob(jobId: string, updates: Partial<Job>) {
  const { data, error } = await supabase
    .from('jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteJob(jobId: string) {
  // Notifications reference jobs without ON DELETE, so clear them first
  await supabase.from('notifications').delete().eq('job_id', jobId)
  const { error } = await supabase.from('jobs').delete().eq('id', jobId)
  if (error) throw error
}
