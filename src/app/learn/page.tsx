'use client'

import Link from 'next/link'
import LearnShell from './LearnShell'
import { GRASS_TYPES } from '@/data/education'

export default function LearnHub() {
  const coolGrasses = GRASS_TYPES.filter((g) => g.season === 'cool')
  const warmGrasses = GRASS_TYPES.filter((g) => g.season === 'warm')

  return (
    <LearnShell>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-emerald-600 py-16 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Lawn Care Guide</h1>
          <p className="text-xl text-green-50">
            Everything you need to understand your lawn — what's growing in it, what's invading it,
            and how to keep it beautiful all year.
          </p>
        </div>
      </section>

      {/* Category cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="#grass-database"
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-7 hover:shadow-xl transition"
          >
            <div className="text-4xl mb-3">🌱</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Grass Database</h2>
            <p className="text-gray-600 text-sm">
              {GRASS_TYPES.length} common lawn grasses — how to identify yours and exactly how to care for it.
            </p>
          </Link>
          <Link
            href="/learn/weeds"
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-7 hover:shadow-xl transition"
          >
            <div className="text-4xl mb-3">🚫</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Weed Prevention</h2>
            <p className="text-gray-600 text-sm">
              Identify the usual invaders, stop them before they sprout, and treat the ones that got through.
            </p>
          </Link>
          <Link
            href="/learn/best-practices"
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-7 hover:shadow-xl transition"
          >
            <div className="text-4xl mb-3">🏆</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Best Practices</h2>
            <p className="text-gray-600 text-sm">
              Mowing, watering, feeding, and seasonal care — the habits behind every great-looking lawn.
            </p>
          </Link>
        </div>
      </section>

      {/* Grass database */}
      <section id="grass-database" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🌱 Grass Database</h2>
        <p className="text-gray-600 mb-10 max-w-2xl">
          Not sure what's growing in your yard? Cool-season grasses thrive in northern climates and
          stay green in fall; warm-season grasses love southern summers and go dormant after frost.
        </p>

        <h3 className="font-bold text-gray-900 text-lg mb-4">❄️ Cool-Season Grasses</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {coolGrasses.map((grass) => (
            <Link
              key={grass.slug}
              href={`/learn/grass/${grass.slug}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 hover:shadow-md transition"
            >
              <div className="text-3xl mb-2">{grass.emoji}</div>
              <h4 className="font-bold text-gray-900">{grass.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{grass.regions}</p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{grass.description}</p>
              <span className="inline-block mt-3 text-green-600 text-sm font-semibold">
                Care guide →
              </span>
            </Link>
          ))}
        </div>

        <h3 className="font-bold text-gray-900 text-lg mb-4">☀️ Warm-Season Grasses</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {warmGrasses.map((grass) => (
            <Link
              key={grass.slug}
              href={`/learn/grass/${grass.slug}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 hover:shadow-md transition"
            >
              <div className="text-3xl mb-2">{grass.emoji}</div>
              <h4 className="font-bold text-gray-900">{grass.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{grass.regions}</p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{grass.description}</p>
              <span className="inline-block mt-3 text-green-600 text-sm font-semibold">
                Care guide →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-900 font-medium">
            🔍 Not sure which grass you have? We'll identify it for free during a lawn assessment.
          </p>
          <Link
            href="/leads/capture?src=learn&utm_campaign=grass-id"
            className="inline-block mt-3 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Request a Free Assessment
          </Link>
        </div>
      </section>
    </LearnShell>
  )
}
