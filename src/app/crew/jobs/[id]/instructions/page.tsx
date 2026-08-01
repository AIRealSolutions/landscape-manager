'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadJobPhotos } from '@/lib/photos'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function CrewInstructions() {
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set())
  const [photos, setPhotos] = useState<any[]>([])
  const [togglingStep, setTogglingStep] = useState<string | null>(null)
  const [uploadingStep, setUploadingStep] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      await fetchAll()
      setLoading(false)
    }
    init()
  }, [])

  const fetchAll = async () => {
    const { data: jobData } = await supabase
      .from('jobs')
      .select('*, customers(id, name, phone)')
      .eq('id', jobId)
      .single()

    setJob(jobData)
    const cust = jobData?.customers
    if (!cust) return
    setCustomer(cust)

    // Resolve which property this job is at (legacy jobs: customer's first)
    let prop = null
    if (jobData.property_id) {
      const { data } = await supabase.from('properties').select('*').eq('id', jobData.property_id).maybeSingle()
      prop = data
    }
    if (!prop) {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('customer_id', cust.id)
        .order('created_at', { ascending: true })
        .limit(1)
      prop = data?.[0] || null
    }
    setProperty(prop)

    const stepsQuery = prop
      ? supabase.from('workflow_steps').select('*').eq('property_id', prop.id).order('step_order', { ascending: true })
      : supabase.from('workflow_steps').select('*').eq('customer_id', cust.id).order('step_order', { ascending: true })
    const photosQuery = prop
      ? supabase.from('property_photos').select('*').eq('property_id', prop.id).order('created_at', { ascending: false })
      : supabase.from('property_photos').select('*').eq('customer_id', cust.id).order('created_at', { ascending: false })

    const [{ data: stepRows }, { data: completions }, { data: photoRows }] = await Promise.all([
      stepsQuery,
      supabase.from('job_step_completions').select('step_id').eq('job_id', jobId),
      photosQuery,
    ])

    setSteps(stepRows || [])
    setCompletedStepIds(new Set((completions || []).map((c) => c.step_id)))
    setPhotos(photoRows || [])
  }

  const toggleStep = async (stepId: string) => {
    setTogglingStep(stepId)
    setError(null)
    try {
      if (completedStepIds.has(stepId)) {
        const { error: deleteError } = await supabase
          .from('job_step_completions')
          .delete()
          .eq('job_id', jobId)
          .eq('step_id', stepId)
        if (deleteError) throw deleteError
        setCompletedStepIds((prev) => {
          const next = new Set(prev)
          next.delete(stepId)
          return next
        })
      } else {
        const { error: insertError } = await supabase
          .from('job_step_completions')
          .insert([{ job_id: jobId, step_id: stepId }])
        if (insertError) throw insertError
        setCompletedStepIds((prev) => new Set(prev).add(stepId))
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update step')
    } finally {
      setTogglingStep(null)
    }
  }

  const handleStepPhoto = async (step: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploadingStep(step.id)
    setError(null)
    try {
      await uploadJobPhotos(customer.id, property?.id ?? null, jobId, files, 'after', `Step: ${step.title}`)
      await fetchAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to upload photo')
    } finally {
      setUploadingStep(null)
      e.target.value = ''
    }
  }

  const stepHasPhoto = (step: any) =>
    photos.some((p) => p.job_id === jobId && p.caption === `Step: ${step.title}`)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!job || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Job not found</p>
        <Link href="/crew/jobs" className="text-blue-600 hover:text-blue-700">
          Back to Jobs
        </Link>
      </div>
    )
  }

  const doneCount = steps.filter((s) => completedStepIds.has(s.id)).length
  const progressPct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0
  const allDone = steps.length > 0 && doneCount === steps.length
  const referencePhotos = photos.filter((p) => p.category === 'reference' || p.category === 'issue')
  const totalMinutes = steps.reduce((sum, s) => sum + (s.estimated_minutes || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <nav className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-600">📋 Work Instructions</h1>
          <Link href={`/crew/jobs/${jobId}`} className="text-blue-600 hover:text-blue-700 text-sm">
            Job Details
          </Link>
        </div>
        {steps.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>
                {doneCount} of {steps.length} steps done
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Property header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
          {property && (
            <p className="text-sm font-medium text-green-700 mt-0.5">🏡 {property.label}</p>
          )}
          <p className="text-gray-600 mt-1">📍 {property?.address || 'No address on file'}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full capitalize">
              {property?.property_type || 'residential'}
            </span>
            {property?.lot_size && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                Lot: {property.lot_size}
              </span>
            )}
            {property?.lawn_area_sqft && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                Lawn: {property.lawn_area_sqft.toLocaleString()} sq ft
              </span>
            )}
            {totalMinutes > 0 && (
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                ⏱ ~{totalMinutes} min total
              </span>
            )}
          </div>
          {property?.property_notes && (
            <div className="mt-4 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
              <p className="text-xs font-bold text-amber-800 uppercase mb-1">⚠️ Know Before You Start</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{property.property_notes}</p>
            </div>
          )}
        </div>

        {/* Reference / issue photos */}
        {referencePhotos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">🎯 Reference — What the Customer Wants</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {referencePhotos.map((photo) => (
                <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption || 'Reference'} className="w-full h-28 object-cover" />
                  <div className="p-1.5 bg-white">
                    <span className={`text-xs capitalize ${photo.category === 'issue' ? 'text-red-600' : 'text-green-700'}`}>
                      {photo.category === 'issue' ? '⚠️ issue' : '🎯 goal'}
                    </span>
                    {photo.caption && <p className="text-xs text-gray-600 truncate">{photo.caption}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Workflow steps */}
        {steps.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-600">
              No workflow has been set up for this property yet. Follow the job's key aspects and special
              instructions on the job details page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 px-1">Work Through Each Step</h3>
            {steps.map((step, index) => {
              const done = completedStepIds.has(step.id)
              return (
                <div
                  key={step.id}
                  className={`bg-white rounded-xl shadow-sm border p-5 transition ${
                    done ? 'border-green-300 bg-green-50/50' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleStep(step.id)}
                      disabled={togglingStep === step.id}
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition ${
                        done
                          ? 'bg-green-600 text-white'
                          : 'bg-white border-2 border-gray-300 text-gray-500 hover:border-green-500'
                      }`}
                      title={done ? 'Mark as not done' : 'Mark as done'}
                    >
                      {done ? '✓' : index + 1}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-lg ${done ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {step.title}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {step.area && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                            📍 {step.area}
                          </span>
                        )}
                        {step.estimated_minutes && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                            ⏱ ~{step.estimated_minutes} min
                          </span>
                        )}
                      </div>
                      {step.instructions && (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{step.instructions}</p>
                      )}
                      {step.requires_photo && (
                        <div className="mt-3 flex items-center gap-3">
                          <label
                            className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
                              stepHasPhoto(step)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {uploadingStep === step.id
                              ? 'Uploading...'
                              : stepHasPhoto(step)
                              ? '📷 Photo saved — add another'
                              : '📷 Photo required — take one'}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              multiple
                              onChange={(e) => handleStepPhoto(step, e)}
                              disabled={uploadingStep === step.id}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Job-specific extras */}
        {(job.key_aspects?.length > 0 || job.completion_criteria || job.notes) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h3 className="font-bold text-gray-900">This Visit — Extra Requirements</h3>
            {job.key_aspects?.length > 0 && (
              <ul className="space-y-1">
                {job.key_aspects.map((aspect: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700">✔ {aspect}</li>
                ))}
              </ul>
            )}
            {job.completion_criteria && (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                <p className="text-xs font-bold text-purple-800 uppercase mb-1">🎯 What Done Looks Like</p>
                <p className="text-sm text-purple-900 whitespace-pre-wrap">{job.completion_criteria}</p>
              </div>
            )}
            {job.notes && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-xs font-bold text-blue-800 uppercase mb-1">📝 Notes</p>
                <p className="text-sm text-blue-900 whitespace-pre-wrap">{job.notes}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sticky bottom action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          {job.status === 'in-progress' ? (
            <Link
              href={`/crew/jobs/${jobId}/complete`}
              className={`flex-1 px-6 py-3 font-bold rounded-lg text-center transition ${
                allDone || steps.length === 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {allDone || steps.length === 0
                ? '✅ All Steps Done — Complete Job'
                : `Complete Job (${steps.length - doneCount} steps left)`}
            </Link>
          ) : job.status === 'scheduled' || job.status === 'confirmed' ? (
            <Link
              href={`/crew/jobs/${jobId}/checkin`}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 text-center transition"
            >
              ▶️ Check In to Start
            </Link>
          ) : (
            <div className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-lg text-center">
              ✔️ Job Completed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
