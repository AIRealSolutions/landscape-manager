'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { company } from '@/config/company'

const KNOWN_SOURCES = ['website', 'phone', 'referral', 'social', 'advertisement', 'other']

export default function LeadCapture() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [utmNote, setUtmNote] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    property_size: 'residential',
    services: [] as string[],
    lead_source: 'website',
    message: '',
  })

  // Attribute the lead: ?src=referral / ?utm_source=facebook etc. set the
  // funnel source automatically, and full UTM details land in the lead notes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const src = (params.get('src') || params.get('utm_source') || '').toLowerCase()

    let lead_source = 'website'
    if (KNOWN_SOURCES.includes(src)) lead_source = src
    else if (['facebook', 'instagram', 'tiktok', 'nextdoor'].includes(src)) lead_source = 'social'
    else if (['google', 'ads', 'gads', 'bing'].includes(src)) lead_source = 'advertisement'

    const utmBits = ['utm_source', 'utm_medium', 'utm_campaign', 'src']
      .map((k) => (params.get(k) ? `${k}=${params.get(k)}` : null))
      .filter(Boolean)
      .join(', ')

    if (lead_source !== 'website') {
      setFormData((prev) => ({ ...prev, lead_source }))
    }
    if (utmBits) setUtmNote(`[Source: ${utmBits}]`)
  }, [])

  const serviceOptions = [
    { id: 'mowing', label: 'Lawn Mowing' },
    { id: 'aeration', label: 'Aeration & Seeding' },
    { id: 'landscaping', label: 'Landscaping Design' },
    { id: 'mulching', label: 'Mulch & Bedding' },
    { id: 'tree-service', label: 'Tree Service' },
    { id: 'hardscape', label: 'Hardscape Installation' },
    { id: 'maintenance', label: 'Property Maintenance' },
    { id: 'seasonal', label: 'Seasonal Cleanup' },
  ]

  const handleServiceChange = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (!formData.services.length) {
        throw new Error('Please select at least one service')
      }

      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          property_size: formData.property_size,
          service_interested: formData.services,
          lead_source: formData.lead_source,
          notes: [formData.message, utmNote].filter(Boolean).join('\n'),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit form')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Thank You!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've received your request. The {company.name} team will contact you within 24 hours
              with your free quote.
            </p>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg mb-6">
              <p className="text-green-900 dark:text-green-200 font-medium">
                We'll reach you at 📞 {formData.phone}
              </p>
              {company.phone && (
                <p className="text-sm text-green-800 dark:text-green-300 mt-2">
                  Need us sooner? Call{' '}
                  <a href={`tel:${company.phone}`} className="font-semibold underline">
                    {company.phone}
                  </a>
                </p>
              )}
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-2xl font-bold text-green-600">
            {company.emoji} {company.name}
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Get a Free Quote
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Tell us about your landscaping needs and we'll provide a personalized quote within 24 hours.
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property Address *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="123 Main St, City, State"
                required
              />
            </div>

            {/* Property Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property Size
              </label>
              <select
                value={formData.property_size}
                onChange={(e) => setFormData({ ...formData, property_size: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="residential">Residential (Single Family Home)</option>
                <option value="small-commercial">Small Commercial</option>
                <option value="large-commercial">Large Commercial</option>
              </select>
            </div>

            {/* Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Services Interested In *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {serviceOptions.map((service) => (
                  <label key={service.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service.id)}
                      onChange={() => handleServiceChange(service.id)}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{service.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Details
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                rows={4}
                placeholder="Tell us more about your project..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-lg"
            >
              {submitting ? 'Submitting...' : '📧 Get Free Quote'}
            </button>

            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              We'll contact you within 24 hours with a personalized quote.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
