'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GRASS_TYPES } from '@/data/education'
import { submitPropertyIntake, generateRecommendations, calculateTotalMonthlyCost, type PropertyIntake, type RecommendedService } from '@/lib/onboarding'

export default function OnboardingPage() {
  const [step, setStep] = useState<'form' | 'review' | 'complete'>(
    'form'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedService[]>([])
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [intakeId, setIntakeId] = useState<string>('')

  const [formData, setFormData] = useState<PropertyIntake>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    propertySize: 'medium',
    grassType: undefined,
    currentCondition: 'good',
    issues: [],
    serviceLevel: 'standard',
    availability: '',
  })

  const handleInputChange = (field: keyof PropertyIntake, value: any) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)

    // Auto-generate recommendations as they fill out
    if (
      updated.currentCondition &&
      updated.propertySize &&
      updated.serviceLevel
    ) {
      const recs = generateRecommendations(updated)
      setRecommendations(recs)
      setEstimatedCost(calculateTotalMonthlyCost(recs))
    }
  }

  const handleIssueToggle = (issue: string) => {
    setFormData((prev) => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter((i) => i !== issue)
        : [...prev.issues, issue],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.customerName || !formData.customerEmail || !formData.address) {
        throw new Error('Please fill in required fields')
      }

      const result = await submitPropertyIntake(formData)
      setIntakeId(result.intakeId)
      setRecommendations(result.recommendations)
      setEstimatedCost(result.estimatedMonthlyCost)
      setStep('review')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-gradient-to-b from-green-50 to-white min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="text-sm text-green-600 hover:text-green-700 font-medium mb-4 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Get Your Lawn Care Plan</h1>
          <p className="text-xl text-gray-600">
            Tell us about your property and we'll create a custom plan to get your lawn looking great.
          </p>
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Contact Info */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-bold text-gray-900 mb-4">Contact Information</legend>
              <input
                type="text"
                placeholder="Your Name *"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </fieldset>

            {/* Property Details */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-bold text-gray-900 mb-4">Property Details</legend>
              <input
                type="text"
                placeholder="Property Address *"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />

              {/* Property Size */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Property Size *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'small', label: 'Small (< 5,000 sq ft)' },
                    { value: 'medium', label: 'Medium (5-15k sq ft)' },
                    { value: 'large', label: 'Large (15-30k sq ft)' },
                    { value: 'very_large', label: 'Very Large (30k+ sq ft)' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleInputChange('propertySize', opt.value)}
                      className={`p-3 rounded-lg border-2 transition font-medium ${
                        formData.propertySize === opt.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-700 hover:border-green-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grass Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">What grass are you growing?</label>
                <select
                  value={formData.grassType || ''}
                  onChange={(e) => handleInputChange('grassType', e.target.value || undefined)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Not sure (we can help identify)</option>
                  {GRASS_TYPES.map((grass) => (
                    <option key={grass.slug} value={grass.slug}>
                      {grass.emoji} {grass.name} ({grass.season === 'cool' ? 'Cool-season' : 'Warm-season'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lawn Condition */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Current Lawn Condition *</label>
                <div className="space-y-2">
                  {[
                    { value: 'perfect', label: '🌟 Perfect - Green, thick, no issues' },
                    { value: 'good', label: '✅ Good - Mostly green with minor issues' },
                    { value: 'fair', label: '⚠️ Fair - Patchy, some weeds or bare spots' },
                    { value: 'poor', label: '🆘 Poor - Lots of weeds, bare patches, thin' },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="condition"
                        value={opt.value}
                        checked={formData.currentCondition === opt.value}
                        onChange={(e) => handleInputChange('currentCondition', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Issues */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">What issues are you experiencing? (select all that apply)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'weeds', label: '🚫 Lots of weeds' },
                    { value: 'bare_spots', label: '⬜ Bare spots' },
                    { value: 'thin', label: '📉 Thin/sparse grass' },
                    { value: 'compaction', label: '🪨 Hard, compacted soil' },
                    { value: 'moss', label: '🟢 Moss' },
                    { value: 'thatch', label: '🟤 Thatch buildup' },
                  ].map((issue) => (
                    <button
                      key={issue.value}
                      type="button"
                      onClick={() => handleIssueToggle(issue.value)}
                      className={`p-3 rounded-lg border-2 transition font-medium text-left ${
                        formData.issues.includes(issue.value)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-700 hover:border-green-300'
                      }`}
                    >
                      {issue.label}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>

            {/* Budget & Preferences */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-bold text-gray-900 mb-4">Your Preferences</legend>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Service Level *</label>
                <div className="space-y-3">
                  {[
                    { value: 'basic', label: '💰 Basic', desc: 'Weekly mowing + essentials' },
                    { value: 'standard', label: '⭐ Standard', desc: 'Mowing + fertilization + seasonal care' },
                    { value: 'premium', label: '👑 Premium', desc: 'Full suite including aeration, treatment, design' },
                  ].map((opt) => (
                    <label key={opt.value} className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      formData.serviceLevel === opt.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}>
                      <input
                        type="radio"
                        name="serviceLevel"
                        value={opt.value}
                        checked={formData.serviceLevel === opt.value}
                        onChange={(e) => handleInputChange('serviceLevel', e.target.value)}
                        className="w-4 h-4 mr-3"
                      />
                      <span className="font-semibold text-gray-900">{opt.label}</span>
                      <p className="text-sm text-gray-600 mt-1">{opt.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              <input
                type="text"
                placeholder="Best day/time to schedule (optional)"
                value={formData.availability}
                onChange={(e) => handleInputChange('availability', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </fieldset>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Creating Your Plan...' : 'See Your Personalized Plan →'}
              </button>
            </div>
          </form>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Recommended Lawn Care Plan</h2>
              <p className="text-gray-600 mb-6">
                Based on your property details, here's what we recommend to get your lawn thriving:
              </p>

              {/* Estimated Cost */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                <p className="text-sm text-green-700 font-semibold mb-2">ESTIMATED MONTHLY INVESTMENT</p>
                <p className="text-4xl font-bold text-green-700">${estimatedCost.toFixed(0)}/month</p>
                <p className="text-sm text-green-600 mt-2">*Exact pricing varies by service selections and market area</p>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                {recommendations.map((rec, i) => (
                  <div key={i} className={`p-5 rounded-lg border-l-4 ${
                    rec.priority === 'critical' ? 'border-l-red-500 bg-red-50' :
                    rec.priority === 'high' ? 'border-l-orange-500 bg-orange-50' :
                    rec.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900">{rec.name}</h3>
                      <span className="text-sm font-semibold text-gray-600">${rec.estimatedCost}/visit</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                    <p className="text-xs text-gray-500">
                      <strong>Timing:</strong> {rec.frequency}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What's Next?</h3>
              <p className="text-gray-600 mb-6">
                We've received your information and created a custom plan. Our team will review your property details and reach out within 24 hours to:
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Confirm the recommended services</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Schedule your first appointment</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Answer any questions about your lawn</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Lock in your custom pricing</span>
                </li>
              </ul>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-900">
                  <strong>Confirmation sent to:</strong> {formData.customerEmail}
                </p>
              </div>

              <Link
                href="/"
                className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition text-center block"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
