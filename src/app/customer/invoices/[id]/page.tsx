'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function InvoicePage() {
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      await fetchInvoice()
      setLoading(false)
    }

    init()
  }, [])

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*, customers(name, email, phone, address)')
        .eq('id', invoiceId)
        .single()

      setInvoice(invoiceData)
      if (invoiceData?.customers) {
        setCustomer(invoiceData.customers)
      }

      // Mark as viewed
      if (invoiceData?.status === 'sent') {
        await supabase
          .from('invoices')
          .update({ status: 'viewed' })
          .eq('id', invoiceId)
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    }
  }

  const handlePayment = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: invoice.total_amount,
          payment_method: 'card',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      if (data.message?.includes('Mock')) {
        alert('✅ Demo Mode: Payment successful (mock).\nConfigure Stripe for real payments.')
      }

      await fetchInvoice()
    } catch (error: any) {
      alert(`Payment Error: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Invoice not found</p>
          <Link href="/customer/jobs" className="text-blue-600 hover:text-blue-700">
            Back to Services
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = invoice.total_amount - (invoice.tax || 0) + (invoice.discount || 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🌳 Invoice</h1>
          <Link href="/customer/jobs" className="text-blue-600 hover:text-blue-700">
            Back
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Invoice
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  ID: {invoiceId.substring(0, 12)}...
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Issued</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Bill To</h3>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{customer?.name}</p>
            <p className="text-gray-600 dark:text-gray-400">{customer?.address}</p>
            <p className="text-gray-600 dark:text-gray-400">{customer?.phone}</p>
            <p className="text-gray-600 dark:text-gray-400">{customer?.email}</p>
          </div>

          {/* Invoice Details */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Service Details</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-900 dark:text-white">
                <strong>Service ID(s):</strong>{' '}
                {Array.isArray(invoice.job_ids) ? invoice.job_ids.slice(0, 3).join(', ') : 'N/A'}
              </p>
              <p className="text-gray-900 dark:text-white mt-2">
                <strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="mb-8 space-y-3">
            <div className="flex justify-between text-gray-900 dark:text-white">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {(invoice.discount || 0) > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount:</span>
                <span>-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            {(invoice.tax || 0) > 0 && (
              <div className="flex justify-between text-gray-900 dark:text-white">
                <span>Tax ({((invoice.tax / subtotal) * 100).toFixed(1)}%):</span>
                <span>${invoice.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-600">
              <span>Total Due:</span>
              <span className="text-green-600">${invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Status */}
          <div className="mb-8">
            <div
              className={`p-4 rounded-lg ${
                invoice.status === 'paid'
                  ? 'bg-green-50 dark:bg-green-900 text-green-900 dark:text-green-100'
                  : invoice.status === 'overdue'
                  ? 'bg-red-50 dark:bg-red-900 text-red-900 dark:text-red-100'
                  : 'bg-yellow-50 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
              }`}
            >
              <p className="font-bold">
                Status:{' '}
                {invoice.status === 'paid'
                  ? '✅ Paid'
                  : invoice.status === 'overdue'
                  ? '⚠️ Overdue'
                  : '⏳ Awaiting Payment'}
              </p>
            </div>
          </div>

          {/* Payment Button */}
          {invoice.status !== 'paid' && (
            <div className="flex gap-4">
              <button
                onClick={handlePayment}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-lg"
              >
                {processing ? 'Processing...' : '💳 Pay Now'}
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition text-lg"
              >
                🖨️ Print
              </button>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded text-blue-900 dark:text-blue-200 text-sm">
            <p>
              <strong>💡 Demo Mode:</strong> Click "Pay Now" to simulate a payment. Configure Stripe API
              key in .env.local for real payment processing.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
