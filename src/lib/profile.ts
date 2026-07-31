import { supabase } from './supabase'

// Returns the signed-in user's company_id. On first use (right after
// signup) the users-table row and company don't exist yet, so create them.
export async function getOrCreateCompanyId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('You must be signed in')

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profile?.company_id) return profile.company_id

  const companyName = session.user.email
    ? `${session.user.email.split('@')[0]}'s Company`
    : 'My Company'

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert([{ name: companyName }])
    .select()
    .single()
  if (companyError) throw companyError

  const { error: userError } = await supabase.from('users').upsert([
    {
      id: session.user.id,
      email: session.user.email ?? '',
      role: 'admin',
      company_id: company.id,
    },
  ])
  if (userError) throw userError

  return company.id
}
