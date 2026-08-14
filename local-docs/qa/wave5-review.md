# Wave 5 QA Review — Route unification + User management removal + Register bug + My Profile polish

**Reviewer:** QA-Wave5 (sub-agent, dispatched by SWE Team Lead)
**Branch:** `qa` (uncommitted working tree)
**Date:** 2026-08-14
**Verdict:** ✅ **SHIP** (with 3 MINOR carry-overs and 1 MINOR hygiene item — none block release)

---

## Gate results (fresh, cold)

| Gate | Result |
|------|--------|
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run typecheck` | ✅ 0 errors |
| `npm run typecheck:strict` | ✅ 0 errors |
| `npm run build` | ✅ built in 2.54s; main bundle **214.18 kB gzip** (Vite CLI, MSW=false) — +0.13 kB vs 214.05 baseline (within noise) |
| MSW purity — `rg -l msw dist/assets/` | ✅ 0 hits (exit=1, no matches) |
| `npm test` | ✅ **167/167** in 28 files (161 baseline + 3 wave5-route-unification + 3 wave5-register-role; 2 wave4-rider-experience expectations updated for User-management sidebar removal). Matches FE claim exactly. |

All 5 primary gates green. E2E smoke not required (no Radix `asChild`/lazy-surface changes in Wave 5).

---

## Scope verification

### 1. Route unification (`/admin/riders/:phone/edit` → `/admin/users/:phone/edit`) — ✅ PASS

- `router.tsx` line 61: source path now renders `<RiderEditRedirect />` inside the same `Admin+Operator` `ProtectedRoute` group as the destination `/admin/users/:phone/edit` at line 62 — **H8 guard trace intact**, no privilege downgrade or loop.
- `RiderEditRedirect.tsx` (13 LOC, minimal): `Navigate replace` preserves both `useParams().phone` and `useLocation().state` (verified by `wave5-route-unification.test.tsx` — `role=Rider` state propagates through the redirect).
- **Single shared component (H10):** `RiderEditPage` continues to serve both `/admin/users/:phone/edit` code paths. Role branching at `pages/RiderEditPage.tsx:148` derives `isRider` from `navState?.role`; rider-only sections (`fqa-rider-status` card line 750+, PIN card, Documents card) all gated by `isRider`. No fork.
- Callers updated: `AllRiders.tsx:541` and `RiderDetailSheet.tsx:59` both navigate to `/admin/users/:phone/edit` with `state: { row, role: "Rider" }`. `UsersPage.tsx:208-210` passes `role: row.role`.
- **Deep-link preservation:** verified via wave5-route-unification test — `router.state.location.pathname` becomes `/admin/users/0300111222/edit` and rendered component reads `phone=0300111222 role=Rider`. Redirect uses `replace` so back-button UX is not broken.
- **No broken links elsewhere:** `rg "admin/riders/"` in `src/` returns only `router.tsx:61` (the redirect source itself). Test files reference it in guard-trace tests. ✅

### 2. User Management removal + Admin-only Add-new (+) — ✅ PASS

- Sidebar `layout.nav.userManagement` pruned from en+ur; `AppSidebar.tsx` cleaned up (unused `isAdmin` const + `UserPlus` import removed).
- `/admin/register` → `<Navigate replace>` to `/admin/users/new`; new path lives under **Admin-only** `ProtectedRoute` group (`router.tsx:47`). Operator visiting `/admin/users/new` is blocked by the outer guard and redirected — **H8 cross-role access verified**.
- `UsersPage.tsx:295-306` renders `Add new` button gated by `callerRole === "Admin"` with `data-testid="fqa-users-add-new"`. Test `wave5-route-unification.test.tsx` confirms:
  - Admin sees the button and clicking navigates to `/admin/users/new` ✅
  - Operator does NOT see the button ✅
- Button position: correctly right of Export CSV, wrapped in `flex items-center gap-2 md:ms-auto` so RTL Urdu mirrors correctly.
- Page-title map (`DashboardLayout.tsx:14, 24, 26`) resolves `/admin/users` → `layout.title.users`, `/admin/users/:phone/edit` → `layout.title.editUser`, `/admin/users/new` → `layout.title.registerUser`. All three i18n keys present in en+ur.

### 3. Register-role dropdown bug fix — ✅ PASS + **H2 CRITICAL VERIFIED**

- Initial `form.role = ""` (was `"rider"` lowercase — never matched any title-case `<option>` in admin mode). Placeholder `<option value="" disabled>` now genuinely selected.
- Validator `(v) => (v ? "" : errorCopy)` (line 76) blocks submit when empty — test confirms POST is not made and role validation error surfaces.
- Submit path: `role: showRole ? form.role : "rider"` (line 176). Public flow (`/register`, `showRole=false`) still hard-codes lowercase `"rider"` — matches MSW handler `body.role === "rider"` check (`handlers/auth.ts:168`), matches ADR-0003 login-response lowercase convention, and matches pre-existing `contract.test.ts:68` frozen wire assertion. **No wire regression on public flow.**
- **H2 — Admin NOT creatable:** dropdown options come from `ROLES = ["Operator", "Customer", "Rider"]` in `src/types/profile.ts`. `Admin` is not in `ROLES` and is not added anywhere in the Wave 5 diff. Grep-verified: `rg "ROLES|Admin" src/features/auth/pages/RegisterPage.tsx` shows no Admin literal. **F2 incident tripwire intact.**
- Regression test `wave5-register-role.test.tsx`: 3 tests — (a) initial value is empty, placeholder disabled; (b) submitting without role blocks POST and surfaces "select a role"; (c) selecting Operator sends `role: "Operator"` on the wire.

### 4. My Profile width + action buttons — ✅ PASS

- `ProfilePage.tsx:183`: root container gains `mx-auto flex w-full max-w-3xl`, matching `RiderEditPage` container width. Change is minimal and applies to both Profile and Settings tabs since they share the outer wrapper.
- Cancel/Save + Change-password button rows pre-existed with the same `justify-end` layout as Edit User (verified by inspection — unchanged in this diff, ADR-0007 amendment notes them).

### 5. Hygiene — ✅ PASS

- **H9 comment sweep:** `rg "^\+.*//" wave5.diff` returns zero additions. Clean.
- **i18n parity:** Node parity script — en=513 keys, ur=513 keys, 0 missing, 0 extra. ✅
- **ADR-0007 Wave 5 amendment:** appended (lines 47–79 of ADR), covers all four items + gate summary. Register-status column in PROJECT.md updated with `layout.title.registerUser` note. ✅

---

## Findings

### MAJOR — none

### MINOR-1 (carry-over, pre-existing debt made more visible)
**RiderEditPage role Input hardcodes `value="Rider"`** — `src/features/riders/pages/RiderEditPage.tsx:740`. When an Admin/Operator user is edited via `/admin/users/:phone/edit` (from UsersPage row click, which passes `state.role = "Admin" | "Operator"`), the read-only "Role" field displays "Rider" regardless of the actual role. All other role-gated behavior (status card, PIN card, Documents card, guard checks) correctly consult `isRider` computed at line 148 — this is display-only. Pre-existed since Wave 3 when UsersPage first began reusing `RiderEditPage`; Wave 5 makes it more visible because rider edits now share the same URL. **Recommend:** bind `value` to `navState?.role ?? "Rider"` (or the computed `editedRole`, which is already used at line 677 for the Badge). Non-blocking.

### MINOR-2 (hygiene)
**Dead i18n key `layout.title.editRider`** — still present in `en.json:22` and `ur.json:22` but no longer referenced by `DashboardLayout` (grep for `editRider` returns only these two locale entries; nothing in code reads it). `TITLE_KEYS["/admin/register"]` entry at `DashboardLayout.tsx:10` is also dead code — the router redirects `/admin/register` before rendering, so the layout never sees that pathname. **Recommend:** prune both in a follow-up hygiene commit.

### MINOR-3 (carry-over)
**Register wire-role casing is inconsistent between admin and public flows** — admin flow POSTs title-case (`"Operator"`, `"Customer"`, `"Rider"` from `ROLES`); public flow POSTs lowercase `"rider"`. MSW register handler checks `body.role === "rider"` lowercase for the rider-only validation branch (`handlers/auth.ts:168`), and `authSeed` uses lowercase role literals. This means Admin-created riders skip the dob/address required-fields branch in the mock (they always send full body anyway, so no functional impact today). Pre-existed since ROLES adopted title-case at the type layer; Wave 5 codifies the split into an explicit conditional. **Recommend:** normalize the wire to lowercase in one place (either lowercase in `registerUser()` in `src/api/auth.ts`, or lowercase-ify at the submit site) — align with the login response lowercase convention already established at ADR-0003 fn 6. Track as a new register entry; not a Wave 5 blocker because the mock accepts either casing today and the real backend contract does not specify casing (ADR-0003 line 42 does not constrain).

### INFO
- Bundle: 214.18 kB gzip (+0.13 kB vs 214.05 baseline) — Plus icon lucide + minor UsersPage markup — well inside noise.
- 2 wave4 test-expectation updates for User-management sidebar removal are semantic-only (assertions flipped from `toBeInTheDocument` to `toBeNull`); no coverage loss.
- ADR-0007 amendment is coherent with Wave 1/2 pattern (byte-identical guard shape to blocked-riders + pending-riders redirects). No new hard-rule triggered.
- H1 API contract untouched (no new endpoints, no shape changes).
- H2 preserved (ROLES still `["Operator","Customer","Rider"]`).
- H3 Customer seed intact (not touched).
- H4 no `components/ui/**` edits.
- H5 no `.env` changes.
- H6 URL constants unchanged (all handlers still import from `@/api/*`).
- H7 no `session.ts` bypasses.
- H8 verified above.
- H9 verified above.
- H10 verified — single component, redirect is 13 LOC, `Add new` button is 12 LOC.

---

## Recommendation

✅ **SHIP.** All five gates green, 167/167 tests, MSW purity 0, hard rules H1–H10 all satisfied by this diff. Wave 5 is a small, well-contained consolidation change. The three MINOR findings above are pre-existing debt (MINOR-1, MINOR-3) or dead-key hygiene (MINOR-2) — none introduced by Wave 5, none blocking.

Follow-up register items to consider tracking in the Deferred Work Register:
- D-new-a: bind `RiderEditPage` role Input to actual navState role (MINOR-1).
- D-new-b: prune `layout.title.editRider` + `TITLE_KEYS["/admin/register"]` dead entries (MINOR-2).
- D-new-c: normalize register wire role casing to lowercase in one place (MINOR-3).

---

# Wave 6 QA Review (delta on top of Wave 5) — Sidebar reorder + activeRiders→liveMap rename

**Reviewer:** QA-Wave6 (sub-agent, dispatched by SWE Team Lead)
**Branch:** `qa` (uncommitted, sitting on top of Wave 5)
**Date:** 2026-08-14
**Verdict:** ✅ **SHIP** (owner-driven revert applied mid-review; final state clean, zero findings)

## Gate results (fresh, cold, against final post-revert state)

| Gate | Result |
|------|--------|
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run typecheck:strict` | ✅ 0 errors |
| `npm run build` | ✅ 2.01s; main bundle **214.17 kB gzip** (−0.01 vs Wave 5 214.18 — within noise) |
| MSW purity — `rg -l msw dist/assets/` | ✅ 0 hits (exit=1) |
| `npm test` | ✅ **167/167** in 28 files (matches Wave 5 baseline exactly; two wave4-rider-experience assertions strengthened to exact ordered lists) |

## Scope verification (Wave 6 net delta over Wave 5)

### 1. Sidebar staff order + labels — ✅ PASS
`src/features/layout/AppSidebar.tsx` staff items now render in exactly `[Dashboard, Users, All riders, Rides, Live map]`. Verified by `rg 'layout.nav\.' src/features/layout/AppSidebar.tsx` → keys in file order: `dashboard, users, allRiders, rides, liveMap`. Icons: `LayoutDashboard, UserCog, Users, Bike (rides), Activity`. `active` predicates unchanged in semantics from Wave 5.

### 2. i18n key rename `activeRiders`→`liveMap` — ✅ PASS
- Only `layout.title.activeRiders`→`layout.title.liveMap` and `layout.nav.activeRiders`→`layout.nav.liveMap` in both en.json and ur.json.
- Owner-driven revert: the initially-proposed `allRiders`→`totalRiders` rename was reverted before final commit. `layout.title.allRiders` and `layout.nav.allRiders` retained with original English label "All riders" / Urdu "تمام رائیڈرز".
- `rg 'totalRiders' src/` returns 3 hits — all under the **unrelated** `dashboards.stats.totalRiders.*` namespace (dashboard KPI card, pre-existing). Zero dangling `layout.*.totalRiders` references. ✅
- `rg 'layout\.(title|nav)\.activeRiders' src/ tests/` → zero hits. ✅ No orphan usage of the old key.

### 3. en/ur parity — ✅ PASS
Flatten-and-diff via Python: en=513 keys, ur=513 keys, `missing in ur = ∅`, `extra in ur = ∅`. Bit-for-bit structural parity.

### 4. DashboardLayout TITLE_KEYS — ✅ PASS
- `/admin/active-riders` → `layout.title.liveMap` (Wave 6 rename).
- `/admin/all-riders` → `layout.title.allRiders` (retained after revert; matches sidebar).
- No Wave 6 change to the users/editUser/registerUser branches (those are Wave 5 territory, already shipped).

### 5. Rider sidebar branch — ✅ PASS
`riderItems` block (lines 55–75) untouched by Wave 6 diff. Rider labels remain `dashboard, myRides, myProfile`. The single rider-side test assertion update (`/total riders/` → `/all riders/` in the rider negative check, wave4-rider-experience.test.tsx line 157) is a label-tracking fix, not a behavior change — still asserts the staff link is absent from the rider sidebar.

### 6. Test strengthening — ✅ PASS
`tests/regression/wave4-rider-experience.test.tsx` — both Admin and Operator sidebar tests now do:
```
const navLabels = links.filter(l => [...5 labels].includes(l));
expect(navLabels).toEqual(["Dashboard", "Users", "All riders", "Rides", "Live map"]);
```
Filter-then-toEqual pattern: tolerates non-nav links (logout button, sidebar chrome) while enforcing exact order + presence + no dupes for the five nav items. Both branches also assert `user management` link is absent (H3-adjacent guard preserved).

### 7. H9 comment sweep — ✅ PASS
`git diff HEAD -- <wave6 files> | rg '^\+\s*//'` → zero added comments (only warning was CRLF, no matches).

## Hard-rule cross-check

- **H1** API contract: untouched (no api/ files in Wave 6 scope). ✅
- **H2** ROLES: untouched. ✅
- **H3** Customer seed: untouched. ✅
- **H4** components/ui/**: untouched. ✅
- **H5** .env: not modified. ✅
- **H6** URL constants: no api/* files touched. ✅
- **H7** session.ts: untouched. ✅
- **H8** roleHome/guards: unchanged; sidebar's `isRider` derived from `roleHome(profile?.role)` identical to Wave 5. ✅
- **H9** No new comments in the diff. ✅
- **H10** Simple: sidebar became strictly simpler (removed `isAdmin` conditional block from Wave 5; Wave 6 just renames and reorders literals — 32 lines removed, 21 added). ✅

## Findings

**None.** Wave 6 is a pure label/order/rename change with an owner-driven mid-review revert cleanly applied. The three Wave 5 carry-over MINOR items above are unchanged — none touched by Wave 6.

## Recommendation

✅ **SHIP.** All gates green (167/167, MSW=0, strict=0, lint=0), zero dangling references from the reverted `totalRiders` rename, en/ur parity exact, sidebar order matches spec, tests strengthened to catch future regressions of both order and set membership. Hard rules H1–H10 all satisfied.
