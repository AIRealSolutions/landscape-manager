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
    return <div className="flex items-center justify-center min-h-screen bg-white">Loading...</div>
  }

  return (
    <main className="bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <h1 className="text-xl font-bold text-gray-900">Landscape Manager</h1>
          </div>
          {session && (
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 to-green-700 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Professional Landscape Management
            </h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
              AI-powered scheduling, crew management, and customer communication platform built for landscaping businesses
            </p>

            {!session ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/login"
                  className="inline-block px-8 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-block px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-white"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/admin/dashboard"
                  className="inline-block px-8 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="/crew/jobs"
                  className="inline-block px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  Crew Portal
                </Link>
                <Link
                  href="/customer/jobs"
                  className="inline-block px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  Customer Portal
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -ml-48 -mb-48"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to run a modern landscaping business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="text-4xl mb-4">📅</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Smart Scheduling</h4>
              <p className="text-gray-600">
                AI-powered schedule optimization that reduces travel time and maximizes crew productivity
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="text-4xl mb-4">🔔</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Real-Time Alerts</h4>
              <p className="text-gray-600">
                SMS, email, and push notifications keep customers informed every step of the way
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="text-4xl mb-4">💰</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Payment Processing</h4>
              <p className="text-gray-600">
                Automated invoicing and secure payment collection integrated into your workflow
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="text-4xl mb-4">👥</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Crew Management</h4>
              <p className="text-gray-600">
                Track crew performance, manage assignments, and optimize team utilization
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Analytics & Insights</h4>
              <p className="text-gray-600">
                AI-powered insights help you make data-driven decisions for your business
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Lead Management</h4>
              <p className="text-gray-600">
                Capture leads from your website and manage your sales pipeline efficiently
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to transform your landscaping business?
          </h3>
          {!session && (
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-gray-50 transition text-lg"
            >
              Start Your Free Trial
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>© 2024 Landscape Service Manager. All rights reserved.</p>
            <p className="mt-2 text-sm text-gray-400">
              Built for professional landscaping businesses
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
