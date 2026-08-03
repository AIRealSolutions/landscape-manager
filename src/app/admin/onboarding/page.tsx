'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { GRASS_TYPES } from '@/data/education'

interface PropertyIntakeRecord {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  address: string
  property_size: string
  grass_type: string | null
  current_condition: string
  issues: string[]
  service_level: string
  availability: string | null
  estimated_monthly_cost: number | null
  property_id: string | null
  created_at: string
}

export default function OnboardingAdmin() {
  const [intakes, setIntakes] = useState<PropertyIntakeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'no-property' | 'with-property'>('all')

  useEffect(() => {
    loadIntakes()
  }, [filter])

  const loadIntakes = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('property_intake')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter === 'no-property') {
        query = query.is('property_id', null)
      } else if (filter === 'with-property') {
        query = query.not('property_id', 'is', null)
      }

      const { data, error } = await query

      if (error) throw error
      setIntakes(data || [])
    } catch (err) {
      console.error('Error loading intakes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProperty = async (intake: PropertyIntakeRecord) => {
    try {
      // Create customer if not exists
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', intake.customer_email)
        .limit(1)

      if (custError) throw custError

      let customerId = customers?.[0]?.id

      if (!customerId) {
        const { data: newCust, error: createError } = await supabase
          .from('customers')
          .insert({
            name: intake.customer_name,
            email: intake.customer_email,
            phone: intake.customer_phone,
          })
          .select('id')
          .single()

        if (createError) throw createError
        customerId = newCust.id
      }

      // Create property
      const { data: property, error: propError } = await supabase
        .from('properties')
        .insert({
          customer_id: customerId,
          address: intake.address,
          notes: `Onboarding: ${intake.property_size} property, ${intake.grass_type || 'unknown grass'}, ${intake.current_condition} condition. Issues: ${intake.issues.join(', ') || 'none'}.`,
        })
        .select('id')
        .single()

      if (propError) throw propError

      // Link intake to property
      const { error: linkError } = await supabase
        .from('property_intake')
        .update({ property_id: property.id })
        .eq('id', intake.id)

      if (linkError) throw linkError

      // Refresh list
      await loadIntakes()
      alert('Property created successfully! Navigate to Properties to view.')
    } catch (err) {
      console.error('Error creating property:', err)
      alert((err as Error).message)
    }
  }

  const getGrassName = (slug: string | null) => {
    if (!slug) return 'Not specified'
    const grass = GRASS_TYPES.find((g) => g.slug === slug)
    return grass ? `${grass.emoji} ${grass.name}` : slug
  }

  const getIssueEmoji = (issue: string) => {
    const emojis: { [key: string]: string } = {
      weeds: '🚫',
      bare_spots: '⬜',
      thin: '📉',
      compaction: '🪨',
      moss: '🟢',
      thatch: '🟤',
    }
    return emojis[issue] || '•'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/dashboard" className="text-sm text-green-600 hover:text-green-700 font-medium">
          ← Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Customer Onboarding Submissions</h1>
        <p className="text-gray-600 mt-2">
          Review property intake forms and create properties for new customers.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({intakes.length})
        </button>
        <button
          onClick={() => setFilter('no-property')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'no-property'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Needs Property ({intakes.filter((i) => !i.property_id).length})
        </button>
        <button
          onClick={() => setFilter('with-property')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'with-property'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Processed ({intakes.filter((i) => i.property_id).length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading intakes...</div>
      ) : intakes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {intakes.map((intake) => (
            <div key={intake.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Left: Contact & Property */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{intake.customer_name}</h3>
                    <p className="text-sm text-gray-600">{intake.customer_email}</p>
                    {intake.customer_phone && (
                      <p className="text-sm text-gray-600">{intake.customer_phone}</p>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Address:</strong> {intake.address}
                    </p>
                    <p>
                      <strong>Size:</strong> {intake.property_size}
                    </p>
                    <p>
                      <strong>Grass:</strong> {getGrassName(intake.grass_type)}
                    </p>
                    <p>
                      <strong>Condition:</strong> {intake.current_condition}
                    </p>
                  </div>
                </div>

                {/* Right: Issues & Service Level */}
                <div>
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Issues:</p>
                    {intake.issues.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {intake.issues.map((issue) => (
                          <span
                            key={issue}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium"
                          >
                            {getIssueEmoji(issue)} {issue.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">None reported</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Service Level:</p>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                        {intake.service_level}
                      </span>
                      {intake.estimated_monthly_cost && (
                        <span className="text-lg font-bold text-green-600">
                          ${intake.estimated_monthly_cost.toFixed(0)}/mo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Submitted {new Date(intake.created_at).toLocaleDateString()}
                  {intake.property_id && <span className="ml-3 text-green-600 font-semibold">✓ Property created</span>}
                </div>
                {!intake.property_id ? (
                  <button
                    onClick={() => handleCreateProperty(intake)}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                  >
                    Create Property →
                  </button>
                ) : (
                  <Link
                    href={`/admin/customers`}
                    className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                  >
                    View in Customers
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
