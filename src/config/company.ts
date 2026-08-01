// Per-company branding for white-label deployments.
//
// Each client company gets its own Vercel project + Supabase database.
// Set these NEXT_PUBLIC_* env vars in that Vercel project to brand their
// instance — no code changes needed. See DEPLOYMENT_PACKAGE.md.

export const company = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'AIRealSolutions Landscaping',
  tagline:
    process.env.NEXT_PUBLIC_COMPANY_TAGLINE ||
    'Professional lawn care and landscaping you can count on',
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '',
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || '',
  serviceArea: process.env.NEXT_PUBLIC_COMPANY_SERVICE_AREA || 'Serving the local area',
  emoji: process.env.NEXT_PUBLIC_COMPANY_EMOJI || '🌳',
}
