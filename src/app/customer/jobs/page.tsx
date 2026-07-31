'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerJobs() {
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
        .select('*')
        .order('scheduled_date', { ascending: false })

      setJobs(jobsData || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🌳 My Services</h1>
          <div className="space-x-4">
            <span className="text-gray-600 dark:text-gray-400">{user?.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your Scheduled Services</h2>
          <p className="text-gray-600 dark:text-gray-400">View and manage your upcoming landscape services</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {jobs.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No services scheduled yet</p>
              <Link
                href="/"
                className="inline-block px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Return Home
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                      Services
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {new Date(job.scheduled_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {job.start_time}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {Array.isArray(job.services) ? job.services.join(', ') : job.services}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {job.status !== 'completed' && job.status !== 'paid' && (
                          <Link href={`/customer/jobs/${job.id}/reschedule`} className="text-blue-600 hover:text-blue-700 mr-4">
                            Reschedule
                          </Link>
                        )}
                        <Link href={`/customer/jobs/${job.id}`} className="text-gray-600 hover:text-gray-700">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
