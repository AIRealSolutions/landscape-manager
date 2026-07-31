'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getLead, updateLead, addLeadInteraction, createLeadQuote } from '@/lib/leads'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function LeadDetail() {
  const router = useRouter()
  const params = useParams()
  const leadId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lead, setLead] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [showInteractionForm, setShowInteractionForm] = useState(false)
  const [showQuoteForm, setShowQuoteForm] = useState(false)

  const [interactionData, setInteractionData] = useState({
    type: 'call',
    subject: '',
    notes: '',
  })

  const [quoteData, setQuoteData] = useState({
    services: [] as string[],
    estimatedCost: '',
    validDays: 30,
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      setUser(session.user)
      await fetchLead()
      setLoading(false)
    }

    checkAuth()
  }, [leadId])

  const fetchLead = async () => {
    try {
      const leadData = await getLead(leadId)
      setLead(leadData)
    } catch (error) {
      console.error('Error fetching lead:', error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      await updateLead(leadId, { status: newStatus })
      setLead({ ...lead, status: newStatus })
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const interactionWithUser = {
        ...interactionData,
        interaction_type: interactionData.type,
        lead_id: leadId,
        user_id: user.id,
      }

      await addLeadInteraction(interactionWithUser)
      setInteractionData({ type: 'call', subject: '', notes: '' })
      setShowInteractionForm(false)
      await fetchLead()
    } catch (error) {
      console.error('Error adding interaction:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      if (!quoteData.services.length) {
        alert('Please select at least one service')
        setUpdating(false)
        return
      }

      const cost = parseFloat(quoteData.estimatedCost)
      if (!cost || cost <= 0) {
        alert('Please enter a valid cost')
        setUpdating(false)
        return
      }

      await createLeadQuote(leadId, quoteData.services, cost, quoteData.validDays)
      setQuoteData({ services: [], estimatedCost: '', validDays: 30 })
      setShowQuoteForm(false)
      await fetchLead()
    } catch (error) {
      console.error('Error creating quote:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleConvertToCustomer = async () => {
    if (!confirm('Convert this lead to a customer? This will create a new customer record.')) {
      return
    }

    setUpdating(true)
    try {
      // Create customer record
      const { data: customerData } = await supabase
        .from('customers')
        .insert([
          {
            company_id: lead.company_id,
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            phone: lead.phone,
            address: lead.address,
            property_size: lead.property_size,
            communication_preference: 'sms',
          },
        ])
        .select()
        .single()

      if (customerData?.id) {
        // Update lead to mark as won
        await updateLead(leadId, {
          status: 'won',
          converted_to_customer_id: customerData.id,
        })

        setLead({
          ...lead,
          status: 'won',
          converted_to_customer_id: customerData.id,
        })

        alert(`Lead converted to customer! Customer ID: ${customerData.id}`)
      }
    } catch (error) {
      console.error('Error converting lead:', error)
      alert('Failed to convert lead to customer')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      contacted: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      quoted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      negotiating: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      won: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return colors[status] || 'bg-gray-100'
  }

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/admin/leads" className="text-blue-600 hover:text-blue-700">
              ← Back to Leads
            </Link>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600">
          Lead not found
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/admin/leads" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Leads
          </Link>
          <div className="space-x-4">
            <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
              Dashboard
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lead Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {lead.first_name} {lead.last_name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{lead.phone}</p>
              {lead.email && <p className="text-gray-600 dark:text-gray-400">{lead.email}</p>}
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lead Score</p>
              <p className="text-2xl font-bold text-blue-600">{lead.lead_score}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lead Source</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {lead.lead_source}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Property Size</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {lead.property_size || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Est. Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${(lead.estimated_value || 0).toFixed(0)}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Address</p>
            <p className="text-gray-900 dark:text-white mb-4">{lead.address || 'Not provided'}</p>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Services Interested</p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(lead.service_interested) && lead.service_interested.length > 0 ? (
                lead.service_interested.map((service: string) => (
                  <span key={service} className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">
                    {serviceOptions.find(s => s.id === service)?.label || service}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No services selected</p>
              )}
            </div>
          </div>

          {lead.notes && (
            <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Notes</p>
              <p className="text-gray-900 dark:text-white">{lead.notes}</p>
            </div>
          )}
        </div>

        {/* Status Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {['new', 'contacted', 'qualified', 'quoted', 'negotiating', 'won', 'lost', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updating || lead.status === status}
                className={`px-4 py-2 rounded font-medium transition ${
                  lead.status === status
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowInteractionForm(!showInteractionForm)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              📞 Log Interaction
            </button>
            <button
              onClick={() => setShowQuoteForm(!showQuoteForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium"
            >
              📄 Create Quote
            </button>
            {lead.status !== 'won' && (
              <button
                onClick={handleConvertToCustomer}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                ✅ Convert to Customer
              </button>
            )}
          </div>
        </div>

        {/* Add Interaction Form */}
        {showInteractionForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Log Interaction</h3>
            <form onSubmit={handleAddInteraction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={interactionData.type}
                  onChange={(e) => setInteractionData({ ...interactionData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="sms">SMS</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={interactionData.subject}
                  onChange={(e) => setInteractionData({ ...interactionData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={interactionData.notes}
                  onChange={(e) => setInteractionData({ ...interactionData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Save Interaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowInteractionForm(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Quote Form */}
        {showQuoteForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Quote</h3>
            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Services
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {serviceOptions.map((service) => (
                    <label key={service.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={quoteData.services.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setQuoteData({
                              ...quoteData,
                              services: [...quoteData.services, service.id],
                            })
                          } else {
                            setQuoteData({
                              ...quoteData,
                              services: quoteData.services.filter((s) => s !== service.id),
                            })
                          }
                        }}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quoteData.estimatedCost}
                  onChange={(e) => setQuoteData({ ...quoteData, estimatedCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valid for (days)
                </label>
                <input
                  type="number"
                  value={quoteData.validDays}
                  onChange={(e) => setQuoteData({ ...quoteData, validDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Create Quote
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Interactions Timeline */}
        {lead.lead_interactions && lead.lead_interactions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Interactions</h3>
            <div className="space-y-4">
              {lead.lead_interactions.map((interaction: any, idx: number) => (
                <div key={interaction.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {interaction.interaction_type}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(interaction.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{interaction.subject}</p>
                  {interaction.notes && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{interaction.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotes Section */}
        {lead.lead_quotes && lead.lead_quotes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quotes</h3>
            <div className="space-y-4">
              {lead.lead_quotes.map((quote: any) => (
                <div key={quote.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{quote.quote_number}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {quote.services.join(', ')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium capitalize ${
                      quote.status === 'sent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      quote.status === 'accepted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      quote.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-3">
                    <span className="text-gray-600 dark:text-gray-400">
                      Cost: <span className="font-semibold text-gray-900 dark:text-white">${quote.estimated_cost}</span>
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Valid until: <span className="font-semibold text-gray-900 dark:text-white">{new Date(quote.valid_until).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
