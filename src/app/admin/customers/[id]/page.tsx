'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadJobPhotos } from '@/lib/photos'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const PHOTO_CATEGORIES = [
  { id: 'property', label: 'Property', emoji: '🏡' },
  { id: 'before', label: 'Before', emoji: '📷' },
  { id: 'after', label: 'After', emoji: '✨' },
  { id: 'reference', label: 'Reference / Goal', emoji: '🎯' },
  { id: 'issue', label: 'Issue / Problem', emoji: '⚠️' },
]

export default function CustomerDetail() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Property details editing
  const [savingProperty, setSavingProperty] = useState(false)
  const [property, setProperty] = useState({
    property_type: 'residential',
    lot_size: '',
    lawn_area_sqft: '',
    property_notes: '',
    address: '',
  })

  // Photo upload
  const [uploading, setUploading] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('property')
  const [uploadCaption, setUploadCaption] = useState('')
  const [photoFilter, setPhotoFilter] = useState('all')

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
    const [{ data: cust }, { data: photoRows }, { data: jobRows }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', customerId).maybeSingle(),
      supabase.from('property_photos').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('jobs').select('*').eq('customer_id', customerId).order('scheduled_date', { ascending: false }),
    ])

    setCustomer(cust)
    if (cust) {
      setProperty({
        property_type: cust.property_type || 'residential',
        lot_size: cust.lot_size || '',
        lawn_area_sqft: cust.lawn_area_sqft?.toString() || '',
        property_notes: cust.property_notes || '',
        address: cust.address || '',
      })
    }
    setPhotos(photoRows || [])
    setJobs(jobRows || [])
  }

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProperty(true)
    setError(null)
    setNotice(null)
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          property_type: property.property_type,
          lot_size: property.lot_size || null,
          lawn_area_sqft: property.lawn_area_sqft ? parseInt(property.lawn_area_sqft) : null,
          property_notes: property.property_notes || null,
          address: property.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId)

      if (updateError) throw updateError
      setNotice('Property details saved')
      await fetchAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to save property details')
    } finally {
      setSavingProperty(false)
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

  const filteredPhotos = photoFilter === 'all' ? photos : photos.filter((p) => p.category === photoFilter)

  const categoryBadge = (category: string) => {
    const cat = PHOTO_CATEGORIES.find((c) => c.id === category)
    return cat ? `${cat.emoji} ${cat.label}` : category
  }

  const statusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      scheduled: 'bg-blue-50 text-blue-700',
      confirmed: 'bg-cyan-50 text-cyan-700',
      'in-progress': 'bg-yellow-50 text-yellow-700',
      completed: 'bg-green-50 text-green-700',
      paid: 'bg-purple-50 text-purple-700',
    }
    return colors[status] || 'bg-gray-50 text-gray-700'
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Customer not found</p>
        <Link href="/admin/customers" className="text-green-600 hover:text-green-700 font-medium">
          Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🏡 {customer.name}</h1>
          <Link href="/admin/customers" className="text-blue-600 hover:text-blue-700">
            All Customers
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {notice && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
            ✅ {notice}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Something went wrong</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3 text-sm">
              {customer.phone && (
                <p className="text-gray-700">
                  <span className="text-gray-500">Phone:</span> {customer.phone}
                </p>
              )}
              {customer.email && (
                <p className="text-gray-700">
                  <span className="text-gray-500">Email:</span> {customer.email}
                </p>
              )}
              <p className="text-gray-700">
                <span className="text-gray-500">Preferred contact:</span>{' '}
                <span className="uppercase">{customer.preferred_contact || 'sms'}</span>
              </p>
              {customer.notes && (
                <div>
                  <p className="text-gray-500 mb-1">Notes:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Property details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Property Details</h2>
            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Property Type</label>
                  <select
                    value={property.property_type}
                    onChange={(e) => setProperty({ ...property, property_type: e.target.value })}
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
                    value={property.lot_size}
                    onChange={(e) => setProperty({ ...property, lot_size: e.target.value })}
                    placeholder={'e.g. 0.5 acre or 100x150 ft'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Lawn / Turf Area (sq ft)</label>
                  <input
                    type="number"
                    value={property.lawn_area_sqft}
                    onChange={(e) => setProperty({ ...property, lawn_area_sqft: e.target.value })}
                    placeholder="e.g. 8000"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Address</label>
                  <input
                    type="text"
                    value={property.address}
                    onChange={(e) => setProperty({ ...property, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Property Notes (access, gates, pets, irrigation, slopes, problem areas...)
                </label>
                <textarea
                  value={property.property_notes}
                  onChange={(e) => setProperty({ ...property, property_notes: e.target.value })}
                  rows={3}
                  placeholder="Gate code 1234, dog in backyard, sprinkler heads along east fence..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingProperty}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {savingProperty ? 'Saving...' : 'Save Property Details'}
              </button>
            </form>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              📸 Property Photos <span className="text-gray-400 font-normal">({photos.length})</span>
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

          {/* Category filter */}
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
              <p>No photos yet — upload photos of the property, before/after shots, or reference images of the desired result.</p>
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

        {/* Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">🗓️ Jobs ({jobs.length})</h2>
            <Link
              href="/admin/jobs/new"
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm"
            >
              + New Job
            </Link>
          </div>
          {jobs.length === 0 ? (
            <p className="text-gray-500">No jobs for this customer yet.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {job.scheduled_date} at {job.start_time?.slice(0, 5)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {job.estimated_duration} min · ${job.price}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  {job.key_aspects?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Key Aspects</p>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-0.5">
                        {job.key_aspects.map((aspect: string, i: number) => (
                          <li key={i}>{aspect}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.completion_criteria && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        What done looks like
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.completion_criteria}</p>
                    </div>
                  )}
                  {job.notes && (
                    <p className="text-sm text-gray-500 mt-2">{job.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
