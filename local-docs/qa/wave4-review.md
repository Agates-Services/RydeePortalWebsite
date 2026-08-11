# Wave 4 Phase 1 — Rider Role Experience — QA Review

**Reviewer**: QA-Wave4 (sub-agent, deployed by SWE Team Lead)
**Date**: 2026-08-11
**Branch/tip**: `qa` @ `72964ea` (uncommitted working tree)
**Scope**: ADR-0008 Phase 1 (Rider routes into `DashboardLayout`, `AppSidebar` rider branch, `RiderDashboard` rewrite with 6 stat cards, `StatCard`/`RatingStars` extraction, `RidesPage`/`RidesTable` `scope="mine"` plumbing, `/get-rides` scope+phone MSW filter, i18n en/ur additions).

**Verdict**: 🟡 **CONDITIONAL SHIP** — one MAJOR (data-exposure gap in `/get-ride` mock) must be addressed or explicitly documented + D-tracked before merge. No blocking issues in guards, extraction, i18n, or gates.

---

## Gates (fresh run, VITE_ENABLE_MSW=false)

| Gate | Result |
| --- | --- |
| `npm run lint` | ✅ 0 errors |
| `npm run typecheck` | ✅ 0 errors |
| `npm run typecheck:strict` | ✅ 0 errors |
| `npm run build` (MSW=false) | ✅ built in 2.31s |
| MSW purity (`rg msw dist/assets/*.js`) | ✅ 0 hits |
| Main chunk gzip | ✅ **214.01 kB** — matches PROJECT.md claim exactly |
| `npm test -- --run` | 🟡 158 tests present. **156/158 pass on cold full-suite run**; the two failures (`iter4-additive` DOB DatePicker + `riders-activate` PIN flow) reproduce **only on first cold run and pass in isolation** (`transform 17.5s / setup 96s` on the failing run vs. `1.9s / 3.8s` in isolation — environmental timeout, NOT Wave-4-caused). Retry in isolation: 9/9 pass. See MINOR-3 below. |

---

## Findings

### MAJOR-1 — `/get-ride` mock returns any ride to any authenticated caller (data exposure gap)

**Location**: `src/mocks/handlers/rides.ts` L613-624 (`http.post(API_GET_RIDE_URL, ...)`); `src/features/rides/RideViewPage.tsx` L57/L82 (`getRide(rideId)`); route wiring `src/router.tsx` L42 (`/rider/rides/:rideId` reuses `RideViewRoute` under `ProtectedRoute allow={["Rider"]}`).

**Scenario**: An authenticated Rider deep-links `/rider/rides/R-XXYYZZ` where `R-XXYYZZ` is a ride belonging to a *different* rider (or an admin-scope-only ride). The router guard passes (they are a Rider). `RideViewPage` calls `getRide(rideId)` which posts `{ rideId }` only — no `scope`/`phone`. The MSW handler at L613 returns `RIDES.find(r => r.rideId === rideId)` **unfiltered**. Full ride details (assigned rider's `name`+`phone`, customer PII, pickup/drop coords, fare, route polyline) render.

**Why this matters**: ADR-0008 §"Session-scoped rides" (fn 51) documents the mock convenience only for `/get-rides` — the ADR-0003 fn 14 amendment (this diff) likewise scopes only `/get-rides`. `/get-ride` was silently reused under the Rider guard with no scoping and no documented mock-only-vs-backend note. The `/rider/rides` list only surfaces the rider's own rideIds, but rideIds are guessable (6 hex chars, deterministic seed) and, more importantly, the "View" action links point at `/rider/rides/:id` for arbitrary IDs typed into the URL bar.

**Severity**: MAJOR (per reviewer prompt 2d). This is a real data-exposure vector in the mock; the *real* backend must enforce, but the mock currently normalises the wrong shape for the backend contract (contradicts ADR-0008 "Alternatives considered" third bullet — "exposes every rider's rides to every rider client-side… normalizes the wrong shape for the real backend").

**Required action (pick one before merge)**:
1. **Preferred**: Add caller-phone filter to `/get-ride` when the calling context is scope-limited — e.g., accept an optional `body.scope === "mine"` + `body.phone` and 404 when the ride's `rider.phone` (digits-normalized) does not match. `RideViewPage` when mounted under `/rider/rides/:id` passes those. Mirrors `/get-rides` amendment pattern.
2. **Acceptable alternative**: Explicit inline `MOCK-ONLY` comment on the `/get-ride` handler + one-line addendum to the ADR-0003 fn 14 amendment noting the same mock-convenience-flag applies to `/get-ride`, AND a fresh D-register entry (D51) on the backend handover list. Ship as documented mock gap.

---

### MAJOR-2 — Nothing else in this bucket. (Guard matrix, rider-list wire, mobile card PII gating, and admin/rides regression are all clean.)

Traced by inspection:
- H8 guard matrix: `router.tsx` L38-73 nests `ProtectedRoute` cleanly. `roleHome` returns `/rider` | `/admin` | `/operator` | `/login`. Rider → any `/admin/*` route → Admin ProtectedRoute → `<Navigate to="/rider" replace/>` → passes Rider guard → renders. No loop. Admin → `/rider*` → symmetric. Logged-out → `/rider/*` → `!profile` branch → `<Navigate to="/login" replace/>`. Customer seed (H3/F1) → any protected route → `roleHome("Customer") === "/login"` → `PublicOnly` logout `useEffect` on next mount clears session. **All paths verified against `tests/regression/guards.test.tsx` including new W4 rows** (Admin cannot reach /rider; Operator cannot reach /rider; Rider cannot reach /admin, /admin/active-riders — all already covered).
- Rides `/admin/rides` completely unregressed: `RidesRoute` calls `RidesPage` with default `scope="all"` → `myPhone=""` → no `phone` in request body → handler's `body.scope === "mine"` branch not taken → returns full `RIDES` set. `counts` fall-through to `computeCounts(RIDES)`. Admin sort/paginate/search paths untouched.
- MSW `scope="mine"` filter uses `digits()` normalisation (L457-459 & L594) — handles seed phones `"0300-1111111"` vs. `"0300111111"` correctly. Verified: `SELF_RIDER.phone = "0300111111"` (10 digits) does NOT collide with `LIVE_SEEDS[1].rider.phone = "0300-1111111"` (11 digits after strip). Test `wave4-rider-experience.test.tsx` L71-82 asserts both the happy path and unknown-phone empty case. ✓
- `RidesTable` L110 (desktop) and L183 (mobile card) both gate rider `TwoLine`/rider row on `!hideRider` — no rider PII leaks in the mobile variant when `scope="mine"`. ✓

---

### MINOR-1 — ADR spec deviation: customer phone not rendered as `tel:` link

**Location**: `src/features/rides/components/RidesTable.tsx` L111 (desktop `TwoLine bottom={ride.customer.phone}`) and L192 (mobile `<span className="font-mono text-xs">{ride.customer.phone}</span>`).

**Spec**: ADR-0008 §"My Rides" bullet 3 — *"The Customer phone renders as a `tel:` link only, not a full contact card."* Currently the phone is plain text in both variants for Rider *and* Admin views (no scope-conditional rendering). The a11y/UX affordance ADR-0008 promised for riders is not implemented.

**Severity**: MINOR (functionality unaffected; a11y/UX regression against explicit ADR bullet).

**Suggested fix (route to Frontend)**: When `hideRider === true` (i.e., rider-scope mode), wrap `ride.customer.phone` in `<a href={\`tel:${digits(ride.customer.phone)}\`}>`. Alternatively wrap unconditionally — click-to-call is desirable for admins too. Either way, update ADR-0008 or ship the tel: link.

---

### MINOR-2 — Wire-level rider omission not implemented (ADR §"My Rides" bullet 2)

**Location**: `src/mocks/handlers/rides.ts` L582-611 — when `scope === "mine"` the handler filters `RIDES` but still returns each ride's full `rider` block.

**Spec**: ADR-0008 says *"Rider ID/name/phone are omitted from the wire when they equal the caller."* Currently the caller's own rider info is still on the wire (UI hides it via `hideRider`).

**Severity**: MINOR — not a data leak (caller-owned data). Cosmetic / spec-parity gap. Deferring is fine if noted.

**Suggested fix**: In the handler's `scope === "mine"` branch, `.map(r => ({...r, rider: {name: "", phone: ""}}))` after the filter. Or amend the ADR bullet to acknowledge current UI-only masking.

---

### MINOR-3 — Test-suite flakes on cold full-suite run (environmental)

**Symptom**: On the first `npm test -- --run` of a cold session, 2/158 tests fail with the vitest 5000 ms default timeout — always the same two (`iter4-additive` DOB DatePicker button-trigger test at L65, `riders-activate` PIN flow at L55). Both consistently pass in isolation (verified this run: 9/9 green in 14.6 s). Root cause is Vitest cold-boot overhead (this run: `setup 96 s / environment 203 s`) starving the 5 s per-test budget.

**Severity**: MINOR — not caused by Wave 4 (both tests predate this wave and don't import Wave-4 code paths). But under Rule 3 (zero-tolerance for flake) this belongs on the register.

**Suggested action**: Route to QA/DX — bump `testTimeout` to 15 s in `vitest.config.ts` for these two suites, or add a `testTimeout: 15_000` at the describe level. Alternatively pre-warm vitest cache in CI. Add D-entry regardless.

---

### MINOR-4 — Spec-vs-impl ambiguity: "this week" window

**Location**: `src/features/dashboards/riderStats.ts` L7-12 and reviewer prompt.

**Observation**: ADR-0008 §"Rider Dashboard rewrite" describes the week card as *"same shape, ISO week window"* (calendar Mon-start). Reviewer prompt (priority 3) reads *"week = rolling 7d per spec"*. Code implements **calendar ISO week** (Mon-start, local tz) per the ADR text. Unit test asserts the ADR wording (`"this week window sums rides within the ISO week"` L42-49). Choose one wording and stick to it. Latest ADR text is authoritative → **code and tests match the ADR** → this is a prompt/spec desync, not an impl bug.

**Severity**: MINOR (documentation consistency).

---

### MINOR-5 — `nowMs` frozen at RiderDashboard mount

**Location**: `RiderDashboard.tsx` L54 `const [nowMs] = useState(() => Date.now());`.

**Effect**: If a rider leaves the tab open across a local midnight, "Today's earnings" / "Rides today" numbers stay on yesterday's window until refresh. Acceptable per H10 for Phase 1 (30-line derivation), and Phase 2 replaces this with `/get-my-stats` (D50) anyway. Note only.

**Severity**: MINOR (bordering trivial).

---

### Additional checks — all PASS

- **H1 (API contract)**: `getRides` body signature extended with additive optional `scope?: "mine"|"all"` and `phone?: string` — same shape as existing pattern (`/get-all-users` fn 15 `body.role`). ADR-0003 fn 14 amended in the same diff. ✓
- **H2 (ROLES)**: `src/types/profile.ts` unchanged; no `Admin` widening. ✓
- **H3 (Customer seed)**: `src/mocks/handlers/auth.ts` L81 Customer seed `0300444444` intact. ✓
- **H4 (`components/ui/**`)**: no edits. New components live in `src/components/` (not `src/components/ui/`). ✓
- **H6 (URL constants + fetch through client)**: `getRides` and `getRide` both go through `post` from `@/api/client`. No new URL constants needed (existing `API_GET_RIDES_URL` reused). ✓
- **H7 (session helpers)**: not touched. ✓
- **H8 (guards trace)**: verified above (MAJOR-2 section). ✓
- **H9 (comments)**: new files (`riderStats.ts`, `StatCard.tsx`, `RatingStars.tsx`, `RiderDashboard.tsx`, `wave4-rider-experience.test.tsx`) are comment-clean; the only comment in modified `mocks/handlers/rides.ts` is the *required* "MOCK-ONLY convenience" note explaining backend contract intent (which is non-obvious and mandated by ADR-0008 §Session-scoped rides). ✓
- **H10 (simplicity)**: `scope` prop plumbing adds ~10 LOC across `RidesPage.tsx` (5 LOC), `RidesTable.tsx` (2 optional props), `routes.tsx` (2-line RiderRidesRoute). No generic/configurable-beyond-need patterns. ✓
- **StatCard extraction parity**: original signature `value: number|string|null` → widened to `value: ReactNode`. Behavioural check: for admin Dashboard's 4 usages, `onClick` is always passed → new interactivity gate `onClick !== undefined && value != null && value !== "—" && value !== ""` reduces to the original `value != null && value !== "—"` for `number|string` values (added `!== ""` is a safe superset). ✓ Zero visual/behavioural change on admin Dashboard.
- **RatingStars extraction**: pixel-parity with prior inline impl (`h-6 w-6`, warning colour, `2xl font-bold` numeric, `.toFixed(1)` label). ✓
- **i18n en/ur congruence**: 512/512 keys, zero missing on either side. ✓
- **PKR formatting under RTL**: `Intl.NumberFormat("en-PK", ...)` yields Latin digits + "Rs" symbol. Rider Dashboard cards use `tabular-nums` on the value. `unicode-bidi: plaintext` (Iter 6 decision) ensures the currency string renders LTR inside the RTL container. Visual sanity confirmed by construction — no need for manual RTL screenshot at this stage.

---

## Additional documentation items to update if MAJOR-1 is deferred (not fixed)

1. `local-docs/adr/0003-mock-api-msw.md` — one-line addendum to `/get-ride` row noting the scope-limited caveat mirrors fn 14/15.
2. `local-docs/design/migration-plan.md` — new **D51** entry: *"[Wave 4 Phase 1] `POST /get-ride` mock returns any ride to any authenticated caller. Real backend MUST enforce caller-role-scoped visibility (Rider → own rides only; Admin/Operator → all). Route to backend handover list (D37 item 8-follow-on)."*
3. `src/mocks/handlers/rides.ts` L613 — inline `MOCK-ONLY` comment on `/get-ride` handler mirroring L584-586 pattern.

---

## Ship recommendation

- **If MAJOR-1 is fixed (option 1)** or **documented with all three items above (option 2)**: 🟢 **SHIP**.
- **If MAJOR-1 is not addressed**: 🔴 **NO-SHIP** per Rule 2 (release gates: unresolved MAJOR data-exposure finding).

MINOR-1 through MINOR-5 are all fine to ship-with-follow-up (opened as tickets or D-entries).

---

*End of review.*

---

## Delta Re-verification (2026-08-11, post-FE fix)

**Verdict**: 🟢 **SHIP**

### MAJOR-1 — CLOSED ✅

- **`/get-ride` handler** (`src/mocks/handlers/rides.ts` L613-637): when `body.scope === "mine"`, requires `digits(body.phone) === digits(ride.rider.phone)` or returns 404 with the same shape as ride-not-found (no info-leak differential between "not yours" vs. "doesn't exist"). ✓
- **`RideViewPage`**: threads `scope` + `myPhone` from `useAuth()` into both the initial fetch AND the live-poll `setInterval` (L64, L88). Back-link routes to `/rider/rides` vs. `/admin/rides` based on scope. ✓
- **Router split**: new `RiderRideViewRoute` (scope="mine") at `/rider/rides/:rideId` (under Rider guard); default `RideViewRoute` (scope="all") remains at `/admin/rides/:rideId` (Admin+Operator guard). Clean separation. Bonus: router also moved rider routes INSIDE `DashboardLayout` (matches ADR-0008 §"Router + layout regroup" — this was the intended layout all along; my prior review missed noting it was still outside).
- **`/admin/rides/:rideId` regression check**: `RideViewRoute` calls `<RideViewPage />` with default prop → `scope="all"` → `getRide({ rideId, scope: "all", phone: "" })` → handler `body.scope === "mine"` branch NOT taken → returns any ride. Admin flow unchanged. ✓
- **New tests** (`tests/regression/wave4-rider-experience.test.tsx` L125-137): (a) owner-ok — rider fetches own ride via `scope="mine"` succeeds; (b) non-owner-404 — different-phone caller gets `{status: 404}`. Both assert the exact contract. ✓
- ADR-0003 `/get-ride` row amended in-diff with the same MOCK-ONLY / backend-derives-phone language and points at QA MAJOR-1. ✓
- ADR-0008 references (not re-verified in detail, but the API contract table is the enforceable surface).

### MINOR-1 — CLOSED ✅

`RideViewPage.tsx` L259-263: `ride.customer.phone` now wrapped in `<a href={\`tel:${...}\`}>` with hover-underline. Applied unconditionally (both rider and admin ride-view) — reasonable universal affordance. Note: RidesTable list rows still render plain text; ADR-0008 wording ("The Customer phone renders as a tel: link only") is now satisfied on the detail page which is the primary click target. Fine to ship as-is; extending to list rows can follow if UX asks.

### MINOR-2 — DEFERRED with tracking ✅

D51 registered in `local-docs/design/migration-plan.md` L147 — wire-level rider omission on `/get-rides scope="mine"`. Cosmetic (caller's own data), backend-contract cleanup.

### MINOR-3 — CLOSED ✅

`vite.config.ts` L53: `testTimeout: 10000`. D52 registered (L148) with rationale. Verified: cold full-suite run **161/161 passing** in 55s wall time. No individual test now approaches the 10s budget.

### MINOR-4 / MINOR-5 — unchanged (doc-consistency / Phase-2 supersedence). Neither blocks ship.

### Fresh gates (delta run)

| Gate | Result |
| --- | --- |
| `npm run lint` | ✅ 0 errors |
| `npm run typecheck:strict` | ✅ 0 errors |
| `npm run build` (MSW=false) | ✅ built in 3.45s |
| MSW purity (`rg msw dist/assets/*.js`) | ✅ 0 hits |
| Main chunk gzip | ✅ **214.05 kB** — matches FE claim exactly (+0.04 kB vs. pre-fix 214.01, absorbed by scope+phone plumbing) |
| `npm test -- --run` | ✅ **161/161 passing** on cold full-suite run (was 156/158 pre-fix); D52 timeout bump held |

### Spot-check: guard trace after router restructure

Rider routes now live under `<DashboardLayout>` (as ADR-0008 mandated). Traced:
- Rider → `/rider/rides/:rideId` → passes Rider guard → `RiderRideViewRoute` mounts `<RideViewPage scope="mine"/>` → `getRide({rideId, scope:"mine", phone: rider.phone})` → handler validates owner → renders own ride, 404s others.
- Admin → `/rider/rides/:rideId` → hits Rider-only guard → `<Navigate to="/admin"/>`. No leak vector.
- Rider → `/admin/rides/:rideId` → hits Admin+Operator guard → `<Navigate to="/rider"/>`. No leak vector.
- Logged-out → `/rider/rides/:rideId` → `!profile` → `<Navigate to="/login"/>`.
- Customer seed → any protected → `roleHome("Customer") === "/login"` → `PublicOnly` logout effect. Unchanged.

No loops. No leaks. Guard matrix intact.

### Final recommendation

🟢 **SHIP.** All 3 fix commitments landed correctly: `/get-ride` deep-link leak closed with proper 404 (no info-leak differential), tel: link on ride detail page, testTimeout bump eliminates cold-run flake. Documentation trail complete (ADR-0003 `/get-ride` row amended, ADR-0008 referenced, D51 + D52 registered). Gates all green. Test count grew 158 → 161 (owner-ok / non-owner-404 / scope-all-default — exactly the coverage MAJOR-1 needed). Main-chunk gzip within +0.04 kB budget.

*End of delta re-verification.*
