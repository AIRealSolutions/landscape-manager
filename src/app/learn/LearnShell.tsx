'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPublicBranding, defaultBranding } from '@/lib/branding'

// Shared frame for all Lawn Care Guide pages: branded nav, lead-gen CTA
// band, and footer. Guide CTAs carry ?src=learn for funnel attribution.
export default function LearnShell({
  children,
  ctaTitle = 'Rather have the pros handle it?',
  ctaText = 'Get a free, no-obligation quote for your property in under two minutes.',
}: {
  children: React.ReactNode
  ctaTitle?: string
  ctaText?: string
}) {
  const [company, setCompany] = useState(defaultBranding)

  useEffect(() => {
    getPublicBranding().then(setCompany)
  }, [])

  return (
    <main className="bg-white min-h-screen flex flex-col">
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">{company.emoji}</span>
            <span className="text-xl font-bold text-gray-900">{company.name}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/learn" className="hidden sm:inline text-sm font-medium text-green-700 hover:text-green-800">
              Lawn Care Guide
            </Link>
            {company.phone && (
              <a href={`tel:${company.phone}`} className="hidden sm:inline text-green-700 font-semibold hover:text-green-800">
                📞 {company.phone}
              </a>
            )}
            <Link
              href="/leads/capture?src=learn"
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm"
            >
              Free Quote
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1">{children}</div>

      {/* CTA band */}
      <section className="bg-green-700 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{ctaTitle}</h2>
          <p className="text-green-100 mb-6">{ctaText}</p>
          <Link
            href="/leads/capture?src=learn"
            className="inline-block px-8 py-3 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition"
          >
            Get Your Free Quote →
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>
          © {new Date().getFullYear()} {company.name}
          {company.phone && (
            <>
              {' · '}
              <a href={`tel:${company.phone}`} className="hover:text-white">{company.phone}</a>
            </>
          )}
        </p>
        <Link href="/" className="text-gray-500 hover:text-gray-300 mt-1 inline-block">
          ← Back to home
        </Link>
      </footer>
    </main>
  )
}
