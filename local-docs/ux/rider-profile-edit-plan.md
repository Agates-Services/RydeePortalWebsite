# Rider Profile Edit — Working Plan

> **Status:** FINAL (rev 9) · **Owner:** Danial Khan · **Date:** 2026-08-07
> **Author:** UX-RiderProfile (sub-agent) · **Scope:** design + interview plan only, no code.
> Backend edit endpoint (`POST /update-user`) is frozen per H1 / ADR-0003. This doc respects that.
>
> ⚠️ **MOCK-FIRST WARNING (Avatar + Verification Documents):** backend has ZERO endpoints for rider documents (verified against `docs/design/API-Document.pdf`). §3.6 (Avatar — now DERIVED from the `profile_photo` document per rev 8), §3.7 (Verification checklist — view/download/replace/delete), §3.8 (Per-row upload) are designed against a **proposed contract in §8** that is NOT frozen. Without backend implementation, these render only their empty/unavailable state on the live site — same failure mode as the S-05 / D32 `/get-active-riders` incident. Do not ship without a backend commitment date. **Rev 8:** the standalone photo endpoint is DROPPED — avatar reads from the unified typed-document endpoint.
> **Rev 2 changelog:** +avatar (§3.6), +documents view/download (§3.7), +documents upload (§3.8), +proposed backend contract (§9), +4 new states, +4 new risks, Q3 marked ANSWERED (option d).
>
> **Rev 5 changelog (2026-08-07):** Owner feedback on Stage 1 live page — merge Rider Details + Editable Details into ONE unified card with inline-feel display (read-only fields shown as static text, editable fields shown as always-active inputs; single diff-only Save). §3.1 (desktop wireframe) and §3.2 (mobile) rewritten. Sticky action bar cosmetics fixed: rounded-xl, proper horizontal padding, gap between buttons. Two-card layout in prior revisions is **SUPERSEDED** — do not restore. Everything else (§3.3 controls, §3.4 states, §3.6–§3.10 sections, §5 a11y, §8 backend contracts) is unchanged and still applies inside the unified card structure.
>
> **Rev 6 changelog (2026-08-07):** Owner amended after seeing built page — (1) Full name is now EDITABLE. Final editable set: `name`, `area`, `address`, `cnic`, `dob`; read-only: `phone`, `role`, `joined`. §1 Q1, §3.1 grid, §3.3 controls table updated (name = required text `Input`). (2) Phone immutability affordance changed from always-visible inline hint to a compact **Info-icon Tooltip** (keyboard-focusable trigger — a11y note in §3.1). (3) §8 backend-confirmation flag extended: `/update-user` assumed to accept `name` alongside `cnic`, `dob`, `activationStatus`.
>
> **Rev 7 changelog (2026-08-07):** Owner feedback on built rev-6 page — (1) Fields must be **interleaved in one meaningful sequence**, not grouped editable-vs-locked. Final order (top-to-bottom, left-to-right in the 2-col grid): **Full name → Phone → CNIC → Date of birth → Area → Address → Role → Joined**. §3.1 wireframe redrawn; §3.2 mobile stacking order updated to match. (2) **All fields share the same visual style.** Locked fields render as `<Input readOnly>` (not `disabled`, not static `<p>`) at full contrast — same border, same text token, same font size as editable inputs. **No muted or transparent value text.** The 12 px `Lock` icon next to the label is the sole locked indicator; phone additionally keeps the Info-icon Tooltip. Read-only anatomy note in §3.1 rewritten accordingly.
>
> **Rev 8 changelog (2026-08-07 — rev-8 amendment mid-flight: PNG re-allowed):** Owner feedback on built Stage-2 documents section — uploads must be **TYPED**. Final allowlist AFTER mid-flight amendment: PDF+JPG+PNG for the five document rows, JPG+PNG for `profile_photo` (PDF excluded). §3.7.1, §3.8.2, §8.3 allowlist lines reflect this. Freeform-named uploads (Stage-2 dropzone) are **SUPERSEDED**. Replaced with a **checklist-driven** documents card matching the owner's reference screenshot. Five fixed document types (stable enum keys — `cnic_copy`, `profile_photo`, `bike_registration`, `driving_license`, `utility_bill`; i18n display names EN/UR). §3.7 rewritten as a five-row checklist (Received badge + actions when present, Upload affordance per missing row). §3.8 rewritten as **per-row uploader** (no whole-card dropzone; type is intrinsic to the row, so freeform naming is impossible). §3.4 states extended (per-row upload/received/missing, one-doc-per-type replace flow). §8.2/§8.3 amended: `document` gains required `type: DocumentType` field; `/get-rider-documents` returns typed documents; upload multipart adds `type` — flagged as **backend contract change from rev 2**. Avatar (§3.6) and `profile_photo` document remain **SEPARATE concerns** (rationale below). One-document-per-type rule: **delete-then-upload** (explicit) — no silent replace.
>
> **Rev 9 changelog (2026-08-07 — FINAL):** Owner feedback on the built rev-8 checklist — the six-row per-type checklist made the page too long/scrollable. §3.7 and §3.8 rewritten around six concrete changes: (1) **Compact list** — replaces the per-row checklist. Documents render as single-line entries in a two-column grid on desktop (`md:grid-cols-2`), single column on mobile: display name + status chip (`Received` success / `Missing` muted outline) + icon-only actions (View, Download, Delete) on the Received side only. Missing entries carry the chip alone. No per-row upload buttons. Target: whole card ≈ half its rev-8 height. (2) **Single upload control (dropzone + picker)** — one row below the list: `Select` (5 fixed types — `cnic_front`, `cnic_back`, `bike_registration`, `driving_license`, `utility_bill` — plus `Other`) + conditional `Input` for a custom name when `Other` is chosen (required, trimmed, 1–40 chars, must not duplicate an existing Other's name — case-insensitive) + a **dropzone that accepts BOTH drag-drop AND click / Enter / Space to open the native file picker** (owner amendment mid-rev-9: DnD survives on the single control, but is deleted from per-row surfaces). Selecting a fixed type that is already Received triggers the rev-8 REPLACE `AlertDialog` on file selection. (3) **File-before-type ordering** — if the user drops a file before picking a type, the dropzone stays **disabled and hinted** (`"Select a document type first"`), the drop event is swallowed with `preventDefault`, no upload starts, and focus programmatically moves to the `Select` trigger so the next keystroke opens the type list. Chosen over auto-uploading-then-guessing because it makes the required ordering visible and matches the disabled affordance a keyboard user already sees. (4) **`Other` category (new)** — free-text `name` on Others only; multiple distinct Others allowed, keyed by `name.trim().toLowerCase()`; re-uploading an Other with an existing normalized name is treated as REPLACE (same AlertDialog). Others render in the compact list under their custom names, in insertion order, after the five fixed entries. (5) **`profile_photo` EXCLUDED from the dropdown** — the avatar camera icon (§3.6, unchanged from rev 8) remains the only DP entry point. Preserves the rev-8 avatar↔`profile_photo` unification and keeps the DP off the verification-documents list surface. Per-row `[⟳ Replace]` icon buttons (rev 8) are DELETED — replacement flows exclusively through the upload control. (6) **Contract (§8.2 / §8.3)** — `type` enum gains `"other"`; document object gains optional `name?: string` (required for `type="other"`, echoed back on GET); upload multipart accepts optional `name` field, consumed only when `type="other"`. `profile_photo` still writes via `/upload-rider-document` — just not through the dropdown. (7) **§3.4 states trimmed** — per-row progress rows deleted; single progress row appears under the upload control (replacing the Select/Input/Dropzone trio while an upload is in flight). Too-large / unsupported / failed / retry states retained. Wrong-drop-target replaced with **type-not-selected** hint on the dropzone. Marks **FINAL** — no further owner-blocking changes expected.
>
> **Rev 10 changelog (2026-08-07):** Owner feedback on built rev-9 page — on wide screens (≥ xl / 1280 px) the edit page adopts a **two-column layout** so the user does not need to scroll: LEFT column stacks the unified details card, Status, and PIN; RIGHT column holds the Documents card. Header (avatar + name + badge), banners, and the sticky action bar remain full-width above / below the grid. Below xl the layout is pixel-identical to rev 9. **DOM order unchanged** (details → status → PIN → documents → save bar) for keyboard/SR users; columns are achieved purely with CSS grid + logical properties (auto-mirrors under RTL). **Amendment (2026-08-07):** on ≥ md (≥ 768 px) the Save + Cancel actions render inside the header row after the (now slightly larger) status pill — order: pill → Cancel → Save — and the sticky bottom action bar is hidden; below md the sticky bottom bar remains exactly as rev 9. Header buttons are outside the form and use `form="fqa-rider-edit-form"` to submit; `data-testid="fqa-edit-save"` stays on the sticky-bar instance to keep a single testid in the DOM. Status pill enlarged (text-sm, px-3 py-1) at all sizes.

---

## 0. Context Snapshot (verified from repo)

- **Entry surface today:** `src/features/riders/AllRiders.tsx` (Total Riders page) — table renders `AllRidersRow` (`id, name, phone, cnic, status, area, joinedAt, dob?, documents?, pin?`). Row click opens `RiderDetailSheet` (`src/features/riders/RiderDetailSheet.tsx`) — a right-side Radix Sheet (left in Urdu) with a read-only `<dl>`.
- **Identifier:** rows are keyed by `id` (a synthesised index — see `mapper.ts` note in ADR-0003), but the wire identity is **`phone` + `role`** per `POST /update-user`. `phone` is the only stable, backend-recognised identifier.
- **UI kit surviving in `src/components/ui/`:** `alert-dialog, avatar, badge, button, calendar, card, checkbox, dropdown-menu, input, label, popover, select, separator, sheet, sidebar, skeleton, tooltip` (17 primitives + `use-mobile`, `utils`).
- **Missing primitives** (would need shadcn add, H4-scoped): form, textarea, sonner (toast), progress (upload bars). Ship without — see §7 cost line.
- **Confirmed present for rev-2 scope:** avatar (Radix Avatar w/ image + initials fallback — exactly what §3.6 needs, zero add cost).
- **Detail sheet subtitle to remove:** `t("riders.detailSheet.description")` = "Read-only view of the rider's full record." — will be deleted from `RiderDetailSheet.tsx` + both locale files.
- **i18n:** every string doubles into `en.json` + `ur.json` under new namespace `riders.edit.*`; full RTL already handled via `<html dir>` sync (Iteration 7). Layout uses logical Tailwind classes (`ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`) — **no `left/right` physicals**.

---

## 1. Interview — 10 Sharp Questions for the Owner

Answers materially change the design. Q1–Q3 are blocking (page cannot be built without them).

| # | Question | Owner answer (rev 3) |
|---|----------|----------------------|
| **Q1** ✅ (amended rev 6) | Editable field set | Amended rev 6 — full name is now editable. Final split — **Editable: `name`, `area`, `address`, `cnic`, `dob`** (plus status per Q5, PIN action per Q4). **Read-only: `phone`, `role`, `joinedAt`, `status`** (status changed via dedicated control, not the form). |
| **Q2** ✅ | Phone immutability | Confirmed — `phone` is read-only; identifier for backend. Tooltip explains. |
| **Q3** ✅ | Documents scope | Option (d): full section with view + download + upload. See §3.7/§3.8. MOCK-FIRST via §8 proposed contract. |
| **Q4** ✅ | PIN reset from this page | **YES.** Dedicated "Reset PIN" action card with confirm AlertDialog. Auto-generated 6-digit PIN (simpler than typed — no validation UI, no confirm-field, no leaking new PIN through form state). New endpoint proposed §8.8. MOCK-FIRST. See §3.10. |
| **Q5** ✅ | Status change from this page | **YES.** Dedicated "Status" card with action buttons (not a Select) — buttons make the destructive transitions read as intentional actions and let us disable individually (e.g. "Block" hidden if already blocked). Confirm AlertDialog required for `blocked` and `offboarded`. Existing wiring inspected: `activateRider(phone, pin)` exists in `src/api/riders.ts`; block/unblock in `BlockedRiders.tsx` is **local-state-only** (no backend call). **No arbitrary status endpoint exists** — spec assumes `POST /update-user { phone, role, activationStatus }` per §8.7; flagged as contract assumption for backend confirmation. See §3.9. |
| **Q6** ✅ | Operator vs Admin | Identical page, identical fields, identical permissions. Guard: `allow=["Admin", "Operator"]`. |
| **Q7** ✅ | Full page vs sheet-edit | Full page confirmed. Route `/admin/riders/:phone/edit`. |
| **Q8** ✅ | Save semantics | Inline success banner, stay on page, dirty state cleared. No toast primitive needed. |
| **Q9** ✅ | Diff-only | Yes, diff-only POST. Save disabled until dirty. Empty diff → no API call. |
| **Q10** ✅ | Delete / offboard | No delete. Offboard is available as a status transition (§3.9). No separate destructive zone. |

---

## 2. Route + Entry Points

### 2.1 Route

- **Path:** `/admin/riders/:phone/edit`
- **Guard:** `ProtectedRoute allow=["Admin", "Operator"]` (mirrors AllRiders — ADR-0002).
- **Param:** `phone` — the backend identifier. On mount, the page finds the row by phone via `getAllRiders()` (already cached-ish per session) or refetches. `role` for the update payload is taken from the fetched profile (all riders currently `"Rider"`, but we don't hard-code it).
- **404 case:** phone not found in the fetched list → render an inline "Rider not found" Card with a back link. Do not redirect (avoid loop-hazards à la F1).

### 2.2 Entry point A — AllRiders table row action

Table currently ends each row with a `—` placeholder in the Actions column (line 537 of `AllRiders.tsx`). Replace with:

```
[✎]   ← icon-only Button, size="sm", variant="ghost"
      aria-label={t("riders.all.editRiderAria", { name: r.name })}
      Tooltip: t("riders.edit.editRider")   // "Edit rider" / "رائیڈر ترمیم کریں"
      onClick: (e) => { e.stopPropagation(); navigate(`/admin/riders/${encodeURIComponent(r.phone)}/edit`); }
```

- Uses `lucide-react` `Pencil` icon (already in deps, v1.29.0).
- `e.stopPropagation()` is required — the `<tr>` itself already opens the sheet on click.
- Keyboard: button is focusable in tab order after the row. Enter/Space on the row still opens the sheet; Enter/Space on the button navigates.
- Visible width: 32×32 tap target inside the existing 80-px Actions column (line 501). Meets 44×44 recommended touch guideline via padding — verify at implementation.

### 2.3 Entry point B — RiderDetailSheet header edit button

In `SheetHeader` (line 69), add an icon-only Button next to `SheetTitle`:

```
[✎] Edit          ← size="sm", variant="outline"
                     aria-label={t("riders.edit.editRider")}
                     Tooltip: same key
                     onClick: onOpenChange(false); navigate(`/admin/riders/${encodeURIComponent(row.phone)}/edit`)
```

- Header becomes a flex row: title on the start side, edit button on the end side (`justify-between`).
- Close the sheet before navigating so the exit animation and focus-restore complete before route change.

### 2.4 Subtitle removal

Delete the `<SheetDescription>` element (line 71) AND the two locale keys (`riders.detailSheet.description` in `en.json` + `ur.json`). Radix `SheetDescription` is optional — no a11y regression as long as `SheetTitle` remains (screen-reader announcement is anchored to the title).

---

## 3. Page Layout — Text Wireframe

> **Design decision (rev 5):** ONE unified "Rider details" card holds all 8 profile fields in a single field-grid. Editable fields (area, address, cnic, dob) render as always-active inputs; read-only fields (name, phone, role, joined) render as static text with a subtle lock affordance. This gives the owner the "all info together, feels inline" experience without per-field save machinery — diff-only single Save (Q9) stays intact. Status (§3.9), PIN (§3.10), and Documents (§3.7/§3.8) remain their own Cards below (they are actions, not profile fields, and have their own success/error paths). The prior two-card split (Read-only card + Editable card) is **SUPERSEDED**.
>
> **Rationale (why NOT true per-field inline editing with pencils):** (1) Only 4 editable fields — the discovery cost of clicking a pencil per field is UX friction for zero benefit at N=4. (2) Per-field save conflicts with owner-locked Q9 diff-only semantics; would require either per-field POSTs (N calls, N failure modes) or a save-all button that duplicates the sticky bar. (3) Error surface fragments — 4 possible inline error slots vs one form-level banner. (4) Mobile 375 px: pencil icons crowd the row; always-active inputs are what the user expects. (5) H10 frugality — no new state machine per field. RTL: unified grid uses logical properties; per-field pencils would need mirrored per-field toolbars.

### 3.1 Desktop (≥ 1024 px) — UNIFIED CARD

```
┌────────────────────────────────────────────────────────────────────────┐
│ [← All Riders]                                                          │  ← back link (text button, ghost)
│                                                                          │
│ (AK)  Ahmed Khan                                          [Active badge]│  ← avatar (§3.6) 64px + h1 + status badge
│       Edit rider profile                                                │  ← subtitle (page purpose)
│                                                                          │
│ ┌─ Success banner (conditional, role="status", aria-live=polite) ────┐  │
│ │ ✓ Saved 2 fields: area, date of birth                              │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│ ┌─ Error banner (conditional, role="alert") ─────────────────────────┐  │
│ │ ✗ Could not save. <ApiError message>              [Retry]          │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌── Rider details ──────────────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │  Full name *                 │  Phone           🔒 ⓘ               │   │
│ │  [ Ahmed Khan            ]   │  [ 0301-1234567          ] readOnly │   │
│ │  ─────────────────────────── │ ─────────────────────────────────   │   │
│ │  CNIC *                      │  Date of birth *                    │   │
│ │  [ 42101-1234567-1     ]     │  [ 15 Mar 1998         📅 ]         │   │
│ │  ─────────────────────────── │ ─────────────────────────────────   │   │
│ │  Area *                      │  Address                            │   │
│ │  [ Gulshan-e-Iqbal   ▼ ]     │  [ House 12, Street 4, Karachi ]    │   │
│ │  ─────────────────────────── │ ─────────────────────────────────   │   │
│ │  Role                 🔒     │  Joined                🔒           │   │
│ │  [ Rider                 ]   │  [ 15 Mar 2024           ] readOnly │
│ │                                                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌── Status (§3.9) ──────────────────────────────────────────────────┐   │
│ │ Current: [Active]   [ Block rider ]  [ Offboard rider ]           │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│ ┌── PIN (§3.10) ────────────────────────────────────────────────────┐   │
│ │ Current PIN: •••••• (last reset 15 Mar 2024)   [ Reset PIN ]      │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│ ┌── Documents (§3.7 / §3.8) ────────────────────────────────────────┐   │
│ │ (list + upload dropzone)                                          │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌── Sticky action bar (bottom, floating rounded-xl) ────────────────┐   │
│ │                                     [Cancel]   [Save changes]      │   │
│ └────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Container**
- Page max width `max-w-3xl`; single column. Unified card uses `<Card className="p-4 md:p-6">`.
- Field grid inside the card: `grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5`. **Field order (rev 7 — interleaved, editable and locked mixed by meaning, not grouped):** Full name → Phone → CNIC → Date of birth → Area → Address → Role → Joined. Rationale: pairs personal identity (name/phone), then identity documents (cnic/dob), then location (area/address), then employment metadata (role/joined) — reads as one coherent profile record, not two segregated buckets.
- No sub-headers inside the card — since all fields (editable and locked) share the same visual style (rev 7), the card reads as a single unified profile record with no visual segregation.

**Read-only field anatomy (rev 7 — locked fields use `<Input readOnly>`, NOT static `<p>`, NOT `disabled`):**
```
<div>
  <div class="flex items-center gap-1.5">
    <Label htmlFor="role">Role</Label>
    <Lock aria-hidden size={12} class="text-muted-foreground" />   ← sole locked indicator
  </div>
  <Input id="role" readOnly value="Rider" class="mt-1.5 w-full" aria-readonly="true" tabIndex={0} />
</div>
```
- **All fields share the same visual style.** Locked fields render as a shadcn `Input` with the `readOnly` prop — same border (`border-input`), same text color (`text-foreground`), same font size, same padding, same height as editable inputs. **No muted value text, no reduced opacity, no transparent background.** The card reads as one profile record; locked ≠ dimmed.
- **Why `readOnly` (not `disabled`):** `readOnly` inputs stay full-contrast, remain focusable and copy-selectable, and are announced correctly by screen readers ("Role, read only, Rider"). `disabled` mutes contrast (fails WCAG on many themes), removes from tab order, and reads as "broken" to sighted users. Rev 6 used static `<p>`; rev 7 replaces that so every field has identical visual weight.
- Label uses the same token as editable-field labels (`text-xs font-medium text-muted-foreground` per shadcn `Label`). Value text uses `text-foreground` at full contrast.
- **Lock icon is the sole locked indicator** — `lucide-react` `Lock` at 12 px, `text-muted-foreground`, `aria-hidden="true"`, placed inline next to the label. No other visual cue distinguishes locked from editable; the icon carries the entire semantic load for sighted users, and `aria-readonly="true"` on the Input carries it for AT users.
- **Phone immutability affordance (rev 6):** compact Info-icon `Tooltip` next to the lock icon on the phone field label row — replaces the previous always-visible inline hint. Anatomy: `<Tooltip><TooltipTrigger asChild><button type="button" aria-label="Why can't I edit phone?" class="inline-flex focus-visible:ring-2 ring-ring rounded-full"><Info size={12} aria-hidden /></button></TooltipTrigger><TooltipContent>Phone cannot be changed — it identifies the rider to the backend.</TooltipContent></Tooltip>`. Chosen over inline hint to avoid inflating the grid row height (keeps two-column parity with the name row). **A11y note:** the tooltip trigger is a real `<button>` (keyboard-focusable, Enter/Space activates, focus opens the tooltip via Radix `Tooltip` default behaviour); the trigger has an `aria-label` so screen readers announce it without hover; supersedes the earlier "inline hint, not hover tooltip" guidance.

**Editable field anatomy** (unchanged from Stage 1 — inputs render always-active):
```
<div>
  <Label htmlFor="...">Area <span aria-hidden class="text-destructive"> *</span></Label>
  <Select|Input|DatePickerField class="mt-1.5 w-full" />
  {error && <p role="alert" class="mt-1 text-xs text-destructive">…</p>}
</div>
```
- Required-`*` mirrors the existing pattern.
- Inputs use their normal border (`border-input`) — the visible border IS the affordance that this field is editable. No hover/focus color changes needed beyond the existing token-based focus ring.
- Contrast check: locked-field value (`text-foreground` on `bg-card`) and editable-field input text (same tokens) share the same contrast ratio — no field looks disabled or broken.

**Banners**
- Success banner: directly below the h1 row, above the unified card. `role="status"`, `aria-live="polite"`, auto-dismiss 5 s. Enumerates the fields saved ("Saved 2 fields: area, date of birth") for admin-tool audit clarity.
- Error banner: same slot; `role="alert"` (assertive by default); persists until dismissed or retried; includes verbatim `ApiError` message + Retry button.
- Banners scroll with the page content — they never overlap the sticky action bar.

**Sticky action bar (cosmetic spec — owner feedback #2)**
- Container Tailwind:
  ```
  <div class="sticky bottom-4 mt-6 flex flex-col-reverse gap-2 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:gap-3">
  ```
- **`rounded-xl`** matches the Card primitive's corner radius (`src/components/ui/card.tsx` uses `rounded-xl`). Owner's "missing border radius" complaint fixed.
- **`bottom-4` (not `bottom-0`)** floats the bar 16 px off the viewport bottom so its rounded corners and border are visible on all sides — a `bottom-0` bar reads as "attached to the browser chrome" and rounded corners look accidental.
- **`px-4 py-3`** replaces the old `px-1 py-3` — Save button gets 16 px breathing room from the container edge (owner complaint #2). Matches the horizontal padding of the unified Card at mobile.
- **`sm:gap-3`** = 12 px between Cancel and Save on desktop (was `gap-2` = 8 px, too tight for a primary/secondary pair). Mobile stays at `gap-2` because buttons stack full-width, no visual pairing.
- **`shadow-sm`** adds a hairline shadow so the floating bar reads as elevated above the scrolling content — clarifies "above the page, not part of it".
- **`border-border` (all sides)** replaces the previous `border-t`-only — a floating rounded bar needs a full outline, not just a top edge.
- `bg-card/95 backdrop-blur` retained — content behind the bar remains legible through the semi-transparent surface.

### 3.2 Mobile (375 px)

- Unified card field grid collapses to `grid-cols-1` — every field is 100 % width, stacked. Read-only fields keep the same lock-icon + label + value layout; the phone "cannot be changed" hint sits directly under the phone value.
- Field order remains identity-first (name → phone → role → joined → area → address → cnic → dob). No section headers within the card.
- Sticky action bar: `flex-col-reverse` stacks Save on top (primary), Cancel below (`variant="outline"`), both `w-full`. `rounded-xl` + `bottom-4` + `px-4` still apply; the bar is inset from the viewport by 16 px on all sides.
- Back link becomes a `<` icon Button (`variant="ghost" size="icon"`) in a top row alongside the h1; avatar drops to 48 px.
- Status / PIN / Documents cards stack full-width below the unified card as on desktop.

### 3.3 Field controls by type

| Field | Control | Primitive | Validation |
|---|---|---|---|
| Area | dropdown | `Select` (already in kit) + `KARACHI_AREAS` constant | required, must be one of the list |
| Address | text input (single line) | `Input` — no `textarea` primitive add | optional, ≤ 200 chars |
| CNIC | text input with mask | `Input` + existing `formatCnic` / `normalizeCnicInput` helpers in `src/features/riders/cnic.ts` | required; accept 13 digits with **or without** dashes (`XXXXX-XXXXXXX-X` display, digits-only wire); `normalizeCnicInput` strips dashes; error if `!/^\d{13}$/.test(normalized)`; block save if invalid |
| DOB | date picker | **reuse existing** `src/components/DatePickerField.tsx` (already wraps surviving `Calendar` + `Popover` primitives; used in `RiderProfileCard`, `RegisterPage`; react-day-picker 8.10.2 installed) — H10 wins over adding native `<input type="date">` | required; age 18–100 window (mirrors register + Iter 4 product decision); wire form ISO `YYYY-MM-DD` |
| Full name | text input | `Input` (already in kit) | required; trim; 2–80 chars; error if empty after trim |
| Phone / Role / Joined | read-only display | static text with lock affordance (see §3.1 anatomy); phone gets Info-icon Tooltip explaining immutability | n/a — locked per Q2 |
| Status | action buttons in dedicated card | see §3.9 | separate wire from form-save |
| PIN | action button in dedicated card | see §3.10 | separate wire from form-save |

### 3.4 States (per H7 UX rule "design all states")

| State | Behaviour |
|---|---|
| **Default** | Form populated from fetched row; Save disabled (nothing dirty). |
| **Loading (initial fetch)** | Skeleton rows using `Skeleton` primitive; sticky bar hidden. |
| **Not found** | Card: "Rider not found." + back link. No form rendered. |
| **Dirty** | Save becomes enabled; unsaved-changes visual dot next to h1. Beforeunload / route-change guard prompts via `AlertDialog`. |
| **Field error** | Red border on input, `role="alert"` message below, `aria-describedby` wire-up. Save disabled if any error. |
| **Saving** | Save button shows spinner + `aria-busy=true`; form disabled (fieldset disabled semantics — use `disabled` prop on all inputs). |
| **Save success** | Inline success banner (`role="status"`), 5-second auto-dismiss, dirty state cleared, form re-enabled. Fields keep new values. |
| **Save error** | Inline destructive banner (`role="alert"`) with the verbatim `ApiError` message + a Retry button. Form re-enabled, dirty state preserved. |
| **Empty diff** | Save button stays disabled (no `update-user` call needed). |
| **Avatar loading** | Radix Avatar shows initials fallback until image loads (built-in behaviour). |
| **Avatar upload in progress** | Dropzone shows spinner + "Uploading photo…"; existing avatar dimmed 50%. |
| **Docs list loading** | Compact list shows a skeleton grid (5–6 placeholder chips) while `/get-rider-documents` is in flight. Upload control is present but the Select is disabled. |
| **Docs list — entry Missing** | Muted-outline `Missing` chip only; no per-row action buttons; row is a passive display. |
| **Docs list — entry Received** | Success `Received ✓` chip + icon-only actions [View, Download, Delete]. Replace happens through the upload control (§3.8), not on the row. |
| **Upload control — idle, no type selected (rev 9)** | Select shows placeholder; Name input hidden; dropzone visible but `aria-disabled=true`, muted styling, hint text "Select a document type first". Clicks and drops are absorbed; focus programmatically moves to the Select trigger. |
| **Upload control — idle, type selected (rev 9)** | Dropzone active (`aria-disabled=false`, foreground styling, "Drop a file here or click to browse"). If Type = Other, Name input is visible above the dropzone. |
| **Upload in progress (rev 9 — single row)** | Select + Name input + dropzone REPLACED by a single progress row (filename · size · progress bar · Cancel). ARIA `progressbar` with `aria-valuenow`. One upload at a time on this surface. |
| **Upload failed (rev 9)** | Control returns to its pre-upload state (Type + Name preserved for Retry); inline `role="alert"` beneath the dropzone; `[Retry]` button next to the alert. |
| **File too large (2 MB cap)** | Rejected pre-upload; inline `role="alert"` under the dropzone: "File is <actual> MB — max 2 MB per file." No upload attempt made. |
| **Unsupported file type (PDF+JPG+PNG)** | Inline `role="alert"` under the dropzone: "Accepts PDF, JPG or PNG only." No upload attempt made. |
| **Name invalid (Other only, rev 9)** | Inline `role="alert"` under the Name input: empty → "Enter a name for this document."; > 40 chars → "Name must be 40 characters or fewer."; duplicate normalized name → treated as REPLACE, not blocked (see below). |
| **Replace confirm (rev 9)** | AlertDialog fires on file selection whenever the target type is already Received (fixed type) OR the entered Other-name normalizes to an existing Other's name. Body: "Replace <name>? The current file (<filename>, <size>) will be overwritten and cannot be recovered." — destructive variant; Cancel focused by default. |
| **Replace success (rev 9)** | Compact-list entry swaps to the new file metadata; ephemeral 3 s "Replaced <name>" `role="status"` chip below the upload control. Old file retired server-side. |
| **Avatar upload (unchanged from rev 8)** | Camera icon on the avatar triggers the file picker → uploads/replaces via `POST /upload-rider-document` with `type="profile_photo"`. Not part of the §3.8 upload control surface. |
| **Status transition in progress** | Action button shows spinner; other status buttons disabled. |
| **Status transition failed** | Inline `role="alert"` banner; status unchanged; buttons re-enabled. |
| **PIN reset dialog (new PIN shown)** | Non-dismissable-by-outside-click AlertDialog; Copy + Done buttons; PIN in large mono font. |
| **PIN reset endpoint unavailable** | "Reset PIN is temporarily unavailable" notice replaces the button (production-gap fallback). |
| **Status endpoint unavailable** | Action buttons disabled + tooltip "Status changes temporarily unavailable" (production-gap fallback for `/update-user activationStatus` contract). |

### 3.5 Success feedback + back-navigation

- Save success → banner + stay on page (per Q8 default). Back link + Cancel both navigate to `/admin/riders?…preserved-query` (preserve status/area/page/sort). If the user clicks Cancel while dirty, `AlertDialog` confirms discard.

---

### 3.6 Avatar (rider photo) — rev 8: DERIVED from the `profile_photo` document

**Placement:** top of the page, start-side of the h1 row. Circular, 64 px on desktop, 48 px on mobile.

**Rev 8 change:** the avatar is no longer a standalone concern with its own storage. It is a **derived view** of the `profile_photo` verification document (§3.7.3). One face image, one write path, one source of truth.

- **Primitive:** shadcn `Avatar` (`AvatarImage` + `AvatarFallback`) — already in the surviving 17. Radix Avatar renders `AvatarFallback` automatically if the image 404s or is absent, so **initials fallback is free**.
- **Data source:** `documents.find(d => d.type === "profile_photo")?.downloadUrl` after `/get-rider-documents` resolves. There is no `profile.photoUrl` field on `get-all-riders` (dropped in rev 8, §8.1).
- **Loading window:** while `/get-rider-documents` is in flight, the avatar shows initials — no skeleton, no layout shift. Matches the "missing photo" state visually, which is fine (unknown ≈ absent).
- **Initials rule:** first char of first + last name token, uppercased. Single-word names use the first two chars. Empty name → `?`. Locale-safe via `String.prototype.at(0).toUpperCase()` — Urdu names produce Urdu-letter initials naturally.
- **Fallback background:** hashed from the phone (deterministic tint from a 4-colour token set: `primary`, `success`, `warning`, `muted`). Per-rider colour consistency across sessions.
- **Interaction:** the small camera icon overlay on the avatar is a **shortcut** to the `profile_photo` row's upload/replace flow (§3.8):
  - If `profile_photo` is missing → the camera icon opens the file picker with `accept=".jpg,.jpeg,.png,image/jpeg,image/png"`; on selection it uploads.
  - If `profile_photo` is received → the camera icon opens the picker; on selection the Replace AlertDialog fires (§3.8.4). Same code path as clicking Replace in §3.7's row.
  - The camera icon is hidden entirely when `/get-rider-documents` returned `null` (production-gap fallback), same as any other document control.
- **Accepted formats for avatar upload:** `image/jpeg`, `image/png`. Not PDF.
- **Max size:** 2 MB (same as all documents, rev 8).
- **Small variant in the detail sheet:** yes — cheap. Add a 32 px avatar to the start of `SheetHeader` next to `SheetTitle`. Zero primitive cost (same `Avatar` component). Reads the same derived data source. If h1 row becomes crowded on 375 px sheet width, drop it — page avatar remains the priority.

---

### 3.7 Documents — Compact List (rev 9 FINAL — SUPERSEDES rev-8 per-row checklist)

**Placement:** own Card section between Status/PIN and the sticky action bar. Title: **"Verification documents"** (unchanged from rev 8).

**Design intent (rev 9):** an admin scans, in one glance, which documents are on file and which are missing. The prior six-row checklist made the card scroll past a viewport on mobile; rev 9 collapses each entry to a single line and moves the upload affordance to a single control below the list (§3.8). Freeform naming is only permitted under the `Other` category; the five fixed enum types remain frozen.

#### 3.7.1 Document types (rev 9 — five fixed + `Other`)

Backend-facing keys are frozen (case-sensitive `snake_case`); display strings are i18n'd. `profile_photo` remains a valid `type` for `/upload-rider-document` but is **NOT** listed in the compact list and **NOT** offered in the upload-control Select (§3.8) — the avatar (§3.6) is its sole surface.

| # | Enum key | EN display | UR display | In compact list? | In upload Select? | Accepted formats |
|---|---|---|---|---|---|---|
| 1 | `cnic_front` | CNIC Front | شناختی کارڈ (سامنے) | Yes | Yes | pdf, jpg, jpeg, png |
| 2 | `cnic_back` | CNIC Back | شناختی کارڈ (پیچھے) | Yes | Yes | pdf, jpg, jpeg, png |
| 3 | `bike_registration` | Bike Registration | بائیک رجسٹریشن | Yes | Yes | pdf, jpg, jpeg, png |
| 4 | `driving_license` | Driving License | ڈرائیونگ لائسنس | Yes | Yes | pdf, jpg, jpeg, png |
| 5 | `utility_bill` | Utility Bill | یوٹیلیٹی بل | Yes | Yes | pdf, jpg, jpeg, png |
| 6 | `other` (repeatable, `name` required) | *(custom name)* | *(custom name)* | Yes (0..N entries) | Yes | pdf, jpg, jpeg, png |
| — | `profile_photo` | — | — | **No** (rendered as avatar §3.6) | **No** | jpg, jpeg, png |

- Enum lives in `src/features/riders/documentTypes.ts`:
  ```ts
  export const DOCUMENT_TYPES = ["cnic_front", "cnic_back", "profile_photo", "bike_registration", "driving_license", "utility_bill", "other"] as const;
  export type DocumentType = typeof DOCUMENT_TYPES[number];
  export const UPLOAD_SELECT_TYPES = ["cnic_front", "cnic_back", "bike_registration", "driving_license", "utility_bill", "other"] as const;
  ```
- The list-order in the compact list is: five fixed rows in enum order, then any `other` entries in insertion order (oldest → newest by `uploadedAt`).
- Display names via `t("riders.edit.documents.types." + key)`; for `other`, the display is the document's `name` field verbatim (no i18n — user-supplied).

#### 3.7.2 Compact list anatomy

**Container:** `<ul>` styled as a two-column grid on desktop, single-column on mobile.
```
<ul class="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-x-4 md:gap-y-2" aria-label="…">
```

**Entry (Received)** — one line, wraps to two lines only if display name overflows on mobile:
```
CNIC Front            [Received ✓]   [👁] [⬇] [🗑]
```

**Entry (Missing):**
```
Utility Bill          [Missing]
```

**Entry markup:**
```
<li class="flex items-center gap-2 rounded-md border border-border px-3 py-2">
  <span class="truncate text-sm text-foreground">CNIC Front</span>
  <Badge class="ms-auto shrink-0 text-[10px]">Received ✓ | Missing</Badge>
  {received && (
    <div class="flex items-center gap-0.5 shrink-0" role="group" aria-label="Actions for CNIC Front">
      <Button variant="ghost" size="icon" class="h-7 w-7" aria-label="View CNIC Front"><Eye size={14}/></Button>
      <Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Download CNIC Front"><Download size={14}/></Button>
      <Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Delete CNIC Front"><Trash2 size={14} class="text-destructive"/></Button>
    </div>
  )}
</li>
```

**Key compactness decisions:**
- **Icon-only actions (28 × 28 px visual, 44 × 44 effective via `p-2` inner padding hitbox).** Rationale: the whole card must fit ~half its rev-8 height. Text-labelled buttons blow the row past 60 px each; icon-only holds every row at 40 px. A11y unaffected — `aria-label` + `Tooltip` deliver the same semantic weight.
- **View + Download + Delete only.** Replace is DELETED from per-row (rev 9): replacement goes through the upload control (§3.8) by selecting the same type and picking a new file. Rationale: eliminates one icon per row (saves ~32 px width), and consolidates the upload/replace mental model into a single surface.
- **File metadata (name / size / uploaded-by / uploaded-on) is REMOVED from the compact row.** It's available on hover via `Tooltip` on the display-name span, and shown in the Delete/Replace confirm dialogs. Rationale: the row is a scanning surface, not a data-dump; per-file audit context lives in the destructive dialogs where it prevents mistakes.
- **`Missing` badge only** on missing entries — no "no file yet" secondary text. The chip is the entire signal.
- **Wrapping behaviour:** `truncate` on the display-name span, `shrink-0` on chip and action group — long custom Other-names truncate with tooltip, chip and actions never wrap or clip.

**Grid target height** (desktop, 6 entries, `md:grid-cols-2`): 3 rows × 40 px + 2 × 8 px gap ≈ 136 px. Compare rev-8 six-row stacked with metadata: ≈ 96 px × 6 = 576 px. Reduction ≈ 76 %. Owner target of "half the height" satisfied comfortably even with the upload control (§3.8) accounted for.

#### 3.7.3 Others in the compact list

- Each `Other` document is one entry rendered under its user-supplied `name`.
- No visual differentiation from fixed entries in the list — the user-supplied name IS the label. This is intentional: for a scanning admin, "Tax certificate" and "CNIC Front" look identical; both are just documents on file.
- Delete on an Other entry removes exactly that named Other; other Others are unaffected.
- If two Others somehow share a normalized name in a backend response, the frontend renders the newest by `uploadedAt` and logs a console warning (same defensive pattern as duplicate fixed types).

#### 3.7.4 Completeness summary (header of the card)

Above the list, a single line: **"4 of 5 required documents received"** (i18n'd). Rev 9 counts only the **five fixed required types** — Others are supplementary and are not part of the required-set denominator. Plain text; not a progress bar. Colour: default foreground.

#### 3.7.5 A11y (compact list)

- Section wrapper: `<section aria-labelledby="docs-heading">` with `<h2 id="docs-heading">Verification documents</h2>`.
- The `<ul>` gets `aria-label={t("riders.edit.documents.listAria")}` ("List of verification documents").
- Each `<li>` contains the display name in its normal reading order; status chip announces "Received" or "Missing" verbatim (never colour alone).
- Icon action buttons carry `aria-label` interpolating the type display name — e.g. `aria-label="View CNIC Front"`, `aria-label="Delete Tax certificate"` (for Others).
- Icon action buttons are grouped in `<div role="group" aria-label="Actions for {type}">` — one group per Received entry — so SR users hear the action set as a bounded unit.
- Focus order across the card: heading → list (left-to-right, top-to-bottom by grid position; per row: display name skipped, then icon actions in order View → Download → Delete) → upload control (§3.8 focus order).
- Colour-independence: "Received ✓" carries the ✓ glyph and text; "Missing" carries text only. Never colour alone.
- Delete `AlertDialog` (unchanged from rev 8): focus-traps, primary is `[Delete]` destructive, Cancel focused by default; body shows the file's name + size for confirmation context.

#### 3.7.6 Mobile (375 px)

- `grid-cols-1` — one entry per row, full-width.
- Icon action group stays inline on the row's end edge (`ms-auto`). Effective tap targets: 44 × 44 px via padding (visual 28 × 28 button + `p-2` invisible hitbox, matching the pattern used elsewhere in the app).
- Row content order: name → chip → actions. Wraps only when the name overflows; chip and action group never wrap.
- Row height at 375 px: ≈ 44 px per entry (padding + 44-px min hit area). 6 entries stacked = ~264 px + gaps — still ~⅓ of the rev-8 mobile height.

#### 3.7.7 RTL

- `<li>` uses `flex` + logical `ms-auto` on the chip — chip and action group swap to the start (left) edge in Urdu automatically.
- Icon action group visual order (View → Download → Delete) mirrors correctly under `dir="rtl"` via natural flexbox flow.
- Truncation and `dir="auto"` on the name span keep user-supplied Other-names (which may be Urdu, English, or mixed) rendered in their own reading direction inside the RTL row.

#### 3.7.8 Data source

`POST /get-rider-documents` returns typed documents (§8.2, amended rev 9 to include `name?: string` for `type="other"`). The frontend:
- Groups the response by `type`.
- For each of the five fixed types: renders one entry, Received if any doc of that type is in the response, Missing otherwise. If two docs of the same fixed type arrive, renders the newest and warns to console (defensive; server should enforce one-per-fixed-type).
- For `type="other"`: renders one entry per document, using `name` as the label. No dedupe on the frontend — server is expected to keep names unique per rider (§8.3 upsert semantics).

---

### 3.8 Documents — Single Upload Control (rev 9 FINAL — SUPERSEDES rev-8 per-row uploader)

**Placement:** below the compact list, inside the same Card. Separated from the list by a `<Separator>`. One control drives all uploads and all replacements — for every fixed type and for every Other.

#### 3.8.1 Anatomy

```
┌─ Verification documents ─────────────────────────────────────────────┐
│ 4 of 5 required documents received                                    │
│                                                                        │
│ [CNIC Front  Received ✓  👁 ⬇ 🗑]   [CNIC Back  Received ✓  👁 ⬇ 🗑]   │
│ [Bike Reg.   Received ✓  👁 ⬇ 🗑]   [Driving L. Missing            ]   │
│ [Utility B.  Missing              ]   [Tax cert. Received ✓ 👁 ⬇ 🗑]   │
│ ─────────────────────────────────────────────────────────────────      │
│  Upload a document                                                     │
│  Type: [ Select document type  ▼ ]                                     │
│  ┌─ (visible only when Type = Other) ────────────────────────────┐    │
│  │ Name: [ e.g. Tax certificate            ]  (1–40 chars)       │    │
│  └────────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │           📄  Drop a file here or click to browse              │   │
│  │           PDF, JPG or PNG · max 2 MB                            │   │
│  └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

**Components used (surviving primitives, no new adds):**
- `Select` — five fixed types + `Other` at the bottom of the list. Placeholder: "Select document type". `profile_photo` is deliberately absent (§3.7.1).
- `Input` (conditional) — visible only when `Select` value is `"other"`. `<Label>` "Custom document name". Placeholder examples.
- Dropzone — a hand-rolled `<div role="button">` (not `<Button>` — needed for large drop-target surface and native DnD event handlers). Interactive semantics fully specified in §3.8.5.
- Hidden `<input type="file" accept="…" class="sr-only">` — opens on dropzone click / Enter / Space.

**Layout:**
- Desktop: `Select` and (conditional) `Name` input stack in a single column (max-w-md); dropzone spans the card width. Total control height ~140 px including padding and dropzone hint text.
- Mobile: same stack, full width.

#### 3.8.2 Type Select — options and behaviour

- **Options** (i18n'd):
  1. CNIC Front — value `cnic_front`
  2. CNIC Back — value `cnic_back`
  3. Bike Registration — value `bike_registration`
  4. Driving License — value `driving_license`
  5. Utility Bill — value `utility_bill`
  6. Other (specify name) — value `other`
- **`profile_photo` is NOT in the list.** The upload control cannot be used to set the DP. Camera icon on the avatar (§3.6) is the only DP entry point — rev-8 unification preserved.
- **Initial state:** no selection. Placeholder text visible. Dropzone disabled (§3.8.4).
- **Changing type mid-flow:** allowed at any time before file selection. If Others `name` was typed then user switches back to a fixed type, the Others `name` field unmounts and its value is discarded (deliberate — no cross-type name persistence).
- **A11y:** Select follows shadcn/Radix defaults — keyboard-navigable (Enter/Space to open, arrow keys to move, Enter to select), `<Label htmlFor>` wire-up, `aria-required="true"`.

#### 3.8.3 Others `name` Input (conditional)

- **Rendered only when** `Select` value is `"other"`.
- **Label:** "Custom document name" + required `*`.
- **Placeholder:** i18n'd example ("e.g. Tax certificate" / example equivalent in Urdu).
- **Validation** (client-side, blocks upload; server is source of truth):
  - Required (empty after trim → error: "Enter a name for this document.").
  - `trim()` applied to submitted value.
  - Length: 1–40 chars after trim. Over 40 → error: "Name must be 40 characters or fewer." (Chose 40 because it fits the compact-list row label without truncating on mobile 375 px; 80 would frequently ellide.)
  - Uniqueness: rejected if `name.trim().toLowerCase()` matches any existing `Other` document's normalized name AND the user has not confirmed a REPLACE. In practice this shows the rev-8 REPLACE `AlertDialog` on file selection (§3.8.6), same as duplicate fixed-type selection.
  - Character set: no restriction beyond length — user-supplied Urdu / English / mixed / punctuation all permitted. Input has `dir="auto"` so display flips per content.
- **Error rendering:** `<p role="alert" class="mt-1 text-xs text-destructive">` beneath the input, `aria-describedby` wired.
- **`maxLength={40}`** on the `<input>` element prevents typing past the limit — reinforces the constraint before submit.

#### 3.8.4 Dropzone — states and interactions

**Dropzone is a `<div>` with:**
- `role="button"`
- `tabIndex={0}` when enabled, `tabIndex={-1}` when disabled
- `aria-label` describing action + current state (see §3.8.7)
- `aria-disabled={true}` when Type has not been selected (or when `Other` is selected and Name is invalid, or during in-flight upload)
- `onClick` → opens hidden `<input type="file">` (only when enabled)
- `onKeyDown` → Enter or Space activates the same picker (only when enabled)
- `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` → DnD handlers (see below)

**State machine:**

| State | Visual | `aria-disabled` | Behaviour |
|---|---|---|---|
| **Idle — no type selected** | Muted border, muted icon, hint: *"Select a document type first"* | true | Click / Enter / Space → no picker opens; instead **focus programmatically moves to the Type Select trigger**. Drop event: `preventDefault` + `stopPropagation`, no upload, dropzone briefly pulses (200 ms `ring-2 ring-muted-foreground` then removed), same focus-shift-to-Select fires, live region announces *"Select a document type first."* |
| **Idle — type selected (and Name valid if Other)** | Default border, foreground icon, hint: *"Drop a file here or click to browse"* + accepted formats subline | false | Click / Enter / Space → picker opens. DnD: drop uploads. |
| **Drag-over (valid state, hovering)** | `ring-2 ring-primary bg-primary/5` | false | Visual only; drop fires upload. |
| **Drag-over (idle-no-type state, hovering)** | `ring-2 ring-muted-foreground bg-muted/40` — dashed, subdued | true | Drop rejected as above; visual reinforces the "select type first" message. |
| **Uploading** | Dropzone REPLACED by a single progress row (see §3.8.5); Select and Name input hidden as well | true | User cannot start a second upload until the current one resolves. Cancel button available. |
| **Failed** | Dropzone returns to idle-with-type; inline `role="alert"` with reason (too large / unsupported / server error) + Retry button below the hint | false | Retry re-uploads the same file with the same type/name (cached in state). |

**Why "select a type first" rather than "auto-focus and continue":**
- Auto-focusing the Select and holding the dropped file in memory hides the required ordering behind a magic-continuation UX — user drops file, focus jumps, user is confused about whether the file "took". The disabled-with-hint pattern makes the constraint visible and matches what a keyboard user already sees.
- The compromise chosen: focus DOES move to the Select trigger on the invalid interaction (both click and drop), so the next keystroke is productive. This gets the "hand-holding" benefit without the ambiguity of auto-uploading.

#### 3.8.5 Upload lifecycle — single progress row

While an upload is in flight, the entire upload control area (Select + Name input + dropzone) is REPLACED by a single progress row:

```
┌ Uploading Utility Bill ─────────────────────────────────────────────┐
│ utility-bill-scan.pdf · 1.2 MB                                       │
│ [▓▓▓▓▓▓▓░░░░░░░░ 67 %]                                 [✕ Cancel]    │
└──────────────────────────────────────────────────────────────────────┘
```

- One upload at a time on this surface (owner intent — a single control implies serial uploads).
- `<div role="progressbar" aria-valuenow aria-valuemin=0 aria-valuemax=100 aria-label="Uploading Utility Bill">` — logical fill via `start-0` / `w-{pct}` so RTL fills right-to-left automatically. Native `<progress>` acceptable if Frontend Dev prefers.
- Cancel: `AbortController`-backed; on cancel the upload control returns to the pre-upload state with Type / Name / file cleared.
- On success:
  - Compact list re-fetched (or optimistically updated) — the corresponding row swaps to Received (fixed type) OR a new Other entry appears.
  - The upload control returns to Idle-no-type (Select reset, Name cleared).
  - Ephemeral 3 s `role="status"` chip beneath the upload control: *"Uploaded Utility Bill"* / *"Uploaded Tax certificate"*.
- On failure: control returns to idle-with-type, retains the failed file in state for Retry; inline `role="alert"`.

#### 3.8.6 Replace flow (integrated into single control)

Owner intent (rev 9): replacement uses the same single control — no per-row Replace buttons.

- **Fixed type already Received** → user picks the same type in the Select and selects a file. On valid file:
  - AlertDialog: *"Replace CNIC Front? The current file (cnic-front.jpg, 342 KB) will be overwritten and cannot be recovered."*
  - Destructive variant; Cancel focused by default.
  - Confirm → upload proceeds (§3.8.5). Success → the compact list's `CNIC Front` row swaps to the new file's metadata (surfaced in view/download URLs), ephemeral "Replaced" chip.
- **Other with duplicate normalized name** → same AlertDialog, worded for the Other: *"Replace 'Tax certificate'? The current file … will be overwritten …"*.
- **Fixed type Missing / New Other name** → no dialog, upload proceeds directly.

#### 3.8.7 A11y — Select + conditional Input + Dropzone row

- **Focus order** through the upload control: Type Select → (if Other) Name Input → Dropzone → (during upload) Cancel button.
- **Labels**: every field has a visible `<Label htmlFor>`. Required fields get `aria-required="true"` and visible `*`.
- **Dropzone keyboard parity with DnD:**
  - Enter and Space on the focused dropzone open the native file picker (identical outcome to a mouse click).
  - Focus-visible ring (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`) matches shadcn button focus token — visible for keyboard users.
  - Dropzone announces its state in its `aria-label`, updated live:
    - Idle-no-type: `aria-label="Upload a document — select a document type first"`.
    - Idle-with-type: `aria-label="Upload {type name} — drop a file here or press Enter to browse"`.
    - Uploading: dropzone is not rendered; progress row's own `aria-label` covers announcement.
- **Live region:** a single `aria-live="polite"` region on the upload control root announces: "Select a document type first" (on invalid drop), upload start ("Uploading utility bill"), upload progress milestones (25/50/75/100 % — throttled, so SR is not spammed), success ("Uploaded utility bill"), and failure ("Upload failed: {reason}"). One region for the whole surface — no competing announcements.
- **Programmatic focus shift:** the "select type first" branch (§3.8.4) uses `selectTriggerRef.current?.focus()` — the shadcn `SelectTrigger` accepts a ref and is a real button, so focus moves natively. No `preventScroll` needed (control is inside the same card).
- **Dropzone role choice:** `role="button"` (not `role="region"` or `application`) so AT users get standard button semantics; the dropzone announces as a button whose action is described by its aria-label.
- **Disabled dropzone:** `aria-disabled="true"` (NOT `disabled` HTML attr on a div — `disabled` is meaningless on `<div>`); `tabIndex={-1}` also applied so keyboard users skip it entirely when it's inert — the Select is where they need to be.
- **Rejection banners** (too large, unsupported, name too long/empty/duplicate): `role="alert"` beneath the offending control (Name input for name errors; dropzone for file errors). Focus stays on the trigger; live region also announces the rejection.

#### 3.8.8 RTL

- Select and Name input inherit `dir` from the document root; option list, chevron placement, and text alignment flip naturally in Urdu.
- Dropzone icon (📄) is decorative — centered horizontally regardless of `dir`. Hint text uses `text-center`.
- Progress bar fills from the reading start-edge via `start-0` — right-to-left in RTL, left-to-right in LTR. Cancel button sits at the row's end edge via `ms-auto`.
- Filenames stay LTR within an RTL run via the global `unicode-bidi: plaintext` policy (Iteration 6).
- Others `name` Input carries `dir="auto"` — content dictates direction per keystroke.

#### 3.8.9 Mobile (375 px)

- Full stack, full-width. Select and Name input each on their own row; dropzone spans the full card width.
- Dropzone min-height 96 px on mobile — big enough to hit reliably, small enough not to dominate the viewport.
- Native DnD is a no-op on iOS/Android touch; the button-behaviour (tap → file picker with the OS's "Take photo" / "Choose file" menu) is the primary interaction. This is intentional and correct — the dropzone doubles as the browse button on touch.
- Progress row: same layout, full-width; Cancel button full-width if it would be less than 44 px tall inline.

#### 3.8.10 File constraints (unchanged from rev 8, restated for completeness)

- **Max size: 2 MB per file.**
- **Accepted MIME types** (all types in the Select share the same allowlist since `profile_photo` is out): `application/pdf`, `image/jpeg`, `image/png`.
- **Accept attribute:** `".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"`.
- Rejection messages (all inline `role="alert"` under the dropzone):
  - Too large → *"File is {actual} MB — max 2 MB per file."*
  - Unsupported → *"Accepts PDF, JPG or PNG only."*
- Server enforces authoritatively; client-side is UX-only.

---

### 3.9 Status Change (Q5 — MOCK-FIRST)

**Placement:** dedicated Card between Editable and PIN.

**Control choice:** action buttons (NOT a Select). Justification (one line): buttons make destructive transitions read as intentional actions, permit per-target disable (hide "Block" if already blocked), and match the existing pattern in `BlockedRiders.tsx` (Unblock via `AlertDialog` action button).

**Buttons shown depend on current status:**

| Current status | Buttons rendered | Confirm required |
|---|---|---|
| `pending` | [ Activate rider ] | No — but requires 6-digit PIN entry (reuses existing `/activate-rider` per ADR-0003) |
| `active`  | [ Block rider ] [ Offboard rider ] | Yes — AlertDialog, destructive variant |
| `blocked` | [ Unblock rider ] [ Offboard rider ] | Yes — AlertDialog |
| `offboarded` | [ Reactivate rider ] | Yes — AlertDialog |

**Backend wiring:**
- `pending → active`: reuse existing `activateRider(phone, pin)` — `POST /activate-rider` (frozen, ADR-0003).
- All other transitions (`active → blocked`, `active → offboarded`, `blocked → active`, `blocked → offboarded`, `offboarded → active`): **no existing endpoint**. Spec assumes `POST /update-user { phone, role, activationStatus: "<new>" }` per §8.7 — flagged as **contract assumption** for backend confirmation. Existing `BlockedRiders.tsx` `confirmUnblock` is local-state only (verified: `src/features/riders/BlockedRiders.tsx:218`); it does NOT call the backend. This page is the first real wiring for these transitions.
- On success: status badge updates in place, action buttons re-render for the new status, inline success banner shows "Rider blocked" / "Rider offboarded" etc.
- On failure: inline `role="alert"` banner with the `ApiError` message; status unchanged.

**A11y:** each destructive AlertDialog focus-traps; primary action is the destructive button (red), Cancel is the safe default (focused on open — the shadcn `AlertDialog` primitive already does this).

---

### 3.10 Reset PIN (Q4 — MOCK-FIRST)

**Placement:** dedicated Card between Status and Documents.

**Control choice:** single button `[ Reset PIN ]` + AlertDialog confirm. Auto-generated PIN (not typed). Justification: auto-generate is simpler (no validation UI, no confirm-field, no risk of the admin picking a weak PIN); the new PIN is displayed once in a dismissable dialog with a "Copy" button, matching how one-time credentials are typically surfaced.

**Flow:**
1. Admin/Operator clicks `[ Reset PIN ]`.
2. AlertDialog: "Reset PIN for Ahmed Khan? The current PIN will stop working immediately."
3. Confirm → `POST /reset-rider-pin { phone, role }` (proposed, §8.8).
4. Success → second dialog: "New PIN: **483920**  [ Copy ]  [ Done ]" — non-dismissable by outside-click (Radix `onInteractOutside={(e) => e.preventDefault()}`) so the admin cannot accidentally lose the PIN.
5. Failure → inline `role="alert"` banner, dialog dismissed.

**Read-back:** the page also shows "Current PIN: `••••••` (last reset: 15 Mar 2024)" as a hint above the button. Actual PIN is never displayed after the initial reset dialog closes (frontend doesn't cache; backend must not return it on `/get-all-riders`).

**MOCK-FIRST:** MSW handler generates a random 6-digit PIN and stores it in-session. Production shows "Reset PIN is temporarily unavailable" if endpoint returns 404/500.

---

## 4. Read-Only Subtitle Removal (spec)

- **File:** `src/features/riders/RiderDetailSheet.tsx` — delete `<SheetDescription>{t("riders.detailSheet.description")}</SheetDescription>` (line 71).
- **Locales:** delete key `riders.detailSheet.description` from both `src/i18n/locales/en.json` and `src/i18n/locales/ur.json`.
- **Verification:** `rg "detailSheet.description" src/` returns 0 hits post-change.
- **A11y note:** Radix requires `SheetDescription` in a nested `<div id={...}>` only if `aria-describedby` is used on `SheetContent`. Confirmed neither is wired up — safe removal, no `aria-describedby` orphans. Radix Sheet may emit a dev-only warning if it expects a description; if so, add `aria-describedby={undefined}` explicitly or provide an `sr-only` description with the rider's status. **Interview follow-up:** confirm with owner whether we hide with `sr-only` or drop entirely.

---

## 5. A11y Checklist

- [ ] Every input has an associated `<Label htmlFor>` — not `aria-label` (visible labels only, per WCAG 3.3.2).
- [ ] Required fields marked with `aria-required="true"` and a visible `*` in the label.
- [ ] Errors: `role="alert"` on the error text; input has `aria-invalid="true"` + `aria-describedby={errorId}`.
- [ ] Save-success banner: `role="status"` + `aria-live="polite"`.
- [ ] Save-error banner: `role="alert"` (assertive by default).
- [ ] Focus order: back → title → status → each field top-to-bottom → Save → Cancel.
- [ ] Initial focus on mount: **h1** (not first input — prevents surprise typing before user has read context).
- [ ] Focus after save success: banner (via `ref.focus()` on a `tabIndex=-1` container) so SR announces the outcome once.
- [ ] Focus after save error: first invalid field, or banner if the error is form-level.
- [ ] Discard `AlertDialog`: focus-traps via Radix (already used elsewhere).
- [ ] Every interactive element ≥ 44×44 effective tap target (via padding).
- [ ] Contrast: all form colours already token-based; new banners inherit `success` / `destructive` tokens (verified WCAG AA in ADR palette).
- [ ] Reduced-motion: any transitions gated by existing `@media (prefers-reduced-motion)` global rule in `theme.css`.

### 5.1 RTL / Urdu notes

- Layout uses **logical properties only**: `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, `text-start`, `text-end`. No `left/right`.
- Back link icon (`ChevronLeft`) must flip via CSS `[dir=rtl] .rtl-flip { transform: scaleX(-1); }` or use `ArrowLeft` inside a `[dir=rtl]` selector — reuse the pattern already applied to calendar chevrons in Iteration 7.
- The detail sheet slides from the **left** in Urdu (already handled — see `RiderDetailSheet.tsx` line 65, `side={isUrdu ? "left" : "right"}`); the new page has no side dependency (full-page route), so nothing to change there.
- CNIC + phone digits stay LTR within an RTL run — `unicode-bidi: plaintext` already applied on `input` elements in Iteration 6 polish. Verify at implementation.
- Section headings and labels anchor to the start side (Urdu = right, English = left) via existing `[dir=rtl]` cascade.
- Sticky bottom bar buttons: Save is the primary; in RTL it sits on the **start** (right) or **end** (left)? Owner call — default is **end side** (mirrors "OK/Cancel" native pattern in most Urdu UIs and matches existing Sheet close-button positioning).

---

## 6. Open Risks & Assumptions

| # | Risk / Assumption | Impact | Mitigation |
|---|---|---|---|
| R1 | Backend `/update-user` may reject some fields (`cnic`, `dob`) despite owner intent (Q1 rev 4). Contract doesn't enumerate mutable fields. | Save fails with 4xx | Backend confirmation required before shipping — flag `cnic` + `dob` explicitly. Frontend defensive: on 4xx naming an unknown field, show field-level error + keep other patches applied. |
| R2 | Multiple riders could share a phone across roles (a Customer + a Rider with same number is theoretically allowed by the frozen contract, where `phone`+`role` is the composite key). Route `/admin/riders/:phone/edit` assumes phone is unique among Rider role. | Wrong row loaded | Filter fetched list by `role === "Rider"` before match; if >1 match, show disambiguation UI (defer as follow-up if not observed in real data). |
| R3 | No `textarea` primitive in the surviving `ui/` set. | Address multiline UX degraded | Owner Q3-ish: accept single-line `Input` (frugal) OR pay the ~1 kB gzip cost of `npx shadcn add textarea` (H4-scoped). Recommend single-line. |
| R4 | No toast (`sonner`) in surviving `ui/`. | Success feedback modality | Use inline banner (already planned). Zero cost. |
| R5 | `phone` as a URL param exposes PII in browser history / server logs. Also contains characters that must be URL-encoded (leading `0`, dashes if user-formatted — but wire form is unhyphenated). | Privacy + routing fragility | Store phone in E.164-ish canonical form (`03011234567`), URL-encode on entry-point navigation, decode in the page. Consider `:riderId` instead (synthesised) — but `id` is mapper-synthesised and not stable across refetches. **Recommend accepting the phone-in-URL trade-off** and documenting in ADR follow-up. |
| R6 | Dirty-state route-change guard interacts with react-router 8 blocker API — we've never used it in this codebase. | Implementation risk | Frontend Dev spike before wiring. Fallback: `beforeunload` only (browser close/refresh guarded; in-app nav unguarded, with a lightweight Cancel-confirm dialog). |
| R7 | H2 tripwire — this page must not accept `Admin` or `Operator` as an editable `role` value even hypothetically. If Q5/Q6 lead to a role dropdown, restrict options to `Rider` only. | Security regression | Role stays read-only. |
| R8 | If Q4 (PIN reset) lands as "yes", we need a new endpoint. Design defers PIN entirely until endpoint exists. | Scope creep | Explicitly deferred in this plan. |
| R-doc-1 | **No backend endpoints exist** for documents or photos. §3.6/3.7/3.8 are designed against the proposed §8 contract. | Feature is empty/broken on live site until backend ships — S-05 / D32 replay. | MOCK-FIRST via MSW in dev; production build shows the "unavailable" state (§3.4). Do not merge to prod without backend commitment date. Track as new deferred-work item Dxx. |
| R-doc-2 | Max file size + accepted MIME types are owner-set (rev 8: 2 MB · PDF+JPG+PNG · JPG+PNG for `profile_photo`). Backend must enforce identical limits — mismatch causes accepted-then-rejected UX bugs. | Client accepts a file the backend rejects (or vice versa) → confusing error state. | §8.3 flags this for backend confirmation; MSW handlers must mirror the same limits authoritatively so dev testing catches drift. |
| R-doc-3 | Documents may contain PII (CNIC scans, ID photos) — downloads open in a new tab with a signed URL. If signed URLs are short-TTL, downloads may 403 after minutes. | User confusion on stale tabs. | Server issues signed URLs with a documented TTL (proposed 15 min in §9); client refetches list on 403. |
| R-doc-4 | Delete is destructive and irreversible. Admin could delete legally-required documents. | Compliance / audit risk. | AlertDialog confirm + server-side soft-delete (proposed) + Delete may be Admin-only (Operator sees list + view + download but not Delete). Owner call — new interview item. |
| R-doc-5 | Avatar photos are user-uploaded and could be inappropriate. No moderation flow proposed. | Reputational / HR issue. | Out-of-scope for v1; log an audit trail (proposed §9 `uploadedBy` field). |

---

## 7. Cost Line — shadcn primitives that would need adding

| Primitive | Needed for | Recommendation | Approx. gzip cost |
|---|---|---|---|
| `textarea` | Address multi-line | **SKIP** — use `Input` single-line | ~0.5 kB |
| `form` (react-hook-form + zod wrapper) | Consolidated validation wiring | **SKIP** — hand-rolled validation matches existing pages (RegisterPage, PendingRiders) | ~15 kB (rhf+zod) |
| `sonner` (toast) | Save success/error | **SKIP** — inline banner sufficient | ~3 kB |

**Recommended additions:** none. Ship with the existing 17 primitives — `avatar` is already present (§3.6) and progress bars in §3.8 are hand-rollable (~5 lines of Tailwind) or use the native `<progress>` element.

**Rev-2 note:** if the owner later wants a richer toast experience for upload-batch summaries, `sonner` becomes worthwhile — still under 3 kB. Defer until real usage proves inline banners are insufficient.

---

## 8. Proposed Backend Contract (NOT frozen — draft for backend team)

> ⚠️ **These endpoints do not exist yet.** Drafted in the backend's established style: `POST` + kebab-case + `phone`+`role` composite identifier + `credentials: "include"` cookie. Response envelopes mirror `get-all-riders`. Frontend will ship with **MSW handlers matching this shape as the living contract** (per ADR-0003 pattern) until the backend implements it. On production, before backend ships, sections §3.6-§3.8 render only their "unavailable" state (§3.4).

### 8.1 Avatar photo (rev 8 — SUPERSEDED: unified with profile_photo document)

**Rev 8 change:** the standalone avatar endpoint / `profile.photoUrl` field is **REMOVED**. Owner unified the avatar image and the `profile_photo` document — one concern, one storage location, one write path.

- ❌ **REMOVED:** `POST /upload-rider-photo` (was proposed rev 2 §8.1 Option B). Backend does NOT need to build this.
- ❌ **REMOVED:** `profile.photoUrl` field on `get-all-riders` / `get-all-inactive-riders` responses.
- ✅ **REPLACES with:** the avatar reads `documents[type="profile_photo"].downloadUrl` after `POST /get-rider-documents` (§8.2). If the type is absent from the response, the avatar shows initials (existing `AvatarFallback` behaviour — zero backend dependency for the fallback).
- ✅ **Writes** to the avatar go through `POST /upload-rider-document` with `type="profile_photo"` (§8.3). The camera icon on the avatar and the `[⬆ Upload Profile Photo]` button on the checklist row are two triggers for the same call.

**Net effect on backend workload:** one fewer endpoint to build.

### 8.2 List rider documents (rev 9 — `other` type added; optional `name` for Others)

```
POST /get-rider-documents
Body: { phone, role }
200:  { documents: [ { id, type, name?, filename, mimeType, sizeBytes, uploadedAt, uploadedBy, downloadUrl } ] }
404:  { success: false, error: "Rider not found" }
```

- **`type: DocumentType`** — one of `"cnic_front" | "cnic_back" | "profile_photo" | "bike_registration" | "driving_license" | "utility_bill" | "other"`. Server-enforced enum; unknown values must be rejected at write time so this response never carries them. **Rev 9:** `"other"` added.
- **`name?: string`** — user-supplied display name. **Required when `type="other"`** (server rejects `type="other"` uploads with a missing/empty `name`). Absent for the six fixed types (the frontend renders their i18n'd label from the enum). Trimmed, 1–40 chars, may contain any Unicode letter/digit/punct (Urdu/English/mixed acceptable).
- **`filename: string`** — the original filename of the uploaded file (e.g. `cnic-front.jpg`), used for downloads and displayed in confirm dialogs. Distinct from `name` (which is user-supplied and only present on Others). For fixed types, `filename` is the sole file-identity string. **Rev 9:** renamed from the ambiguous rev-8 `name` field to clearly separate "file's original filename" from "user's display name for an Other document".
- `id` — server-issued UUID.
- `downloadUrl` — signed URL (TTL 15 min recommended); `Content-Disposition: attachment; filename="<filename>"` on the object.
- `uploadedBy` — email/username of the Admin/Operator who uploaded.
- **One-per-type invariant (fixed types only):** for `type ∈ {cnic_front, cnic_back, profile_photo, bike_registration, driving_license, utility_bill}`, at most one document per rider. If server-side history exists for audit, only the current/live version is returned here. The frontend renders the newest by `uploadedAt` defensively and logs a warning if two arrive.
- **Others invariant:** multiple documents with `type="other"` are permitted per rider, but their normalized names (`name.trim().toLowerCase()`) must be unique per rider — the server rejects an upload that would create a duplicate normalized name unless the request is understood as a REPLACE (see §8.3).
- `mimeType` must be one of the allowlist below (§8.3).
- Live-backend empty variant (per ADR-0003 fn 11 precedent): `{ success: false, error: "No documents" }` accepted by api-client and translated to `{ documents: [] }`.

### 8.3 Upload rider document (rev 9 — adds `type="other"` + optional `name` in body)

```
POST /upload-rider-document
Content-Type: multipart/form-data
Body: phone, role, type, file, name?
200:  { success: true, document: { id, type, name?, filename, mimeType, sizeBytes, uploadedAt, uploadedBy, downloadUrl } }
400:  { success: false, error: "Invalid document type" }         // type not in enum
400:  { success: false, error: "Name required for type=other" }  // rev 9: type=other without name
400:  { success: false, error: "Name too long" }                 // rev 9: name > 40 chars
413:  { success: false, error: "File too large" }                // > 2 MB
415:  { success: false, error: "Unsupported file type" }         // MIME not in allowlist
```

- **Required body fields:** `phone`, `role`, `type`, `file`.
- **Optional body field `name`** — REQUIRED when `type="other"`, IGNORED when `type` is a fixed enum. Server trims + validates length (1–40 chars after trim). **Rev 9 new.**
- **UPSERT semantics:**
  - Fixed types: if a document of `type` already exists for `(phone, role)`, server **replaces** it (§R-doc-4 recommends soft-delete of the prior version).
  - `type="other"`: if a document with the same normalized `name` (`name.trim().toLowerCase()`) already exists for `(phone, role)`, server **replaces** it. Otherwise a new Other is appended.
  - The response's `document` reflects the live state after the operation. Same document id may be reused OR a new id issued (backend's call).
- **Size limit: 2 MB per file.** Server enforces authoritatively; 413 on breach.
- **MIME allowlist:**
  - For `type ∈ {cnic_front, cnic_back, bike_registration, driving_license, utility_bill, other}`: `application/pdf`, `image/jpeg`, `image/png`.
  - For `type = profile_photo`: `image/jpeg`, `image/png` (PDF is not a valid avatar; the upload control §3.8 does not offer `profile_photo` — this endpoint accepts it only via the avatar camera icon on §3.6).
  - 415 on breach.
- Progress reporting: standard `XMLHttpRequest.upload.onprogress` or `fetch` streaming — no extra endpoint needed.
- Client-side validation in §3.8.10 mirrors these limits; server is the source of truth.

### 8.4 Delete rider document

```
POST /delete-rider-document
Body: { phone, role, documentId }
200:  { success: true }
404:  { success: false, error: "Document not found" }
```

- **Prefer soft-delete server-side** for audit compliance (§R-doc-4).
- **Permission scope decision needed** — recommend Admin-only. Frontend hides the Delete button for Operator role.
- Unchanged from rev 2 apart from the section renumbering.

### 8.5 MSW mock plan (rev 9)

- Handlers live in `src/mocks/handlers/documents.ts`, registered in `handlers/index.ts`, endpoint URL constants imported from `src/api/riderDocuments.ts` (per H6).
- Seed each rider with a random subset of the six fixed types (e.g. 2–4 of 6 present) to exercise both Received and Missing states. Additionally seed 0–2 Others per rider with sample names ("Tax certificate", "Emergency contact") to exercise the Others rendering path.
- Every seeded document must carry a `type` field from the seven-value enum. Others must carry a non-empty `name`; fixed types must not carry `name` (they carry `filename` only).
- Upload handler: reads the multipart body including `type` and optional `name`.
  - For fixed `type`: if a document with that `type` already exists for the rider, **replaces** it (upsert); otherwise appends.
  - For `type="other"`: reject with 400 if `name` is missing / empty / > 40 chars after trim. If a document with the same normalized `name` (`name.trim().toLowerCase()`) already exists for the rider, **replaces** it (upsert by normalized name); otherwise appends.
  - Subsequent `get-rider-documents` reflects the change during the dev session.
- Enforce the 2 MB and MIME allowlist server-side in MSW so the frontend UX matches production behaviour.
- Delete handler: filters the in-memory array by `id` (works identically for fixed and Other types).
- No separate photo-upload handler needed (unified with document upload).

### 8.6 Production-gap handling (rev 8)

Until backend §8.2/§8.3/§8.4 ship, the frontend must handle absent endpoints gracefully:

- `getRiderDocuments()` on 404/network-error returns `null`; §3.7 renders the "Verification documents temporarily unavailable" notice; upload/replace/delete controls are hidden.
- Avatar falls back to initials whenever `documents[type="profile_photo"]` is absent — this is indistinguishable from the "unavailable" state on the current avatar, no new UI needed.
- Add a `local-docs/design/migration-plan.md` deferred-work entry: **Dxx — Rider document management (backend §8.2–§8.4 blocker; §8.1 avatar endpoint dropped in rev 8).**

### 8.7 Rider status transition (contract ASSUMPTION — needs backend confirmation)

Existing `/activate-rider` covers only `pending → active`. This page needs the four remaining transitions. Recommended shape (piggy-backs on frozen `/update-user`):

```
POST /update-user
Body: { phone, role, activationStatus: "active" | "blocked" | "offboarded" }
200:  { message, updatedFields: { activationStatus } }
4xx:  { message }
```

- Uses the frozen endpoint + composite identifier (`phone`+`role`); only novelty is that `activationStatus` becomes an accepted patch key.
- **Backend confirmation required:** is `activationStatus` a legal patch field? If not, backend team should propose an alternative (dedicated `/set-rider-status` endpoint, or per-transition endpoints like `/block-rider`, `/offboard-rider`).
- Field name: `activationStatus` in camelCase to match the api-client layer's flattening (see ADR-0003 mapper). Backend snake-case `activation_status` handled at the boundary — same as `/activate-rider` response today.

### 8.8 Reset rider PIN

```
POST /reset-rider-pin
Body: { phone, role }
200:  { success: true, pin: "483920" }
4xx:  { success: false, error: "..." }
```

- Server generates a cryptographically random 6-digit PIN, stores its hash, returns the plaintext ONCE in the response.
- Frontend never persists the plaintext PIN; the "new PIN" dialog (§3.10) is the only place it appears.
- Old PIN invalidated immediately (`/activate-rider` with the old PIN must fail from this point).
- Consider rate-limiting server-side (e.g. max 3 resets per rider per day) — flagged for backend.

---

## 9. Handoff Checklist (when interview answered)

- [x] Q1–Q10 answered by owner (rev 3)
- [x] Field list finalised (rev 6) — editable = `name`, `area`, `address`, `cnic`, `dob` (plus status via §3.9 + PIN via §3.10); read-only = `phone`, `role`, `joined`
- [ ] ADR-0002 route table amended with `/admin/riders/:phone/edit` (Admin OR Operator guard)
- [ ] ADR-0003 amended: `/update-user` row lists `name`, `area`, `address`, `cnic`, `dob`, `activationStatus` (assumed §8.7) as patch fields; new §§ for `/reset-rider-pin` (§8.8) and documents (§8.2–§8.4) added as PROPOSED (not frozen). **Rev 8:** `/upload-rider-photo` (§8.1) is DROPPED — unified into `/upload-rider-document` with `type="profile_photo"`. `profile.photoUrl` on `get-all-riders` also dropped.
- [ ] **Backend confirmation blockers** before merging to `main`:
    - [ ] §8.7 `/update-user activationStatus` accepted?
    - [ ] §8.8 `/reset-rider-pin` on the backend roadmap?
    - [ ] §8.2–§8.4 typed documents endpoints on the backend roadmap? (rev 9: `type` field REQUIRED, **seven-enum** — cnic_front, cnic_back, profile_photo, bike_registration, driving_license, utility_bill, **other**; upsert semantics on upload keyed by `type` for fixed types and by normalized `name` for Others; 2 MB cap; PDF+JPG+PNG allowlist — profile_photo restricted to JPG+PNG. Optional `name` in body REQUIRED for `type="other"`, ignored otherwise. Response gains `filename` — clearly distinct from user-supplied `name`.)
    - [ ] Confirm §8.1 unification: backend accepts `profile_photo` via the generic doc upload (not a separate photo endpoint)?
- [ ] Locale keys drafted under `riders.edit.*` in both en and ur (machine-draft for ur, owner review)
- [ ] Frontend Developer picks up implementation (this page is a **feature page** — production code out of my scope per H10 boundary rules)
- [ ] MSW handlers land for §3.7/§3.8/§3.9/§3.10 per §8.5 mock plan
- [ ] Production-gap fallback states (§3.4) all wired
- [ ] QA success criteria: Task success rate ≥ 90 % on "change area + save", ≥ 90 % on "block rider (confirm dialog)", ≥ 90 % on "reset PIN + copy new PIN"; time-on-task ≤ 60 s; SUS ≥ 75 on Admin + Operator flow

---

**End of plan.**
