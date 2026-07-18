# SignalBoard v1 — mockup implementation overrides

Status: **Approved handoff corrections**  
Applies to: every image in `design/references/` and `design/screens/`  
Asset policy: **do not regenerate or edit the approved PNG mockups**

## 1. Purpose and precedence

The existing mockups remain the approved source for visual direction: composition, grid, spacing, typography, color, density, component shape and responsive behavior.

This document corrects product-language and scope inconsistencies that appear inside some generated images. During implementation, use the following precedence whenever an image conflicts with written requirements:

1. `CONTEXT.md` for domain meaning and terminology.
2. `docs/IMPLEMENTATION_PLAN.md` for v1 product scope and behavior.
3. This document for screen-specific corrections.
4. `DESIGN_SYSTEM.md`, `COMPONENT_INVENTORY.md` and `SCREEN_MATRIX.md` for visual and state rules.
5. The PNG mockup for visual composition only.

An item marked for replacement or removal below is not a request for a new mockup. Apply the correction directly while building the corresponding component or screen.

## 2. Language strategy

- English is the default and primary interface language.
- The English experience is the main portfolio presentation for Fiverr: default routes, demo content, screenshots and first-run experience should open in English.
- Ukrainian is an optional secondary localization and must not block the English-first release.
- Show `EN` for English and `UA` for Ukrainian in the visible language menu.
- The `UK` label visible in the Ukrainian mockup is a reference-image mistake. Replace it with `UA` during implementation without regenerating the PNG.
- Keep standards-compliant internal language identifiers separate from the visible labels: `en` for English and `uk` (or regional tag `uk-UA`) for Ukrainian. Never expose `uk` as the English option.
- User-created Project titles, descriptions and Project Lead names are stored as entered and are not automatically translated.
- Screen 14 remains a localization stress reference, not the default product presentation.

## 3. Global terminology corrections

| Shown or implied in a mockup | Implement as | Rule |
|---|---|---|
| Owner | Project Lead | A Project Lead is descriptive text and is not the User or an account role. |
| Team member / teammate / member | Remove | v1 has no team accounts, membership or roles. |
| Team workspace / collaboration workspace | Private project workspace or projects | Each User has an independent private Project set. |
| Assignee selector for Project Lead | Plain text input | Do not load Users, members or selectable accounts. |
| Task | Project, when referring to the tracked domain object | Tasks are outside v1 scope. |
| Share | Remove | Sharing and invitations are outside v1 scope. |

These corrections change labels and behavior only. Preserve the original component dimensions, hierarchy and style wherever possible.

## 4. Screen-specific overrides

### 01 — Populated Dashboard

- Change the `Owner` table column label to `Project Lead`.
- Keep the five approved KPI groups, including `Late Completions`.
- Activity copy must describe Project changes, not team collaboration. Prefer neutral event text such as `Project created`, `Description updated`, `Status changed`, `Priority changed`, `Deadline changed` and `Project Lead changed`.
- Do not add member, assignee, invitation or collaboration behavior based on names visible in sample data.

### 02 and 19 — Sign in, desktop and mobile

Replace:

> Sign in to access your projects and team workspace.

With:

> Sign in to access your projects and progress dashboard.

Keep the layout, Turnstile region, validation area, English default and language menu unchanged.

### 03 — Sign up

Replace:

> Start collaborating on projects in seconds.

With:

> Start tracking your projects in seconds.

Keep:

> No email confirmation required.

Do not introduce workspace creation, invitations, organization names or team onboarding.

### 06 — Project Detail and Activity

- Keep only the approved Project overview and Activity timeline structure shown in screen 06.
- Activity records represent successful changes to the Project. They are not messages, comments, file uploads or team updates.
- Do not display another person's name as the authenticated actor. Project Lead names are descriptive data, not SignalBoard accounts. Neutral event descriptions are preferred.
- Keep `Project Lead` as the detail label.

### 07 and 18 — Create Project, desktop and mobile

Replace the Sheet description:

> Add a new project to start tracking progress and collaborate with your team.

With:

> Add a new project to start tracking progress and deadlines.

Implement `Project Lead *` as a standard text input:

- placeholder: `Enter project lead name`;
- no dropdown icon;
- no member list, account search or invitation flow;
- retain the same field height, label position and overall form spacing.

Keep Deadline optional.

### 08 — Edit Project with validation

- Implement `Project Lead *` as an editable text input containing the saved string, for example `Sarah Lee`, not as a Select.
- Keep the inline Title validation and non-blocking past-Deadline warning.
- Deadline remains optional even if the generated frame shows a required asterisk. Remove the asterisk from the implemented label.
- Preserve the disabled `Save changes` state while the form is invalid.

### 09 — Delete Project dialog

- The dialog itself is approved: Project title, permanent-removal warning, retained Activity history, Cancel and destructive confirmation.
- Treat the page visible behind the dialog as presentation-only. Do not implement its `Tasks`, `Files`, `Team`, `Settings`, `Share`, `Task Summary` or `Team Members` elements.
- Open the dialog over the actual v1 Project Detail screen defined by screen 06.
- Retained Activity must use the deleted Project title snapshot and must not imply retained team content.

### 14 — Ukrainian localization stress frame

- Replace the visible compact language label `UK` with `UA` during implementation. The PNG remains unchanged.
- Use `uk` or `uk-UA` only as the internal Ukrainian locale value where required by the i18n library and `<html lang>` standards.
- Treat this frame as optional localization QA. It does not replace English as the default interface or the primary Fiverr portfolio presentation.
- English Project titles and Project Lead names may remain untranslated, as shown.

## 5. Out-of-scope elements visible in generated imagery

The following are reference-image artifacts and must not be inferred as v1 requirements:

- teams, members, roles, invitations or shared workspaces;
- Tasks or task-management screens;
- Files, uploads or attachments;
- comments or messages;
- Project sharing;
- organization/workspace management;
- account-backed Project Lead selection;
- project-level Settings tabs beyond the approved edit flow.

Removing these artifacts does not require redistributing the surrounding layout in a new mockup. Build the approved v1 screen from its canonical frame and reuse the established Warm Signal spacing and panel rules.

## 6. Handoff acceptance rule

The design package is ready for implementation without image regeneration when all of the following are true in code:

- English opens by default, the visible options are `EN` and `UA`, and Ukrainian is optional;
- all visible domain labels follow `CONTEXT.md`;
- Project Lead is a required free-text value;
- Deadline is optional;
- Activity contains only approved Project lifecycle changes;
- no collaboration, member, task, file or sharing functionality is derived from a mockup artifact;
- implemented layouts preserve the approved Warm Signal visual direction and responsive behavior.
