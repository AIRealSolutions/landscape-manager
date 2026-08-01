'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getPublicBranding, defaultBranding } from '@/lib/branding'

const FALLBACK_SERVICES = [
  { name: 'Lawn Mowing & Care', description: 'Regular mowing, edging, and trimming for a lawn that always looks its best', icon: '🌱' },
  { name: 'Aeration & Seeding', description: 'Thicker, healthier grass with core aeration and overseeding', icon: '🌾' },
  { name: 'Landscaping & Design', description: 'Beds, plantings, and designs that transform your outdoor space', icon: '🌺' },
  { name: 'Mulch & Bedding', description: 'Fresh mulch and clean bed edges that make everything pop', icon: '🪵' },
  { name: 'Tree & Shrub Service', description: 'Pruning, trimming, and care for trees and shrubs', icon: '🌳' },
  { name: 'Seasonal Cleanup', description: 'Spring and fall cleanups that keep your property ready for the season', icon: '🍂' },
]

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [company, setCompany] = useState(defaultBranding)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    getPublicBranding().then(setCompany)

    // Public price menu from the services catalog (falls back to defaults)
    supabase
      .from('services')
      .select('name, description, base_price, frequency, type')
      .order('base_price', { ascending: true })
      .then(({ data }) => setServices(data || []))
  }, [])

  const frequencyLabel: { [key: string]: string } = {
    'one-time': '',
    weekly: '/week',
    biweekly: '/visit, every 2 weeks',
    monthly: '/month',
  }

  return (
    <main className="bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{company.emoji}</span>
            <span className="text-xl font-bold text-gray-900">{company.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/learn" className="hidden sm:inline text-sm font-medium text-green-700 hover:text-green-800">
              Lawn Care Guide
            </Link>
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="hidden sm:inline-block text-green-700 font-semibold hover:text-green-800"
              >
                📞 {company.phone}
              </a>
            )}
            <Link
              href="/leads/capture"
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm"
            >
              Free Quote
            </Link>
            {session ? (
              <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
                Dashboard
              </Link>
            ) : (
              <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-600">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <p className="text-green-100 font-semibold uppercase tracking-wide text-sm mb-4">
            {company.serviceArea}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 max-w-3xl mx-auto">
            {company.tagline}
          </h1>
          <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto">
            From weekly mowing to complete landscape transformations — get a free, no-obligation quote
            in under two minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/leads/capture"
              className="inline-block px-10 py-4 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition text-lg shadow-lg"
            >
              Get Your Free Quote →
            </Link>
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="inline-block px-10 py-4 bg-green-800/40 text-white font-bold rounded-lg hover:bg-green-800/60 transition text-lg border border-green-300/40"
              >
                📞 Call {company.phone}
              </a>
            )}
          </div>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -ml-48 -mb-48" />
        </div>
      </section>

      {/* Services & pricing */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Straightforward services, straightforward pricing.
            </p>
          </div>

          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <div key={i} className="bg-white p-7 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                    <p className="text-xl font-bold text-green-600 whitespace-nowrap ml-3">
                      ${Number(service.base_price).toFixed(0)}
                      <span className="text-xs text-gray-500 font-normal">
                        {frequencyLabel[service.frequency] || ''}
                      </span>
                    </p>
                  </div>
                  {service.description && (
                    <p className="text-gray-600 text-sm flex-1">{service.description}</p>
                  )}
                  <Link
                    href="/leads/capture"
                    className="mt-4 text-green-600 hover:text-green-700 font-semibold text-sm"
                  >
                    Request this service →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FALLBACK_SERVICES.map((service, i) => (
                <div key={i} className="bg-white p-7 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                  <Link
                    href="/leads/capture"
                    className="inline-block mt-4 text-green-600 hover:text-green-700 font-semibold text-sm"
                  >
                    Request this service →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to a beautiful property.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: '1',
                title: 'Request Your Free Quote',
                text: 'Tell us about your property and what you need — it takes two minutes.',
              },
              {
                step: '2',
                title: 'Get a Custom Plan',
                text: "We'll reach out within 24 hours with a plan and price built for your property.",
              },
              {
                step: '3',
                title: 'We Handle the Rest',
                text: 'Our crew shows up on schedule, every time, with photo updates when the work is done.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-green-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            Why Homeowners Choose Us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              ['📅', 'Reliable scheduling', 'We show up when we say we will — and you get a text when we\'re on the way.'],
              ['📸', 'Photo proof of work', 'Before and after photos with every completed job.'],
              ['💬', 'Easy communication', 'Text, email, or call — updates the way you want them.'],
              ['✅', 'Satisfaction guaranteed', 'If something isn\'t right, we come back and make it right.'],
            ].map(([icon, title, text]) => (
              <div key={title} className="flex gap-4 bg-white p-6 rounded-xl border border-gray-100">
                <span className="text-3xl">{icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-600 text-sm">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-green-700 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready for a yard you'll love?
          </h2>
          <p className="text-green-100 text-lg mb-8">
            Free quotes, no pressure, fast response.
          </p>
          <Link
            href="/leads/capture"
            className="inline-block px-10 py-4 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition text-lg"
          >
            Get Your Free Quote →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <p className="font-bold text-white text-lg">
                {company.emoji} {company.name}
              </p>
              <p className="text-sm text-gray-400 mt-1">{company.serviceArea}</p>
            </div>
            <div className="text-center sm:text-right text-sm space-y-1">
              {company.phone && (
                <p>
                  <a href={`tel:${company.phone}`} className="hover:text-white">📞 {company.phone}</a>
                </p>
              )}
              {company.email && (
                <p>
                  <a href={`mailto:${company.email}`} className="hover:text-white">✉️ {company.email}</a>
                </p>
              )}
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
            <Link href="/auth/login" className="hover:text-gray-300">
              Staff sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
