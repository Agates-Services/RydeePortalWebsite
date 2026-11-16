# Rydee Portal — Frontend Guide

This guide explains how the Rydee Portal frontend is built, where everything lives and how to change it.
Read it once before you start; it takes about 15 minutes. The repository rules in `AGENTS.md` still apply on top of this guide.

## 1. What this project is

- A React + TypeScript website built with Vite and styled with Tailwind CSS.
- It is **only the frontend**. There is no backend or database code in this repository.
- All data comes from the Rydee backend API on AWS. The documented endpoints are in `docs/design/API-Document-V1.pdf`.
- For local work the project can run with **demo data** (Mock Service Worker, "MSW") so you do not need the real backend.

Three roles use the portal:

| Role | Home page | What they can do |
| --- | --- | --- |
| Admin | `/admin` | Everything: riders, rides and staff users (add, edit, disable, delete, block) |
| Operator | `/operator` | View riders and rides, add riders, edit rider and ride details. No deletes, no blocking, staff users are read-only |
| Rider | `/rider` | Own dashboard, own rides, own profile |

### Permissions in code

All Admin/Operator differences go through one function, `can(role, action)` in `src/lib/permissions.ts`.
To change what an Operator may do, edit the `OPERATOR_ALLOWED` list there; every screen follows it.

| Action | Admin | Operator | Where it is used |
| --- | --- | --- | --- |
| `manageStaffUsers` (add, edit, disable, delete staff) | Yes | No | Users page, edit page for staff users |
| `addRider` | Yes | Yes | "Add rider" button on All riders → `/admin/riders/new` |
| `editRider` | Yes | Yes | Edit rider page (Save) |
| `blockRider` (block, unblock, offboard, reactivate) | Yes | No | Edit rider page, status card |
| `deleteRider` | Yes | No | Edit rider page, "Delete account" card |
| `editRide` | Yes | Yes | Rides page, pencil button → edit panel |
| `deleteRide` | Yes | No | Rides page, bin button |

Route guards in `src/router.tsx` still decide which pages each role can open; `can()` decides which buttons appear on those pages.

## 2. Running it on your computer

You need Node.js 24 (LTS).

```bash
npm install
cp .env.example .env.local     # the default recipe uses demo data
npm run dev                    # open http://localhost:5173
```

Demo logins (only work with demo data):

| Role | Phone | Password |
| --- | --- | --- |
| Admin | 0300222222 | admin |
| Operator | 0300333333 | operator |
| Rider | 0300111111 | rider |

To use the real backend instead, follow recipe (b) or (c) in `.env.example`.

## 3. Checks you must run before every commit

```bash
npm run lint
npm run typecheck
npm run typecheck:strict
npm test
npm run build
```

All five must pass. GitHub runs the same checks on every pull request.

## 4. Folder map

```
src/
├── api/                 One file per backend area. Every endpoint URL and request lives here.
├── components/
│   ├── ui/              Generated shadcn primitives (buttons, inputs, dialogs). Do not edit.
│   ├── StatCard.tsx     Dashboard number card
│   ├── StatusBadge.tsx  Coloured status pill
│   ├── PageHeader.tsx   Page title + description + action buttons
│   └── EmptyState.tsx   Friendly "nothing here yet" block
├── features/            One folder per area of the portal (pages and their pieces)
│   ├── auth/            Login, register, session, route guards
│   ├── dashboards/      Admin/Operator dashboard, Rider dashboard, charts
│   ├── layout/          Sidebar and top bar shared by every signed-in page
│   ├── users/           Users list
│   ├── riders/          All riders, rider panel, edit rider, live map
│   ├── rides/           Rides list, ride detail, ride map
│   ├── account/         My profile and change password
│   ├── notifications/   Notifications page
│   └── errors/          Not found and error pages
├── i18n/locales/        All on-screen text: en.json (English) and ur.json (Urdu)
├── lib/                 Small helpers (environment checks, CSV, theme, initials)
├── mocks/handlers/      Demo data used when VITE_ENABLE_MSW=true
├── styles/theme.css     Design tokens (colours, radius, shadows)
├── types/               Shared TypeScript types (Profile, roles)
└── router.tsx           Every page address and who may open it
```

## 5. Design system

All colours are **tokens** defined once in `src/styles/theme.css`, with a light set under `:root` and a dark set under `.dark`. Never type a hex colour in a component; use the Tailwind class for the token instead.

| Token (Tailwind class) | Used for |
| --- | --- |
| `bg-background` | Page background (light grey) |
| `bg-card` | Cards, tables, panels (white) |
| `text-foreground` / `text-muted-foreground` | Main text / secondary text |
| `bg-primary`, `text-primary-text` | Brand teal-green: main buttons, links, active states |
| `bg-accent` / `text-accent-foreground` | Soft teal tint: hover states, avatars |
| `border-border` | All borders and dividers |
| `text-success` / `bg-success-muted` | Good states (active, completed) |
| `text-warning` / `bg-warning-muted` | Needs attention (pending, stalled) |
| `text-destructive` | Errors, blocked, canceled |
| `text-info` / `bg-info-muted` | Informational states (live, waiting) |
| `bg-sidebar`, `text-sidebar-foreground` | Navy sidebar and the login brand panel |
| `chart-1` … `chart-5`, `chart-completed`, `chart-canceled`, `chart-live`, `chart-upcoming` | Chart colours |
| `shadow-card` | The soft shadow every card uses |

Other rules:

- Corners: cards and tables use `rounded-xl`; buttons and inputs keep the shadcn defaults.
- Spacing: pages use `p-4 md:p-6 lg:p-8` and `gap-6` between sections.
- Font: Inter for text, JetBrains Mono for phone numbers, IDs and CNICs (`font-mono`).
- Dark mode and Urdu (right-to-left) must keep working. Use `ms-`/`me-`/`ps-`/`pe-`/`start`/`end` classes instead of `ml-`/`mr-`/`left`/`right`.

### Reusable pieces — use these instead of building new ones

| Component | When to use it |
| --- | --- |
| `PageHeader` | Top of a page: title, one-line description, optional buttons on the right |
| `StatCard` | A single number on a dashboard. Give it an `icon`, a `tone` and optionally `onClick` |
| `StatusBadge` | Any status pill. Pick a `tone`: `success`, `warning`, `danger`, `info`, `neutral`, `brand`, `scheduled` |
| `EmptyState` | Whenever a list or chart has nothing to show |
| `RIDER_STATUS_TONE` (`features/riders/constants.ts`) | Maps a rider status to the right badge tone |
| `initialsOf` (`lib/initials.ts`) | Turns a name into avatar initials |

## 6. Screens and the APIs they use

"Documented" means the endpoint is in `docs/design/API-Document-V1.pdf`. "Not documented" means the frontend calls it but it is not in that document; confirm with the backend team that it exists before release.

| Screen | Address | API calls | Documented? |
| --- | --- | --- | --- |
| Login | `/login` | `user-login` | Yes |
| Register / Add user | `/register`, `/admin/users/new` | `register-user` | Yes |
| Admin / Operator dashboard | `/admin`, `/operator` | `get-all-riders`, `get-all-users`, `get-rides`, `get-rides-summary` | Riders: yes. Users and rides: **no** |
| Users | `/admin/users` | `get-all-users` | **No** |
| Edit user / rider | `/admin/users/:phone/edit` | `get-all-riders`, `get-all-users`, `update-user`, `activate-rider`, rider-document calls | Riders, update, activate: yes. Users and documents: **no** |
| All riders (+ Pending, Blocked) | `/admin/all-riders` | `get-all-riders` | Yes |
| Live map | `/admin/active-riders` | `get-all-riders` (online riders with a location) | Yes |
| Rides / My rides | `/admin/rides`, `/rider/rides` | `get-rides` (the "All rides" tab calls it once per status and merges the results) | **No** |
| Ride detail | `/admin/rides/:id`, `/rider/rides/:id` | `get-ride` | **No** |
| Rider dashboard | `/rider` | `get-rides` | **No** |
| My profile | `/account/profile` | `update-user`, `change-password` | Update: yes. Change password: **no** |
| Notifications | `/notifications` | none yet (see section 7) | Not built on the backend |
| Add rider | `/admin/riders/new` | `register-user` (role `rider`) | Yes |
| Rider ride report (on the edit rider page) | `/admin/users/:phone/edit` | `get-rides` with `scope: "mine"` and the rider's phone, for each status | **No** |

Live screens (dashboard live rides, rides list, ride detail) refresh every 12 seconds (`LIVE_POLL_MS` in `src/api/rides.ts`).

## 7. Screens waiting for a backend API

These parts of the design are finished, but the backend does not provide their data yet. They show an empty state instead of fake numbers.

| Feature | Where the code waits | What to do when the API exists |
| --- | --- | --- |
| Notifications | `getNotifications()` in `src/api/notifications.ts` returns an empty list | Replace its body with a call to the new endpoint (example in the comment). The page in `features/notifications/` needs no change if the response matches `PortalNotification`. Add a matching demo handler in `src/mocks/handlers/`. |
| Weekly performance | Not shown; the dashboard has monthly performance only | Ask the backend to add weekly points to `get-rides-summary`, then add a chart next to `MonthlyPerformanceChart` in `features/dashboards/RidesCharts.tsx`. |
| Recent activity feed | Not shown | Needs an activity/event-history endpoint (the mobile app already sends events through `log-event`). |
| Delete staff user / delete rider | `deleteUser()` in `src/api/users.ts` throws `EndpointNotAvailableError` | Replace its body with the real call. The confirm dialogs and messages are already built. |
| Edit ride | `updateRide()` in `src/api/rides.ts` throws `EndpointNotAvailableError` | Replace its body with the real call; the edit panel sends `pickupLabel`, `dropoffLabel` and `fareAmount`. |
| Delete ride | `deleteRide()` in `src/api/rides.ts` throws `EndpointNotAvailableError` | Replace its body with the real call. |
| Disable / enable staff user | Uses the documented `update-user` with `activationStatus: "BLOCKED"` / `"ACTIVE"` | Confirm the backend also stops a BLOCKED Admin/Operator from logging in. |

Until then, these buttons show the message "This action needs the backend … API" instead of pretending to work.

## 8. How to do common tasks

### Add a new page

1. Create the page in its feature folder, for example `src/features/reports/ReportsPage.tsx`. Start it with `<PageHeader>`.
2. Register its address in `src/router.tsx`, inside the `ProtectedRoute` block for the roles that may open it.
3. Add its header title in `TITLE_KEYS` in `src/features/layout/DashboardLayout.tsx`.
4. If it needs a menu link, add it to `staffGroups` or `riderGroups` in `src/features/layout/AppSidebar.tsx`. The test in `tests/regression/wave4-rider-experience.test.tsx` checks the menu order, so update it too.
5. Add all text to both `src/i18n/locales/en.json` and `ur.json`.

### Connect a new API endpoint

1. Add the URL constant and a typed function in `src/api/<area>.ts`, using `post`/`get` from `src/api/client.ts`.
2. Add a demo handler in `src/mocks/handlers/<area>.ts` that imports the same URL constant.
3. Call your function from the page inside a `useEffect`, keep `loading`, `error` and `empty` states, and show `EmptyState` when there is no data.

### Export to CSV or PDF

- CSV: build rows with a `...ToExportRows()` helper and call `serializeCsv()` + `downloadCsv()` from `src/lib/csv.ts`.
- PDF: call `downloadTablePdf({ title, subtitle, summary, headers, rows, filename, numbered })` from `src/lib/pdf.ts`. It uses jsPDF and only loads it when someone exports.
- PDF text uses jsPDF's built-in font, which has no Urdu letters, so PDF titles and headings stay in English.
- Existing exports: Users (`features/users/csv.ts`), All riders (`features/riders/csv.ts`), Rides and the rider report (`features/rides/export.ts`).

### Add or change on-screen text

Never type text directly in a component. Add a key to `en.json` and the same key to `ur.json`, then use `t("your.key")`.

### Change a colour

Change the token value in `src/styles/theme.css` (both `:root` and `.dark`). Every screen updates automatically.

## 9. Things not to change without agreement

These come from `AGENTS.md`; QA blocks changes that break them.

- The request and response shape of `user-login` and the other API calls.
- The list of roles a user can be created with (`ROLES` in `src/types/profile.ts`). Never allow creating an Admin from the portal.
- The Customer demo user in `src/mocks/handlers/auth.ts` (tests depend on it).
- Anything inside `src/components/ui/`.
- Never commit a `.env` file.
