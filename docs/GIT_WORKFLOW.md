# Git Workflow

1. Branch per task: `feature/<module>-<short-description>` (e.g. `feature/usage-cost-calculator`)
2. Only touch files inside your owned module folder(s), plus your own README.
3. Any change to a **shared file** (`app.module.ts`, `src/common/**`,
   `packages/shared-types/**`, `docker-compose.yml`, root configs) must go
   through a PR reviewed by at least one other teammate — never push directly.
4. Commit messages: `<module>: <what changed>` (e.g. `providers: add Anthropic connector`)
5. Push daily. Communicate blockers immediately — the dev order means later
   modules are blocked on earlier ones (see root README priority list).
6. No merging to `main` with failing tests or lint errors.
7. Test everything before marking a task complete — this is a real production
   deliverable, not a prototype.
