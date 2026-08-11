# Wave 3 QA Review — Global 401 + My Profile

**Reviewer:** QA-Wave3 (sub-agent, SWE Team Lead)
**Date:** 2026-08-11
**Scope:** Uncommitted working tree on `qa` at tip `d3bdc7d`. New: `src/api/account.ts`, `src/features/account/pages/ProfilePage.tsx`, `src/mocks/handlers/account.ts`, 5 new tests. Modified: `src/api/client.ts`, `src/features/auth/session.ts`, `LoginPage.tsx`, `AppSidebar.tsx`, `DashboardLayout.tsx`, `router.tsx`, i18n en/ur, `mocks/handlers/{auth,index}.ts`, `vite.config.ts`, ADR-0003, migration-plan, PROJECT.md.

## Verdict: **SHIP** ✅

All five gates green. H1–H10 respected. Session discipline (H7) clean — no new direct-`localStorage` auth I/O. Global 401 handler safely exempts `/user-login`, avoids redirect loops, covers both `fetch` and `postMultipartWithProgress` paths. F1/H3 tripwire unchanged. i18n en⇄ur perfectly congruent (499 keys each, zero drift). 142/142 tests pass; W2-1 gap now covered.

Two Minor findings and one Info; none blocking.

---

## Priority 1 — Global 401 handler (`src/api/client.ts`)

Traced independently.

| Concern | Result |
|---|---|
| `/user-login` exempt (bad-creds still surfaces in form) | ✅ `isLoginUrl(url)` matches both `.../user-login` and `.../user-login?...`; short-circuit at top of `handleGlobal401`. Test `api-client-401.test.ts` asserts session + flag + `hrefSet` all untouched on login 401. |
| No redirect loop if `/login` itself triggers a 401 | ✅ `pathname === "/login"` guard skips the `window.location.href = "..."` assignment. `clearSession()` and the sessionStorage flag still fire, which is desired (LoginPage will read the flag on next mount). |
| clearSession via `session.ts` only (H7) | ✅ `handleGlobal401` imports and calls `clearSession()`; no raw `localStorage.removeItem` in the diff outside `session.ts`. |
| Hard-redirect cant fire in tests/SSR | ✅ `typeof window === "undefined"` early return covers SSR; jsdom tests are OK because the test file swaps `window.location` with a `set href` trap. Test never assigns `href` in a way that navigates the jsdom document. |
| `postMultipartWithProgress` path covered | ✅ `xhr.onload` branches on `status === 401` → same `handleGlobal401(url)` call before reject. Same-URL semantics as `request()`. |
| Raw error text bleed to UI (D34) | ⚠ **See M1 below.** `ApiError.message` is the raw response body (`text`) from the backend. `ProfilePage` sets `pwError = err.message`, so an MSW 400 with JSON body renders the full JSON string in the alert. |

## Priority 2 — H7 session discipline

| Check | Result |
|---|---|
| All auth I/O routed through `session.ts` helpers | ✅ `rg -n "localStorage\|sessionStorage" src/ -g !*.test.*` shows: `session.ts` (own impl), `client.ts` (writes the *sessionStorage* expired flag — NOT auth), `LoginPage.tsx` (reads/clears the same flag), `i18n/index.ts` (language pref, pre-existing). Zero new direct `localStorage[rydee.session]` reads/writes outside `session.ts`. |
| ProfilePage save uses `saveSession(merged) + login(merged)` | ✅ Correct pattern. Note: `login()` internally already calls `saveSession()` (see `AuthProvider.tsx:10`), so the explicit `saveSession(merged)` is redundant but harmless. See **I1** below. |
| Envelope version untouched (still `v: 1`) | ✅ No new fields added to `SessionEnvelopeV1`; the TTL-expired branch reads the same envelope shape. No version bump needed (H7 additive rule not triggered). |
| TTL-expired branch sets flag | ✅ `session.ts:65-70` — `clearSession()` first, then `sessionStorage.setItem("rydee.expired","1")` inside try/catch with silent-fallback marker. Test `session-expired-notice.test.tsx` asserts flag is set and localStorage entry cleared. |

## Priority 3 — `/change-password` contract (H1 / H6 / ADR-0003 fn 17)

| Check | Result |
|---|---|
| Flagged MOCK-ONLY / CONTRACT PROPOSAL in ADR-0003 fn 17 | ✅ Row added to contract table; footnote 17 clearly states backend has zero endpoint, wrong-current-password returns 400 (never 401), backend MUST derive `phone` from session cookie in prod. |
| Handler imports URL constant from `src/api/account.ts` (H6) | ✅ `src/mocks/handlers/account.ts:2` — `import { API_CHANGE_PASSWORD_URL } from "@/api/account";`. Never re-declared. |
| Wrong-current-password = 400 (not 401) | ✅ Handler line 34 returns 400. Test `password-change.test.tsx` case "returns a 400 (not 401)..." asserts session localStorage entry is still present after wrong-password submit. |
| Body includes `phone` from session (backend-handover flag) | ⚠ See **M2 below.** Body is client-supplied `phone` from `profile.phone`. ADR fn 17 already warns "real backend MUST derive `phone` from session cookie, never trust body" — good, but the client-supplied field is a footgun if the endpoint is copy-pasted into prod without that override. |
| `/change-password` in `PROXY_PREFIXES` | ✅ `vite.config.ts:16`. |
| Prod fallback (unavailable state) works with MSW off | ✅ `isEndpointGap()` (ProfilePage:37) matches `ApiError` name + status 404/500 → flips `pwUnavailable` → renders the neutral "not yet available" copy in place of the form. In real prod with no `/change-password` mounted, backend proxy 404 will surface as 404 (not a hijacking 401), the handler is skipped, and the fallback UI shows. |

## Priority 4 — H8 guard trace for `/account/profile`

Traced from `router.tsx:67-70`.

| Scenario | Path | Result |
|---|---|---|
| Logged-out → `/account/profile` | ProtectedRoute(Admin+Operator+Rider): `!profile` → `<Navigate to="/login">` | ✅ No loop |
| Customer seed (H3, `0300444444`) → `/account/profile` | ProtectedRoute: role not in allow-list → `<Navigate to={roleHome("Customer")}>` = `/login` → PublicOnly: unknown role → `useEffect(logout)` + render LoginPage | ✅ F1 fix intact, no loop |
| Admin/Operator/Rider → `/account/profile` | All three in allow-list → ProfilePage renders inside DashboardLayout | ✅ |
| Sidebar "My profile" link | Added to footer DropdownMenu above Sign out; visible for all authed roles (rendered inside DashboardLayout which is inside the union ProtectedRoute at `router.tsx:35`). Customer never reaches DashboardLayout so no cross-role leak. | ✅ |
| DashboardLayout TITLE_KEYS mapping | `/account/profile` → `layout.title.myProfile` added at line 15 | ✅ |
| Redirect loop on `/account/profile` | No inner Navigate; renders directly. | ✅ |

## Priority 5 — H9 sweep

`git diff --unified=0 -- src/ tests/` filtered for comment tokens (excluding eslint/ts-directives and JSX attrs) shows exactly **three** occurrences of `/* storage unavailable */`, all in identical silent-fallback shape inside a `try/catch` around `sessionStorage` writes/reads:

- `src/api/client.ts:27` — around `sessionStorage.setItem(SESSION_EXPIRED_FLAG, "1")`
- `src/features/auth/session.ts:69` — around `sessionStorage.setItem("rydee.expired", "1")`
- `src/features/auth/pages/LoginPage.tsx:36` — around `sessionStorage.getItem/removeItem`

Dev report claimed "only 2" — actual is 3, all identical, all non-decorative (they document why the empty catch is intentional). **No H9 violation** — the comments are the shortest possible marker on genuinely non-obvious silent-fallback semantics, matching the established pattern already accepted in `session.ts` before Wave 3. Zero banner headers, zero history notes, zero comments restating code.

## Priority 6 — Test quality

| Test | Asserts behavior? |
|---|---|
| `api-client-401.test.ts` (2) | ✅ Asserts (a) localStorage cleared, sessionStorage flag set, `href` set to `/login?reason=expired`; (b) login 401 leaves all three untouched. Uses a `set href` trap — clever, deterministic. |
| `password-change.test.tsx` (4) | ✅ Asserts mismatch/min-8 client-side gate messages, success confirmation, and (critically) that localStorage session is still present after wrong-current-password (proves 400 didnt hijack). Real MSW handler is exercised via test setup. |
| `profile-page.test.tsx` (4) | ✅ Asserts diff-only body (`.not.toContain("address")` when only name changed), discard-confirm dialog opens on Cancel with edits, rider activation Badge appears only for Rider role. |
| `session-expired-notice.test.tsx` (3) | ✅ Asserts flag set on TTL expiry (real `loadSession` invocation), amber notice renders from both `?reason=expired` and sessionStorage flag paths, flag is cleared after render (`waitFor` on removal). |
| `riders-activate.test.tsx` (2, W2-1) | ✅ Asserts 6-digit PIN → exactly one call to `/activate-rider` with `{phone, pin}` body; 4-digit PIN → zero calls (client-side gate). Closes the W2-1 pre-existing gap adequately. |

All 13 new tests assert behavior (session state, redirect target, flag lifecycle, diff-only payload, API-call absence), not render.

## Priority 7 — i18n congruence

```
en count: 499   ur count: 499
en only: []     ur only: []
```

Perfect key parity. +36 keys since Wave 2 (Wave 2 was 463 → Wave 3 is 499) across `auth.login.sessionExpiredNotice`, `layout.{title,nav}.myProfile`, `common.myProfile`, `account.profile.*` (11 keys), `account.settings.*` (15 keys). No mojibake, no untranslated en-strings in ur.

## Priority 8 — Fresh gates

| Gate | Result |
|---|---|
| `npm run lint` | ✅ 0 warnings |
| `npm run typecheck:strict` | ✅ 0 errors |
| `npm run build` (default `.env`, MSW=false) | ✅ Built in 1.63s. `dist/assets/index-*.js` = 712.05 kB / gzip 213.12 kB (matches dev report). |
| MSW purity | ✅ `rg -l msw dist/assets/` → 0 hits |
| `npm test -- --run` | ✅ 25 files, 142/142 tests, 31.79s |

## Findings

### M1 — Raw response body in UI error messages (D34 realized)

`ApiError.message = responseText || statusText || "Request failed"` (client.ts:40). `ProfilePage.handleChangePassword` catches and sets `pwError = err.message`. When MSW (or a real backend) returns 400 with a JSON body like `{"success":false,"error":"Current password is incorrect"}`, the alert renders the FULL JSON string — including braces and quotes. Same in `handleSaveProfile` for `updateUser` errors.

The password-change test only asserts a substring match (`/current password is incorrect/i`), which passes despite the ugly wrapping.

Severity: **Minor** (cosmetic UX; already-tracked as D34). Not blocking. Suggested fix (route to Frontend): prefer `res.error` from a parsed JSON body before falling back to `err.message`, or trim JSON envelope in a small helper.

### M2 — Client-supplied `phone` in `/change-password` body

`ProfilePage.handleChangePassword` sends `{ phone: profile.phone, currentPassword, newPassword }`. ADR-0003 fn 17 already documents that the real backend MUST derive `phone` from the session cookie and never trust the request body. Flag reinforced.

Severity: **Minor / Info-for-handover.** Not blocking (MOCK-ONLY today, ADR already warns backend team). Consider adding a comment at the call site pointing to fn 17, OR dropping `phone` from the body and letting the mock read it from the session envelope so the mock/prod shapes match. If dropped, MSW handler in `account.ts` would need a small change to look up the current user by seed order / a dev-only header — not worth blocking on. Route to Backend to address at real-endpoint time.

### I1 — Redundant `saveSession()` before `login()`

`ProfilePage.handleSaveProfile` calls `saveSession(merged)` then `login(merged)`; `AuthProvider.login` already invokes `saveSession(next)` internally (`AuthProvider.tsx:10`). The explicit call is a no-op cost but violates H10 slightly (extra call another developer would puzzle over).

Severity: **Info.** Not blocking. Suggested cleanup: drop the explicit `saveSession(merged)` call — `login(merged)` alone suffices.

## Regression sweep

| Check | Result |
|---|---|
| `rg -n "localStorage\|sessionStorage" src/ -g !*.test.* -g !mocks/**` | Only known call sites — session.ts, client.ts (flag), LoginPage.tsx (flag), i18n/index.ts (language pref). No new auth reads outside session.ts. ✅ |
| `rg -n "fetch\(" src/features/ src/api/` (features must not `fetch` directly) | Only `src/api/client.ts`. ✅ H6 |
| H1 body shape for existing endpoints | Untouched — `/user-login`, `/register-user`, `/get-all-riders`, `/activate-rider`, `/update-user` request/response unchanged. ✅ |
| H2 ROLES literal | Unchanged (`["Operator","Customer","Rider"]`). ✅ |
| H3 Customer seed (`0300444444`) | Still present in `src/mocks/handlers/auth.ts`. ✅ |
| H4 `src/components/ui/**` | No modifications in diff. ✅ |
| H5 `.env` | Not modified; `git status` clean of env files. ✅ |
| Redirect loops | H8 trace above — none. ✅ |
| ADR / D48 / D49 / PROJECT.md same-change sync | ✅ ADR-0003 row + fn 17, migration-plan D48+D49, PROJECT.md Wave 3 row all present. |

## Recommendation

**SHIP.** Two Minor findings (M1 raw error text, M2 client-supplied phone) are pre-flagged in ADR/D34, do not block release, and are appropriate to route to Frontend and Backend respectively at follow-up. Info finding I1 is a cleanup opportunity, not a defect.

Owner: proceed with commit (Option B from dev report if separating Wave 1+2 squash from Wave 3).

