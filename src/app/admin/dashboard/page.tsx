'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [created, setCreated] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setCreated(new URLSearchParams(window.location.search).get('created'))

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
      const { data: jobsData } = await supabase.from('jobs').select('*').limit(10)
      const { data: customersData } = await supabase.from('customers').select('*').limit(10)

      setJobs(jobsData || [])
      setCustomers(customersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🌳 Landscape Manager</h1>
          <div className="space-x-4">
            <span className="text-gray-600 dark:text-gray-400">{user?.email}</span>
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
        {created && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6 flex items-center gap-2">
            <span>✅</span>
            <p className="font-medium">
              {created === 'customer'
                ? 'Customer added successfully!'
                : created === 'job'
                ? 'Job created successfully!'
                : 'Saved successfully!'}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total Customers</h3>
            <p className="text-3xl font-bold text-green-600">{customers.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Scheduled Jobs</h3>
            <p className="text-3xl font-bold text-blue-600">{jobs.filter(j => j.status === 'scheduled').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Completed Jobs</h3>
            <p className="text-3xl font-bold text-purple-600">{jobs.filter(j => j.status === 'completed').length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Jobs</h2>
            <div className="space-y-3">
              {jobs.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No jobs yet</p>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <p className="font-medium text-gray-900 dark:text-white">{job.scheduled_date}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status: {job.status}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Customers</h2>
              <Link href="/admin/customers" className="text-sm text-green-600 hover:text-green-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {customers.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No customers yet</p>
              ) : (
                customers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/admin/customers/${customer.id}`}
                    className="block border border-gray-200 dark:border-gray-700 rounded p-3 hover:border-green-300 hover:bg-green-50 transition"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 space-x-4">
          <Link
            href="/admin/jobs/new"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create New Job
          </Link>
          <Link
            href="/admin/customers"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Customers
          </Link>
          <Link
            href="/admin/calendar"
            className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            📅 Calendar
          </Link>
          <Link
            href="/admin/services"
            className="inline-block px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
          >
            💲 Services & Pricing
          </Link>
          <Link
            href="/admin/financials"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            View Financials
          </Link>
          <Link
            href="/admin/ai-assistant"
            className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            AI Assistant
          </Link>
        </div>
      </main>
    </div>
  )
}
