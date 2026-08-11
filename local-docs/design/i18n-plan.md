# i18n Implementation Plan — English + Urdu (ADR-0005)

Ordered for one-task-at-a-time execution; owner reviews each step live on the dev
server. Every step ends with all gates green (lint, typecheck, typecheck:strict,
build, test, MSW purity, bundle band). No new tests this phase; the only test-file
edits allowed are the band constants in `tests/regression/bundle-size.test.ts`
(steps 1 and 8) — each such edit must be listed in the task report.

Owner directive 2026-08-04: bundle size is deprioritized. Both locale JSONs are
statically bundled; no lazy loading, no code splitting, no bundle mitigation work.
Band updates below are purely mechanical so the guard stays green per step.

## Ground rules for string extraction (steps 3–6)

- `en.json` values must be **byte-identical** to the current on-screen English copy.
  The 119-test suite queries by English text; any wording drift is a test failure
  and a scope violation.
- In scope: nav items, page titles, buttons, headings, table headers, tab labels,
  form labels/placeholders, validation messages, empty states, loading states,
  aria-labels, sr-only text, dialog/sheet titles and actions.
- NOT in scope: data values (names, areas, wire statuses), date formats, CSV
  content, console/error-log text, `document.title` unless owner asks.
- Keys per ADR-0005 convention: `common.* / layout.* / auth.* / dashboards.* /
  riders.*`, dot-path camelCase, named after the UI role not the English text.
- H9: no comments in JSON (JSON has none anyway) and no annotation comments at
  `t()` call sites.

## Steps

### Step 1 — Library + i18n scaffold + interim band update
Install `i18next` + `react-i18next` (current majors, exact-pinned by lockfile).
Create `src/i18n/index.ts` (init: statically imported `resources`, `lng` read from
localStorage key `rydee.lang` with fallback `"en"`, `fallbackLng: "en"`,
`interpolation.escapeValue: false`, `initImmediate: false` for synchronous init,
plus a `setLanguage(lang)` helper that calls `i18n.changeLanguage` and writes
`rydee.lang`). Create `src/i18n/locales/en.json` and `ur.json` (`ur.json` starts
`{}`). Create `src/i18n/i18next.d.ts` typed-key augmentation. Add
`"resolveJsonModule": true` to `tsconfig.json`. Import `@/i18n` in `src/main.tsx`
and in `tests/setup.ts`. Wire ONE pilot string end-to-end so the setup is
verifiable on the dev server (recommend the DashboardLayout "Dashboard" title →
`layout.title.dashboard`).

- Files: `package.json`, `package-lock.json`, `tsconfig.json`, `src/main.tsx`,
  `tests/setup.ts`, `src/i18n/index.ts`, `src/i18n/i18next.d.ts`,
  `src/i18n/locales/en.json`, `src/i18n/locales/ur.json`,
  `src/features/layout/DashboardLayout.tsx`, `tests/regression/bundle-size.test.ts`
- Bundle impact: **+20–22 kB gzip** (i18next core + react binding). This is the
  step where the guard band breaks, so it includes an **interim mechanical band
  update**: build, read the `[bundle-size]` console line from the vitest guard,
  set the constants to measured ±1.5 kB. Report Vite's gzip number and the vitest
  number separately, labelled — they differ by design.
- Review check: pilot string renders; localStorage `rydee.lang` absent → English.

### Step 2 — LanguageSwitcher component + header mounts
Create `src/components/LanguageSwitcher.tsx`: shadcn `Button` toggle labelled with
the other language ("اردو" / "English"), `aria-label` from `common.*`, calls
`setLanguage`. Mount right-aligned in the `DashboardLayout` header, in
`DashboardHeader` next to the sign-out button, and in `AuthShell` (owner to
confirm the AuthShell mount during review — removable in one line).

- Files: `src/components/LanguageSwitcher.tsx`,
  `src/features/layout/DashboardLayout.tsx`,
  `src/features/dashboards/components/DashboardHeader.tsx`,
  `src/features/auth/pages/AuthShell.tsx`, both locale JSONs
- Bundle impact: negligible (<0.5 kB; Button already bundled).
- Review check: toggle flips pilot string to Urdu-fallback-English (no visible
  change yet — expected), persists across reload, does not touch `rydee.session`.

### Step 3 — Extract: layout + common
Sidebar nav labels, `DashboardLayout` `TITLES` map (becomes key lookup →
`t(layout.title.*)`), sidebar-trigger aria-label, sign-out button, shared
generic strings into `common.*`.

- Files: `src/features/layout/AppSidebar.tsx`,
  `src/features/layout/DashboardLayout.tsx`,
  `src/features/dashboards/components/DashboardHeader.tsx`, `en.json`
- Bundle impact: ~+0.2–0.5 kB (keys + JSON overhead; literals move, not grow).

### Step 4 — Extract: auth
LoginPage, RegisterPage, AuthShell: field labels, placeholders, buttons,
headings, and the full validation-message matrix (phone 9–11 digits, age 18–100,
required-field messages, etc.). Validation strings are the highest-risk extraction
— several tests assert them; values must stay verbatim.

- Files: `src/features/auth/pages/LoginPage.tsx`,
  `src/features/auth/pages/RegisterPage.tsx`,
  `src/features/auth/pages/AuthShell.tsx`, `en.json`
- Bundle impact: ~+0.3–0.6 kB.

### Step 5 — Extract: dashboards
Dashboard, RiderDashboard, StatCard labels, clickable-StatCard aria-labels,
loading "—" fallbacks' accompanying labels, profile table row headers.

- Files: `src/features/dashboards/Dashboard.tsx` (contains StatCard),
  `src/features/dashboards/RiderDashboard.tsx`, `en.json`
- Bundle impact: ~+0.2–0.5 kB.

### Step 6 — Extract: riders
AllRiders (status tabs, 7 table headers, search placeholder, pagination labels,
CSV export button label — button label only, CSV content stays English),
ActiveRiders, PendingRiders, BlockedRiders, RiderDetailSheet, RiderProfileCard,
RiderLocationView: headers, empty states, block/approve dialog copy, aria-labels,
sr-only captions.

- Files: `src/features/riders/AllRiders.tsx`, `ActiveRiders.tsx`,
  `PendingRiders.tsx`, `BlockedRiders.tsx`, `RiderDetailSheet.tsx`,
  `RiderProfileCard.tsx`, `RiderLocationView.tsx`, `en.json`
- Bundle impact: ~+0.4–0.8 kB (largest string surface).
- May be split into 6a (tables) / 6b (detail sheet + location) if the live-review
  session runs long; each half is independently gate-green.

### Step 7 — String table delivery for owner translation
Generate `docs/design/i18n-string-table.md`: three columns — key | English
(verbatim from `en.json`) | Urdu (blank) — grouped by top-level key group. The
owner translates and either fills `ur.json` directly or returns the table for a
mechanical paste-in. Rule stated in the doc: untranslated keys are OMITTED from
`ur.json`, never left as empty strings.

- Files: `docs/design/i18n-string-table.md`
- Bundle impact: none (docs only).

### Step 8 — Final measure + D24 band reset + docs close-out
ONE mechanical band step per owner directive: run the full gate sequence, read
the measured gzip from the vitest guard's `[bundle-size]` line, set
`BAND_MIN_KB`/`BAND_MAX_KB` in `tests/regression/bundle-size.test.ts` to
**measured ±1.5 kB**. Update the D24 row in the Deferred Work Register and
`docs/PROJECT.md` (new baseline, band, ADR-0005 link, open item for owner Urdu
authoring). Flip ADR-0005 to Accepted on owner sign-off.

- Files: `tests/regression/bundle-size.test.ts`,
  `docs/design/migration-plan.md` (D24 row), `docs/PROJECT.md`,
  `docs/adr/0005-i18n.md` (status)
- Note for later: when the owner pastes Urdu translations into `ur.json`, the
  bundle grows again (~+1–3 kB depending on coverage). That future task repeats
  this same measure-and-reset step — no other action.

## Expected bundle trajectory

| Point | Est. main gzip | Band action |
|---|---|---|
| Today | ~245 kB (band 243.5–246.5) | — |
| After step 1 | ~266–268 kB | interim reset, measured ±1.5 |
| After steps 3–6 | ~267–270 kB | absorbed by band; re-measure only if guard trips |
| After step 8 | final measured | **D24 official reset, measured ±1.5** |
| After owner Urdu authoring | +1–3 kB | repeat step-8 measure/reset |

## Risk register

| # | Risk | Likelihood / Impact | Mitigation |
|---|---|---|---|
| R1 | Bundle band trips mid-migration (steps 3–6 JSON growth exceeds the ±1.5 interim band) | Low / Low | Band update is sanctioned and mechanical; if the guard trips on an intermediate step, re-measure and reset in that step's commit, list it in the report. Never widen speculatively. |
| R2 | Urdu font rendering: Tailwind 4 default stack has no Nastaliq font; Urdu renders in system Naskh-style Arabic glyphs (Segoe UI on Windows). Legible but not traditional; some owners reject Naskh for Urdu. | Medium / Medium | Ship with system fonts first; owner judges on live review. If rejected: add Noto Nastaliq Urdu webfont + `font-family` fallback scoped to `:lang(ur)` — separate task, owner decision (webfont ~100–200 kB asset, not in JS chunk, irrelevant to D24 band). |
| R3 | Urdu glyph clipping: Nastaliq/Naskh glyphs are taller than Latin; fixed-height controls (`h-9` buttons, `h-14` header) and tight `line-height` may clip diacritics/descenders. | Medium / Low | Owner reviews per step on the dev server; fix per-instance with `leading-*` adjustments only where clipping is visible. No global line-height change. |
| R4 | Mixed-direction text in LTR table cells: Urdu labels adjacent to Latin digits/punctuation (phone numbers, CNIC, parentheses) can reorder visually under the bidi algorithm. | Medium / Low | Data values stay Latin/LTR (out of scope) which avoids most cases. Where a mixed string misrenders, add `dir="auto"` on that specific element. No layout mirroring (owner decision). |
| R5 | Test suite coupling: tests resolve strings through i18next once components use `t()`; if `tests/setup.ts` misses the `@/i18n` import or init is async, tests render raw keys and fail en masse. | Low / High | Step 1 imports `@/i18n` in `tests/setup.ts` with `initImmediate: false` (synchronous); pilot string proves the path before mass extraction begins. |
| R6 | Verbatim drift: a string extracted with changed whitespace/punctuation breaks a test assertion — but no new tests and no assertion edits are allowed for wording. | Medium / Medium | Copy strings mechanically from JSX to JSON; run `npm test` per extraction step; any red test means fix `en.json`, never the test. |
| R7 | Typed-key augmentation friction under `--strict` (e.g. `resolveJsonModule` interaction, deep key inference slowing `tsc`) | Low / Low | ADR-0005 pre-authorizes dropping `i18next.d.ts` if it fights the strict gate; runtime unaffected. |
| R8 | H9 violations creeping in via `t()` call-site comments or JSON key annotations | Low / Low | Ground rule stated above; self-review diff before report. |

## Out of scope (restated from ADR-0005)
RTL mirroring · pluralization variants · date/number localisation ·
Eastern-Arabic numerals · data values · CSV content · Urdu webfont (pending R2
outcome) · `document.title` translation.

## Addendum — owner live-review polish (2026-08-04)

After Step 8 close-out landed, the owner ran a live review and dispatched a short chain of polish cycles. These are recorded here so the plan document reflects reality; the full log lives in `docs/PROJECT.md` § Iteration 6 — Live-review polish subsection.

**Summary of what changed vs the plan-as-written:**

- **R2 (Urdu webfont) — verdict PENDING.** System font kept for now. Owner may still request a webfont at a later live review. Tracked as D28 in `docs/design/migration-plan.md`.
- **R3 (glyph clipping) — not reported.** No clipping observed at live review; no per-instance `leading-*` fixes needed to date. If it surfaces later, the plan's per-instance mitigation stands.
- **R4 (mixed-direction text) — handled globally at the CSS level instead of per-element `dir="auto"`.** The plan proposed adding `dir="auto"` on each misrendering element as needed. In practice the owner requested Urdu text to flow right-to-left everywhere while layout (sidebar, tables, columns, flex order) stays LTR (per ADR-0005 no-mirror decision). This was implemented with a single scoped CSS block in `src/styles/theme.css`:
  - `html[lang="ur"] { unicode-bidi: plaintext on text-bearing elements }` — each inline run picks its own direction from content. No `direction: rtl` set anywhere, so flex/grid/table containers do not flip.
  - `html[lang="ur"] { text-align: right on final set h1–h4, p, label, li, td, th, input, textarea, [role=alert], [role=status] }` — anchors headings/labels/paragraphs/table cells/form fields/notice banners to the right edge in Urdu. Deliberately excluded: `button`, `a`, `span` (would break centered button labels, inline anchors, and badges/icons).
  - `<html lang>` attribute synced from `i18next` via a `languageChanged` listener added to `src/i18n/index.ts` (initial sync at module load, before React mounts, so first paint is correct).
- **Switcher visibility (not a plan risk, owner-directed at live review).** `LanguageSwitcher` variant changed from `secondary` to `outline` with a brand-tinted border (`border-primary/40`) so the button is clearly delineated on all 3 mounts (sidebar header, dashboard header, auth shell).

**Files touched in the polish batch (CSS + one listener only — no locale value edits):**
`src/i18n/index.ts`, `src/styles/theme.css`, `src/components/LanguageSwitcher.tsx`.

**No new tests. No locale changes. All 7 gates green after each polish cycle** — numbers logged in `docs/PROJECT.md` Iteration 6 § Gate results after polish batch.

The plan's Out-of-scope list stays valid: no RTL mirroring, no pluralization, no date/number localisation, no Eastern-Arabic numerals, no data-value translation, no CSV content, no Urdu webfont yet (R2 pending), no `document.title` translation.
