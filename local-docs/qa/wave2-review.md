# Wave 2 QA Review — Portal Consolidation

**Reviewer:** QA-Wave2 (sub-agent, SWE Team Lead)
**Date:** 2026-08-11
**Scope:** \`git log da9a6ef..d3bdc7d\` — commits \`b4d995f\` (track local-docs + W1 fixes), \`f6f8f33\` (PendingRiders retirement + redirect), \`d3bdc7d\` (ActiveRiders sim-strip + lazy Leaflet + 'Live map' rename).

## Verdict: **SHIP** ✅

All five gates green. H1–H10 respected. H8 guard behaviour byte-identical to Wave 1 (redirect nested in same \`Admin+Operator\` \`ProtectedRoute\` group). Zero dangling refs to PendingRiders / \`get-all-inactive-riders\` across src/, tests/, and vite.config.ts. i18n EN⇄UR key sets remain congruent (464 keys each). No secrets or PII beyond values already in-repo. Reported gate numbers reproduce exactly.

## Priority 1 — Approve-with-PIN flow survival

**Path traced end-to-end:**
- \`Dashboard.tsx\` StatCard → \`/admin/all-riders?status=pending\`
- \`AllRiders\` reads \`?status=pending\` via \`readStatusTab(sp)\` (unchanged from Wave 1 blocked-riders retarget pattern)
- Row click → \`RiderDetailSheet\` → \`RiderEditPage\`
- \`RiderEditPage.tsx:506\` \`handleActivate()\` validates \`/^\\d{6}$/\` PIN → \`activateRider(row.phone, activatePin)\` (api/riders.ts:51) → \`POST /activate-rider\` (H1-frozen)
- MSW handler \`src/mocks/handlers/riders.ts:239\` writes \`activationStatus = 'active'\` + returns \`success:true\`, message. ✅

**Test coverage delta (da9a6ef → d3bdc7d):**
- \`git grep\` at da9a6ef confirms **no test previously exercised \`activateRider()\` / the PIN activate flow**. The retired \`PendingRiders.tsx\` was 562 LOC of UI but had no unit or integration test hitting its activate mutation, and \`register-flow.test.tsx\` does not touch it either.
- Conclusion: **no activate-flow coverage was silently dropped — this is a pre-existing gap, not a Wave 2 regression.**
- \`all-riders.test.tsx:199\` still asserts \`fqa-count-pending === '2'\` — pending-tab rendering path still exercised via \`/get-all-riders\` seeds.

**Finding W2-1 (Info, pre-existing):** The PIN activate mutation (\`handleActivate\` → \`/activate-rider\`) has no automated regression test. It is a critical business path. Recommend adding a \`riders-activate.test.tsx\` covering (a) 6-digit PIN validation gate, (b) success → status changes to active, (c) API error → \`statusError\` renders. **Not a Wave 2 blocker** — the gap existed pre-consolidation.

## Priority 2 — Endpoint retirement (H1/H6)

\`\`\`
rg -n \"get-all-inactive-riders|API_GET_UNREGISTERED_RIDERS|getUnregisteredRiders|isNoRidersFoundError|inactiveSeeds|PendingRiders|nav\\.pendingRiders|title\\.pendingRiders|riders\\.pending\\.\" src/ tests/ vite.config.ts
→ 0 hits
\`\`\`

- \`src/api/riders.ts\` — URL constant, helper, error class **all deleted** ✅
- \`src/mocks/handlers/riders.ts\` — handler, \`inactiveSeeds\`, all cross-refs deleted; \`/activate-rider\`, \`/update-user\`, \`/reset-rider-pin\` now reference \`allRidersSeeds\` only ✅
- \`vite.config.ts\` \`PROXY_PREFIXES\` — no longer lists \`/get-all-inactive-riders\` ✅
- **ADR-0003 fn ¹⁶ amended same-commit** (line 116) documenting retirement with clear rationale — H6 compliant ✅
- No other consumer existed (grep clean).

## Priority 3 — H8 guard trace (independent, from \`src/router.tsx\`)

| Scenario | Path | Result |
|---|---|---|
| Logged-out → \`/admin/pending-riders\` | ProtectedRoute(Admin+Operator, router.tsx:49-60): \`!profile\` → \`<Navigate to=\"/login\">\` — inner Navigate to all-riders never renders. | ✅ No loop |
| Customer seed (H3 tripwire, \`0300444444\`) → \`/admin/pending-riders\` | ProtectedRoute: role not allowed → \`<Navigate to={roleHome(\"Customer\")}>\` = \`/login\` → PublicOnly: unknown-role → \`useEffect(logout)\` + render LoginPage. F1 fix intact. | ✅ No loop |
| Admin → \`/admin/pending-riders\` | Inner \`<Navigate to=\"/admin/all-riders?status=pending\" replace>\` fires; \`AllRiders\` renders Pending tab. | ✅ Works |
| Operator → \`/admin/pending-riders\` | Same as Admin (both in the allow-list). Confirmed via \`guards.test.tsx\` F3 amendment (retargeted to active-riders but same ProtectedRoute group). | ✅ Works |
| Redirect loop | Target \`/admin/all-riders\` ≠ source \`/admin/pending-riders\`. | ✅ No loop |

**Pattern is byte-identical to Wave 1 blocked-riders redirect** (router.tsx:52 vs :53 — same nesting, same Navigate shape).

## Priority 4 — ActiveRiders sim-strip + lazy Leaflet + rename

**Fabricated data sweep (\`src/features/riders/\`):**
\`\`\`
rg -n \"jitter|random|setInterval|Math\\.random|RiderState|dispatching|arriving|idle\" src/features/riders/ActiveRiders.tsx src/features/riders/LiveMap.tsx src/types/rider.ts
→ 0 hits
\`\`\`
✅ Zero fabricated data. Page renders only real \`currentLocation.{lat,lon}\` values from \`/get-all-riders\` after filtering \`activationStatus === 'active'\` (case-insensitive, snake_case alias accepted via \`toStatus()\` — ActiveRiders.tsx:9-12).

**React.lazy / Suspense correctness:**
- \`LiveMap\` extracted to \`src/features/riders/LiveMap.tsx\` (43 LOC, react-leaflet only) ✅
- \`ActiveRiders.tsx:7\` \`const LiveMap = lazy(() => import('./LiveMap'))\` ✅
- Suspense fallback (ActiveRiders.tsx:90-98) reuses the same \`riders.active.loading\` string as the initial-fetch state — no flash of unstyled content ✅
- **Chunk-load failure path:** RootLayout \`errorElement: <ErrorBoundaryPage />\` (router.tsx:21) catches errors bubbling through Suspense during \`React.lazy\` fetch failures. Verified via \`error-boundary.test.tsx\` pattern (route-level errorElement catches render-time throws in descendants). ✅

**Route path unchanged:** \`/admin/active-riders\` (router.tsx:51) — no redirect churn ✅

**\"Live map\" rename synced (en + ur + reconciliation):**
- \`en.json\` \`layout.nav.activeRiders\` = \"Live map\", \`layout.title.activeRiders\` = \"Live map\" ✅
- \`ur.json\` same keys = \"لائیو میپ\" ✅
- \`local-docs/design/i18n-strings.md\` lines 24, 29 synced ✅
- \`riders.active\` narrowed to \`{total, live, loading}\` — \`states.*\` pruned in both locales ✅
- Python key-set diff EN ⇄ UR: **464 keys each, 0 mismatches** ✅

## Priority 5 — Regression sweep

| Check | Result |
|---|---|
| \`rg PendingRiders\` in src/,tests/ | 0 hits ✅ |
| \`rg pending-riders\` outside redirect | router.tsx:52 (redirect) + redirect test only ✅ |
| \`rg riders\\.pending\\.\` | 0 hits ✅ |
| \`rg nav\\.pendingRiders\` / \`title\\.pendingRiders\` | 0 hits (sidebar + DashboardLayout title-map cleaned) ✅ |
| \`en/ur\` key congruence | 464/464 identical ✅ |
| \`pending-riders-redirect.test.tsx\` | Follows blocked-riders template — asserts \`pathname\`, \`search\`, and stub reads \`status=pending\` from URL ✅ |
| \`guards.test.tsx\` F3 amendment | Retargeted to \`/admin/active-riders\` (still in Admin+Operator group) — coverage preserved ✅ |
| StatCard retarget in Dashboard.tsx | \`pendingRiders\` \`onClick\` → \`/admin/all-riders?status=pending\` ✅ |
| D18 register entry | Marked superseded 2026-08-11 with reasoning + ADR-0003 fn ¹⁶ backref ✅ |
| D43 register entry | Closed 2026-08-11 with real gzip numbers (211.33 → 210.74 kB) ✅ |
| D47 register entry | Opened for backend live-position mechanism (WebSocket/SSE/poll) — owner to relay ✅ |

## Priority 6 — local-docs tracking (Task A)

**\`.gitignore\` change scoped correctly:**
\`\`\`diff
- local-docs/
\`\`\`
Only the trailing \`local-docs/\` entry removed; \`.env\`, \`node_modules/\`, \`dist/\`, Playwright report dirs, IDE dirs all still ignored. H5 (\`.env\` never committed) intact.

**Secrets scan (\`local-docs/\` contents):**
Ran patterns for: password literals, API keys, JWTs, PEM headers, AWS/OpenAI/Slack/GitHub tokens.
- Only benign matches: dev MSW seed passwords (\`\"admin\"\`, \`\"rider\"\`) referenced in session-log code snippets — already in \`src/mocks/handlers/auth.ts\`, public.
- \`VITE_GOOGLE_MAPS_KEY\` — env-var **name** only, no value.
- No actual keys, tokens, JWTs, or certificates.

**PII scan (\`@amazon.com/de\` + Pakistani mobile pattern):**
- Only phones = the known dev seed values (\`0300444444\`, \`0300111111\`, \`0300222222\`, \`0300333333\`, \`0300000000\`, \`0300123456\`), all already in \`src/mocks/handlers/auth.ts\` / \`riders.ts\`.
- No customer or employee real numbers/emails.

**Safe to track.** ✅

## Priority 7 — Fresh gate results (executed by QA-Wave2)

| Gate | Result |
|------|--------|
| \`npm run lint\` | ✅ clean (0 errors, 0 warnings) |
| \`npm run typecheck\` | ✅ 0 errors |
| \`npm run typecheck:strict\` | ✅ 0 errors |
| \`VITE_ENABLE_MSW=false npm run build\` | ✅ built in 1.74s |
| \`rg -l msw dist/assets/*.js\` | ✅ **0 hits** — MSW absent from prod bundle |
| Main-chunk gzip | ✅ **210.74 kB** (matches reported exactly) |
| \`LiveMap-*.js\` chunk | ✅ **0.57 kB gzip** (matches reported) |
| \`npm test -- --run\` | ✅ **127/127 passing** (20 files, 38.53s) |

## H9/H10 Sweep on diff

- No stray non-tooling comments added in code diffs (ActiveRiders.tsx, LiveMap.tsx, router.tsx, api/riders.ts). ✅
- LiveMap.tsx is minimum viable (43 LOC, no abstraction). ActiveRiders.tsx no longer carries the state simulation — net LOC drop 153 → 106. ✅

## Findings

| ID | Severity | Area | Finding | Action |
|----|----------|------|---------|--------|
| W2-1 | Info (pre-existing) | Test coverage | PIN activate flow (\`handleActivate\` → \`/activate-rider\`) has no automated regression test. Gap existed before Wave 2 — not introduced by consolidation. | Optional follow-up: add \`riders-activate.test.tsx\` (PIN validation + success + error paths). |
| W2-2 | Trivial | Test coverage | \`guards.test.tsx\` unauthed deep-link check no longer includes \`/admin/pending-riders\` path. The new \`pending-riders-redirect.test.tsx\` covers the authed redirect. Same standard applied at Wave 1 for blocked-riders — consistent, not a defect. | None required. |

**Zero P0 / P1 / Major findings. No blockers.**

## Sign-off

**QA verdict: SHIP.** Wave 2 is a clean, well-scoped consolidation. PendingRiders retirement is complete (page + endpoint + helper + handler + seeds + i18n + sidebar + title map + StatCard target — all touched same-commit). ActiveRiders sim-strip removes all fabricated state; Leaflet lazy-load lands with a proper Suspense boundary and error-boundary safety net. \"Live map\" rename is consistent across en/ur/reconciliation. local-docs tracking is safe (no secrets, no PII beyond existing dev seeds). All five gates green, reported metrics reproduce exactly. H1/H2/H3/H5/H6/H8/H9/H10 all intact.

One info-level follow-up (W2-1) surfaces a pre-existing test gap around the PIN-activate mutation — worth queuing for a small dedicated test file, but does not block this ship.
