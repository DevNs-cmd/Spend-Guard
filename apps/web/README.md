# SpendGuard Web Frontend (`apps/web`)

**Owner:** Anuj (Frontend Lead)  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Lucide Icons · Recharts

SpendGuard is an enterprise AI API cost tracker and budget guardrail platform designed to give engineering and finance teams real-time visibility into LLM consumption (OpenAI, Anthropic, Gemini, Mistral, Azure, Bedrock).

---

## 1. What's Done

All 16 routes and functional requirements specified in the project specification have been built and verified:

### Definition of Done & Verification Summary

| Requirement / Criterion | Status | Verification Result |
| :--- | :---: | :--- |
| **All 10 Core Views Built** | **Completed** | Overview, Providers, Usage, Budgets, Alerts, Analytics, Recommendations, Reports, Billing, Settings. |
| **Auth-Gated Route Protection** | **Completed** | Next.js Edge Middleware (`middleware.ts`) automatically gates dashboard routes and redirects to `/login`. |
| **No Blank Screens (Loading/Empty/Error)** | **Completed** | Loading skeletons, empty states, and root/dashboard error boundaries (`error.tsx`, `not-found.tsx`). |
| **New User Onboarding Wizard** | **Completed** | Dedicated 5-step onboarding wizard at `/onboarding` (Welcome $\rightarrow$ Provider $\rightarrow$ Budget $\rightarrow$ Team $\rightarrow$ Ready). |
| **UX Safeguards & Feedback** | **Completed** | Toast notifications on all mutations + confirmation dialogs for destructive actions. |
| **Data Exploration Controls** | **Completed** | Usage and Analytics pages have 25-item pagination, multi-column sorting, 7d/30d/90d range filters, and CSV export. |
| **Zero Console/Runtime Errors** | **Completed** | Verified end-to-end via automated Chrome browser testing. |
| **Production Build Verification** | **Completed** | `npm run build` passes with **0 errors** across all 16 static routes. |

### Core Pages & Features
- **Authentication & Route Protection (`/login`, `/signup`):**
  - Next.js Edge Middleware (`middleware.ts`) automatically guards all dashboard routes. Unauthenticated visitors are redirected to `/login?redirect=...`.
  - Clean 2-step registration (Organization Name $\rightarrow$ Full Name, Email, Password).
  - Secure session cookie lifecycle (`lib/auth.ts`) with immediate logout action in the sidebar.
- **5-Step Onboarding Wizard (`/onboarding`):**
  - Guided first-time setup for newly registered organizations:
    1. **Welcome:** High-level platform capabilities overview.
    2. **Connect First AI Provider:** API key input with encryption notices and instant connection feedback.
    3. **Set Initial Budget:** Configure budget name, soft alert threshold, and hard spending cap.
    4. **Invite Team:** Add team members with specific roles (`Admin`, `Member`, `Viewer`).
    5. **Summary & Launch:** Workspace configuration summary with direct entry to the dashboard.
- **Overview Dashboard (`/`):**
  - KPI Stat Cards: Total Spend, Total Requests, Total Tokens, Avg Cost per Request.
  - Active alert banner with quick link to unresolved incidents.
  - Spend Over Time time-series chart with interactive `7d / 30d / 90d` range selectors.
  - Cost by Model proportional breakdown.
  - Dynamic "Last updated" timestamp with manual refresh trigger.
  - Contextual empty state banner for fresh organizations without usage data.
- **AI Providers Management (`/providers`):**
  - Connection status monitoring (`Active`, `Syncing`, `Disconnected`, `Error`).
  - Real-time provider sync trigger with spinner animation and toast feedback.
  - "+ Connect Provider" modal supporting OpenAI, Anthropic, Gemini, Mistral, Azure, and Bedrock.
  - Destructive provider disconnect action guarded by a confirmation dialog.
- **Usage & Cost Explorer (`/usage`):**
  - Daily token consumption chart (input vs. output tokens).
  - Multi-attribute real-time search across models, users, and projects.
  - Provider and project filter dropdowns + `7d / 30d / 90d` quick range filters.
  - Interactive table column sorting (Time, Provider, Model, Cost).
  - Client-side pagination (25 records per page with Previous / Next navigation).
  - One-click CSV export generating formatted consumption reports.
- **Budgets & Guardrails (`/budgets`):**
  - Dual-threshold visual progress bars (soft alert threshold in amber, hard limit in red).
  - Budget creation modal (Organization, Project, or Team scope).
  - Budget editing modal.
  - Budget deletion action with confirmation dialog and toast notification.
- **Alerts Feed (`/alerts`):**
  - Alert severity filters (Critical, Warning, Info).
  - Alert acknowledgment action with dynamic state update and toast feedback.
- **Analytics & Efficiency (`/analytics`):**
  - Spend trends and anomaly detection feeds.
  - Cost Efficiency by Model table with sortable columns.
- **Recommendations (`/recommendations`):**
  - Cost optimization cards with projected savings and action buttons.
- **Reports Builder (`/reports`):**
  - Scheduled report management (Daily, Weekly, Monthly).
  - Report creation modal, pause/resume toggle, and report download triggers.
- **Billing (`/billing`):**
  - Active subscription tier details, usage quotas, and Stripe Customer Portal mock.
- **Settings Admin (`/settings`):**
  - **General:** Workspace name, timezone configuration.
  - **Members:** Team member list, role indicators, and Invite Member modal with remove confirmation.
  - **Tags:** Tag key-value creation, usage counts, and tag deletion confirmation.
  - **Notifications:** Email alerts toggle, recipient email, Slack incoming webhook URL, severity threshold (`All`, `Warning & Critical`, `Critical Only`), and weekly spend digest toggle.
- **Safety & Error Primitives:**
  - `components/ui/toast.tsx`: Toast notification system for mutation feedback.
  - `components/ui/confirm-dialog.tsx`: Reusable modal safeguard for destructive actions.
  - `app/error.tsx` & `app/(dashboard)/error.tsx`: Root and dashboard error boundaries ("no blank screens").
  - `app/not-found.tsx`: Custom 404 page.

---

## 2. Architecture & Application Workflow

### Architecture Overview
```
apps/web/
├── app/
│   ├── (auth)/             # Login & 2-step Signup
│   ├── (onboarding)/       # 5-step post-signup guided wizard
│   ├── (dashboard)/        # Main dashboard shell (Sidebar + 10 feature views)
│   ├── error.tsx           # Application error boundary
│   └── not-found.tsx       # Custom 404 handler
├── components/
│   ├── charts/             # Recharts line & area charts
│   ├── dashboard/          # Sidebar, StatCard, and shell components
│   └── ui/                 # Toast and ConfirmDialog primitives
├── lib/
│   ├── api-client.ts       # Typed API client with live/mock fallback
│   ├── auth.ts             # Cookie-based session helpers
│   └── utils.ts            # Currency, token compacting, and date formatters
└── middleware.ts           # Next.js Edge route protection
```

### End-to-End User Journey
1. **First-time User Flow:**
   - User navigates to `/` $\rightarrow$ Middleware intercepts unauthenticated user $\rightarrow$ Redirects to `/login`.
   - User clicks **Sign up** $\rightarrow$ Fills Organization Name $\rightarrow$ Enters Name, Email, Password.
   - User lands in `/onboarding` $\rightarrow$ Walks through Provider connection, Budget setup, and Team invitation.
   - User clicks **Go to Dashboard** $\rightarrow$ Arrives at `/` with active session and workspace ready.
2. **Daily Monitoring Flow:**
   - User checks Overview KPI cards and Spend Over Time chart.
   - Unresolved alerts in the banner navigate directly to `/alerts` where they can be acknowledged.
   - In `/usage`, the user filters by provider/model or exports a CSV for finance.
   - If costs trend higher, user checks `/budgets` or `/recommendations` to optimize usage.
3. **Workspace Administration:**
   - In `/settings`, administrators configure Slack webhooks for instant alert forwarding, invite coworkers, or manage cost allocation tags.

---

## 3. How Teammates Can Run & Test on Their PCs

### Prerequisites
- **Node.js:** v18.17.0 or higher
- **npm:** v9.0.0 or higher

### Step 1: Install Dependencies
From the repository root or directly inside `apps/web`:
```bash
# If from repository root:
npm install

# If inside apps/web directly:
cd apps/web
npm install
```

### Step 2: Run the Development Server
```bash
cd apps/web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Chrome or any modern browser.

### Step 3: Test Accounts & Flow
The frontend contains built-in session handling and comprehensive mock fallback data:
- **Test Login:**
  - Email: `anuj@company.com` (or any valid email)
  - Password: `password123`
  - Click **Sign in** $\rightarrow$ Access granted immediately.
- **Test Signup & Onboarding:**
  - Click **Sign up** $\rightarrow$ Fill any test organization name and user credentials $\rightarrow$ Experience the 5-step onboarding wizard.
- **Test Route Protection:**
  - Open an Incognito/Private window and navigate directly to `http://localhost:3000/providers` or `http://localhost:3000/usage`.
  - Notice automatic redirect to `/login?redirect=...`.
- **Test Logout:**
  - Click the **Log out** icon at the bottom of the sidebar. Session cookie is removed and you return to `/login`.

### Step 4: Verify the Production Build
To verify type safety and static page prerendering across all 16 routes:
```bash
cd apps/web
npm run build
```
Expected output: **Compiled successfully** with `✓ Generating static pages (16/16)`.

---

## 4. Connecting the Backend (`apps/api`)

The frontend is completely decoupled via `lib/api-client.ts`. To connect your real backend endpoints:

1. Create or edit `apps/web/.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```
2. When `NEXT_PUBLIC_API_URL` is set, `fetchWithFallback` automatically switches from mock data to live HTTP requests against Neerav, Krrish, Vedant, and Gauri's API endpoints.
3. If an endpoint is offline or returns an error, the frontend gracefully falls back to mock telemetry without crashing.
