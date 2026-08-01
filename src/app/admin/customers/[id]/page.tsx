'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { updateCustomer, deleteCustomer } from '@/lib/customers'
import { getProperties, createProperty } from '@/lib/properties'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function CustomerDetail() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [stepCounts, setStepCounts] = useState<{ [propertyId: string]: number }>({})
  const [photoCounts, setPhotoCounts] = useState<{ [propertyId: string]: number }>({})
  const [jobs, setJobs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Contact editing
  const [editingContact, setEditingContact] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
    preferred_contact: 'sms',
    notes: '',
  })

  // Add property
  const [addingProperty, setAddingProperty] = useState(false)
  const [savingProperty, setSavingProperty] = useState(false)
  const [propertyForm, setPropertyForm] = useState({ label: '', address: '' })

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
    const [{ data: cust }, props, { data: jobRows }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', customerId).maybeSingle(),
      getProperties(customerId).catch(() => []),
      supabase.from('jobs').select('*').eq('customer_id', customerId).order('scheduled_date', { ascending: false }),
    ])

    setCustomer(cust)
    if (cust) {
      setContact({
        name: cust.name || '',
        email: cust.email || '',
        phone: cust.phone || '',
        preferred_contact: cust.preferred_contact || 'sms',
        notes: cust.notes || '',
      })
    }
    setProperties(props)
    setJobs(jobRows || [])

    // Step and photo counts per property, shown on the cards
    if (props.length > 0) {
      const ids = props.map((p: any) => p.id)
      const [{ data: stepRows }, { data: photoRows }] = await Promise.all([
        supabase.from('workflow_steps').select('property_id').in('property_id', ids),
        supabase.from('property_photos').select('property_id').in('property_id', ids),
      ])
      const sCounts: { [id: string]: number } = {}
      const pCounts: { [id: string]: number } = {}
      for (const row of stepRows || []) {
        if (row.property_id) sCounts[row.property_id] = (sCounts[row.property_id] || 0) + 1
      }
      for (const row of photoRows || []) {
        if (row.property_id) pCounts[row.property_id] = (pCounts[row.property_id] || 0) + 1
      }
      setStepCounts(sCounts)
      setPhotoCounts(pCounts)
    }
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingContact(true)
    setError(null)
    setNotice(null)
    try {
      await updateCustomer(customerId, {
        name: contact.name.trim(),
        email: contact.email.trim() || null,
        phone: contact.phone.trim() || null,
        preferred_contact: contact.preferred_contact as 'sms' | 'email' | 'call',
        notes: contact.notes.trim() || null,
      })
      setNotice('Contact info saved')
      setEditingContact(false)
      await fetchAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to save contact info')
    } finally {
      setSavingContact(false)
    }
  }

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProperty(true)
    setError(null)
    try {
      const created = await createProperty({
        customer_id: customerId,
        label: propertyForm.label.trim() || `Property ${properties.length + 1}`,
        address: propertyForm.address.trim(),
      })
      setPropertyForm({ label: '', address: '' })
      setAddingProperty(false)
      router.push(`/admin/customers/${customerId}/properties/${created.id}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to add property')
      setSavingProperty(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!confirm(`Delete ${customer.name}? This removes their properties, photos, and workflows. This cannot be undone.`)) {
      return
    }
    setDeleting(true)
    setError(null)
    try {
      await deleteCustomer(customerId)
      router.push('/admin/customers')
    } catch (err: any) {
      setError(err?.message || 'Failed to delete customer')
      setDeleting(false)
    }
  }

  const propertyLabel = (propertyId: string | null) =>
    properties.find((p) => p.id === propertyId)?.label

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
          <h1 className="text-2xl font-bold text-green-600">👤 {customer.name}</h1>
          <Link href="/admin/customers" className="text-blue-600 hover:text-blue-700">
            All Customers
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Contact</h2>
              <button
                onClick={() => setEditingContact(!editingContact)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {editingContact ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>

            {editingContact ? (
              <form onSubmit={handleSaveContact} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Name *</label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Preferred Contact</label>
                  <select
                    value={contact.preferred_contact}
                    onChange={(e) => setContact({ ...contact, preferred_contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="sms">SMS Text Message</option>
                    <option value="email">Email</option>
                    <option value="call">Phone Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
                  <textarea
                    value={contact.notes}
                    onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {savingContact ? 'Saving...' : 'Save Contact'}
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-sm">
                {customer.phone && (
                  <p className="text-gray-700">
                    <span className="text-gray-500">Phone:</span>{' '}
                    <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-700">
                      {customer.phone}
                    </a>
                  </p>
                )}
                {customer.email && (
                  <p className="text-gray-700">
                    <span className="text-gray-500">Email:</span>{' '}
                    <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-700">
                      {customer.email}
                    </a>
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
            )}
          </div>

          {/* Properties */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                🏡 Properties <span className="text-gray-400 font-normal">({properties.length})</span>
              </h2>
              <button
                onClick={() => setAddingProperty(!addingProperty)}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm"
              >
                {addingProperty ? 'Cancel' : '+ Add Property'}
              </button>
            </div>

            {addingProperty && (
              <form onSubmit={handleAddProperty} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Label</label>
                    <input
                      type="text"
                      value={propertyForm.label}
                      onChange={(e) => setPropertyForm({ ...propertyForm, label: e.target.value })}
                      placeholder={'e.g. Home, Rental on Oak St'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Address *</label>
                    <input
                      type="text"
                      value={propertyForm.address}
                      onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                      placeholder="Street address, city, state, zip"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingProperty}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {savingProperty ? 'Adding...' : 'Add & Set Up Property'}
                </button>
              </form>
            )}

            {properties.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No properties yet — add the first one to set up its details, photos, and workflow.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/admin/customers/${customerId}/properties/${property.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900">{property.label}</h3>
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full capitalize">
                        {property.property_type || 'residential'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">📍 {property.address}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                        📋 {stepCounts[property.id] || 0} workflow steps
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                        📸 {photoCounts[property.id] || 0} photos
                      </span>
                      {property.lot_size && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">🌿 {property.lot_size}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
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
                        {propertyLabel(job.property_id) && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                            🏡 {propertyLabel(job.property_id)}
                          </span>
                        )}
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
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">What done looks like</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.completion_criteria}</p>
                    </div>
                  )}
                  {job.notes && <p className="text-sm text-gray-500 mt-2">{job.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Deleting a customer permanently removes their profile, properties, photos, and workflows.
            Customers with jobs on record can't be deleted — that history belongs to your business records.
          </p>
          <button
            onClick={handleDeleteCustomer}
            disabled={deleting}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            {deleting ? 'Deleting...' : '🗑 Delete Customer'}
          </button>
        </div>
      </main>
    </div>
  )
}
