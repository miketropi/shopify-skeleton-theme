---
name: shopify-skeleton-theme
description: >-
  Builds and standardizes Shopify Liquid sections, snippets, SCSS, and
  TypeScript for this skeleton theme (section registry, naming, locales, Theme
  Check, Vite). Invoked when creating or refactoring sections/snippets, wiring
  data-section-type, adding schema translations, or aligning folder structure
  with the repo.
---

# Shopify skeleton theme — section & snippet workflow

## Before writing files

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md` — one job per section; `section-*` vs `main-*`.
2. Read `docs/SECTION_REGISTRY.md` if the section needs JavaScript (register before `bootSections()`, `destroy()` cleanup).
3. For colours, use `docs/COLOR_SCHEME_SYSTEM.md` and the `color-scheme-vars` snippet pattern.

## New interactive section (end-to-end)

Use a **content-based** filename such as `sections/section-promo-grid.liquid` (not `main-index` unless template-bound).

| Step | Action |
|------|--------|
| 1 | Add Liquid: outer root, `class`, optional `style="--…: {{ … }}"` for merchant settings. For typical page sections (not overlays/drawers/header chrome), add `{%- render 'section-styles', section: section -%}` before the root, class `shopify-section-wrapper` on the root, and the schema settings from `snippets/section-styles.liquid` — see `.cursor/rules/liquid-patterns.mdc` (*Section shell*); omit when inappropriate. **If the section matches the product-slider intro pattern** (eyebrow + heading, shared merchant options), follow *Product-slider family* in the same file for shared classes and heading scale. |
| 2 | Set `data-section-type="<kebab-string>"` and `data-section-id="{{ section.id }}"` on that root (must match TS). |
| 3 | Add `{% schema %}` with `t:` keys; add new keys under `locales/en.default.schema.json` (e.g. `sections.promo_grid`). |
| 4 | Add `src/styles/sections/_section-promo-grid.scss` and `@forward 'section-promo-grid';` in `src/styles/sections/index.scss`. |
| 5 | Add `src/scripts/section-promo-grid.ts` (or `src/scripts/sections/section-promo-grid.ts` if using a lazy `*.runtime.ts`). Export `registerSectionPromoGrid()` calling `registerSection`. |
| 6 | In `src/scripts/theme.ts`, import and call `registerSectionPromoGrid()` **before** `bootSections()`. |
| 7 | Optionally add the section to a JSON template under `templates/`. |
| 8 | Run `npm run check` and `npm run build`. |

**Heavy dependencies (Swiper, large GSAP):** thin `section-*.ts` in `src/scripts/sections/` that only registers and dynamic-imports `./section-*.runtime.ts` (see `section-hero-slider.ts`).

**Teardown:** use `AbortController` `{ signal }` on listeners; kill GSAP tweens; destroy third-party instances in `destroy()`.

**JS-driven UI (sliders, carousels):** loader until ready, soft GSAP reveal, merchant **On/Off** for scroll-into-view where appropriate — see `.cursor/rules/liquid-patterns.mdc` → *JS-driven UI: loading, reveal, and scroll effects*.

## New section without JavaScript

- Same Liquid (including optional **`section-styles` + `shopify-section-wrapper`** when appropriate — see *Section shell* in `.cursor/rules/liquid-patterns.mdc`), schema, locales, SCSS steps.
- Omit `data-section-type` and do not call `registerSection`.

## New snippet

1. Name `snippets/feature-card.liquid` (kebab-case); use prefixes (`pdp-`, `header-`) for families of partials.
2. Accept explicit parameters: `{% render 'feature-card', title: block.settings.title, url: link %}`.
3. Do not read `section.settings` inside the snippet unless passed in as arguments.

## Code standardization

| Area | Rule |
|------|------|
| Liquid | `{%- liquid -%}` for assigns; hyphenated `-%}` to trim; JS hooks via `data-*`, not classes. |
| TS | Prettier: no semicolons, single quotes; scope queries to `container`; prefer `type` for small shapes. |
| SCSS | Mobile-first + `mq-up()` from `base/breakpoints`; section-scoped class prefixes; Liquid-driven values as CSS variables on section root. **Font sizes:** use `:root` tokens from `snippets/css-variables.liquid` (`--font-size-xs` … `--font-size-4xl`) with fallbacks—see `.cursor/rules/scss-styles.mdc` (*Typography and font size*). **Shared intro typography:** use `section-intro__*` classes from `src/styles/components/_section-intro.scss` — see `.cursor/rules/liquid-patterns.mdc` (*Product-slider family*). |
| Accessibility | Keyboard, focus return, `aria-*`, `prefers-reduced-motion` for motion. |

## Verification

- `npm run check` after `sections/`, `snippets/`, `layout/`, `config/` Liquid/JSON changes.
- `npm run build` after `src/scripts/` or `src/styles/` changes.
