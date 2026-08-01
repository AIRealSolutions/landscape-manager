'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getOrCreateCompanyId } from '@/lib/profile'
import { getCompanySettings, updateCompanySettings } from '@/lib/branding'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BusinessSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    phone: '',
    email: '',
    service_area: '',
    emoji: '🌳',
    website: '',
  })
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      try {
        const id = await getOrCreateCompanyId()
        setCompanyId(id)
        const settings = await getCompanySettings(id)
        if (settings) {
          setForm({
            name: settings.name || '',
            tagline: settings.tagline || '',
            phone: settings.phone || '',
            email: settings.email || '',
            service_area: settings.service_area || '',
            emoji: settings.emoji || '🌳',
            website: settings.website || '',
          })
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load settings')
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      await updateCompanySettings(companyId, {
        name: form.name.trim(),
        tagline: form.tagline.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        service_area: form.service_area.trim() || null,
        emoji: form.emoji.trim() || '🌳',
        website: form.website.trim() || null,
      })
      setNotice('Saved! Your website and quote form update immediately.')
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">⚙️ Business Settings</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {notice && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">✅ {notice}</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Something went wrong</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <p className="text-sm text-gray-500 mb-6">
            This is your public branding — it appears on your website homepage, the quote request form,
            and customer communications. Changes go live immediately.
          </p>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Business Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Logo Emoji</label>
                <input
                  type="text"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  maxLength={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-center text-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder={'e.g. "Louisville\'s most trusted lawn care"'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">The big headline on your homepage</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Service Area</label>
              <input
                type="text"
                value={form.service_area}
                onChange={(e) => setForm({ ...form, service_area: e.target.value })}
                placeholder={'e.g. "Serving Louisville & surrounding areas"'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(502) 555-0134"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Click-to-call on your website</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Public Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="hello@yourcompany.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://yourcompany.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <Link href="/" target="_blank" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Preview your website →
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
