# SignalBoard v1 acceptance report

Date: 2026-07-17

## 1. Verdict

**Local v1: `ACCEPT`. Production deployment: `ACCEPT`. Public access and full authenticated production journey: `PENDING`.** The application, hosted database contracts, responsive product journey and production deployment pass the tested gates. No P0 or P1 defects remain in the tested scope.

Hosted Supabase migrations and security hardening are applied and verified. The Vercel production deployment is `READY` at `https://signalboard-elvaddy-labs-projects.vercel.app`. Through a temporary Vercel share URL, the production smoke test verified unauthenticated redirect, sign-in and sign-up HTTP 200 responses, middleware runtime health, Turnstile script loading and locale switching. Direct unauthenticated requests currently redirect to Vercel SSO because Deployment Protection is enabled. Authenticated sign-up/session/CRUD/RLS smoke was not run against the hosted project because it would create external user and project data without a dedicated test account.

## Automated evidence

| Gate | Result |
| --- | --- |
| ESLint | Pass |
| TypeScript | Pass |
| Vitest | 17 passed |
| Supabase pgTAP | 30 passed, including negative create/read/update/delete/RPC isolation |
| Playwright | 13 passed, 3 intentional cross-viewport skips |
| axe in browser journeys | No serious or critical violations in tested routes |
| Next.js production build | Pass |
| Vercel production smoke | Pass: `READY`, public Auth routes 200, Turnstile loaded, no runtime errors |

The authenticated Playwright journey proves sign-up/session persistence, sample loading, Project create/read/update/delete, URL-persisted search, Project detail, Activity history, late-completion analytics, retained deletion history and sign-out against the real local Supabase stack. The mobile journey proves navigation, locale persistence, sign-out and absence of horizontal overflow.

## Visual and responsive review

- Approved Warm Signal direction is implemented across Auth, Dashboard, Projects and Project Detail.
- Desktop implementation was reviewed at 1440 px.
- Mobile implementation was reviewed at 390 px; measured document width equals viewport width.
- Status overview uses a real Recharts donut with a separate readable legend and semantic table alternative.
- Desktop and mobile implementation evidence is stored in `portfolio-screenshots/`.
- The fixed mobile bottom navigation can appear over one point of a full-page stitched screenshot; during normal scrolling it remains fixed to the viewport as designed.

## Accessibility review

- Auth controls and locale controls are keyboard operable.
- Dialogs, confirmation dialogs and menus use Radix focus management and restore focus.
- Validation summaries and field errors use ARIA relationships and programmatic focus.
- Charts provide textual/semantic alternatives and disable nonessential animation.
- Color adjustments were made for primary, danger, confirmation and selected-navigation states.

## Scope notes

- Settings and Help remain visibly disabled because they are post-v1 non-goals.
- Password reset, email delivery, teams, roles, Tasks, files, comments, sharing, payments, notifications and AI are intentionally outside v1.
- English is the default interface; Ukrainian is available from the explicit language menu and uses the internal locale code `uk`.

## Post-deploy notes

- The connected Vercel deployment tool required a temporary `.env.production` payload for runtime environment loading. It contained only public `NEXT_PUBLIC_*` values and was not written to the repository; no Supabase or Turnstile secret was included.
- The Vercel project environment variables remain configured for Production and Preview for future dashboard/CLI deployments.
- The browser may still probe `/favicon.ico`; the canonical icon is served successfully from `/icon.svg` and declared in document metadata.
- For a public Fiverr portfolio, disable Vercel Deployment Protection for the Production environment (or configure an equivalent public access policy) before sharing the URL.
- Run the authenticated production journey later with a disposable test account when external data creation is approved.
