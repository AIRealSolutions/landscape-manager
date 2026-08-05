import { supabase } from '@/lib/supabase'
import { GRASS_TYPES } from '@/data/education'

export interface PropertyIntake {
  customerName: string
  customerEmail: string
  customerPhone?: string
  address: string
  propertySize: 'small' | 'medium' | 'large' | 'very_large'
  grassType?: string // slug
  currentCondition: 'perfect' | 'good' | 'fair' | 'poor'
  issues: string[] // weeds, bare_spots, compaction, thin, moss, thatch
  serviceLevel: 'basic' | 'standard' | 'premium'
  availability?: string
}

export interface RecommendedService {
  name: string
  description: string
  frequency: string
  estimatedCost: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  reason: string
}

// Generate service recommendations based on property details
export function generateRecommendations(intake: PropertyIntake): RecommendedService[] {
  let recommendations: RecommendedService[] = []
  const grass = GRASS_TYPES.find((g) => g.slug === intake.grassType)

  // 1. Regular mowing (always needed)
  recommendations.push({
    name: 'Regular Mowing',
    description: `Weekly mowing at ${grass?.mowingHeight || '3 inches'}`,
    frequency: 'Weekly',
    estimatedCost: 50,
    priority: 'critical',
    reason: 'Foundation of lawn care - keeps grass healthy and prevents weeds.',
  })

  // 2. Weeds present - recommend pre-emergent + treatment
  if (intake.issues.includes('weeds')) {
    recommendations.push({
      name: 'Weed Prevention Program',
      description: 'Pre-emergent application + spot treatments',
      frequency: 'Spring (pre-emergent) + as needed',
      estimatedCost: 35,
      priority: 'high',
      reason: 'Pre-emergent timing is critical - must apply when soil hits 55°F.',
    })
  }

  // 3. Bare spots or thin lawn - aeration & overseeding
  if (intake.issues.includes('bare_spots') || intake.issues.includes('thin')) {
    recommendations.push({
      name: 'Aeration & Overseeding',
      description: 'Core aeration + seed mix for bare/thin areas',
      frequency: 'Fall (best) or spring',
      estimatedCost: 200,
      priority: 'high',
      reason: 'Best time is fall - aerates to relieve compaction and fills bare spots.',
    })
  }

  // 4. Compaction issues
  if (intake.issues.includes('compaction')) {
    recommendations.push({
      name: 'Aeration Service',
      description: 'Core aeration to relieve soil compaction',
      frequency: 'Annual or every 2 years',
      estimatedCost: 150,
      priority: 'high',
      reason: 'Compaction blocks water, nutrients, and root growth.',
    })
  }

  // 5. Fertilization based on condition
  if (intake.currentCondition === 'poor' || intake.currentCondition === 'fair') {
    recommendations.push({
      name: 'Fertilization Program',
      description: 'Seasonal feeding (3-4x per year)',
      frequency: 'Spring, summer, fall + winter',
      estimatedCost: 40,
      priority: 'high',
      reason: 'Feeding is critical for recovery - builds thick turf to outcompete weeds.',
    })
  } else if (intake.currentCondition === 'good') {
    recommendations.push({
      name: 'Fertilization Program',
      description: 'Maintenance feeding (2-3x per year)',
      frequency: 'Spring, fall + optional summer',
      estimatedCost: 25,
      priority: 'medium',
      reason: 'Keeps grass looking great and prevents decline.',
    })
  }

  // 6. Moss suggests poor drainage or shade
  if (intake.issues.includes('moss')) {
    recommendations.push({
      name: 'Drainage Assessment',
      description: 'Evaluate drainage, shade, and soil pH',
      frequency: 'One-time consultation',
      estimatedCost: 100,
      priority: 'high',
      reason: 'Moss indicates conditions grass dislikes - need to fix root cause.',
    })
  }

  // 7. Thatch removal if present
  if (intake.issues.includes('thatch')) {
    recommendations.push({
      name: 'Dethatching',
      description: 'Remove built-up dead grass layer',
      frequency: 'As needed (spring or fall)',
      estimatedCost: 120,
      priority: 'medium',
      reason: 'Thatch blocks water and nutrients from reaching roots.',
    })
  }

  // Service level adjustments
  if (intake.serviceLevel === 'premium') {
    recommendations = recommendations.map((rec) => ({
      ...rec,
      estimatedCost: rec.estimatedCost * 1.25,
    }))
  } else if (intake.serviceLevel === 'basic') {
    // Filter to just critical/high for basic plan
    return recommendations.filter((rec) => rec.priority === 'critical' || rec.priority === 'high')
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// Calculate total estimated monthly cost
export function calculateTotalMonthlyCost(recommendations: RecommendedService[]): number {
  return recommendations.reduce((sum, rec) => {
    // Convert annual/seasonal costs to monthly average
    let monthlyCost = 0
    if (rec.frequency === 'Weekly') monthlyCost = rec.estimatedCost * 4.3
    else if (rec.frequency.includes('Spring') || rec.frequency.includes('Fall')) monthlyCost = rec.estimatedCost / 6
    else if (rec.frequency.includes('Annual')) monthlyCost = rec.estimatedCost / 12
    else if (rec.frequency.includes('One-time')) monthlyCost = rec.estimatedCost / 24 // spread over 2 years
    else monthlyCost = rec.estimatedCost

    return sum + monthlyCost
  }, 0)
}

// Submit intake form and get recommendations
// Single-tenant: automatically uses the one company in the database
export async function submitPropertyIntake(intake: PropertyIntake) {
  const recommendations = generateRecommendations(intake)
  const estimatedMonthlyCost = calculateTotalMonthlyCost(recommendations)

  const { data, error } = await supabase.rpc('submit_property_intake', {
    p_customer_name: intake.customerName,
    p_customer_email: intake.customerEmail,
    p_customer_phone: intake.customerPhone || null,
    p_address: intake.address,
    p_property_size: intake.propertySize,
    p_grass_type: intake.grassType || null,
    p_current_condition: intake.currentCondition,
    p_issues: intake.issues,
    p_service_level: intake.serviceLevel,
    p_availability: intake.availability || null,
  })

  if (error) throw error

  return {
    intakeId: data.intake_id,
    recommendations,
    estimatedMonthlyCost,
  }
}
