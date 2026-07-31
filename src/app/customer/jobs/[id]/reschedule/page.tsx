'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function RescheduleJob() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [job, setJob] = useState<any>(null)
  const [formData, setFormData] = useState({
    scheduled_date: '',
    start_time: '',
    notes: '',
  })
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
        .select('*, customers(name)')
        .eq('id', jobId)
        .single()

      setJob(jobData)
      setFormData({
        scheduled_date: jobData?.scheduled_date || '',
        start_time: jobData?.start_time || '',
        notes: jobData?.notes || '',
      })
    } catch (error) {
      console.error('Error fetching job:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          scheduled_date: formData.scheduled_date,
          start_time: formData.start_time,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      if (error) throw error

      await sendNotificationToAdmin()

      router.push('/customer/jobs?message=Service rescheduled successfully')
    } catch (error) {
      console.error('Error rescheduling job:', error)
      alert('Failed to reschedule service')
    } finally {
      setSubmitting(false)
    }
  }

  const sendNotificationToAdmin = async () => {
    try {
      await fetch('/api/notifications/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: process.env.NEXT_PUBLIC_ADMIN_PHONE || '',
          message: `${job?.customers?.name} has rescheduled their service to ${formData.scheduled_date} at ${formData.start_time}`,
          jobId,
        }),
      })
    } catch (error) {
      console.error('Error notifying admin:', error)
    }
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
          <h1 className="text-2xl font-bold text-green-600">🌳 Reschedule Service</h1>
          <Link href="/customer/jobs" className="text-blue-600 hover:text-blue-700">
            Back to Services
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Current Schedule
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              📅 {new Date(job.scheduled_date).toLocaleDateString()} at {job.start_time}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Date *
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Time *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Special Requests or Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                rows={4}
                placeholder="Let us know if you have any special requests..."
              />
            </div>

            <div className="bg-green-50 dark:bg-green-900 p-4 rounded">
              <p className="text-green-900 dark:text-green-200">
                <strong>✓</strong> Your reschedule request will be reviewed and confirmed within 24 hours.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting...' : '📅 Submit Reschedule Request'}
              </button>
              <Link
                href="/customer/jobs"
                className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
