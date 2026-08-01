'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadJobPhotos } from '@/lib/photos'
import { getProperty, updateProperty, deleteProperty } from '@/lib/properties'
import { getServicePlan, upsertServicePlan, deleteServicePlan } from '@/lib/servicePlans'
import { getServices } from '@/lib/services'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const PHOTO_CATEGORIES = [
  { id: 'property', label: 'Property', emoji: '🏡' },
  { id: 'before', label: 'Before', emoji: '📷' },
  { id: 'after', label: 'After', emoji: '✨' },
  { id: 'reference', label: 'Reference / Goal', emoji: '🎯' },
  { id: 'issue', label: 'Issue / Problem', emoji: '⚠️' },
]

export default function PropertyDetail() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  const propertyId = params.propertyId as string

  const [loading, setLoading] = useState(true)
  const [property, setProperty] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [savingDetails, setSavingDetails] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [details, setDetails] = useState({
    label: '',
    address: '',
    property_type: 'residential',
    lot_size: '',
    lawn_area_sqft: '',
    property_notes: '',
  })

  const [uploading, setUploading] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('property')
  const [uploadCaption, setUploadCaption] = useState('')
  const [photoFilter, setPhotoFilter] = useState('all')

  const [steps, setSteps] = useState<any[]>([])
  const [savingStep, setSavingStep] = useState(false)
  const [stepForm, setStepForm] = useState({
    title: '',
    area: '',
    instructions: '',
    estimated_minutes: '',
    requires_photo: false,
  })

  // Service plan
  const [plan, setPlan] = useState<any>(null)
  const [catalog, setCatalog] = useState<any[]>([])
  const [savingPlan, setSavingPlan] = useState(false)
  const [planForm, setPlanForm] = useState({
    active: true,
    interval_days: '7',
    override_price: '',
    service_ids: [] as string[],
    preferred_time: '09:00',
    estimated_duration: '60',
    season_start: '',
    season_end: '',
    notes: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchAll()
      setLoading(false)
    }
    init()
  }, [])

  const fetchAll = async () => {
    const [prop, { data: cust }, { data: photoRows }, { data: stepRows }, planRow, services] = await Promise.all([
      getProperty(propertyId),
      supabase.from('customers').select('id, name').eq('id', customerId).maybeSingle(),
      supabase.from('property_photos').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }),
      supabase.from('workflow_steps').select('*').eq('property_id', propertyId).order('step_order', { ascending: true }),
      getServicePlan(propertyId).catch(() => null),
      getServices().catch(() => []),
    ])

    setProperty(prop)
    setCustomer(cust)
    if (prop) {
      setDetails({
        label: prop.label || '',
        address: prop.address || '',
        property_type: prop.property_type || 'residential',
        lot_size: prop.lot_size || '',
        lawn_area_sqft: prop.lawn_area_sqft?.toString() || '',
        property_notes: prop.property_notes || '',
      })
    }
    setPhotos(photoRows || [])
    setSteps(stepRows || [])
    setCatalog(services)
    setPlan(planRow)
    if (planRow) {
      setPlanForm({
        active: planRow.active ?? true,
        interval_days: planRow.interval_days?.toString() || '7',
        override_price: planRow.override_price?.toString() || '',
        service_ids: planRow.service_ids || [],
        preferred_time: planRow.preferred_time?.slice(0, 5) || '09:00',
        estimated_duration: planRow.estimated_duration?.toString() || '60',
        season_start: planRow.season_start || '',
        season_end: planRow.season_end || '',
        notes: planRow.notes || '',
      })
    }
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPlan(true)
    setError(null)
    setNotice(null)
    try {
      await upsertServicePlan({
        customer_id: customerId,
        property_id: propertyId,
        active: planForm.active,
        interval_days: parseInt(planForm.interval_days) || 7,
        override_price: planForm.override_price ? parseFloat(planForm.override_price) : null,
        service_ids: planForm.service_ids,
        preferred_time: planForm.preferred_time || '09:00',
        estimated_duration: parseInt(planForm.estimated_duration) || 60,
        season_start: planForm.season_start || null,
        season_end: planForm.season_end || null,
        notes: planForm.notes.trim() || null,
      })
      setNotice('Service plan saved — the next visit will be scheduled automatically when a job here is completed')
      await fetchAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to save service plan')
    } finally {
      setSavingPlan(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!plan?.id || !confirm('Remove this service plan? Auto-scheduling stops for this property.')) return
    setError(null)
    try {
      await deleteServicePlan(plan.id)
      setPlan(null)
      setPlanForm({
        active: true,
        interval_days: '7',
        override_price: '',
        service_ids: [],
        preferred_time: '09:00',
        estimated_duration: '60',
        season_start: '',
        season_end: '',
        notes: '',
      })
      setNotice('Service plan removed')
    } catch (err: any) {
      setError(err?.message || 'Failed to remove service plan')
    }
  }

  const togglePlanService = (serviceId: string) => {
    setPlanForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }))
  }

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingDetails(true)
    setError(null)
    setNotice(null)
    try {
      await updateProperty(propertyId, {
        label: details.label.trim() || 'Primary',
        address: details.address.trim(),
        property_type: details.property_type,
        lot_size: details.lot_size || null,
        lawn_area_sqft: details.lawn_area_sqft ? parseInt(details.lawn_area_sqft) : null,
        property_notes: details.property_notes || null,
      })
      setNotice('Property details saved')
      await fetchAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to save property details')
    } finally {
      setSavingDetails(false)
    }
  }

  const handleDeleteProperty = async () => {
    if (!confirm(`Delete "${property.label}"? Its photos and workflow will be removed. Jobs keep their history.`)) {
      return
    }
    setDeleting(true)
    setError(null)
    try {
      await deleteProperty(propertyId, customerId)
      router.push(`/admin/customers/${customerId}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to delete property')
      setDeleting(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    setNotice(null)
    try {
      await uploadJobPhotos(
        customerId,
        propertyId,
        null,
        Array.from(files),
        uploadCategory as 'property' | 'before' | 'after' | 'reference' | 'issue',
        uploadCaption
      )
      setUploadCaption('')
      setNotice(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded`)
      await fetchAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeletePhoto = async (photo: any) => {
    if (!confirm('Delete this photo?')) return
    setError(null)
    try {
      await supabase.storage.from('property-photos').remove([photo.storage_path])
      const { error: deleteError } = await supabase.from('property_photos').delete().eq('id', photo.id)
      if (deleteError) throw deleteError
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch (err: any) {
      setError(err?.message || 'Failed to delete photo')
    }
  }

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stepForm.title.trim()) return
    setSavingStep(true)
    setError(null)
    try {
      const { error: insertError } = await supabase.from('workflow_steps').insert([
        {
          customer_id: customerId,
          property_id: propertyId,
          step_order: steps.length,
          title: stepForm.title.trim(),
          area: stepForm.area.trim() || null,
          instructions: stepForm.instructions.trim() || null,
          estimated_minutes: stepForm.estimated_minutes ? parseInt(stepForm.estimated_minutes) : null,
          requires_photo: stepForm.requires_photo,
        },
      ])
      if (insertError) throw insertError
      setStepForm({ title: '', area: '', instructions: '', estimated_minutes: '', requires_photo: false })
      await fetchAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to add step')
    } finally {
      setSavingStep(false)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Remove this step from the workflow?')) return
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('workflow_steps').delete().eq('id', stepId)
      if (deleteError) throw deleteError
      const remaining = steps.filter((s) => s.id !== stepId)
      await Promise.all(
        remaining.map((s, i) => supabase.from('workflow_steps').update({ step_order: i }).eq('id', s.id))
      )
      await fetchAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to remove step')
    }
  }

  const handleMoveStep = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= steps.length) return
    setError(null)
    try {
      const a = steps[index]
      const b = steps[target]
      await Promise.all([
        supabase.from('workflow_steps').update({ step_order: target }).eq('id', a.id),
        supabase.from('workflow_steps').update({ step_order: index }).eq('id', b.id),
      ])
      await fetchAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to reorder steps')
    }
  }

  const filteredPhotos = photoFilter === 'all' ? photos : photos.filter((p) => p.category === photoFilter)

  const categoryBadge = (category: string) => {
    const cat = PHOTO_CATEGORIES.find((c) => c.id === category)
    return cat ? `${cat.emoji} ${cat.label}` : category
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Property not found</p>
        <Link href={`/admin/customers/${customerId}`} className="text-green-600 hover:text-green-700 font-medium">
          Back to Customer
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-600">🏡 {property.label}</h1>
            <p className="text-sm text-gray-500">{customer?.name}</p>
          </div>
          <Link href={`/admin/customers/${customerId}`} className="text-blue-600 hover:text-blue-700">
            Back to Customer
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {notice && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">✅ {notice}</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Something went wrong</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Property details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Property Details</h2>
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Property Name / Label</label>
                <input
                  type="text"
                  value={details.label}
                  onChange={(e) => setDetails({ ...details, label: e.target.value })}
                  placeholder={'e.g. Home, Rental on Oak St, Office'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Address</label>
                <input
                  type="text"
                  value={details.address}
                  onChange={(e) => setDetails({ ...details, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Property Type</label>
                <select
                  value={details.property_type}
                  onChange={(e) => setDetails({ ...details, property_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="hoa">HOA / Community</option>
                  <option value="municipal">Municipal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Lot Size</label>
                <input
                  type="text"
                  value={details.lot_size}
                  onChange={(e) => setDetails({ ...details, lot_size: e.target.value })}
                  placeholder={'e.g. 0.5 acre or 100x150 ft'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Lawn / Turf Area (sq ft)</label>
                <input
                  type="number"
                  value={details.lawn_area_sqft}
                  onChange={(e) => setDetails({ ...details, lawn_area_sqft: e.target.value })}
                  placeholder="e.g. 8000"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Property Notes (access, gates, pets, irrigation, slopes, problem areas...)
              </label>
              <textarea
                value={details.property_notes}
                onChange={(e) => setDetails({ ...details, property_notes: e.target.value })}
                rows={3}
                placeholder="Gate code 1234, dog in backyard, sprinkler heads along east fence..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingDetails}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            >
              {savingDetails ? 'Saving...' : 'Save Property Details'}
            </button>
          </form>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              📸 Photos <span className="text-gray-400 font-normal">({photos.length})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                {PHOTO_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
              <label className={`px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer transition ${uploading ? 'bg-gray-300 text-gray-600' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                {uploading ? 'Uploading...' : '⬆ Upload Photos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setPhotoFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition ${photoFilter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All ({photos.length})
            </button>
            {PHOTO_CATEGORIES.map((c) => {
              const count = photos.filter((p) => p.category === c.id).length
              if (!count) return null
              return (
                <button
                  key={c.id}
                  onClick={() => setPhotoFilter(c.id)}
                  className={`px-3 py-1 rounded-full text-sm transition ${photoFilter === c.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {c.emoji} {c.label} ({count})
                </button>
              )
            })}
          </div>

          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-2">🖼️</p>
              <p>No photos yet — upload photos of this property, before/after shots, or reference images of the desired result.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-gray-200">
                  <a href={photo.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Property photo'}
                      className="w-full h-40 object-cover"
                    />
                  </a>
                  <div className="p-2 bg-white">
                    <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                      {categoryBadge(photo.category)}
                    </span>
                    {photo.caption && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{photo.caption}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(photo)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 opacity-0 group-hover:opacity-100 transition text-sm"
                    title="Delete photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            📋 Workflow for this Property <span className="text-gray-400 font-normal">({steps.length} steps)</span>
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The step-by-step routine for this property. The crew sees these as work instructions on every job here, in this order.
          </p>

          {steps.length > 0 && (
            <ol className="space-y-3 mb-8">
              {steps.map((step, index) => (
                <li key={step.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{step.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {step.area && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                              📍 {step.area}
                            </span>
                          )}
                          {step.estimated_minutes && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                              ⏱ ~{step.estimated_minutes} min
                            </span>
                          )}
                          {step.requires_photo && (
                            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                              📷 Photo required
                            </span>
                          )}
                        </div>
                        {step.instructions && (
                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{step.instructions}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleMoveStep(index, -1)}
                        disabled={index === 0}
                        className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 text-sm"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveStep(index, 1)}
                        disabled={index === steps.length - 1}
                        className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 text-sm"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="w-7 h-7 rounded bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                        title="Remove step"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <form onSubmit={handleAddStep} className="border-t border-gray-200 pt-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Add a Step</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-1">Step Title *</label>
                <input
                  type="text"
                  value={stepForm.title}
                  onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                  placeholder={'e.g. "Mow front and side lawns"'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Area / Zone</label>
                <input
                  type="text"
                  value={stepForm.area}
                  onChange={(e) => setStepForm({ ...stepForm, area: e.target.value })}
                  placeholder="e.g. Front yard"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Detailed Instructions</label>
              <textarea
                value={stepForm.instructions}
                onChange={(e) => setStepForm({ ...stepForm, instructions: e.target.value })}
                rows={3}
                placeholder="Exactly how this step should be done at THIS property — mower height 3in, bag clippings, avoid sprinkler heads along east fence, stripe pattern toward street..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Est. Minutes</label>
                <input
                  type="number"
                  value={stepForm.estimated_minutes}
                  onChange={(e) => setStepForm({ ...stepForm, estimated_minutes: e.target.value })}
                  min="1"
                  placeholder="15"
                  className="w-28 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stepForm.requires_photo}
                  onChange={(e) => setStepForm({ ...stepForm, requires_photo: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">Crew must take a photo of this step</span>
              </label>
              <button
                type="submit"
                disabled={savingStep}
                className="mt-5 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {savingStep ? 'Adding...' : '+ Add Step'}
              </button>
            </div>
          </form>
        </div>

        {/* Service Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-gray-900">
              🔁 Recurring Service Plan
              {plan && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {plan.active ? 'Active' : 'Paused'}
                </span>
              )}
            </h2>
            {plan && (
              <button onClick={handleDeletePlan} className="text-sm text-red-600 hover:text-red-700">
                Remove plan
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">
            When a job at this property is completed, the next visit is created automatically — the
            interval below counts from the day the last job finished, at the special rate you set here.
          </p>

          <form onSubmit={handleSavePlan} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Days Until Next Visit *
                </label>
                <input
                  type="number"
                  value={planForm.interval_days}
                  onChange={(e) => setPlanForm({ ...planForm, interval_days: e.target.value })}
                  min="1"
                  max="365"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Counted from job completion day</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Special Rate per Visit ($)
                </label>
                <input
                  type="number"
                  value={planForm.override_price}
                  onChange={(e) => setPlanForm({ ...planForm, override_price: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="Overrides catalog prices"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Preferred Start Time</label>
                <input
                  type="time"
                  value={planForm.preferred_time}
                  onChange={(e) => setPlanForm({ ...planForm, preferred_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Est. Duration (min)</label>
                <input
                  type="number"
                  value={planForm.estimated_duration}
                  onChange={(e) => setPlanForm({ ...planForm, estimated_duration: e.target.value })}
                  min="15"
                  step="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Season Start <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={planForm.season_start}
                  onChange={(e) => setPlanForm({ ...planForm, season_start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Season End <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={planForm.season_end}
                  onChange={(e) => setPlanForm({ ...planForm, season_end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Season repeats every year (month/day). A visit that would land outside the season isn't
              created — auto-scheduling resumes when a job is completed in season.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Services Each Visit</label>
              {catalog.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  No services in your catalog yet —{' '}
                  <Link href="/admin/services" className="font-semibold underline">
                    set up Services &amp; Pricing
                  </Link>{' '}
                  first.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catalog.map((service) => (
                    <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.service_ids.includes(service.id)}
                        onChange={() => togglePlanService(service.id)}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {service.name} — ${Number(service.base_price).toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Plan Notes</label>
              <textarea
                value={planForm.notes}
                onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                rows={2}
                placeholder="Anything special about this arrangement..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.active}
                  onChange={(e) => setPlanForm({ ...planForm, active: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">Plan active (auto-schedule next visits)</span>
              </label>
              <button
                type="submit"
                disabled={savingPlan}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {savingPlan ? 'Saving...' : plan ? 'Save Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Deleting this property removes its photos and workflow. Past jobs keep their history. A
            customer's last remaining property can't be deleted.
          </p>
          <button
            onClick={handleDeleteProperty}
            disabled={deleting}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            {deleting ? 'Deleting...' : '🗑 Delete Property'}
          </button>
        </div>
      </main>
    </div>
  )
}
