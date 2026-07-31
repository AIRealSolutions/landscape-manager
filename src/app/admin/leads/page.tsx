'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getLeads, getLeadFunnelStats } from '@/lib/leads'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LeadsDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<any[]>([])
  const [funnelStats, setFunnelStats] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)
      await fetchData()
      setLoading(false)
    }

    checkAuth()
  }, [])

  const fetchData = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', (await supabase.auth.getSession()).data.session?.user.id!)
        .single()

      if (userData?.company_id) {
        const leadsData = await getLeads(userData.company_id)
        setLeads(leadsData)

        const stats = await getLeadFunnelStats(userData.company_id)
        setFunnelStats(stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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

  const filteredLeads =
    filter === 'all' ? leads : leads.filter((l) => l.status === filter)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">📊 Sales Pipeline</h1>
          <div className="space-x-4">
            <Link
              href="/leads/capture"
              className="text-blue-600 hover:text-blue-700 font-medium"
              target="_blank"
            >
              Share Quote Form
            </Link>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Funnel Stats */}
        {funnelStats && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Sales Funnel Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm uppercase mb-2">
                  Total Leads
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {funnelStats.stats.total}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm uppercase mb-2">
                  Conversion Rate
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {funnelStats.conversionRate}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm uppercase mb-2">
                  Won Deals
                </p>
                <p className="text-3xl font-bold text-blue-600">{funnelStats.stats.won}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm uppercase mb-2">
                  Avg Lead Value
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  ${(funnelStats.avgLeadValue || 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Funnel Visualization */}
        {funnelStats && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Pipeline Funnel
            </h3>
            <div className="space-y-4">
              {[
                { status: 'new', label: 'New Leads', color: 'bg-blue-500' },
                { status: 'contacted', label: 'Contacted', color: 'bg-cyan-500' },
                { status: 'qualified', label: 'Qualified', color: 'bg-green-500' },
                { status: 'quoted', label: 'Quoted', color: 'bg-yellow-500' },
                { status: 'negotiating', label: 'Negotiating', color: 'bg-orange-500' },
                { status: 'won', label: 'Won', color: 'bg-green-600' },
              ].map((stage, idx) => {
                const count = funnelStats.stats[stage.status] || 0
                const percentage =
                  funnelStats.stats.total > 0
                    ? ((count / funnelStats.stats.total) * 100).toFixed(0)
                    : 0
                return (
                  <div key={stage.status}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stage.label}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full ${stage.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lead List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Leads</h3>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="quoted">Quoted</option>
                <option value="negotiating">Negotiating</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {lead.first_name} {lead.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>{lead.phone}</div>
                      {lead.email && <div className="text-xs">{lead.email}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {Array.isArray(lead.service_interested)
                        ? lead.service_interested.slice(0, 2).join(', ')
                        : lead.service_interested}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                      <div className="text-lg">{lead.lead_score}</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div
                          className="bg-green-600 h-1 rounded-full"
                          style={{ width: `${lead.lead_score}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
