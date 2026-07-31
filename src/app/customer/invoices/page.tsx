'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerInvoices() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)
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
      const { data: { session } } = await supabase.auth.getSession()

      // Get customer by user email
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('email', session?.user?.email)
        .single()

      if (customerData) {
        setCustomer(customerData)

        // Fetch invoices for this customer
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('*')
          .eq('customer_id', customerData.id)
          .order('created_at', { ascending: false })

        setInvoices(invoicesData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; icon: string } } = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', icon: '📝' },
      sent: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', icon: '📧' },
      viewed: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', icon: '👁️' },
      paid: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', icon: '✅' },
      overdue: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', icon: '⚠️' },
    }
    const badge = badges[status]
    return badge
      ? {
          class: `${badge.bg} ${badge.text}`,
          display: `${badge.icon} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        }
      : null
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">💰 My Invoices</h1>
          <div className="space-x-4">
            <Link href="/customer/jobs" className="text-blue-600 hover:text-blue-700">
              Services
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Invoice History
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} on file
          </p>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No invoices yet</p>
            <Link
              href="/customer/jobs"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Services
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                      Due Date
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
                  {invoices.map((invoice) => {
                    const badge = getStatusBadge(invoice.status)
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {invoice.id.substring(0, 12)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                          ${invoice.total_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {badge && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                              {badge.display}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            href={`/customer/invoices/${invoice.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
