# Neerav — Auth, Multi-tenancy & Core Backend

## Scope
You own `apps/api/src/modules/auth/**` and
`apps/api/src/modules/organizations/**`. You are the **first to ship** —
everyone else's endpoints assume an authenticated request with org context,
so treat this as the critical path.

You do NOT edit `apps/api/src/common/**` yourself for anything beyond your
own guard/decorator contributions — those are shared files, submit via PR.

## What you're building

### 1. Auth module (`modules/auth`)
- Integrate Clerk or Auth0 with Organizations support (pick one, document
  the choice in your module README)
- `POST /auth/login`, `GET /auth/session`, `POST /auth/logout`
- `JwtAuthGuard` — applied to every protected controller across the whole app
- Session must resolve to: `{ userId, organizationId, role }`

### 2. Organizations module (`modules/organizations`)
- `Organization` entity: id, name, plan, retention settings
- `Membership` entity: userId + organizationId + role (Owner/Admin/Member/Viewer)
- `POST /organizations` — create org (on signup)
- `POST /organizations/:id/members` — invite/add member
- `PATCH /organizations/:id/members/:userId` — change role
- Audit log: record who did what, when (at least for role/member changes and
  provider connect/disconnect — expand from there)
- SSO: stub the config surface even if full SSO isn't finished by deadline —
  don't block on it

### 3. Shared decorator/guard you own on behalf of the team
- `@CurrentOrg()` decorator (`src/common/decorators/current-org.decorator.ts`)
  — extracts `{ organizationId, role }` from the validated session, for use
  in every other module's controllers
- `RolesGuard` (`src/common/guards/roles.guard.ts`) + a `@Roles(...)`
  decorator so other modules can restrict endpoints by role

## Dependencies
- Nobody is blocked on you for local dev (they can stub `@CurrentOrg()`
  temporarily), but **real integration testing across modules starts only
  after your auth + org context works** — ship this first.

## Definition of done
- [ ] Login/session flow works end-to-end with Anuj's frontend
- [ ] Every org-scoped table enforces `organizationId` isolation — verified
      with a test that user A can never see org B's data
- [ ] `@CurrentOrg()` and `RolesGuard` are documented in `src/common/README`
      (add one) so other modules know how to use them
- [ ] Role changes and member invites are audit-logged
