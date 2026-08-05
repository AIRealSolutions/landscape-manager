'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface IntakeNotification {
  id: string
  intake_id: string
  customer_name: string
  customer_email: string
  property_address: string
  estimated_cost: string
  status: 'pending' | 'sent' | 'failed'
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<IntakeNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('pending')
  const [adminEmail, setAdminEmail] = useState('')
  const [editingEmail, setEditingEmail] = useState(false)

  useEffect(() => {
    loadNotifications()
    loadAdminEmail()
  }, [filter])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('intake_notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminEmail = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('admin_email')
        .single()

      if (error) throw error
      setAdminEmail(data?.admin_email || '')
    } catch (err) {
      console.error('Error loading admin email:', err)
    }
  }

  const saveAdminEmail = async (email: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ admin_email: email })
        .single()

      if (error) throw error
      setAdminEmail(email)
      setEditingEmail(false)
      alert('Admin email updated!')
    } catch (err) {
      console.error('Error saving email:', err)
      alert((err as Error).message)
    }
  }

  const resendNotification = async (notification: IntakeNotification) => {
    // This would trigger resending the email
    // For now, just mark as pending again
    try {
      const { error } = await supabase
        .from('intake_notifications')
        .update({ status: 'pending' })
        .eq('id', notification.id)

      if (error) throw error
      await loadNotifications()
      alert('Marked for resend. Email will be sent shortly.')
    } catch (err) {
      console.error('Error resending:', err)
      alert((err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/onboarding" className="text-sm text-green-600 hover:text-green-700 font-medium">
          ← Onboarding Submissions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Email Notifications</h1>
        <p className="text-gray-600 mt-2">
          Manage intake notifications and configure email settings.
        </p>
      </div>

      {/* Admin Email Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Notification Email</h2>
        <p className="text-sm text-gray-600 mb-4">
          New intake submissions will be sent to this email address.
        </p>

        {editingEmail ? (
          <div className="flex gap-3">
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="admin@example.com"
            />
            <button
              onClick={() => saveAdminEmail(adminEmail)}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => setEditingEmail(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{adminEmail || 'Not set'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {adminEmail ? '✓ Notifications enabled' : '⚠️ Email not configured'}
              </p>
            </div>
            <button
              onClick={() => setEditingEmail(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Notification Queue</h2>
          <div className="flex gap-2">
            {['all', 'pending', 'sent', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No {filter} notifications.</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-lg border ${
                  notif.status === 'sent'
                    ? 'bg-green-50 border-green-200'
                    : notif.status === 'failed'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{notif.customer_name}</h3>
                    <p className="text-sm text-gray-600">{notif.customer_email}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.property_address}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        notif.status === 'sent'
                          ? 'bg-green-200 text-green-800'
                          : notif.status === 'failed'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {notif.status.toUpperCase()}
                    </span>
                    <p className="text-sm font-bold text-gray-900 mt-2">${notif.estimated_cost}/mo</p>
                  </div>
                </div>

                {notif.error_message && (
                  <p className="text-xs text-red-700 mb-2">Error: {notif.error_message}</p>
                )}

                {notif.sent_at ? (
                  <p className="text-xs text-gray-500">
                    Sent {new Date(notif.sent_at).toLocaleString()}
                  </p>
                ) : (
                  <button
                    onClick={() => resendNotification(notif)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Mark for resend →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3">📧 Email Setup (Next Step)</h3>
        <p className="text-sm text-blue-800 mb-4">
          To automatically send emails for each intake, you'll need to set up Resend (or another email service).
        </p>
        <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
          <li>
            Create a free account at{' '}
            <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
              resend.com
            </a>
          </li>
          <li>Get your API key from the Resend dashboard</li>
          <li>Add it to your environment variables: RESEND_API_KEY</li>
          <li>We'll automatically send emails to your admin email for each new intake</li>
        </ol>
      </div>
    </div>
  )
}
