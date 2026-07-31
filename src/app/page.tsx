'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-green-900 dark:text-green-400 mb-4">
          🌳 Landscape Service Manager
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          AI-Powered Platform for Professional Landscape Services
        </p>

        {!session ? (
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Sign Up
            </Link>
          </div>
        ) : (
          <div className="space-x-4">
            <Link
              href="/admin/dashboard"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Admin Dashboard
            </Link>
            <Link
              href="/crew/jobs"
              className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Crew Portal
            </Link>
            <Link
              href="/customer/jobs"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Customer Portal
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-green-900 dark:text-green-400 mb-2">📅 Smart Scheduling</h3>
            <p className="text-gray-600 dark:text-gray-400">AI-powered schedule optimization and crew management</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-green-900 dark:text-green-400 mb-2">🔔 Real-Time Alerts</h3>
            <p className="text-gray-600 dark:text-gray-400">SMS, email, and push notifications for customers</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-green-900 dark:text-green-400 mb-2">💰 Payment Processing</h3>
            <p className="text-gray-600 dark:text-gray-400">Automated invoicing and payment collection</p>
          </div>
        </div>
      </div>
    </main>
  )
}
