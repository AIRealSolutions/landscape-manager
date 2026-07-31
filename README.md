# 🌳 Landscape Service Manager - AI Edition

AI-powered platform for landscape companies to manage schedules, crews, customers, and billing.

## Features (Phase 1 - MVP Foundation)

✅ **Authentication & Authorization**
- Admin, Crew, and Customer roles
- Supabase Auth integration
- Session management

✅ **Admin Dashboard**
- View customer list and recent jobs
- Create new jobs and customers
- Monitor business metrics (KPIs)

✅ **Customer Portal**
- View upcoming and completed services
- Reschedule and manage services
- Track service history

✅ **Database Schema**
- Complete PostgreSQL schema with 8 tables
- Row-level security (RLS) policies
- Optimized indexes for performance

## Tech Stack

- **Frontend:** Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Deployment:** Vercel (frontend), Supabase Cloud (backend)
- **Domain:** landscaping.airealsolutions.com

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (already configured)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

Already configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key
- `NEXT_PUBLIC_APP_URL` - Application URL

### Database Setup

The SQL schema is in `supabase/migrations/001_create_schema.sql`. Apply it to your Supabase database:

1. Go to Supabase dashboard → SQL Editor
2. Create a new query
3. Paste the entire SQL file content
4. Click "Run"

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── admin/
│   │   └── dashboard/
│   ├── customer/
│   │   └── jobs/
│   ├── api/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── (UI components)
├── lib/
│   ├── supabase.ts (Supabase client)
│   └── types.ts (TypeScript types)
└── hooks/
    └── (Custom React hooks)
```

## Features by Phase

### Phase 3 ✅ (Complete - Payment & Billing)

**Invoice & Payment System**
- ✅ Automatic invoice generation on job completion
- ✅ Email invoice delivery to customers
- ✅ Stripe integration ready (add API key to unlock)
- ✅ Mock payment mode for testing
- ✅ Payment status tracking
- ✅ Tax and discount calculations
- ✅ Invoice PDF viewing

**Admin Financial Dashboard** (`/admin/financials`)
- ✅ Total revenue tracking
- ✅ Collection rate metrics
- ✅ Pending & overdue amounts
- ✅ Invoice status overview
- ✅ Average invoice value
- ✅ Recent invoice list
- ✅ Financial KPIs

**Customer Invoice Portal**
- ✅ View all invoices
- ✅ Pay invoices online
- ✅ Download invoice copies
- ✅ Track payment status
- ✅ Print invoices

### Phase 4 ✅ (Complete - AI Back-Office)

**AI Assistant** (`/admin/ai-assistant`)
- ✅ Business insights & analytics
- ✅ Revenue forecasting (3-month projections)
- ✅ Seasonal service recommendations
- ✅ Crew performance analysis
- ✅ Smart message templates
- ✅ Customer upsell suggestions
- ✅ Payment collection insights

**AI-Powered Features**
- ✅ Schedule optimization recommendations
- ✅ Crew performance scoring
- ✅ Seasonal timeline recommendations
- ✅ Message template generation
- ✅ Revenue predictions
- ✅ Customer churn prevention alerts

### Phase 2 ✅ (Complete - Notifications & Crew Mobile)

**SMS Notifications & Reminders**
- ✅ Automatic SMS sent 7 days before job
- ✅ 24-hour reminder notification
- ✅ 2-hour arrival alert
- ✅ Job completion notification
- ✅ Notification scheduling system
- ✅ Twilio integration ready (add API key)
- ✅ Webhook-based notification processor

**Crew Mobile Interface** (`/crew/jobs`)
- ✅ Assigned jobs list with details
- ✅ Job check-in with geolocation
- ✅ Job status tracking
- ✅ Photo upload for proof of work
- ✅ Job completion workflow
- ✅ Real-time status updates to customers
- ✅ Location-aware arrival notifications

**Customer Self-Service Portal**
- ✅ View all upcoming & past services
- ✅ Reschedule service requests
- ✅ Add special notes/instructions
- ✅ Job details with full information
- ✅ Payment status tracking
- ✅ Service history view

**Real-Time Updates**
- ✅ Job status changes trigger SMS alerts
- ✅ Crew check-in notifies customer
- ✅ Job completion sends invoice link
- ✅ Automatic SMS on status updates

## Phase Roadmap

### Phase 1 ✅ (Completed)
- MVP foundation with auth
- Database schema
- Admin dashboard
- Customer portal

### Phase 2 (Notifications & Tracking)
- SMS notifications (Twilio)
- Email alerts
- Job status tracking
- Crew mobile app basics

### Phase 3 (Payments & Billing)
- Stripe integration
- Automatic invoicing
- Payment collection
- Financial reporting

### Phase 4 (AI Back-Office)
- Claude AI for scheduling
- Service recommendations
- Communication templates
- Performance analytics

### Phase 5 (Advanced Features)
- Route optimization (Google Maps)
- Native mobile crew app
- Advanced customer portal
- Full-text search

## Key Features Coming Soon

🚀 **Phase 2 Priorities:**
- SMS job confirmations (7 days before)
- Photo proof of work
- One-click rescheduling
- Recurring service automation
- Crew location tracking

## Configuration

### User Roles

**Admin**
- Full access to dashboard
- Create/edit jobs and customers
- View all company data
- Manage crew assignments

**Crew**
- View assigned jobs
- Check in/out with photos
- Track location
- Submit job completion

**Customer**
- View upcoming services
- Request reschedules
- Add service notes
- View invoices

## API Routes

The app uses Supabase's REST API directly via the SDK. Future custom API routes can be added in `src/app/api/`.

## Deployment

### Deploy to Vercel

```bash
# Build
npm run build

# Deploy (via Vercel CLI or git push)
vercel deploy
```

Configure custom domain `landscaping.airealsolutions.com` in Vercel dashboard.

## Support & Feedback

For issues, improvements, or questions:
1. Check existing GitHub issues
2. Create a new issue with details
3. Contact the development team

---

**Status:** Phase 1 - MVP Foundation Complete
**Last Updated:** July 31, 2026
**Next Milestone:** Phase 2 - Notifications & Tracking
