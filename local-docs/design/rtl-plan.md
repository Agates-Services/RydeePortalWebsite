# RTL Plan — Full Bidirectional Support for Urdu Mode

Status: **Implemented 2026-08-05** (gate-verified; QA waived this phase)
Owner decision: 2026-08-05 — supersedes the Iteration-6 "no RTL mirroring" verdict.
Scope: enable `dir="rtl"` end-to-end when `html[lang="ur"]`, replace physical
Tailwind classes with logical equivalents in app code and (with per-file
owner sign-off) in the 19 kept `src/components/ui/**` files, and reconcile
`src/styles/theme.css` so the existing Urdu block does not double-apply.

Baseline gate metrics (from `ai-session-instructions.md`): 115 tests
passing; bundle gzip band 243.5–246.5 kB.

## 1. AUDIT

### 1a. App-code physical classes (counts by file)

Includes `src/features/**` and `src/components/{DatePickerField,LanguageSwitcher,shared}.tsx`.
Excludes `src/components/ui/**` (covered in 1b). Match: `pl-N pr-N ml-N mr-N -ml-N -mr-N left-N right-N -left-N -right-N text-left text-right rounded-l|r rounded-l|r-* border-l|r border-l|r-* space-x-* origin-left|right justify-start|end`.

| File | Physical hits | Notes |
| --- | --- | --- |
| `src/features/riders/PendingRiders.tsx` | 15 | search icon `left-3` + `pl-9`; header `text-left`; column paddings `pl-6 pr-4` / `pl-4 pr-6`; row-end cell `text-right`; toast `bottom-6 right-6`; StatCard `align="right" → ml-auto` |
| `src/features/riders/BlockedRiders.tsx` | 15 | same shape as PendingRiders |
| `src/features/riders/AllRiders.tsx` | 14 | search icon `left-3` + `pl-9`; badge `ml-2`; two column padding sets; sortable header helper `pl-6 pr-4` (l.617) |
| `src/features/dashboards/Dashboard.tsx` | 7 | StatCard base `text-left` (l.55, l.78); 5× `<th className="text-left">` (l.254, 257, 260, 263, 271) |
| `src/features/auth/pages/RegisterPage.tsx` | 5 | select `pr-10` (chevron), password inputs `pr-12`, three eye buttons `right-2 top-1/2 -translate-y-1/2`, subhead `ml-8` (visual indent) |
| `src/components/shared.tsx` | 3 | AuthShell decorative gradient blobs `left-1/2 -translate-x-1/2` (l.18), `right-0` (l.26); `pr-12` on IconInput when children present (l.130) |
| `src/components/DatePickerField.tsx` | 2 | trigger `justify-start text-left`, icon `mr-2` |
| `src/features/riders/RiderDetailSheet.tsx` | 1 | `<ul class="list-disc pl-5">` for issue list (l.111) |
| `src/features/auth/pages/LoginPage.tsx` | 1 | password eye toggle `right-2 top-1/2 -translate-y-1/2` (l.138) |
| `src/features/auth/pages/AuthShell.tsx` | 1 | `LanguageSwitcher` positioned `top-4 right-4 z-20` (l.14) |
| `src/features/riders/RiderProfileCard.tsx` | 1 | verified badge `ml-auto` (l.185) |
| `src/features/riders/ActiveRiders.tsx` | 1 | ActiveRider badge `ml-auto` (l.83) |
| `src/features/layout/DashboardLayout.tsx` | 1 | `LanguageSwitcher className="ml-auto"` (l.35) |
| `src/features/layout/AppSidebar.tsx` | 1 | `ChevronsUpDown className="ml-auto"` (l.152) |

Total app-code sites: ~68 across 14 files.

Conversion map (Tailwind v4 supports these logical utilities natively):
- `pl-N` → `ps-N`, `pr-N` → `pe-N`
- `ml-N` → `ms-N`, `mr-N` → `me-N`
- `-ml-N` → `-ms-N`, `-mr-N` → `-me-N`
- `left-N` → `start-N`, `right-N` → `end-N` (+ negatives)
- `text-left` → `text-start`, `text-right` → `text-end`
- `rounded-l-*` → `rounded-s-*`, `rounded-r-*` → `rounded-e-*`
- `border-l` / `border-l-*` → `border-s` / `border-s-*` (same for `-r`→`-e`)
- `space-x-N` → `space-x-N space-x-reverse` when a mirror is wanted, OR
  replace with `gap-N` on a flex container (preferred — no reverse needed)
- `justify-start`/`justify-end` — semantic when the row itself flips with
  the writing mode; safe to keep AS LONG AS the parent is `flex` (not
  a grid with an explicit column order); audit case-by-case
- `origin-left` / `origin-right` — no logical variant in Tailwind; keep or
  swap in RTL-scoped block if needed (none in app code, only ui/)

Do NOT convert:
- Icon transforms like `-translate-x-1/2` when they center a decorative
  element on the horizontal axis regardless of writing mode (shared.tsx
  gradient blobs). These are visually centered, not directional.
- `top-*` / `bottom-*` — vertical axis, unaffected.

### 1b. `src/components/ui/**` audit (19 kept files)

Files with physical direction classes (need edits, H4 sign-off required):

| File | Hits | What actually breaks in RTL | Verdict |
| --- | --- | --- | --- |
| `sidebar.tsx` | 17 | Hard-coded `left-0` / `right-0` per `side` prop, `-right-4` / `left-0` for the rail, menu-badge/menu-action `right-1`/`right-3`, `text-left` on menu button, `pr-8` on menu items with action, `border-l` on sub-menu, `-translate-x-px`, `ml-0` on inset variant. **Because `side` is an explicit prop passed by `AppSidebar` (defaults to `"left"`), Radix DirectionProvider alone will not move the sidebar to the RTL edge — either (a) flip `AppSidebar` to `side="right"` when Urdu, or (b) convert these to logical utilities. Recommendation: option (b) + one prop flip.** | EDIT (major) |
| `dropdown-menu.tsx` | 13 | `pl-8` for inset items, `absolute left-2` for checkbox/radio indicators, `ml-auto` on shortcut + submenu-chevron, `pr-2 pl-8`. Radix menu already reads DirectionProvider for keyboard nav; visuals still need logical classes. Also `data-[side=left]:slide-in-from-right-2` etc — these are **positional** side (screen side), NOT writing direction — leave as-is. | EDIT (medium) |
| `calendar.tsx` | 9 | `absolute left-1` / `absolute right-1` for prev/next nav buttons, `space-x-1` on the week `<tr>`, `[&:has(...)].day-range-end:rounded-r-md` etc, `ml-1` on dropdown icon. `react-day-picker@8.10.1` does NOT ship first-class RTL support (dir prop was added in v9). Options: (i) accept mirrored nav arrows (visually correct — "next" points to end); (ii) upgrade to rdp v9 (out of scope, new ADR); (iii) manual class flip. Recommendation: (i) + logical classes. | EDIT (medium) |
| `sheet.tsx` | 5 | `data-[state=closed]:slide-out-to-right` / `right-0` / `border-l` for `side="right"`; mirror block for `side="left"`; close button `top-4 right-4`. Sheet `side` prop is a screen side, not writing direction — for `RiderDetailSheet` (side="right"), owner should decide: keep on screen-right always (current behaviour), or flip to screen-left in Urdu so it opens from the "start" edge. Recommendation: flip via `side={isUrdu ? "left" : "right"}` at the call site + convert close-button `right-4`→`end-4`. | EDIT (small) |
| `select.tsx` | 5 | `pr-8 pl-2` on items, `absolute right-2` on the ItemIndicator (checkmark), `data-[side=left]:-translate-x-1` etc (positional — leave). Radix Select reads DirectionProvider for keyboard nav. | EDIT (small) |
| `tooltip.tsx` | 2 | Only `data-[side=left]:slide-in-from-right-2` (positional, leave). No direction-sensitive class actually. | NO EDIT NEEDED |
| `popover.tsx` | 2 | Same as tooltip — only positional `data-[side=…]:slide-*`. | NO EDIT NEEDED |
| `alert-dialog.tsx` | 1 | `sm:text-left` on header, `sm:justify-end` on footer. Both are semantic-ish; convert to `sm:text-start` / `sm:justify-end` stays (flex-end still means end). | EDIT (trivial) |

Files with ZERO physical direction classes (direction-safe as written):
`avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`,
`input.tsx`, `label.tsx`, `separator.tsx`, `skeleton.tsx`,
`use-mobile.ts`, `utils.ts`. NO EDIT.

**H4 sign-off list (7 files):** `sidebar.tsx`, `dropdown-menu.tsx`,
`calendar.tsx`, `sheet.tsx`, `select.tsx`, `alert-dialog.tsx`, plus a
one-line `dir` prop wire-through in `sidebar.tsx` if we adopt option (a).

### 1c. Radix DirectionProvider

`@radix-ui/react-direction` is present transitively via
`@radix-ui/react-select`, `@radix-ui/react-dropdown-menu`,
`@radix-ui/react-menu`, `@radix-ui/react-roving-focus` — **no new install
needed**. Import path `@radix-ui/react-direction` works from `node_modules`.

Primitives currently in use that consume `DirectionProvider`:
- `@radix-ui/react-select` (arrow keys, PageUp/PageDown swap in RTL)
- `@radix-ui/react-dropdown-menu` / `react-menu` (submenu open direction,
  arrow-key traversal)
- `@radix-ui/react-tooltip`, `react-popover` (side="start"/"end" resolution)
- `@radix-ui/react-alert-dialog`, `react-dialog` (focus-trap direction)

Mount point: wrap `<RouterProvider>` in `src/main.tsx` with
`<DirectionProvider dir={isUrdu ? "rtl" : "ltr"}>`. This must be reactive
to language changes, so it needs to be inside a small React component that
subscribes to `useTranslation()` (or reads `i18n.dir()`). Concrete shape:

```tsx
// src/main.tsx (planning sketch)
function AppShell() {
  const { i18n } = useTranslation();
  const dir = i18n.language === "ur" ? "rtl" : "ltr";
  return (
    <DirectionProvider dir={dir}>
      <RouterProvider router={router} />
    </DirectionProvider>
  );
}
```

Additionally, `src/i18n/index.ts` `syncHtmlLang` must also set
`document.documentElement.dir` to `"rtl"` / `"ltr"` so Tailwind logical
utilities (which key off `[dir="rtl"]` at the CSS level) resolve correctly.

### 1d. `src/styles/theme.css` reconciliation (lines refer to current file)

| Rule | Current effect | Under `[dir="rtl"]` | Action |
| --- | --- | --- | --- |
| L210–212 `html[lang="ur"] body { font-family: Noto Nastaliq… }` | Font override | Still needed | KEEP |
| L214–231 `unicode-bidi: plaintext` on all text elements | Fixes mixed EN/UR runs | Still needed under RTL (browsers do not solve mixed-digit runs for free) | KEEP |
| L233–248 `text-align: right` on 15 selectors | Forces right-align on many elements | REDUNDANT — `dir="rtl"` handles this natively; keeping causes issues on nested LTR sub-trees (e.g. Leaflet map) | REMOVE |
| L250–252 `html[lang="ur"] label { justify-content: flex-end }` | Right-aligns flex labels | REDUNDANT under RTL (flex-start = right automatically) | REMOVE |
| L254–273 `line-height: 2 !important` for Urdu text | Nastaliq legibility | Still needed | KEEP |
| L275–282 `[data-fqa-field-label]` / `[data-fqa-field-value]` sizing | Rider profile visuals | Still needed | KEEP |
| L284–286 `[dir="rtl"] table[data-fqa-profile-kv] td { unicode-bidi: plaintext }` | Already scoped to `[dir=rtl]` | Now applies globally in Urdu (currently only fires inside RiderDashboard which sets `dir=rtl`); safe | KEEP |
| L288–293 heading line-heights 1.8 | Nastaliq legibility | Still needed | KEEP |
| L295–318 `.h-N { height: auto }` height overrides | Prevents Nastaliq clipping | Still needed | KEEP |
| L320–354 sidebar/tabs `overflow: visible` | Prevents label clipping | Still needed (Nastaliq ascenders/descenders) | KEEP |
| L419 `.select-field { background-position: right 14px center }` | Chevron on the right | UNDER RTL should be LEFT — swap to `left 14px center` inside a `[dir="rtl"] .select-field` block; also swap `padding-right` → `padding-left` (or use logical `padding-inline-end`) | EDIT |

**RiderDashboard `dir="rtl"` exception (l.48):** REMOVE. Once `html` has
`dir="rtl"` globally, this becomes redundant and would double-flip nothing
(dir doesn'"'"'t stack destructively), but keeping stale code is confusing.
The paired `[dir="rtl"] table[data-fqa-profile-kv]` rule in theme.css
(L284) remains valid because `[dir="rtl"]` now matches on `<html>`.

### 1e. Known trouble spots (call out before edits)

1. **Search inputs with `left-3` icon + `pl-9` input** — `AllRiders.tsx`
   l.362/371, `PendingRiders.tsx` l.290/299, `BlockedRiders.tsx` l.301/310.
   Convert to `start-3` + `ps-9 pe-3`. Icon flips to the visual right in
   Urdu automatically. Verified idiomatic Tailwind v4 pattern.
2. **LoginPage password eye toggle** — `right-2 top-1/2 -translate-y-1/2`
   + input `pr-12`. Convert to `end-2` + `pe-12`. Same for `RegisterPage`
   three eye buttons (password, confirm password) and select chevron `pr-10`.
3. **DashboardHeader** — no physical classes detected; safe.
4. **AppSidebar / ui sidebar.tsx** — sidebar defaults `side="left"`. Under
   RTL the writing-mode edge is the right side. Options presented in 1b;
   the plan proposes converting `sidebar.tsx` internals to logical utilities
   AND passing `side={isUrdu ? "right" : "left"}` from `DashboardLayout` or
   `AppSidebar` so the whole panel physically flips. Owner confirmation
   needed on the second half (visible UX flip).
5. **RiderDetailSheet slide side** — currently `side="right"`. Options
   (owner picks): (a) always right; (b) flip to `side="left"` in Urdu so
   it slides from the writing-start edge. Recommendation: (b) — matches
   RTL expectations. Requires close-button logical class fix in sheet.tsx.
6. **StatCard** (`Dashboard.tsx` StatCard, `PendingRiders` l.552,
   `BlockedRiders` l.560) — `align="right" → ml-auto`. Under RTL,
   `ml-auto` still pushes to the physical left, opposite of intent.
   Convert to `ms-auto` / `me-auto` semantic ("push to end"). Since
   `align="right"` means "put this on the trailing edge", it becomes
   `ms-auto` (margin-inline-start: auto pushes to end).
7. **Badges** (ActiveRiders l.83, RiderProfileCard l.185, AllRiders l.348) —
   `ml-auto` / `ml-2`. All want end-aligned or after-text spacing —
   convert to `ms-auto` / `ms-2` respectively.
8. **Leaflet map controls** — react-leaflet renders its own DOM inside
   `<MapContainer>`. Leaflet zoom controls and attribution have their own
   left/right positioning via Leaflet CSS. **Recommendation: keep maps
   LTR.** Add a `<div dir="ltr">` wrapper around `MapContainer` in
   `ActiveRiders.tsx` (l.98) and `RiderDashboard.tsx` (l.175). Cartography
   is not localised; flipping controls would surprise users and break
   Leaflet CSS assumptions.
9. **Toasts / success banners** — PendingRiders l.518, BlockedRiders l.526:
   `fixed bottom-6 right-6`. Convert to `end-6 bottom-6` so the toast
   sits on the writing-end edge (right in LTR, left in RTL).
10. **DatePickerField** — trigger `justify-start text-left` + icon `mr-2`.
    Convert to `justify-start text-start me-2`. rdp v8 does not natively
    flip its own arrows; see 1b calendar row.
11. **`.select-field` component** (used by native `<select>` in
    RegisterPage) — inline background-image chevron pinned to
    `right 14px center` with `padding-right: 2.5rem`. Needs a mirror rule
    under `[dir="rtl"]` (see 1d).
12. **AuthShell decorative blobs** — `left-1/2 -translate-x-1/2` and
    `right-0`. Purely decorative; keep as-is (visual composition not
    tied to writing direction).
13. **RegisterPage subhead `ml-8`** (l.447) — visual indent under logo;
    convert to `ms-8` so it indents from the start edge.

### 1f. User-visible flips owner must confirm

1. **Table column order mirrors** — reverses the Iteration-6 live-review
   verdict. In Urdu, the "Name" column will appear on the visual right,
   "Actions" on the visual left. Applies to `AllRiders`, `PendingRiders`,
   `BlockedRiders`, and the Dashboard recent-registrations table.
2. **Sidebar moves to the right edge** — `AppSidebar` currently docks
   left; in Urdu it will dock right (writing-start edge). Rail, offcanvas
   drawer, and inset variant all follow.
3. **RiderDetailSheet slides in from the LEFT** in Urdu (opposite of
   today'"'"'s right slide). Recommendation but owner confirms.
4. **Search icons swap to the visual right** of the search input.
5. **Password eye toggles swap to the visual left** of the password input.
6. **Native select chevrons swap to the visual left**.
7. **Toast success banner moves to the bottom-left** in Urdu.
8. **Rider profile card badges (verified pill) sit on the visual left**.
9. **Calendar prev/next arrows visually swap** (rdp v8 arrow icons remain
   `<` and `>` glyphs — content does not auto-mirror; owner may want a
   follow-up to swap the glyphs too).
10. **Maps stay LTR** — Leaflet zoom controls remain top-left, attribution
    bottom-right (unchanged). Recommended.

### 1g. Test impact (baseline 115 passing)

Scanned `tests/regression/**` and `tests/unit/**` for direction-sensitive
assertions.

- **NO existing assertion depends on physical `pl-*`/`pr-*`/`text-left`
  classes, `left/right` positioning, or `dir` attributes.** The only `dir=`
  matches are URL-param `dir=asc` sort strings in
  `tests/regression/all-riders.test.tsx` (l.356, l.405) — unrelated.
- Column ordering is not asserted by position; tests use
  `getByRole("columnheader", { name: /name/i })` (l.255, l.362), which
  survives mirroring.
- `MSW` handlers, session, contract, csv, mapper, guards, roles, login,
  register, iter4-additive, foundation, api-client tests all pass through
  visual DOM in a way that is direction-agnostic.

**Expected forced assertion updates: 0.** Per the testing rule, no new
tests will be written. If the gate run after any step reveals a failing
test, it will be diagnosed and reported before any assertion is touched.

## 2. IMPLEMENTATION PLAN

Each step is one owner-reviewable slice: apply, run gates, hand to owner
for live review on the dev server, apply amendments, then commit.

### Step 1 — `dir` sync + DirectionProvider mount

Files touched:
- `src/i18n/index.ts` — extend `syncHtmlLang` to also set
  `document.documentElement.dir = lang === "ur" ? "rtl" : "ltr"`.
- `src/main.tsx` — wrap `<RouterProvider>` in an `AppShell` that renders
  `<DirectionProvider>` with `dir` derived from `useTranslation()`.

No visual class changes yet — the app will suddenly render `dir="rtl"` on
`<html>` when switching to Urdu, so text-align defaults flip. Some layout
will look wrong until Step 3; that is expected and part of the review.

Rollback: revert both files. `theme.css` unchanged so app still renders.

### Step 2 — `theme.css` reconciliation

Files touched: `src/styles/theme.css`.

- Remove the L233–248 `text-align: right` block (redundant under `dir=rtl`).
- Remove the L250–252 `justify-content: flex-end` label rule.
- Add a `[dir="rtl"] .select-field { background-position: left 14px center;
  padding-right: 1rem; padding-left: 2.5rem; }` rule (or switch base
  `.select-field` to logical `padding-inline-*` and mirror background via
  a dir-scoped block).
- Keep font-family, `unicode-bidi: plaintext`, line-height, height
  overrides, overflow overrides.
- Remove `dir={isUrdu ? "rtl" : undefined}` from
  `src/features/dashboards/RiderDashboard.tsx` l.48 (redundant now that
  `<html dir>` is set globally). The `[dir="rtl"]` selector at L284 keeps
  working because it now matches on `<html>`.

Rollback: `git checkout src/styles/theme.css src/features/dashboards/RiderDashboard.tsx`.

### Step 3 — App-code logical class sweep (grouped by feature area)

Sub-steps (each is one commit-sized slice for owner review):

- 3a — `src/features/riders/*.tsx` (5 files): PendingRiders, BlockedRiders,
  AllRiders, ActiveRiders, RiderProfileCard, RiderDetailSheet.
- 3b — `src/features/dashboards/*.tsx` (2 files): Dashboard.tsx,
  RiderDashboard.tsx (Leaflet LTR wrapper added here).
- 3c — `src/features/auth/pages/*.tsx` (3 files): LoginPage,
  RegisterPage, AuthShell.
- 3d — `src/features/layout/*.tsx` and `src/components/*.tsx` (non-ui):
  DashboardLayout, AppSidebar (call site — decide `side` prop), shared,
  DatePickerField, LanguageSwitcher.

Conversion is mechanical (see 1a map). Every changed line receives a
one-line commit-preview note. Nothing else changes.

Rollback per sub-step: file-scoped `git checkout`.

### Step 4 — `src/components/ui/**` edits (H4 sign-off list)

Owner reviews and signs off each of the 7 files independently before
edits. Order proposed (smallest blast radius first):
- 4a — `alert-dialog.tsx` (1 hit)
- 4b — `select.tsx` (5 hits — visible checkmark alignment)
- 4c — `sheet.tsx` (5 hits + call-site `side` flip in RiderDetailSheet)
- 4d — `dropdown-menu.tsx` (13 hits)
- 4e — `calendar.tsx` (9 hits — verify with DatePickerField live)
- 4f — `sidebar.tsx` (17 hits + optional `side="right"` in Urdu)

Rollback: per-file `git checkout src/components/ui/<file>.tsx`. Because
these are shadcn-generated, the CLI can re-scaffold if needed, but the
edits here are additive/replacement of hard-coded direction classes and
should re-apply cleanly on any future regen.

### Step 5 — Trouble-spot fixes (issues surfaced during live review)

Placeholder for amendments the owner spots on the dev server: mixed-digit
runs, sidebar-collapse edge cases, calendar arrow glyph swap request,
Leaflet control positioning, etc. Each amendment is its own micro-commit.

### Step 6 — Gates + report

Run: `npm run lint`, `npm run typecheck`, `npm run typecheck:strict`,
`npm run build`, `npm test`, `rg msw dist/assets/*.js` (expect 0),
Vite gzip vs zlib bundle band both labelled.

Report: files changed per step, behaviour diffs (see 1f list), zero test
updates expected. Propose the one-line commit message per step.

## 3. DEPENDENCIES

- **No new npm install required.** `@radix-ui/react-direction` is already
  in `node_modules/` transitively (via `@radix-ui/react-select`,
  `@radix-ui/react-dropdown-menu`, `@radix-ui/react-menu`,
  `@radix-ui/react-roving-focus`). Import as
  `import { DirectionProvider } from "@radix-ui/react-direction"`.
- Tailwind v4 (`@tailwindcss/vite` 4.1.12 per `package.json`) supports
  logical utilities (`ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`,
  `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`, `border-s`,
  `border-e`) out of the box — no plugin needed.
- `react-day-picker@8.10.1` does NOT ship a `dir` prop; RTL support
  landed in v9. Out of scope for this task. Owner may open a follow-up
  ADR to upgrade if the mirrored-arrow behaviour is unsatisfactory.

## Open questions for owner

1. Confirm sidebar physically moves to the right edge in Urdu (Step 4f
   side-prop flip). Alternative: keep sidebar on the visual left in both
   languages and only re-map internals.
2. Confirm `RiderDetailSheet` slides from the LEFT in Urdu (Step 4c
   call-site flip). Alternative: keep right-slide in both languages.
3. Confirm maps stay LTR (recommendation) — accept if silent.
4. Calendar arrow glyphs: mirror the visual arrow direction too, or leave
   `<` / `>` as-is? (Follow-up ticket either way.)
5. Table-column mirroring in Urdu — this reverses the Iteration-6
   verdict. Confirm the reversal stands.
