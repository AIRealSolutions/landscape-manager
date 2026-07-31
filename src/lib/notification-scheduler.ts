import { supabase } from './supabase'

export interface JobNotificationSchedule {
  jobId: string
  customerId: string
  customerPhone: string
  customerName: string
  scheduledDate: string
  startTime: string
  serviceName: string
}

export async function scheduleJobNotifications(job: JobNotificationSchedule) {
  const jobDate = new Date(job.scheduledDate)

  const schedules = [
    {
      stage: 'confirmation',
      hoursOffset: 168, // 7 days before
      message: `Hi ${job.customerName}, we have you scheduled for ${job.serviceName} on ${jobDate.toLocaleDateString()} at ${job.startTime}. Confirm or reschedule: [link]`,
    },
    {
      stage: 'reminder-24h',
      hoursOffset: 24, // 24 hours before
      message: `Reminder: Your ${job.serviceName} is tomorrow at ${job.startTime}. Our crew will arrive on time!`,
    },
    {
      stage: 'reminder-2h',
      hoursOffset: 2, // 2 hours before
      message: `Our crew is on the way! ETA in approximately 2 hours. Get ready!`,
    },
  ]

  for (const schedule of schedules) {
    const notificationTime = new Date(jobDate)
    notificationTime.setHours(notificationTime.getHours() - schedule.hoursOffset)

    try {
      await supabase.from('notifications').insert([
        {
          job_id: job.jobId,
          customer_id: job.customerId,
          type: 'sms',
          message: schedule.message,
          scheduled_at: notificationTime.toISOString(),
          status: 'pending',
        },
      ])
    } catch (error) {
      console.error(`Error scheduling ${schedule.stage} notification:`, error)
    }
  }
}

export async function sendPendingNotifications() {
  try {
    const now = new Date().toISOString()

    const { data: pendingNotifications } = await supabase
      .from('notifications')
      .select('*, customers(phone)')
      .eq('status', 'pending')
      .lte('scheduled_at', now)

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return
    }

    for (const notification of pendingNotifications) {
      if (notification.customers?.phone) {
        try {
          const response = await fetch('/api/notifications/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: notification.customers.phone,
              message: notification.message,
              jobId: notification.job_id,
              customerId: notification.customer_id,
            }),
          })

          if (response.ok) {
            await supabase
              .from('notifications')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
              .eq('id', notification.id)
          }
        } catch (error) {
          console.error(`Error sending notification ${notification.id}:`, error)
          await supabase
            .from('notifications')
            .update({ status: 'failed' })
            .eq('id', notification.id)
        }
      }
    }
  } catch (error) {
    console.error('Error in sendPendingNotifications:', error)
  }
}
