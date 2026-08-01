'use client'

import Link from 'next/link'
import LearnShell from '../LearnShell'
import { WEEDS } from '@/data/education'

export default function WeedGuide() {
  return (
    <LearnShell
      ctaTitle="Tired of fighting weeds yourself?"
      ctaText="Ask about our weed prevention program — pre-emergent timing, spot treatment, and a lawn thick enough to fight back."
    >
      <section className="bg-gradient-to-br from-green-700 to-emerald-600 py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">🚫 Weed Prevention Guide</h1>
          <p className="text-xl text-green-50">
            The best weed control is a lawn too thick for weeds to find a home. Here's how to identify
            the usual suspects — and beat them.
          </p>
        </div>
      </section>

      {/* The golden rules */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-12">
          <h2 className="font-bold text-green-900 mb-3">🏆 The 4 Golden Rules of Weed Prevention</h2>
          <ol className="space-y-2 text-green-900">
            <li><strong>1. Mow tall.</strong> Grass at 3–4 inches shades the soil so weed seeds never see the sun they need to sprout.</li>
            <li><strong>2. Feed the grass, starve the weeds.</strong> A dense, well-fed lawn outcompetes almost everything.</li>
            <li><strong>3. Time your pre-emergent.</strong> Apply in early spring when soil reaches 55°F — before seeds germinate, not after.</li>
            <li><strong>4. Fix the cause.</strong> Recurring weeds point at a condition: compaction, shade, poor drainage, or thin turf.</li>
          </ol>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Know Your Enemy</h2>
        <div className="space-y-6">
          {WEEDS.map((weed) => (
            <div key={weed.name} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{weed.emoji}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{weed.name}</h3>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{weed.type}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">🔍 How to spot it</p>
                  <p className="text-sm text-gray-700">{weed.identify}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">🛡️ Prevent it</p>
                  <p className="text-sm text-gray-700">{weed.prevention}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-xs font-bold text-amber-700 uppercase mb-1">⚔️ Treat it</p>
                  <p className="text-sm text-gray-700">{weed.treatment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/learn"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            ← Lawn Care Guide
          </Link>
          <Link
            href="/learn/best-practices"
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Next: Best Practices →
          </Link>
        </div>
      </section>
    </LearnShell>
  )
}
