import { supabase } from './supabase'
import { getScheduleBlocks, blocksOnDate, fmtDate } from './schedule'

export interface ServicePlan {
  id?: string
  customer_id: string
  property_id: string
  service_ids: string[]
  override_price?: number | null
  interval_days: number
  preferred_time?: string | null
  estimated_duration?: number | null
  season_start?: string | null
  season_end?: string | null
  active?: boolean
  notes?: string | null
}

export async function getServicePlan(propertyId: string) {
  const { data, error } = await supabase
    .from('service_plans')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertServicePlan(plan: ServicePlan) {
  const { data, error } = await supabase
    .from('service_plans')
    .upsert([{ ...plan, updated_at: new Date().toISOString() }], { onConflict: 'property_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteServicePlan(planId: string) {
  const { error } = await supabase.from('service_plans').delete().eq('id', planId)
  if (error) throw error
}

// Is this month/day inside the plan's season window? Compared annually, and
// windows that wrap the new year (e.g. Nov 15 - Mar 1) work too.
export function dateInSeason(plan: ServicePlan, dateStr: string): boolean {
  if (!plan.season_start || !plan.season_end) return true

  const md = (s: string) => {
    const parts = s.split('-')
    return parts.length === 3 ? `${parts[1]}-${parts[2]}` : s
  }
  const date = md(dateStr)
  const start = md(plan.season_start)
  const end = md(plan.season_end)

  if (start <= end) return date >= start && date <= end
  return date >= start || date <= end
}

export interface AutoScheduleResult {
  created: boolean
  reason?: string
  nextDate?: string
  jobId?: string
}

// Called when a job is completed: create the next visit interval_days after
// the completion date, skipping fully-blocked days and respecting the season.
export async function autoScheduleNextVisit(job: {
  id: string
  customer_id: string
  property_id?: string | null
}): Promise<AutoScheduleResult> {
  if (!job.property_id) {
    return { created: false, reason: 'Job has no property, so no service plan applies' }
  }

  const plan = await getServicePlan(job.property_id)
  if (!plan || !plan.active) {
    return { created: false, reason: 'No active service plan for this property' }
  }

  // Next need is measured from the day the job was completed (today)
  const next = new Date()
  next.setDate(next.getDate() + (plan.interval_days || 7))

  // Skip days that are fully blocked off (up to 14 days forward)
  let blocks: any[] = []
  try {
    blocks = await getScheduleBlocks()
  } catch {
    blocks = []
  }
  let bumped = 0
  while (
    bumped < 14 &&
    blocksOnDate(blocks, fmtDate(next)).some((b: any) => b.all_day)
  ) {
    next.setDate(next.getDate() + 1)
    bumped++
  }

  const nextDate = fmtDate(next)

  if (!dateInSeason(plan, nextDate)) {
    return {
      created: false,
      reason: `Next visit (${nextDate}) falls outside the service season — plan paused until next season`,
    }
  }

  const { data: created, error } = await supabase
    .from('jobs')
    .insert([
      {
        customer_id: job.customer_id,
        property_id: job.property_id,
        service_ids: plan.service_ids || [],
        crew_ids: [],
        scheduled_date: nextDate,
        start_time: plan.preferred_time || '09:00',
        estimated_duration: plan.estimated_duration || 60,
        status: 'scheduled',
        price: plan.override_price ?? 0,
        notes: `Auto-scheduled by service plan (${plan.interval_days} days after last completed visit)`,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return { created: true, nextDate, jobId: created?.id }
}
