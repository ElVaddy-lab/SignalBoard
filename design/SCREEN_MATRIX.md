# SignalBoard v1 high-fidelity screen matrix

All frames inherit `DESIGN_SYSTEM.md` and the approved dashboard reference. Each numbered frame is a separate deliverable image saved in `design/screens/`.

## Desktop frames

| ID | File | Viewport | Screen/state | What the frame must prove |
|---:|---|---:|---|---|
| 01 | `01-dashboard-populated-desktop.png` | 1600×1000 | Populated Dashboard | Approved master direction, all metrics and analytics |
| 02 | `02-auth-sign-in-desktop.png` | 1600×1000 | Sign in + Turnstile | Public shell, language switch, password form, auth error area |
| 03 | `03-auth-sign-up-desktop.png` | 1600×1000 | Sign up + Turnstile | Immediate-account messaging, password rules, sign-in link |
| 04 | `04-dashboard-empty-desktop.png` | 1600×1000 | Empty Dashboard | No empty chart grid; Create Project and Load Sample Data |
| 05 | `05-projects-list-desktop.png` | 1600×1000 | Projects list | Search, filters, sort, 12-row semantic table, pagination |
| 06 | `06-project-detail-desktop.png` | 1600×1000 | Project detail + Activity | Metadata, description, progress, edit/delete, timeline |
| 07 | `07-project-create-sheet-desktop.png` | 1600×1000 | Create Sheet | Empty form, defaults, optional Deadline, sticky actions |
| 08 | `08-project-edit-validation-desktop.png` | 1600×1000 | Edit Sheet + validation/warning | Inline validation, past-Deadline warning, dirty form |
| 09 | `09-project-delete-dialog-desktop.png` | 1600×1000 | Delete AlertDialog | Project title, retained-history explanation, destructive action |
| 10 | `10-projects-no-results-desktop.png` | 1600×1000 | Search/filter empty | Active filters, zero results, Clear Filters action |
| 11 | `11-dashboard-loading-desktop.png` | 1600×1000 | Dashboard loading | Geometry-preserving skeletons |
| 12 | `12-dashboard-error-desktop.png` | 1600×1000 | Dashboard recoverable error | Error boundary, Retry and safe navigation |
| 13 | `13-project-not-found-desktop.png` | 1600×1000 | Not found/not owned | Neutral non-disclosing 404-style state |
| 14 | `14-projects-ukrainian-desktop.png` | 1600×1000 | Projects list in Ukrainian | Long labels, localized dates, no clipping |

## Mobile frames

Mobile screens are rendered as a single 390×844 app viewport centered on a horizontal 1600×1000 presentation canvas. The presentation canvas is neutral and contains only the frame title and viewport annotation outside the app viewport; it is not a device mockup.

| ID | File | App viewport | Screen/state | What the frame must prove |
|---:|---|---:|---|---|
| 15 | `15-dashboard-populated-mobile.png` | 390×844 | Populated Dashboard | Mobile app bar, KPI navigation, stacked analytics, bottom nav |
| 16 | `16-projects-cards-mobile.png` | 390×844 | Projects cards | Equivalent table data without horizontal overflow |
| 17 | `17-projects-filters-mobile.png` | 390×844 | Filters Sheet open | Near-full-screen Sheet, selected filters, Apply/Clear |
| 18 | `18-project-create-mobile.png` | 390×844 | Create Sheet | Mobile form, keyboard-safe spacing, sticky actions |
| 19 | `19-auth-sign-in-mobile.png` | 390×844 | Sign in | Auth layout, language access, Turnstile, 16px inputs |

## Shared content rules

- Apply `IMPLEMENTATION_OVERRIDES.md` to all frames. It records approved corrections that belong in code and do not require PNG regeneration.
- English is the primary/default interface and portfolio presentation. The visible language labels are `EN` for English and `UA` for optional Ukrainian. The `UK` text in frame 14 is corrected in code without regenerating the PNG; internal i18n may use standards-compliant `uk` or `uk-UA`.

- Preserve the approved sample metrics: Total 18, Active 6, Completion Rate 33%, Overdue 3, Late Completions 2 / 25%.
- Use the exact Project lifecycle: Planning, Active, Review, Completed.
- Use the exact Priority set: Low, Medium, High.
- Always label the responsible person as Project Lead, not Owner, in detailed/product copy. The approved dashboard image may retain “Owner” as a visual reference artifact, but all new frames use “Project Lead”.
- Every status/risk state includes text or an icon in addition to color.
- English sample Project content remains English even in the Ukrainian UI stress frame.
