# API Audit — Portal vs `docs/design/API-Document.pdf`

**Date**: 2026-08-04 · **Auditor**: FE-StringInventory (delegated by SWE Team Lead) · **Scope**: `src/api/*.ts` + `src/mocks/handlers/*` cross-referenced against the PDF · **Mode**: READ-ONLY (no code changes; H1 contract frozen).

## Legend

- ✅ **implemented-and-matching** — code + mock match PDF path, body, response shape
- ⚠️ **implemented-with-mismatch** — endpoint present but request/response shape diverges
- ❌ **not-implemented** — PDF endpoint has no client call or MSW handler
- 📱 **mobile-only-N/A** — PDF marks it (or brief marks it) as mobile-app-only; portal not expected to implement

## Summary Table

| # | PDF Endpoint | Method | Path in code | Client fn | MSW handler | Status | One-line finding |
|---|---|---|---|---|---|---|---|
| 1 | `user-login` | POST | `/user-login` | `login()` in `src/api/auth.ts` | ✔ `authHandlers` | ✅ | Path + `{phone,password}` body + `{role,profile}` response match; `login()` adds a defensive title-case pass on `role` (fine, non-breaking). |
| 2 | `register-user` | POST | `/register-user` | `registerUser()` in `src/api/auth.ts` | ✔ `authHandlers` | ⚠️ | **Body superset**: our `RegisterPayload` requires `email` and `address` unconditionally; PDF only demands `name/phone/role/password` and adds `dob/address` for role=`rider`. `email` is not in the PDF at all. Not a wire mismatch (extra fields are ignored server-side), but the contract diverges from the doc — flag for owner. |
| 3 | `update-user` | POST | — | — | — | ❌ | **Not implemented in portal.** No `updateUser()` in `src/api/`, no MSW handler. Owner should decide if the web portal is expected to expose profile edits (would need a new ADR + client fn + handler). |
| 4 | `get-all-inactive-riders` | POST | `/get-all-inactive-riders` | `getUnregisteredRiders()` | ✔ `ridersHandlers` | ✅ | Path + no-body request + `{riders:[{role,profile}]}` envelope match; `flattenRider()` also aliases `dateOfJoining→joinedAt` for the UI mapper — additive, PDF-compatible. |
| 5 | `get-all-riders` | POST | `/get-all-riders` | `getAllRiders()` | ✔ `ridersHandlers` | ✅ | Same shape as #4; matches PDF. |
| 6 | `activate-rider` | POST | — | — | — | ❌ | **Not implemented in portal.** No client fn, no MSW handler, and no "Activate" call site in `PendingRiders`/`RiderProfileCard` (only local `activated` flag mapping). This is the single biggest functional gap for the admin flow. |
| 7 | `rider-login` | POST | — | — | — | 📱 | Mobile-only per owner brief — N/A for web portal. |
| 8 | `start-trip` | POST | — | — | — | 📱 | Mobile-only, PDF example TBD — N/A. |
| 9 | `end-trip` | POST | — | — | — | 📱 | Mobile-only, PDF example TBD — N/A. |
| 10 | `gps-update` | POST | — | — | — | 📱 | Mobile-only, PDF example TBD — N/A. |
| 11 | `ride-accept` | POST | — | — | — | 📱 | Mobile-only, PDF example TBD — N/A. |
| 12 | `go-online` | POST | — | — | — | 📱 | Mobile-only, PDF example TBD — N/A. |

## Cross-cutting findings

### F1 — Resource naming: no mismatch (AGENTS.md is stale)

The AGENTS.md hard-rule H1 documents `/user/login` and `/register/user`. **Real code uses PDF-matching dashed resources**: `/user-login`, `/register-user`, `/get-all-inactive-riders`, `/get-all-riders`. See `src/api/auth.ts:4-5` and `src/api/riders.ts:3-4`. Owner should either (a) update AGENTS.md H1 wording to match reality, or (b) confirm the dashed form is the canonical one and refresh ADR-0003's contract table. **This is a docs-vs-code drift, not a client-vs-backend drift.**

### F2 — `register-user` body has `email` field not in PDF

`RegisterPayload` in `src/api/auth.ts:12-20` mandates `email: string`. PDF example 3 does not include `email`. Backend will accept the extra field (JSON tolerant), but the portal will refuse to *send* a request without an email — meaning the portal cannot exercise the exact minimum PDF request. Owner call: is `email` a portal-only requirement, or should it be optional?

### F3 — Response `role` casing

PDF login response uses lowercase `"role": "customer"`. Portal `login()` title-cases it to `"Customer"` before returning to callers. Downstream `roleHome()` and `ProtectedRoute` rely on title-case, so this is deliberate normalization — not a bug, but worth calling out so a backend contract test doesn't fail on `"customer" !== "Customer"`.

### F4 — `activation_status` (snake_case) vs `activationStatus`

PDF `activate-rider` response's `updatedFields` uses `activation_status` (snake). Rider list responses use `activationStatus` (camel). Our `RiderProfile` interface in `src/mocks/handlers/riders.ts:15-16` supports **both** as optional fields, so we're safe either way. However, if we implement `activate-rider` client-side (see #6), the mapper must accept snake-case in that specific response path.

### F5 — `lastCustomerID` (uppercase D) inconsistency

PDF uses `lastCustomerID` (uppercase `ID`). Our seed uses `lastCustomerId` (camel) in `handlers/auth.ts` and `lastCustomerID` in `handlers/riders.ts`. If the field ever reaches UI code, the mapper must normalize. Currently unused downstream — low risk.

## Gap summary (for owner triage)

1. **`update-user`** — no client, no handler. Web-portal need? (probably yes for admin profile edits.)
2. **`activate-rider`** — no client, no handler, no UI trigger. This is the largest functional gap; PendingRiders shows pending riders but has no "Approve/Activate" action wired to the API.
3. **`register-user` body** — portal-mandated `email` field is not in the PDF; align spec or portal.
4. **AGENTS.md H1** — documents outdated `/user/login` + `/register/user`; real paths are `/user-login` + `/register-user` (matches PDF). Refresh needed.

None of the above require code changes now (H1 contract frozen). All are decisions for the owner; changes would need a new ADR + refresh of ADR-0003's contract table.
