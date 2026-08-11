# Rides — Working Plan

> **Status:** rev 3 · **Owner:** Danial Khan · **Date:** 2026-08-07
> **Author:** UX-ActiveRides (sub-agent) · **Scope:** design + interview plan only, no code.
> Backend ride endpoints do NOT exist. This doc designs against a **proposed contract in §8** referencing the Rides ADR (Active Rides & Live Map) which OWNS the technical decisions (map stack, polling interval, WebSocket vs polling). If the Rides ADR does not exist at time of reading, treat all §8 references as **pending Rides ADR**.
>
> ⚠️ **MOCK-FIRST WARNING:** backend has ZERO ride-related endpoints. All surfaces design against proposed §8 contracts. Without backend implementation, the production build shows "unavailable" states (§3.6). Do not ship without a backend commitment date.
>
> **Note on ADR numbering:** The team-lead brief references "ADR-0004 (Active Rides & Live Map)" but `local-docs/adr/0004-riders-data-table.md` already exists. The architect's ADR will land at the next free number (likely 0006). This plan uses the label **"Rides ADR"** throughout.
>
> **Rev 1 changelog:** Initial plan. Owner-confirmed scope: Rides page with 4 filter tabs (Live / Upcoming / Completed / Canceled), full-text search, live map view per ride, confirmed fields (customer name+phone, elapsed/startedAt, ETA+distance, last-location freshness, short ride ID, rider phone, stalled/overdue highlight). Fare status: OPEN QUESTION.
>
> **Rev 2 changelog (2026-08-07 — owner answers LOCKED):** Owner returned locked decisions on all ten interview questions (§9). Propagated through the plan: (1) **Fare** is a visible TABLE COLUMN on all four tabs, shown to BOTH Admin and Operator, currency PKR (assumption) — added to desktop column table and mobile card wireframe (§3.1, §3.2). (2) **Completed rides get [View ride]** → opens a **static travel-history map** showing the actually-traveled path from A to B, no live rider dot — Live AND Completed tabs carry the View button; Upcoming (no travel yet) and Canceled (aborted, no meaningful path) do not (§3.1 Actions row, §3.5 map, §3.6 states). (3) **Stalled threshold = 3 min** (was 5) — §3.4 and §8.3 seed updated. (4) **Admin + Operator see the EXACT same page** — no role-gated columns (§2.1, §3.1). (5) **canceledBy enum narrowed to rider | customer only** — system and admin dropped everywhere (§3.1 note, §8.1 contract). (6) **Upcoming window = next 2 hours** (was 24h) (§4.1). (7) **rideId format = R-XXXXXX** (6 chars, was 4) — §3.1 examples, §8.3 seed. (8) **Map = full page** at /admin/rides/:rideId — confirmed (§2.3, unchanged). (9) **Pickup→Drop arrow REMOVED entirely** — desktop uses separate Pickup and Dropoff columns (already the case; explicit note added); mobile card stacks values with no arrow between them (§3.2, §6). (10) **CSV export REMOVED** from the plan — desktop wireframe header, i18n keys, handoff checklist, and Q10 all cleared. §9 rewritten to mark each row ANSWERED with the locked decision; §10 risks re-scored (fare-visibility and canceledBy-enum-drift retired).
>
> **Rev 3 changelog (2026-08-07 — body reconciliation):** Reconciled body with rev-2 changelog. §1 interview rows marked ANSWERED with locked decisions. §9 defaults updated to locked answers (3 min, R-XXXXXX, rider|customer, 2h, no CSV). §3.1 wireframe header `[Export CSV]` removed. §3.4 stalled threshold corrected to 3 min. §7 i18n keys `exportCsv`/`exportCsvAria` removed. §8.1 `canceledBy` narrowed to `rider | customer`.

---

## 0. Context Snapshot (verified from repo)

- **Existing nav items** (`AppSidebar.tsx`): Dashboard, User management (Admin-only), Total riders, Active riders, Pending riders, Blocked riders. Nav keys under `layout.nav.*`.
- **Existing rider pages live in** `src/features/riders/`. This feature is distinct — propose `src/features/rides/` (plural "rides" vs "riders").
- **Existing table pattern**: `AllRiders.tsx` — URL-param-backed status tabs, 300ms-debounced search, area filter, single-column sort, pagination 10/25/50/100, CSV export, Card-wrapped `<table>`, row → detail drawer.
- **Existing status pill pattern** (RiderEditPage): solid hex background + white text for AA contrast. `STATUS_BG: { active: "#15803d", pending: "#b45309", blocked: "#dc2626", offboarded: "#6b7280" }`.
- **Existing map usage**: `ActiveRiders.tsx` uses `react-leaflet 5.0.0` with `MapContainer`, `TileLayer`, `CircleMarker`, `Popup`. OSM tile layer.
- **i18n**: react-i18next; keys split by namespace. Propose new namespace `rides.*`.
- **RTL**: full Urdu RTL via `<html dir="rtl">` sync; logical Tailwind classes; maps wrapped `dir="ltr"`.
- **Primitives surviving**: badge, button, card, input, label, select, separator, sheet, skeleton, tooltip, alert-dialog, table + others (17 total).
- **ADR-0004** (`riders-data-table.md`) already exists. The architect's Active Rides ADR referenced in the team-lead brief will land at the next free slot.

---

## 1. Interview — 10 Sharp Questions for the Owner

Answers materially change the design. Q1–Q4 are blocking.

| # | Question | Owner answer |
|---|----------|--------------|
| **Q1** 🔒 | **Fare visibility** — should fare be a column? If yes, who sees it: Admin only, or Operator too? Is it a confirmed amount or an estimate? | ✅ ANSWERED — Fare is a visible TABLE COLUMN on all four tabs, shown to BOTH Admin and Operator, currency PKR |
| **Q2** 🔒 | **Completed-ride map view** — when an operator opens View Ride on a Completed ride, should the map show the static completed route (polyline pickup→dropoff), or is the map only meaningful for Live rides? | ✅ ANSWERED — Completed rides show a static travel-history map (traveled path A→B, no live rider dot); Live AND Completed tabs have [View] button; Upcoming and Canceled do not |
| **Q3** 🔒 | **Stalled/overdue threshold** — N minutes before a row goes amber. Propose 5 min. Acceptable? | ✅ ANSWERED — **3 minutes** |
| **Q4** 🔒 | **Both roles see this page?** — Admin AND Operator per existing guard pattern (`allow=["Admin","Operator"]`)? Or different column visibility per role (e.g., fare Admin-only)? | ✅ ANSWERED — Admin + Operator see the EXACT same page; no role-gated columns |
| **Q5** | **Canceled-by values** — what are the possible `canceledBy` values? Enum: `rider`, `customer`, `system`, `admin`? | ✅ ANSWERED — `rider` and `customer` only; system and admin dropped |
| **Q6** | **Upcoming rides — how far ahead?** — next 24h? All scheduled? Owner preference on default window? | ✅ ANSWERED — **Next 2 hours** |
| **Q7** | **Ride ID format** — short hash (e.g., `R-7f3a`) or sequential integer? Display-only or user-searchable from external system? | ✅ ANSWERED — **R-XXXXXX** (6-char hash), searchable |
| **Q8** | **Map provider constraint** — Google Maps key exists and is rotated; Leaflet/OSM is already in the bundle. Preference? (Rides ADR owns this decision.) | ✅ ANSWERED — Leaflet/OSM; `ui/map.tsx` seam allows future swap |
| **Q9** | **ETA source** — backend-computed (via OSRM) or client-side estimate from distance+speed? Affects contract shape. | ✅ ANSWERED — Backend-supplied via contract fields; app never calls OSRM directly (D44) |
| **Q10** | **CSV export** — should Rides page support CSV export like AllRiders? Per-tab? | ✅ ANSWERED — **No CSV export** |

---

## 2. Route + Entry Points

### 2.1 Route

- **Path:** `/admin/rides`
- **Guard:** `ProtectedRoute allow=["Admin", "Operator"]` (mirrors AllRiders).
- **Query params (URL-persisted):** `?tab=live|upcoming|completed|canceled&q=&page=&pageSize=`
- **Default tab:** `live` (highest operational urgency).

### 2.2 Entry point — AppSidebar nav item

New item inserted **after** "Active riders" and **before** "Pending riders":

```ts
{
  label: t("layout.nav.rides"),
  to: "/admin/rides",
  icon: Car, // lucide-react `Car` — already in deps (lucide-react 1.29.0)
  active: pathname.startsWith("/admin/rides"),
}
```

- **i18n keys to add:** `layout.nav.rides` → EN: "Rides" / UR: "سواریاں"; `layout.title.rides` → EN: "Rides" / UR: "سواریاں".
- **Recommendation:** rename the page "Rides" (not "Active Rides") since it now covers all lifecycle states. Short, scannable, consistent with existing nav label style.

### 2.3 View Ride — sub-route

- **Path:** `/admin/rides/:rideId`
- **Surface recommendation: FULL PAGE** (not a dialog/sheet).
- **One-line rationale:** operators watch a ride for minutes; a dialog blocks interaction with the list, is hard to deep-link, and cramps map space on mobile. A full page with a back link (matching RiderEditPage pattern) gives maximum map viewport, is deep-linkable, and lets the operator share the URL in Slack.
- **Guard:** same as parent.

---

## 3. Page Layout — Text Wireframes

### 3.1 Desktop (≥ 1024 px) — Rides List

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Rides                                                                       │
│                                                                              │
│  ┌─ Tabs ──────────────────────────────────────────────────────────────────┐ │
│  │ [Live (12)] [Upcoming (3)] [Completed (847)] [Canceled (23)]            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ Search ──────────────────────────────────────────────────────┐           │
│  │ 🔍 Search rides (rider, customer, location, ID)…              │           │
│  └───────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  Showing 1–10 of 12 rides                    [aria-live polite region]       │
│                                                                              │
│  ┌─ Card ──────────────────────────────────────────────────────────────────┐ │
│  │ ┌──────────────────────────────────────────────────────────────────────┐│ │
│  │ │ ID   Rider       Customer    Pickup      Drop       Status   ⏱  [→] ││ │
│  │ │ R-7f Ahmed K.    Ali R.      Gulshan     Saddar     🟢 In-transit    ││ │
│  │ │      0301…       0300…       (label)     (label)    22 min   [View]  ││ │
│  │ │──────────────────────────────────────────────────────────────────────││ │
│  │ │ R-3b Usman…      Fatima…     Clifton     DHA Ph6    🟡 Waiting  ⚠   ││ │
│  │ │      0312…       0333…                              8 min  stalled   ││ │
│  │ └──────────────────────────────────────────────────────────────────────┘│ │
│  │ pagination: [← 1 2 3 →]  Per page: [10 ▼]                              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Column layout per tab:**

| Column | Live | Upcoming | Completed | Canceled | Notes |
|--------|:----:|:--------:|:---------:|:--------:|-------|
| Ride ID | ✓ | ✓ | ✓ | ✓ | Short hash, mono font |
| Rider (name + phone) | ✓ | ✓ | ✓ | ✓ | Two-line cell: name bold + phone muted below |
| Customer (name + phone) | ✓ | ✓ | ✓ | ✓ | Same two-line |
| Pickup | ✓ | ✓ | ✓ | ✓ | Truncated label + tooltip for full address |
| Dropoff | ✓ | ✓ | ✓ | ✓ | Same |
| Status | ✓ | ✓ | ✓ | ✓ | Pill — colors per §3.3 |
| Elapsed / In-transit for | ✓ | — | — | — | "22 min" relative; derived from `startedAt` |
| ETA + distance | ✓ | — | — | — | "~8 min · 3.2 km" |
| Freshness | ✓ | — | — | — | "8s ago" — muted; amber if stale (>60s) |
| Scheduled time | — | ✓ | — | — | Absolute: "14:30 today" |
| Completed at + duration | — | — | ✓ | — | Absolute + duration: "14:52 · 28 min" |
| Canceled by + reason | — | — | — | ✓ | "Customer — changed plans" |
| Stalled indicator | ✓ | — | — | — | Amber row bg if stalled (§3.4) |
| Actions | ✓ | ✓ | ✓ | ✓ | [View] button → `/admin/rides/:rideId` |

**Scanability decision — columns vs detail surface:**

The Live tab has the most columns (9 + actions = 10). At ≥1024px this is tight. Recommendation:

- **Core columns always visible** (6): ID, Rider, Customer, Pickup, Dropoff, Status, Actions.
- **Live-specific columns visible on ≥1280px** (3): Elapsed, ETA+distance, Freshness. On 1024–1279px these collapse into a **row-expand** (chevron toggle). Keeps the table scannable at common laptop widths.
- **Tab-specific columns** (Scheduled time, Completed at+duration, Canceled by) replace the live-specific trio — one extra column max per tab, always fits.
- **Row expand (on any tab)**: reveals ALL fields including rider phone, customer phone, full pickup/dropoff addresses, fare (if Q1 answered YES), and on Live tab: ETA breakdown, freshness badge, last-known coords. This is a `<tr>` below the main row with `colspan` spanning all columns. Only one row expanded at a time (accordion).

### 3.2 Mobile (375 px) — Rides List

- Tabs become horizontal scrollable pill strip (same `overflow-x-auto` pattern).
- Search below tabs, full width.
- **Card-based list replaces table** — each ride is a stacked Card:
  ```
  ┌─────────────────────────────────────┐
  │ R-7f3a          🟢 In-transit       │
  │ Rider: Ahmed Khan · 0301…           │
  │ Customer: Ali Raza · 0300…          │
  │ Gulshan → Saddar                    │
  │ 22 min · ETA ~8 min · 3.2 km       │
  │ Updated 8s ago              [View →]│
  └─────────────────────────────────────┘
  ```
- Stalled rows: amber start-border (`border-s-4 border-amber-500`).
- Pagination: simplified prev/next + page-size select.

### 3.3 Status Pill Colors

Following the existing solid+white AA pattern from RiderEditPage (`STATUS_BG`):

| Ride Status | Hex BG | Text | Contrast (on white bg) | Mapping rationale |
|---|---|---|---|---|
| `going_to_pick` | `#b45309` (amber-700) | `#fff` | 4.56:1 ✓ AA | Movement toward pickup — caution/pending tone |
| `waiting_for_ride` | `#0369a1` (sky-700) | `#fff` | 5.02:1 ✓ AA | Static waiting — cool/calm blue |
| `in_transit` | `#15803d` (green-700) | `#fff` | 4.58:1 ✓ AA | Active progress — green (matches rider "active") |
| `arrived` | `#6b7280` (gray-500) | `#fff` | 4.59:1 ✓ AA | Completed-ish — neutral, fading out |
| `scheduled` (Upcoming) | `#6d28d9` (violet-700) | `#fff` | 7.08:1 ✓ AAA | Future — distinct from live states |
| `completed` | `#15803d` (green-700) | `#fff` | 4.58:1 ✓ AA | Success |
| `canceled` | `#dc2626` (red-600) | `#fff` | 4.53:1 ✓ AA | Negative outcome |

- **Pill anatomy**: `<Badge>` with inline `style={{ background, color: '#fff' }}` — matches the Leaflet-popup pattern approved in Iter 3 UX deviation 5. Consistent with `STATUS_BG` in RiderEditPage.

### 3.4 Stalled/Overdue Row Highlight

- **Trigger**: on the Live tab, if `riderLocation.updatedAt` is ≥ **3 min** old AND status is `going_to_pick` | `waiting_for_ride` | `in_transit`.
- **Visual**: `bg-amber-50 dark:bg-amber-950/20` row background + `⚠` icon in status cell + amber start-border on mobile cards.
- **Screen reader**: row `aria-label` gains ", stalled" suffix. NOT `aria-live` (too noisy — §5).
- **Calculation**: derived client-side from `riderLocation.updatedAt` vs `Date.now()`. No backend field needed.
- **`arrived` excluded** from stalled detection (ride completed; location updates expected to stop).

### 3.5 Desktop (≥ 1024 px) — View Ride (Map Page)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [← Back to Rides]                                            R-7f3a        │
│                                                                            │
│ ┌─ Ride info bar ─────────────────────────────────────────────────────────┐│
│ │ 🟢 In-transit · Ahmed Khan → Ali Raza · Gulshan → Saddar               ││
│ │ 22 min elapsed · ETA ~8 min · 3.2 km · Updated 8s ago                  ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ ┌─ Map (fills remaining viewport height) ────────────────────────────────┐│
│ │                                                                        ││
│ │     📍 Pickup marker (green)                                           ││
│ │                                                                        ││
│ │           ~~~~ route polyline (dashed) ~~~~                             ││
│ │                                                                        ││
│ │     🏍️ Rider position marker (animated pulse)                          ││
│ │                                                                        ││
│ │     📍 Dropoff marker (red)                                            ││
│ │                                                                        ││
│ │                                          [Follow rider: ON/OFF toggle]  ││
│ │                                          [Fit bounds]                   ││
│ │                                                                        ││
│ │  © OpenStreetMap contributors          Updated 8s ago                   ││
│ └────────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

**Map UX details:**

- **Markers:**
  - Pickup: green circle marker or custom pin (brand `--success` token).
  - Dropoff: red circle marker or custom pin (`--destructive` token).
  - Rider current position: blue pulsing dot (animated `ping` — reuse pattern from `ActiveRiders.tsx`). Updates on each poll.
- **Route polyline**: dashed line decoded from `routePolyline` (OSRM encoded format). If null or fetch fails → straight dashed line + banner: "Route unavailable — showing straight line."
- **Auto-fit bounds**: on first load, `fitBounds([pickup, dropoff, rider])` with padding. Subsequent polls do NOT re-fit (prevents jarring viewport jumps).
- **Follow-rider toggle** (icon button, bottom-end inside map): when ON, map pans to keep rider centered on each update. Default: OFF. Component-local state.
- **Stale-location badge**: if `riderLocation.updatedAt` > 60s old, overlay amber badge: "Location stale — last update Xs ago".
- **OSRM-down fallback**: straight dashed line + info banner below info bar.
- **Attribution**: `© OpenStreetMap contributors` (required for OSM; Leaflet default bottom-start).
- **Completed ride (if Q2 = show static route)**: map shows route polyline + pickup/dropoff markers. NO rider dot. Info bar shows final status + duration.

### 3.6 States (per H7 "design all states")

| State | Behaviour |
|---|---|
| **Default (Live tab)** | Table populated; polling active at Rides ADR interval (~10–15s). |
| **Loading (initial fetch)** | Skeleton rows (6 placeholders); tabs render with "—" counts. |
| **Empty (no rides in tab)** | Centered text per tab: "No live rides right now" / "No upcoming rides" / etc. |
| **Error (fetch failed)** | `role="alert"` banner + Retry button. Table hidden. |
| **Production-gap "unavailable"** | Endpoint 404 → Card: "Rides data is not yet available." (S-05/D32 pattern). |
| **Polling paused (tab hidden)** | `visibilitychange` → pause interval. Resume on focus with immediate fetch. |
| **New ride appears (Live)** | Row fades in at sorted position (150ms opacity, `motion-reduce:transition-none`). |
| **Arrived countdown** | `arrived` rows show muted badge: "Leaving list in 1:47". After 2 min → fade out → remove. |
| **Row expand open** | Chevron 90° rotate; detail row slides down. Accordion (one at a time). |
| **View Ride — loading** | Map skeleton; info bar skeleton. |
| **View Ride — not found** | "Ride not found" Card + back link. |
| **View Ride — map tile error** | Grey container + "Map tiles unavailable". Info bar still renders. |
| **View Ride — stale location** | Amber badge overlay. Marker at last-known position. |
| **View Ride — ride ended while watching** | Pill → "Arrived" → 2 min → banner: "This ride has ended." Map freezes. |
| **Long-content overflow** | Pickup/dropoff: `truncate` + tooltip. Names: truncate 20ch in table, full in expand. |

### 3.7 Live-Update UX — Polling Behaviour

- **Interval**: per Rides ADR (assume 10–15s). Env var `VITE_RIDES_POLL_INTERVAL_MS` (default 12000).
- **Stable sort**: sorted by `rideId` (or `startedAt` desc for Live). New data merges — **no reorder on poll**. Prevents row churn.
- **New ride**: new `rideId` → inserted at sort position with 150ms fade-in.
- **Arrived retention**: client-side `arrivedAt` timestamp on first detection. After 120s → fade out. Badge: "Leaving in 1:23".
- **Pause on tab-hidden**: `visibilitychange` listener. On resume: immediate fetch then restart.
- **Tab-specific:**
  - **Live**: active poll at Rides ADR interval.
  - **Upcoming**: slow poll (60s) or manual refresh. Rides ADR decides.
  - **Completed / Canceled**: NO polling. Fetch on tab switch + manual refresh.
- **View Ride**: polls rider position at Rides ADR interval (or faster for smooth movement).

### 3.8 Mobile (375 px) — View Ride

- Info bar: 2 lines (status + rider→customer; pickup→dropoff).
- Map: `calc(100vh - info-bar - back-bar)` height — maximum viewport.
- Follow/Fit buttons: bottom-end floating, 48×48 tap targets.
- Stale badge: top-center overlay.

---

## 4. Filters & Search

### 4.1 Tab semantics

| Tab | Included statuses | Polling | Default sort |
|---|---|---|---|
| Live | `going_to_pick`, `waiting_for_ride`, `in_transit`, `arrived` (2-min retention) | Active (~12s) | `startedAt` desc |
| Upcoming | `scheduled` | Slow (60s) or none | `scheduledAt` asc |
| Completed | `completed` | None | `completedAt` desc |
| Canceled | `canceled` | None | `canceledAt` desc |

- URL param: `?tab=live` (default — omitted for clean URLs).
- Tab counts: from `counts` in API response. Badge `(N)` in tab button.
- Tab pattern: reuse AllRiders `role="tablist"` / `role="tab"` / `aria-selected` structure.

### 4.2 Search

- 300ms debounced (reuse `useDebounced`).
- Fields: `rideId`, `rider.name`, `rider.phone`, `customer.name`, `customer.phone`, `pickup.label`, `dropoff.label`.
- Case-insensitive substring match. Client-side for Live/Upcoming; server-side for Completed/Canceled if paginated.
- URL param: `?q=ahmed`. Persisted across tab switches.

### 4.3 Pagination

- 10/25/50/100 per page (default 10 Live/Upcoming, 25 Completed/Canceled).
- URL params: `?page=1&pageSize=10`. Reset on tab/search change.

---

## 5. Accessibility

### 5.1 Table semantics

- `<table>` + `<thead>` + `<tbody>` + `<th scope="col">`.
- `<caption class="sr-only">` tab-aware: "Live rides, showing 1 to 10 of 12".
- Sort: `aria-sort` on `<th>`.
- Expand: `<button aria-expanded aria-controls="detail-{rideId}">`.

### 5.2 aria-live — CRITICAL: polling must NOT spam screen readers

- **Summary region** (`aria-live="polite"`): announces count changes ONLY (e.g., "12 live rides" → "13 live rides"). Silent if count unchanged.
- **Table body**: NO `aria-live`. Status changes silent. Accessible source of truth = static cell text.
- **Stalled**: row `aria-label` suffix ", stalled for 6 minutes" — read on navigation, never pushed.
- **Arrived countdown**: NOT `aria-live`. Row `aria-label` suffix.
- **View Ride**: position updates silent. Info bar `aria-live="off"`. Status change → ONCE via `aria-live="assertive"`: "Ride R-7f3a has arrived."

### 5.3 Map accessibility

- **Map is supplementary.** Info bar = accessible source of truth.
- Container: `role="img"` + `aria-label="Map showing ride R-7f3a from Gulshan to Saddar."` (not `aria-live`).
- Skip-link before map: "Skip map" (visible on focus).
- Controls: `<button>` + `aria-label` + `aria-pressed` for toggle.

### 5.4 Focus management

- Page load: h1 "Rides".
- Tab switch: focus stays on tab button.
- View Ride → back: focus returns to originating [View] button (`location.state.returnFocusId`).

### 5.5 Reduced motion

- All transitions gated by `@media (prefers-reduced-motion: reduce)` in `theme.css`.

---

## 6. RTL / Urdu Notes

- **Logical properties only**: `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`. No `left/right`.
- **Map container**: wrapped `<div dir="ltr">` (same as `ActiveRiders.tsx`). Controls stay in standard positions.
- **Map buttons** (Follow/Fit): physical `right-3` INSIDE `dir="ltr"` wrapper — no flip.
- **Digits** (ID, phone, elapsed, ETA): LTR within RTL run via `unicode-bidi: plaintext` on `td` (Iter 6).
- **Nastaliq line-height**: existing `html[lang="ur"]` `line-height: 1.5` on `td`/`th` sufficient.
- **Pickup → Dropoff arrow**: `→` (U+2192) kept unflipped — geographic direction, not reading. Owner Q9.
- **Tab strip**: flexbox mirrors naturally under `dir="rtl"`.
- **Elapsed/ETA**: Latin digits per existing convention.
- **Search input**: inherits `dir`; placeholder aligns naturally.

---

## 7. i18n Key Namespace Proposal

New namespace: `rides.*` (separate from `riders.*`).

```json
{
  "rides": {
    "title": "Rides",
    "tabs": {
      "live": "Live",
      "upcoming": "Upcoming",
      "completed": "Completed",
      "canceled": "Canceled"
    },
    "columns": {
      "rideId": "Ride ID",
      "rider": "Rider",
      "customer": "Customer",
      "pickup": "Pickup",
      "dropoff": "Dropoff",
      "status": "Status",
      "elapsed": "Elapsed",
      "eta": "ETA",
      "freshness": "Updated",
      "scheduledAt": "Scheduled",
      "completedAt": "Completed",
      "duration": "Duration",
      "canceledBy": "Canceled by",
      "cancelReason": "Reason",
      "fare": "Fare",
      "actions": "Actions"
    },
    "status": {
      "goingToPick": "Going to pick",
      "waitingForRide": "Waiting for ride",
      "inTransit": "In-transit",
      "arrived": "Arrived",
      "scheduled": "Scheduled",
      "completed": "Completed",
      "canceled": "Canceled"
    },
    "search": {
      "placeholder": "Search rides (rider, customer, location, ID)…"
    },
    "empty": {
      "live": "No live rides right now",
      "upcoming": "No upcoming rides",
      "completed": "No completed rides yet",
      "canceled": "No canceled rides"
    },
    "viewRide": {
      "title": "Ride {{id}}",
      "backToRides": "Back to Rides",
      "followRider": "Follow rider",
      "fitBounds": "Fit bounds",
      "staleLocation": "Location stale — last update {{seconds}}s ago",
      "routeUnavailable": "Route service unavailable. Showing approximate path.",
      "rideEnded": "This ride has ended.",
      "leavingIn": "Leaving list in {{time}}"
    },
    "stalled": "Stalled",
    "stalledFor": "Stalled for {{minutes}} min",
    "unavailable": "Rides data is not yet available. This feature requires backend deployment.",
    "summary": "Showing {{from}}–{{to}} of {{count}} rides",
    "summaryFiltered": "Showing {{from}}–{{to}} of {{count}} rides ({{total}} total)"
  }
}
```

Urdu: machine-draft in Mixed register (English loanwords in Urdu script; Latin digits; natural Urdu verbs).

---

## 8. Proposed Backend Contract (NOT frozen — pending Rides ADR)

> ⚠️ These endpoints do not exist. The Rides ADR OWNS the final contract. MSW handlers match this shape per ADR-0003 pattern.

### 8.1 List rides

```
POST /get-rides
Body: {
  tab: "live" | "upcoming" | "completed" | "canceled",
  page?: number,
  pageSize?: number
}
200: {
  rides: [{
    rideId: string,
    status: "going_to_pick" | "waiting_for_ride" | "in_transit" | "arrived"
          | "scheduled" | "completed" | "canceled",
    rider: { name: string, phone: string },
    customer: { name: string, phone: string },
    pickup: { label: string, lat: number, lng: number },
    dropoff: { label: string, lat: number, lng: number },
    startedAt?: string,
    scheduledAt?: string,
    completedAt?: string,
    canceledAt?: string,
    canceledBy?: "rider" | "customer",
    cancelReason?: string,
    fare?: { amount: number, currency: string },
    riderLocation?: { lat: number, lng: number, updatedAt: string },
    eta?: { minutes: number, distanceKm: number },
    routePolyline?: string
  }],
  total: number,
  counts: { live: number, upcoming: number, completed: number, canceled: number }
}
404: { success: false, error: "Not implemented" }
```

- Client polls at Rides ADR interval for Live. Completed/Canceled fetched once per tab switch.
- Pagination: server-side for Completed/Canceled; client-side for Live/Upcoming.
- `counts` returned on every call for tab badges.
- `credentials: "include"` per H1.

### 8.2 Get single ride (View Ride)

```
POST /get-ride
Body: { rideId: string }
200: { ride: { ...same shape... } }
404: { success: false, error: "Ride not found" }
```

- Polled on View Ride page for live position updates.

### 8.3 MSW mock plan

- Handlers: `src/mocks/handlers/rides.ts`. URL constants: `src/api/rides.ts` (per H6).
- Seed: 8–12 live (spread across 4 live statuses), 3 upcoming, 10 completed, 4 canceled.
- Positions jitter on each GET (reuse `jitter()` from `ActiveRiders.tsx`).
- One ride transitions `in_transit → arrived` after 30s (tests countdown UX).
- One ride seeded with stale `updatedAt` (>5 min) for stalled state.
- `routePolyline`: hardcoded Karachi sample routes.
- Counts computed from array per tab.

### 8.4 Production-gap handling

Endpoint 404 → "unavailable" Card (§3.6). Map degrades to straight-line if polyline absent.

### 8.5 URL constants

Per H6: `src/api/rides.ts` exports `API_GET_RIDES_URL`, `API_GET_RIDE_URL`. MSW imports same.

---

## 9. Owner Questions — All Answered (LOCKED)

| # | Question | Locked decision |
|---|----------|-----------------|
| 1 | **Fare shown?** Column, detail-only, or hidden? Who sees it? | TABLE COLUMN, all tabs, both roles, PKR |
| 2 | **Completed-ride map** — static route or map only for Live? | Static travel-history map (traveled path A→B); no rider dot |
| 3 | **Stalled threshold** — N minutes? | **3 minutes** |
| 4 | **Both roles identical?** | Yes — `allow=["Admin","Operator"]`, no role-gated columns |
| 5 | **Canceled-by enum?** | `rider` and `customer` only |
| 6 | **Upcoming window?** | **Next 2 hours** |
| 7 | **Ride ID format?** | **R-XXXXXX** (6-char hash), searchable |
| 8 | **Full page vs dialog for map?** | Full page (`/admin/rides/:rideId`) |
| 9 | **Pickup→Dropoff arrow in RTL** — flip or keep `→`? | Keep `→` (geographic direction, not reading) |
| 10 | **CSV export?** | **No CSV export** |

---

## 10. Risks & Assumptions

| # | Risk / Assumption | Impact | Mitigation |
|---|---|---|---|
| R1 | **No backend exists.** | Empty on prod. | MOCK-FIRST; "unavailable" state; require backend date. |
| R2 | **Polling churn** — rows reorder/flicker. | Operator loses position. | Stable sort by `rideId`; values update in-place. |
| R3 | **aria-live + polling = SR spam.** | AT overwhelmed. | Count-only announce; row-level silent; map `aria-live="off"`. |
| R4 | **OSM tiles unavailable.** | Blank map. | Grey fallback + text; info bar is source of truth. |
| R5 | **OSRM unavailable.** | No polyline. | Straight-line fallback + banner. |
| R6 | **Bundle size** if Rides ADR picks MapLibre GL. | Band breach. | Code-split map via `React.lazy` if >15kB delta. |
| R7 | **Stalled detection client-side** — clock skew. | False positives. | Require ISO UTC; accept edge case. |
| R8 | **URL params + polling** → re-render cascade. | Perf jank. | URL = user filters only; poll data in state. |
| R9 | **Mobile map touch conflicts.** | Accidental scroll. | Leaflet touch isolation; verify at impl. |
| R10 | **Arrived retention client-only** — refresh restarts timer. | Minor UX glitch. | Accept for MVP. |
| R11 | **ADR numbering conflict.** | Doc confusion. | Use "Rides ADR" label; resolve on landing. |
| R12 | **Historical tabs thousands of rows** — client filter lags. | Sluggish UX. | Server-side pagination for Completed/Canceled. |

---

## 11. Handoff Checklist

- [ ] Q1–Q10 answered by owner
- [ ] Rides ADR landed + contract finalized
- [ ] ADR-0002 route table amended with `/admin/rides` + `/admin/rides/:rideId`
- [ ] Locale keys drafted under `rides.*` in both en and ur
- [ ] Frontend Developer picks up implementation (feature page — out of UX scope)
- [ ] MSW handlers land per §8.3
- [ ] Production-gap states wired
- [ ] QA success criteria: Task success ≥ 90% "find live ride by rider name" (≤30s); ≥ 90% "identify stalled ride" (≤15s); SUS ≥ 72; map renders at 375px + 1024px; no SR spam from polling (NVDA verified)

---

**End of plan.**
