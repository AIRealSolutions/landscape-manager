'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function JobCheckIn() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [job, setJob] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
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
      getCurrentLocation()
      setLoading(false)
    }

    init()
  }, [])

  const fetchJobDetails = async () => {
    try {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, customers(name, phone, email, address)')
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        setLocationError(`Could not get location: ${error.message}`)
      }
    )
  }

  const handleCheckIn = async () => {
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'in-progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      if (error) throw error

      await sendNotificationToCustomer('arrival')

      router.push(`/crew/jobs/${jobId}`)
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Failed to check in')
    } finally {
      setSubmitting(false)
    }
  }

  const sendNotificationToCustomer = async (stage: string) => {
    try {
      if (customer?.phone) {
        const message = `We've arrived at your property! Your service is starting now.`
        await fetch('/api/notifications/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: customer.phone,
            message,
            jobId,
            customerId: job.customer_id,
          }),
        })
      }
    } catch (error) {
      console.error('Error sending notification:', error)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🌳 Check In</h1>
          <Link href="/crew/jobs" className="text-blue-600 hover:text-blue-700">
            Back to Jobs
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {customer?.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              📍 {customer?.address}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              📞 {customer?.phone}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
              <p className="text-xs text-blue-600 dark:text-blue-200 uppercase">Scheduled Date</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {new Date(job.scheduled_date).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded">
              <p className="text-xs text-green-600 dark:text-green-200 uppercase">Time</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {job.start_time}
              </p>
            </div>
          </div>

          <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Location Status</h3>
            {location ? (
              <div className="text-green-600 dark:text-green-400">
                ✅ Location detected
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Latitude: {location.lat.toFixed(4)}
                  <br />
                  Longitude: {location.lng.toFixed(4)}
                </p>
              </div>
            ) : locationError ? (
              <div className="text-yellow-600 dark:text-yellow-400">
                ⚠️ {locationError}
                <button
                  onClick={getCurrentLocation}
                  className="block mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-300">
                📍 Requesting location...
              </div>
            )}
          </div>

          {job.notes && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900 rounded border-l-4 border-blue-500">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Special Instructions</h3>
              <p className="text-gray-700 dark:text-gray-300">{job.notes}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleCheckIn}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-lg"
            >
              {submitting ? 'Checking In...' : '✅ Start Job'}
            </button>
            <Link
              href="/crew/jobs"
              className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition text-lg text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
