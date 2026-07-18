# SignalBoard v1 Design System — Warm Signal

Status: **Approved visual direction**  
Source of truth: `references/signalboard-dashboard-approved.png`  
Coverage: desktop and mobile authenticated shell, auth, Projects, Project detail, mutations, analytics and system states.

## 1. Design principles

1. **Operational clarity first.** Every surface exists to support scanning, comparison, navigation or action.
2. **Warm, not decorative.** Warm neutrals replace sterile white, but texture, gradients and ornamental graphics remain absent.
3. **One strong signal.** Terracotta identifies the primary action or currently selected destination; it is never scattered as decoration.
4. **Data has its own voice.** Petrol carries charts and progress. Semantic colors communicate risk and lifecycle state with text or icons, never color alone.
5. **Rules over shadows.** Structure comes from spacing, alignment and warm 1px dividers. Shadows are exceptional.
6. **Dense but breathable.** The product fits meaningful information in one viewport while retaining consistent 8px-based rhythm.

## 2. Foundation tokens

### 2.1 Color roles

| Token | Value | Role |
|---|---:|---|
| `canvas` | `#F6F2EA` | Main app background |
| `surface` | `#FBF9F4` | Panels, sheets, dialogs, auth card |
| `surface-subtle` | `#F1ECE2` | Hover rows, icon wells, subdued groups |
| `ink` | `#20201E` | Primary text |
| `ink-muted` | `#6E6A63` | Secondary text and metadata |
| `ink-faint` | `#938D84` | Placeholder and disabled text |
| `sidebar` | `#181918` | App shell |
| `sidebar-raised` | `#222321` | Hover/focus surface in shell |
| `border` | `#DCD4C7` | Primary divider and panel outline |
| `border-strong` | `#C9BFAF` | Input and table emphasis |
| `primary` | `#C94A2C` | Primary CTA and selected destination |
| `primary-hover` | `#AE3D24` | Primary hover/pressed |
| `primary-soft` | `#F4DED5` | Selected/notice background |
| `petrol` | `#0F5962` | Charts, progress and active data |
| `petrol-soft` | `#DCEBEC` | Active/status background |
| `success` | `#4F8A50` | Completed/on-track |
| `success-soft` | `#E3EEE0` | Success background |
| `review` | `#CF9113` | Review/at-risk |
| `review-soft` | `#F6E9C9` | Review background |
| `danger` | `#C83F2B` | Overdue/destructive/error |
| `danger-soft` | `#F5DDD7` | Error background |
| `focus` | `#2563EB` | Keyboard focus ring only |

Color application limit: one primary, one data hue and at most two semantic hues may dominate any viewport. Remaining semantic colors appear only where the data requires them.

### 2.2 Typography

Primary family: **IBM Plex Sans Condensed**. Fallback: `Arial Narrow`, `Roboto Condensed`, system sans-serif.

| Style | Size / line | Weight | Tracking | Usage |
|---|---|---:|---:|---|
| Display KPI | 52 / 56 | 400 | -0.03em | Dashboard KPI values |
| Page title | 30 / 36 | 600 | -0.02em | Screen heading |
| Section title | 16 / 20 | 600 | 0.04em | Uppercase panel headings |
| Body | 15 / 22 | 400 | 0 | Primary copy |
| Body compact | 14 / 20 | 400 | 0 | Tables, lists, controls |
| Label | 12 / 16 | 600 | 0.06em | Uppercase labels and column headings |
| Metadata | 12 / 16 | 400 | 0 | Timestamps and helper text |

Rules:

- Use tabular numerals for metrics, dates, percentages and table values.
- Do not introduce a serif or a second display family.
- Ukrainian text may wrap to two lines; controls must grow rather than reduce text below 14px.
- Sentence case for actions; uppercase only for compact structural labels.

### 2.3 Spacing and sizing

Base unit: `4px`; primary rhythm: `8px`.

- Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
- Desktop sidebar: `216px`.
- Desktop header: `88px` including bottom divider.
- Desktop content padding: `26px` horizontal, `24px` vertical.
- Panel internal padding: `20px` default, `16px` compact.
- Form field gap: `16px`; section gap: `24px`.
- Touch target: minimum `44px`; primary desktop controls: `48px`.
- Desktop max content width: fluid after sidebar; do not center inside an artificial marketing container.

### 2.4 Radius, border and elevation

- Panel radius: `8px`.
- Control radius: `6px`.
- Badge radius: `999px`, restricted to compact status/priority tags.
- Border: `1px solid border`.
- Shadow: none by default.
- Sheet/dialog elevation: `0 20px 60px rgba(32, 32, 30, 0.16)`.
- Focus: `0 0 0 3px rgba(37, 99, 235, 0.28)` plus visible outline where needed.

## 3. Layout system

### 3.1 Desktop shell — 1440–1600px

- Fixed 216px ink sidebar.
- Sticky 88px app header on the chalk canvas.
- Content follows a 12-column grid with 16px gutters.
- KPI strip uses five equal tracks.
- Primary analytics row: trend chart 5 columns, status 3 columns, deadlines 4 columns.
- Lower row: Recent Projects 8 columns, Recent Activity 4 columns.
- Panels in the same row share top and bottom alignment.

### 3.2 Tablet — 768–1199px

- Sidebar collapses to a 72px icon rail or a modal navigation drawer.
- Header actions retain language, user and primary action; secondary copy may truncate.
- KPI strip becomes a 3 + 2 grid.
- Trend chart spans full width; status and deadlines share the next row.
- Project table may remain only above 960px; below it use cards.

### 3.3 Mobile — 320–767px

- No persistent sidebar. Use a 64px top app bar plus bottom navigation for Dashboard and Projects.
- Content padding: 16px; gaps: 12–16px.
- One-column flow with KPI summary as a horizontally scrollable snap row only when all five metrics cannot fit; provide a visible position affordance.
- Charts use a minimum 280px plot width and an explicit text alternative.
- Project rows become cards with Title, Status, Priority, Lead, Completion and Deadline always visible.
- Filters and create/edit forms use near-full-screen Sheets.
- Dialogs use 16px viewport margin and must never exceed available height.

## 4. App shell

### Sidebar

- Wordmark: white, 28px, with a 4px terracotta signal mark.
- Navigation row: 52px high, 20px icon, 16px gap.
- Selected row: terracotta-tinted dark surface with 4px solid terracotta leading edge.
- Settings and Help are anchored after a divider near the bottom.
- Sidebar never contains decorative charts, slogans or illustrations.

### Header

- Page context is left aligned.
- Language and user menu are separated by vertical rules.
- Primary button is terracotta, 48px high and never pill-shaped.
- On mobile, greeting becomes a compact page title; user/language move to a menu.

## 5. Core components

### Buttons

- Primary: terracotta fill, ivory text, 48px desktop / 44px mobile.
- Secondary: transparent surface, ink text, 1px strong border.
- Ghost: no border, muted ink; hover uses `surface-subtle`.
- Destructive: danger fill; confirmation required for Project deletion.
- Icon-only controls always have accessible labels and 44px targets.

### Inputs

- Height: 48px; textarea minimum: 128px.
- Visible label above input; placeholder is an example, not the label.
- Default border `border-strong`; focus uses `focus`; error uses danger and inline copy.
- Helper/warning text sits 8px below the control.
- Selects share the same height, typography and focus behavior.

### Status and priority

- Status: dot + label in tables; compact tinted tag in mobile cards or forms.
- Priority: dot + label; High danger, Medium review, Low success.
- Overdue: danger icon/text and explicit “Overdue”; never a red date alone.

### Panels and lists

- Panel heading row: 56px, 20px horizontal padding, optional trailing text action.
- List rows: 52–64px depending on metadata; use dividers rather than individual cards.
- Hover is `surface-subtle`; selected state adds a leading petrol or terracotta rule.

### Tables

- Header row: 44px, 12px uppercase labels.
- Data rows: 56px minimum.
- Title is the strongest cell; metadata remains muted.
- Progress uses a 6px petrol bar plus numeric percentage.
- Row action is a 44px ghost icon button.
- Pagination sits in its own 56px footer row.

### Sheets and dialogs

- Desktop Sheet width: 480px; create/edit uses right-side entry.
- Mobile Sheet: width 100%, height up to 94dvh, top corners 12px.
- Sheet header and footer remain visible while body scrolls.
- Alert dialog width: 440px; destructive action follows the warning, never precedes it.

## 6. Data visualization

### Completion Trend

- Petrol line, 2px; 8px circular points.
- No decorative area fill in the approved direction.
- Horizontal guides use warm border color; vertical guides are omitted unless essential.
- Explicit 0–100% y-axis and 12 ISO-week x-axis.
- Tooltip contains week range and completion count/rate.

### Status donut

- Four stable colors: Planning petrol-dark, Active petrol, Review review, Completed success.
- Total centered in the donut.
- Legend always includes label and count; percent may be secondary.
- Provide an accessible text/table equivalent.

## 7. Content and localization

- English is the default design reference.
- Ukrainian stress frames use long labels such as “Завершено із запізненням”, “Керівник проєкту” and “Найближчі терміни”.
- User-created Project titles and descriptions are not translated.
- Dates are localized; deadlines remain date-only.
- Avoid fixed-width text containers that assume English lengths.

## 8. State language

- Loading: preserve geometry with neutral skeletons; no global spinner-only page.
- Empty: one focused explanation and one primary next action; no empty analytics grid.
- Validation: inline message under the field and a form-level summary after submit.
- Warning: review color and icon; does not block submission.
- Error: danger icon, concise explanation, Retry action and safe navigation.
- Not found: neutral 404-style state that does not reveal ownership.
- Success: subtle inline confirmation or toast; never a full-screen celebration.

## 9. Motion

- Default transition: 140ms ease-out for color, border and opacity.
- Sheet: 180ms ease-out; dialog: 140ms opacity + 4px translate.
- Avoid chart drawing animation on repeat navigation.
- `prefers-reduced-motion` removes transforms and retains only instant state changes.

## 10. Accessibility acceptance

- Target WCAG 2.2 AA contrast.
- Status is never encoded by color alone.
- Keyboard focus is visible on every interactive element.
- Dialog/Sheet focus is trapped and returns to the invoker.
- Table has a caption and scoped headers; mobile cards preserve equivalent fields.
- Charts have legends and semantic data alternatives.
- 200% zoom, 320px width and long Ukrainian labels must not create horizontal page overflow.
