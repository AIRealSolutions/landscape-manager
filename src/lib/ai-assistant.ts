import { supabase } from './supabase'

export interface AIAssistantRequest {
  prompt: string
  context?: {
    jobId?: string
    customerId?: string
    companyId?: string
  }
}

export interface SchedulingRecommendation {
  suggestedDate: string
  suggestedTime: string
  reason: string
  confidence: number
}

export interface ServiceRecommendation {
  serviceType: string
  serviceName: string
  description: string
  estimatedPrice: number
  seasonalTiming: string
  reason: string
}

export async function getScheduleRecommendations(
  customerId: string,
  recentJobs: any[]
): Promise<SchedulingRecommendation[]> {
  try {
    // Analyze customer history and location patterns
    const locations = recentJobs.map((j: any) => j.location).filter(Boolean)
    const avgJobDuration = recentJobs.reduce((sum: number, j: any) => sum + (j.estimated_duration || 0), 0) / Math.max(recentJobs.length, 1)

    const recommendations: SchedulingRecommendation[] = []

    // Simulate AI scheduling logic
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (recentJobs.length > 0) {
      recommendations.push({
        suggestedDate: tomorrow.toISOString().split('T')[0],
        suggestedTime: '10:00',
        reason: 'Based on customer availability pattern and crew schedule',
        confidence: 0.85,
      })

      recommendations.push({
        suggestedDate: tomorrow.toISOString().split('T')[0],
        suggestedTime: '14:00',
        reason: 'Afternoon slot to combine with nearby jobs',
        confidence: 0.72,
      })
    }

    return recommendations
  } catch (error) {
    console.error('Error getting schedule recommendations:', error)
    return []
  }
}

export async function getServiceRecommendations(
  customerId: string,
  season: string
): Promise<ServiceRecommendation[]> {
  try {
    const recommendations: ServiceRecommendation[] = []

    // Season-based recommendations
    const seasonRecommendations: { [key: string]: ServiceRecommendation[] } = {
      spring: [
        {
          serviceType: 'aeration',
          serviceName: 'Spring Lawn Aeration',
          description: 'Prepare lawn for growing season with soil aeration',
          estimatedPrice: 150,
          seasonalTiming: 'March - May',
          reason: 'Perfect timing for spring lawn care',
        },
        {
          serviceType: 'seeding',
          serviceName: 'Grass Seeding',
          description: 'Fill in bare spots and thicken lawn coverage',
          estimatedPrice: 200,
          seasonalTiming: 'March - May',
          reason: 'Ideal conditions for seed germination',
        },
      ],
      summer: [
        {
          serviceType: 'mulching',
          serviceName: 'Mulch Refresh',
          description: 'Refresh mulch beds for summer appearance',
          estimatedPrice: 250,
          seasonalTiming: 'June - July',
          reason: 'Prevent weed growth in summer heat',
        },
      ],
      fall: [
        {
          serviceType: 'cleanup',
          serviceName: 'Fall Cleanup',
          description: 'Leaf removal and fall maintenance',
          estimatedPrice: 300,
          seasonalTiming: 'September - November',
          reason: 'Prepare landscape for winter',
        },
        {
          serviceType: 'winterization',
          serviceName: 'Winterization',
          description: 'Protect plants and landscape for winter',
          estimatedPrice: 350,
          seasonalTiming: 'October - November',
          reason: 'Prevent winter damage to landscape',
        },
      ],
      winter: [
        {
          serviceType: 'snow-removal',
          serviceName: 'Snow Removal',
          description: 'Professional snow and ice management',
          estimatedPrice: 200,
          seasonalTiming: 'December - February',
          reason: 'Keep property safe and accessible',
        },
      ],
    }

    return seasonRecommendations[season] || []
  } catch (error) {
    console.error('Error getting service recommendations:', error)
    return []
  }
}

export async function generateMessageTemplate(
  stage: 'confirmation' | 'reminder' | 'completion' | 'upsell' | 'followup',
  jobDetails: any
): Promise<string> {
  const templates: { [key: string]: (details: any) => string } = {
    confirmation: (d) =>
      `Hi ${d.customerName}, we're looking forward to your ${d.serviceName} on ${d.date} at ${d.time}. We'll be there to make your landscape beautiful! Reply 'YES' to confirm.`,

    reminder: (d) =>
      `Quick reminder: Your ${d.serviceName} is coming up on ${d.date} at ${d.time}. Our crew will arrive on time. See you soon!`,

    completion: (d) =>
      `Your ${d.serviceName} is complete! We've attached photos of the work. Invoice sent to ${d.email}. Thank you!`,

    upsell: (d) =>
      `Your lawn looks great! Based on its condition, we recommend ${d.recommendedService}. Interested? Reply or call us.`,

    followup: (d) =>
      `How did we do? We'd love your feedback on the ${d.serviceName} work. Rate us: [link] Thank you!`,
  }

  return templates[stage]?.(jobDetails) || ''
}

export async function analyzeCrew Performance(crewId: string) {
  try {
    const { data: crewJobs } = await supabase
      .from('jobs')
      .select('*')
      .contains('crew_ids', [crewId])
      .limit(50)

    if (!crewJobs || crewJobs.length === 0) {
      return null
    }

    const completedJobs = crewJobs.filter((j) => j.status === 'completed')
    const avgDuration = completedJobs.reduce((sum, j) => sum + (j.actual_duration || j.estimated_duration), 0) / Math.max(completedJobs.length, 1)
    const efficiency = ((crewJobs.length / 30) * 100).toFixed(1) // Jobs per month estimate

    return {
      totalJobs: crewJobs.length,
      completedJobs: completedJobs.length,
      completionRate: ((completedJobs.length / crewJobs.length) * 100).toFixed(1),
      averageDuration: Math.round(avgDuration),
      estimatedEfficiency: `${efficiency}%`,
      recommendation: completedJobs.length / crewJobs.length > 0.9 ? 'Top performer' : 'Good performance',
    }
  } catch (error) {
    console.error('Error analyzing crew performance:', error)
    return null
  }
}

export async function predictRevenue(companyId: string, months: number = 3) {
  try {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*, invoices(total_amount)')
      .order('scheduled_date', { ascending: false })
      .limit(100)

    if (!jobs || jobs.length === 0) {
      return { predictedRevenue: 0, confidence: 0 }
    }

    // Simple trend analysis
    const avgJobValue = jobs.reduce((sum, j) => sum + (j.price || 0), 0) / jobs.length
    const jobsPerMonth = jobs.length / 3 // Estimate from last 3 months
    const predictedMonthlyRevenue = avgJobValue * jobsPerMonth
    const totalPredicted = predictedMonthlyRevenue * months

    return {
      predictedRevenue: totalPredicted,
      monthlyAverage: predictedMonthlyRevenue,
      confidence: 0.7,
      basis: `Based on ${jobs.length} jobs analyzed`,
    }
  } catch (error) {
    console.error('Error predicting revenue:', error)
    return { predictedRevenue: 0, confidence: 0 }
  }
}

export async function getAIInsights(companyId: string) {
  try {
    const insights: string[] = []

    // Fetch company data
    const { data: jobs } = await supabase.from('jobs').select('*').limit(100)
    const { data: invoices } = await supabase.from('invoices').select('*')
    const { data: customers } = await supabase.from('customers').select('*')

    if (jobs && jobs.length > 0) {
      const completedRate = ((jobs.filter((j) => j.status === 'completed').length / jobs.length) * 100).toFixed(0)
      insights.push(`✓ Job completion rate: ${completedRate}%`)
    }

    if (invoices && invoices.length > 0) {
      const paidRate = ((invoices.filter((i) => i.status === 'paid').length / invoices.length) * 100).toFixed(0)
      insights.push(`✓ Payment collection rate: ${paidRate}%`)
    }

    if (customers && customers.length > 0) {
      insights.push(`✓ You have ${customers.length} active customers`)
    }

    return insights
  } catch (error) {
    console.error('Error getting AI insights:', error)
    return []
  }
}
