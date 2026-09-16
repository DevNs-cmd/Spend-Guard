# Anuj — Frontend (entire `apps/web`)

## Scope
You own **all** of `apps/web/**`. Nobody else edits your folder. You do not
edit anything in `apps/api/**` — you consume it only through
`apps/web/lib/api-client.ts`, calling endpoints documented in
`/docs/API_CONTRACTS.md` and using types from `packages/shared-types`.

## What you're building
The entire SpendGuard dashboard UI, in Next.js (App Router) + TypeScript +
Tailwind + shadcn/ui, in a **light purple theme** (already scaffolded in
`tailwind.config.ts` under the `brand` color).

## File map (already scaffolded — fill these in)
```
apps/web/
├── app/
│   ├── (auth)/login/page.tsx           Login
│   ├── (auth)/signup/page.tsx           Org signup/onboarding
│   └── (dashboard)/
│       ├── layout.tsx                   Sidebar + shell
│       ├── page.tsx                     Overview (KPIs, charts)
│       ├── providers/page.tsx            Connect/manage AI providers
│       ├── usage/page.tsx                Usage & cost breakdown tables/charts
│       ├── budgets/page.tsx              Budget configuration
│       ├── alerts/page.tsx               Alerts feed + channel settings
│       ├── analytics/page.tsx             Trends, forecasts, anomalies
│       ├── recommendations/page.tsx        Optimization suggestions
│       ├── reports/page.tsx               Report builder + export
│       ├── billing/page.tsx               Plan + Stripe portal
│       └── settings/page.tsx              Org/team/tag/notification admin
├── components/
│   ├── ui/            shadcn components (generate as needed)
│   ├── charts/         spend-chart.tsx, token-chart.tsx (recharts)
│   └── dashboard/       sidebar.tsx, stat-card.tsx
└── lib/
    ├── api-client.ts    typed fetch wrapper — extend this, don't bypass it
    ├── auth.ts           Clerk/Auth0 client helpers
    └── utils.ts
```

## Task order (build in this sequence, matching backend priority)
1. **Auth shell** — login/signup pages, session handling, org switcher
   (needs Neerav's `/auth` and `/organizations` endpoints)
2. **Dashboard shell** — sidebar, layout, routing for every section above
3. **Overview page** — KPI cards + spend chart (needs Krrish's `/providers`,
   Vedant's `/usage/summary`)
4. **Usage/breakdown page** — tables/charts by provider/model/project/tag
   (needs Vedant's `/usage/breakdown`, `/tags`)
5. **Budgets & Alerts pages** (needs Gauri's `/budgets`)
6. **Analytics page** (needs Krrish's `/analytics/trends`)
7. **Recommendations page** (needs Krrish's `/recommendations`)
8. **Reports page** (needs Gauri's `/reports`)
9. **Billing page** (needs Gauri's `/billing`)
10. **Settings/admin page** (needs Neerav's org/member endpoints + Vedant's tags)

## Rules
- Every page must handle loading, empty, and error states — no blank screens.
- Don't hardcode data "temporarily" and forget to wire it up — if a backend
  endpoint isn't ready yet, say so in standup rather than shipping a mock that
  quietly stays in the final build.
- Keep the UI responsive and consistent with the purple theme across every page.
- If you need a field the backend doesn't return, add it to
  `/docs/API_CONTRACTS.md` as a proposed change and ping the module owner —
  don't invent your own parallel data shape.

## Definition of done
- [x] Every route above renders real data end-to-end (not placeholders)
- [x] Auth-gated routes redirect unauthenticated users
- [x] No console errors, no unhandled promise rejections
- [x] Build passes (`npm run build` in `apps/web`)
