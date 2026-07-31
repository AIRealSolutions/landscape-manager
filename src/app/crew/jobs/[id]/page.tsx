'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function JobDetails() {
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [service, setService] = useState<any>(null)
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
        .select('*, customers(name, phone, email, address), services(*)')
        .eq('id', jobId)
        .single()

      setJob(jobData)
      if (jobData?.customers) {
        setCustomer(jobData.customers)
      }
    } catch (error) {
      console.error('Error fetching job:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Job not found</p>
          <Link href="/crew/jobs" className="text-blue-600 hover:text-blue-700">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const getStatusStage = (status: string) => {
    const stages = ['scheduled', 'confirmed', 'in-progress', 'completed']
    return stages.indexOf(status)
  }

  const currentStage = getStatusStage(job.status)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🌳 Job Details</h1>
          <Link href="/crew/jobs" className="text-blue-600 hover:text-blue-700">
            Back to Jobs
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Progress Timeline */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Job Progress</h3>
            <div className="flex justify-between items-center">
              {['Scheduled', 'Confirmed', 'In Progress', 'Completed'].map((stage, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition ${
                      idx <= currentStage
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {idx < currentStage ? '✓' : idx + 1}
                  </div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                    {stage}
                  </p>
                  {idx < 3 && (
                    <div
                      className={`absolute w-16 h-1 mt-5 transition ${
                        idx < currentStage
                          ? 'bg-green-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      style={{ marginLeft: '2rem' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              👤 {customer?.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  <a href={`tel:${customer?.phone}`} className="text-blue-600 hover:text-blue-700">
                    {customer?.phone}
                  </a>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  <a href={`mailto:${customer?.email}`} className="text-blue-600 hover:text-blue-700">
                    {customer?.email}
                  </a>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
              <p className="font-semibold text-gray-900 dark:text-white">📍 {customer?.address}</p>
            </div>
          </div>

          {/* Job Details */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📅 Schedule</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Date</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {new Date(job.scheduled_date).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Time</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{job.start_time}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Duration</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {job.estimated_duration} min
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Price</p>
                <p className="text-lg font-bold text-green-600">${job.price}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {job.notes && (
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">📝 Special Instructions</h3>
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded border-l-4 border-blue-500">
                <p className="text-blue-900 dark:text-blue-200">{job.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            {job.status === 'scheduled' || job.status === 'confirmed' ? (
              <Link
                href={`/crew/jobs/${job.id}/checkin`}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition text-center"
              >
                ▶️ Start Job
              </Link>
            ) : job.status === 'in-progress' ? (
              <Link
                href={`/crew/jobs/${job.id}/complete`}
                className="flex-1 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition text-center"
              >
                ✅ Complete Job
              </Link>
            ) : (
              <div className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg text-center">
                ✔️ Completed
              </div>
            )}
            <Link
              href="/crew/jobs"
              className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition text-center"
            >
              Back
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
