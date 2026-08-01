import { supabase } from './supabase'

// Uploads image files to the property-photos bucket and records them in
// property_photos, tied to a customer and optionally a job.
export async function uploadJobPhotos(
  customerId: string,
  jobId: string | null,
  files: File[],
  category: 'property' | 'before' | 'after' | 'reference' | 'issue',
  caption?: string
) {
  const uploaded: string[] = []

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const path = `${customerId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(path)

    const { error: insertError } = await supabase.from('property_photos').insert([
      {
        customer_id: customerId,
        job_id: jobId,
        storage_path: path,
        url: urlData.publicUrl,
        category,
        caption: caption || null,
      },
    ])
    if (insertError) throw insertError

    uploaded.push(urlData.publicUrl)
  }

  return uploaded
}
