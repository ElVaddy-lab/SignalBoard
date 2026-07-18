# SignalBoard — повний план розробки v1

**Статус:** approved  
**Дата:** 2026-07-16  
**Наступний крок після затвердження:** окрема дизайн-фаза у Figma або через `imagegen-frontend-web`  
**Поточний стан репозиторію:** застосунок ще не створено; наявні лише `CONTEXT.md`, ADR і цей план.

## 1. Результат проєкту

SignalBoard v1 має стати повноцінним portfolio SaaS-dashboard, який одночасно демонструє дві затребувані компетенції:

1. точне перетворення затвердженого UI-дизайну на якісний responsive Next.js frontend;
2. завершений SaaS MVP із Supabase Auth, Postgres, RLS, реальним CRUD, аналітикою, тестами та production deployment.

Це не маркетинговий сайт. Кореневий маршрут переводить користувача до auth або dashboard. Головна цінність кейсу — справжній приватний data workflow, а не статична dashboard-імітація.

## 2. Джерела рішень

План спирається на:

- початковий SignalBoard prompt;
- market research report про Fiverr/Next.js portfolio positioning;
- підтверджені рішення `grill-with-docs`;
- доменну мову в [`CONTEXT.md`](../CONTEXT.md);
- [`ADR-0001`](adr/0001-generate-project-activity-in-database.md);
- актуальні первинні рекомендації [Next.js App Router](https://nextjs.org/docs/app), [Next.js Data Security](https://nextjs.org/docs/app/guides/data-security), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase local development](https://supabase.com/docs/guides/local-development/overview), [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha), [shadcn/ui for Next.js](https://ui.shadcn.com/docs/installation/next), [Playwright projects](https://playwright.dev/docs/test-projects) та [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing).

Версії runtime-залежностей не фіксуються в цьому документі назавжди. Перед scaffold потрібно повторно перевірити latest stable security-patched releases і зафіксувати фактичні версії у `package.json` та `pnpm-lock.yaml`.

## 3. Затверджений scope v1

### 3.1 Auth

- Email/password `Sign up`, `Sign in`, `Sign out`.
- Публічна реєстрація у deployed portfolio.
- Email confirmation вимкнене; новий акаунт активний одразу.
- Cloudflare Turnstile через native Supabase CAPTCHA на `Sign up` і `Sign in`; це захищає обидва password-auth endpoints від прямого bypass.
- Cookie-based Supabase SSR session.
- Приватні app routes і повторна перевірка auth у кожній Server Action.
- Без password reset, OAuth, profile page та account settings у v1.
- Спільні demo credentials не публікуються.

### 3.2 Projects

- Повний create/read/update/delete.
- Поля:
  - `Title`: required, 3–100 символів;
  - `Description`: optional, максимум 1 000 символів;
  - `Status`: required, `Planning | Active | Review | Completed`, default `Planning`;
  - `Priority`: required, `Low | Medium | High`, default `Medium`;
  - `Project Lead`: required plain text, 2–80 символів; це не User і не access role;
  - `Deadline`: optional calendar date;
  - `Created At`, `Updated At`: system timestamps.
- Leading/trailing whitespace видаляється перед validation.
- Минулий Deadline дозволений із non-blocking warning.
- Status transitions дозволені в будь-якому напрямку.
- Hard delete Project; Project Activity зберігається.

### 3.3 Projects list

- Desktop semantic table; mobile cards без horizontal overflow.
- Search за title, description і Project Lead.
- Комбіновані filters за status, priority і deadline state.
- Sort за updated, created, deadline, title, priority.
- Default sort: recently updated first.
- Server-side pagination: 12 Projects на сторінку.
- Search/filter/sort/page зберігаються в URL.
- URL contract: `q`, `status`, `priority`, `deadline`, `sort`, `page`.
- Зміна search/filter/sort повертає `page` до 1.

### 3.4 Project detail і mutations UI

- `/projects/[id]` — повний detail screen із metadata та Activity timeline.
- Create/edit — responsive Sheet: side drawer на desktop, майже full-screen на mobile.
- Delete — `AlertDialog` із title та явним destructive warning.
- Expected validation/business errors відображаються inline; unexpected errors обробляються route error boundaries.

### 3.5 Dashboard

- Empty account: один продуманий onboarding state з `Create project` і `Load sample data`; без порожньої сітки chart/KPI.
- KPI:
  - `Total Projects`;
  - `Active Projects`;
  - `Completion Rate`;
  - `Overdue Projects`;
  - `Late Completions`, а другим рядком `Late Completion Rate`.
- Undefined rate показується як `—`, не `0%`.
- Status distribution donut: 4 stable colors, total у центрі, count/percentage legend і текстовий accessible equivalent.
- Completion Trend: 12 ISO weeks, Monday–Sunday, у browser IANA timezone; кожен перехід у `Completed` є окремою event; повторне completion після reopen також рахується.
- Upcoming Deadlines: незавершені Projects від today до +14 календарних днів inclusive; overdue не змішуються з upcoming.
- Recent Activity: 8 останніх events; deleted Project використовує non-clickable title snapshot.
- Recent Projects: 5 most recently updated + `View all projects`.

### 3.6 Project Activity

- Immutable events: `created`, `updated`, `status_changed`, `deleted`.
- Одна успішна user action створює одну event.
- No-op save не створює event.
- Якщо update змінює status, тип event — `status_changed`, навіть якщо одночасно змінено інші поля.
- Event зберігає `changed_fields`.
- `before/after` зберігаються лише для status, priority, Deadline і Project Lead.
- Description history зберігає лише факт зміни, без повного old/new text.
- Кожна event має title snapshot.
- Events створює database trigger відповідно до ADR-0001; frontend не має права напряму їх вставляти або змінювати.

### 3.7 Sample data і demo

- Новий User починає з порожнім dashboard.
- `Load sample data` запускається лише явно.
- Sample Project Set містить 18 англомовних Projects і демонструє:
  - усі statuses та priorities;
  - pagination > 1 page;
  - no Deadline, upcoming і overdue cases;
  - on-time і late completions;
  - events у межах 12-week trend.
- Перше завантаження записує stable anchor date для User.
- Повторний load не дублює наявні Projects і відновлює відсутні sample Projects відносно початкового anchor.
- Sample Projects стають звичайними private Projects: їх можна edit/delete.
- Окремий private demo account використовується лише для контрольованих portfolio screenshots; credentials не публікуються.

### 3.8 Localization і timezone

- UI languages: English та Українська.
- English — default для нового відвідувача.
- Language switch доступний на auth screens та в user menu.
- Видимі скорочення у language switch: `EN` для English та `UA` для Української. Внутрішній i18n identifier залишається standards-compliant: `en` та `uk`/`uk-UA`.
- Preference зберігається у cookie між сесіями.
- URL не отримує мовного prefix.
- Перекладаються navigation, forms, validation, auth, dashboard labels, empty/loading/error states, dates і system messages.
- User content та англомовний Sample Project Set не перекладаються.
- `<html lang>` відповідає активній мові.
- Browser IANA timezone визначається на початку сесії та зберігається у cookie; окремого timezone selector немає.
- Activity timestamps зберігаються у UTC; Deadline — Postgres `date` без часу.

## 4. Свідомі non-goals v1

- Landing/marketing site.
- Kanban, drag-and-drop, calendar view.
- Teams, roles, invitations, sharing, multi-tenancy.
- Comments, attachments, tags, subtasks.
- Bulk actions, import/export.
- Global Activity page.
- Supabase Realtime і cross-tab live sync.
- Password reset, OAuth, profile/account settings.
- Dark mode.
- Payments, AI, notifications, chat, external integrations.

Ці функції не повинні непомітно потрапляти у v1 під час implementation.

## 5. Технічний baseline

### 5.1 Локальний інструментарій

- Node.js `v22.22.2`.
- pnpm `11.9.0`.
- Git `2.45.2.windows.1`.
- Docker Desktop `4.82.0`, Engine `29.6.1`, Compose `5.3.0` — попередньо smoke-tested.
- Supabase CLI standalone `2.109.1` — попередньо smoke-tested із локальними Postgres/Auth/REST/Storage/Studio/Mailpit.
- Після перезапуску terminal/Codex перевірити, що user PATH бачить Docker і Supabase без absolute paths.
- Для локального SignalBoard запускати Supabase без Vector: `supabase start --exclude vector`. Vector/log analytics не потрібні продукту; відкривати небезпечний unauthenticated Docker TCP `2375` заради нього не будемо.

### 5.2 Application stack

- Latest stable security-patched Next.js App Router + React + TypeScript.
- `src/` layout, Server Components by default.
- Tailwind CSS v4.
- shadcn/ui, `new-york`, Radix base; додаються лише потрібні components.
- Supabase Postgres/Auth/Data API + `@supabase/ssr` and `@supabase/supabase-js`.
- React Hook Form + Zod + `@hookform/resolvers`.
- `next-intl` для cookie-based no-prefix localization.
- Recharts для двох dashboard charts.
- Lucide для icons.
- Sonner для non-critical success/error announcements.
- Playwright + `@axe-core/playwright`.
- Vitest для pure public contracts.
- pgTAP через `supabase test db` для schema/RLS/functions/triggers.
- Без Prisma/ORM: SQL migrations, RLS і generated Supabase database types залишаються source of truth.

### 5.3 Dependency policy

- Scaffold і install виконуються тільки після повторної перевірки latest stable versions.
- Exact versions і package manager version фіксуються lockfile/package metadata.
- Supabase CLI додається також як project dev dependency, pinned до перевіреної версії, щоб scripts не залежали від global PATH.
- `shadcn add --all` не використовувати; встановити мінімальний inventory після design approval.
- Після shadcn init перевірити font tokens і `<html>` font classes, щоб уникнути Tailwind v4 circular font variable regression.

## 6. Архітектура Next.js

### 6.1 Rendering і data flow

- Server Components читають personalized data на кожен request.
- Interactive leaves — forms, filters, Sheet, language menu, charts, timezone sync — є вузькими Client Components.
- Server Actions виконують auth mutations і Project CRUD.
- Кожна Server Action:
  1. повторно перевіряє authenticated User;
  2. парсить payload через shared Zod schema;
  3. виконує Supabase operation під user session;
  4. покладається на RLS як mandatory defense-in-depth;
  5. revalidates конкретні affected paths;
  6. повертає typed success/error result.
- Окремий REST API не створюється.
- `src/proxy.ts` використовується лише для session refresh та optimistic redirect; він не є єдиним authorization layer.
- Shared cache для private user data не використовується. Dashboard queries запускаються паралельно; mutations застосовують targeted revalidation.
- Supabase clients створюються у request-scoped/lazy factories, не як module-scope SDK instances, залежні від runtime env.

### 6.2 Route map

| Route | Access | Responsibility |
|---|---|---|
| `/` | public | Redirect to `/dashboard` or `/sign-in` |
| `/sign-in` | public-only | Email/password sign in + language switch |
| `/sign-up` | public-only | Email/password sign up + Turnstile + language switch |
| `/dashboard` | authenticated | KPI, charts, deadlines, recent data, empty state |
| `/projects` | authenticated | URL-driven search/filter/sort/pagination, desktop table/mobile cards |
| `/projects/[id]` | authenticated owner | Project detail, Activity timeline, edit/delete actions |

Route segments отримують `loading.tsx`, `error.tsx` і `not-found.tsx` там, де це дає реальний user-visible стан.

### 6.3 Proposed source structure

```text
src/
|-- app/
|   |-- (auth)/
|   |   |-- sign-in/page.tsx
|   |   `-- sign-up/page.tsx
|   |-- (app)/
|   |   |-- layout.tsx
|   |   |-- dashboard/
|   |   |   |-- page.tsx
|   |   |   |-- loading.tsx
|   |   |   `-- error.tsx
|   |   `-- projects/
|   |       |-- page.tsx
|   |       `-- [id]/page.tsx
|   |-- layout.tsx
|   |-- page.tsx
|   |-- not-found.tsx
|   `-- globals.css
|-- components/
|   |-- ui/                    # owned shadcn primitives
|   `-- layout/                # app shell, sidebar, mobile nav, user menu
|-- features/
|   |-- auth/
|   |   |-- actions.ts
|   |   |-- schemas.ts
|   |   `-- components/
|   |-- projects/
|   |   |-- actions.ts
|   |   |-- queries.ts
|   |   |-- schemas.ts
|   |   |-- search-params.ts
|   |   `-- components/
|   |-- dashboard/
|   |   |-- queries.ts
|   |   `-- components/
|   |-- activity/components/
|   `-- preferences/
|       |-- locale.ts
|       `-- timezone.ts
|-- i18n/
|   |-- request.ts
|   `-- messages/
|       |-- en.json
|       `-- uk.json
|-- lib/
|   |-- env.ts
|   |-- supabase/
|   |   |-- browser.ts
|   |   |-- server.ts
|   |   `-- proxy.ts
|   `-- utils/
|-- types/
|   `-- database.generated.ts
`-- tests/unit/

supabase/
|-- config.toml
|-- migrations/
|-- tests/database/
`-- seed.sql                  # only deterministic local test prerequisites

e2e/
|-- setup/
|-- auth.spec.ts
|-- projects.spec.ts
|-- dashboard.spec.ts
|-- localization.spec.ts
`-- accessibility.spec.ts

scripts/
`-- seed-demo-account.ts      # explicit admin-only portfolio fixture
```

### 6.4 Boundary rules

- `page.tsx` залишається composition layer, а не контейнером усіх cards/forms/helpers.
- Domain components живуть у відповідній feature folder; generic primitives — лише в `components/ui`.
- URL є state source для Project list; global client store не додається.
- Locale/timezone — stable cross-tree preferences; решта UI state залишається local.
- Analytics business rules реалізуються в Postgres functions і називаються мовою `CONTEXT.md`.
- Formatting/parsing/search-param mapping — pure utilities з public tests.
- Design tokens зосереджені у `globals.css`/theme layer; foundational colors не розкидаються ad-hoc Tailwind classes.

## 7. Supabase data model

### 7.1 Types

- `project_status`: `planning`, `active`, `review`, `completed`.
- `project_priority`: `low`, `medium`, `high`.
- `project_activity_type`: `created`, `updated`, `status_changed`, `deleted`.

Stored values не локалізуються; UI перекладає labels.

### 7.2 `projects`

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | primary key, generated |
| `user_id` | uuid | required, references `auth.users`, immutable ownership |
| `title` | text | trimmed, length 3–100 |
| `description` | text nullable | trimmed, max 1 000 |
| `status` | `project_status` | required, default `planning` |
| `priority` | `project_priority` | required, default `medium` |
| `project_lead` | text | trimmed, length 2–80 |
| `deadline` | date nullable | past values allowed |
| `sample_key` | text nullable | hidden stable identity for Sample Project Set |
| `created_at` | timestamptz | database generated |
| `updated_at` | timestamptz | maintained by trigger |

Constraints повторюють server Zod invariants. Partial unique index `(user_id, sample_key) where sample_key is not null` забезпечує sample idempotency. Composite indexes починаються з `user_id` і покривають updated/status/priority/deadline query paths.

### 7.3 `project_activities`

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | owner snapshot, required |
| `project_id` | uuid nullable | `ON DELETE SET NULL` |
| `project_title` | text | immutable title snapshot |
| `activity_type` | enum | immutable |
| `changed_fields` | text[] | allowlisted domain fields |
| `changes` | jsonb | safe structured before/after subset |
| `occurred_at` | timestamptz | UTC event time |

Authenticated role має лише `SELECT` на власні Activity rows через RLS. Direct `INSERT/UPDATE/DELETE` заборонені; trigger function володіє write path.

### 7.4 `sample_project_sets`

| Column | Type | Rule |
|---|---|---|
| `user_id` | uuid | primary key, references `auth.users` |
| `anchor_date` | date | immutable first-load date |
| `loaded_at` | timestamptz | audit timestamp |

### 7.5 Database functions і triggers

- `set_updated_at()` — maintains `projects.updated_at`.
- `record_project_activity()` — compares OLD/NEW, suppresses no-op saves, writes one immutable event.
- `list_projects(parameters)` — typed, whitelist-based server pagination/search/filter/sort without unsafe dynamic user input.
- `get_dashboard_metrics(timezone)`.
- `get_status_distribution()`.
- `get_completion_trend(timezone)` — zero-fills 12 ISO weeks.
- `get_upcoming_deadlines(local_date)`.
- `load_sample_project_set()` — transactional, authenticated, idempotent.

Analytics functions are `security invoker` wherever possible and remain subject to RLS. Any required `security definer` function must:

- derive User from `auth.uid()`, never accept arbitrary `user_id`;
- set a fixed safe `search_path`;
- revoke default public execution;
- grant only the narrow authenticated capability;
- receive negative pgTAP tests.

Sample history needs timestamps relative to anchor while ADR-0001 requires trigger-generated history. The approved solution is an internal-only activity-clock override available solely inside the hardened sample loader, which performs real insert/status-transition operations through the same triggers. The trade-off is recorded in [`ADR-0002`](adr/0002-use-an-internal-activity-clock-for-sample-history.md).

## 8. Analytics contracts

- `Total Projects`: count of current, non-deleted Projects.
- `Active Projects`: current status `Active`.
- `Completion Rate`: current `Completed / Total`; undefined when Total = 0.
- `Overdue Projects`: current status != Completed and Deadline < browser-local today.
- `Late Completion`: current status = Completed, has Deadline, latest transition into Completed occurred after Deadline.
- `Late Completion Rate`: Late Completions / current Completed Projects with Deadline; no-deadline completions excluded.
- `Completion Trend`: all transitions into Completed in the current + previous 11 ISO weeks. Re-completion after reopen counts again. Historical events remain in the trend even if their Project was later deleted.
- A Project created initially as Completed has no transition event and does not enter Completion Trend until a later non-Completed → Completed transition.
- Status distribution and recent Projects operate only on current Projects.
- Recent Activity may contain deleted Project snapshots.

All timezone inputs are validated against Postgres-known IANA timezones; invalid input falls back to UTC. Date boundary tests explicitly cover Monday/Sunday, DST changes, today, +14 days, overdue yesterday, null Deadline, reopen/re-complete, and empty denominators.

## 9. Security model

### 9.1 RLS

- RLS enabled on every user-owned table before app access.
- Policies explicitly target `authenticated`.
- Ownership predicates use `(select auth.uid()) = user_id`.
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies are tested separately.
- `UPDATE` uses both `USING` and `WITH CHECK`.
- Cross-user reads and mutations must return no accessible row / fail safely.
- Unauthorized and not-owned Project detail should expose the same 404-style response, not ownership information.

### 9.2 Application security

- Server Actions are treated as public endpoints: auth + authorization + validation on every call.
- Supabase RLS remains mandatory even when access originates from a Server Component/Action.
- `service_role` key is never present in browser code or normal Vercel runtime env.
- Public env contains only Supabase URL/publishable key, Turnstile site key and public site URL.
- Turnstile token is sent to Supabase Auth as `captchaToken` for every protected password endpoint; challenge resets after failed/used submission.
- React renders user text as text; no raw HTML rendering.
- No custom Server Action body-size increase; Project forms remain far below default limit.
- CSP/security headers must allow only required same-origin/Supabase/Turnstile resources.
- Dependency audit and current Next/React security patch verification are release gates.

### 9.3 Auth configuration

- Local and hosted Supabase: email/password enabled, email confirmation disabled.
- Turnstile присутній на `Sign up` і `Sign in`; це запобігає bypass через прямий Supabase Auth endpoint.
- Minimum password length: 8; no arbitrary composition rules; allow paste and password-manager autofill.
- Inputs use `autocomplete="email"`, `current-password`, `new-password` as appropriate.
- Local Turnstile uses official test setup; production secret stays in Supabase Auth CAPTCHA settings.

## 10. Accessibility, responsive behavior і UX quality

Target: WCAG 2.2 AA-oriented implementation plus manual usability checks.

- Semantic landmarks and one visible-on-focus skip link.
- Correct heading hierarchy and unique localized page titles.
- Visible labels; placeholder never replaces label.
- Form errors linked with `aria-describedby`; submit summary/focus behavior for invalid forms.
- Validation appears after blur/submit, clears during correction; submit is disabled only during an active valid submission to prevent duplicates.
- Keyboard-complete Sheet, dropdown, dialog, pagination and table actions.
- Destructive confirmation uses `AlertDialog`, not generic Dialog.
- Focus returns to the invoking control after overlay close.
- Status/priority/deadline state is never communicated by color alone.
- Chart has text legend and semantic data alternative.
- Table includes caption and scoped headers; mobile cards preserve equivalent information.
- Polite live announcements for save/delete/search-result changes; assertive only for blocking failures.
- Touch targets aim for 44–48px; mobile inputs use at least 16px text.
- 200% zoom, 320px width, 390px mobile, tablet, 1440px desktop and long Ukrainian labels are explicit QA cases.
- `prefers-reduced-motion` disables non-essential movement.
- No horizontal page overflow.

## 11. Погоджувані test seams

Затвердження цього плану одночасно затверджує такі public seams для TDD. Tests не повинні прив’язуватися до private component structure або mock internal modules.

| Seam | Public interface | Primary tests |
|---|---|---|
| Database contract | SQL schema, RLS, triggers, RPC results under anon/User A/User B | pgTAP via `supabase test db` |
| Validation contract | exported Zod schemas and URL parser behavior | Vitest with independent literal cases |
| Authenticated product | real browser routes/forms against local Supabase | Playwright |
| Accessibility/responsive UI | rendered pages, keyboard, accessibility tree, viewport behavior | Playwright + axe + manual review |
| External bot boundary | Turnstile/Supabase CAPTCHA token contract for protected password endpoints | official test keys; no mocks of internal auth modules |

### 11.1 Required database tests

- Tables, enums, constraints, indexes and grants exist.
- User A cannot read/mutate User B Projects or Activity.
- Project insert creates exactly one `created` event.
- Material update creates exactly one event with correct changed fields.
- No-op update creates zero events.
- Status update classification and before/after payload are correct.
- Description contents are not copied into Activity history.
- Hard delete removes Project, retains Activity, nulls `project_id`, keeps title snapshot.
- Every analytics formula matches worked literal fixtures.
- Sample load creates 18 Projects, second call creates 0 duplicates, restore adds only missing Projects, anchor stays stable.
- Security-definer sample path cannot target another User or write arbitrary history.

### 11.2 Required E2E journeys

- Guest is redirected from private routes.
- User signs up through test CAPTCHA and receives an immediate session without confirmation route.
- User signs in through test CAPTCHA, signs out, and session persists across reload while authenticated.
- Empty dashboard exposes Create and Load Sample actions.
- Create Project → appears in list/detail/dashboard/activity.
- Edit Project including status transition → analytics/activity update.
- Search/filter/sort/page URL survives reload/back navigation.
- Delete Project → Project inaccessible, deletion Activity remains visible.
- Sample load and repeat load behavior.
- English/Ukrainian switch persists and changes `<html lang>`.
- Desktop table and mobile cards expose equivalent data.
- Keyboard-only create/edit/delete journey.
- Axe scan on auth, dashboard, projects and detail has no serious/critical violations.

### 11.3 TDD execution rule

Кожний vertical slice проходить:

1. **Red:** один failing behavior test на погодженому seam;
2. **Green:** мінімальна implementation для цього behavior;
3. наступний behavior test;
4. окремий review/refactor checkpoint після завершення coherent slice.

Не пишемо всю test suite наперед і не mock-аємо власні actions/queries/components.

## 12. Поетапний roadmap

### Phase 0 — затвердження plan і design input

Deliverables:

- цей implementation plan затверджений;
- `CONTEXT.md` і ADR-0001 прийняті;
- обрано design workflow: Figma або `imagegen-frontend-web`.

Gate: жодного scaffold/code до затвердження visual direction.

### Phase 1 — visual design окремим проходом

Після цього плану:

- сформувати art direction і reference board;
- визначити light-theme tokens: palette, typography, density, radius, shadows, status/priority colors;
- спроєктувати desktop і mobile app shell;
- підготувати high-fidelity screens/states:
  - Sign in / Sign up + Turnstile;
  - empty dashboard;
  - populated dashboard;
  - Projects desktop table;
  - Projects mobile cards + filters Sheet;
  - Project detail + Activity;
  - create/edit Sheet;
  - delete confirmation;
  - loading, validation, empty, error, not-found states;
  - English and long-copy Ukrainian examples.
- скласти component/state inventory для implementation.

Gate: user approves final visual direction and key responsive states.

### Phase 2 — repository scaffold і tooling

- Initialize Git in the authoritative project folder if still absent.
- Scaffold latest stable Next.js App Router with TypeScript, Tailwind, ESLint, `src/`, alias `@/*`, non-interactive flags and `--force` because planning docs already exist; immediately verify those docs were preserved.
- Pin pnpm/package manager and lockfile.
- Initialize shadcn non-interactively with Radix base; add only approved components.
- Install runtime/dev dependencies.
- Add strict env parsing, `.env.example`, `.gitignore` and scripts.
- Initialize project-local Supabase; configure `supabase start --exclude vector`.
- Configure Vitest, Playwright, axe and pgTAP directories.
- Add CI-ready scripts.
- Run initial lint/typecheck/build smoke.

Gate: clean scaffold, no placeholder UI retained, local Next and Supabase start predictably, baseline checks pass.

### Phase 3 — database foundation (TDD)

Vertical slices:

1. enums/tables/constraints/indexes;
2. RLS ownership isolation;
3. updated timestamp behavior;
4. immutable Activity trigger including no-op suppression;
5. hard-delete history retention;
6. list/analytics RPC contracts;
7. Sample Project Set state/function.

Work test-first in pgTAP. Generate `database.generated.ts` only after migration tests pass.

Gate: `supabase db reset` and `supabase test db` pass from a clean state; User A/B isolation is proven negatively.

### Phase 4 — auth, locale, timezone і app shell

Vertical slices:

1. guest redirect and protected app layout;
2. sign-up with Turnstile and immediate session;
3. sign-in with Turnstile, sign-out and session refresh;
4. language switch and dictionary parity;
5. browser timezone sync/fallback;
6. responsive shell, sidebar/mobile nav, skip link, user menu.

Gate: real browser auth journey works against local Supabase in both languages; no route relies only on Proxy for authorization.

### Phase 5 — Project CRUD as vertical product slices

Order:

1. create Project + created Activity;
2. server-rendered Projects list + Project detail;
3. edit Project + generic/status Activity;
4. delete Project + retained history;
5. URL search/filter/sort;
6. 12-item server pagination;
7. desktop table/mobile cards;
8. validation, pending, success and failure UX.

Gate: full CRUD works under RLS, across refresh/navigation, with approved design and exact field rules.

### Phase 6 — dashboard analytics

Order:

1. empty onboarding dashboard;
2. KPI cards;
3. status donut + accessible equivalent;
4. 12-week Completion Trend;
5. Upcoming Deadlines;
6. Recent Activity;
7. Recent Projects;
8. loading/error/zero-data states and query parallelization.

Gate: worked database fixtures and UI display agree for timezone/date/late-completion edge cases.

### Phase 7 — sample data і controlled demo

- Implement 18-project idempotent user loader.
- Verify stable anchor, second load and missing-item restore.
- Create explicit admin-only `seed-demo-account` script for screenshots; keep credentials/secrets outside repository.
- Capture controlled portfolio data state.

Gate: a new public User can explore the app without automatic data; private demo account can be reproduced intentionally.

### Phase 8 — integrated QA and hardening

- Full lint, typecheck, unit, pgTAP, build, Playwright.
- Chromium desktop/mobile primary suite.
- Firefox/WebKit cross-browser smoke.
- Keyboard-only walkthrough.
- axe scans plus manual landmarks/focus/chart/table review.
- Responsive visual QA at 320, 390, tablet, 1440 and 200% zoom.
- English/Ukrainian overflow and copy review.
- Console/network error audit.
- Security review: RLS, Server Actions, env exposure, CSP, dependencies.
- Performance review: personalized data caching, unnecessary Client Components, Recharts bundle, Suspense/loading behavior.

Gate: no P0/P1 defects, no serious/critical automated accessibility violations, no cross-user data leak, clean production build.

### Phase 9 — documentation, CI, deployment і portfolio packaging

- README: value proposition, stack, architecture, setup, env, Supabase commands, test commands, domain rules, screenshots.
- Migration and local reset instructions.
- GitHub Actions:
  - install with frozen lockfile;
  - lint/typecheck/unit/build;
  - start local Supabase without Vector;
  - reset/test DB;
  - Chromium E2E on pull requests;
  - full cross-browser suite on release/manual workflow.
- Create hosted Supabase project and apply migrations.
- Configure email confirmation off, native Supabase Turnstile protection, auth URLs and Vercel env.
- Deploy Next.js to Vercel.
- Run production smoke without destructive shared demo credentials.
- Capture approved desktop/mobile screenshots and short case-study evidence.

Gate: reproducible repo, green CI, live protected CRUD, portfolio-ready screenshots and documentation.

## 13. Planned scripts

Exact commands are finalized after scaffold, but `package.json` should expose a predictable interface:

```text
dev
build
start
lint
typecheck
test
test:run
test:db
test:e2e
test:e2e:ui
supabase:start
supabase:stop
db:reset
types:generate
check
```

`check` should run the non-interactive merge/release gate in a stable order. Browser tests may remain a separate CI job because they own server/container lifecycle.

## 14. Environment contract

Public/runtime example values documented in `.env.example`:

```text
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

Rules:

- no real values in git;
- no service-role key in application runtime;
- test/admin credentials live only in ignored local/CI secret stores;
- production Turnstile secret is configured in Supabase, not exposed by Next.js;
- env schema fails fast with a safe message and never logs secret values.

## 15. Definition of Done

SignalBoard v1 is complete only when:

- approved desktop/mobile design is implemented without placeholder sections;
- public sign-up, sign-in, sign-out and private route protection work;
- email confirmation is absent by design and Turnstile protects the approved Supabase password-auth endpoints;
- each User can access only own Projects and Activity, proven by negative tests;
- Project CRUD persists through Supabase and obeys all validation rules;
- Activity history is immutable and correct for create/update/status/delete/no-op;
- hard delete retains safe historical snapshots;
- Project list search/filter/sort/pagination is URL-driven and responsive;
- all dashboard metrics match domain definitions and date/timezone edge cases;
- sample data is explicit, idempotent and demonstrative;
- English/Ukrainian UI and browser timezone behavior persist correctly;
- empty/loading/error/not-found/pending/success states are designed;
- automated and manual accessibility/responsive checks pass;
- clean `pnpm build`, lint, typecheck, unit, database and E2E gates pass;
- README, `.env.example`, SQL migrations, generated types, tests and portfolio screenshots are present;
- Vercel + hosted Supabase deployment passes production smoke.

## 16. Main risks and mitigations

| Risk | Mitigation |
|---|---|
| Open auth without email confirmation attracts bots | Native Supabase Turnstile on sign-up and password sign-in, Supabase rate limits, no shared demo credentials |
| RLS appears correct but leaks through one operation | Separate negative pgTAP tests for every CRUD verb and RPC |
| Proxy becomes the only auth gate | Re-validate User in Server Components/Actions; RLS remains mandatory |
| Personalized data is accidentally shared through cache | No shared cache directives for User data; request-scoped Supabase client |
| Browser timezone creates boundary bugs | UTC timestamps, `date` deadlines, validated IANA timezone, literal edge fixtures |
| Trigger-generated historical sample data becomes inconsistent | Hardened transactional loader + internal-only clock override + ADR-0002 |
| Recharts hides information from assistive technology | Text legend/data alternative and keyboard/manual checks |
| Two languages cause layout regressions | Long Ukrainian copy in design artifacts and viewport/zoom test matrix |
| shadcn/Tailwind/font initialization drifts | Pin lockfile, inspect CLI output, verify token/font integration immediately |
| Supabase Vector fails on Windows unless unsafe Docker TCP is exposed | Exclude Vector; it is not a SignalBoard requirement |
| Scope expands during implementation | Treat Section 4 as an enforced non-goal list; backlog extras separately |

## 17. Post-MVP backlog

Only after v1 acceptance:

- password reset and SMTP/email configuration;
- dark mode;
- account/profile settings and account deletion;
- global Activity page;
- bulk actions and import/export;
- Kanban/calendar views;
- collaboration/roles/sharing;
- comments, files, tags, subtasks;
- realtime cross-tab/team updates;
- notifications/integrations.

## 18. Approval checkpoint

Approval of this document means:

1. product scope, domain metrics, architecture direction and test seams are accepted, including the final CAPTCHA scope;
2. ADR-0002 records the internal sample-history clock override;
3. the next task is design exploration only;
4. implementation starts only after the selected Figma/imagegen visual direction is separately approved.
