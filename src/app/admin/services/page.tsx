'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getOrCreateCompanyId } from '@/lib/profile'
import {
  getServices,
  createService,
  updateService,
  deleteService,
  SERVICE_CATEGORIES,
  FREQUENCIES,
  SEASONS,
  Service,
} from '@/lib/services'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const emptyForm = {
  name: '',
  type: 'mowing',
  description: '',
  base_price: '',
  frequency: 'one-time',
  seasons: [] as string[],
}

export default function ServicesAndPricing() {
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchServices()
      setLoading(false)
    }
    init()
  }, [])

  const fetchServices = async () => {
    try {
      setServices(await getServices())
    } catch (err: any) {
      setError(err?.message || 'Failed to load services')
    }
  }

  const startAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setNotice(null)
    setError(null)
  }

  const startEdit = (service: any) => {
    setEditingId(service.id)
    setForm({
      name: service.name || '',
      type: service.type || 'other',
      description: service.description || '',
      base_price: service.base_price?.toString() || '',
      frequency: service.frequency || 'one-time',
      seasons: service.seasonal_availability || [],
    })
    setShowForm(true)
    setNotice(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSeason = (season: string) => {
    setForm((prev) => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter((s) => s !== season)
        : [...prev.seasons, season],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(form.base_price)
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || null,
        base_price: price,
        frequency: form.frequency as Service['frequency'],
        seasonal_availability: form.seasons.length > 0 ? form.seasons : null,
      }

      if (editingId) {
        await updateService(editingId, payload)
        setNotice('Service updated')
      } else {
        const companyId = await getOrCreateCompanyId()
        await createService({ ...payload, company_id: companyId })
        setNotice('Service added')
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await fetchServices()
    } catch (err: any) {
      setError(err?.message || 'Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (service: any) => {
    if (!confirm(`Delete "${service.name}"? Existing jobs keep their history.`)) return
    setError(null)
    try {
      await deleteService(service.id)
      setServices((prev) => prev.filter((s) => s.id !== service.id))
    } catch (err: any) {
      setError(err?.message || 'Failed to delete service')
    }
  }

  const categoryLabel = (type: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === type)?.label || type

  const frequencyLabel = (freq: string) =>
    FREQUENCIES.find((f) => f.id === freq)?.label || freq

  // Group by category for display
  const grouped: { [type: string]: any[] } = {}
  for (const s of services) {
    const key = s.type || 'other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">💲 Services & Pricing</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {notice && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">✅ {notice}</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Something went wrong</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-gray-600 text-sm max-w-lg">
            Your service catalog. These appear when creating a job, and their prices add up to the job's
            suggested price automatically.
          </p>
          <button
            onClick={showForm && !editingId ? () => setShowForm(false) : startAdd}
            className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            {showForm && !editingId ? 'Cancel' : '+ Add Service'}
          </button>
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-900">{editingId ? 'Edit Service' : 'New Service'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Service Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={'e.g. Weekly Mowing — up to 1/4 acre'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Category</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Price ($) *</label>
                <input
                  type="number"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                  placeholder="65.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Billing Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="What's included, size limits, what affects the price..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Seasonal Availability <span className="text-gray-400">(leave empty for year-round)</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {SEASONS.map((season) => (
                  <label key={season} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.seasons.includes(season)}
                      onChange={() => toggleSeason(season)}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">{season}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Service'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Service list grouped by category */}
        {services.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">💲</p>
            <p className="text-gray-600 mb-4">
              No services yet. Add the services you offer with their prices — they'll show up when you
              create jobs.
            </p>
            <button
              onClick={startAdd}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Add Your First Service
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">{categoryLabel(type)}</h3>
              <div className="divide-y divide-gray-100">
                {items.map((service) => (
                  <div key={service.id} className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-0.5">{service.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {frequencyLabel(service.frequency)}
                        </span>
                        {(service.seasonal_availability?.length ? service.seasonal_availability : ['year-round']).map(
                          (s: string) => (
                            <span key={s} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full capitalize">
                              {s}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-xl font-bold text-green-600">
                        ${Number(service.base_price).toFixed(2)}
                      </p>
                      <button
                        onClick={() => startEdit(service)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
