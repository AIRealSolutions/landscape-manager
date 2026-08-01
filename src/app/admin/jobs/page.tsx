'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getJobs } from '@/lib/jobs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'paid', label: 'Paid' },
]

export default function JobList() {
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      try {
        setJobs(await getJobs())
      } catch (err: any) {
        setError(err?.message || 'Failed to load jobs')
      }
      setLoading(false)
    }
    init()
  }, [])

  const filtered = jobs.filter((j) => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false
    const q = search.toLowerCase()
    return (
      !q ||
      j.customers?.name?.toLowerCase().includes(q) ||
      j.properties?.label?.toLowerCase().includes(q) ||
      j.properties?.address?.toLowerCase().includes(q) ||
      j.scheduled_date?.includes(q)
    )
  })

  const statusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      scheduled: 'bg-blue-50 text-blue-700',
      confirmed: 'bg-cyan-50 text-cyan-700',
      'in-progress': 'bg-yellow-50 text-yellow-700',
      completed: 'bg-green-50 text-green-700',
      paid: 'bg-purple-50 text-purple-700',
    }
    return colors[status] || 'bg-gray-50 text-gray-700'
  }

  const countFor = (status: string) =>
    status === 'all' ? jobs.length : jobs.filter((j) => j.status === status).length

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🗓️ Jobs</h1>
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

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, property, or date..."
            className="flex-1 max-w-lg px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <Link
            href="/admin/jobs/new"
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-center"
          >
            + Create Job
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                statusFilter === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({countFor(tab.id)})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">🗓️</p>
            <p className="text-gray-600 mb-4">
              {jobs.length === 0 ? 'No jobs yet' : 'No jobs match your filters'}
            </p>
            {jobs.length === 0 && (
              <Link
                href="/admin/jobs/new"
                className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Create Your First Job
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <Link
                key={job.id}
                href={`/admin/jobs/${job.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-green-200 transition"
              >
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-900">
                        {new Date(job.scheduled_date + 'T00:00').toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {job.start_time?.slice(0, 5)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">
                      {job.customers?.name}
                      {job.properties && (
                        <span className="text-gray-500"> · 🏡 {job.properties.label} — {job.properties.address}</span>
                      )}
                    </p>
                    {job.notes?.startsWith('Auto-scheduled') && (
                      <p className="text-xs text-teal-700 mt-1">🔁 {job.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-green-600">${Number(job.price || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{job.estimated_duration} min</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
