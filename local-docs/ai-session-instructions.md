# AI Session Instructions — Owner Working Rules (Danial Khan)

Read this file at the start of every session, together with AGENTS.md
(repository hard rules H1-H10) and docs/PROJECT.md (project state).
These are the owner'"'"'s standing process directives, given verbally across
sessions. They bind every agent working in this repository.

## Commits

- NEVER commit, stage, or push. The owner commits manually, always.
- After every completed task, propose a ONE-LINE commit message in plain
  language: no abbreviations, no conventional-commit prefixes, no jargon.
  Example: "Add blocked riders page with split layouts and table search".

## Task discipline

- ONE task at a time. Never bundle unrelated scope into a single task.
- For complex work: present a plan first, execute only after the owner
  approves. For small clear fixes: execute directly.
- The owner reviews live on the running dev server while work happens.
  Expect rapid small visual amendments mid-task; apply them immediately
  and fold them into the same task report.
- Owner decisions override agent judgment. If the owner explicitly picks
  a tool or approach, implement it; surface trade-offs, never veto.
  Flag concerns once, clearly, then follow the decision.

## Quality gates (every task, no exceptions)

Run and report all of these after any code change:
1. npm run lint
2. npm run typecheck
3. npm run typecheck:strict (0 errors)
4. npm run build
5. npm test (report exact count; baseline 115 passing as of 2026-08-04)
6. MSW purity: rg msw dist/assets/*.js must return 0 hits
7. Bundle band: the regression test inside npm test measures zlib gzip
   (band 243.5-246.5 kB). Vite prints a DIFFERENT gzip number - never
   compare one against the other'"'"'s band; report both, labelled.

## Testing rules (current UI phase)

- Do NOT write new tests. The existing suite must stay green.
- Update existing assertions ONLY when the behaviour they encode was
  intentionally changed by the owner'"'"'s directive; list every such
  update in the report.
- QA reviews are WAIVED for this phase by owner directive. State in
  reports that deliverables are gate-verified only.

## Reporting

- ONE combined report per task: files changed, behaviour summary,
  test assertion updates (each listed), gate results, open questions.
- Keep reports short and concrete. No process narration.
- Updates to the owner must be PRECISE and SHORT. No excessive detail;
  do not waste usage on long reports the owner did not ask for.
- Flag anything found-but-out-of-scope for the owner to decide;
  never silently expand scope, never silently skip it.

## Environment

- Never touch .env (H5). Document modes in .env.example instead.
- Dev modes: (a) MSW mocks = default; (b) live API via Vite proxy:
  VITE_ENABLE_MSW=false, VITE_API_BASE_URL= (empty),
  VITE_DEV_PROXY_TARGET=https://<api-gateway-host>/prod - restart dev
  server after changing. Proxy mode exists because the backend'"'"'s CORS
  is broken (no OPTIONS preflight config, quoted header values).
- The live backend contract is docs/design/API-Document.pdf; the living
  contract table is docs/adr/0003-mock-api-msw.md - update it in the
  same change as any wire-shape change (H1/H6).

## Carry-over items (as of 2026-08-04)

- Backend CORS fix pending on backend side (needed for non-proxy use).
- Register form still sends "email"; backend acceptance unconfirmed
  (owner said skip for now).
- Unconsumed endpoints update-user and activate-rider: candidates for
  real block/unblock, rider profile save, and PIN activation.
- Phone validation: login AND register accept 9-11 digits.
- Parked: dark-mode variant for green table header (bg-switch-background),
  dead BackButton export in src/components/shared.tsx, D26 note on
  React 18 + asChild ref inversion (docs/design/migration-plan.md).
