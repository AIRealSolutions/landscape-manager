import { supabase } from './supabase'

export interface ScheduleBlock {
  id?: string
  company_id?: string
  title: string
  block_type: 'vacation' | 'holiday' | 'personal' | 'maintenance' | 'break' | 'other'
  start_date: string // YYYY-MM-DD
  end_date?: string | null
  all_day?: boolean
  start_time?: string | null // HH:MM
  end_time?: string | null
  recurrence?: 'none' | 'daily' | 'weekly'
  notes?: string | null
}

export const BLOCK_TYPES = [
  { id: 'vacation', label: 'Vacation', emoji: '🏖️' },
  { id: 'holiday', label: 'Holiday', emoji: '🎉' },
  { id: 'personal', label: 'Personal / Appointment', emoji: '🕐' },
  { id: 'maintenance', label: 'Equipment Maintenance', emoji: '🔧' },
  { id: 'break', label: 'Daily Break (lunch, etc.)', emoji: '🍽️' },
  { id: 'other', label: 'Other', emoji: '⛔' },
]

export async function getScheduleBlocks() {
  const { data, error } = await supabase
    .from('schedule_blocks')
    .select('*')
    .order('start_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createScheduleBlock(block: ScheduleBlock & { company_id: string }) {
  const { data, error } = await supabase
    .from('schedule_blocks')
    .insert([block])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteScheduleBlock(blockId: string) {
  const { error } = await supabase.from('schedule_blocks').delete().eq('id', blockId)
  if (error) throw error
}

// Local-timezone YYYY-MM-DD (toISOString would shift the date in some zones)
export function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Does this block apply on the given calendar date?
export function blockAppliesOnDate(block: ScheduleBlock, dateStr: string): boolean {
  const date = parseDate(dateStr)
  const start = parseDate(block.start_date)
  const end = block.end_date ? parseDate(block.end_date) : null

  if (date < start) return false

  switch (block.recurrence || 'none') {
    case 'daily':
      return !end || date <= end
    case 'weekly':
      if (end && date > end) return false
      return date.getDay() === start.getDay()
    default:
      return date <= (end || start)
  }
}

export function blocksOnDate(blocks: ScheduleBlock[], dateStr: string): ScheduleBlock[] {
  return blocks.filter((b) => blockAppliesOnDate(b, dateStr))
}

// Does a job at start_time (HH:MM) for durationMinutes collide with this block?
export function blockConflictsWithTime(
  block: ScheduleBlock,
  startTime: string,
  durationMinutes: number
): boolean {
  if (block.all_day || !block.start_time || !block.end_time) return true

  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const jobStart = toMin(startTime)
  const jobEnd = jobStart + durationMinutes
  const blockStart = toMin(block.start_time)
  const blockEnd = toMin(block.end_time)

  return jobStart < blockEnd && jobEnd > blockStart
}

// All blocks that conflict with a proposed job slot
export function conflictingBlocks(
  blocks: ScheduleBlock[],
  dateStr: string,
  startTime: string,
  durationMinutes: number
): ScheduleBlock[] {
  return blocksOnDate(blocks, dateStr).filter((b) =>
    blockConflictsWithTime(b, startTime, durationMinutes)
  )
}
