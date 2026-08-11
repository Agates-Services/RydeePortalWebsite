# QA Review — User Management feature (`/admin/users`)

**Reviewer:** QA-UsersTable (sub-agent)
**Date:** 2026-08-10
**Branch:** `qa` (uncommitted working tree, on top of 4 pending commits)
**Verdict:** ✅ **SHIP** (with two MINOR follow-ups tracked below)

## Gates (fresh, this reviewer)

| Gate | Result |
|------|--------|
| `npm run lint` | ✅ 0 errors |
| `npm run typecheck` | ✅ 0 errors |
| `npm run typecheck:strict` | ✅ 0 errors |
| `npm run build` (MSW=false, prod) | ✅ built in 1.77s |
| `rg -l msw dist/assets/` | ✅ 0 hits |
| Seed-name leak check (`Ayesha Siddiqui`, `Sana Tariq`, `Bilal Nawaz`, `Hamza Raza`) in `dist/` | ✅ 0 hits |
| `npm test` | ✅ **123 / 123** across 17 files; `all-riders.test.tsx` = **21 / 21**; new `useTableView` = 4/4; new `users-page` = 5/5 |

Prod bundle is clean. Dev's "21/21" claim on AllRiders is verified — the regression suite still asserts URL persistence, tab counts, tri-state sort, page-reset-on-tab-change, empty-state clear-filters, and disabled-CSV-when-empty **against the refactored hook**, not just render.

---

## Priority 1 — AllRiders refactor regression

**Status:** ✅ No behavior change detected.

Diff analysis:
- Filter/sort/paginate logic replaced 1:1 by `useTableView(rows, filters, cmp, page, pageSize)`.
- `compare()` now delegates to `stringCompare()` — same `localeCompare` config (`numeric: true`, `sensitivity: "base"`) preserved.
- Filters are wrapped in `useMemo([statusTab, areaFilter, q])` — same dep set as the old inline pipeline.
- `useCallback(cmp, [sort])` preserves sort identity across renders.
- Pagination clamping (`Math.min(page, pageCount)`, `Math.max(1, ceil(...))`) moves into the hook — identical math.
- CSV export still consumes `filteredRows` (post-filter, pre-paginate) — behavior identical.
- URL persistence effects, tab-reset effect, sort tri-state cycle, and the `data-testid` surface are untouched.

The 21 existing regression tests exercise every risky path:
- URL persistence writes/reads (`writes state to URL as filters change`)
- tab counts (`shows correct per-tab counts`)
- tri-state sort with aria-sort (`cycles unsorted → asc → desc → unsorted`)
- page-reset on tab change (`changing tab from a non-first page resets to page 1`)
- filtered-set CSV disable (`disables when filtered set is empty`)

**No new gaps introduced by the refactor.**

## Priority 2 — RiderEditPage generalization

**Status:** ✅ Correct, with **one MINOR** follow-up.

Traces:

1. **Rider flow unchanged.** `editedRole` defaults to `"Rider"` when `navState.role` is missing or not `"Admin"|"Operator"`. All three rider-only Cards (Status, PIN, Documents) and the avatar camera are gated by `isRider === true`. Documents `useEffect` also gated on `isRider`, so no phantom `POST /get-rider-documents` fires for Admin/Operator edits.
2. **Admin/Operator flow.** Rider-only Cards hidden. A neutral role badge replaces the status badge. The header shows only the two editable-common fields (name/area — cnic/dob are Rider-only in the form and stay empty; diff excludes unchanged empty strings so `updateUser` payload stays clean).
3. **Unseeded fallback / Operator deep-linking to an Admin edit URL.**
   - `getAllUsers(callerRole)` is called with the caller's session role. For an Operator session, the mock returns Operator rows only → `find(...phone match) → undefined` → `match = null` → the page renders the existing "Rider not found" state. **No crash, no leak.**
   - **The security here is server-side.** Any Operator who bypasses the client (crafts state, edits body, hits the API directly) is stopped only by the backend. This is correctly captured in D46 and ADR-0003 fn 15. The client posture is defensible.
4. **Save payload role.** `updateUser(row.phone, editedRole, diff)` correctly sends `role: "Admin"|"Operator"|"Rider"` per the frozen `/update-user` contract. `editedRole` is a closed union — cannot be widened by navState (falsy/other values collapse to `"Rider"`).
5. **H8 (guards).** No changes to `PublicOnly`, `ProtectedRoute`, `roleHome`. The new `/admin/users*` routes sit inside the existing `allow={["Admin", "Operator"]}` bracket. No redirect-loop surface added. F1 tripwire (Customer seed) is untouched.

**MINOR-1 (non-blocking):** `getAllRiders()` vs `getAllUsers()` fallback fetches ALL rows just to find one by phone. This mirrors the pre-existing rider pattern — not a regression, but flag for future `getRider(phone)` / `getUser(phone)` endpoints. Track as follow-up D-item, not a ship-blocker.

## Priority 3 — Security posture

**Status:** ✅ H2 preserved, mock-only backdoor properly flagged.

- `ROLES` in `src/types/profile.ts` remains `["Operator", "Customer", "Rider"]` — **not widened**. F2 tripwire green.
- `RegisterPage` unchanged. No new path introduces `Admin` as a creatable `showRole` option. The `/admin/register` route still uses `showRole` and the register dropdown regression test (`tests/regression/roles.test.tsx` — 4/4 passing) still guards against Admin appearing.
- **Mock body-role convenience is explicitly flagged** in `src/mocks/handlers/users.ts` with an inline comment referencing ADR-0003. The ADR row + D46 both state: real backend MUST derive caller role from session cookie. No client code trusts client-side role filtering as an authz decision.
- **Operator visibility.** `getAllUsers(callerRole)` in the api-client passes the session role through as a mock convenience. The real-backend contract is: server ignores this and derives from cookie. On production the risk collapses to "backend must implement authz correctly" — a D46/backend-handover item, not a shippable client defect.
- **`/update-user` authz for Admin targets from Operator sessions** is likewise a backend responsibility. Client behavior: Operator sessions never receive Admin rows, so no Admin row-click is reachable through legitimate UI navigation.

## Priority 4 — H9/H10 sweep

**Status:** ✅ Clean.

- `useTableView.ts` — 40 lines, single hook + one helper, zero unnecessary comments, no speculative generics beyond `<T>`. No config knobs; no dead exports; both exports (`useTableView`, `stringCompare`) are consumed by both AllRiders and UsersPage. **H10 respected.**
- `src/api/users.ts` — 32 lines, mirrors `src/api/riders.ts` shape. No dead code.
- `src/mocks/handlers/users.ts` — the only comments in the new code are the two-line inline that document the mock-only body-role escape hatch. **Required, not decorative — passes H9.**
- `src/features/users/*` — `csv.ts` (22 lines) re-exports `downloadCsvLib` from `@/lib/csv` — a trivial pass-through, but consumed once and keeps CSV surface colocated with the feature (consistent with the rider CSV pattern). Acceptable per H10.
- `UsersPage.tsx` has two `eslint-disable-next-line react-hooks/exhaustive-deps` — tooling-required, exempt per H9.

## Priority 5 — H6 (URL constants imported, not re-declared)

**Status:** ✅ `src/mocks/handlers/users.ts` line 2: `import { API_GET_ALL_USERS_URL } from "@/api/users";`. Constant is defined exactly once, in the feature api module. No `fetch` bypass; api-client wrapper used throughout.

## Priority 6 — Gate re-run

Documented in the top table. All five gates pass. Zero MSW footprint in the prod build. `stale-dist` incident pattern re-verified this run (fresh `rm -rf dist` before build).

---

## Findings summary

| ID | Severity | Area | Finding | Action |
|----|----------|------|---------|--------|
| F-1 | **INFO** | UsersPage / AllRiders | Deep-link `?page=N` is reset to 1 by the tab/search/pageSize effect on first mount. Pre-existing in AllRiders (unchanged), inherited by UsersPage. Users typically arrive via sidebar, not deep link — deferred consciously. | Track in migration-plan Deferred Register if not already covered. Non-blocking. |
| F-2 | **MINOR** | Regression coverage | `users-page.test.tsx` does not include a case that renders with an Operator session and asserts `mockUsers([...adminSeed, ...operatorSeed])` still filters Admin rows out at the API boundary. The current mock ignores body role, so the test wouldn't catch a client-side leak either. Recommend a follow-up test that MSW-mocks `/get-all-users` to gate on the request body (mock-parity) OR — better — an integration test against the real `usersHandlers` that exercises Admin-vs-Operator session. Non-blocking because the real backend is authoritative, and both the ADR + D46 flag this. | Follow-up test in next sprint. |
| F-3 | **INFO** | RiderEditPage | Fallback fetch on unseeded deep-link is a whole-list `getAllRiders()`/`getAllUsers()` call to find one phone. Consistent with existing pattern — not a regression. Consider a future single-record endpoint. | Deferred Register candidate. |

**No BLOCKER or MAJOR findings.**

## Verdict

**SHIP.** All hard rules (H1–H10) verified. All five gates green (fresh run, not trusting reported numbers). Prod bundle MSW-free and seed-free. Refactor is behavior-preserving under the 21-test AllRiders regression net. Security posture correctly delegates authz to the backend and clearly flags the mock-only escape hatch in code, ADR row 15, and D46.

Recommend committing as `feat(users): user management page + shared useTableView hook` and adding the two follow-ups (F-2 test, F-1/F-3 registry) to `local-docs/design/migration-plan.md` if not already covered.
