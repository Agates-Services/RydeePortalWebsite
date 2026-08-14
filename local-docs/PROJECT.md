# PROJECT.md — RydeePortalWebsite

> **Last updated:** 2026-08-14 (Wave 5 uncommitted — route unification + User management removal + register role bug fix + My Profile UI polish, ADR-0007 Wave 5 amendment; 167/167 tests, gates green, MSW purity 0) · Snapshot, not a log — rewrite stale sections.

---

## Overview

RydeePortalWebsite is a single-page React portal for the Rydee ride-hailing platform (DBX8 / MEU-FQA). It serves three active roles (Rider, Admin, Operator) with role-scoped dashboards and rider management screens. Stack: **React 19.2.8 + Vite 8 (rolldown) + TypeScript 5.9.3 + Tailwind CSS 4.3.3 + shadcn/ui**, routing via **react-router 8** (library/browser mode), mock API via **MSW 2.x** (flag-gated), package manager **npm**. The backend is WIP elsewhere at `localhost:3000`; the API contract is frozen at `POST /user-login` (`{ phone, password }`) and `POST /register-user` (`{ name, email, phone, dob, address, password, role }`), `credentials: "include"` (field renamed `phoneNumber` → `phone` 2026-07-30; resource paths kebab-cased 2026-08-04 to match `docs/design/API-Document.pdf`; see ADR-0003 v2 amendment).

---

## Current State (as of 2026-08-11)

All iterations through Iter 8 + Security Review are **on main** (tip `dd4648a`, 2026-08-06). The Rider Profile Edit feature and the Rides feature are **complete in the working tree** (gate-verified, owner accepted) and await the owner's manual commits (Waves 1–4 + prior batches).

The portal ships EN/UR i18n with full RTL mirroring for Urdu. npm audit: **0 vulnerabilities**. **161/161 vitest** (Wave 4 Phase 1 final, cold full-suite 2026-08-11); main bundle **214.05 kB gzip** (Vite CLI, MSW=false). Recharts `RidesCharts` lazy chunk (~395 kB raw) isolated from main. Gates: lint 0, typecheck:strict 0, build OK, MSW purity 0 hits.

**Working tree: all Wave 1–4 + prior batch commits pending owner commit (personal).**

| Commit (pending) | Scope |
|-----------------|-------|
| (A) *Add an editable rider profile page reachable from a pencil icon on each All Riders row and from the details drawer, and remove the read-only subtitle from the drawer* | Stage 1 — route `admin/riders/:phone/edit`, `RiderEditPage.tsx`, pencil icon in AllRiders + RiderDetailSheet; instant render via `location.state` seed; diff-only save via `POST /update-user`; discard-confirm on dirty cancel; one unified card; editable name/area/address/cnic/dob; locked phone/role/joined (`readOnly` inputs + Lock icon + phone tooltip) |
| (B) *Add a compact verification documents checklist with a single upload control, an Other category with custom names, and make the profile photo document drive the rider's avatar* | Stage 2 — `documentTypes.ts` (7-type enum incl. `other`, 2 MB cap, PDF/JPG/PNG allowlist, `profile_photo` images-only); `api/riderDocuments.ts` (get/upload/delete + `postMultipartWithProgress` XHR helper); MSW handlers with typed seeds + upsert semantics; compact two-col checklist; single upload control (type Select + Other custom name 1–40 chars + dropzone DnD+keyboard); replace-confirm dialog; avatar unified with `profile_photo` doc; 'unavailable' production-gap fallback; `/upload-rider-photo` purged (D38 MOCK-ONLY) |
| (C) *Add rider edit page status change buttons and PIN reset flow behind mock endpoints* | Rider Profile Edit Stage 3 + polish — Status card (per-status action buttons: Activate w/ PIN via `/activate-rider`; Block/Offboard/Unblock/Reactivate via `/update-user activationStatus` — D40 CONTRACT ASSUMPTION); PIN card (confirm → `POST /reset-rider-pin` → one-time PIN dialog + Copy — D39 MOCK-ONLY); xl two-column layout; Save/Cancel in header ≥md; status pill under rider name; `ui/textarea.tsx` new primitive; matte 8-color hashed avatar palette; UR clipping fixes in theme.css; Save-disabled silent-validation bug fixed |
| (D) *Add a Rides management page with live/upcoming/completed/canceled tabs, a full-page ride map view, dashboard ride widgets, and recharts-backed chart components* | Rides feature (2026-08-07)
| (E) *Ignore the API base URL and allow it to be missing when mock mode is enabled so demo deploys never call the real API* | Env-validation fix (2026-08-07) — `src/lib/env-rules.ts`: when `VITE_ENABLE_MSW=true`, `VITE_API_BASE_URL` is forced to `''` (same-origin) and may be omitted entirely; when MSW=false strictness unchanged; `.env.example` updated; 4 itemised assertion updates in `tests/regression/env-validator.test.ts` and `check-env-script.test.ts`; all gates green 114/114; owner accepted | — `/admin/rides` list (4 URL-param tabs, 300ms debounced search, server-side sort via `sortBy`/`sortDir`, pagination, 12s live polling, stable `rideId` sort, 2-min arrived retention, 3-min stalled amber highlight, fare column PKR both roles, mobile stacked cards no arrow); `/admin/rides/:rideId` full-page view (340px details card + lucide headings + completion/distance/waiting/est-completion fields, Leaflet map with permanent marker tooltips incl. rider ETA, traveled-path for completed rides, straight-dashed fallback, 12s live poll); dashboard: recent-10 live rides table (`RidesTable`), rides-overview pie + busy-areas bar cards (legend, month-over-month trend footer, area-name tooltips); new primitives: `src/components/ui/map.tsx` (map-engine seam), `src/components/ui/chart.tsx` (recharts lazy-isolated in `RidesCharts` chunk ~395 kB raw); ADR-0006 Accepted; ADR-0003 fn 14 |


| Area | Status |
|------|--------|
| Folder structure (feature-based) | ✅ Done — `src/features/{auth,riders,dashboards}` + shared tier |
| Routing + auth guards | ✅ Done — `createBrowserRouter` + `AuthProvider` + `ProtectedRoute` / `PublicOnly` |
| MSW mock API | ✅ Done — `VITE_ENABLE_MSW=true` gates worker boot; phone-based seeds; prod bundle purity verified |
| Session persistence (D9 client-side) | ✅ Done — `localStorage` v1 envelope + 24h TTL via `src/features/auth/session.ts`; QA SHIP 11/11 |
| Figma Make artifacts stripped | ✅ Done |
| MUI + Emotion + maplibre removed | ✅ Done |
| Tooling (ESLint + Prettier + typecheck + CI) | ✅ Done — GitHub Actions on push/PR |
| AGENTS.md + AI assistant rules | ✅ Done — canonical rules file + CLAUDE.md / .cursor / .github stubs |
| TypeScript strict mode | ✅ Done — `strict: true` flipped in `e84b920`; `typecheck:strict` script now redundant (candidate for future chore) |
| `.env` removed from git | ✅ Done |
| **🔑 Google Maps key rotation** | ✅ **DONE (2026-07-30, dandkhan)** — new key issued + HTTP-referrer restriction applied. D13 (git history rewrite) now optional / low-priority. |
| Collaborator merge round (b0ef29c) | ✅ Done — see below |
| **Iteration 2 — Hardening** | ✅ **COMPLETE 2026-07-30** |
| **Iteration 3 — D8 shadcn Restyle** | ✅ **COMPLETE 2026-07-30** — commits `57545a6` / `38c773b` / `1a6962f` / `f3e195d`; QA SHIP; UX 5/5 deviation approvals |
| **Iteration 4 — Form Validation + Datepicker** | ✅ **COMPLETE 2026-07-30** — commits `f9fcfc0` / `9948996` / `4252e13` / `7693215` / `731dff6` / `1dc7781` / `532391d`; QA SHIP; 3× INFO findings only |
| **Iteration 5 — Backend Wire-Compat + All Riders** | ✅ **COMPLETE** — on main; see Iteration 5 section below |
| **Iteration 6 — i18n EN/UR (ADR-0005)** | ✅ **COMPLETE** — on main (tip `57723f0`); react-i18next + EN/UR + runtime switcher + live-review CSS polish; see Iteration 6 section below |
| **Iteration 7 — Full RTL for Urdu** | ✅ **COMPLETE 2026-08-05** — working tree uncommitted; html dir sync + DirectionProvider + ~68 logical class conversions + theme.css reconciliation + 6 ui/ files (H4 sign-off); gate-verified; QA waived; zero test edits; see Iteration 7 section below |
| **Iteration 8 — Full Dependency Update** | ✅ **COMPLETE 2026-08-06** — 22 non-major pkgs (Phase 1) + all majors (Phase 2): React 19.2.8, Vite 8.2.0 (rolldown), ESLint 10.8.0, Vitest 4.1.10, react-router 8.3.0 (clears GHSA-qwww-vcr4-c8h2), TS 5.9.3, Tailwind 4.3.3, lucide-react 1.29.0, react-leaflet 5.0.0, react-day-picker 8.10.2; ZERO src/ code changes; F1/H8 guard trace re-verified under router 8; npm audit 0; working tree uncommitted; see Iteration 8 section below |
| **Security Review** | ✅ **COMPLETE 2026-08-06** — owner-requested; 10 findings (0C/1H/3M/4L/2I); S-01/S-03/S-05 fixed; S-02 dismissed by owner; S-04 accepted trade-off; S-06/S-07/S-08/S-09/S-10 noted; see `local-docs/qa/security-review.md` |
| **Commits 12c87d7 + dd4648a** | ✅ **COMPLETE 2026-08-06** — SPA `.htaccess` fallback; ActiveRiders re-derived from `/get-all-riders` filter; D32 closed; PendingRiders empty-state fix; mobile stacking-context fix; 114/114 tests |
| **Rider Profile Edit (all stages)** | ✅ **COMPLETE 2026-08-07** — 3 stages + polish batch in working tree, gate-verified; pending commit (C); Stage 3 live-wiring pending backend D38/D39/D40 |
| **Rides feature** | ✅ **COMPLETE 2026-08-07** — `/admin/rides` list (4 tabs, search, sort, pagination, 12s poll, stalled highlight, fare PKR); `/admin/rides/:rideId` full-page map view (details card + Leaflet, traveled-path, live poll); dashboard widgets (`RidesTable`, pie, bar); `ui/map.tsx` + `ui/chart.tsx` primitives; `RidesCharts` lazy chunk; ADR-0006 Accepted; all gates green; owner accepted; pending commit (D); rides endpoints MOCK-ONLY (D41) |
| **Portal consolidation — Wave 1 (ADR-0007)** | ✅ **COMPLETE 2026-08-11** — root errorElement + friendly error page; `*` route now renders a real 404 (was a silent redirect to `/`); `BlockedRiders` page removed (fully redundant with `AllRiders?status=blocked`; legacy `/admin/blocked-riders` redirects; Dashboard StatCard retargeted); `riders.blocked.*`, `layout.nav.blockedRiders`, `layout.title.blockedRiders` i18n keys pruned; guards untouched (H8 trace re-verified); tests 126/126 (baseline 123 + 3 new − 0 removed). Wave-2 deferrals: PendingRiders removal (blocks on D37 item 3), ActiveRiders simulation strip + Leaflet lazy-load (D43) + rename "Live Map". ADR-0008 reserved for Rider Role Experience. |
| **Wave 3 — My Profile + 401 handling** | ✅ **COMPLETE 2026-08-11 (uncommitted, owner commits personally)** — new `/account/profile` route inside `DashboardLayout` (`Admin+Operator+Rider`); Tabs (Profile + Settings) built with inline ARIA (no shadcn `tabs` primitive — H10); Profile tab edits `name`/`address` via diff-only `updateUser(phone, role, patch)` with `saveSession(merged) + login(merged)` refresh + discard-confirm AlertDialog; Rider role shows activation-status Badge. Settings tab: `LanguageSwitcher` + Change-password form (min 8, match validation) against a new MOCK-ONLY `POST /change-password` (D48 / ADR-0003 fn 17) — wrong current password returns **400 (not 401)** so global handler cannot force-logout the user. Global 401 handler in `src/api/client.ts` clears session, sets `sessionStorage['rydee.expired']` flag, and hard-redirects to `/login?reason=expired` for every non-login URL (`/user-login` exempt). `LoginPage` renders an amber notice when either signal is present, then clears the flag. `session.ts loadSession()` TTL-expiry path sets the same flag (D49). Sidebar footer dropdown gains "My profile" above Sign out. Gates green: lint 0, typecheck:strict 0, build ok, tests **142/142** (127 baseline + 2 W2-1 activate + 13 new — profile 4, password 4, 401 handler 2, expired notice 3). |\n| **Portal consolidation — Wave 2 (ADR-0007)** | ✅ **COMPLETE 2026-08-11** — B1: `PendingRiders` page removed (562 LOC); `/admin/pending-riders` → `Navigate to /admin/all-riders?status=pending`; `/get-all-inactive-riders` no longer called (URL constant + helper + MSW handler + `inactiveSeeds` deleted); Sidebar + Dashboard StatCard retargeted; `riders.pending.*`, `layout.nav.pendingRiders`, `layout.title.pendingRiders` pruned. B2: `ActiveRiders` client-side position + state randomization stripped; page now renders only real `currentLocation` from `/get-all-riders`; Leaflet map extracted to `LiveMap.tsx` + `React.lazy` + `Suspense`; nav/title renamed "Live Map"; `RiderState` type + state badges removed. Gates green 127/127; main-chunk gzip 216.37 → 210.74 kB (−5.63 kB). D18 supersede-note + D43 closed + D47 opened (live-position backend follow-up). |
| **Wave 4 Phase 1 — Rider Role Experience (ADR-0008)** | ✅ **COMPLETE 2026-08-11 (uncommitted, owner commits personally)** — Rider routes moved inside `DashboardLayout` (`/rider`, `/rider/rides`, `/rider/rides/:rideId`); `AppSidebar` `isRider` branch shows only Dashboard / My rides / My profile. `RiderDashboard` rewrite: 6 stat cards (earnings today, earnings this week, rides today, rating, online status, acceptance rate) + rider live-location map card. Pure helpers `deriveRiderStats`/`acceptanceRate` in `src/features/dashboards/riderStats.ts`. `StatCard` promoted to `src/components/StatCard.tsx` (`value: ReactNode` widened); `RatingStars` extracted to `src/components/RatingStars.tsx`. `RidesPage` accepts `scope?: 'mine' \| 'all'` prop; `RidesTable` accepts `hideRiderColumn` + `viewPathPrefix`. `/get-rides` handler accepts `body.scope + body.phone` (mock convenience — real backend derives phone from session cookie, D37 item 7). Phase 2 `/get-my-stats` deferred (D50). New i18n keys: `layout.title.myRides`, `layout.nav.myRides`, `layout.nav.myProfile`, full `dashboards.rider.*` refresh, `rides.caption.mine.*`, `rides.empty.mine.*` (en + ur). Gates green: lint 0, typecheck:strict 0, build 214.05 kB main gzip (+3.31 kB vs pre-Wave-4 baseline 210.74 kB), MSW purity 0 hits, tests **161/161** (+19 = 3 W4 cross-role guards + 13 wave4-rider-experience derivation/scoping/sidebar + 3 /get-ride scoping post-QA). QA Wave 4 fixes applied post-CONDITIONAL SHIP (2026-08-11): MAJOR-1 `/get-ride` handler now enforces `scope='mine'` phone match (404 for non-owner) — same-change ADR-0003 `/get-ride` row + ADR-0008 §My Rides amended; MINOR-1 customer phone rendered as `tel:` link in ride view; MINOR-3 vitest testTimeout bumped 5s→10s (D52); MINOR-2 tracked in register (D51). ADR-0008 Accepted (Phase 1 gate met); ADR-0003 fn 14 + /get-ride amended (scope+phone). |
| **Wave 5 — Route unification + User management removal (uncommitted)** | ✅ **COMPLETE 2026-08-14 (uncommitted, owner commits personally)** — five owner-requested items landed together: (1) rider/user edit routes unified — `/admin/riders/:phone/edit` and `/admin/register` now redirect to `/admin/users/:phone/edit` and `/admin/users/new` respectively via a small `RiderEditRedirect` (`useLocation().state` preserved); all internal callers (`AllRiders` row action, `RiderDetailSheet` edit button) navigate to `/admin/users/:phone/edit` with `state: { row, role: "Rider" }`; `RiderEditPage` already role-branches on `navState.role` so no component fork (H10). (2) User management sidebar nav entry deleted (Admin now discovers Users only via existing `/admin/users` link surfaces); `AppSidebar` cleanup (removed unused `isAdmin` const + `UserPlus` import); `layout.nav.userManagement` i18n keys pruned (en + ur). (3) Register-role bug fixed — `RegisterPage` initial `form.role` was `"rider"` (lowercase) which never matched a `<option value>` (`ROLES = ["Operator","Customer","Rider"]`, title-case); initial value is now `""` (renders as placeholder) and submit sends `role: showRole ? form.role : "rider"` so the public `/register` flow (showRole=false) still forces Rider. `UsersPage` gains an Admin-only "Add new" button (`data-testid="fqa-users-add-new"`) navigating to `/admin/users/new` which renders `<RegisterPage showRole backTo="/admin/users" />`. H2 preserved (dropdown never lists Admin). (4) My Profile page constrained to `max-w-3xl` outer container. (5) Docs hygiene — ADR-0007 Wave 5 amendment (2026-08-14) added with gate summary; TITLE_KEYS map extended (`/admin/users`, `/admin/users/*/edit`, `/admin/users/new`) with new `layout.title.{users,editUser,registerUser}` keys (en + ur). Gates green: lint 0, typecheck:strict 0, build OK (main bundle ~214 kB gzip), MSW purity 0 hits, tests **167/167** (161 baseline + 6 new = 3 wave5-route-unification + 3 wave5-register-role; 2 stale wave4 expectations updated for sidebar link removal). |

**D8 restyle summary:**
- shadcn primitives adopted across all pages (auth, dashboards, riders) — Radix `<Checkbox>`, `<AlertDialog>`, `<Button>`, `<Card>`, `<Input>`, `<Label>`, `<Badge>`, `<Select>`, `<Table>` in use
- Palette A (`--primary #0d8f6e`) — WCAG AA on all tokens; one documented borderline: `--primary` = 4.06:1 on white (passes AA-Large / UI 3:1, borderline AA-normal; documented in `theme.css`; see QA F1/P3 → D19)
- 32 JS inline style event handlers removed (`onMouseEnter`/`onMouseLeave`/`onFocus={style}`/`onBlur={style}`)
- `src/components/shared-styles.ts` deleted (46-line legacy helper)
- a11y items closed: Radix `<Checkbox>` replaces div-as-checkbox, `<AlertDialog>` focus-trap, `focus-visible:ring-*` via shadcn, `role="alert"`/`status` + `aria-live` on errors/banners, `@media (prefers-reduced-motion)` global guard in `theme.css`, `sr-only` caption + `fieldset/legend` on documents group, password-toggle `aria-pressed` + tab order restored
- New shared components: `DashboardHeader`, `StatCard` in `src/features/dashboards/components/`

---

## C0–C7 + Post-Ship Checkpoint Summary

| Checkpoint | Commit | Description |
|-----------|--------|-------------|
| C0 | `9dcc503` | Git & env hygiene — `.gitignore`, `.env` removed, `.env.example`, `pre-restructure` tag |
| C1 | `3aeecae` | Figma artifact strip + package rename (`rydee-portal-website`) |
| C2 | `9506ff5` | Remove unused deps: MUI, Emotion, maplibre-gl |
| C3 | `35093f5` | Tooling baseline: ESLint, Prettier, typecheck/typecheck:strict, GitHub Actions CI |
| C4 | `41d649e` | File moves only (`git mv`) — ADR-0001 target paths, `App.tsx` temporarily preserved |
| C5 | `79822f1` + `8c22e86` + `884a0a4` | Routing + auth (ADR-0002); QA F1 redirect-loop fix; F2 ROLES revert; F3 Operator guard widened |
| C6 | `40573ef` | MSW mock API (ADR-0003) — handlers, seed users, flag-gated boot |
| C7 | `5dbb12c` | Close-out — README, ADRs marked Accepted, `restructure-complete` tag |
| Post-ship | `c649bd8` | Fix MSW login contract drift: `email` → `phone` in handler predicate + seeds (QA F6 blocker) |
| Post-ship | `6a04f71` | `src/mocks/README.md` — developer guide, seed-user table, Customer/F1 warning |
| Post-ship | `0960516` | D9 CLOSED (client-side): session persistence in localStorage, versioned envelope v1, 24h TTL |
| Post-ship | `6806cb3` | AGENTS.md canonical AI/contributor rules + CLAUDE.md / .cursor / .github stubs |

---

## Collaborator Merge Round (b0ef29c — 2026-07-29)

**Origin commits merged:** `181b4a9` + `3f197d2` + `2c63f6c` (written against pre-C4 App.tsx layout) → merged as `b0ef29c` into restructured feature-folder branch.

**What was ported:**
- **Dashboard live fetch** — AdminDashboard + OperatorDashboard replaced STATS constants with live `POST /GetAll/UnregisteredRiders` call; filter `activation_status === "pending"` (case-insensitive); computed total / active / pending counters; "—" fallback while loading. Cancellation-safe (`cancelled` flag), URL from `@/lib/config` (H6), typed response, `credentials: "include"`, non-fatal catch.
- **New endpoint** — `API_GET_UNREGISTERED_RIDERS_URL` constant added to `src/lib/config.ts`; MSW handler `src/mocks/handlers/riders.ts` added (8 pending + 3 active seed riders); ADR-0003 contract-table row + footnote ² added in same commit. Three-way consistency (config → handler → ADR) confirmed.
- **RiderDashboard null-safe fix** — `profile?.currentLocation?.lat/lon` optional-chain on all 3 call sites (origin intent retained).

**What was intentionally NOT taken:**
- PendingRiders full rewrite (richer mock-driven UX with CNIC / verification docs / block-rider / area dropdown / PIN) — deferred as **D18**; rationale in merge commit.

**QA verdict:** ✅ PUSH-SAFE (`docs/qa/release-readiness.md` §Pre-Push Merge Review). Pushed to `origin/main`.

---

## Iteration 2 — Hardening ✅ COMPLETE 2026-07-30

Batched execution, QA-gated before each push. All items closed.

| Work Item | Source | Commit | Status |
|-----------|--------|--------|--------|
| Strict mode flip (`strict: true`) | D6 | `e84b920` | ✅ CLOSED |
| Unify inline `Profile` / remove `@ts-nocheck` + `@ts-expect-error` | D6 | `e84b920` | ✅ CLOSED |
| Fix `RiderDashboard` self-import (`NavigateParams`) | D4 | `e84b920` | ✅ CLOSED |
| `Boolean` object type in `Profile` → `boolean` | D3 | `e84b920` | ✅ CLOSED (folded into Profile unification — see commit note) |
| DOB input `type="number"` → `type="text"` | D1 | `6b114d2` | ✅ CLOSED |
| Invalid `autoComplete` values | D2 | `6b114d2` | ✅ CLOSED |
| `login()` role-overwrite normalization | D15 | `6b114d2` | ✅ CLOSED |
| Post-register `navigate` → `replace: true` | D16 | `6b114d2` | ✅ CLOSED |
| Router react-refresh lint-warning split (route adapters) | D5 | `fe6c64f` | ✅ CLOSED |
| Dependency audit — 8 unused deps removed | D10 | `6f4e165` | ✅ CLOSED |
| react-router security patch → `^7.18.2` | D10 | `6f4e165` | ✅ CLOSED |
| Test foundation — vitest + RTL + msw/node | D12 | `79ffdbc` | ✅ CLOSED |
| Regression suite — 44 tests (auth, guards, session) | D12 | `2ac660b` | ✅ CLOSED |

**Iteration 2 gate results (final):** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 596.98 kB / **170.07 kB gzip** · test 44/44 ✅

---

## Iteration 3 — D8 shadcn Restyle ✅ COMPLETE 2026-07-30

4-phase execution; QA SHIP verdict (`docs/qa/d8-restyle-review.md`); 5/5 UX deviation approvals.

| Phase | Commit | Scope |
|-------|--------|-------|
| Phase 1 — auth pages | `57545a6` | `AuthShell`, `LoginPage`, `RegisterPage` restyle with shadcn |
| Phase 2 — dashboard chrome | `38c773b` | `AdminDashboard`, `OperatorDashboard`, `RiderDashboard` + new `DashboardHeader`/`StatCard` |
| Phase 3 — riders | `1a6962f` | `ActiveRiders`, `PendingRiders` restyle (Radix Checkbox + AlertDialog) |
| Phase 4 — cleanup | `f3e195d` | `RiderLocationView` cleanup; `shared-styles.ts` deleted; 32 JS style handlers removed |

**Iteration 3 gate results (final):** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 1984 modules / **192.90 kB gzip** · test 44/44 ✅

**Bundle baseline reset:** 192.90 kB gzip (+22.83 kB from Iter 2; delta = Radix AlertDialog + Checkbox runtime). ±2% band (±3.86 kB) applies from this baseline.

**UX deviation approvals (5/5):**
1. Role dropdown kept native `<select>` (test-selector constraint, spec §6.4)
2. PendingRiders rider/area selects kept native (Radix Select+popper ~20 kB gzip — over budget)
3. Primary bg solid `#0d8f6e` (Option B gradient → flat; documented in `theme.css`)
4. RiderDashboard profile table kept native `<table>` (a11y met via `sr-only` caption + `scope="row"`)
5. ActiveRiders Leaflet popup state badges use inline hex (Leaflet Popup outside React style tree)

**QA P3 residuals → D19/D20/D21 (see register below)**

---

## Iteration 4 — Form Validation, Datepicker & UX Polish ✅ COMPLETE 2026-07-30

7-commit execution; QA SHIP verdict (`docs/qa/iter4-review.md`); 3× INFO findings resolved.

| Commit | Scope |
|--------|-------|
| `f9fcfc0` | fix(styles): cursor-pointer global CSS rule — Tailwind v4 preflight root cause |
| `9948996` | fix(riders): `.select-field` class restores PendingRiders select chrome |
| `4252e13` | feat(dashboards): clickable StatCard as semantic `<button>` w/ aria-label + motion-reduce |
| `7693215` | feat(auth): form validation Login+Register per matrix, age 18–100, on-blur+submit, ARIA wiring, dob DD/MM/YYYY→ISO |
| `731dff6` | feat(auth): shadcn Calendar+Popover DOB datepicker, react-day-picker v8 dropdown-buttons 1940..current−18, ADR-0003 dob footnote |
| `1dc7781` | perf(auth): code-split DobPicker lazy chunk |
| `532391d` | test: 14 additive regression tests (iter4-additive.test.tsx) |

**Product decisions (owner: Danial Khan, 2026-07-30):**
1. DOB displays DD/MM/YYYY in UI; submits ISO YYYY-MM-DD — documented in ADR-0003 footnote.
2. Minimum age **18** (supersedes spec §1.3/§2.3 draft value of 16); maximum 100.

**Iteration 4 gate results (final):** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 2017 modules / **195.04 kB gzip** (within ±2% band) · test **58/58** ✅

**Bundle baselines reset:**
- Main bundle: **195.04 kB gzip** (band ±2% = 191.1–198.9 kB)
- Async DobPicker chunk: **28.64 kB gzip** (loads on first picker open only)

**QA F-findings (all INFO):**
- F1 — hash citation in review refers to `c0c9163` but actual tip is `1dc7781` (identical semantics; docs-only note)
- F2 — spec §1.3/§2.3 still shows 16-100 draft; resolved by amendment in `docs/ux/iter4-spec.md`
- F3 — cursor rule improvement is spec-sample deviation; implementation superior; no action

### Iteration 4.1 Hotfix ✅ COMPLETE 2026-07-30

Product-owner rejected the Iter 4 §2 datepicker UX (ghost-icon trigger undiscoverable on RegisterPage; PendingRiders DOB still native `type=date`). Typed DD/MM/YYYY entry removed — owner-approved trade. See `docs/ux/iter4-spec.md` Product Decisions Amendment §Iter 4.1 and `docs/qa/iter4-review.md` §Iteration 4.1 Addendum.

| Commit | Scope |
|--------|-------|
| `29099e3` | feat(auth): shared shadcn-canonical DatePickerField + DatePickerPopover lazy chunk + date-helpers; RegisterPage adoption; typed DOB entry removed |
| `6113b5c` | feat(riders): PendingRiders DOB adopts shared DatePickerField; ISO state preserved for calcAge |

**Hotfix gate results:** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.27 kB gzip** (band 191.1–198.9 ✓) · test **55/55** ✅

**Test-count revision (58 → 55 — honest record):** Prior close-out reported 58 (44 baseline + 14 additive). Hotfix revised additive count to 11 (net −3): 6 typed-entry tests removed because they drove input fields that no longer exist after typed entry removal — these scenarios are unreachable by design (picker year/day bounds enforce age ≥ 18 and calendar grid never offers Feb 29 on non-leap years); 3 new button-pattern tests added covering the canonical trigger, required-dob submit blocking, and `aria-invalid` wiring. Baseline 44 tests byte-identical. ISO wire contract retained by `contract.test.ts`. Removals are principled, not a quality regression.

**Bundle baseline update:**
- Main bundle: **195.27 kB gzip** (±2% band 191.1–198.9 kB — unchanged)
- Async chunk renamed `DobPicker-*` → `DatePickerPopover-*`: **28.75 kB gzip** (was 28.64 kB, +0.11 kB — within noise)

**Deleted:** `src/features/auth/pages/components/DobPicker.tsx` (superseded by `src/components/DatePickerField.tsx` + `DatePickerPopover.tsx`)

**QA F-findings (all INFO):** F-4.1-01 underage-in-current-year window (submit blocks wire; no action), F-4.1-02 `dobToIso` transform coverage gap (contract.test.ts covers wire shape; no action), F-4.1-03 async chunk rename (expected; no action). Full findings in `docs/qa/iter4-review.md` §Iteration 4.1 Addendum.

### Iteration 4.2 P1 Hotfix ✅ COMPLETE 2026-07-30

**Incident:** DOB picker never opened after Iter 4.1 shipped. Root cause: **version-skew class of bug** — shadcn primitives generated for wrong library versions. `ui/button.tsx` was in React-19 ref-as-prop style (function component receiving `ref` as a plain prop) running on React 18.3.1; Radix `asChild` (`PopoverTrigger asChild → Button`) silently dropped the anchor ref because `forwardRef` was absent, so `[data-radix-popper-content-wrapper]` never mounted. `ui/calendar.tsx` classNames targeted react-day-picker v9 CaptionDropdowns naming conventions while the installed library is v8 — produced garbled caption layout.

| Commit | Scope |
|--------|-------|
| `ab2a32c` | fix(ui): `button.tsx` full-file rewrite back to `React.forwardRef<HTMLButtonElement, ButtonProps>` — H4-compliant; cva config byte-identical; fixes P1 and (as free win F-4.2-01) the latent identical bug in `PendingRiders` `AlertDialogTrigger asChild` |
| `65e966b` | fix(ui): `calendar.tsx` full-file rewrite mapping react-day-picker v8 CaptionDropdowns classNames; scoped trigger field-styling on `DatePickerField`/`DatePickerPopover` (palette-collision fix: outline button no longer flashes primary-green on hover/open) |
| `54d1121` | test(e2e): opt-in Playwright Chromium smoke — `npm run test:e2e`, `tests/e2e/datepicker.spec.ts`; 1 passed 9.5s; closes structural gap F-4.2-02 (jsdom structurally cannot exercise the lazy Radix chunk) |

**QA verdict:** ✅ **SHIP** — all 5 gates green; H1–H8 verified; `asChild` blast-radius clean; free win F-4.2-01 documented. E2E smoke 1/1 passed.

**Free win (F-4.2-01):** Primitive-level `button.tsx` fix simultaneously resolved a latent identical P1 in the `Block rider` `AlertDialogTrigger asChild` path on `/admin/pending-riders` at zero incremental cost.

**Hotfix gate results:** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.31 kB gzip** (band 191.1–198.9 ✓) · test **55/55** ✅ · e2e 1 smoke ✅

**Bundle baseline update:**
- Main bundle: **195.31 kB gzip** (±2% band 191.1–198.9 kB — unchanged)
- Async DatePickerPopover chunk: **28.94 kB gzip** (+0.19 kB vs 4.1 — well within noise)

Full QA addendum in `docs/qa/iter4-review.md` §Iteration 4.2 addendum.

### Iteration 4.3 Perf Fix ✅ COMPLETE 2026-07-30

**Problem:** First-click spinner on the DOB picker — Suspense fallback fired while the lazy `DatePickerPopover` chunk was fetched, causing a visible flash on slow networks.

**Fix:** Memoised shared loader (`src/components/DatePickerPopover.loader.ts`) + layered prefetch strategy: `requestIdleCallback` (1.75 s `setTimeout` fallback) fires on mount; `pointerenter`/`focus` on the trigger accelerate prefetch for pointer/keyboard users. All three paths funnel through a single memoised `import()` promise (exactly-one-request invariant). Code-split preserved; Suspense spinner retained as slow-network safety net.

| Commit | Scope |
|--------|-------|
| `678d753` | perf(components): memoised shared loader + layered prefetch (requestIdleCallback + pointer/focus hooks) |
| `aa7ed38` | docs: QA Iteration 4.3 addendum committed |

**QA verdict:** ✅ **SHIP** — `docs/qa/iter4-review.md` §Iteration 4.3 addendum. H1–H8 all 🟢. No new tests needed (behavior is real-browser/real-network; existing E2E smoke 1/1 ✅).

**Hotfix gate results:** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.46 kB gzip** (band 191.1–198.9 ✓) · test **55/55** ✅ · e2e 1/1 ✅

**Bundle baseline update:**
- Main bundle: **195.46 kB gzip** (±2% band 191.1–198.9 kB — unchanged)
- Async DatePickerPopover chunk: **28.93 kB gzip** (−0.01 kB vs 4.2 — within noise)

### Iteration 4.4 Datepicker Simplification ✅ COMPLETE 2026-07-30

**Owner decision (Danial Khan, 2026-07-30):** At ~224 kB total the app doesn't justify micro-splitting the 29 kB picker chunk against the cost of `React.lazy` + `Suspense` + `pickerMounted` state + prefetch (idle + pointerenter/focus) + spinner + loader-module machinery. `DatePickerPopover.tsx` + `DatePickerPopover.loader.ts` deleted; all logic folded into `DatePickerField.tsx` (static imports, Radix controlled `open` state). **Net result: −146 lines, zero loading states, single JS chunk.** Route-level code-splitting to be reconsidered when the app genuinely grows (see D22).

| Commit | Scope |
|--------|-------|
| `0f79f7e` | refactor(components): merge DatePickerPopover into DatePickerField, drop lazy split, static imports, controlled Radix open |
| `0b764d0` | docs: QA Iteration 4.4 addendum (verdict SHIP; F-4.4-01 doc-only, F-4.4-02 recommend-only) |
| `3b9e1bf` | chore: stale-comment cleanup |

**Iteration 4.4 gate results (final):** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 15.4s / **223.43 kB gzip SINGLE chunk** (no async chunks) · test **55/55** · e2e 1/1 ✅

**Bundle baselines reset:**
- Main bundle: **223.43 kB gzip** (±2% band **219.0–227.9 kB**)
- Async DatePickerPopover chunk: **no longer exists** — picker/calendar are statically bundled into main

**QA F-findings:**
- F-4.4-01 — Minor/doc-only: stale JSDoc in `RegisterPage.tsx:286-288` references "lazy split PRESERVED" post-simplification; non-blocking, refresh next time file is edited
- F-4.4-02 — Recommend-only: re-adding jsdom "select-a-date → ISO wire" test not recommended (E2E + contract.test.ts cover the invariant; rdp v8 native overlay fragile in jsdom)

---

## Iteration 5 — Backend Wire-Compat, All Riders Table & Backlog Batch ✅ COMPLETE

### Batch A — Backend Wire-Compat (commits `b2cd8ce` + `e17ecb3`)
- **H1 contract amendment**: `POST /register/user` field renamed `phoneNumber` → `phone` (backend confirmed 2026-07-30); `RegisterPage`, `PendingRiders`, MSW handler, ADR-0003 contract table all updated in same-commit sweep.
- **Wire aliases**: `area`/`rideArea` and `activation_status`/`activated` (boolean) both accepted at the boundary; normalisation in `toAllRidersRow()` and `toPendingRider()`.

### Batch B — All Riders Admin Table (ADR-0004)
- **Route**: `/admin/all-riders`, `ProtectedRoute allow={["Admin","Operator"]}` — same guard group as active/pending riders (ADR-0002 QA-F3 Option A). Static import (D22 threshold not reached).
- **Engine**: hand-rolled sort/filter/paginate over client array (ADR-0004 Decision 1) — TanStack Table deferred; ~150 LOC `useMemo` chains; zero new deps.
- **Data contract**: new proposed endpoint `POST /GetAll/Riders` (`API_GET_ALL_RIDERS_URL`); MSW handler + ADR-0003 row added same-commit (H6); server-ready for backend. Response `{ riders: [...] }`, 7 columns (ID, Name, Phone, CNIC, Status, Area, Joined).
- **Features**: status tabs (All/Active/Pending/Blocked/Offboarded), 300ms-debounced search, 3-state single-column sort, pagination 10/25/50/100 (default 10), **URL-persisted filters** (`?status=&q=&sort=&dir=&page=`), sticky header, row → `RiderDetailSheet` (shadcn `Sheet` primitive).
- **CSV export** RFC-4180 (~30-LOC `src/features/riders/csv.ts`); exports filtered view; filename `rydee-riders-{tab}-{YYYY-MM-DD}.csv`. XLSX deferred (D23 — needs ~90 kB dep or band bump decision).
- **D6 closed** (see Iter 2); **D16 closed** (regression test `register-flow.test.tsx` added).

### Batch C — Backlog Batch
- **D6/D16 closed** — final verification + register-flow regression test.
- **D10/D7 investigated** — D10: only 10/47 shadcn primitives used; zero packages removed (H4-blocked, needs owner decision; see Open Items). D7: both Google Maps and Leaflet confirmed live in app code; owner decision pending.
- **Bundle guard band reset** (D24): Radix Dialog first entered bundle via `Sheet`; new band **221.5–224.5 kB** (`zlib.gzipSync` default-6, Node `>=24 <25`). D23 reference to 219–227.9 kB superseded.
- **Node engines pinned** `>=24 <25` in `package.json` for deterministic gzip measurements.
- **D25 tracked**: Radix Sheet emits `Function components cannot be given refs` warning in test stderr (H4-locked, non-functional; see D25).

### Gate results
lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **223.12 kB gzip SINGLE chunk** (band 221.5–224.5 ✓) · test **96/96** vitest · e2e **1/1** Playwright ✅

### ⚠️ Correction on QA cert 2026-07-30
The 2026-07-30 QA cert reported "vitest 61/61" — this was a miscount. Verified true count at that snapshot was **55**. No tests were lost; the miscount was a reporting error. Current count is 96/96 (55 baseline + 41 new Iter 5 tests: all-riders suite, bundle-size guard, CSV unit, mapper unit, register-flow regression).

---

## Iteration 6 — i18n EN/UR (ADR-0005) ✅ COMPLETE (on main, tip `57723f0`)

### Scope (owner Option A — full extraction, machine-draft Urdu accepted for owner review)
- **Library**: react-i18next v26 (i18next core + react binding), statically bundled resources, no Suspense loading states, no browser-language detection.
- **Languages**: `en` (default, English-complete) + `ur` (Urdu, machine draft — Mixed register: Careem/Foodpanda-Pakistan style, English loanwords in Urdu script for domain nouns; natural Urdu for verbs/toasts/dates; Latin digits; interpolation preserved byte-identical).
- **Scope**: UI chrome only (nav, buttons, headings, table headers, form labels, validation messages, empty states, aria-labels). NOT data values, NOT date formats (DD/MM/YYYY stays), NOT CSV content. NO RTL mirroring by owner decision.
- **Extraction**: 219 keys across 5 namespaces — `common` (4) / `layout` (12) / `auth` (34) / `dashboards` (55) / `riders` (114).
- **Runtime switcher**: three mount points — sidebar footer (`AppSidebar.tsx`), auth shell footer (`AuthShell.tsx`), and dashboard header (`DashboardHeader.tsx`). Switcher label shows the currently-active language (fixes an ambiguous-click bug when `ur.json` shares strings with `en.json`; original plan called for target-language label).
- **Persistence**: `rydee.lang` localStorage key, separate from H7 session envelope. English default on first visit.

### Accepted deviations from ADR-0005 plan
1. **i18next v26 `initImmediate` config option omitted** — removed in v26.
2. **Typed-key augmentation via `i18next.d.ts` dropped** — v26's type resolution differs from the v23 assumption in the plan; keys remain plain strings validated at runtime.
3. **Switcher label displays active language, not target** — bug fix, see above.
4. **`ur.json` shipped as machine-authored Mixed-register DRAFT** — owner reviews and corrects via reconciliation table in `docs/design/i18n-strings.md`. Five explicit register-style open questions surfaced there (see D27).

### Files delivered
- `src/i18n/index.ts` — i18next init, resource bundling, `rydee.lang` persistence
- `src/i18n/locales/en.json` — 219 keys (English-canonical)
- `src/i18n/locales/ur.json` — 219 keys (machine-draft Urdu, pending owner review)
- `src/components/LanguageSwitcher.tsx` — active-language-label variant
- `src/main.tsx` — imports `@/i18n` before RouterProvider
- Wiring: `AppSidebar.tsx`, `DashboardLayout.tsx`, `DashboardHeader.tsx`, `AuthShell.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `Dashboard.tsx`, `RiderDashboard.tsx`, `AllRiders.tsx`, `PendingRiders.tsx`, `BlockedRiders.tsx`, `ActiveRiders.tsx`, `RiderDetailSheet.tsx`, `RiderProfileCard.tsx`, `RiderLocationView.tsx`
- `docs/design/i18n-plan.md` — implementation plan (Steps 1–8)
- `docs/design/i18n-strings.md` — reconciliation table (en.json ↔ ur.json draft) + register style notes + 5 open questions
- `docs/adr/0005-i18n.md` — status flipped Proposed → **Accepted** 2026-08-04 with acceptance note listing the four deviations above

### Sanctioned test edits (only two, cumulative for this iteration)
1. `tests/setup.ts` — added `import "@/i18n";` so vitest boots i18next before RTL renders.
2. `tests/regression/bundle-size.test.ts` — `BAND_MIN_KB` / `BAND_MAX_KB` reset to **265.4 / 268.4** (from prior 260.5 / 263.5 baseline set at iter start; fresh-measured 266.87 kB ± 1.5). D24 register updated.

No app tests written or removed. No other test files touched.

### Process record (honest, per "Correction on QA cert" precedent below)
- **Process violation 1 (2026-08-04)**: sub-agent executed i18n-plan Steps 3–6 in one uninterrupted sweep instead of one-step-per-dispatch with owner live review between steps. Owner Option A accepted the extraction as-is; the ownership rule is reinforced going forward: one plan step per dispatch, always.
- **Process violation 2 (2026-08-04)**: sub-agent initially reported gate numbers off a stale `dist/` from before the last edits, showing bundle inside the old band. Team-lead verification caught it (fresh build measured 266.87 kB against the 260.5–263.5 band = FAIL, 114/115 tests). Corrected same cycle: fresh build + fresh vitest guard measurement, band reset, all 7 gates re-run from scratch. Rule reinforced: every reported gate number comes from a fresh run against the current tree.

### Gate results (step-8 close-out, fresh dist/ rebuild)
lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **937.00 kB raw / 273.27 kB gzip (Vite CLI) / 266.87 kB gzip (vitest zlib)** — band **265.4–268.4 kB ✓** · rg msw dist/assets/ → 0 hits · test **115/115** vitest · e2e 1/1 Playwright (last measured pre-i18n; no new mounts changed)

### Live-review polish (2026-08-04, follow-up dispatches)

After the step-8 close-out landed, the owner ran a live review and dispatched a short chain of polish cycles. All CSS-scoped and switcher-only; no locale value edits. Recorded here for completeness.

**Text direction (R4 handled at the CSS level)**
- `src/i18n/index.ts` — added `languageChanged` listener that syncs `<html lang>` between `en` and `ur` (initial sync at module load, before React mounts).
- `src/styles/theme.css` — added two scoped blocks inside `@layer base` under `html[lang="ur"]`:
  - `unicode-bidi: plaintext` on text-bearing elements (body, h1–h4, p, label, span, li, td, th, button, a, input, textarea). Makes each inline text run pick its own direction from content (Urdu → RTL, English/digits → LTR). Layout containers (flex, grid, table columns, sidebar order) NOT touched — `unicode-bidi` operates at the bidi-embedding level, not layout. No `direction: rtl` set anywhere. Handles R4 without the per-instance `dir="auto"` mitigation originally proposed in i18n-plan.md.
  - `text-align: right` — evolved across four owner verdicts to the final selector set: **h1, h2, h3, h4, p, label, li, td, th, input, textarea, `[role="alert"]`, `[role="status"]`**. **Deliberately excluded**: `button` (labels stay centered by shadcn primitive), `a` (flows with parent), `span` (too generic, would break badges/icons). `td` and `input`/`textarea` were added by owner verdict after live review; toasts/notices covered via role selectors (no new classes needed, H10). Owner override on caret-jump concern for inputs applied — standard RTL-app behaviour.

**Switcher visibility (owner brief)**
- `src/components/LanguageSwitcher.tsx` — `variant="secondary"` → `variant="outline"` plus `className` adds `border-primary/40 bg-background text-foreground hover:bg-accent hover:text-accent-foreground`. Brand-tinted subtle border makes the button clearly delineated on all 3 mounts (sidebar header, dashboard header, auth shell). Existing `className` prop preserved and appended.

**Collapsed sidebar (owner bug, 2026-08-04 late)**
- `src/styles/theme.css` — scoped the earlier Nastaliq clipping overrides (overflow:visible / white-space:normal / line-height:2 on `[data-slot="sidebar-menu-button"]` and its spans) to the expanded state only via `[data-slot="sidebar"]:not([data-collapsible="icon"])`, and added a collapsed-state rule `[data-slot="sidebar"][data-collapsible="icon"] [data-slot="sidebar-footer"] span { white-space: nowrap; }` so the footer user name no longer wraps onto two lines in the icon rail.

**Files changed in the polish batch**
- `src/i18n/index.ts` — languageChanged listener + `syncHtmlLang` helper
- `src/styles/theme.css` — two Urdu-scoped blocks (unicode-bidi + text-align)
- `src/components/LanguageSwitcher.tsx` — outline variant + brand-tinted border

**No test edits.** No new tests. No locale values changed. `en.json` / `ur.json` byte-identical to step-8 close-out.

**Verified at live-review checkpoints**
- Table column ORDER unchanged in Urdu (no `direction` on tables/rows).
- `td` cells anchor right (owner verdict); digit-heavy runs like phone/CNIC still read left-to-right within the run via `unicode-bidi: plaintext`; owner accepts the Urdu eye-path.
- Auth card headings (`<h1>`), labels (`<label>`), captions (`<p>`) anchor right in Urdu.
- English mode zero-cascade — all rules gated on `html[lang="ur"]`.
- LoginPage password field: `FieldInput` applies `pr-12` when a children slot exists; eye toggle at `right-2` has comfortable clearance, no collision with right-anchored dots. No per-field padding fix required.
- Rider search inputs (AllRiders, PendingRiders, BlockedRiders): Search icon on the LEFT (`left-3` + input `pl-9 pr-3`), no right-side icon overlap possible.
- `DatePickerField` trigger is a `<button>`, not `<input>` — not in the text-align set, unaffected.

**Risk register outcomes (i18n-plan.md)**
- R2 (Urdu webfont): owner call still pending; system font kept for now. Tracked as D28.
- R3 (glyph clipping): no clipping reported at live review; no per-instance leading fixes needed to date.
- R4 (mixed-direction text): resolved via `unicode-bidi: plaintext` CSS approach instead of per-element `dir="auto"` — simpler and H10-compliant.

### Gate results after polish batch
lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **937.21 kB raw / 273.29 kB gzip JS + 23.44 kB gzip CSS (Vite CLI) / 266.89 kB gzip main JS chunk (vitest zlib)** — band **265.4–268.4 kB ✓** (mid-band; +0.02 kB from step-8 close-out due to CSS layer growth; JS chunk bit-identical for CSS-only cycles) · rg msw dist/assets/ → 0 hits · test **115/115** vitest · e2e 1/1 Playwright (unchanged; no new mounts)

### Working-tree commit-message proposals (3 commits, plain language, no prefixes)
Owner-approved plain-language style (no `feat:`/`fix:`/`docs:` prefixes, no jargon).

1. **Feature commit** — i18n extraction + switcher + 3 mount points (step-1–8 close-out scope):
   > Add English/Urdu language support with a runtime switcher and a machine-draft Urdu translation for owner review

2. **Polish commit** — live-review CSS + switcher styling, folded across all polish cycles:
   > In Urdu mode, make all text flow right-to-left and anchor headings, labels, paragraphs, table cells, list items, notice banners, and form fields to the right edge while keeping layout and table columns unchanged; make the language button visible with a subtle border

3. **Docs commit** — close-out + this polish-sync update:
   > Close out the i18n plan, update the deferred register with the pending Urdu review and webfont decision, and record the live-review polish in the iteration log

---

## Iteration 7 — Full RTL for Urdu ✅ COMPLETE 2026-08-05

Gate-verified; QA waived this phase. Owner live-review approved all user-visible flips. Zero test assertion edits needed. Working tree uncommitted, awaiting owner's manual commits.

### Steps delivered

| Step | Scope | Notes |
|------|-------|-------|
| Step 1 — html dir sync + DirectionProvider | `src/i18n/index.ts` syncs `<html dir>` on language change; Radix `DirectionProvider` wired in `src/main.tsx` via `useSyncExternalStore`; `@radix-ui/react-direction@1.1.0` promoted from transitive to declared dep (npm no-op) | |
| Step 2 — theme.css reconciliation | 15-selector `text-align:right` block + label justify rule removed (native rtl supersedes); fonts / `unicode-bidi` / `line-height` kept; `.select-field` logical padding; `[dir=rtl]` chevron mirror; `RiderDashboard dir=rtl` exception removed | |
| Step 3 — ~68 physical→logical Tailwind conversions | 12 app files; Leaflet maps wrapped `dir=ltr`; `RiderDetailSheet` side flips (left in ur); `AppSidebar` side flips (right in ur) | |
| Step 4 — 6 `ui/` files edited (owner H4 sign-off) | `alert-dialog`, `select`, `sheet`, `dropdown-menu`, `calendar`, `sidebar` — logical classes only, minimal edits; calendar arrow glyphs position-swapped only (rdp v8 limitation, intentional) | |

### User-visible flips (all owner-approved + live-verified)

- Table columns mirror in Urdu
- Sidebar docks to the right
- Sheet slides from the left
- Icons and chevrons swap direction
- Toast anchors bottom-left
- Maps stay LTR (Leaflet wrapped)

### Gate results

lint 0 / typecheck 0 / strict 0 / build OK / **114/114 vitest** / MSW purity 0 hits / bundle **240.66 kB** (Vite CLI gzip) / **237.17 kB** (Node zlib.gzipSync default-6) — new manual reference (replaces 240.37/242.56)

---


---

## Iteration 8 — Full Dependency Update ✅ COMPLETE 2026-08-06

Gate-verified; QA waived this phase. ZERO `src/` code changes for the entire update; zero `ui/` edits; F1/H8 guard trace re-verified under react-router 8. Working tree uncommitted, awaiting owner's manual commits.

### Phase 1 — Non-major updates (22 packages)
13 Radix UI packages (same-major), Tailwind CSS 4.3.3, TypeScript 5.9.3, Playwright, and other minor/patch bumps. No API or behaviour changes.

### Phase 2 — Major version bumps

| Package | From | To | Notes |
|---------|------|----|-------|
| `@types/node` | 22.x | 24.13.3 | |
| `eslint` | 9.x | 10.8.0 | |
| `eslint-config-prettier` | 9.x | 10.1.8 | |
| `eslint-plugin-react-hooks` | 5.x | 7.1.1 | |
| `vite` | 6.x | 8.2.0 | rolldown bundler; build output verified |
| `@vitejs/plugin-react` | 4.x | 6.0.5 | |
| `vitest` | 2.x | 4.1.10 | |
| `react` + `react-dom` | 18.3.1 | 19.2.8 | |
| `@types/react` + `@types/react-dom` | 18.x | 19.x | |
| `react-leaflet` | 4.x | 5.0.0 | |
| `react-day-picker` | 8.x | 8.10.2 | v8 latest — peers widened for React 19, no override needed |
| `react-router` | 7.x | 8.3.0 | **Clears GHSA-qwww-vcr4-c8h2**; npm audit now 0 |
| `lucide-react` | 0.x | 1.29.0 | |

### Process record
Killed-agent handoff mid-Batch-A noted (process record). Team Lead verified gate results on resume.

### Gate results
lint 0 / typecheck 0 / strict 0 / build OK / **114/114 vitest** / MSW purity 0 hits / npm audit **0** / bundle **250.59 kB** (Vite CLI gzip) / **244.72 kB** (Node zlib default-6)

### Parked / deferred
- **react-day-picker v10 + date-fns v4** — calendar.tsx rewrite not justified; tracked D35.
- **TypeScript 7** — ecosystem shakeout; tracked D36.

---

## Security Review ✅ COMPLETE 2026-08-06

Owner-requested. 10 findings (0 Critical / 1 High / 3 Medium / 4 Low / 2 Info). Full report: `local-docs/qa/security-review.md`.

| ID | Sev | Disposition |
|----|-----|-------------|
| S-01 | High | ✅ **FIXED** — CSV formula injection guard (`'`-prefix OWASP neutralisation) in `src/lib/csv.ts`; 5 additive test assertions. |
| S-02 | Medium | 🚫 **DISMISSED BY OWNER** — no backend `/logout` endpoint; server TTL accepted. Tracked D31. |
| S-03 | Medium | ✅ **FIXED** — `escapeValue: true` in `src/i18n/index.ts`; no `dangerouslySetInnerHTML`/`<Trans>`/HTML-in-locales confirmed. |
| S-04 | Medium | 📋 **ACCEPTED TRADE-OFF** — `localStorage` session documented; CSP deferred to hosting. |
| S-05 | Low | ✅ **FIXED** — mock seed removed from prod bundle (fn9); further closed by `dd4648a`: dedicated `/get-active-riders` endpoint removed; active riders now filtered from `/get-all-riders`; `src/mocks/data/riders.ts` deleted; ADR-0003 fn10; dist verified 0 hits. D32 CLOSED. |
| S-06–S-10 | Low/Info | 📋 **NOTED** — hosting-level or future hardening (D33, D34, S-09 CI note). |

S-01, S-03, S-05 fixes are all in commit (f) of the pending-commit list.

---

## Key Decisions

| Decision | Detail | ADR / Doc |
|----------|--------|-----------|
| Feature-based folder structure | `src/features/{auth,riders,dashboards}` + shared `components/lib/types/mocks`; cross-feature imports forbidden | [ADR-0001](adr/0001-target-folder-structure.md) |
| react-router 7 library mode | `createBrowserRouter`; guards as layout routes; no SSR/framework mode | [ADR-0002](adr/0002-routing-and-auth.md) |
| MSW 2.x mock API | Service-worker interception; app fetch unchanged; `VITE_ENABLE_MSW` flag; tree-shaken from prod | [ADR-0003](adr/0003-mock-api-msw.md) |
| MSW login contract: `phone` not `email` | `LoginPage` sends `{ phone, password }` — handler fixed to match (QA F6); ADR-0003 table amended | ADR-0003 fn¹ |
| QA F3 resolved Option A (user decision) | Operator allowed on `/admin/active-riders`, `/admin/pending-riders`, `/admin/riders/:riderId/location` | ADR-0002 fn¹ |
| Session persistence — localStorage v1 envelope | `{ v: 1, profile, savedAt }`, 24h TTL, versioned for future v2 bump; `session.ts` is sole read/write path (H7) | ADR-0002 |
| Customer seed = F1 regression tripwire | `phone: 0300444444` must never be deleted — only in-app way to smoke-test the unknown-role logout path | [mocks/README.md](../src/mocks/README.md) |
| shadcn/ui adopted across all pages (D8 CLOSED) | 48 `components/ui/` files consumed untouched (H4); Palette A selected; 32 JS style handlers removed; `shared-styles.ts` deleted | [docs/qa/d8-restyle-review.md](qa/d8-restyle-review.md) |
| Leaflet-only (D7 CLOSED 2026-08-05) | Deleted `RiderLocationView`, its route (`/admin/riders/:riderId/location`), `DashboardLayout.tsx` location special-case, 3 i18n keys (en+ur), `@react-google-maps/api` (−9 packages); app is Leaflet-only; no Google Maps key needed | D7 |
| `strict: true` enabled (Iter 2) | Flipped in `e84b920`; `typecheck:strict` script now redundant — candidate for future chore to fold | [strict-errors.md](design/strict-errors.md) |
| API contract frozen (H1) | Field names, `credentials:include`, endpoint paths locked; MSW handlers are the living contract | ADR-0003 |
| AGENTS.md is canonical contributor rules | H1–H8 hard rules bind all contributors and AI coding tools | [AGENTS.md](../AGENTS.md) |
| New endpoint `/GetAll/UnregisteredRiders` | `API_GET_UNREGISTERED_RIDERS_URL` in config; MSW handler + ADR-0003 row added in b0ef29c | ADR-0003 fn² |
| PendingRiders live-endpoint migration deferred | Mock-driven UX preserved; migration tracked as D18 | D18 |
| D13 (git history rewrite) — optional/low-priority | Google Maps key rotated (2026-07-30); old history purge is cosmetic only now | D13 |
| react-router 8.3.0 upgrade (Iter 8) | Clears GHSA-qwww-vcr4-c8h2; npm audit 0; ZERO src/ code changes; F1/H8 guard trace re-verified | Iteration 8 |
| Bundle baseline reset (Iter 3) | 192.90 kB gzip; +22.83 kB = Radix AlertDialog + Checkbox runtime; UX-approved | [d8-restyle-review.md](qa/d8-restyle-review.md) §5 |
| DOB wire format (Iter 4) | UI displays DD/MM/YYYY; `dob` field submitted as ISO YYYY-MM-DD — product decision 2026-07-30, documented in ADR-0003 footnote | ADR-0003 |
| Minimum registration age 18 (Iter 4) | Supersedes spec §1.3/§2.3 draft value of 16; enforced in validation + datepicker year bounds — product decision 2026-07-30 | [iter4-spec.md amendment](ux/iter4-spec.md) |
| DobPicker lazy chunk (Iter 4) | react-day-picker heavy; code-split via `React.lazy` — 28.64 kB gzip async, loads on first picker open | `1dc7781` |
| Bundle baseline reset (Iter 4) | Main **195.04 kB gzip** (±2% band 191.1–198.9 kB); DobPicker async chunk 28.64 kB — reset in `532391d` | [iter4-review.md](qa/iter4-review.md) §1 |
| DOB entry is picker-only (canonical shadcn date-picker pattern); typed DD/MM/YYYY entry removed — supersedes iter4-spec §2.2 (owner decision 2026-07-30) | Ghost-icon-in-input trigger rejected as undiscoverable; shared `DatePickerField` + `DatePickerPopover` components adopted on RegisterPage + PendingRiders; ISO wire preserved; picker bounds unchanged | [iter4-spec.md amendment](ux/iter4-spec.md) §Iter 4.1 / `29099e3` / `6113b5c` |
| `ui/button.tsx` + `ui/calendar.tsx` rewritten (Iter 4.2 P1) — version-skew class of bug; H4-compliant full-file swap | `button.tsx` restored to `React.forwardRef` for React 18.3.1/Radix `asChild` compatibility; `calendar.tsx` classNames mapped to react-day-picker v8 CaptionDropdowns; fixed P1 + free-win F-4.2-01 | `ab2a32c` / `65e966b` |
| E2E smoke policy (Iter 4.2, owner-delegated, QA rec F-4.2-04, adopted 2026-07-30) | `npm run test:e2e` (Playwright Chromium, opt-in) is the pre-release gate for `ui/{button,popover,calendar,alert-dialog}`, `DatePickerField/Popover`, or any lazy Radix surface; NOT a default CI gate until ≥ 3 specs and < 60s (see Conventions/Gates note) | `54d1121` / [iter4-review.md](qa/iter4-review.md) §F-4.2-04 |
| Datepicker eager-bundled — lazy split removed (owner, 2026-07-30); revisit splitting at route level as app grows | At ~224 kB the micro-split premium (Suspense spinner + loader machinery) exceeded its value; `DatePickerPopover` + loader folded back into `DatePickerField` static imports; −146 net lines; single JS chunk; see D22 | `0f79f7e` / [iter4-review.md](qa/iter4-review.md) §Iter 4.4 |
| H1 contract amendment — `phoneNumber` → `phone` (2026-07-30) | Backend confirmed field rename; `RegisterPage`, `PendingRiders`, MSW handler, ADR-0003 contract table all updated same-commit (`b2cd8ce`); wire aliases `area`/`rideArea` + `activation_status`/`activated` honoured at boundary | ADR-0003 H1 amendment |
| All Riders admin table — hand-rolled engine (ADR-0004) | `/admin/all-riders`, Admin+Operator, `POST /GetAll/Riders` server-ready mock, RFC-4180 CSV, 7 cols, URL-persisted filters, sticky header, RiderDetailSheet | [ADR-0004](adr/0004-riders-data-table.md) |
| Bundle guard band reset to 221.5–224.5 kB (D24) | Radix Dialog entered bundle via Sheet primitive; `zlib.gzipSync` default-6 / Node `>=24 <25` is CI determinism anchor; old 219–227.9 band void | D24 |
| ~~No RTL mirroring for Urdu (Iter 6, 2026-08-04)~~ — **SUPERSEDED 2026-08-05** | Iter-6 owner decision: Urdu mode used `unicode-bidi: plaintext` + `text-align: right` only; layout containers not touched; no `dir` attribute set | Superseded by Iter-7 row below |
| Full RTL mirroring for Urdu (Iter 7, 2026-08-05) — supersedes Iter-6 no-RTL verdict | `html[lang=ur]` gets `dir=rtl`; `@radix-ui/react-direction` DirectionProvider via `useSyncExternalStore` in `main.tsx`; ~68 physical→logical Tailwind conversions across 12 app files; theme.css 15-selector `text-align:right` block + label justify rule removed (native rtl handles it); 6 `ui/` files edited with owner H4 sign-off; Leaflet maps wrapped `dir=ltr`; sidebar docks right in ur, sheet slides left, toast bottom-left; calendar arrow glyphs position-swapped only (rdp v8 limitation, intentional); QA waived; gate-verified lint 0 / typecheck 0 / strict 0 / build OK / 114/114 vitest / MSW purity 0 | [rtl-plan.md](design/rtl-plan.md) |
| ActiveRiders derives from POST /get-all-riders (D32 closed, 2026-08-06) | Dedicated `/get-active-riders` endpoint removed; active riders filtered client-side from `/get-all-riders` by `activationStatus==='active'` + usable `currentLocation`; `src/mocks/data/riders.ts` deleted; ADR-0003 fn10 documents the change; H6-compliant (`API_GET_ALL_RIDERS_URL` reused) | ADR-0003 fn10 / `dd4648a` |
| SPA fallback for Hostinger (`12c87d7`) | `public/.htaccess` added with SPA rewrite rules; fixes deep-link 404 on production Hostinger hosting | `12c87d7` |
| Rider Profile Edit — unified card, diff-only save, mock-first docs + status + PIN | Route `admin/riders/:phone/edit`; instant render via `location.state` seed; `POST /update-user`; 7-type document enum; avatar = `profile_photo` doc; Status card (action buttons); PIN card (`/reset-rider-pin` mock); xl two-column layout; `ui/textarea.tsx` new primitive; `postMultipartWithProgress` XHR helper | `local-docs/ux/rider-profile-edit-plan.md` (rev 10) |
| Rides feature + live map (ADR-0006, 2026-08-07) | `/admin/rides` list + `/admin/rides/:rideId` full-page map; 12s polling; `ui/map.tsx` single map-engine seam; `ui/chart.tsx` recharts lazy-isolated `RidesCharts` chunk; rides endpoints MOCK-ONLY (D41); `canceledBy` narrowed to `rider\|customer`; stalled threshold 3 min; rideId format `R-XXXXXX`; fare PKR both roles; no CSV export | [ADR-0006](adr/0006-rides-and-live-map.md) |
| Env-validation: `VITE_API_BASE_URL` ignored in mock mode (2026-08-07) | When `VITE_ENABLE_MSW=true`, `env-rules.ts` forces base URL to `''` (same-origin) and omits the required-non-empty check — demo deploys (host forbids empty env vars) can omit the var entirely; mock mode can never call the real API; MSW=false strictness unchanged | `src/lib/env-rules.ts` / `.env.example` / pending commit (E) |

---

## QA History

### C5 Review (2026-07-29)

| Finding | Sev | Resolution |
|---------|-----|------------|
| **F1** — Infinite redirect loop for unknown/Customer roles | BLOCKER | ✅ Fixed `8c22e86` |
| **F2** — `Admin` added to self-service ROLES | MAJOR | ✅ Fixed `8c22e86`; product question → D14 |
| **F3** — Operator "Active/Pending Riders" buttons were silent no-ops | MAJOR | ✅ Fixed `884a0a4` |
| **F4** — `login()` role-overwrite | Minor | ✅ Fixed `6b114d2` (D15 CLOSED) |
| **F5** — Post-register `navigate` pushes history | Minor | ✅ Fixed `6b114d2` (D16 CLOSED) |

### C6/C7 Release Readiness (2026-07-29)

| Finding | Sev | Resolution |
|---------|-----|------------|
| **F6** — MSW login handler matched `email` but app sends `phone` → always 401 | BLOCKER | ✅ Fixed `c649bd8` |
| **F7** — ADR-0003 listed `{ email, password }` for login | Major (doc) | ✅ Fixed `c649bd8` |
| **F8** — README seed table used email addresses | Minor | ✅ Fixed `c649bd8` + `6a04f71` |

**Final C6/C7 verdict:** ✅ SHIP — lint 0e/14w · typecheck 0 · typecheck:strict 0 · build 595.16 kB / 168.15 kB gzip.

### D9 Session Persistence (2026-07-29)

**Verdict:** ✅ SHIP 11/11. F1 loop stays broken across refreshes. Residuals I1–I5 → D17.

### Pre-Push Merge Review b0ef29c (2026-07-29)

**Verdict:** ✅ PUSH-SAFE. All H-rules respected, all gates green, remote intent faithfully ported, PendingRiders rewrite deferred as D18. Gates: lint 0e/14w · typecheck 0 · typecheck:strict 0 · build 597.24 kB / 168.69 kB gzip (+0.32% — within ±2% budget). See `docs/qa/release-readiness.md` §Pre-Push Merge Review.

### D8 Restyle Review (2026-07-30)

**Verdict:** ✅ SHIP. All gates green; H1/H2/H3/H4/H6/H7/H8 verified via targeted diff; all major a11y findings closed; bundle 192.90 kB gzip with plausible attribution; 5/5 documented deviations present in-file. F1–F3 are P3 trivia → D19/D20/D21. See `docs/qa/d8-restyle-review.md`.

### Iteration 4 Review (2026-07-30)

**Verdict:** ✅ **SHIP**. Gates at `532391d`: lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 195.04 kB gzip (in band) · test 58/58. H1–H8 all respected. 3 INFO findings: F1 hash citation (docs-only), F2 spec age draft resolved by amendment in `docs/ux/iter4-spec.md`, F3 cursor rule improvement (no action). See `docs/qa/iter4-review.md`.

### Iteration 4.3 Perf Fix Review (2026-07-30)

**Verdict:** ✅ **SHIP**. Gates at HEAD `678d753`: lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.46 kB gzip** (in band) · test **55/55** · e2e 1/1. H1–H8 all 🟢. Bundle split preserved; loader-pattern (dedup, failure-reset, idle guard, keyboard) verified. See `docs/qa/iter4-review.md` §Iteration 4.3 addendum.

### Iteration 4.2 P1 Hotfix Review (2026-07-30)

**Verdict:** ✅ **SHIP**. Gates at HEAD `65e966b`: lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.31 kB gzip** (in band) · test **55/55** · e2e 1/1 smoke. H1–H8 verified; `asChild` blast-radius confirmed clean; free win F-4.2-01 (AlertDialogTrigger fix). See `docs/qa/iter4-review.md` §Iteration 4.2 addendum.

### Iteration 4.4 Datepicker Simplification Review (2026-07-30)

**Verdict:** ✅ **SHIP**. Gates at HEAD `0f79f7e`: lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **223.43 kB gzip SINGLE chunk** (no async chunks) · test **55/55** · e2e 1/1. All lazy machinery (`React.lazy`, `Suspense`, `pickerMounted`, prefetch loader) removed from source. Every 4.1–4.3 behavioral contract preserved (dropdown-buttons caption, 1940..current-18 bounds, DD/MM/YYYY display, ISO wire, ARIA wiring, field-styling locks). Bundle baseline reset; old 191.1–198.9 kB band void; new band 219.0–227.9 kB. F-4.4-01 doc-only (stale JSDoc comment); F-4.4-02 recommend-only. See `docs/qa/iter4-review.md` §Iteration 4.4 addendum.

---

## Open Items — Deferred Work Register

| ID | Item | Owner | Priority |
|----|------|-------|----------|
| D1 | ~~DOB input uses `type="number"`~~ **CLOSED** — fixed `6b114d2` | — | Closed |
| D2 | ~~Invalid `autoComplete` attribute values~~ **CLOSED** — fixed `6b114d2` | — | Closed |
| D3 | ~~`Boolean` (object type) in `Profile` interface~~ **CLOSED** — folded into Profile unification `e84b920` (`online: boolean`) | — | Closed |
| D4 | ~~`RiderDashboard.tsx` self-import (`NavigateParams`)~~ **CLOSED** — fixed `e84b920` | — | Closed |
| D5 | ~~`ImageWithFallback.tsx` unimported — delete or adopt~~ **CLOSED** — route adapter split `fe6c64f` | — | Closed |
| D6 | ~~Unify `RiderDashboard` inline `Profile`; remove `@ts-nocheck`; flip `strict: true`~~ **CLOSED** — `e84b920` | — | Closed |
| D7 | **CLOSED 2026-08-05** — deleted `RiderLocationView.tsx`, route `/admin/riders/:riderId/location`, `DashboardLayout.tsx` location special-case, 3 i18n keys (en+ur), `@react-google-maps/api` (−9 packages). App is Leaflet-only; no Google Maps key needed. | — | Closed |
| D8 | ~~Adopt `components/ui/` (shadcn) in pages — restyle iteration~~ **CLOSED** — `57545a6`/`38c773b`/`1a6962f`/`f3e195d`; QA SHIP 2026-07-30 | — | Closed |
| D9 | ~~Auth session persistence~~ **CLOSED** — localStorage v1 envelope + 24h TTL shipped `0960516`. Client-side done. Note: when backend delivers tokens, the session envelope will bump to v2 `{ accessToken, refreshToken, expiresAt }` (additive change via `session.ts` — H7; trade-off localStorage vs httpOnly-cookie decided in a future ADR). | — | Closed |
| D10 | ~~Initial dep audit~~ **CLOSED** (`6f4e165`). **CLOSED (shadcn prune) 2026-08-05** — 19/48 `components/ui/` files kept; 29 deleted; 24 packages uninstalled (61 incl. transitive). CSS gzip 31.98 → 28.08 kB; JS bundle unchanged (tree-shaken). H4 preserved for survivors. | — | Closed |
| D11 | `Customer` role — route/home destination undefined; `roleHome` falls back to `/login` + logout | Architect + PM | Backlog |
| D12 | ~~Reuse MSW handlers in Node for vitest/Playwright test suite~~ **CLOSED** — vitest + RTL + msw/node, 44 regression tests (`79ffdbc` + `2ac660b`) | — | Closed |
| D13 | Optional git-history rewrite to purge leaked `.env` — **optional / low-priority** (key rotated 2026-07-30; old history cosmetic only) | DevOps / PM | Low / Optional |
| D14 | **CLOSED 2026-08-05** — owner decision: `Admin` must NOT be creatable via `/admin/register`. Current H2 behavior (`ROLES = ["Operator", "Customer", "Rider"]`) is final and working as intended. No code change. | — | Closed |
| D15 | ~~`AuthProvider.login()` overwrites `profile.role`~~ **CLOSED** — normalized at boundary `6b114d2` | — | Closed |
| D16 | ~~Post-register `navigate("/login")` should use `{ replace: true }`~~ **CLOSED** — `6b114d2` | — | Closed |
| D18 | **[Frontend task, waiting on backend readiness]** Migrate `PendingRiders` fetch to the live `POST /GetAll/UnregisteredRiders` endpoint — frontend call-site swap; mock-driven UX preserved and ready to wire. No frontend action until the endpoint is stable on the backend. | Frontend Dev | Backlog |
| D19 | **[QA D8-F1/P3]** `--primary #0d8f6e` = 4.06:1 on white text — passes AA-Large / UI 3:1 but fails AA-normal 4.5:1. Options: (a) accept as documented Palette-A trade-off (already in `theme.css` comment), or (b) darken flat token to `#0a7c5f` (5.17:1) in a follow-up polish commit. Non-blocking; real button labels at 14px semibold are borderline "large text" per WCAG. | Frontend Dev + UX | Low |
| D20 | **[QA D8-F2/P3]** `RiderDashboard.tsx:2-3` top-comment says "Table body migration deferred to Phase 4" — stale post-Phase-4. Clarify comment to state native `<table>` is the final implementation (a11y met via `sr-only <caption>` + `scope="row"`; shadcn `<Table>` adds no semantic value here). Docs-only change, non-blocking. | Frontend Dev | Low |
| D21 | **[QA D8-F3/P3]** `PendingRiders.tsx:201,265` uses `tabIndex={-1}` on read-only display Inputs (Age, PIN). Correct by design (read-only; spec §2.3), but may confuse reviewers. Consider replacing with `<p>`/`<output>` styled to match for clearer semantics. Non-blocking. | Frontend Dev | Low |
| — | `npm audit` — **0 vulnerabilities as of 2026-08-06** (Iteration 8). react-router 8.3.0 clears GHSA-qwww-vcr4-c8h2. Prior brace-expansion high fixed 2026-08-05. | — | ✅ Closed |
| — | Bundle-size tracking — **no automated band guard** (D30 CLOSED 2026-08-05; `bundle-size.test.ts` deleted by owner). Manual reference post-Iter8: **250.59 kB** (Vite CLI gzip) / **244.72 kB** (Node zlib default-6) — updated 2026-08-06 (Vite 8/rolldown). Measure and label both per task; never compare across methods. Note: `ai-session-instructions.md` cites stale numbers — owner-managed file. | Frontend Dev | Ongoing |
| — | `typecheck:strict` script is now redundant (same as `typecheck` since `strict: true`); candidate for a future chore to fold/remove | Frontend Dev | Low |
| D22 | Route-level code-splitting — revisit at ~300 kB gzip or heavy feature addition; seams documented | Frontend Dev + Architect | Backlog |
| D23 | XLSX export for All Riders table — needs `xlsx` (~90 kB) or D22-style chunk; defer until usage data | Frontend Dev + Architect | Backlog |
| D24 | **RETIRED 2026-08-05** — `bundle-size.test.ts` deleted (D30 CLOSED); no automated band. Manual reference post-Iter7: 240.66 kB (Vite CLI) / 237.17 kB (zlib) — updated 2026-08-05. | — | Retired |
| D25 | **CLOSED 2026-08-06 (Iter 8)** — React 19 upgrade resolves the `Function components cannot be given refs` warning class (ref-as-prop is native in React 19); D26 also resolved by same upgrade. | — | Closed |
| D27 | **CLOSED 2026-08-04** — owner accepted machine Urdu draft as-is at live review; no corrections needed. Original: **Owner Urdu review pass pending** — `ur.json` is a machine-authored Mixed-register draft; owner reviews reconciliation table in `docs/design/i18n-strings.md` and corrects globally. 5 open register-style questions surfaced there (فعال vs ایکٹیو; پن vs پن کوڈ; آف بورڈ شدہ; آئیڈل vs فارغ; رَوز vs قطاریں). D24 band will be re-measured after corrections land. | Owner (dandkhan) + Frontend Dev | **In progress** |
| D28 | **CLOSED-IMPLEMENTED 2026-08-04** — Noto Nastaliq Urdu shipped (self-hosted via @fontsource, scoped to `html[lang="ur"]`); English tokens set to Inter + JetBrains Mono (self-hosted); no external CDN; fonts are separate asset files, JS band unaffected. Original: **Urdu webfont decision (i18n)** — currently uses system font stack for both languages. If owner rejects at live review, choose between Noto Naskh Arabic (~30–40 kB subsetted) or Noto Nastaliq Urdu / Jameel Noori Nastaliq (~80–120 kB). Load conditionally when `lang="ur"`. Would land as ADR-0005 amendment + D24 re-measure. | Owner + Frontend Dev | Pending owner call at live review |
| **✅ CLOSED 2026-08-05** | D7 — `RiderLocationView` + route + DashboardLayout special-case + 3 i18n keys (en+ur) + `@react-google-maps/api` deleted. App is Leaflet-only. | — | Closed |
| **✅ CLOSED 2026-08-05** | D10 — 29/48 `components/ui/` files pruned; 24 packages uninstalled (61 incl. transitive); CSS gzip 31.98 → 28.08 kB. | — | Closed |
| **Product Q** | D11 — Customer route/home destination (still open; see D11) | PM + Product | Backlog |
| D29 | **CLOSED 2026-08-05** — `activate-rider` and `update-user` are implemented: `src/api/riders.ts` exports `API_ACTIVATE_RIDER_URL`, `API_UPDATE_USER_URL`, `activateRider()`, `updateUser()`; consumed by `PendingRiders.tsx` (approve flow with PIN, profile save) and `BlockedRiders.tsx` (profile save); MSW handlers exist in `src/mocks/handlers/riders.ts`. Residual: `register-user` `email` field question parked per owner ("skip for now"). | — | Closed |
| D30 | **CLOSED 2026-08-05** — owner confirmed deletion of `tests/regression/bundle-size.test.ts` is intentional and permanent. No automated bundle band. Test baseline is now **114**. Bundle measured manually per task (both Vite CLI gzip and zlib labelled). `ai-session-instructions.md` cites stale 243.5–246.5 band and 115 baseline — owner-managed, flagged for owner correction. | — | Closed |
| D31 | **[Backend dependency] POST /logout endpoint** — `AuthProvider.logout()` clears client state only; no server-side session invalidation. S-02 dismissed by owner (server TTL accepted) until backend provides the endpoint. When available: add fire-and-forget `POST /logout` call before `clearSession()` in `AuthProvider.tsx`. | Backend / PM | Backlog |
| D32 | **CLOSED 2026-08-06 (`dd4648a`)** — `ActiveRiders.tsx` no longer calls a dedicated `/get-active-riders` endpoint. Derives active riders by filtering `POST /get-all-riders` results (`activationStatus==='active'` + usable `currentLocation`). Mock-only `/get-active-riders` handler and `src/mocks/data/riders.ts` seed file REMOVED. ADR-0003 fn10 documents the contract change. Backend follow-up (confirm `activationStatus` in `/get-all-riders` response) tracked in D37. | — | Closed |
| D33 | **URL param hardening (AllRiders)** — `q` and `area` URL params not enum-validated; JSX escaping currently safe but a future attribute-sink change risks reflected-XSS. Add `readSearch` (128-char cap + control-char strip) and validate `area` against `KARACHI_AREAS ∪ {"all"}`. | Frontend Dev | Low |
| D34 | **API error message mapping** — catch blocks in `LoginPage`, `RegisterPage`, `Dashboard` render raw `err.message` to user (JSX-escaped, not XSS). A misconfigured backend returning stack traces / SQL fragments leaks them to the UI. Map known HTTP status codes to i18n keys at API-client layer; keep raw text in `console.error` only. | Frontend Dev | Low |
| D35 | **react-day-picker v10 + date-fns v4 upgrade** — PARKED. Would require rewrite of `DatePickerField.tsx` / `ui/calendar.tsx`. Not justified by current app requirements. | Frontend Dev | Backlog |
| D36 | **TypeScript 7 upgrade** — DEFERRED pending ecosystem shakeout (ts-node, ts-jest, eslint-typescript-parser compatibility unknown at 2026-08-06). Re-evaluate once major toolchain plugins ship stable TS 7 support. | Frontend Dev | Backlog |
| D37 | **[Backend follow-up list — owner to relay] (2026-08-06, updated 2026-08-07)** (1) Fix `/get-all-inactive-riders` empty response — return `{riders:[]}` not error shape. (2) Confirm `/update-user` accepts `activationStatus`, `cnic`, `dob`, and `name` fields (assumption used by Rider Profile Edit — see D40). (3) Confirm `/get-all-riders` response includes `activationStatus` (needed by `dd4648a` active-riders filter). (4) Rider-document endpoints and PIN reset — now tracked as D38 and D39. (5) ~~Pre-existing gap: `BlockedRiders` unblock is local-state-only~~ **CLOSED 2026-08-11 (ADR-0007 Wave 1)** — page removed; unblock lives solely on `RiderEditPage`. (6) Someday: single-rider fetch endpoint for `/admin/riders/:phone/edit` fallback. (7) Rides endpoints (D41): `POST /get-rides`, `POST /get-ride`, `POST /get-rides-summary` — backend has zero ride support; production shows 'unavailable'. (8) Rides additive fields (D42): `routePolyline`, `traveledPath`, `plannedDistanceKm`, `traveledDistanceKm`, `waitingMinutes`, `eta` — backend must supply or self-host OSRM. | Owner (dandkhan) / Backend | High |
| D38 | **[MOCK-ONLY] Rider document endpoints** — `POST /get-rider-documents`, `POST /upload-rider-document`, `DELETE /delete-rider-document`. Backend has ZERO endpoints for rider documents (verified against `docs/design/API-Document.pdf`). Frontend MSW handlers implement: upsert semantics, 7-type enum (`cnic_front`, `cnic_back`, `bike_registration`, `driving_license`, `utility_bill`, `profile_photo`, `other`), optional `name` field for `other` type, 2 MB file-size limit, PDF/JPG/PNG allowlist (images-only for `profile_photo`), signed-URL download stub. Production renders 'temporarily unavailable' fallback until backend ships. Blocked on backend implementation — owner to relay handover list. | Owner (dandkhan) / Backend | High |
| D39 | **[MOCK-ONLY/PROPOSED] `POST /reset-rider-pin`** — PIN reset flow built mock-first. Proposed contract: `{ phone, role }` → `{ pin: string }` (plaintext, returned once, hash-only stored). Frontend: confirm AlertDialog → POST → non-dismissable one-time PIN dialog with Copy button. Production renders 'temporarily unavailable' fallback until backend ships. Requirements to relay: crypto-random generation, hash-only storage, plaintext returned once, rate-limit. | Owner (dandkhan) / Backend | High |
| D45 | **[QA follow-up] No test assertion covers `VITE_ENABLE_MSW=true` + missing/junk `VITE_API_BASE_URL`** — `env-validator.test.ts` and `check-env-script.test.ts` assert the happy path and the MSW=false strict failures, but no test exercises the MSW=true + absent/malformed base-URL branch. Candidate for a one-test additive assertion before the next demo deploy. | QA / Frontend Dev | Low |
| D40 | **[CONTRACT ASSUMPTION] `/update-user` accepts `activationStatus`** — Status card in Rider Profile Edit sends `{ phone, role, activationStatus }` to `POST /update-user` for Block/Offboard/Unblock/Reactivate transitions. This is an assumed extension of the existing `/update-user` contract (ADR-0003 synced with assumption flag). The `name`, `cnic`, `dob` fields are also assumed accepted (D37 item 2). Stage 3 live-wiring is blocked until backend confirms or provides a dedicated status endpoint. | Owner (dandkhan) / Backend | High |
| D46 | **[MOCK-ONLY / CONTRACT PROPOSAL] `POST /get-all-users`** — User Management page (`/admin/users`). Response `{ users: [{ role: "Admin"|"Operator", profile: { id, name, phone, email?, area?, address?, dateOfJoining? } }] }`. **Visibility rule (server-enforced, owner decision):** Admin sessions receive Admin + Operator; Operator sessions receive Operator only. Caller role MUST be derived from session cookie (never body). Mock handler reads `body.role` as development convenience — do NOT port to production. ADR-0003 fn 15. | Owner / Backend | High |
| D47 | **[Backend / Infra] Rider live-position updates** — Live Map shows static snapshot of `currentLocation` from `/get-all-riders` at page load (Wave 2 B2 stripped client-side randomization 2026-08-11). Backend must ship real-time rider position delivery: (a) WebSocket/SSE push `{riderId, lat, lon, updatedAt}`; (b) dedicated `POST /get-active-rider-positions` poll; or (c) piggyback on `/get-all-riders` poll. Owner to relay. | Backend / Infra | Medium |
| D48 | **[MOCK-ONLY / CONTRACT PROPOSAL] `POST /change-password`** — Settings tab of My Profile. Request: `{ phone, currentPassword, newPassword }` (backend derives `phone` from session cookie — never trust body). Response: `200 { success: true }`; `400 { success: false, error }` on wrong-current-password or validation failure (**NOT 401** — deliberate, 401 trips global handler); `404` unknown user. Backend: hash-compare current, hash-store new, rate-limit. ADR-0003 fn 17. | Owner / Backend | High |
| D49 | **[UX] Session-expired notice on LoginPage** — amber notice fires when global 401 handler force-logouts mid-session (`sessionStorage["rydee.expired"]="1"` + `?reason=expired`) OR when client-side session TTL expires at `loadSession()`. LoginPage reads whichever fires first, clears flag, shows notice. `/user-login` exempt from global 401 handler. Mocked exclusively; real backend must return 401 for expired/missing session cookie on all authenticated endpoints. | Frontend Dev | Low |
| D50 | **[MOCK-ONLY / Phase 2 backend need] `POST /get-my-stats`** — Wave 4 Phase 1 derives earnings/stats client-side from `/get-rides scope="mine"`. Phase 2 replaces with dedicated endpoint: `{ earningsToday, earningsWeek, ridesToday, ridesWeek, acceptanceRate, avgRating }`. Backend derives rider phone from session cookie. Phase 1 derivation kept as fallback. ADR-0008 Phase 2. **Next candidate for Wave 4 Phase 2.** | Owner / Backend | Medium |
| D51 | **[Wave 4 Phase 1 deferred] Wire-level rider identity omission in `/get-rides scope="mine"`** — mock returns full `rider.{name,phone}` on scoped rides even though `RidesTable` renders with `hideRiderColumn`. QA MINOR-2: backend contract clean-up — when scope=mine, omit `rider` block or replace with `{ self: true }`. Cosmetic (caller owns own data), but tightens wire per ADR-0008 §My Rides bullet 2. Frontend follows on contract amendment. ADR-0003 fn 14. | Backend / Frontend Dev | Low |
| D52 | **[Test infra] Vitest testTimeout bumped 5 s → 10 s** — `vite.config.ts` `testTimeout: 10000`. QA MINOR-3: cold-run flakes in `iter4-additive` and `riders-activate` at 5 s under Windows CI absorbed by bump. Revisit if any single test approaches 10 s wall time; no individual test currently near budget. Tooling note only. | QA / DX | Low |

---

## In Flight

All Waves 1–4 are **COMPLETE** (gate-verified, owner commits pending). No active frontend feature work in flight. Next candidate: Wave 4 Phase 2 (`POST /get-my-stats` — D50, gated on backend).

| Feature | Status | Owner |
|---------|--------|-------|
| Rider Profile Edit (3 stages + polish) | ✅ COMPLETE — uncommitted, pending commits A/B/C; Stage 3 live-wiring blocked on D38/D39/D40 | Frontend Dev |
| Rides | ✅ COMPLETE 2026-08-07 — pending commit D; rides endpoints MOCK-ONLY (D41) | Frontend Dev |
| Wave 1 — Portal consolidation (ADR-0007) | ✅ COMPLETE 2026-08-11 — pending owner commit | Frontend Dev |
| Wave 2 — AllRiders + LiveMap (ADR-0007) | ✅ COMPLETE 2026-08-11 — pending owner commit | Frontend Dev |
| Wave 3 — My Profile + 401 handling | ✅ COMPLETE 2026-08-11 — pending owner commit | Frontend Dev |
| Wave 4 Phase 1 — Rider Role Experience (ADR-0008) | ✅ COMPLETE 2026-08-11 — QA SHIP — pending owner commit | Frontend Dev |
| Wave 5 — Route unification + User management removal | ✅ COMPLETE 2026-08-14 — pending owner commit | Frontend Dev |

**Next steps (owner):**
1. Smoke-test the working tree against the backend.
2. Commit all pending changes (Waves 1–4 + prior batches A/B/C/D/E) to `qa` branch.
3. Relay the Backend Handover List (below) to backend dev.

## Backend Handover List

> **Owner (dandkhan) to relay to backend dev.** This is the consolidated list of all mock-only endpoints and behaviors the real backend must implement. A critical cross-cutting rule applies to every item: **the backend MUST derive the caller's identity (phone and/or role) from the session cookie — NEVER from the request body.** Mock handlers use `body.phone` / `body.role` as a development convenience only (flagged inline in each handler). See ADR-0003 for the full per-endpoint contract.

### Session-Derivation Rule (M2 — from Wave 3)

All authenticated endpoints must derive caller identity server-side. The mock's `body.phone` / `body.role` patterns are **mock conveniences only** — porting them to production would allow any client to impersonate any user. Specific enforcement points:

| Endpoint | Mock convenience | Production requirement |
|----------|-----------------|------------------------|
| `POST /get-all-users` | `body.role` scopes visibility | Derive caller role from session cookie; Admin → All, Operator → Operator only (ADR-0003 fn 15, D46) |
| `POST /get-rides` (scope=mine) | `body.phone` filters to caller | Derive caller phone from session cookie; ignore `body.phone` (ADR-0003 fn 14, D37 item 7) |
| `POST /get-ride` (scope=mine) | `body.phone` ownership check | Derive caller phone from session cookie; 404 non-owned rides (ADR-0003 `/get-ride` row, D37 item 7, QA MAJOR-1 fix 2026-08-11) |
| `POST /change-password` | `body.phone` identifies user | Derive caller phone from session cookie; hash-compare + hash-store (ADR-0003 fn 17, D48) |
| `POST /get-my-stats` (Phase 2) | Client-side derivation fallback | Derive caller phone from session cookie; return aggregated stats (ADR-0008 Phase 2, D50) |

### Endpoint Handover Items

1. **`/update-user` field confirmation (D40)** — must accept `activationStatus ∈ "active"|"blocked"|"offboarded"` as a patch field, plus `name`, `cnic`, `dob`. CONTRACT ASSUMPTION; Stage 3 live-wiring blocked on this. ADR-0003 `/update-user` row.

2. **Rider document endpoints — MOCK-ONLY (D38)** — `POST /get-rider-documents`, `POST /upload-rider-document`, `DELETE /delete-rider-document`. Upsert semantics; 7-type enum (`cnic_front`, `cnic_back`, `bike_registration`, `driving_license`, `utility_bill`, `profile_photo`, `other`); optional `name` for `other`; 2 MB size limit; PDF/JPG/PNG allowlist (images-only for `profile_photo`). ADR-0003 fn 12.

3. **`POST /reset-rider-pin` — MOCK-ONLY (D39)** — proposed contract: `{ phone, role }` → `{ pin: string }`. Backend: crypto-random generation, hash-only storage, plaintext returned once, rate-limit. ADR-0003 fn 13.

4. **`POST /get-all-inactive-riders` empty response** — when no pending riders exist return `{ riders: [] }` not `{ success: false, error: "No rider found" }` (ADR-0003 fn 11). Note: portal no longer calls this endpoint (Wave 2, 2026-08-11) — backend may keep or drop.

5. ~~BlockedRiders unblock~~ **CLOSED 2026-08-11** — unblock lives on `RiderEditPage` via `/update-user activationStatus=active` (subject to item 1 above).

6. **Single-rider fetch** — someday: fetch one rider by phone without pulling the full list (edit-page fallback). No contract proposed yet.

7. **Rides endpoints — MOCK-ONLY (D41, ADR-0003 fn 14, ADR-0006):**
   - `POST /get-rides` — `{ tab, page?, pageSize?, sortBy?, sortDir?, scope?: "mine"|"all" }` → `{ rides: Ride[], total, counts }`. Scope-limited callers: derive phone from session cookie, never trust body.
   - `POST /get-ride` — `{ rideId, scope?: "mine"|"all" }` → `{ ride: Ride }`. When scope=mine backend MUST 404 rides the caller does not own (QA MAJOR-1).
   - `POST /get-rides-summary` — `{}` → `{ completedTotal, canceledTotal, liveTotal, upcomingTotal, areas, monthly }`.

8. **Rides contract additive fields (D42, ADR-0006):** `routePolyline`, `traveledPath` (`[[lat,lng],…]` JSON arrays), `plannedDistanceKm`, `traveledDistanceKm`, `waitingMinutes`, `eta` — backend must supply or integrate OSRM.

9. **`POST /change-password` — MOCK-ONLY (D48, ADR-0003 fn 17, Wave 3 2026-08-11):** `{ phone, currentPassword, newPassword }` (backend derives `phone` from session cookie). Respond `200 { success: true }`; `400 { success: false, error }` on wrong-current-password or validation failure (**NOT 401** — 401 would trip global handler and force-logout); `404` for unknown user. Hash-compare current, hash-store new; rate-limit.

10. **`POST /get-all-users` — MOCK-ONLY / CONTRACT PROPOSAL (D46, ADR-0003 fn 15, 2026-08-10):** `{}` → `{ users: [{ role: "Admin"|"Operator", profile: { id, name, phone, email?, area?, address?, dateOfJoining? } }] }`. **Visibility rule (server-enforced):** Admin sessions → Admin + Operator; Operator sessions → Operator only. Derive caller role from session cookie (never body). `/update-user` authz for Admin targets from Operator sessions is backend responsibility.

11. **Rider-scoped stats — Phase 2 (D50, ADR-0008 Phase 2):** `POST /get-my-stats` → `{ earningsToday, earningsWeek, ridesToday, ridesWeek, acceptanceRate, avgRating }`. Derive caller phone from session cookie. Phase 1 derives stats client-side as fallback; Phase 2 replaces with this endpoint.

12. **Wire-level rider identity omission (D51, MINOR-2 deferred):** When `scope="mine"` on `/get-rides`, omit or blank the `rider` block on each ride element (caller already owns the data; omitting tightens the wire per ADR-0008 §My Rides bullet 2). Frontend follows when contract is amended.

13. **`POST /logout` — backend dependency (D31, Security Review S-02):** `AuthProvider.logout()` currently clears client state only. When available: fire-and-forget `POST /logout` before `clearSession()` for server-side session invalidation.

14. **Rider live-position updates (D47, Wave 2 2026-08-11):** The Live Map currently shows a static snapshot of `currentLocation` from `/get-all-riders`. Backend options: (a) WebSocket/SSE push for `{riderId, lat, lon, updatedAt}`; (b) dedicated `POST /get-active-rider-positions` poll; (c) piggyback on `/get-all-riders` poll interval.

---

## Conventions

| Convention | Detail |
|-----------|--------|
| Commit style | `chore/refactor/feat/fix/docs(scope): description`; every commit ends with all gates green |
| Quality gates | `npm run lint` (0 errors) · `npm run typecheck` (0 errors) · `npm run typecheck:strict` (0 errors) · `npm run build` · `rg -l msw dist/assets/` (0 hits) · `npm test` (**167** tests — Wave 5 final, 2026-08-14; `bundle-size.test.ts` deleted by owner — D30 CLOSED) — all required before merging. Bundle is measured manually per task: report Vite CLI gzip AND `zlib.gzipSync` of main chunk, labelled — never compare across the two. Current reference: **214.05 kB** (Vite CLI gzip, MSW=false) — updated 2026-08-11 (Wave 4 Phase 1, `qa` branch). `test:e2e` (Playwright Chromium smoke, opt-in) — run before release whenever `src/components/ui/{button,popover,calendar,alert-dialog}`, `DatePickerField`/`DatePickerPopover`, or any lazy Radix surface changes; NOT part of the default 5 gates (QA rec F-4.2-04: revisit joining CI once ≥ 3 specs, < 60s) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) — Node 20, `npm ci` cache, push/PR |
| ADRs | `docs/adr/NNNN-slug.md` — Proposed → Accepted/Rejected/Superseded; update in same commit as any shape change |
| AGENTS.md hard rules | **H1–H8 bind all contributors and AI coding tools.** H1 API contract frozen, H2 never widen ROLES, H3 never delete Customer seed, H4 don't edit `components/ui/`, H5 never commit `.env`, H6 handlers import URLs from `lib/config.ts`, H7 auth storage only via `session.ts`, H8 guard changes require tracing PublicOnly + ProtectedRoute |
| Package manager | **npm** — `pnpm-workspace.yaml` was a Figma artifact, deleted |
| Mock toggle | `VITE_ENABLE_MSW=true` in `.env` for offline dev; omit/`false` when pointing at real backend |
| Cross-feature imports | Forbidden — shared types/utils go in `src/types/` or `src/lib/` |
| Session read/write | Only via `src/features/auth/session.ts` (`loadSession`, `saveSession`, `clearSession`) — H7 |
| Rollback point | `git reset --hard pre-restructure` (tag on commit `ce4abac`) |

---

## Artifact Index

| Document | Path |
|----------|------|
| AI/contributor hard rules | `AGENTS.md` |
| ADR-0001: Feature-Based Structure | `docs/adr/0001-target-folder-structure.md` |
| ADR-0002: Routing & Auth (incl. session persistence) | `docs/adr/0002-routing-and-auth.md` |
| ADR-0003: Mock API (MSW) | `docs/adr/0003-mock-api-msw.md` |
| ADR-0004: All Riders Admin Data Table | `docs/adr/0004-riders-data-table.md` |
| ADR-0005: Internationalisation (EN/UR) | `docs/adr/0005-i18n.md` |
| Migration Plan (C0–C7 + deferred register D1–D52) | `local-docs/design/migration-plan.md` |
| Security Review (2026-08-06) | `local-docs/qa/security-review.md` |
| i18n Implementation Plan (Steps 1–8) | `docs/design/i18n-plan.md` |
| i18n String Reconciliation (en.json ↔ ur.json draft) | `docs/design/i18n-strings.md` |
| TypeScript Strict Mode Baseline | `docs/design/strict-errors.md` |
| UX Restyle Audit | `docs/ux/restyle-audit.md` |
| UX Restyle Spec | `docs/ux/restyle-spec.md` |
| QA C5 Review | `docs/qa/c5-review.md` |
| QA C6/C7 + D9 + Merge Review b0ef29c | `docs/qa/release-readiness.md` |
| QA D8 Restyle Review | `docs/qa/d8-restyle-review.md` |
| UX Iteration 4 Spec (+ product decisions amendment) | `docs/ux/iter4-spec.md` |
| QA Iteration 4 Review | `docs/qa/iter4-review.md` |
| MSW Developer Guide (seeds, contract, troubleshooting) | `src/mocks/README.md` |
| RTL Implementation Plan (Iteration 7) | `local-docs/design/rtl-plan.md` |
| Rider Profile Edit Plan (rev 10, COMPLETE — pending commits) | `local-docs/ux/rider-profile-edit-plan.md` |
| ADR-0006: Rides + Live Map | `local-docs/adr/0006-rides-and-live-map.md` |
| ADR-0007: Portal Consolidation (Waves 1–2) | `local-docs/adr/0007-portal-consolidation.md` |
| ADR-0008: Rider Role Experience (Wave 4) | `local-docs/adr/0008-rider-role-experience.md` |
| Rides / Active-Rides UX Plan (rev 3, COMPLETE) | `local-docs/ux/active-rides-plan.md` |
| QA Wave 4 Phase 1 Review (Rider Role Experience) | `local-docs/qa/wave4-review.md` |
