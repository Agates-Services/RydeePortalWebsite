# ADR-0008: Rider Role Experience (Wave 4)

## Status
Accepted (owner approved 2026-08-11). Phase 1 delivered in this wave; Phase 2 and Phase 3 gated on backend endpoints and later product review.

## Context
Waves 1–3 hardened the Admin and Operator experience (`AllRiders`, `RiderEditPage`, `LiveMap`, `Rides`, `My Profile`). The Rider role, by contrast, still lands on a debug-style key-value dump at `/rider` (`src/features/dashboards/RiderDashboard.tsx`) — a stripped-down page mounted outside `DashboardLayout` with its own `DashboardHeader`, an eleven-row profile table, and a large map card. Riders have no rides list of their own, no earnings visibility, no navigation surface beyond the header dropdown.

The team owns the frontend end-to-end and the backend is still WIP. Phase 1's UX spec is locked to the endpoints we already own (no new backend). Phase 2 and Phase 3 add backend requirements.

## Decision — Phase 1 (this wave)

### Router + layout regroup
- Move Rider routes **inside `DashboardLayout`** under `ProtectedRoute allow={["Rider"]}`. Paths: `/rider` (dashboard), `/rider/rides`, `/rider/rides/:rideId`. `RiderDashboard`'s local `DashboardHeader` mount is removed — the layout supplies the sidebar + header.
- Cross-role guard trace (H8): a Rider deep-linking `/admin/*` hits the Admin-only `ProtectedRoute` and is redirected to `roleHome("Rider") === "/rider"`. An Admin deep-linking `/rider/*` hits the Rider-only `ProtectedRoute` and is redirected to `roleHome("Admin") === "/admin"`. The unknown-role Customer tripwire (`roleHome("Customer") === "/login"` → logout on `PublicOnly` mount) is unchanged.

### Sidebar role branch
`AppSidebar` gains an `isRider = home === "/rider"` branch mirroring the existing `isAdmin` branch shape. Rider sees exactly three nav items: **Dashboard** (`/rider`), **My rides** (`/rider/rides`), **My profile** (`/account/profile` — Wave 3, already open to Rider). Admin and Operator nav are unchanged.

### Shared component extraction
- `StatCard` promoted from `src/features/dashboards/Dashboard.tsx` (private) to `src/components/StatCard.tsx` (public). Dashboard.tsx imports it; zero visual change.
- `RatingStars` extracted from `src/features/dashboards/RiderDashboard.tsx` to `src/components/RatingStars.tsx`. Same visual output.

### Rider Dashboard rewrite
Six stat cards, mobile-first grid (`grid-cols-2` on phones, `lg:grid-cols-4` on desktop), `tabular-nums`. PKR values use `Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 })` — Latin digits in both English and Urdu (Iter-6 decision, RTL layout only, no locale digit substitution).

Cards (all read from the rider's own `useAuth().profile` + client-derived rides where marked):
1. **Today's earnings** (hero, `text-primary`) — sum of `fare.amount` on completed rides whose `completedAt` is today. Hint: `"X rides today"`.
2. **This week's earnings** — same shape, ISO week window.
3. **Rides completed today** — count. Hint: `"Lifetime: N"` from `Profile.totalRides`.
4. **Rating** — `Profile.rating.toFixed(1)` + `RatingStars`.
5. **Online status** (display only, no toggle) — coloured ping-dot + `activationStatus` text.
6. **Acceptance rate** — `100 − (missedRides / (totalRides + missedRides)) × 100`, rounded to whole percent. Warning colour when below 85. Hint: `"Missed: X"`.

The existing map card is retained but on desktop appears as a second column beside the stats grid; on mobile it collapses below at reduced height. No new charts in Phase 1.

Cards 1–3 derive from the rider's completed rides. Rides are fetched via the same `POST /get-rides` endpoint with a scope parameter (see below); no new endpoint.

### `My Rides` — scoped reuse, not fork
`RidesPage` and `RidesTable` grow a `scope: "mine" | "all"` prop (default `"all"`), threaded to `getRides({ scope, ... })`. When `scope === "mine"`:
- The mock MSW handler filters `RIDES` by the caller's phone (matched to the seed rider's phone via a body param — see below).
- `RidesTable` receives `hideRiderColumn={true}` and does not render the Rider column (desktop or mobile). Rider ID/name/phone are omitted from the wire when they equal the caller.
- The Customer phone renders as a `tel:` link only, not a full contact card.
- All four tabs and the 12-second live poll are preserved.
- Empty-state strings are reworded to first-person (`rides.empty.mine.live` etc.).
- The "View" action links to `/rider/rides/:rideId` (reuses `RideViewPage` under the Rider guard).
- `RideViewPage` under the Rider guard threads `scope="mine"` + caller phone into `getRide(...)`; the mock `/get-ride` handler 404s if the ride is not owned by the caller (QA Wave 4 MAJOR-1 fix, 2026-08-11). Real backend MUST derive caller phone from the session cookie — see ADR-0003 `/get-ride` amendment.

`/admin/rides` and `/admin/rides/:rideId` are untouched.

### Session-scoped rides — mock convenience, backend contract
The mock uses `body.phone` as a **mock-only convenience** to know who the caller is. In production the backend **must derive the caller phone from the session cookie** and reject or ignore any `phone` in the body for scope-limited endpoints. Same-pattern reference: `/get-all-users` (ADR-0003 fn 15, `body.role` mock convenience). This is flagged inline in `src/mocks/handlers/rides.ts` and in ADR-0003 fn 14 amendment.

### i18n
~25 new keys under `dashboards.rider.*` (Wave 4 rewrite; the debug-fields tree is deleted), plus rider-scoped rides strings (`rides.empty.mine.*`, `rides.caption.mine.*`) and layout `title`/`nav` entries for the two new rider paths. English and machine-drafted Urdu (reconciliation table row per Iter 5). No new Nastaliq load. All layout follows logical Tailwind classes only (RTL-safe).

### Tests
Additive to the 142 baseline:
- Guard-trace: Rider deep-linking `/admin/all-riders` bounces to `/rider`; Admin deep-linking `/rider/rides` bounces to `/admin`; Customer login still logs out via `PublicOnly`.
- Stat derivation: today's-earnings sum, week window boundary, acceptance-rate formula (100/85/50/edge cases).
- My Rides scope: `getRides({scope:"mine", phone})` returns only caller rides; `hideRiderColumn` renders no rider cells.
- Sidebar role-branch: Rider sees 3 items; Admin sees full items; Operator sees Admin-minus-userManagement.

## Decision — Phase 2 (gated)

- **`POST /get-my-stats`** — new backend endpoint returning `{ earningsToday, earningsWeek, ridesToday, ridesWeek, acceptanceRate, avgRating }`. Replaces the client-side derivation from Phase 1. Wave-4 Phase 2 becomes a straight fetch swap; Phase 1 derivation is kept as a fallback path when the endpoint 404s.
- **Documents page (read-only for Rider)** — reuses the `RiderEditPage` documents card in read-only mode. Route: `/rider/documents`.
- **Earnings trend chart** — one shadcn chart card on the Rider Dashboard showing last-6-weeks earnings from `POST /get-my-stats` (backend supplies the series).

## Decision — Phase 3 (gated on Phase 2 backend commitment)

- **Peak-hours heatmap** — server-computed from ride history.
- **Online-hours summary** — reads a new `POST /get-my-online-hours` endpoint returning session-time deltas.

Phase 3 requires backend commitment to session-time recording and heatmap aggregation. Deferred out of scope until Phase 2 lands.

## Consequences
- Rider role now has a real navigation surface and a dashboard that matches Admin/Operator polish.
- One additional MSW handler param (`scope`) with an inline "MOCK-ONLY convenience" flag — same shape as `/get-all-users` fn 15.
- Phase-1 derivation logic lives client-side; backend follow-up (D50) tracks the `/get-my-stats` endpoint to eliminate it.
- `RidesPage`/`RidesTable` gain one `scope`/`hideRiderColumn` prop each — no fork, no duplicate table.
- ADR-0003 amended in the same commit to add `scope: "mine" | "all"` to the `/get-rides` row with the mock-convenience flag (H1).

## Alternatives considered
- **Fork `RidesPage` into `MyRidesPage`.** Rejected — 400 LOC of near-duplicate code; scope prop is 5 lines.
- **Client-side filter of `/get-all-rides` by phone (no backend flag).** Rejected — exposes every rider's rides to every rider client-side. Even under MSW that pattern normalizes the wrong shape for the real backend.
- **Ship a full `/get-my-stats` endpoint mock in Phase 1.** Rejected per H10 — Phase 1 derivation is 30 lines and matches the frozen contract; Phase 2 upgrades cleanly.

## Links
- `local-docs/adr/0003-mock-api-msw.md` fn 14 (amended — `scope` param) and fn 15 (mock-convenience pattern reference).
- `local-docs/design/migration-plan.md` D50 (`/get-my-stats` Phase 2 backend) and D37 item 9 (rider-scoped rides on Backend Handover list).
- `local-docs/PROJECT.md` Wave 4 row.
- Prior ADRs: 0002 (routing + guards), 0006 (rides + live map), 0007 (rider page consolidation).
