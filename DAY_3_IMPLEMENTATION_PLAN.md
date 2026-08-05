# Match MVP — Day 3 Implementation Plan

> سند اجرایی قابل تحویل به GPT/Codex برای تکمیل کامل Day 3
>
> منبع حقیقت محصول: `Match MVP Product Requirements Document.pdf`، بخش‌های 4، 5.2، 10، 12.2، 14 و 15.2
>
> آخرین تطبیق با repository: 2026-08-05 — Asia/Tehran

**وضعیت اجرا:** Day 3 کامل، commit و push شده است. این فایل سند تاریخی تصمیم‌ها و acceptance criteria روز سوم باقی می‌ماند. توسعه فعلی Day 4 را کامل کرده و نقطه شروع بعدی Day 5 است؛ وضعیت زنده در `PROJECT_HANDOFF.md` ثبت می‌شود.

---

## 0. Prompt آماده برای GPT بعدی

متن زیر را همراه این فایل، `PROJECT_HANDOFF.md` و PRD برای GPT بعدی بفرست:

```text
You are continuing the existing Match MVP repository at:
/Users/dorsazabeti/match-mvp

Read these files completely before changing code:
1. PROJECT_HANDOFF.md
2. DAY_3_IMPLEMENTATION_PLAN.md
3. Match MVP Product Requirements Document.pdf
4. AGENTS.md

Implement Day 3 completely, following the execution order and acceptance criteria in
DAY_3_IMPLEMENTATION_PLAN.md. Preserve the current Expo + FastAPI + PostgreSQL +
SQLAlchemy + Alembic + Zustand architecture. Do not migrate to Supabase, do not create
app/index.tsx, do not add a dashboard, and do not rewrite working Day 1/Day 2 flows.

Before Expo code, read the exact Expo SDK 54 documentation required by AGENTS.md.
Before every major change, explain the reason and affected files. Use real PostgreSQL
records and real authenticated API calls; no mocked success states. Review migration SQL
before applying it. Run TypeScript/backend/API tests after every meaningful step, update
PROJECT_HANDOFF.md and this plan, and create checkpoint commits. Do not stop at code/build
success: verify the complete Publisher onboarding on a mobile-width UI and, when possible,
Expo Go on the physical phone.
```

---

## 1. آیا Day 2 تمام شده است؟

بله، از نظر محصول و قابلیت‌ها Day 2 تمام شده است:

- Login واقعی با JWT
- Registration واقعی با email/password و `display_name`
- session persistence با Secure Store روی موبایل
- Role Selection
- Business onboarding
- Publisher onboarding اولیه
- اتصال واقعی Expo به FastAPI و PostgreSQL
- routing بدون `app/index.tsx`
- تم راست‌چین، mobile-first و الهام‌گرفته از جریان

آخرین commit کامل Day 2 و registration:

```text
6fcba30 Complete authentication persistence and registration flow
```

### وضعیت hotfix نهایی Day 2

رفع timeout شبکه روی گوشی انجام، تست، commit و push شده است. فایل‌های آن:

```text
.env.example
src/services/api.ts
PROJECT_HANDOFF.md
```

علت timeout، استفادهٔ frontend از IP قدیمی بود. IP پیش‌فرض به `10.215.160.133` تغییر کرده و `EXPO_PUBLIC_API_URL` پشتیبانی می‌شود.

```text
5a9277f some fixes
```

در نتیجه هیچ قابلیت یا hotfixی از Day 2 باقی نمانده و کار بعدی مستقیماً Checkpoint 1 از Day 3 است.

---

## 2. هدف دقیق Day 3 طبق PRD

متن برنامهٔ PRD برای Day 3:

```text
Publisher platform accounts, media plans, interests, capabilities;
discoverability validation.
```

جریان Publisher onboarding طبق PRD:

1. کاربر `public_name`، شهر، bio و avatar اختیاری را وارد می‌کند.
2. حداقل یک Platform Account با platform، handle/URL و follower count اضافه می‌کند.
3. حداقل یک Media Plan با content type و standard rate اضافه می‌کند.
4. حداقل سه Personal Interest انتخاب می‌کند.
5. حداقل یک Content Capability انتخاب می‌کند.
6. فقط پس از عبور از تمام شرایط، PublisherProfile به `DISCOVERABLE` تبدیل می‌شود.
7. بعداً صفحهٔ Discover باز می‌شود؛ اما ساخت Discover tab جزو Day 3 نیست.

### تعریف خروجی Day 3

Day 3 فقط وقتی تمام است که یک Publisher واقعی بتواند:

```text
Login/Register
  → Role=PUBLISHER
  → Base Profile
  → Add Platform Account
  → Add Media Plan
  → Select 3+ Interests
  → Select 1+ Capabilities
  → Server marks profile DISCOVERABLE
  → App shows completion summary
```

تمام داده‌ها باید در PostgreSQL ذخیره و پس از refresh/relogin بازیابی شوند.

---

## 3. محدودیت‌ها و تصمیم‌های معماری

- معماری فعلی FastAPI/PostgreSQL حفظ شود؛ پیشنهاد Supabase در PRD جایگزین معماری موجود نشود.
- client مستقیماً discoverability را تعیین نمی‌کند؛ server منبع حقیقت است.
- تمام عملیات فقط برای owner احراز هویت‌شده انجام شود.
- JSONهای legacy در `publisher_profiles` فعلاً حذف نشوند تا دادهٔ Day 2 و migration امن بماند.
- دادهٔ نرمال‌شدهٔ Day 3 منبع حقیقت جدید است.
- `app/index.tsx` ساخته نشود.
- dashboard، Discover tab، Offer و قابلیت‌های Day 4 وارد scope نشوند.
- برای state سرور فعلاً dependency بزرگ React Query اضافه نشود؛ services فعلی و state محلی صفحه برای deadline کافی است.
- فرم‌ها RTL، mobile-first، با touch target حداقل 44pt و theme موجود باشند.
- avatar اختیاری است. اگر storage واقعی هنوز وجود ندارد، فقط `avatar_url` nullable پشتیبانی شود؛ upload جعلی نساز.
- verification شبکهٔ اجتماعی سبک است: profile URL و وضعیت؛ API شبکهٔ اجتماعی لازم نیست.
- verification نباید شرط discoverability باشد؛ PRD API-based verification را الزامی نمی‌داند.
- currency یک مقدار deployment-level است. برای pilot فعلی یک مقدار ثابت backend تنظیم شود و user در onboarding currency انتخاب نکند. مقدار نهایی با تنظیمات پروژه مشخص شود؛ از float برای پول استفاده نشود.

### بدهی خارج از Day 3

PRD اجازهٔ هر دو role برای یک User را می‌دهد، اما مدل فعلی فقط یک `role` دارد. این تغییر دامنهٔ گسترده‌ای دارد و نباید وسط Day 3 انجام شود. در handoff به‌عنوان debt باقی بماند.

---

## 4. وضعیت فعلی که باید حفظ شود

مدل فعلی `PublisherProfile` این فیلدها را دارد:

```text
id
user_id
bio
city
platforms                 JSON legacy
followers_count           legacy
content_capabilities      JSON legacy
personal_interests        JSON legacy
created_at
updated_at
```

صفحهٔ فعلی `app/(onboarding)/publisher.tsx` همهٔ داده‌ها را در یک فرم comma-separated می‌گیرد. این صفحه باید به مرحلهٔ Base Profile تبدیل شود و مراحل بعدی در screenهای جدا اضافه شوند.

API فعلی:

```text
POST /api/v1/profiles/publisher
GET  /api/v1/profiles/publisher/me
```

مشکل شناخته‌شده: کاربر دارای profile بعد از login دوباره به create profile می‌رود. Day 3 باید resume routing را با onboarding status حل کند.

---

## 5. طراحی دیتابیس Day 3

همهٔ identifierها UUID، timestampها timezone-aware و mutable tableها دارای `created_at` و `updated_at` باشند.

### 5.1 تغییر `publisher_profiles`

فیلدهای زیر اضافه شوند:

| Field | Type | Rule |
|---|---|---|
| `public_name` | `String(120)` | برای رکورد قدیمی nullable؛ API جدید required |
| `avatar_url` | `String(500)` | nullable |
| `discoverable` | `Boolean` | non-null، server default false |
| `status` | `String(20)` | `ACTIVE` یا `BLOCKED`، default `ACTIVE` |

نکات migration:

- `public_name` برای رکوردهای موجود از `users.display_name` backfill شود، اگر موجود است.
- اگر display name موجود نیست، null بماند و onboarding status مرحلهٔ profile را incomplete نشان دهد.
- JSONهای legacy حذف نشوند.
- `discoverable` برای تمام رکوردهای قبلی ابتدا false باشد.

### 5.2 جدول `platform_accounts`

| Field | Type / Constraint |
|---|---|
| `id` | UUID PK |
| `publisher_id` | FK → `publisher_profiles.id`, non-null |
| `platform` | constrained string |
| `handle` | `String(120)`, non-empty |
| `profile_url` | `String(500)`, valid HTTP/HTTPS URL |
| `followers_count` | Integer, `>= 0` |
| `verification_status` | `UNVERIFIED/PENDING/VERIFIED/REJECTED` |
| `status` | `ACTIVE/INACTIVE` |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

Constraints/indexes:

- unique روی `(publisher_id, platform, handle)`
- index روی `(publisher_id, status)`
- index روی `(platform, status)` برای recommendationهای آینده
- DB check برای follower count غیرمنفی

Platformهای pilot به‌صورت typed constants:

```text
INSTAGRAM
TELEGRAM
YOUTUBE
RUBIKA
BALE
EITAA
OTHER
```

### 5.3 جدول `media_plans`

| Field | Type / Constraint |
|---|---|
| `id` | UUID PK |
| `publisher_id` | FK → publisher profile |
| `platform_account_id` | FK → platform account |
| `content_type` | constrained string |
| `price` | `Numeric(14,2)`, greater than zero |
| `currency` | `String(3)`, deployment currency |
| `typical_views` | nullable Integer, `>= 0` |
| `active` | Boolean, default true |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

Content typeهای pilot:

```text
POST
STORY
REEL
VIDEO
SHORT_VIDEO
LIVE
UGC
```

Constraints/indexes:

- unique active combination برای publisher/platform account/content type
- index روی `(publisher_id, active)`
- `price > 0`
- `typical_views IS NULL OR typical_views >= 0`
- service باید بررسی کند platform account متعلق به همان publisher است.

برای مقادیر پولی از `Decimal` در Python و string/number کنترل‌شده در JSON استفاده شود؛ هیچ محاسبه‌ای با float انجام نشود.

### 5.4 جدول `categories`

طبق PRD Interests به category مرتبط‌اند:

| Field | Type / Constraint |
|---|---|
| `id` | UUID PK |
| `name` | localized/display name |
| `slug` | unique stable identifier |
| `parent_id` | nullable self FK |
| `active` | Boolean |

برای pilot حداقل categoryهای ثابت seed شوند، مانند:

```text
food, travel, beauty, fashion, technology, gaming,
fitness, education, finance, home, parenting, entertainment
```

نام نمایشی فارسی می‌تواند در response options برگردد؛ slug باید stable و انگلیسی باشد.

### 5.5 جدول `publisher_interests`

```text
publisher_id  FK
category_id   FK
created_at
PRIMARY KEY (publisher_id, category_id)
```

حداقل سه category فعال برای discoverability لازم است.

### 5.6 جدول `publisher_capabilities`

```text
publisher_id  FK
capability    constrained string
created_at
PRIMARY KEY (publisher_id, capability)
```

Capabilityهای pilot:

```text
REVIEW
TUTORIAL
UGC
NEWS
LIFESTYLE
UNBOXING
INTERVIEW
```

حداقل یک مورد برای discoverability لازم است.

### 5.7 حذف منطقی

- DELETE کردن Platform Account باید آن را `INACTIVE` کند.
- DELETE کردن Media Plan باید `active=false` کند.
- رکوردی که در آینده توسط Recommendation/Deal referenced شود hard-delete نشود.

---

## 6. Migration Plan

یک Alembic revision روشن و قابل rollback بساز، مثلاً:

```text
add_publisher_onboarding_entities
```

ترتیب migration:

1. ستون‌های جدید PublisherProfile
2. Categories
3. PlatformAccounts
4. MediaPlans
5. PublisherInterests
6. PublisherCapabilities
7. indexes و check constraints
8. seed categoryهای pilot
9. backfill `public_name`
10. پایان با `discoverable=false` برای رکوردهای قدیمی

قبل از apply:

```bash
python3 -m alembic -c alembic.ini heads
python3 -m alembic -c alembic.ini current
python3 -m alembic -c alembic.ini upgrade head --sql
```

SQL تولیدی را کامل بررسی کن. سپس:

```bash
python3 -m alembic -c alembic.ini upgrade head
python3 -m alembic -c alembic.ini current
```

حتماً modelهای جدید در `backend/app/models/__init__.py` import شوند. `backend/migrations/env.py` نیز باید تمام metadata مدل‌ها را load کند؛ import فعلی فقط `User` است و باید بدون تغییر معماری اصلاح شود.

Downgrade باید جدول‌ها و indexها را در ترتیب معکوس حذف کند و سپس ستون‌های جدید را بردارد. داده‌های legacy دست‌نخورده می‌مانند.

---

## 7. Backend File Plan

### فایل‌های مدل جدید

```text
backend/app/models/platform_account.py
backend/app/models/media_plan.py
backend/app/models/category.py
backend/app/models/publisher_interest.py
backend/app/models/publisher_capability.py
```

### schemaهای جدید

```text
backend/app/schemas/publisher_onboarding.py
```

شامل:

- enum/Literalهای platform، content type، capability، status
- create/update/response PlatformAccount
- create/update/response MediaPlan
- InterestsUpdate
- CapabilitiesUpdate
- PublisherProfileUpdate
- PublisherOnboardingOptionsResponse
- PublisherOnboardingStatusResponse

Pydantic validation:

- trim تمام stringها
- URL فقط HTTP/HTTPS
- handle خالی ممنوع
- followers و views غیرمنفی
- price مثبت
- حداقل سه interest در PUT
- حداقل یک capability در PUT
- duplicate valueها قبل از DB حذف یا reject شوند
- UUID نامعتبر → 422

### repository جدید

```text
backend/app/repositories/publisher_onboarding_repository.py
```

فقط query/persistence انجام دهد:

- get profile by current user
- list/get/create/update platform account
- list/get/create/update media plan
- replace/list interests
- replace/list capabilities
- count active requirements
- list active categories

### service جدید

```text
backend/app/services/publisher_onboarding_service.py
```

منطق domain:

- require current role PUBLISHER
- require existing publisher profile
- owner check برای هر id
- جلوگیری از duplicate
- جلوگیری از media plan روی account متعلق به شخص دیگر یا inactive
- replace preferences در transaction
- محاسبهٔ discoverability بعد از هر mutation
- rollback در هر خطا
- تولید onboarding status و `next_step`

### router جدید

```text
backend/app/api/v1/profiles/publisher_onboarding_router.py
```

به router فعلی profiles include شود تا URLها زیر `/api/v1/profiles/publisher` بمانند.

router فقط HTTP orchestration و mapping خطا انجام دهد؛ business logic داخل service باشد.

---

## 8. API Contract دقیق Day 3

### Base profile

```text
GET   /api/v1/profiles/publisher/me
PATCH /api/v1/profiles/publisher/me
```

PATCH fields:

```json
{
  "public_name": "نام عمومی ناشر",
  "bio": "معرفی کوتاه",
  "city": "تهران",
  "avatar_url": null
}
```

### Onboarding options

```text
GET /api/v1/profiles/publisher/onboarding-options
```

Response شامل platformها، content typeها، capabilities، categoryهای فعال و currency deployment باشد تا frontend constantهای جدا و ناسازگار نسازد.

### Onboarding status

```text
GET /api/v1/profiles/publisher/onboarding-status
```

Response پیشنهادی:

```json
{
  "profile_exists": true,
  "base_profile_complete": true,
  "active_platform_accounts": 1,
  "active_media_plans": 1,
  "interests_count": 3,
  "capabilities_count": 1,
  "discoverable": true,
  "next_step": "COMPLETE",
  "missing_requirements": []
}
```

`next_step` فقط یکی از این مقادیر باشد:

```text
PROFILE
PLATFORM_ACCOUNTS
MEDIA_PLANS
PREFERENCES
COMPLETE
```

### Platform Accounts

```text
GET    /api/v1/profiles/publisher/platform-accounts
POST   /api/v1/profiles/publisher/platform-accounts
PATCH  /api/v1/profiles/publisher/platform-accounts/{account_id}
DELETE /api/v1/profiles/publisher/platform-accounts/{account_id}
```

Create example:

```json
{
  "platform": "INSTAGRAM",
  "handle": "creator_name",
  "profile_url": "https://instagram.com/creator_name",
  "followers_count": 12500
}
```

### Media Plans

```text
GET    /api/v1/profiles/publisher/media-plans
POST   /api/v1/profiles/publisher/media-plans
PATCH  /api/v1/profiles/publisher/media-plans/{media_plan_id}
DELETE /api/v1/profiles/publisher/media-plans/{media_plan_id}
```

Create example:

```json
{
  "platform_account_id": "UUID",
  "content_type": "REEL",
  "price": "25000000.00",
  "typical_views": 8000
}
```

currency باید server-side از تنظیم deployment پر شود یا با مقدار مجاز واحد validate شود.

### Interests

```text
GET /api/v1/profiles/publisher/interests
PUT /api/v1/profiles/publisher/interests
```

```json
{
  "category_ids": ["UUID-1", "UUID-2", "UUID-3"]
}
```

### Capabilities

```text
GET /api/v1/profiles/publisher/capabilities
PUT /api/v1/profiles/publisher/capabilities
```

```json
{
  "capabilities": ["REVIEW", "TUTORIAL"]
}
```

### HTTP behavior

- `401`: token غایب/نامعتبر
- `403`: role نادرست یا resource متعلق به user دیگر
- `404`: profile/account/media plan پیدا نشد
- `409`: duplicate account/media plan یا state conflict
- `422`: payload نامعتبر
- `200/201`: موفقیت

برای خطاها فعلاً contract موجود FastAPI حفظ شود؛ استاندارد domain error کامل در Day 12 است. پیام UI باید انسانی باشد.

---

## 9. Discoverability — قانون منبع حقیقت

تابع pure/domain برای محاسبه ایجاد شود و بعد از هر mutation مرتبط صدا زده شود.

```text
discoverable =
  profile.status == ACTIVE
  AND public_name is not blank
  AND city is not blank
  AND bio is not blank
  AND active platform account count >= 1
  AND active media plan count >= 1
  AND interest count >= 3
  AND capability count >= 1
```

نکات:

- media plan باید به platform account فعال همان publisher وصل باشد.
- verification status شرط discoverability نیست.
- غیرفعال‌کردن آخرین account یا media plan باید discoverable را دوباره false کند.
- کم‌کردن interests از سه مورد نباید از API مجاز باشد؛ اگر به هر دلیل DB تغییر کرد، recalculation باید false برگرداند.
- client حق ارسال `discoverable=true` ندارد.
- update profile و تمام create/update/delete/replaceها در پایان status جدید را return یا refresh کنند.

---

## 10. Frontend Screen Plan

ساختار flat فعلی حفظ شود:

```text
app/(onboarding)/publisher.tsx
app/(onboarding)/publisher-platforms.tsx
app/(onboarding)/publisher-media-plans.tsx
app/(onboarding)/publisher-preferences.tsx
app/(onboarding)/publisher-complete.tsx
```

### 10.1 `publisher.tsx` — مرحله 1 از 4

- public name
- city
- bio
- avatar URL اختیاری یا skip
- اگر profile موجود است، مقادیر prefill و PATCH شود.
- اگر profile وجود ندارد، POST شود.
- موفقیت → `/publisher-platforms`

ورودی comma-separated قدیمی از این صفحه حذف شود، اما backend legacy columns حذف نشوند.

### 10.2 `publisher-platforms.tsx` — مرحله 2 از 4

- لیست accountهای فعلی به شکل card
- فرم Add account
- Platform selector
- handle
- profile URL
- follower count با keyboard عددی
- edit و deactivate/delete
- Continue فقط با حداقل یک account فعال
- موفقیت → `/publisher-media-plans`

### 10.3 `publisher-media-plans.tsx` — مرحله 3 از 4

- انتخاب یکی از accountهای فعال
- انتخاب content type
- standard price
- typical views اختیاری
- لیست rate cardها
- edit و deactivate/delete
- نمایش currency واضح
- Continue فقط با حداقل یک plan فعال
- موفقیت → `/publisher-preferences`

### 10.4 `publisher-preferences.tsx` — مرحله 4 از 4

- options از backend دریافت شوند.
- interestها به شکل chip/card چندانتخابی
- counter مانند `۲ از حداقل ۳ مورد`
- capabilityها چندانتخابی
- Save با PUT واقعی
- پس از ذخیره onboarding status دوباره fetch شود.
- فقط اگر `discoverable=true` → complete screen
- در غیر این صورت missing requirements نمایش داده و به مرحلهٔ درست route شود.

### 10.5 `publisher-complete.tsx`

- success state واقعی بر اساس status endpoint، نه state محلی
- خلاصه:
  - public name
  - platform count
  - media plan count
  - interest count
  - capability count
- متن «پروفایل شما آمادهٔ دریافت پیشنهاد است»
- چون Discover هنوز ساخته نشده، دکمهٔ جعلی dashboard نساز؛ یک completion state روشن کافی است.

### UX مشترک

- RTL و theme موجود
- step indicator
- loading اولیه
- empty state
- inline validation
- server error با retry
- جلوگیری از double tap با `isSubmitting`
- ScrollView + keyboard behavior مناسب
- touch targets حداقل 44×44
- price/follower formatting برای نمایش، payload بدون separator
- edit/delete confirmation برای جلوگیری از حذف اشتباه

---

## 11. Frontend Services و Types

فایل پیشنهادی:

```text
src/services/publisherOnboarding.ts
```

توابع:

```text
getPublisherOnboardingOptions
getPublisherOnboardingStatus
getPublisherProfile
updatePublisherProfile
listPlatformAccounts
createPlatformAccount
updatePlatformAccount
deletePlatformAccount
listMediaPlans
createMediaPlan
updateMediaPlan
deleteMediaPlan
getPublisherInterests
replacePublisherInterests
getPublisherCapabilities
replacePublisherCapabilities
```

Typeها یا در همین فایل و یا در فایل متمرکز زیر قرار گیرند:

```text
src/types/publisherOnboarding.ts
```

یک روش انتخاب و در کل feature یکسان نگه داشته شود. `any` استفاده نشود.

### اصلاح routing پس از login

برای user با role=PUBLISHER:

1. onboarding status را بگیر.
2. بر اساس `next_step` route کن.
3. اگر network error بود روی login بی‌نهایت spinner نزن؛ error + retry نشان بده.

Business flow فعلی دست‌نخورده بماند.

---

## 12. ترتیب اجرای کار

### Checkpoint 0 — پایان واقعی Day 2 — انجام شده

1. [x] backend و Expo اجرا شد.
2. [x] endpoint backend روی IP فعلی پاسخ داد.
3. [x] registration و TypeScript قبلاً تست شدند.
4. [x] hotfix شبکه و docs commit و push شدند.

Commit موجود:

```text
5a9277f some fixes
```

### Checkpoint 1 — Models و Migration — انجام شده

1. modelها و relationshipها
2. models init و Alembic metadata
3. migration
4. SQL review
5. upgrade
6. schema inspection

Commit موجود:

```text
f6f0e8c add normalized publisher onboarding schema
```

### Checkpoint 2 — Backend API — انجام شده

1. schemas
2. repository
3. discoverability service
4. owner-scoped CRUD
5. options/status endpoints
6. HTTP integration tests

Commit موجود:

```text
b7a5e62 add publisher onboarding APIs and discoverability
```

### Checkpoint 3 — Frontend Wizard — انجام شده

1. typed services
2. base profile screen
3. platforms screen
4. media plans screen
5. preferences screen
6. completion screen
7. resume routing

Commit موجود:

```text
6c8b283 build complete publisher onboarding wizard
```

### Checkpoint 4 — QA و Documentation — تقریباً کامل

1. full new-user flow
2. refresh/relogin resume
3. edit/delete tests
4. authorization tests
5. TypeScript/bundle
6. mobile UI
7. handoff update

وضعیت:

```text
API smoke: PASS
Web full flow: PASS
Session/reload resume: PASS
390px viewport overflow check: PASS
iOS production bundle (990 modules): PASS
Expo Go physical-device smoke: PENDING
```

---

## 13. Test Plan

### 13.1 Static/build checks

```bash
npx tsc --noEmit
python3 -m compileall backend/app
python3 -m alembic -c alembic.ini current
python3 -m alembic -c alembic.ini heads
```

اگر test infrastructure اضافه شد:

```bash
python3 -m pytest backend/tests -q
```

### 13.2 API happy path

با یک user تازه:

1. register
2. login
3. select PUBLISHER
4. create base profile
5. status باید `PLATFORM_ACCOUNTS` باشد.
6. create platform account
7. status باید `MEDIA_PLANS` باشد.
8. create media plan
9. status باید `PREFERENCES` باشد.
10. PUT سه interest
11. PUT یک capability
12. status باید `COMPLETE` و discoverable=true باشد.
13. logout/login
14. تمام داده‌ها باید بازیابی شوند.

### 13.3 Validation cases

- follower منفی → 422
- price صفر/منفی → 422
- URL نامعتبر → 422
- کمتر از سه interest → 422
- capability خالی → 422
- duplicate platform/handle → 409
- duplicate active media plan → 409
- media plan برای account شخص دیگر → 403/404 بدون افشای ownership
- role=BUSINESS روی endpoint publisher → 403
- token غایب → 401

### 13.4 Discoverability regression

- تکمیل تمام شرایط → true
- deactivate آخرین media plan → false
- فعال‌کردن دوباره → true
- deactivate آخرین platform account → false
- profile BLOCKED → false
- verification=UNVERIFIED ولی تمام شروط کامل → true

### 13.5 UI cases

- fresh publisher کامل
- publisher قدیمی با JSON legacy
- profile موجود ولی بدون platform
- platform موجود ولی بدون plan
- preferences ناقص
- app refresh در هر مرحله
- app restart با session restored
- double tap روی save
- network unavailable و retry
- keyboard روی iPhone دکمه را غیرقابل دسترس نکند.
- عرض کوچک mobile و web preview

### 13.6 Database verification

بعد از happy path مستقیماً بررسی شود:

- یک PublisherProfile
- حداقل یک PlatformAccount متعلق به همان profile
- حداقل یک MediaPlan با FK درست
- دقیقاً سه یا بیشتر PublisherInterest
- حداقل یک PublisherCapability
- `discoverable=true`
- هیچ duplicate یا orphan row وجود ندارد.

---

## 14. Acceptance Criteria نهایی Day 3

- [x] migration بررسی و روی PostgreSQL واقعی اعمال شده است.
- [x] JSON legacy حذف نشده و رکوردهای موجود خراب نشده‌اند.
- [x] Publisher base profile قابل create/edit است.
- [x] Platform Accounts add/edit/deactivate/list واقعی دارند.
- [x] Media Plans add/edit/deactivate/list واقعی دارند.
- [x] Interests از categoryهای backend انتخاب و ذخیره می‌شوند.
- [x] Capabilities typed و ذخیره می‌شوند.
- [x] تمام APIها authenticated و owner-scoped هستند.
- [x] discoverability فقط server-side محاسبه می‌شود.
- [x] حداقل شرایط PRD دقیقاً enforce می‌شوند.
- [x] onboarding status و resume routing کار می‌کنند.
- [x] refresh/relogin داده را حفظ می‌کند.
- [x] loading/error/empty states وجود دارند.
- [x] UI mobile-first، RTL و هم‌تم با صفحات فعلی است.
- [x] هیچ mock success یا local-only data وجود ندارد.
- [x] `npx tsc --noEmit` پاس است.
- [x] Python compile و smoke test پاس‌اند.
- [x] API happy path و negative cases تست شده‌اند.
- [x] flow کامل روی browser mobile width تست شده است.
- [ ] در صورت دسترسی، flow روی Expo Go گوشی تست شده است.
- [x] `PROJECT_HANDOFF.md` به‌روز شده است.
- [x] checkpoint commitها ساخته شده‌اند.

---

## 15. مواردی که GPT نباید انجام دهد

- پروژه را restart یا scaffold مجدد نکند.
- FastAPI را با Supabase جایگزین نکند.
- Zustand، Expo Router یا theme فعلی را عوض نکند.
- `app/index.tsx` نسازد.
- dashboard یا Day 4 Offer را وارد scope نکند.
- ستون‌های JSON legacy را در migration Day 3 drop نکند.
- discoverable را از client نپذیرد.
- دادهٔ platform/media plan را فقط در state محلی نگه ندارد.
- برای account یا plan دیگران امکان read/update/delete ایجاد نکند.
- پول را با float ذخیره نکند.
- success نمایشی بدون response واقعی backend نسازد.
- migration را بدون SQL review اجرا نکند.
- تغییرات سالم Day 2 را بی‌دلیل بازنویسی نکند.
- secrets یا `.env` را commit نکند.

---

## 16. گزارش پایانی مورد انتظار از GPT

پس از تکمیل Day 3، گزارش باید دقیقاً شامل این موارد باشد:

1. چه قابلیت‌هایی ساخته شد.
2. چه فایل‌هایی اضافه/تغییر کرد و دلیل هرکدام.
3. revision migration و وضعیت DB head.
4. APIهای جدید با نمونه payload.
5. قانون نهایی discoverability.
6. نتیجهٔ تمام تست‌ها و commandها.
7. نتیجهٔ تست mobile/web.
8. commit hashهای checkpoint.
9. هر debt یا مشکل باقی‌مانده.
10. پیشنهاد اولین اقدام Day 4، بدون شروع Day 4.
