# SignalBoard component and state inventory

This inventory is implementation-neutral. It defines what each component must communicate in high-fidelity designs and later code.

## Shell

| Component | Variants | Required states |
|---|---|---|
| App Sidebar | expanded, collapsed icon rail | default, hover, selected, focus |
| Mobile App Bar | title, back-navigation | default, menu open |
| Mobile Bottom Nav | Dashboard, Projects | default, selected, focus |
| App Header | desktop, tablet, mobile | default, user menu open, language menu open |
| Language Menu | English, Ukrainian | closed, open, selected |
| User Menu | profile summary, sign out | closed, open, pending sign-out |

## Actions and forms

| Component | Variants | Required states |
|---|---|---|
| Button | primary, secondary, ghost, destructive, icon | default, hover, focus, pressed, disabled, pending |
| Text Input | email, password, title, lead, search | empty, filled, focus, disabled, invalid |
| Textarea | Project description | empty, filled, focus, limit-near, invalid |
| Select | status, priority, sort | closed, open, selected, invalid |
| Date Field | optional Deadline | empty, selected, past-date warning, invalid |
| Checkbox/Turnstile region | auth challenge | loading, ready, verified, error |
| Search Field | Projects | idle, typing, populated, cleared |
| Filter Control | status, priority, deadline | inactive, active, menu open |
| Pagination | first, middle, last page | default, current, disabled, focus |

## Project presentation

| Component | Variants | Required states |
|---|---|---|
| Project Table | populated, no results | row hover, row focus, action menu open |
| Project Card | mobile populated | default, overdue, completed, action menu open |
| Status Indicator | Planning, Active, Review, Completed | table dot, compact tag |
| Priority Indicator | Low, Medium, High | table dot, compact tag |
| Progress Bar | 0–100% | empty, partial, complete |
| Deadline Label | none, upcoming, overdue, completed | neutral, review, danger, success |
| Project Metadata | detail definition list | default, long-copy wrap |

## Dashboard

| Component | Variants | Required states |
|---|---|---|
| KPI Metric | count, rate, undefined | default, positive/negative context |
| Completion Trend | populated, zero events | default, tooltip/focus, loading |
| Status Donut | populated, empty | default, segment focus, loading |
| Upcoming Deadlines | populated, none | default, row hover, loading |
| Recent Projects | populated, none | default, row hover, loading |
| Recent Activity | linked Project, deleted snapshot | default, row hover, loading |
| Dashboard Onboarding | empty account | default, load-sample pending/error |

## Overlays

| Component | Variants | Required states |
|---|---|---|
| Project Sheet | create, edit | pristine, dirty, invalid, warning, pending, server error |
| Filter Sheet | mobile Projects filters | pristine, changed, apply pending |
| Alert Dialog | delete Project | open, destructive pending, error |
| Dropdown Menu | row actions, user, language | open, item focus, destructive item |
| Toast/Status Notice | success, warning, error | enter, visible, reduced-motion |

## System states

| State | Visual requirement | Primary action |
|---|---|---|
| Route loading | geometry-preserving skeleton | none |
| Empty account | focused onboarding panel | Create Project |
| No search results | query/filter summary | Clear filters |
| Recoverable error | concise explanation | Retry |
| Not found/not owned | neutral non-disclosing state | Back to Projects |
| Form validation | summary + inline messages | Correct fields |
| Auth failure | inline alert above form | Retry sign-in/up |

## Accessibility annotations for design files

- Mark expected focus order on auth, Sheet and dialog frames.
- Annotate focus return target for every overlay.
- Include text equivalents beside chart frames.
- Specify accessible names for icon-only actions.
- Annotate mobile card reading order and the relationship between label/value pairs.
