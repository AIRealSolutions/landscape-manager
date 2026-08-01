'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getScheduleBlocks, conflictingBlocks } from '@/lib/schedule'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewJob() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [formData, setFormData] = useState({
    customer_id: '',
    property_id: '',
    service_ids: [] as string[],
    scheduled_date: '',
    start_time: '',
    estimated_duration: 120,
    notes: '',
    completion_criteria: '',
    price: '',
  })
  const [properties, setProperties] = useState<any[]>([])
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([])
  const [keyAspects, setKeyAspects] = useState<string[]>([])
  const [aspectInput, setAspectInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      await fetchData()
      setLoading(false)
    }

    checkAuth()
  }, [])

  const fetchData = async () => {
    try {
      const { data: customersData } = await supabase.from('customers').select('*')
      const { data: servicesData } = await supabase.from('services').select('*')

      setCustomers(customersData || [])
      setServices(servicesData || [])
      setScheduleBlocks(await getScheduleBlocks().catch(() => []))
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleCustomerChange = async (customerId: string) => {
    setFormData((prev) => ({ ...prev, customer_id: customerId, property_id: '' }))
    setProperties([])
    if (!customerId) return

    const { data: props } = await supabase
      .from('properties')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })

    setProperties(props || [])
    // Auto-select when the customer has exactly one property
    if (props?.length === 1) {
      setFormData((prev) => ({ ...prev, property_id: props[0].id }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const selectedCustomer = customers.find((c) => c.id === formData.customer_id)

      // Include any aspect still sitting in the input box
      const aspects = [...keyAspects, ...(aspectInput.trim() ? [aspectInput.trim()] : [])]

      const { data: jobData, error: insertError } = await supabase
        .from('jobs')
        .insert([
          {
            customer_id: formData.customer_id,
            property_id: formData.property_id || null,
            service_ids: formData.service_ids,
            crew_ids: [],
            scheduled_date: formData.scheduled_date,
            start_time: formData.start_time,
            estimated_duration: formData.estimated_duration,
            status: 'scheduled',
            notes: formData.notes,
            key_aspects: aspects,
            completion_criteria: formData.completion_criteria || null,
            price: formData.price ? parseFloat(formData.price) : 0,
          },
        ])
        .select()

      if (insertError) throw insertError

      if (jobData?.[0] && selectedCustomer) {
        await scheduleNotifications(jobData[0], selectedCustomer)
      }

      router.push('/admin/dashboard?created=job')
    } catch (err: any) {
      console.error('Error creating job:', err)
      setError(err?.message || 'Failed to create job')
    } finally {
      setSubmitting(false)
    }
  }

  const addAspect = () => {
    const value = aspectInput.trim()
    if (!value) return
    setKeyAspects((prev) => [...prev, value])
    setAspectInput('')
  }

  const removeAspect = (index: number) => {
    setKeyAspects((prev) => prev.filter((_, i) => i !== index))
  }

  const scheduleNotifications = async (job: any, customer: any) => {
    try {
      const jobDate = new Date(job.scheduled_date)
      const schedules = [
        { hoursOffset: 168, message: `Hi ${customer.name}, we have you scheduled for your service on ${jobDate.toLocaleDateString()} at ${job.start_time}. Confirm or reschedule online.` },
        { hoursOffset: 24, message: `Reminder: Your service is tomorrow at ${job.start_time}. We look forward to seeing you!` },
        { hoursOffset: 2, message: `Our crew is on the way! ETA in approximately 2 hours.` },
      ]

      for (const schedule of schedules) {
        const notificationTime = new Date(jobDate)
        notificationTime.setHours(notificationTime.getHours() - schedule.hoursOffset)

        await supabase.from('notifications').insert([
          {
            job_id: job.id,
            customer_id: job.customer_id,
            type: 'sms',
            message: schedule.message,
            scheduled_at: notificationTime.toISOString(),
            status: 'pending',
          },
        ])
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error)
    }
  }

  const scheduleConflicts =
    formData.scheduled_date && formData.start_time
      ? conflictingBlocks(scheduleBlocks, formData.scheduled_date, formData.start_time, formData.estimated_duration || 0)
      : []

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => {
      const service_ids = prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId]
      // Suggest a price from the selected services (still editable below)
      const suggested = services
        .filter((s) => service_ids.includes(s.id))
        .reduce((sum, s) => sum + Number(s.base_price || 0), 0)
      return { ...prev, service_ids, price: suggested > 0 ? suggested.toFixed(2) : '' }
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🌳 Create New Job</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              <p className="font-medium">Could not create job</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer *
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Selection */}
            {formData.customer_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property *
                </label>
                {properties.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    This customer has no properties yet — add one on their profile first, or the job will
                    be created without a property workflow.
                  </p>
                ) : (
                  <select
                    value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                    required
                  >
                    <option value="">Select a property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.label} — {property.address}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Services Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Services *
              </label>
              <div className="space-y-2">
                {services.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    No services in your catalog yet.{' '}
                    <Link href="/admin/services" className="font-semibold underline">
                      Set up Services &amp; Pricing
                    </Link>{' '}
                    first so jobs can be priced.
                  </p>
                ) : (
                  services.map((service) => (
                    <label key={service.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.service_ids.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="ml-3 text-gray-700 dark:text-gray-300">
                        {service.name} — ${Number(service.base_price).toFixed(2)}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Price ($)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-filled from the selected services — adjust for property size, travel, or discounts.
              </p>
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheduled Date *
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estimated Duration (minutes) *
              </label>
              <input
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                min="15"
                step="15"
                required
              />
            </div>

            {/* Schedule conflict warning */}
            {scheduleConflicts.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <p className="font-semibold text-amber-900 mb-1">⚠️ This time is blocked off</p>
                <ul className="text-sm text-amber-800 space-y-0.5">
                  {scheduleConflicts.map((b: any, i: number) => (
                    <li key={i}>
                      {b.title}
                      {b.all_day ? ' (all day)' : ` (${b.start_time?.slice(0, 5)}–${b.end_time?.slice(0, 5)})`}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-amber-700 mt-2">
                  You can still create the job, but consider picking a different time.
                </p>
              </div>
            )}

            {/* Key Aspects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Aspects of the Job
              </label>
              <p className="text-xs text-gray-500 mb-2">
                The specific things the crew must cover — e.g. "Edge along driveway", "Clear leaves from flower beds", "Trim hedges to 4 ft".
              </p>
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
                        onClick={() => removeAspect(i)}
                        className="text-green-700 hover:text-red-600 ml-2"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Completion Criteria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What Should It Look Like When Completed?
              </label>
              <textarea
                value={formData.completion_criteria}
                onChange={(e) => setFormData({ ...formData, completion_criteria: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                rows={3}
                placeholder="Describe the finished result — e.g. lawn striped at 3 inches, beds weed-free with fresh mulch edges, all clippings hauled away..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                rows={4}
                placeholder="Add any special instructions or notes for the crew..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Creating...' : 'Create Job'}
              </button>
              <Link
                href="/admin/dashboard"
                className="flex-1 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 text-center transition"
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
