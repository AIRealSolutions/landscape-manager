'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getJob, updateJob, deleteJob, JOB_STATUSES } from '@/lib/jobs'
import { getServices } from '@/lib/services'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function AdminJobDetail() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<any>(null)
  const [catalog, setCatalog] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [form, setForm] = useState({
    scheduled_date: '',
    start_time: '',
    estimated_duration: '60',
    price: '',
    status: 'scheduled',
    service_ids: [] as string[],
    notes: '',
    completion_criteria: '',
  })
  const [keyAspects, setKeyAspects] = useState<string[]>([])
  const [aspectInput, setAspectInput] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchJob()
      setLoading(false)
    }
    init()
  }, [])

  const fetchJob = async () => {
    try {
      const [jobData, services] = await Promise.all([getJob(jobId), getServices().catch(() => [])])
      setJob(jobData)
      setCatalog(services)
      if (jobData) {
        setForm({
          scheduled_date: jobData.scheduled_date || '',
          start_time: jobData.start_time?.slice(0, 5) || '',
          estimated_duration: jobData.estimated_duration?.toString() || '60',
          price: jobData.price?.toString() || '',
          status: jobData.status || 'scheduled',
          service_ids: jobData.service_ids || [],
          notes: jobData.notes || '',
          completion_criteria: jobData.completion_criteria || '',
        })
        setKeyAspects(jobData.key_aspects || [])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load job')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const aspects = [...keyAspects, ...(aspectInput.trim() ? [aspectInput.trim()] : [])]
      await updateJob(jobId, {
        scheduled_date: form.scheduled_date,
        start_time: form.start_time,
        estimated_duration: parseInt(form.estimated_duration) || 60,
        price: form.price ? parseFloat(form.price) : 0,
        status: form.status as any,
        service_ids: form.service_ids,
        notes: form.notes.trim() || null,
        completion_criteria: form.completion_criteria.trim() || null,
        key_aspects: aspects,
      })
      setAspectInput('')
      setNotice('Job saved')
      await fetchJob()
    } catch (err: any) {
      setError(err?.message || 'Failed to save job')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this job? Its notifications are removed too. This cannot be undone.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteJob(jobId)
      router.push('/admin/jobs')
    } catch (err: any) {
      setError(err?.message || 'Failed to delete job')
      setDeleting(false)
    }
  }

  const toggleService = (serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }))
  }

  const addAspect = () => {
    const value = aspectInput.trim()
    if (!value) return
    setKeyAspects((prev) => [...prev, value])
    setAspectInput('')
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Job not found</p>
        <Link href="/admin/jobs" className="text-green-600 hover:text-green-700 font-medium">
          Back to Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🗓️ Job Details</h1>
          <Link href="/admin/jobs" className="text-blue-600 hover:text-blue-700">
            All Jobs
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {notice && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">✅ {notice}</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Something went wrong</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Who / where */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div>
              <Link
                href={`/admin/customers/${job.customers?.id}`}
                className="text-xl font-bold text-gray-900 hover:text-green-700"
              >
                👤 {job.customers?.name}
              </Link>
              {job.properties && (
                <p className="text-gray-600 mt-1">
                  <Link
                    href={`/admin/customers/${job.customers?.id}/properties/${job.properties.id}`}
                    className="hover:text-green-700"
                  >
                    🏡 {job.properties.label} — {job.properties.address}
                  </Link>
                </p>
              )}
              {job.customers?.phone && (
                <p className="text-sm text-gray-500 mt-1">
                  📞 <a href={`tel:${job.customers.phone}`} className="text-blue-600">{job.customers.phone}</a>
                </p>
              )}
            </div>
            {job.notes?.startsWith('Auto-scheduled') && (
              <span className="text-xs px-3 py-1 bg-teal-50 text-teal-700 rounded-full">
                🔁 Auto-scheduled by service plan
              </span>
            )}
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Date *</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Start Time *</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Duration (min)</label>
              <input
                type="number"
                value={form.estimated_duration}
                onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })}
                min="15"
                step="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Price ($)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Services</label>
            {catalog.length === 0 ? (
              <p className="text-sm text-gray-500">No services in the catalog.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catalog.map((service) => (
                  <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.service_ids.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      {service.name} — ${Number(service.base_price).toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Key aspects */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Key Aspects</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={aspectInput}
                onChange={(e) => setAspectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAspect()
                  }
                }}
                placeholder="Add an aspect and press Enter"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
              <button
                type="button"
                onClick={addAspect}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Add
              </button>
            </div>
            {keyAspects.length > 0 && (
              <ul className="space-y-1">
                {keyAspects.map((aspect, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-green-50 border border-green-100 text-green-900 rounded-lg px-3 py-2 text-sm"
                  >
                    <span>✔ {aspect}</span>
                    <button
                      type="button"
                      onClick={() => setKeyAspects((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-green-700 hover:text-red-600 ml-2"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              What Should It Look Like When Completed?
            </label>
            <textarea
              value={form.completion_criteria}
              onChange={(e) => setForm({ ...form, completion_criteria: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Job'}
          </button>
        </form>

        {/* Danger zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Deleting a job removes it from the schedule and clears its pending notifications.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            {deleting ? 'Deleting...' : '🗑 Delete Job'}
          </button>
        </div>
      </main>
    </div>
  )
}
