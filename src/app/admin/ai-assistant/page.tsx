'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getServiceRecommendations,
  predictRevenue,
  getAIInsights,
} from '@/lib/ai-assistant'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AIAssistant() {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [revenuePredict, setRevenuePredict] = useState<any>(null)
  const [selectedSeason, setSelectedSeason] = useState('spring')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      await fetchAIData()
      setLoading(false)
    }

    init()
  }, [])

  const fetchAIData = async () => {
    try {
      // Get insights
      const aiInsights = await getAIInsights('')
      setInsights(aiInsights)

      // Get service recommendations
      const services = await getServiceRecommendations('', selectedSeason)
      setRecommendations(services)

      // Get revenue predictions
      const revenue = await predictRevenue('', 3)
      setRevenuePredict(revenue)
    } catch (error) {
      console.error('Error fetching AI data:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🤖 AI Assistant</h1>
          <div className="space-x-4">
            <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
              Dashboard
            </Link>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI-Powered Business Insights
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Smart recommendations to grow your landscaping business
          </p>
        </div>

        {/* AI Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📊 Business Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.length > 0 ? (
              insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 p-4 rounded-lg"
                >
                  <p className="text-gray-900 dark:text-white font-medium">{insight}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No data yet - create jobs to see insights</p>
            )}
          </div>
        </div>

        {/* Revenue Forecast */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">💰 Revenue Forecast</h3>
          {revenuePredict && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-6 rounded-lg">
                <p className="text-green-600 dark:text-green-200 text-sm uppercase font-bold">
                  3-Month Projection
                </p>
                <p className="text-4xl font-bold text-green-900 dark:text-green-100 mt-2">
                  ${revenuePredict.predictedRevenue?.toFixed(0) || 0}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                  Monthly Avg: ${(revenuePredict.monthlyAverage || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 rounded-lg">
                <p className="text-blue-600 dark:text-blue-200 text-sm uppercase font-bold">
                  Forecast Confidence
                </p>
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                  {((revenuePredict.confidence || 0) * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  {revenuePredict.basis}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Service Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎯 Seasonal Service Recommendations
            </h3>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
              <option value="winter">Winter</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {rec.serviceName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {rec.serviceType}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ${rec.estimatedPrice}
                  </p>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4">{rec.description}</p>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Timing:</strong> {rec.seasonalTiming}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Why:</strong> {rec.reason}
                  </p>
                </div>

                <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium">
                  Create Template
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* AI Tips */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
            💡 AI-Powered Tips to Grow Your Business
          </h3>
          <ul className="space-y-3 text-purple-900 dark:text-purple-100">
            <li>
              ✓ <strong>Smart Scheduling:</strong> Bundle nearby jobs to reduce travel time and crew idle time
            </li>
            <li>
              ✓ <strong>Seasonal Planning:</strong> Proactively reach out to customers with seasonal service recommendations
            </li>
            <li>
              ✓ <strong>Upselling Opportunities:</strong> Suggest complementary services based on job history
            </li>
            <li>
              ✓ <strong>Crew Optimization:</strong> Assign jobs based on crew skills and location proximity
            </li>
            <li>
              ✓ <strong>Payment Reminders:</strong> Automated SMS/email for overdue invoices
            </li>
            <li>
              ✓ <strong>Customer Retention:</strong> Identify at-risk customers and send targeted re-engagement offers
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
