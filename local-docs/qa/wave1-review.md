# Wave 1 QA Review — Portal Consolidation

**Reviewer:** QA-Wave1 (sub-agent, SWE Team Lead)
**Date:** 2026-08-11
**Scope:** `git diff d5e6175..HEAD` — commits `8f2b1b4` (root error boundary + 404) and `da9a6ef` (BlockedRiders removal + redirect).

## Verdict: **SHIP** ✅

All gates green (lint, typecheck, typecheck:strict, build MSW=false with 0 MSW refs in `dist/assets/*.js`, 126/126 tests). H1–H10 respected. F1 guard trace re-verified independently — no loops introduced. No dangling references. i18n key sets remain congruent between EN and UR.

## H8 Guard Trace — Independently Re-verified

Traced against `src/router.tsx`, `src/features/auth/ProtectedRoute.tsx`, `src/router-layout.tsx`.

| Scenario | Path | Result |
|---|---|---|
| Logged-out → `/admin/blocked-riders` | ProtectedRoute(Admin+Operator): `!profile` → `<Navigate to="/login">` — inner Navigate to all-riders never renders. | ✅ No loop |
| Customer seed (H3 tripwire, `0300444444`) → `/admin/blocked-riders` | ProtectedRoute: role not allowed → `<Navigate to={roleHome("Customer")}>` = `/login` → PublicOnly: `profile && unknownRole` → `useEffect(logout)` + render Outlet (LoginPage). F1 fix intact. | ✅ No loop |
| Customer seed → junk URL `/foobar` | Matches `*` → NotFoundPage renders under RootLayout (AuthProvider present). Link `to="/login"`. Clicking → PublicOnly → logout+outlet. | ✅ No loop |
| `*` wildcard, unauthed | NotFoundPage. `profile=null` → link `to="/login"`. | ✅ Sane |
| `*` wildcard, authed (Admin/Operator/Rider) | NotFoundPage → link to `roleHome(role)`. | ✅ Sane |
| Redirect loop on `/admin/blocked-riders` | Target `/admin/all-riders` differs from source. | ✅ No loop |

**Task-brief nit:** brief claimed dev "deliberately avoided useAuth" in NotFoundPage — the file DOES call `useAuth()` (line 10). Safe because NotFoundPage renders under RootLayout which wraps AuthProvider. Not a defect; only a doc mismatch. **ErrorBoundaryPage correctly does NOT call `useAuth`** (uses only `useRouteError` + `useTranslation` + `Link`). ✅

## Regression Sweep

| Check | Result |
|---|---|
| `rg BlockedRiders` in src/,tests/ | Only redirect test + router.tsx redirect line ✅ |
| `rg blocked-riders` outside redirect | Zero hits ✅ |
| `rg riders\.blocked\.` | Zero hits ✅ |
| `rg nav\.blockedRiders` | Zero hits (sidebar entry removed) ✅ |
| `layout.title.blockedRiders` in TITLE_KEYS | Removed ✅ |
| i18n EN vs UR key congruence | Identical key sets (flatten diff = 0 mismatches) ✅ |
| `errors.*` keys | 7 keys in both locales (boundary.{title,message,reload,goHome} + notFound.{title,message,goHome}) ✅ |
| StatCard retarget | `Dashboard.tsx:222` → `/admin/all-riders?status=blocked` ✅ |
| AllRiders `?status=blocked` initial tab | `AllRiders.tsx:88` `readStatusTab(sp)` seeds statusTab from URL ✅ |
| Unblock path from Blocked tab | Row → RiderDetailSheet → RiderEditPage → `applyStatus("active","unblock")` at line 487 → `/update-user` (D40) ✅ |

## Error Boundary Review

- `errorElement` on RootLayout (router.tsx:22) — catches render errors in ALL descendants including DashboardLayout children ✅
- Does NOT render raw error text — `useRouteError()` result only sent to `console.error` in useEffect ✅
- Reload button: `window.location.reload()` ✅
- Go-Home: `<Link to="/">` → `IndexRedirect` handles session routing ✅
- i18n keys resolve in both EN and UR ✅

## 404 Review

- Renders unconditionally — no early returns, no throws ✅
- `useAuth()` safe: AuthProvider is guaranteed by RootLayout ancestor ✅
- Unauthed junk URL → 404 → link `/login` ✅
- Authed junk URL → 404 → link to role home ✅

## Test Quality

Both new tests assert **behavior**, not just render:

- `error-boundary.test.tsx`: `Boom` component throws → asserts friendly UI text renders, reload button present, dashboard link href = `/`, AND `console.error` spy was called. ✅
- `blocked-riders-redirect.test.tsx`: asserts `router.state.location.pathname === "/admin/all-riders"` AND `search === "?status=blocked"` AND stub renders `status=blocked` from URL — proves redirect resolves to intended tab. ✅
- NotFoundPage test: asserts title, message, link href for unauthed. ✅

**Minor gap (info):** no test asserting NotFoundPage link href when a Customer profile is loaded. Would harden H3 tripwire coverage.

## H9/H10 Sweep on Diff

- Zero non-tooling comments added (grep on `^\+.*//` and `^\+.*/\*` returned zero matches outside test files) ✅
- ErrorBoundaryPage + NotFoundPage: minimum viable, no abstractions, no configurability. H10-compliant ✅

## Findings

| ID | Severity | Area | Finding | Action |
|----|----------|------|---------|--------|
| W1-1 | Trivial | Style | `src/features/riders/routes.tsx` missing trailing newline | Optional fix |
| W1-2 | Info | Test coverage | No regression test for NotFoundPage link href with Customer profile | Optional follow-up |
| W1-3 | Info | Doc mismatch | Delegation brief claimed NotFoundPage avoids `useAuth`; it uses it (safe) | Correct brief for future delegations |

**Zero P0/P1/Major findings. No blockers.**

## Fresh Gate Results (executed by QA-Wave1)

| Gate | Result |
|------|--------|
| `npm run lint` | ✅ clean |
| `npm run typecheck` | ✅ 0 errors |
| `npm run typecheck:strict` | ✅ 0 errors |
| `VITE_ENABLE_MSW=false npm run build` | ✅ built in 2.14s |
| `rg -l msw dist/assets/*.js` | ✅ **0 hits** — MSW absent from prod bundle |
| `npm test -- --run` | ✅ **126/126 passing** (19 files, 29.35s) |

## Sign-off

**QA verdict: SHIP.** Wave 1 is a clean consolidation. H1–H10 respected, F1 guard behavior preserved, no dangling refs, all gates green. Two info-level follow-ups optional.
