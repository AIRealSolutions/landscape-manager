'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCustomers } from '@/lib/customers'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerList() {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      try {
        setCustomers(await getCustomers())
      } catch (err) {
        console.error('Error loading customers:', err)
      }
      setLoading(false)
    }

    init()
  }, [])

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">👥 Customers</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or address..."
            className="flex-1 max-w-lg px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <Link
            href="/admin/customers/new"
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-center"
          >
            + Add Customer
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-4">🌱</p>
            <p className="text-gray-600 mb-4">
              {customers.length === 0 ? 'No customers yet' : 'No customers match your search'}
            </p>
            {customers.length === 0 && (
              <Link
                href="/admin/customers/new"
                className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Add Your First Customer
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-green-200 transition block"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                  <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full capitalize">
                    {customer.property_type || 'residential'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {customer.phone && <p>📞 {customer.phone}</p>}
                  {customer.email && <p>✉️ {customer.email}</p>}
                  {customer.address && <p>📍 {customer.address}</p>}
                  {customer.lot_size && <p>🌿 {customer.lot_size}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
