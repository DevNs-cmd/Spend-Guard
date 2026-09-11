# modules/auth — Owner: Neerav

See full task breakdown in `/docs/team/NEERAV_README.md`. This folder only —
do not touch `organizations/entities/*` from here without going through the
service layer.

Exposes: `AuthGuard`/`JwtAuthGuard` used by every other module's controllers,
and the login/session endpoints consumed by Anuj's frontend.
