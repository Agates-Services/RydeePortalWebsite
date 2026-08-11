# ADR-0007: Rider page consolidation (Wave 1)

## Status
Accepted (owner approved 2026-08-11). ADR-0008 is reserved for the Rider Role Experience — a separate wave.

## Context
Audit of the four rider-management surfaces (`AllRiders`, `PendingRiders`, `BlockedRiders`, `ActiveRiders`) plus the canonical rider actions surface (`RiderEditPage`) found overlap and dead behaviour:

- `BlockedRiders` was a filtered-by-status copy of `AllRiders` with an "unblock" action that only mutated local component state — it never called `/update-user`, so the change vanished on refresh. The real unblock lives on `RiderEditPage` (Status card, `/update-user` with `activationStatus="active"` — see D40 CONTRACT ASSUMPTION).
- `PendingRiders` is likewise a filtered view (`activationStatus="new"`) with a review flow that duplicates `RiderEditPage`; its sole distinct dependency is `POST /get-all-inactive-riders` (D37 item 1).
- `ActiveRiders` is the only surface with unique UX value — a Leaflet map of active riders on the map. It also carries client-side position/state simulation (Wave-2 debt).
- `AllRiders` already ships status tabs (All / Active / Pending / Blocked / Offboarded), URL-persisted filters, and a `RiderDetailSheet` → `RiderEditPage` handoff — it is the canonical list.

## Decision
Wave 1 (this ADR):

1. **BlockedRiders REMOVED.** The page and its route component are deleted. The route path `/admin/blocked-riders` renders `<Navigate to="/admin/all-riders?status=blocked" replace />` so old deep links keep working. The sidebar entry is removed. The Dashboard `Blocked Riders` StatCard is retargeted to `/admin/all-riders?status=blocked`. `riders.blocked.*`, `layout.nav.blockedRiders`, and `layout.title.blockedRiders` i18n keys are pruned. Guards untouched (H8 trace re-checked — the redirect is inside the same `Admin+Operator` `ProtectedRoute` group, so logged-out + unknown-role behaviour is byte-identical).

2. **PendingRiders REMOVAL approved but DEFERRED to Wave 2** pending backend confirmation that `POST /get-all-riders` includes `activationStatus` (tracked as D37 item 3). Removing PendingRiders would drop the sole consumer of `POST /get-all-inactive-riders`; if backend keeps that endpoint, keeping the page is cheaper than a mock-only stub.

3. **ActiveRiders KEPT** as the only geographic view. Wave-2 follow-ups: strip client-side position/state simulation, lazy-load Leaflet (D43), rename "Live Map" for accuracy.

4. **Canonical surfaces:** `AllRiders` = canonical rider list; `RiderEditPage` = canonical rider actions (block / offboard / unblock / reactivate / edit / PIN reset).

## Consequences
- One fewer page (~570 LOC + ~16 i18n keys) — reduces surface area and mental load.
- Old `/admin/blocked-riders` links keep working via the redirect; no user-visible break.
- D37 item 5 (`BlockedRiders unblock is local-state-only`) is neutralised — the unblock gap now lives solely on `RiderEditPage` (which does call `/update-user`, subject to D40).
- Wave 2 will revisit PendingRiders after backend confirms D37 item 3, and ActiveRiders after Leaflet lazy-load + simulation strip.

## Alternatives considered
- **Keep BlockedRiders as a thin wrapper around `AllRiders?status=blocked`.** Rejected — the page adds no UX value the tab does not already give, and the unblock action was a foot-gun (looked persisted, was not).
- **Remove PendingRiders in the same wave.** Rejected — depends on unresolved backend contract question (D37 item 3).

## Links
- `local-docs/design/migration-plan.md` D37 item 5 (annotated closed).
- `local-docs/PROJECT.md` Wave 1 note.
- Prior ADRs: 0002 (routing + guards), 0004 (All Riders table).

## Wave 2 — Executed (2026-08-11)

Owner confirmed on 2026-08-11 that continuing on mock data was acceptable until the backend response for `POST /get-all-riders` is finalised — D37 item 3 no longer blocks removing PendingRiders (the AllRiders Pending tab already serves the same rows from `/get-all-riders`).

### B1 — PendingRiders retirement

1. `src/features/riders/PendingRiders.tsx` deleted (562 LOC).
2. Route `/admin/pending-riders` now renders `<Navigate to="/admin/all-riders?status=pending" replace />` inside the same `Admin+Operator` `ProtectedRoute` group (H8 pattern identical to the Wave 1 blocked-riders redirect).
3. `src/api/riders.ts`: `API_GET_UNREGISTERED_RIDERS_URL`, `getUnregisteredRiders()`, and the `isNoRidersFoundError()` helper deleted.
4. `src/mocks/handlers/riders.ts`: `http.post(API_GET_UNREGISTERED_RIDERS_URL, …)` handler and `inactiveSeeds` array deleted; `/activate-rider`, `/update-user`, `/reset-rider-pin` handlers simplified to reference `allRidersSeeds` only. `vite.config.ts` `PROXY_PREFIXES` no longer lists `/get-all-inactive-riders`.
5. Sidebar entry + DashboardLayout title-map entry removed. Dashboard `pendingRiders` StatCard `onClick` retargeted to `/admin/all-riders?status=pending`.
6. i18n: `riders.pending.*`, `layout.nav.pendingRiders`, `layout.title.pendingRiders` pruned from en+ur; reconciliation table (`local-docs/design/i18n-strings.md`) synced.
7. Tests: `tests/regression/guards.test.tsx` pending-riders references retargeted; new `tests/regression/pending-riders-redirect.test.tsx` (blocked-riders template).
8. ADR-0003 footnote ¹⁶ + migration-plan D18 supersede-note added same-commit (H6).

### B2 — ActiveRiders cleanup, Leaflet lazy-load, "Live map" rename

1. Client-side simulation stripped from `ActiveRiders.tsx`: `jitter()`, `randomState()`, `STATES`, the 3-second `setInterval` state-mutator, `useRef` for the interval handle, and the state count badges are all deleted. The page now renders the exact `currentLocation` values returned by `POST /get-all-riders` filtered by `activationStatus === "active"` (case-insensitive, snake_case alias accepted).
2. Leaflet map extracted to `src/features/riders/LiveMap.tsx` and loaded via `React.lazy(() => import('./LiveMap'))` inside a `Suspense` boundary. Suspense fallback matches the initial-fetch loading text ("Loading live map…" / "لائیو میپ لوڈ ہو رہا ہے…") — no flash of unstyled content.
3. `src/types/rider.ts`: `RiderState` union deleted; `ActiveRider` interface simplified (dropped `state`, `bike`).
4. Nav label + page title renamed to "Live map" (en) / "لائیو میپ" (ur) in `layout.nav.activeRiders` + `layout.title.activeRiders`. Route path `/admin/active-riders` kept — no redirect churn.
5. i18n `riders.active.*` simplified: `total` kept, `live` shortened to just "Live", `loading` added, `states.*` removed. Reconciliation synced.
6. `local-docs/design/migration-plan.md`: D43 closed with real gzip numbers; D47 opened for the backend live-position update mechanism (WebSocket/SSE or poll — owner to relay).

### Gate summary (Wave 2 tip)

- lint: 0/0
- typecheck: 0
- typecheck:strict: 0
- vitest: 127/127
- build OK; main-chunk gzip 216.37 → 210.74 kB (−5.63 kB net across B1+B2); new `LiveMap-*.js` chunk = 0.57 kB gzip; dist MSW hits: 0
