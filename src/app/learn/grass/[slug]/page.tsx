'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import LearnShell from '../../LearnShell'
import { GRASS_TYPES } from '@/data/education'

export default function GrassDetail() {
  const params = useParams()
  const grass = GRASS_TYPES.find((g) => g.slug === params.slug)

  if (!grass) {
    return (
      <LearnShell>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <p className="text-gray-600 mb-4">Grass type not found.</p>
          <Link href="/learn" className="text-green-600 font-semibold hover:text-green-700">
            ← Back to the Lawn Care Guide
          </Link>
        </div>
      </LearnShell>
    )
  }

  const others = GRASS_TYPES.filter((g) => g.season === grass.season && g.slug !== grass.slug)

  return (
    <LearnShell
      ctaTitle={`Want a perfect ${grass.name} lawn without the work?`}
      ctaText="Our crews know exactly how to care for it — mowing height, feeding schedule, and all."
    >
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/learn" className="text-sm text-green-600 hover:text-green-700 font-medium">
          ← Lawn Care Guide
        </Link>

        <div className="mt-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            {grass.emoji} {grass.name}
          </h1>
          <p className="mt-2 inline-block text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-green-50 text-green-700">
            {grass.season === 'cool' ? '❄️ Cool-season grass' : '☀️ Warm-season grass'} · {grass.regions}
          </p>
        </div>

        <p className="text-lg text-gray-700 mb-10">{grass.description}</p>

        {/* Quick facts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            ['☀️ Sunlight', grass.sun],
            ['✂️ Mowing height', grass.mowingHeight],
            ['💧 Water needs', grass.water],
            ['👟 Foot traffic', grass.traffic],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
              <p className="text-sm font-medium text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-green-50 border border-green-100 rounded-xl p-6">
            <h2 className="font-bold text-green-900 mb-3">✅ Strengths</h2>
            <ul className="space-y-2">
              {grass.pros.map((p) => (
                <li key={p} className="text-sm text-green-900">• {p}</li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
            <h2 className="font-bold text-amber-900 mb-3">⚠️ Watch out for</h2>
            <ul className="space-y-2">
              {grass.cons.map((c) => (
                <li key={c} className="text-sm text-amber-900">• {c}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-12">
          <h2 className="font-bold text-gray-900 mb-4">🎯 Pro Care Tips</h2>
          <ol className="space-y-3">
            {grass.careTips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ol>
        </div>

        {others.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-4">
              Other {grass.season === 'cool' ? 'cool' : 'warm'}-season grasses
            </h2>
            <div className="flex flex-wrap gap-3">
              {others.map((g) => (
                <Link
                  key={g.slug}
                  href={`/learn/grass/${g.slug}`}
                  className="px-4 py-2 bg-gray-100 hover:bg-green-50 hover:text-green-700 text-gray-700 rounded-full text-sm font-medium transition"
                >
                  {g.emoji} {g.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </LearnShell>
  )
}
