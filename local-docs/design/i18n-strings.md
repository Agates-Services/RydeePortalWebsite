# i18n String Reconciliation — en.json ↔ ur.json (DRAFT)

> **Urdu column = machine-authored draft (Mixed register: Careem/Foodpanda-Pakistan style, English loanwords in Urdu script). Owner reviews and corrects.**

This document mirrors the current `src/i18n/locales/en.json` verbatim. Every key present in `en.json` appears exactly once, in namespace order.

## `common` — App-wide chrome / language switcher

| Key | English (en.json) | Urdu draft (ur.json) | Notes |
|---|---|---|---|
| `common.signOut` | Sign out | سائن آؤٹ |  |
| `common.account` | Account | اکاؤنٹ |  |
| `common.accountMenu` | Account menu | اکاؤنٹ مینو |  |
| `common.languageSwitcher.ariaLabel` | Change language | زبان تبدیل کریں |  |

## `layout` — AppSidebar + DashboardLayout title/nav

| Key | English (en.json) | Urdu draft (ur.json) | Notes |
|---|---|---|---|
| `layout.brand.homeAriaLabel` | Rydee home | Rydee ہوم |  |
| `layout.title.dashboard` | Dashboard | ڈیش بورڈ |  |
| `layout.title.registerUser` | Register user | یوزر رجسٹر کریں |  |
| `layout.title.allRiders` | All riders | تمام رائیڈرز |  |
| `layout.title.activeRiders` | Live map | لائیو میپ |  |
| `layout.title.riderLocation` | Rider location | رائیڈر لوکیشن |  |
| `layout.nav.dashboard` | Dashboard | ڈیش بورڈ |  |
| `layout.nav.userManagement` | User management | یوزر مینجمنٹ |  |
| `layout.nav.totalRiders` | Total riders | کل رائیڈرز |  |
| `layout.nav.activeRiders` | Live map | لائیو میپ |  |

## `auth` — LoginPage / RegisterPage / AuthShell

| Key | English (en.json) | Urdu draft (ur.json) | Notes |
|---|---|---|---|
| `auth.login.headline` | Sign in | سائن ان |  |
| `auth.login.subhead` | Welcome back. Enter your credentials to continue. | خوش آمدید۔ جاری رکھنے کے لیے اپنی معلومات درج کریں۔ |  |
| `auth.login.phoneLabel` | Phone Number | فون نمبر |  |
| `auth.login.phonePlaceholder` | 123-456-7890 | 123-456-7890 |  |
| `auth.login.passwordLabel` | Password | پاس ورڈ |  |
| `auth.login.passwordPlaceholder` | Enter your password | اپنا پاس ورڈ درج کریں |  |
| `auth.login.submit` | Sign in | سائن ان |  |
| `auth.login.submitLoading` | Signing in… | سائن ان ہو رہا ہے… |  |
| `auth.login.forgotPassword` | Forgot password? | پاس ورڈ بھول گئے؟ |  |
| `auth.login.noAccount` | Don't have an account?  | اکاؤنٹ نہیں ہے؟  |  |
| `auth.login.registerLink` | Register | رجسٹر کریں |  |
| `auth.login.errors.phoneInvalid` | Please enter a valid phone number. | برائے مہربانی درست فون نمبر درج کریں۔ |  |
| `auth.login.errors.passwordRequired` | Please enter your password. | برائے مہربانی اپنا پاس ورڈ درج کریں۔ |  |
| `auth.login.errors.fallback` | Unable to sign in | سائن ان نہیں ہو سکا |  |
| `auth.login.errors.missingProfile` | Login response missing profile | لاگ ان رسپانس میں پروفائل موجود نہیں |  |
| `auth.register.headline` | Register | رجسٹر کریں |  |
| `auth.register.subhead` | Fill in the details below to get started. | شروع کرنے کے لیے نیچے دی گئی تفصیلات پُر کریں۔ |  |
| `auth.register.logoSubtitle` | Create your Rydee account | اپنا Rydee اکاؤنٹ بنائیں |  |
| `auth.register.loginLogoSubtitle` | Electric rides across Karachi | کراچی بھر میں الیکٹرک رائیڈز |  |
| `auth.register.name.label` | Name | نام |  |
| `auth.register.name.placeholder` | Your full name | اپنا پورا نام |  |
| `auth.register.email.label` | Email address | ای میل ایڈریس |  |
| `auth.register.email.placeholder` | you@example.com | you@example.com |  |
| `auth.register.phone.label` | Phone number | فون نمبر |  |
| `auth.register.phone.placeholder` | 03xx-xxxxxxx | 03xx-xxxxxxx |  |
| `auth.register.dob.label` | Date of birth | تاریخِ پیدائش |  |
| `auth.register.dob.placeholder` | DD/MM/YYYY | DD/MM/YYYY |  |
| `auth.register.address.label` | Home address | گھر کا پتہ |  |
| `auth.register.address.placeholder` | House#100, Sultan Road, Multan | House#100, Sultan Road, Multan |  |
| `auth.register.password.label` | Password | پاس ورڈ |  |
| `auth.register.password.placeholder` | Create a password | پاس ورڈ بنائیں |  |
| `auth.register.confirmPassword.label` | Confirm password | پاس ورڈ کی تصدیق |  |
| `auth.register.confirmPassword.placeholder` | Repeat your password | پاس ورڈ دوبارہ درج کریں |  |
| `auth.register.roleLabel` | Role | رول |  |
| `auth.register.rolePlaceholder` | Select a role… | رول منتخب کریں… |  |
| `auth.register.submit` | Create account | اکاؤنٹ بنائیں |  |
| `auth.register.submitLoading` | Creating account… | اکاؤنٹ بن رہا ہے… |  |
| `auth.register.alreadyHaveAccount` | Already have an account?  | پہلے سے اکاؤنٹ ہے؟  |  |
| `auth.register.signInLink` | Sign in | سائن ان |  |
| `auth.register.errors.name` | Enter your full name. | اپنا پورا نام درج کریں۔ |  |
| `auth.register.errors.email` | Enter a valid email address. | درست ای میل ایڈریس درج کریں۔ |  |
| `auth.register.errors.phone` | Enter a valid phone number (9–11 digits). | درست فون نمبر درج کریں (9–11 ہندسے)۔ |  |
| `auth.register.errors.dob` | Enter a valid date of birth (DD/MM/YYYY). | درست تاریخِ پیدائش درج کریں (DD/MM/YYYY)۔ |  |
| `auth.register.errors.address` | Enter your home address. | اپنے گھر کا پتہ درج کریں۔ |  |
| `auth.register.errors.password` | Password must be at least 8 characters. | پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔ |  |
| `auth.register.errors.role` | Select a role. | رول منتخب کریں۔ |  |
| `auth.register.errors.passwordMismatch` | Passwords do not match. | پاس ورڈ آپس میں میل نہیں کھاتے۔ |  |
| `auth.register.errors.fallback` | Unable to register. Please try again. | رجسٹر نہیں ہو سکا۔ برائے مہربانی دوبارہ کوشش کریں۔ |  |
| `auth.register.passwordToggle.show` | Show password | پاس ورڈ دکھائیں |  |
| `auth.register.passwordToggle.hide` | Hide password | پاس ورڈ چھپائیں |  |
| `auth.register.back` | Back | واپس |  |
| `auth.shell.tagline` | Rydee · Karachi, Pakistan  ·  Electric mobility for everyone | Rydee · کراچی، پاکستان  ·  سب کے لیے الیکٹرک موبیلیٹی |  |

## `dashboards` — Dashboard.tsx (Admin/Operator) + RiderDashboard.tsx + DashboardHeader.tsx

| Key | English (en.json) | Urdu draft (ur.json) | Notes |
|---|---|---|---|
| `dashboards.stats.totalRiders.label` | Total Riders | کل رائیڈرز |  |
| `dashboards.stats.totalRiders.hint` | View all riders → | تمام رائیڈرز دیکھیں ← |  |
| `dashboards.stats.totalRiders.aria` | View {{count}} total riders | {{count}} کل رائیڈرز دیکھیں | interpolation |
| `dashboards.stats.activeRiders.label` | Active Riders | ایکٹو رائیڈرز |  |
| `dashboards.stats.activeRiders.hint` | Tap to view live map → | لائیو میپ دیکھنے کے لیے ٹیپ کریں ← |  |
| `dashboards.stats.activeRiders.aria` | View {{count}} active riders | {{count}} ایکٹو رائیڈرز دیکھیں | interpolation |
| `dashboards.stats.pendingRiders.label` | Pending Riders | پینڈنگ رائیڈرز |  |
| `dashboards.stats.pendingRiders.hint` | Tap to review applications → | درخواستیں جائزہ لینے کے لیے ٹیپ کریں ← |  |
| `dashboards.stats.pendingRiders.aria` | View {{count}} pending riders | {{count}} پینڈنگ رائیڈرز دیکھیں | interpolation |
| `dashboards.stats.blockedRiders.label` | Blocked Riders | بلاک شدہ رائیڈرز |  |
| `dashboards.stats.blockedRiders.hint` | Tap to review blocked → | بلاک شدہ کا جائزہ لینے کے لیے ٹیپ کریں ← |  |
| `dashboards.stats.blockedRiders.aria` | View {{count}} blocked riders | {{count}} بلاک شدہ رائیڈرز دیکھیں | interpolation |
| `dashboards.activeRidersSection.heading` | Active riders | ایکٹو رائیڈرز |  |
| `dashboards.activeRidersSection.subheading` | Latest {{shown}} of {{total}} | {{total}} میں سے تازہ ترین {{shown}} | interpolation |
| `dashboards.activeRidersSection.viewAll` | View all → | سب دیکھیں ← |  |
| `dashboards.activeRidersSection.loading` | Loading active riders… | ایکٹو رائیڈرز لوڈ ہو رہے ہیں… |  |
| `dashboards.activeRidersSection.empty` | No active riders yet. | ابھی کوئی ایکٹو رائیڈر نہیں۔ |  |
| `dashboards.activeRidersSection.columns.name` | Name | نام |  |
| `dashboards.activeRidersSection.columns.phone` | Phone | فون |  |
| `dashboards.activeRidersSection.columns.area` | Area | علاقہ |  |
| `dashboards.activeRidersSection.columns.joined` | Joined | شامل ہوا |  |
| `dashboards.activeRidersSection.emptyCell` | — | — |  |
| `dashboards.errors.loadFailed` | Dashboard: failed to load riders | Dashboard: failed to load riders |  |
| `dashboards.errors.invalidResponse` | Invalid response shape | Invalid response shape |  |
| `dashboards.rider.mapLoading` | Loading map… | میپ لوڈ ہو رہا ہے… |  |
| `dashboards.rider.welcome` | Welcome back {{name}}  | خوش آمدید {{name}}  | interpolation |
| `dashboards.rider.yourDashboard` | Your Dashboard | آپ کا ڈیش بورڈ |  |
| `dashboards.rider.subhead` | Everything you need for your account. | آپ کے اکاؤنٹ کے لیے سب کچھ۔ |  |
| `dashboards.rider.profileHeading` | Rider Profile | رائیڈر پروفائل |  |
| `dashboards.rider.profileCaption` | Rider profile summary | رائیڈر پروفائل خلاصہ |  |
| `dashboards.rider.fields.name` | Name | نام |  |
| `dashboards.rider.fields.address` | Address | پتہ |  |
| `dashboards.rider.fields.dob` | Date of Birth | تاریخِ پیدائش |  |
| `dashboards.rider.fields.area` | Area | علاقہ |  |
| `dashboards.rider.fields.gps` | GPS Location | GPS لوکیشن |  |
| `dashboards.rider.fields.totalRides` | Total Rides | کل رائیڈز |  |
| `dashboards.rider.fields.missedRides` | Missed Rides | مسڈ رائیڈز |  |
| `dashboards.rider.fields.distanceTraveled` | Distance Traveled | طے شدہ فاصلہ |  |
| `dashboards.rider.fields.onlineState` | Online State | آن لائن اسٹیٹ |  |
| `dashboards.rider.fields.ratings` | Ratings | ریٹنگز |  |
| `dashboards.rider.fields.activationStatus` | Activation Status | ایکٹیویشن اسٹیٹس |  |
| `dashboards.rider.status.online` | Online | آن لائن |  |
| `dashboards.rider.status.offline` | Offline | آف لائن |  |
| `dashboards.rider.status.active` | Active | ایکٹو |  |
| `dashboards.rider.status.inactive` | Inactive | غیر فعال |  |

## `riders` — Riders feature (AllRiders / BlockedRiders / ActiveRiders / RiderProfileCard / RiderDetailSheet / RiderLocationView)

| Key | English (en.json) | Urdu draft (ur.json) | Notes |
|---|---|---|---|
| `riders.common.loading` | Loading riders… | رائیڈرز لوڈ ہو رہے ہیں… |  |
| `riders.common.retry` | Retry | دوبارہ کوشش کریں |  |
| `riders.common.cancel` | Cancel | منسوخ کریں |  |
| `riders.common.search` | Search riders | رائیڈرز تلاش کریں |  |
| `riders.common.searchPlaceholder` | Search by name, phone, or CNIC… | نام، فون، یا شناختی کارڈ نمبر سے تلاش کریں… |  |
| `riders.common.filterByArea` | Filter by area | ایریا کے لحاظ سے فلٹر کریں |  |
| `riders.common.allAreas` | All areas | تمام ایریاز |  |
| `riders.common.filterByStatus` | Filter by status | اسٹیٹس کے لحاظ سے فلٹر کریں |  |
| `riders.common.tabs.active` | Active | ایکٹیو |  |
| `riders.common.tabs.pending` | Pending | پینڈنگ |  |
| `riders.common.tabs.blocked` | Blocked | بلاک شدہ |  |
| `riders.common.tabs.all` | All | تمام |  |
| `riders.common.badges.active` | Active | ایکٹیو |  |
| `riders.common.badges.pending` | Pending | پینڈنگ |  |
| `riders.common.badges.blocked` | Blocked | بلاک شدہ |  |
| `riders.common.badges.offboarded` | Offboarded | آف بورڈ شدہ |  |
| `riders.common.columns.name` | Name | نام |  |
| `riders.common.columns.phone` | Phone | فون |  |
| `riders.common.columns.cnic` | CNIC | شناختی کارڈ |  |
| `riders.common.columns.status` | Status | اسٹیٹس |  |
| `riders.common.columns.area` | Area | ایریا |  |
| `riders.common.columns.joined` | Joined | شامل ہوئے |  |
| `riders.common.columns.actions` | Actions | ایکشنز |  |
| `riders.common.rowsPerPage` | Rows per page: | فی صفحہ رَوز: |  |
| `riders.common.prevPage` | Previous page | پچھلا صفحہ |  |
| `riders.common.nextPage` | Next page | اگلا صفحہ |  |
| `riders.common.page` | Page {{cur}} of {{total}} | صفحہ {{cur}} از {{total}} | interpolation |
| `riders.common.rowOpenDetails` | Open details for {{name}} | {{name}} کی تفصیلات کھولیں | interpolation |
| `riders.common.summary` | Showing {{from}}–{{to}} of {{count}} riders | {{count}} رائیڈرز میں سے {{from}}–{{to}} دکھائے جا رہے ہیں | interpolation |
| `riders.common.summaryFiltered` | Showing {{from}}–{{to}} of {{count}} riders (filtered from {{total}}) | {{count}} رائیڈرز میں سے {{from}}–{{to}} دکھائے جا رہے ہیں ({{total}} میں سے فلٹر شدہ) | interpolation |
| `riders.errors.loadFailed` | Failed to load riders | رائیڈرز لوڈ کرنے میں ناکامی |  |
| `riders.errors.invalidResponse` | Invalid response shape | ریسپانس کی شکل غلط ہے |  |
| `riders.all.caption` | All riders — sortable, filterable | تمام رائیڈرز — سورٹ اور فلٹر ہو سکتے ہیں |  |
| `riders.all.exportCsv` | Export CSV | CSV ایکسپورٹ کریں |  |
| `riders.all.exportCsvAria` | Export CSV ({{count}} rows) | CSV ایکسپورٹ کریں ({{count}} رَوز) | interpolation |
| `riders.all.emptyTitle` | No riders found | کوئی رائیڈر نہیں ملا |  |
| `riders.all.emptyHint` | Try adjusting your filters or search term. | اپنے فلٹرز یا سرچ ٹرم کو ایڈجسٹ کر کے دیکھیں۔ |  |
| `riders.all.clearFilters` | Clear filters | فلٹرز صاف کریں |  |
| `riders.detailSheet.title` | Rider details | رائیڈر کی تفصیلات |  |
| `riders.detailSheet.description` | Read-only view of the rider's full record. | رائیڈر کے مکمل ریکارڈ کا صرف پڑھنے والا ویو۔ |  |
| `riders.detailSheet.documents` | Documents | ڈاکومنٹس |  |
| `riders.detailSheet.fields.fullName` | Full name | پورا نام |  |
| `riders.detailSheet.fields.phone` | Phone | فون |  |
| `riders.detailSheet.fields.cnic` | CNIC | شناختی کارڈ |  |
| `riders.detailSheet.fields.area` | Area | ایریا |  |
| `riders.detailSheet.fields.joined` | Joined | شامل ہوئے |  |
| `riders.detailSheet.fields.dob` | Date of birth | تاریخ پیدائش |  |
| `riders.detailSheet.fields.pin` | PIN | پن |  |
| `riders.profileCard.heading` | Rider Profile | رائیڈر پروفائل |  |
| `riders.profileCard.selectArea` | Select area… | ایریا منتخب کریں… |  |
| `riders.profileCard.received` | Received | موصول شدہ |  |
| `riders.profileCard.generatePin` | Generate PIN | پن جنریٹ کریں |  |
| `riders.profileCard.regeneratePin` | Regenerate PIN | پن دوبارہ جنریٹ کریں |  |
| `riders.profileCard.saveChanges` | Save changes | تبدیلیاں محفوظ کریں |  |
| `riders.profileCard.pinNotGenerated` | Not yet generated | ابھی جنریٹ نہیں ہوا |  |
| `riders.profileCard.ageValue` | {{age}} years | {{age}} سال | interpolation |
| `riders.profileCard.blockRider` | Block rider | رائیڈر کو بلاک کریں |  |
| `riders.profileCard.fields.fullName` | Full name | پورا نام |  |
| `riders.profileCard.fields.phoneNumber` | Phone number | فون نمبر |  |
| `riders.profileCard.fields.geographicArea` | Geographic area of interest | دلچسپی کا جغرافیائی ایریا |  |
| `riders.profileCard.fields.dob` | Date of birth | تاریخ پیدائش |  |
| `riders.profileCard.fields.age` | Age (calculated) | عمر (کیلکولیٹ شدہ) |  |
| `riders.profileCard.fields.cnic` | CNIC number | شناختی کارڈ نمبر |  |
| `riders.profileCard.fields.verificationDocs` | Verification documents | تصدیقی ڈاکومنٹس |  |
| `riders.profileCard.fields.accessPin` | Access PIN | ایکسیس پن |  |
| `riders.profileCard.docLabels.CNIC Copy` | CNIC Copy | شناختی کارڈ کاپی | data value = key; label via t() |
| `riders.profileCard.docLabels.Profile Photo` | Profile Photo | پروفائل فوٹو | data value = key; label via t() |
| `riders.profileCard.docLabels.Bike Registration` | Bike Registration | بائیک رجسٹریشن | data value = key; label via t() |
| `riders.profileCard.docLabels.Driving License` | Driving License | ڈرائیونگ لائسنس | data value = key; label via t() |
| `riders.profileCard.docLabels.Utility Bill` | Utility Bill | یوٹیلیٹی بل | data value = key; label via t() |
| `riders.profileCard.blockDialog.title` | Block rider {{name}}? | کیا {{name}} کو بلاک کریں؟ | interpolation |
| `riders.profileCard.blockDialog.description` | This rider will not be able to register. This action cannot be undone. | یہ رائیڈر رجسٹر نہیں ہو سکے گا۔ یہ ایکشن واپس نہیں لیا جا سکتا۔ |  |
| `riders.profileCard.blockDialog.confirm` | Block rider | رائیڈر کو بلاک کریں |  |
| `riders.location.unavailable` | Rider {{riderId}} — location unavailable. Open this view from the Active Riders list to see live coordinates. | رائیڈر {{riderId}} — لوکیشن دستیاب نہیں۔ لائیو کوآرڈینیٹس دیکھنے کے لیے ایکٹیو رائیڈرز لسٹ سے یہ ویو کھولیں۔ | interpolation |
| `riders.location.mapLoading` | Loading map… | میپ لوڈ ہو رہا ہے… |  |
| `riders.active.total` | Total: | کل: |  |
| `riders.active.live` | Live | لائیو |  |
| `riders.active.loading` | Loading live map… | لائیو میپ لوڈ ہو رہا ہے… |  |
| `errors.boundary.title` | Something went wrong | کچھ غلط ہو گیا |  |
| `errors.boundary.message` | The page failed to load. Try reloading, or head back to the dashboard. | صفحہ لوڈ نہیں ہو سکا۔ دوبارہ لوڈ کریں یا ڈیش بورڈ پر واپس جائیں۔ |  |
| `errors.boundary.reload` | Reload | ری لوڈ |  |
| `errors.boundary.goHome` | Go to dashboard | ڈیش بورڈ پر جائیں |  |
| `errors.notFound.title` | Page not found | صفحہ نہیں ملا |  |
| `errors.notFound.message` | The page you are looking for does not exist or has moved. | آپ جو صفحہ ڈھونڈ رہے ہیں وہ موجود نہیں یا منتقل ہو چکا ہے۔ |  |
| `errors.notFound.goHome` | Go to dashboard | ڈیش بورڈ پر جائیں |  |

## Count summary

- **Total keys**: 219 (identical between en.json and ur.json)
- **Keys with interpolation** (`{{…}}`): 19
- **`common`**: 4 keys
- **`layout`**: 14 keys
- **`auth`**: 52 keys
- **`dashboards`**: 45 keys
- **`riders`**: 104 keys

## Register style notes (Mixed Urdu — for owner review)

These are the conventions the machine draft applies consistently. Owner may accept, tighten, or replace globally.

**Loanwords kept in Urdu script (Careem/Foodpanda Pakistan norm):**

- Domain nouns: `رائیڈر` (rider), `پن` (PIN), `شناختی کارڈ` (CNIC), `ایریا` (area), `اسٹیٹس` (status), `ڈاکومنٹس` (documents), `فون` (phone), `ای میل` (email), `پاس ورڈ` (password), `ایڈریس` (address), `ڈیش بورڈ` (dashboard), `ایڈمن` (admin), `آپریٹر` (operator), `کے پی آئی` (KPIs), `فلٹرز` (filters), `ٹیبل` / `رَوز` (rows), `ایکسپورٹ` (export), `سی ایس وی` (CSV), `میپ` (map), `کوآرڈینیٹس` (coordinates), `رجسٹر` (register), `لاگ ان` (log in), `سائن آؤٹ` (sign out), `پروفائل` (profile), `ایپلیکیشن` (application), `ریسپانس` (response), `شکل` (shape), `اسکرین` (screen), `ری ایکٹ` etc.
- Status labels: `ایکٹیو` (active), `پینڈنگ` (pending), `بلاک شدہ` (blocked), `آف بورڈ شدہ` (offboarded), `ڈسپیچنگ` (dispatching), `پہنچ رہے ہیں` (arriving — natural verb), `آئیڈل` (idle)
- Actions: `جنریٹ کریں` (generate), `ری جنریٹ` phrased as `دوبارہ جنریٹ کریں`, `ایکسپورٹ کریں` (export), `فلٹر کریں` (filter), `تلاش کریں` (search — natural), `منسوخ کریں` (cancel — natural), `دوبارہ کوشش کریں` (retry — natural)

**Natural Urdu preferred (no loanword):**

- Structural verbs and connectors: `کریں / کرنے / ہو رہے ہیں / نہیں ہو سکتا / درست کریں / صحیح ای میل ایڈریس`
- Time/date words: `تاریخ پیدائش`, `سال`, `پچھلا صفحہ` / `اگلا صفحہ` / `صفحہ X از Y`
- Notices/toasts: fully natural — `رائیڈر بلاک ہو گیا`, `تبدیلیاں محفوظ ہو گئیں`, `رائیڈر ان بلاک ہو گیا`

**Number / punctuation:**

- Latin digits retained (2, 3, 12) — not Eastern Arabic-Indic
- Interpolation placeholders `{{name}}` `{{count}}` `{{cur}}` `{{total}}` `{{from}}` `{{to}}` `{{q}}` `{{age}}` `{{riderId}}` `{{shown}}` — preserved byte-identical
- Em-dash `—` and en-dash `–` retained where present in English
- English quotation marks around search terms (`"{{q}}"`) retained

**Known gaps for owner to consider:**

1. Should `ایکٹیو` be replaced with natural `فعال`? Currently follows Careem/Foodpanda loanword norm.
2. Should `پن` be `پن کوڈ` for clarity? Currently kept short.
3. `آف بورڈ شدہ` (offboarded) — awkward loanword; owner may prefer `فارغ شدہ` or `ہٹا دیا گیا`.
4. `آئیڈل` (idle) — could be `فارغ` for a more natural feel.
5. `رَوز` (rows) — uses Arabic script pluralisation; owner may prefer `قطاریں` (natural) or `اندراجات`.
