import { supabase } from './supabase'

export interface NotificationPayload {
  job_id: string
  customer_id: string
  type: 'sms' | 'email' | 'push'
  message: string
  scheduled_at?: string
}

export async function createNotification(payload: NotificationPayload) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          job_id: payload.job_id,
          customer_id: payload.customer_id,
          type: payload.type,
          message: payload.message,
          scheduled_at: payload.scheduled_at,
          status: 'pending',
        },
      ])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function sendSmsNotification(
  phone: string,
  message: string,
  jobId: string,
  customerId: string
) {
  try {
    const response = await fetch('/api/notifications/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        message,
        jobId,
        customerId,
      }),
    })

    if (!response.ok) throw new Error('Failed to send SMS')
    const data = await response.json()

    await supabase
      .from('notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', data.notificationId)

    return data
  } catch (error) {
    console.error('Error sending SMS:', error)
    throw error
  }
}

export async function getJobNotifications(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }
}

export function generateJobNotificationMessage(
  stage: 'confirmation' | 'reminder-24h' | 'reminder-2h' | 'arrival' | 'completion' | 'invoice',
  jobDetails: any
): string {
  const messages: { [key: string]: string } = {
    confirmation: `Hi ${jobDetails.customerName}, we have you scheduled for ${jobDetails.serviceName} on ${jobDetails.date} at ${jobDetails.time}. Confirm or reschedule: [link]`,
    'reminder-24h': `Reminder: Your ${jobDetails.serviceName} is tomorrow at ${jobDetails.time}. Our crew will arrive on time!`,
    'reminder-2h': `Our crew is on the way! ETA: ${jobDetails.eta}. See you soon!`,
    arrival: `We've arrived at your property! Your ${jobDetails.serviceName} is starting now.`,
    completion: `All done! Your ${jobDetails.serviceName} is complete. Check photos: [link] Invoice: [link]`,
    invoice: `Your invoice for ${jobDetails.serviceName} is ready! Pay online: [link]`,
  }
  return messages[stage] || ''
}
