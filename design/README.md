# SignalBoard design package

This folder is the authoritative visual-design package for SignalBoard v1.

## Approved direction

The approved direction is **Warm Signal**: a restrained light product interface with an ink-black application shell, chalk and ivory working surfaces, terracotta primary actions, petrol analytics, and semantic status colors.

The master reference is:

- `references/signalboard-dashboard-approved.png`

## Package contents

- `DESIGN_SYSTEM.md` — visual language, layout, tokens, responsive rules, data-visualization rules, accessibility and localization constraints.
- `IMPLEMENTATION_OVERRIDES.md` — authoritative copy, terminology and scope corrections to apply in code without regenerating the approved mockups.
- `COMPONENT_INVENTORY.md` — implementation-neutral component anatomy, variants and states.
- `SCREEN_MATRIX.md` — all required high-fidelity frames and the state each frame proves.
- `tokens/signalboard.tokens.json` — portable design-token source for Figma variables or later frontend implementation.
- `references/` — approved master reference.
- `screens/` — numbered high-fidelity screen references from `SCREEN_MATRIX.md`.

## Scope boundary

This package contains design artifacts only. It is not an application scaffold and does not include frontend, backend, Supabase, routing or build configuration.

## Handoff precedence

The PNG files are authoritative for visual composition. When text or visible functionality in a generated image conflicts with the approved v1 domain or scope, apply `IMPLEMENTATION_OVERRIDES.md` during implementation and keep the image unchanged.

## Naming convention

Generated screens use `NN-screen-state-viewport.png`, for example:

- `01-dashboard-populated-desktop.png`
- `06-project-create-sheet-desktop.png`
- `11-projects-filters-mobile.png`

Frame numbers and expected viewports are defined in `SCREEN_MATRIX.md`.
