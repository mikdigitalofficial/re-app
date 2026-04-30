# PROJECT_NAME

Premium SaaS CRM for Dubai real estate brokers, agencies, and off-plan sales teams.

## Features

- Email login/signup with Supabase Auth
- Lead management CRM
- Pipeline Kanban
- One-click WhatsApp templates
- Follow-up reminders
- Smart dashboard metrics
- Hot Lead Score
- AI-style sales assistant prompts
- CSV export and reports
- Company branding, agents, templates
- Off-plan launch tracker
- Ads Lead Sync CRM for Meta, Google, portals, website forms, and WhatsApp click leads
- Campaign CPL, close rate, ROI, best/worst campaign, speed-to-lead analytics

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

If `.env.local` is not configured, the app runs in demo mode with sample data.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add your Supabase URL and anon key.
5. Enable Email auth in Supabase.
6. Optional: edit `supabase/seed.sql`, replace the demo UUID with a real `auth.users.id`, then run it.

## Deploy to Vercel

1. Push this project to GitHub.
2. Import it in Vercel.
3. Add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
LEAD_SYNC_WEBHOOK_SECRET
```

4. Deploy.

## Notes

The app includes a production-ready Supabase schema with row level security. It runs in instant demo mode without environment variables, and switches to Supabase Auth plus core lead CRUD when keys are configured. Lead creation, pipeline status updates, and last-contacted updates are wired to Supabase.

## Ads Lead Sync

Webhook endpoints:

```bash
POST /api/webhooks/meta
POST /api/webhooks/google
POST /api/webhooks/website
```

Send the header:

```bash
x-lead-sync-secret: your LEAD_SYNC_WEBHOOK_SECRET
```

Minimum payload:

```json
{
  "userId": "supabase-auth-user-id",
  "name": "Buyer Name",
  "phone": "+971500000000",
  "email": "buyer@example.com",
  "campaign_name": "Palm Luxury Leads",
  "adset_name": "GCC Buyers",
  "ad_name": "Instant Form A",
  "budget": 2500000,
  "interested_area": "Palm Jumeirah",
  "property_type": "Apartment",
  "timeline": "0-30 days",
  "nationality": "UAE",
  "language": "Arabic",
  "utm_source": "facebook"
}
```

Meta Lead Ads, Google Lead Form Extensions, Zapier, Make, and n8n can all post to these endpoints. Portal leads can be imported from Bayut, Property Finder, and Dubizzle CSV files in the Ads Lead Sync screen.
