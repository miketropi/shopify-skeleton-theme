# Routine Guide

> **Status:** **Implemented** — `sections/section-routine-guide.liquid`, snippets, SCSS, and TypeScript registered in `theme.ts`.

> Two-column editorial section: a **featured product card** on the left and an interactive **step guide** on the right (internally split into a **feature image panel** and a **step list**). The center feature image crossfades to match the active step (hover on desktop, tap/focus on touch).

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = one featured product + stepped routine guide only. No unrelated blocks (hero, FAQ, etc.). See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: `section-routine-guide.liquid`. Block type: `step`. BEM root: `routine-guide`. Interactive: `data-section-type="section-routine-guide"`. SCSS: `src/styles/sections/_section-routine-guide.scss` (or `routine-guide/` partials if it grows). TS: `section-routine-guide.ts` + `section-routine-guide.runtime.ts`. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | `{% render 'section-styles', section: section %}` + `shopify-section-wrapper` on the section root. **Do not** use standalone `section_padding_top` / `section_padding_bottom` only — merge **section-styles** from `snippets/section-styles.liquid` (padding four sides, margin, background, border, radii). See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | `section_color_scheme_mode` + `color_scheme` + `color-scheme-vars` for the section band, header, and step typography defaults. **`card_background_color`** is an intentional panel tint for the product column (like promo card fills). See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Typography (product-slider family)** | Section **eyebrow** → `product-slider__eyebrow`. Section **heading** → `product-slider__heading`. Root: `product-slider--heading-{{ section.settings.heading_size }}` with values `small` \| `medium` \| `large` \| `xlarge` only. Step copy uses section-specific classes (`routine-guide__step-*`); step number can reuse eyebrow scale or a dedicated uppercase token. |
| **Product card** | **`{% render 'tcard-product', product: section.settings.product, … %}`** — not `product-card.liquid`. Pass section toggles aligned with Product slider: `show_secondary_image`, `show_vendor`, `show_quick_add`. Quick add uses global **`data-ajax-add-to-cart`** interception. Placeholder when no product selected (copy pattern from Product images story). |
| **Step ↔ image interaction** | Same **active index + opacity crossfade** model as **Collection list** (`coll-list`): stacked feature images, one visible; list rows carry `data-routine-guide-step`; JS sets active class + `aria-current` / `aria-selected` as appropriate. **Fine pointer + hover:** `mouseenter` activates; **all devices:** `pointerdown` + `focusin` activate. Honour **`prefers-reduced-motion`** (instant swap or minimal fade). |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Prefer `mq-up('md')` / `mq-up('lg')` over 1024px / 767px literals. Column ratios via **`Nfr` CSS variables** (not `calc(var(--x) * 1fr)` — invalid). |
| **Typography tokens** | Body/step description via `var(--font-size-*, …)` from `snippets/css-variables.liquid`. See `.cursor/rules/scss-styles.mdc`. |
| **JS-driven UI** | Optional **loading → GSAP soft reveal** after images ready; merchant toggle **`entrance_animate_on_scroll`** (default on). `registerSection` + full `destroy()` (`AbortController`, kill tweens). See `.cursor/rules/liquid-patterns.mdc` → *JS-driven UI* and `docs/SECTION_REGISTRY.md`. **No Swiper.** |
| **Locales** | Schema `name` / `label` / `info` → **`t:sections.routine_guide.*`**; storefront strings in `locales/en.default.json`; schema strings in `locales/en.default.schema.json`. |
| **Schema constraints** | Text settings that require defaults use **non-empty `default`** values (no `"default": ""`). Use `image_picker` (not `image`), `checkbox` (not `toggle`). |
| **Theme Check** | `npm run check` after Liquid; `npm run build` after TS/SCSS. |

**Not the same section as** Collection list (collection rows), Product slider (carousel of products), or Product images story (single product + slideshow) — though it **reuses** `tcard-product` and **coll-list-style** crossfade logic.

---

## Layout (target UX)

| Region | Content |
| --- | --- |
| **Header (full width above grid)** | Eyebrow → heading (optional description if added later). |
| **Product column (left at `lg+`)** | Panel with `card_background_color`; **`tcard-product`** inside. |
| **Guide column (right at `lg+`)** | Internal split: **feature image panel** \| **step list**. |
| **Step row** | `step_number` → heading + circular **thumb** → description; optional divider between steps. |

**Default active step:** first visible **`step`** block on load (or merchant **`default_active_index`** 1-based, clamped — same pattern as Collection list).

**Feature images:** All block `feature_image` layers stacked absolutely in the panel; inactive `opacity: 0`, active `opacity: 1`. Transition duration from **`hover_transition_speed`**.

---

## Section settings (functional spec)

### Header

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_text` | text | `Daily Skincare Steps` | Small label above heading; hide when blank. |
| `heading` | text | `3-Step Routine Guide` | Section headline. |
| `heading_size` | select | `large` | `small` \| `medium` \| `large` \| `xlarge`. |
| `default_active_index` | range | `1` | Active step on load (1-based, clamped to step count). |

### Layout & shell

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `column_ratio` | select | `33` | Product / guide split at **`lg+`**: `25` (25/75), `33` (33/67), `40` (40/60). CSS vars e.g. `--routine-guide-product-fr: 3fr`, `--routine-guide-guide-fr: 7fr`. |
| `feature_image_ratio` | select | `50` | Guide column internal split at **`lg+`**: `40`, `50`, `60` (feature % / list %). Vars `--routine-guide-feature-fr`, `--routine-guide-list-fr`. |
| `card_border_radius` | select | `medium` | Product panel + step rows: `none`, `small` (8px), `medium` (16px), `large` (24px). |
| `hover_transition_speed` | select | `300` | Feature crossfade: `150`, `300`, `500` (ms) → `--routine-guide-fade-duration`. |
| `full_width` | checkbox | `false` | Full-bleed background; inner uses `section-content-width` when on. |
| `entrance_animate_on_scroll` | checkbox | `true` | GSAP reveal after intersect vs on ready. |
| `section_color_scheme_mode` | select | `default` | `default` \| `custom`. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. |
| *(shell)* | — | — | `padding_*`, `margin_*`, `background_color`, `border_*`, corner radii from **`section-styles`**. |

### Product column

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `product` | product | — | Featured product. Empty → placeholder message (no card). |
| `card_background_color` | color | `#F9F3EE` | Panel background behind the card (`--routine-guide-product-bg`). |
| `show_secondary_image` | checkbox | `true` | Pass to `tcard-product`. |
| `show_vendor` | checkbox | `false` | Pass to `tcard-product`. |
| `show_quick_add` | checkbox | `true` | Pass to `tcard-product`; AJAX cart via theme global handler. |

### Media (guide)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `feature_media_size` | select | `medium` | Max width for feature + thumb images: `small` (600px), `medium` (1200px), `large` (1600px), `xlarge` (2400px). |

**Out of scope unless spec changes:** multiple products, video steps, standalone `section_padding_*` only, carousel of steps.

---

## Step block (`step`)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `step_number` | text | `Step 1` | Uppercase label above step heading. |
| `heading` | text | `Cleanse` | Step name. |
| `description` | textarea | _(suggested default in schema)_ | Short body copy; plain text or `rte` wrapper. |
| `feature_image` | image_picker | — | Full-panel image when step is active. Portrait ≥ 800×1000px recommended. Empty → theme placeholder (e.g. `lifestyle-1` rotated per block index). |
| `feature_image_position` | select | `center center` | `object-position`: center / top / bottom center. |
| `thumb_image` | image_picker | — | Circular thumb (~64px) beside heading. Empty → `feature_image` crop or placeholder. |

**Blocks:** `max_blocks: 6` (typical 3–6 step routines). Preset with 3 `step` blocks.

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS.

| Concern | `< md` (&lt; 48em) | `md` – `lg` (48–61.99em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| **Overall layout** | Single column — header → product → guide | Single column stacked | Two columns: product \| guide |
| **Guide internal** | Step list only; **feature panel hidden** | Feature image **above** step list | Feature \| list (ratio setting) |
| **Interaction** | Tap/focus highlights active step; **no feature panel** | Tap/focus updates feature image | Hover (`mouseenter`) + tap/focus |
| **Thumb** | Visible | Visible | Visible |
| **Product card** | Visible when product set | Visible | Visible |

> **Mobile:** Hiding the feature panel saves vertical space; active step styling still communicates progress. **Tablet+** restores the crossfade panel.

---

## Accessibility & interaction

| Requirement | Implementation hint |
| --- | --- |
| **Step list** | Use `<ol>` or `<ul>` with `<li>` per step; active step: visual class + `aria-current="step"` on the interactive row (button or link wrapper). |
| **Keyboard** | Each step row focusable; **focus** activates feature image (same as Collection list `focusin` delegation). |
| **Feature images** | Decorative layers: active image keeps meaningful `alt` from block heading / image alt; inactive layers `aria-hidden="true"`. |
| **Reduced motion** | Crossfade duration → `0` or instant opacity swap; skip/l shorten GSAP entrance. |
| **No-JS** | First step’s feature image visible; list readable; no hover dependency. |
| **Product card** | Inherit `tcard` link labels, quick-add live region patterns from global cart UX. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-routine-guide.liquid` |
| Snippets | `snippets/routine-guide-steps.liquid`, `snippets/routine-guide-feature-panel.liquid` (optional split) |
| Styles | `src/styles/sections/_section-routine-guide.scss` |
| Scripts | `src/scripts/sections/section-routine-guide.ts`, `section-routine-guide.runtime.ts` |
| Shared logic | Reuse patterns from `section-collection-list.runtime.ts` for activate index + `matchMedia('(hover: hover) and (pointer: fine)')` |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.routine_guide` in `en.default.schema.json` + `en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.routine_guide.*`**, merge **section-styles**, and follow non-empty text defaults. Structural hint only:

```json
{
  "name": "t:sections.routine_guide.name",
  "tag": "section",
  "class": "section-routine-guide",
  "max_blocks": 6,
  "settings": [
    { "type": "header", "content": "t:sections.routine_guide.headers.header" },
    { "type": "text", "id": "eyebrow_text", "default": "Daily Skincare Steps" },
    { "type": "text", "id": "heading", "default": "3-Step Routine Guide" },
    { "type": "select", "id": "heading_size", "default": "large" },
    { "type": "range", "id": "default_active_index", "min": 1, "max": 6, "default": 1 },
    { "type": "header", "content": "t:sections.routine_guide.headers.layout" },
    { "type": "select", "id": "column_ratio", "default": "33" },
    { "type": "select", "id": "feature_image_ratio", "default": "50" },
    { "type": "select", "id": "card_border_radius", "default": "medium" },
    { "type": "select", "id": "hover_transition_speed", "default": "300" },
    { "type": "select", "id": "feature_media_size", "default": "medium" },
    { "type": "checkbox", "id": "full_width", "default": false },
    { "type": "checkbox", "id": "entrance_animate_on_scroll", "default": true },
    { "type": "select", "id": "section_color_scheme_mode", "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "default": "scheme-6" },
    { "type": "header", "content": "t:sections.routine_guide.headers.product" },
    { "type": "product", "id": "product" },
    { "type": "color", "id": "card_background_color", "default": "#F9F3EE" },
    { "type": "checkbox", "id": "show_secondary_image", "default": true },
    { "type": "checkbox", "id": "show_vendor", "default": false },
    { "type": "checkbox", "id": "show_quick_add", "default": true }
  ],
  "blocks": [
    {
      "type": "step",
      "name": "t:sections.routine_guide.blocks.step.name",
      "settings": [
        { "type": "text", "id": "step_number", "default": "Step 1" },
        { "type": "text", "id": "heading", "default": "Cleanse" },
        { "type": "textarea", "id": "description", "default": "Gently remove dirt, oil, and impurities to refresh your skin." },
        { "type": "image_picker", "id": "feature_image" },
        { "type": "select", "id": "feature_image_position", "default": "center center" },
        { "type": "image_picker", "id": "thumb_image" }
      ]
    }
  ],
  "presets": [{
    "name": "t:sections.routine_guide.presets.name",
    "blocks": [{ "type": "step" }, { "type": "step" }, { "type": "step" }]
  }]
}
```

> Merge **section-styles** settings after layout headers (same order as `section-collection-list.liquid` / `section-before-after.liquid`).

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/SECTION_REGISTRY.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `docs/sections/Collection_List.md`.
2. Liquid: `section-styles` + `shopify-section-wrapper`; `routine-guide` + `product-slider--heading-*`; `data-section-type` / `data-section-id`; `data-routine-guide-*` for fade speed, active index, entrance flag.
3. Snippets: step list + feature panel; pass block index, images, radii from section.
4. SCSS: mobile-first; **`fr` unit CSS vars** for column ratios; feature panel hidden `< md`; crossfade via opacity + `--routine-guide-fade-duration`.
5. TS: `registerSection('section-routine-guide', …)`; runtime mirrors **collection-list** activate + optional GSAP reveal; `destroy()` cleanup.
6. Product: `{% render 'tcard-product', … %}` inside tinted panel wrapper.
7. Locales: `sections.routine_guide` in schema + storefront JSON.
8. `npm run check` + `npm run build`.

---

## Implementation notes

- **Feature panel:** All step feature images in one stack (absolute fill); only active layer visible — same idea as `coll-list__media-layer` / crossfade in Collection list.
- **Step list:** Flex column; row = interactive surface (button recommended over nested links if the whole row is clickable). Divider between rows optional section setting (consider `step_divider` checkbox like `entry_divider`).
- **Thumb:** ~64px circle, `object-fit: cover`, inline with heading (flex row, space-between or gap).
- **Product panel:** Background from `card_background_color`; card itself uses standard **`tcard`** styling (do not fork card SCSS into this section).
- **Editor:** `window.Shopify.designMode` — shorten entrance delays per *JS-driven UI* rules.
- **Sticky columns (optional enhancement):** If product and guide columns differ in height at `md+`, consider `coll-list`-style sticky shorter column — not required for v1 unless design demands it.
