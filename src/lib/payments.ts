import { supabase } from './supabase'

export interface InvoicePayload {
  customer_id: string
  job_ids: string[]
  total_amount: number
  tax?: number
  discount?: number
  due_date: string
}

export interface PaymentPayload {
  invoice_id: string
  amount: number
  payment_method: string
  stripe_payment_intent_id?: string
}

export async function createInvoice(payload: InvoicePayload) {
  try {
    const tax = payload.tax || 0
    const discount = payload.discount || 0

    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          customer_id: payload.customer_id,
          job_ids: payload.job_ids,
          total_amount: payload.total_amount,
          tax,
          discount,
          due_date: payload.due_date,
          status: 'draft',
        },
      ])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error creating invoice:', error)
    throw error
  }
}

export async function sendInvoice(invoiceId: string) {
  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, customers(name, email, phone)')
      .eq('id', invoiceId)
      .single()

    if (error) throw error

    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()

    if (updateError) throw updateError

    // Send email notification
    if (invoice?.customers?.email) {
      await fetch('/api/payments/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          email: invoice.customers.email,
          customerName: invoice.customers.name,
          amount: invoice.total_amount,
        }),
      })
    }

    return updated?.[0]
  } catch (error) {
    console.error('Error sending invoice:', error)
    throw error
  }
}

export async function processPayment(payload: PaymentPayload) {
  try {
    const { data, error } = await supabase.from('invoices').select('*').eq('id', payload.invoice_id).single()

    if (error) throw error

    const paymentResponse = await fetch('/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!paymentResponse.ok) {
      throw new Error('Payment processing failed')
    }

    const paymentData = await paymentResponse.json()

    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        payment_method: payload.payment_method,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.invoice_id)

    return paymentData
  } catch (error) {
    console.error('Error processing payment:', error)
    throw error
  }
}

export async function getCustomerInvoices(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching invoices:', error)
    throw error
  }
}

export async function getInvoiceDetails(invoiceId: string) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(name, email, phone, address), jobs(*)')
      .eq('id', invoiceId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching invoice:', error)
    throw error
  }
}

export function calculateTax(amount: number, taxRate: number = 0.08): number {
  return parseFloat((amount * taxRate).toFixed(2))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
