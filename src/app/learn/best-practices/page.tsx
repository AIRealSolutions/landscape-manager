'use client'

import Link from 'next/link'
import LearnShell from '../LearnShell'
import { BEST_PRACTICES } from '@/data/education'

export default function BestPractices() {
  return (
    <LearnShell
      ctaTitle="Want all of this handled for you?"
      ctaText="Our maintenance plans cover mowing, feeding, and seasonal care on a schedule tuned to your lawn."
    >
      <section className="bg-gradient-to-br from-green-700 to-emerald-600 py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">🏆 Lawn Care Best Practices</h1>
          <p className="text-xl text-green-50">
            Six habits separate struggling lawns from show-stoppers. None of them are complicated —
            they just have to be done right, at the right time.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {BEST_PRACTICES.map((practice, idx) => (
            <div key={practice.title} className="bg-white border border-gray-200 rounded-xl p-7">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{practice.emoji}</span>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {idx + 1}. {practice.title}
                  </h2>
                  <p className="text-gray-600 mt-2 mb-4">{practice.summary}</p>
                  <ul className="space-y-2">
                    {practice.tips.map((tip) => (
                      <li key={tip} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
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
            href="/learn/weeds"
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Weed Prevention Guide →
          </Link>
        </div>
      </section>
    </LearnShell>
  )
}
