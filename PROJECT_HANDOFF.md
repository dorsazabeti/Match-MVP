# Match MVP — Project Handoff & Living Status

> این فایل مرجع زندهٔ وضعیت پروژه است. بعد از هر تغییر معنی‌دار، migration، تست یا commit باید به‌روزرسانی شود.
>
> هدف فایل این است که اگر گفت‌وگوی فعلی به محدودیت رسید، بتوان کل آن را به یک گفت‌وگوی جدید داد و توسعه دقیقاً از همین نقطه ادامه پیدا کند.

**آخرین به‌روزرسانی:** 2026-08-03 — Asia/Tehran  
**Repository:** `/Users/dorsazabeti/match-mvp`  
**Branch:** `main`  
**PRD اصلی:** `/Users/dorsazabeti/Downloads/Match MVP Product Requirements Document.pdf`  
**وضعیت کلی:** Day 1 و Day 2 تکمیل شده‌اند؛ بهبود ثبت‌نام و session پیاده‌سازی و stage شده اما هنوز commit نشده؛ Day 3 هنوز شروع نشده است.

---

## 1. دستور فوری برای چت یا توسعه‌دهندهٔ بعدی

این پروژه را از نو نساز و معماری آن را بدون ضرورت تغییر نده. ابتدا این فایل، PRD و وضعیت واقعی Git را بخوان. سپس این دستورات read-only را اجرا کن:

```bash
cd /Users/dorsazabeti/match-mvp
git status --short --branch
git log --oneline --decorate -10
find app src backend/app backend/migrations/versions -maxdepth 5 -type f | sort
npx tsc --noEmit
```

قبل از هر کدنویسی Expo، طبق `AGENTS.md` مستندات دقیق Expo SDK 54 را بخوان:

- https://docs.expo.dev/versions/v54.0.0/

### اقدام بعدی دقیق

1. تغییرات stage‌شدهٔ ثبت‌نام/session را مرور و به‌عنوان checkpoint commit کن.
2. سپس Day 3 را با migration جداول نرمال‌شدهٔ Publisher آغاز کن.
3. migration SQL را قبل از اجرا بررسی کن.
4. backend، TypeScript، API واقعی و UI را تست کن.
5. پس از هر مرحلهٔ معنی‌دار، این فایل را به‌روزرسانی و commit checkpoint ایجاد کن.

---

## 2. اصول غیرقابل‌تغییر پروژه

- deadline کل MVP چهارده روز است؛ functionality بر معماری بی‌نقص اولویت دارد.
- معماری فعلی حفظ شود.
- بخش‌های سالم فقط در صورت ضرورت بازنویسی شوند.
- قبل از تغییر بزرگ، دلیل و اثر آن برای صاحب پروژه توضیح داده شود.
- محصول mobile-first است، ولی preview وب نیز باید قابل استفاده باشد.
- ظاهر فعلی از پلتفرم تبلیغاتی «جریان» الهام گرفته: راست‌چین، تم روشن، بنفش اصلی، کارت‌های سفید و پس‌زمینهٔ بنفش بسیار روشن.
- فعلاً `app/index.tsx` نساز. وجود هم‌زمان آن و `app/(auth)/index.tsx` باعث conflict مسیر index شده بود.
- dashboard/home تا کامل شدن onboarding اضافه نشود.
- بعد از هر مرحله:
  - `npx tsc --noEmit`
  - تست رفتار واقعی
  - commit checkpoint
  - به‌روزرسانی همین فایل
- رمز عبور، JWT secret، connection string دیتابیس و محتوای `.env` هرگز در این فایل ثبت نشود.

---

## 3. تعریف محصول طبق PRD

Match MVP یک marketplace مبتنی بر AI میان دو گروه است:

1. **Business / Brand**: کسب‌وکارهایی که برای بازاریابی و تبلیغات همکاری می‌خواهند.
2. **Publisher / Creator**: ناشرها، کانال‌ها و تولیدکنندگانی که محصولات را معرفی می‌کنند.

حلقهٔ نهایی MVP در PRD:

```text
Offer
  → Promotion
  → Recommendations / AI Package
  → Invitation
  → Atomic Wallet & Inventory Reservation
  → Deal
  → Submission
  → Approval
  → Settlement
```

تمرکز فعلی پروژه تکمیل onboarding و سپس جریان‌های اصلی این حلقه است.

### خارج از اولویت فعلی MVP

- open chat
- public publisher directory کامل
- analytics پیشرفته
- بازطراحی گستردهٔ معماری
- dashboard قبل از پایان onboarding

---

## 4. Tech Stack

### Frontend

- Expo SDK `~54.0.35`
- React Native
- TypeScript
- Expo Router `~6.0.24`
- Zustand `^5.0.14`
- React Native Web `^0.21.2`
- Expo Secure Store `~15.0.8`

### Backend

- FastAPI
- Python
- PostgreSQL
- SQLAlchemy
- Alembic
- JWT authentication

### محیط توسعه

- macOS
- Expo Go روی iPhone
- preview وب روی Metro

---

## 5. وضعیت Git در زمان آخرین به‌روزرسانی

Branch محلی `main` پنج commit از `origin/main` جلوتر است.

### commitهای موجود

```text
69eb7f4 style Day 2 onboarding preview
3fc4e9a fix Expo Go API address
678ce4b harden onboarding transitions
ef9e447 add publisher onboarding flow
71fdb34 fix Day 2 onboarding routing
ff3c38c has some bugs                  # origin/main
```

### هشدار: تغییرات stage‌شده اما commit‌نشده

در آخرین بررسی، این فایل‌ها stage شده بودند:

```text
M  app.json
M  app/(auth)/index.tsx
A  app/(auth)/register.tsx
M  app/_layout.tsx
M  backend/app/api/v1/auth/router.py
M  backend/app/models/user.py
M  backend/app/repositories/user_repository.py
M  backend/app/schemas/auth.py
M  backend/app/services/user_service.py
A  backend/migrations/versions/a6c9d3f2b817_add_user_display_name.py
M  package-lock.json
M  package.json
M  src/services/auth.ts
A  src/services/session.ts
M  src/store/auth.ts
```

این تغییرات مربوط به registration، `display_name` و session persistence هستند. آن‌ها را پاک یا بازنویسی نکن؛ ابتدا diff آن‌ها را بررسی و checkpoint کن:

```bash
git diff --cached --stat
git diff --cached
```

خود این فایل ممکن است پس از ایجاد هنوز untracked باشد؛ پیش از commit وضعیت Git دوباره بررسی شود.

---

## 6. وضعیت روزبه‌روز

### Day 1 — Backend Foundation — انجام شده

- [x] FastAPI setup
- [x] اتصال PostgreSQL
- [x] SQLAlchemy models
- [x] Alembic migrations
- [x] مدل User
- [x] مدل Business Profile
- [x] مدل Publisher Profile
- [x] ساختار versioned API

### Day 2 — Authentication & Onboarding — انجام شده

- [x] JWT login
- [x] دریافت کاربر فعلی با token
- [x] انتخاب role
- [x] ساخت Business profile
- [x] ساخت Publisher profile
- [x] صفحهٔ Login
- [x] صفحهٔ Role selection
- [x] صفحهٔ Business onboarding
- [x] صفحهٔ Publisher onboarding
- [x] رفع conflict مسیر index
- [x] تست واقعی frontend/backend برای هر دو نقش
- [x] تم mobile-first راست‌چین با الهام از جریان
- [x] TypeScript check
- [x] production iOS bundle
- [x] web preview

### بهبود بین Day 2 و Day 3 — پیاده‌سازی شده، stage شده، commit نشده

- [x] صفحهٔ Register با نام نمایشی، ایمیل، رمز و تکرار رمز
- [x] ثبت‌نام و login خودکار بعد از موفقیت
- [x] لینک رفت‌وبرگشت Login/Register
- [x] افزودن nullable `display_name` به User
- [x] migration مربوط به `display_name`
- [x] اعمال migration روی دیتابیس local
- [x] نگه‌داری امن JWT روی native با Secure Store
- [x] fallback به `localStorage` فقط برای web development
- [x] hydrate کردن session هنگام اجرای app
- [x] logout غیرهمزمان و پاک‌کردن token ذخیره‌شده
- [x] اعتبارسنجی password بین 8 و 72 کاراکتر در registration
- [x] normalize کردن email و display name
- [x] تست واقعی register → login → me با دیتابیس
- [ ] commit checkpoint این بخش

### Day 3 — Publisher Profile Normalization & Complete Onboarding — انجام نشده

- [ ] طراحی و migration جداول نرمال‌شدهٔ publisher
- [ ] Platform Accounts CRUD
- [ ] Media Plans CRUD
- [ ] Interests management
- [ ] Capabilities management
- [ ] onboarding status endpoint
- [ ] محاسبهٔ server-side وضعیت discoverability
- [ ] wizard کامل frontend برای Publisher
- [ ] resume logic برای کاربر دارای profile
- [ ] تست API، دیتابیس، iPhone و web
- [ ] commitهای checkpoint

---

## 7. جریان فعلی کاربر

### کاربر جدید

```text
Register
  → ثبت display name + email + password
  → login خودکار
  → Role Selection
  → BUSINESS: Business Profile
  → PUBLISHER: Publisher Profile
  → Success
```

### کاربر موجود

```text
Login
  → GET /auth/me
  → بدون role: Role Selection
  → BUSINESS: Business Profile
  → PUBLISHER: Publisher Profile
```

### محدودیت فعلی routing

resume logic هنوز هوشمند نیست. اگر کاربر قبلاً profile ساخته باشد، login او را بر اساس role دوباره به صفحهٔ profile می‌فرستد و ممکن است backend خطای «profile already exists» بدهد. این مورد باید در Day 3 با endpoint وضعیت onboarding و routing شرطی حل شود.

---

## 8. APIهای فعلی

Base URL فعلی frontend:

```text
http://192.168.1.5:8000/api/v1
```

این IP به شبکهٔ Wi-Fi وابسته است و ممکن است تغییر کند. در ادامه باید به `EXPO_PUBLIC_API_URL` منتقل شود، اما تا زمانی که تغییر ضروری نیست flow سالم را نشکن.

### Authentication

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Registration فعلی email/password است. PRD نهایی phone OTP و حداقل یک social login را نیز مطرح می‌کند؛ آن‌ها هنوز پیاده‌سازی نشده‌اند و برای سرعت MVP باید در زمان مناسب اولویت‌بندی شوند.

### Users

```text
POST /api/v1/users/role
```

Roleهای فعلی:

```text
BUSINESS
PUBLISHER
```

مدل فعلی یک role string دارد؛ پشتیبانی هم‌زمان از هر دو نقش طبق نسخهٔ کامل PRD هنوز انجام نشده است.

### Profiles

```text
POST /api/v1/profiles/business
GET  /api/v1/profiles/business
POST /api/v1/profiles/publisher
GET  /api/v1/profiles/publisher
```

Publisher فعلی این موارد را در JSON نگه می‌دارد:

- `platforms`
- `content_capabilities`
- `personal_interests`

و `followers_count` نیز در profile فعلی ذخیره می‌شود. این ساختار legacy برای سازگاری موقت باقی بماند؛ Day 3 باید source of truth نرمال‌شده ایجاد کند.

---

## 9. Migration History

```text
1b3833305a85  create users table
23c5edc2c194  add user role
e1903711c333  add business and publisher profiles
fedfa7107d8e  make user role nullable
a6c9d3f2b817  add user display_name
```

آخرین وضعیت تأییدشدهٔ دیتابیس local:

```text
a6c9d3f2b817 (head)
```

یعنی migration مربوط به `display_name` روی دیتابیس اعمال شده است، حتی اگر کد آن هنوز commit نشده باشد.

برای بررسی:

```bash
python3 -m alembic -c backend/alembic.ini current
python3 -m alembic -c backend/alembic.ini heads
```

قبل از هر migration جدید:

1. revision را بساز.
2. فایل migration و SQL تولیدی را بخوان.
3. upgrade و downgrade منطقی را بررسی کن.
4. سپس روی دیتابیس local اجرا کن.

---

## 10. راهنمای فایل‌ها

### فایل‌های root

#### `AGENTS.md`

دستور محیط توسعه: قبل از نوشتن کد Expo باید مستندات دقیق Expo SDK 54 خوانده شود.

#### `app.json`

پیکربندی Expo. pluginهای `expo-router` و `expo-secure-store` را نگه می‌دارد.

#### `package.json` / `package-lock.json`

وابستگی‌ها و scriptهای frontend. تغییرات فعلی شامل Secure Store و وابستگی‌های web است.

#### `PROJECT_HANDOFF.md`

همین سند؛ مرجع زندهٔ وضعیت، تصمیم‌ها، تست‌ها و ادامهٔ کار.

### Expo Router — `app/`

#### `app/_layout.tsx`

Root layout برنامه. Stackهای auth/onboarding را تعریف می‌کند و قبل از نمایش routeها session ذخیره‌شده را hydrate می‌کند. هنگام hydrate شدن loading state نشان می‌دهد.

#### `app/(auth)/index.tsx`

صفحهٔ Login و route اصلی `/`. ایمیل و رمز را می‌گیرد، JWT دریافت می‌کند، `/auth/me` را صدا می‌زند و بر اساس role به onboarding مناسب می‌رود. لینک Register نیز دارد.

> importهای این فایل به دلیل عمق مسیر باید با `../../src/...` باشند.

#### `app/(auth)/register.tsx`

صفحهٔ ثبت‌نام جدید: display name، email، password و confirm password. پس از ثبت‌نام موفق، login خودکار انجام می‌دهد و کاربر را به Role Selection می‌فرستد.

#### `app/(onboarding)/role.tsx`

انتخاب BUSINESS یا PUBLISHER. role را با backend ذخیره می‌کند، store را به‌روزرسانی می‌کند و به فرم نقش مربوطه می‌رود.

#### `app/(onboarding)/business.tsx`

فرم ساخت Business Profile. submit آن به endpoint واقعی backend متصل است. فعلاً پس از موفقیت نتیجهٔ موفق نشان می‌دهد؛ Day 4 باید آن را به Create Offer متصل کند.

#### `app/(onboarding)/publisher.tsx`

فرم اولیهٔ Publisher Profile. bio، city، platforms، followers count، content capabilities و personal interests را می‌گیرد. این نسخه Day 2 است و در Day 3 باید به wizard نرمال‌شده توسعه پیدا کند.

### Frontend services — `src/services/`

#### `src/services/api.ts`

wrapper مرکزی `fetch`، Base URL، headerهای JSON، افزودن Bearer token و تبدیل خطاهای backend به پیام قابل نمایش.

#### `src/services/auth.ts`

توابع register، login و دریافت کاربر فعلی. type کاربر شامل `display_name` و role است.

#### `src/services/users.ts`

تابع انتخاب و ثبت role کاربر.

#### `src/services/profiles.ts`

توابع ساخت و دریافت Business/Publisher profile و typeهای مربوط به payload.

#### `src/services/session.ts`

لایهٔ ذخیره‌سازی token. روی iOS/Android از `expo-secure-store` و روی web development از `localStorage` استفاده می‌کند.

### Frontend state/theme — `src/`

#### `src/store/auth.ts`

Zustand auth store. موارد اصلی:

- `token`
- `user`
- `isHydrated`
- `setSession()`
- `hydrate()`
- `logout()`

#### `src/theme/index.ts`

توکن‌های رنگ، spacing، radius و typography مشترک. مبنای ظاهر Jaryan-inspired و mobile-first است؛ به‌جای رنگ‌های پراکنده از این فایل استفاده شود.

### Backend entry/config — `backend/app/`

#### `backend/app/main.py`

ورودی FastAPI، ساخت application و include کردن routerهای API.

#### `backend/app/core/config.py`

خواندن تنظیمات environment مانند database و JWT. اطلاعات محرمانه نباید hardcode شوند.

#### `backend/app/core/database.py`

SQLAlchemy engine/session و dependency دیتابیس.

#### `backend/app/core/dependencies.py`

dependencyهای مشترک مانند گرفتن current authenticated user از Bearer token.

#### `backend/app/core/exceptions.py`

exceptionهای domain/application و تبدیل رفتار خطاها.

#### `backend/app/core/security/jwt.py`

ساخت و decode کردن JWT access token.

#### `backend/app/core/security/password.py`

hash و verify کردن password. رمز خام هرگز در DB ذخیره نشود.

### Backend routing — `backend/app/api/`

#### `backend/app/api/v1/router.py`

router اصلی نسخهٔ v1 و نقطهٔ اتصال auth، users و profiles.

#### `backend/app/api/v1/health.py`

health endpoint موجود است، ولی در آخرین بررسی به router اصلی متصل نبود. در صورت نیاز با تغییر کوچک و تست اضافه شود.

#### `backend/app/api/v1/auth/router.py`

endpointهای register، login و me. فقط orchestration HTTP انجام دهد و منطق اصلی را به service بسپارد.

#### `backend/app/api/v1/users/router.py`

endpoint انتخاب role برای کاربر authenticated.

#### `backend/app/api/v1/profiles/router.py`

endpointهای ساخت/دریافت Business و Publisher profile.

### Backend models — `backend/app/models/`

#### `backend/app/models/user.py`

مدل User شامل شناسه، email، password hash، nullable role و nullable display name.

#### `backend/app/models/business_profile.py`

مدل اطلاعات پروفایل کسب‌وکار و رابطهٔ آن با User.

#### `backend/app/models/publisher_profile.py`

مدل Day 2 پروفایل ناشر. برخی فیلدهای چندمقداری فعلاً JSON هستند و قرار است در Day 3 نرمال شوند.

#### `backend/app/models/__init__.py`

export/import مدل‌ها برای ثبت درست metadata و Alembic. هنگام افزودن مدل جدید فراموش نشود.

### Backend schemas — `backend/app/schemas/`

#### `backend/app/schemas/auth.py`

Pydantic schemaهای registration، login، token و auth response. constraints رمز و normalization ورودی در این لایه نیز enforce می‌شوند.

#### `backend/app/schemas/user.py`

schemaهای user و role selection.

#### `backend/app/schemas/business.py`

payload و responseهای Business Profile.

#### `backend/app/schemas/publisher.py`

payload و responseهای Publisher Profile فعلی. در Day 3 باید schemaهای Platform Account و Media Plan جدا اضافه شوند.

### Backend repositories — `backend/app/repositories/`

#### `backend/app/repositories/user_repository.py`

عملیات DB مربوط به User، جست‌وجوی email، create و update role/display name.

#### `backend/app/repositories/profile_repository.py`

عملیات DB پروفایل‌های Business و Publisher. endpoint نباید queryهای پراکنده را مستقیماً انجام دهد.

### Backend services — `backend/app/services/`

#### `backend/app/services/user_service.py`

منطق ثبت‌نام، normalize کردن داده، جلوگیری از email تکراری، hash password و احراز هویت.

#### `backend/app/services/profile_service.py`

قوانین ساخت profile، کنترل role و جلوگیری از profile تکراری.

### Alembic — `backend/migrations/versions/`

هر فایل یک تغییر schema قابل ردیابی است. فایل `a6c9d3f2b817_add_user_display_name.py` جدیدترین migration فعلی و روی DB اعمال‌شده است.

---

## 11. جزئیات پیشنهادی Day 3

هدف Day 3 این است که Publisher onboarding از یک فرم سادهٔ JSON به دادهٔ واقعی و قابل استفاده در marketplace تبدیل شود، بدون شکستن flow فعلی.

### تغییرات دیتابیس پیشنهادی

#### فیلدهای تکمیلی `publisher_profiles`

- `public_name`
- `avatar_url` — فعلاً nullable؛ upload واقعی در صورت وجود storage
- `discoverable`
- `status`

#### جدول `platform_accounts`

- UUID `id`
- `publisher_id`
- `platform`
- `handle`
- `profile_url`
- `followers_count`
- `verification_status`
- nullable verification screenshot/reference
- `active`
- timestamps
- unique روی publisher + platform + handle

#### جدول `media_plans`

- UUID `id`
- `publisher_id`
- `platform_account_id`
- `content_type`
- `price` با `Numeric(14, 2)`
- `currency`
- nullable `typical_views`
- `active`
- timestamps
- constraint برای price/count معتبر

#### جدول `publisher_interests`

- composite key: `publisher_id + category`

#### جدول `publisher_capabilities`

- composite key: `publisher_id + capability`

### APIهای پیشنهادی Day 3

```text
GET    /profiles/publisher/onboarding-status
PATCH  /profiles/publisher

GET    /profiles/publisher/platform-accounts
POST   /profiles/publisher/platform-accounts
PATCH  /profiles/publisher/platform-accounts/{id}
DELETE /profiles/publisher/platform-accounts/{id}

GET    /profiles/publisher/media-plans
POST   /profiles/publisher/media-plans
PATCH  /profiles/publisher/media-plans/{id}
DELETE /profiles/publisher/media-plans/{id}

PUT    /profiles/publisher/interests
PUT    /profiles/publisher/capabilities
```

تمام queryها باید owner-scoped باشند؛ یک publisher نباید بتواند رکورد publisher دیگر را بخواند یا تغییر دهد.

### قانون پیشنهادی discoverability

server پس از هر تغییر مرتبط دوباره محاسبه کند:

- base profile کامل: `public_name` و `city`
- حداقل یک platform account فعال
- حداقل یک media plan فعال
- حداقل سه interest
- حداقل یک capability

Frontend نباید منبع حقیقت `discoverable` باشد.

### wizard پیشنهادی frontend

```text
1. Base Publisher Profile
2. Platform Accounts — add/edit/delete
3. Media Plans — add/edit/delete
4. Interests & Capabilities — multi-select
5. Review & Complete
```

JSONهای Day 2 فعلاً برای backward compatibility حفظ شوند؛ دادهٔ نرمال‌شده source of truth جدید باشد.

---

## 12. Backlog و ریسک‌های شناخته‌شده

- [ ] ثبت‌نام phone OTP طبق PRD
- [ ] حداقل یک social login طبق PRD
- [ ] resume routing برای profile موجود
- [ ] انتقال Base URL به `EXPO_PUBLIC_API_URL`
- [ ] اتصال health router
- [ ] تست خودکار backend با pytest
- [ ] تست خودکار frontend
- [ ] پشتیبانی احتمالی یک User از هر دو role طبق PRD
- [ ] Day 4: Create Offer برای Business
- [ ] dashboard/home پس از کامل شدن onboarding
- [ ] پاک‌سازی یا علامت‌گذاری رکوردهای تستی DB قبل از production

دیتابیس توسعه ممکن است رکوردهای تستی با نام‌های codex/preview داشته باشد. credentials آن‌ها در این سند قرار نگرفته و نباید قرار بگیرد.

---

## 13. اجرای پروژه و مشاهدهٔ فعلی

### Backend

از root پروژه:

```bash
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

Swagger:

```text
http://localhost:8000/docs
```

### Expo برای iPhone / Expo Go

```bash
npx expo start
```

سپس QR را با Expo Go باز کن. iPhone و Mac باید روی یک Wi-Fi باشند و IP داخل `src/services/api.ts` باید IP فعلی Mac باشد.

### Web preview

```bash
npx expo start --web --port 8081
```

سپس:

```text
http://localhost:8081/
```

### TypeScript

```bash
npx tsc --noEmit
```

### production bundleهای مهم

برای اطمینان از سالم بودن bundling، از دستورات سازگار با Expo SDK 54 استفاده و قبل از اجرا docs نسخهٔ 54 را بررسی کن.

---

## 14. تست‌های انجام‌شده تا این نقطه

- Login واقعی با backend و PostgreSQL
- `GET /auth/me`
- انتخاب BUSINESS و PUBLISHER
- ایجاد Business Profile واقعی
- ایجاد Publisher Profile واقعی
- جریان browser برای هر دو onboarding
- registration واقعی با رکورد disposable
- register → login → me و برگشت `display_name`
- TypeScript check
- Python compile
- iOS production bundle، 979 module در آخرین اجرای ثبت‌شده
- بررسی migration head و اعمال migration `display_name`

هر تست باید پس از تغییر بخش مربوطه دوباره اجرا شود؛ این لیست تضمین نمی‌کند سرورهای فعلی هنوز روشن‌اند.

---

## 15. Definition of Done برای هر checkpoint

یک مرحله فقط زمانی انجام‌شده علامت بخورد که:

1. کد اجرا شود.
2. `npx tsc --noEmit` پاس شود، اگر frontend تغییر کرده است.
3. Python compile/test مرتبط پاس شود، اگر backend تغییر کرده است.
4. migration در صورت وجود بررسی و اجرا شود.
5. endpoint با درخواست واقعی و دیتابیس واقعی تست شود.
6. UI در mobile-width و ترجیحاً Expo Go بررسی شود.
7. تغییرات ناخواسته در `git diff` وجود نداشته باشد.
8. این فایل به‌روزرسانی شود.
9. commit checkpoint ساخته شود.

---

## 16. قالب پیشنهادی برای تحویل به یک چت جدید

کل این فایل را همراه PRD به چت جدید بده و این متن را اضافه کن:

```text
You are taking over development of Match MVP.

Read the attached PRD and PROJECT_HANDOFF.md completely before making changes.
Continue from the exact current repository state. Do not restart, redesign, or
rewrite working parts. Preserve the architecture and mobile-first Jaryan-inspired
theme. First inspect git status and staged changes, then verify TypeScript and the
database migration state. Explain major changes before making them. After each
meaningful step, test real behavior, update PROJECT_HANDOFF.md, and create a commit
checkpoint. The immediate next task is stated in section 1 of the handoff file.
```

---

## 17. Change Log این سند

### 2026-08-03

- فایل handoff اولیه ساخته شد.
- وضعیت کامل Day 1 و Day 2 ثبت شد.
- registration/session stage‌شده ولی commit‌نشده مشخص شد.
- migration اعمال‌شدهٔ `display_name` ثبت شد.
- برنامهٔ دقیق Day 3، توضیح فایل‌ها، APIها، ریسک‌ها و دستورات اجرا اضافه شد.

