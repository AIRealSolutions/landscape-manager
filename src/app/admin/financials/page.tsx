'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminFinancials() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    totalInvoices: 0,
    paidInvoices: 0,
  })
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
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (invoicesData) {
        setInvoices(invoicesData)
        calculateStats(invoicesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const calculateStats = (invoicesData: any[]) => {
    const now = new Date()

    const totalRevenue = invoicesData.reduce((sum, inv) => sum + inv.total_amount, 0)
    const paidAmount = invoicesData
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0)

    const pendingAmount = invoicesData
      .filter((inv) => inv.status === 'sent' || inv.status === 'viewed')
      .reduce((sum, inv) => sum + inv.total_amount, 0)

    const overdueAmount = invoicesData
      .filter((inv) => inv.status === 'overdue' && new Date(inv.due_date) < now)
      .reduce((sum, inv) => sum + inv.total_amount, 0)

    setStats({
      totalRevenue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalInvoices: invoicesData.length,
      paidInvoices: invoicesData.filter((inv) => inv.status === 'paid').length,
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">💰 Financial Dashboard</h1>
          <div className="space-x-4">
            <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
              Back to Dashboard
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
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total Revenue</h3>
            <p className="text-4xl font-bold text-green-600">
              ${stats.totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              All invoices issued
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Amount Paid</h3>
            <p className="text-4xl font-bold text-blue-600">
              ${stats.paidAmount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {stats.paidInvoices} invoices paid
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Pending Payment</h3>
            <p className="text-4xl font-bold text-yellow-600">
              ${stats.pendingAmount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Awaiting customer payment
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Overdue</h3>
            <p className="text-4xl font-bold text-red-600">
              ${stats.overdueAmount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Past due date
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Collection Rate</h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalInvoices > 0
                ? ((stats.paidAmount / stats.totalRevenue) * 100).toFixed(1)
                : 0}
              %
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width:
                    stats.totalInvoices > 0
                      ? `${(stats.paidAmount / stats.totalRevenue) * 100}%`
                      : '0%',
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Average Invoice</h3>
            <p className="text-3xl font-bold text-green-600">
              ${stats.totalInvoices > 0 ? (stats.totalRevenue / stats.totalInvoices).toFixed(2) : 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Outstanding</h3>
            <p className="text-3xl font-bold text-yellow-600">
              ${(stats.pendingAmount + stats.overdueAmount).toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {stats.totalInvoices - stats.paidInvoices} unpaid invoices
            </p>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Invoices</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                    Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-white uppercase">
                    Amount
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
                {invoices.slice(0, 10).map((invoice) => (
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
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-700 font-medium">View</button>
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
