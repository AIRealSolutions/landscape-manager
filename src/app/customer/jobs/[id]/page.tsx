'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function CustomerJobDetails() {
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      await fetchJobDetails()
      setLoading(false)
    }

    init()
  }, [])

  const fetchJobDetails = async () => {
    try {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      setJob(jobData)
    } catch (error) {
      console.error('Error fetching job:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; icon: string } } = {
      scheduled: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', icon: '📅' },
      confirmed: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', icon: '✅' },
      'in-progress': { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', icon: '🔄' },
      completed: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200', icon: '✔️' },
      paid: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', icon: '💳' },
    }
    const badge = badges[status]
    return badge ? `${badge.bg} ${badge.text}` : ''
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Service not found</p>
          <Link href="/customer/jobs" className="text-blue-600 hover:text-blue-700">
            Back to Services
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🌳 Service Details</h1>
          <Link href="/customer/jobs" className="text-blue-600 hover:text-blue-700">
            Back to Services
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Landscape Service
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Service ID: {jobId.substring(0, 8)}...
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold ${getStatusBadge(job.status)}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
              <p className="text-xs text-blue-600 dark:text-blue-200 uppercase font-semibold">Date</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {new Date(job.scheduled_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded">
              <p className="text-xs text-green-600 dark:text-green-200 uppercase font-semibold">Time</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {job.start_time}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded">
              <p className="text-xs text-purple-600 dark:text-purple-200 uppercase font-semibold">Duration</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {job.estimated_duration} min
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded">
              <p className="text-xs text-yellow-600 dark:text-yellow-200 uppercase font-semibold">Price</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                ${job.price.toFixed(2)}
              </p>
            </div>
          </div>

          {job.notes && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900 rounded border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">📝 Special Notes</h3>
              <p className="text-blue-900 dark:text-blue-200">{job.notes}</p>
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded mb-8">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">ℹ️ Service Information</h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>✓ Professional crew assigned</li>
              <li>✓ You'll receive SMS reminder before service</li>
              <li>✓ Real-time location tracking available</li>
              <li>✓ Photo proof of work after completion</li>
              <li>✓ Secure online payment option</li>
            </ul>
          </div>

          {job.status !== 'completed' && job.status !== 'paid' && (
            <div className="flex gap-4 mb-8">
              <Link
                href={`/customer/jobs/${jobId}/reschedule`}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition text-center"
              >
                📅 Reschedule
              </Link>
              <Link
                href="/customer/jobs"
                className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition text-center"
              >
                Back
              </Link>
            </div>
          )}

          {job.status === 'completed' && (
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded border-l-4 border-green-500 mb-8">
              <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">✅ Service Completed</h3>
              <p className="text-green-900 dark:text-green-200">
                Thank you! Your service has been completed. An invoice has been sent to your email.
              </p>
            </div>
          )}

          {!job.notes && (
            <Link
              href="/customer/jobs"
              className="block px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition text-center"
            >
              Back
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
