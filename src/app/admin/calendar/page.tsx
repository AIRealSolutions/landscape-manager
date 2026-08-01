'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getOrCreateCompanyId } from '@/lib/profile'
import {
  getScheduleBlocks,
  createScheduleBlock,
  deleteScheduleBlock,
  blocksOnDate,
  fmtDate,
  BLOCK_TYPES,
  ScheduleBlock,
} from '@/lib/schedule'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdminCalendar() {
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [jobs, setJobs] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(fmtDate(new Date()))
  const [error, setError] = useState<string | null>(null)

  const [showBlockForm, setShowBlockForm] = useState(false)
  const [savingBlock, setSavingBlock] = useState(false)
  const [blockForm, setBlockForm] = useState({
    title: '',
    block_type: 'vacation',
    start_date: fmtDate(new Date()),
    end_date: '',
    all_day: true,
    start_time: '12:00',
    end_time: '13:00',
    recurrence: 'none',
    notes: '',
  })

  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchBlocks()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [month])

  const fetchJobs = async () => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const { data } = await supabase
      .from('jobs')
      .select('id, scheduled_date, start_time, status, customers(name)')
      .gte('scheduled_date', fmtDate(first))
      .lte('scheduled_date', fmtDate(last))
      .order('start_time', { ascending: true })
    setJobs(data || [])
  }

  const fetchBlocks = async () => {
    try {
      setBlocks(await getScheduleBlocks())
    } catch (err: any) {
      setError(err?.message || 'Failed to load blocked time')
    }
  }

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBlock(true)
    setError(null)
    try {
      const companyId = await getOrCreateCompanyId()
      await createScheduleBlock({
        company_id: companyId,
        title: blockForm.title.trim() || BLOCK_TYPES.find((t) => t.id === blockForm.block_type)?.label || 'Blocked',
        block_type: blockForm.block_type as ScheduleBlock['block_type'],
        start_date: blockForm.start_date,
        end_date: blockForm.end_date || null,
        all_day: blockForm.all_day,
        start_time: blockForm.all_day ? null : blockForm.start_time,
        end_time: blockForm.all_day ? null : blockForm.end_time,
        recurrence: blockForm.recurrence as ScheduleBlock['recurrence'],
        notes: blockForm.notes.trim() || null,
      })
      setShowBlockForm(false)
      setBlockForm((prev) => ({ ...prev, title: '', end_date: '', notes: '' }))
      await fetchBlocks()
    } catch (err: any) {
      setError(err?.message || 'Failed to add blocked time')
    } finally {
      setSavingBlock(false)
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Remove this blocked time?')) return
    setError(null)
    try {
      await deleteScheduleBlock(blockId)
      await fetchBlocks()
    } catch (err: any) {
      setError(err?.message || 'Failed to remove blocked time')
    }
  }

  // Build the 6x7 month grid
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(d.getDate() + i)
    cells.push(d)
  }

  const jobsOn = (dateStr: string) => jobs.filter((j) => j.scheduled_date === dateStr)
  const todayStr = fmtDate(new Date())
  const selectedJobs = jobsOn(selectedDate)
  const selectedBlocks = blocksOnDate(blocks, selectedDate)
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const typeEmoji = (type: string) => BLOCK_TYPES.find((t) => t.id === type)?.emoji || '⛔'

  const statusDot: { [key: string]: string } = {
    scheduled: 'bg-blue-500',
    confirmed: 'bg-cyan-500',
    'in-progress': 'bg-yellow-500',
    completed: 'bg-green-500',
    paid: 'bg-purple-500',
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">📅 Calendar</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Month navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              ←
            </button>
            <h2 className="text-xl font-bold text-gray-900 w-48 text-center">{monthLabel}</h2>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              →
            </button>
            <button
              onClick={() => {
                const now = new Date()
                setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
                setSelectedDate(fmtDate(now))
              }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => {
              setBlockForm((prev) => ({ ...prev, start_date: selectedDate }))
              setShowBlockForm(!showBlockForm)
            }}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-sm"
          >
            {showBlockForm ? 'Cancel' : '⛔ Block Time Off'}
          </button>
        </div>

        {/* Block form */}
        {showBlockForm && (
          <form onSubmit={handleAddBlock} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Block Time Off</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Type</label>
                <select
                  value={blockForm.block_type}
                  onChange={(e) => setBlockForm({ ...blockForm, block_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {BLOCK_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-1">Title</label>
                <input
                  type="text"
                  value={blockForm.title}
                  onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })}
                  placeholder={'e.g. Family vacation, Lunch break, Mower service'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Start Date</label>
                <input
                  type="date"
                  value={blockForm.start_date}
                  onChange={(e) => setBlockForm({ ...blockForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  End Date <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={blockForm.end_date}
                  onChange={(e) => setBlockForm({ ...blockForm, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Repeats</label>
                <select
                  value={blockForm.recurrence}
                  onChange={(e) => setBlockForm({ ...blockForm, recurrence: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Every day</option>
                  <option value="weekly">Weekly (same weekday)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={blockForm.all_day}
                  onChange={(e) => setBlockForm({ ...blockForm, all_day: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">All day</span>
              </label>
              {!blockForm.all_day && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">From</label>
                    <input
                      type="time"
                      value={blockForm.start_time}
                      onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">To</label>
                    <input
                      type="time"
                      value={blockForm.end_time}
                      onChange={(e) => setBlockForm({ ...blockForm, end_time: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    />
                  </div>
                </>
              )}
              <button
                type="submit"
                disabled={savingBlock}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {savingBlock ? 'Saving...' : 'Block This Time'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Examples: a week-long vacation (start + end date, all day) · lunch every day (repeats daily,
              12:00–13:00) · no service on Sundays (repeats weekly, all day).
            </p>
          </form>
        )}

        {/* Calendar grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-600 uppercase">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const dateStr = fmtDate(cell)
              const inMonth = cell.getMonth() === month.getMonth()
              const dayJobs = jobsOn(dateStr)
              const dayBlocks = blocksOnDate(blocks, dateStr)
              const hasAllDayBlock = dayBlocks.some((b) => b.all_day)
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === todayStr

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[92px] p-1.5 border-b border-r border-gray-100 text-left align-top transition relative ${
                    !inMonth ? 'bg-gray-50/70' : hasAllDayBlock ? 'bg-red-50' : 'bg-white'
                  } ${isSelected ? 'ring-2 ring-inset ring-green-500' : 'hover:bg-gray-50'}`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                      isToday
                        ? 'bg-green-600 text-white font-bold'
                        : inMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {cell.getDate()}
                  </span>
                  <div className="space-y-0.5 mt-0.5">
                    {dayBlocks.slice(0, 1).map((b, bi) => (
                      <div key={bi} className="text-[10px] leading-tight px-1 py-0.5 bg-red-100 text-red-800 rounded truncate">
                        {typeEmoji(b.block_type)} {b.all_day ? b.title : `${b.start_time?.slice(0, 5)} ${b.title}`}
                      </div>
                    ))}
                    {dayJobs.slice(0, 2).map((j) => (
                      <div key={j.id} className="flex items-center gap-1 text-[10px] leading-tight px-1 py-0.5 bg-gray-100 text-gray-800 rounded truncate">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[j.status] || 'bg-gray-400'}`} />
                        {j.start_time?.slice(0, 5)} {j.customers?.name}
                      </div>
                    ))}
                    {dayJobs.length + dayBlocks.length > 3 && (
                      <div className="text-[10px] text-gray-500 px-1">
                        +{dayJobs.length + dayBlocks.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              Jobs on {new Date(selectedDate + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            {selectedJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No jobs scheduled.</p>
            ) : (
              <div className="space-y-2">
                {selectedJobs.map((j) => (
                  <div key={j.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusDot[j.status] || 'bg-gray-400'}`} />
                      <span className="font-medium text-gray-900">{j.start_time?.slice(0, 5)}</span>
                      <span className="text-gray-700">{j.customers?.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{j.status}</span>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/admin/jobs/new"
              className="inline-block mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              + Schedule a job
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Blocked Time This Day</h3>
            {selectedBlocks.length === 0 ? (
              <p className="text-gray-500 text-sm">Nothing blocked — full availability.</p>
            ) : (
              <div className="space-y-2">
                {selectedBlocks.map((b) => (
                  <div key={b.id} className="flex items-start justify-between border border-red-100 bg-red-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-red-900">
                        {typeEmoji(b.block_type)} {b.title}
                      </p>
                      <p className="text-xs text-red-700 mt-0.5">
                        {b.all_day ? 'All day' : `${b.start_time?.slice(0, 5)} – ${b.end_time?.slice(0, 5)}`}
                        {b.recurrence === 'daily' && ' · repeats daily'}
                        {b.recurrence === 'weekly' && ' · repeats weekly'}
                        {b.end_date && b.recurrence === 'none' && ` · through ${b.end_date}`}
                      </p>
                      {b.notes && <p className="text-xs text-red-700 mt-1">{b.notes}</p>}
                    </div>
                    <button
                      onClick={() => b.id && handleDeleteBlock(b.id)}
                      className="text-red-600 hover:text-red-800 text-sm ml-2"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* All upcoming blocks */}
            {blocks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">All Blocked Time</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {blocks.map((b) => (
                    <div key={b.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-700 truncate">
                        {typeEmoji(b.block_type)} {b.title} — {b.start_date}
                        {b.end_date ? ` → ${b.end_date}` : ''}
                        {!b.all_day ? ` (${b.start_time?.slice(0, 5)}–${b.end_time?.slice(0, 5)})` : ''}
                        {b.recurrence !== 'none' ? ` · ${b.recurrence}` : ''}
                      </span>
                      <button
                        onClick={() => b.id && handleDeleteBlock(b.id)}
                        className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
