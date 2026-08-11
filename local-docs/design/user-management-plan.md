# User Management (Admin/Operator) — Plan

## Scope
Extract the AllRiders sort+filter+paginate engine into a shared hook, refactor AllRiders to use it (zero behavior change), add /admin/users page listing Admin+Operator users using the same hook. Reuse RiderEditPage for Admin/Operator edit by hiding rider-only sections when role !== 'Rider'.

## New / changed files
- src/lib/useTableEngine.ts — extracted hook (search debounce+trim, sort compare, page slice, aria helpers).
- src/features/riders/AllRiders.tsx — refactor to consume useTableEngine (same rendering).
- src/api/users.ts — API_GET_ALL_USERS_URL + getAllUsers() returning { users: [{role, profile}] } flattened same shape as riders.
- src/mocks/handlers/users.ts + register in handlers/index.ts.
- src/features/users/UsersPage.tsx + src/features/users/routes.tsx + src/features/users/mapper.ts + local types.
- src/features/riders/pages/RiderEditPage.tsx — accept non-Rider users: pass role via location.state; skip documents + status + pin cards when role !== 'Rider'; back route based on caller.
- src/router.tsx — add /admin/users and /admin/users/:phone/edit (edit reuses RiderEditRoute wrapped or reuse same component with role param).
- src/features/layout/AppSidebar.tsx — nav entry (label layout.nav.userManagement now already exists but currently points to /admin/register). Repoint to /admin/users; add sub-item for /admin/register? Owner spec: 'add nav entry under the existing User Management group'. Simplest: change /admin/register nav to be sub-heading absent; add distinct 'Users' entry using new key layout.nav.users.
- i18n en+ur — new namespace users.*
- Tests: tests/unit/useTableEngine.test.tsx + tests/regression/users-page.test.tsx.
- ADR-0003 sync: new row for /get-all-users MOCK-ONLY PROPOSED.
- migration-plan.md: D46 registered.
- PROJECT.md backend handover list: append D46.

## Route decision
Add /admin/users (list) and /admin/users/:phone/edit. Reuse RiderEditPage as edit component. Pass role via location.state.editingRole for the initial paint; RiderEditPage prefers state.row/role, otherwise fetch skipped for non-Rider (we do have row seed from list).

## Hook API (H10 minimal)
useTableEngine<Row, SortKey>({ rows, statusTab, matchesStatus, searchText, matchesSearch, extraFilter?, sort, pageSize, page }) => { filteredRows, pageRows, pageCount, currentPage, counts (optional via matchesStatus map). }
Actually simpler: extract *just* filter+sort+paginate as pure helpers + a small hook that returns { filteredRows, pageRows, pageCount, currentPage, pageStart }. Keep counts/URL logic in each page.
