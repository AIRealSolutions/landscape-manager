'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CrewJobs() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)
      await fetchJobs()
      setLoading(false)
    }

    checkAuth()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, customers(name, phone, address)')
        .order('scheduled_date', { ascending: true })

      setJobs(jobsData || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      scheduled: '📅',
      confirmed: '✅',
      'in-progress': '🔄',
      completed: '✔️',
    }
    return icons[status] || '📋'
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <nav className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🌳 My Jobs</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Assigned Jobs</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} assigned
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No jobs assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {job.customers?.name || 'Customer'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📍 {job.customers?.address || 'Address not available'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)} {job.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(job.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Time</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{job.start_time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Duration</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {job.estimated_duration} min
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Price</p>
                      <p className="font-semibold text-green-600">${job.price}</p>
                    </div>
                  </div>

                  {job.notes && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded border-l-4 border-blue-500">
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        <strong>Notes:</strong> {job.notes}
                      </p>
                    </div>
                  )}

                  {job.customers?.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      📞 {job.customers.phone}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/crew/jobs/${job.id}`}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center font-medium transition"
                    >
                      View Details
                    </Link>
                    {job.status === 'scheduled' || job.status === 'confirmed' ? (
                      <Link
                        href={`/crew/jobs/${job.id}/checkin`}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center font-medium transition"
                      >
                        Check In
                      </Link>
                    ) : job.status === 'in-progress' ? (
                      <Link
                        href={`/crew/jobs/${job.id}/complete`}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center font-medium transition"
                      >
                        Complete Job
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
