'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function JobComplete() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [job, setJob] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [notes, setNotes] = useState('')
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos([...photos, ...files])

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
    setPreviewUrls(previewUrls.filter((_, i) => i !== index))
  }

  const handleCompleteJob = async () => {
    if (photos.length === 0) {
      alert('Please upload at least one photo as proof of work')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      if (error) throw error

      await sendCompletionNotification()

      router.push('/crew/jobs?status=completed')
    } catch (error) {
      console.error('Error completing job:', error)
      alert('Failed to complete job')
    } finally {
      setSubmitting(false)
    }
  }

  const sendCompletionNotification = async () => {
    try {
      if (customer?.phone) {
        const message = `Your service is complete! Photos: [link] Invoice: [link] Thank you for choosing us!`
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
          <h1 className="text-2xl font-bold text-green-600">🌳 Complete Job</h1>
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
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📸 Upload Proof of Work
            </h3>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                id="photo-input"
              />
              <label htmlFor="photo-input" className="cursor-pointer">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-900 dark:text-white font-medium">
                  Click to upload photos
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  or drag and drop
                </p>
              </label>
            </div>

            {previewUrls.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                  {previewUrls.length} photo{previewUrls.length !== 1 ? 's' : ''} selected
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-lg font-bold text-gray-900 dark:text-white mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              rows={4}
              placeholder="Any notes about the job completion..."
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded mb-8">
            <p className="text-blue-900 dark:text-blue-200">
              <strong>💡 Tip:</strong> Upload at least 2-3 photos showing the completed work from different angles.
              This helps build customer trust and protects your business.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCompleteJob}
              disabled={submitting || photos.length === 0}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-lg"
            >
              {submitting ? 'Completing...' : '✅ Complete & Notify Customer'}
            </button>
            <Link
              href="/crew/jobs"
              className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition text-lg text-center"
            >
              Back
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
