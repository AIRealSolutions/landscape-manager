import { supabase } from './supabase'
import { company as envDefaults } from '@/config/company'

export interface Branding {
  name: string
  tagline: string
  phone: string
  email: string
  serviceArea: string
  emoji: string
  website?: string
}

export const defaultBranding: Branding = { ...envDefaults }

// Public branding for the marketing site / lead form. Reads the company's
// database via the get_public_company() function; env-var defaults fill any
// gaps so a fresh instance still renders sensibly.
export async function getPublicBranding(): Promise<Branding> {
  try {
    const { data, error } = await supabase.rpc('get_public_company')
    if (error) return defaultBranding
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return defaultBranding
    return {
      name: row.name || defaultBranding.name,
      tagline: row.tagline || defaultBranding.tagline,
      phone: row.phone || defaultBranding.phone,
      email: row.email || defaultBranding.email,
      serviceArea: row.service_area || defaultBranding.serviceArea,
      emoji: row.emoji || defaultBranding.emoji,
      website: row.website || undefined,
    }
  } catch {
    return defaultBranding
  }
}

// Admin: load the signed-in user's full company row for editing
export async function getCompanySettings(companyId: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateCompanySettings(
  companyId: string,
  updates: {
    name?: string
    tagline?: string | null
    phone?: string | null
    email?: string | null
    service_area?: string | null
    emoji?: string | null
    website?: string | null
  }
) {
  const { data, error } = await supabase
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select()
    .single()
  if (error) throw error
  return data
}
