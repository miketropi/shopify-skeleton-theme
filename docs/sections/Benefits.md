# Benefits — Section Document

> **Status:** **Draft — Not Implemented.** This spec has been reviewed against project rules (`.cursor/rules/`, `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `docs/SECTION_REGISTRY.md`, `.cursor/skills/shopify-skeleton-theme/SKILL.md`) and updated accordingly. No Liquid, SCSS, TS, or template wiring exists yet.

> An editorial section with a left-aligned header (eyebrow, heading, description) and a row of benefit blocks below. Each benefit has an icon, heading, and short description. A subtle divider with an active accent marks the current/featured item. JS is needed for accent-indicator positioning across columns; the main content layout is CSS-only.

![Benefits section example](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Benefits.jpg)

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = **benefit blocks** in a grid row with an editorial header. No hero content, no product grids, no unrelated blocks. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: **`sections/section-benefits.liquid`**. BEM root: **`ben`**. Interactive (accent-indicator positioning, featured-block detection): **`data-section-type="section-benefits"`**. SCSS: **`src/styles/sections/_section-benefits.scss`**. TS: **`src/scripts/section-benefits.ts`**. Register in **`theme.ts`** before **`bootSections()`**. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | **`{% render 'section-styles', section: section %}`** + **`shopify-section-wrapper`** on the section root for merchant padding/margin/background/border. The original `section_padding_top` / `section_padding_bottom` (range 0–160, step 8) are **replaced** by the shared section-styles contract. See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | **`section_color_scheme_mode`** (`default` \| `custom`) + **`color_scheme`** + **`{% render 'color-scheme-vars', scheme: … %}`** on the section root. The original per-section `section_background_color`, `heading_color`, `description_color`, `benefit_heading_color` are **removed** — they duplicate scheme tokens. Decorative elements (`icon_color`, `divider_color`, `accent_color`) use the **clear = scheme** override pattern (`rgba(0,0,0,0)` default → falls back to `--cs-text`, `--cs-border`, `--cs-accent`). See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Typography** | Uses **product-slider family** intro pattern: `section-intro__eyebrow` / `section-intro__heading` / `section-intro__copy` classes + **`section-intro--heading-{{ section.settings.heading_size }}`** on the section root. `heading_size` values: `small` \| `medium` \| `large` \| `xlarge`. Benefit headings consume `--font-size-*` tokens from `snippets/css-variables.liquid`. See `.cursor/rules/liquid-patterns.mdc` → *Product-slider family*. |
| **Full width** | **`full_width`** checkbox (default **`false`**) — when on, inner wrapper gets **`section-content-width`** (same contract as product slider / collection list). |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Prefer **`mq-up('md')` / `mq-up('lg')`** — **not** 767px / 1024px literals from the original draft. |
| **JS-driven UI** | **Accent-indicator positioning** requires lightweight JS: find the first block with `mark_as_featured: true`, calculate the horizontal center of that block's column, position the accent indicator absolutely above the divider line. Resize recalculation via `resize` listener (debounced). **No** loading/reveal pattern — the indicator is decorative progressive enhancement, not JS-primary UI. JS registration: `registerSection('section-benefits', …)` with **`destroy()`** cleanup (`AbortController`, `resize` listener). No heavy dependencies. |
| **Schema constraints** | Use **`checkbox`** (not `toggle`), **`textarea`** for descriptions, **`select`** with `small`\|`medium`\|`large` values for size options, **`color`** with `rgba(0,0,0,0)` defaults for local overrides. Reuse **section-styles** setting ids from `snippets/section-styles.liquid`. Include `"disabled_on": { "groups": ["header", "footer"] }`. |
| **Locales** | Schema → **`t:sections.benefits.*`** in `locales/en.default.schema.json`. Storefront runtime strings (empty-state fallbacks) in `locales/en.default.json`. |
| **Theme Check** | `npm run check` after Liquid/JSON changes; `npm run build` after TS/SCSS changes. |

**Not the same section as:**

| Existing | Difference |
| --- | --- |
| **`section-feature-grid`** | Feature grid uses image + heading + link blocks in a grid — no icon library, no divider, no accent indicator, no eyebrow/heading intro. Benefits is icon-driven with a featured-item accent on a shared divider line. |
| **`section-columns`** | Multi-column layout with per-column image, heading, text, and button — no icons, no divider, no featured-item indicator. |
| **`section-trust-bar`** | Horizontal logo/trustmark bar — no benefit copy, no editorially-driven icon + heading + description blocks. |
| **`section-collection-list`** | Product-collection cards in a grid — no benefit copy, no icon library, no divider/accent indicator. |

---

## Template placement (OS 2.0)

Benefits is a **reusable `section-*`** band merchants can add/reorder in any JSON template. Typical use:

| Template | Suggested usage |
| --- | --- |
| **`index.json`** | Homepage benefits band below hero/features. |
| **`product.json`** | Below-the-fold product benefits (ingredients, guarantees, certifications). |
| **`page.our-brand-story.json`** | Brand values / mission statements as benefits. |
| **`page.json`** | Generic page supporting content. |

No template-specific coupling — works anywhere.

---

## Section settings (functional spec)

### Header

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_text` | text | _(empty)_ | Small uppercase label above the heading. Example: *"Explore Our Benefits"*. |
| `heading` | text | _(empty)_ | Main heading. Example: *"Pure Skincare Essentials"*. |
| `heading_size` | select | `large` | Heading size: `small`, `medium`, `large`, `xlarge`. Wired to `section-intro--heading-*` modifier on the section root. |
| `description` | textarea | _(empty)_ | Short paragraph below the heading. Rendered in `.section-intro__copy`. Example: *"Discover the clean beauty benefits designed to nourish your skin with safe, effective ingredients."* |
| `text_alignment` | select | `left` | Alignment of the header content: `left`, `center`. |

### Benefits Row

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | select | `3` | Number of benefit columns: `2`, `3`, `4`. On tablet (`< lg`): max 2, on mobile (`< md`): 1. Use CSS Grid `grid-template-columns: repeat(var(--ben-columns), 1fr)`. |
| `column_gap` | select | `medium` | Spacing between benefit columns: `small` (24px), `medium` (40px), `large` (64px). Applied via `column-gap` on the grid container. |
| `icon_size` | select | `medium` | Icon size: `small` (32px), `medium` (40px), `large` (48px). Applied via `width`/`height` on both SVG and `<img>` (custom icon). |
| `icon_color` | color | `rgba(0,0,0,0)` | Color applied to all icons via `fill: currentColor`. Clear inherits from scheme `--cs-text`. Set via `--ben-icon-color` CSS variable on the section root. |
| `show_top_divider` | checkbox | `true` | Show the thin divider line above the benefits row. Rendered as `border-top` on a `<div>` spanning the full row width. |
| `divider_color` | color | `rgba(0,0,0,0)` | Color of the divider line. Clear inherits from scheme `--cs-border`. |
| `accent_color` | color | `rgba(0,0,0,0)` | Color of the active-item indicator on the divider. Clear inherits from scheme `--cs-accent`. |

### Width

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `full_width` | checkbox | `false` | Full-bleed section background; content constrained to `section-content-width`. |
| *(shell)* | — | — | **`padding_*`**, **`margin_*`**, **`background_color`**, **`border_*`**, corner radii from **section-styles**. Replaces the original `section_padding_top`, `section_padding_bottom`. |

### Colour

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `section_color_scheme_mode` | select | `default` | `default` — uses global scheme. `custom` — picks from `color_scheme`. Same pattern as trust bar / promo cards. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. Visible only when `section_color_scheme_mode == 'custom'`. |

---

## Benefit Block settings (functional spec)

Each block is one benefit column in the row. Empty blocks (no icon, heading, or description) render as empty space — merchants should remove unused blocks.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | select | `none` | Predefined icon from the theme icon library. Options: `none`, `leaf`, `heart`, `shield`, `lock`, `star`, `sparkle`, `drop`, `sun`, `moon`, `flower`, `recycle`, `award`, `no-symbol`, `check`. |
| `custom_icon` | image_picker | _(empty)_ | Upload a custom SVG or PNG icon. Overrides the predefined `icon` if set. Recommended size: 40×40px. Rendered as `<img>` with dimensions matching `icon_size`. |
| `heading` | text | _(empty)_ | Benefit heading. Example: *"100% Vegan Formula"*. |
| `description` | textarea | _(empty)_ | Short description below the heading. Example: *"Made with plant-based ingredients and free from animal-derived components, supporting a cleaner."* |
| `mark_as_featured` | checkbox | `false` | Highlight this benefit with the accent indicator on the top divider. Only the first block with this enabled is highlighted. If none are marked, no accent is shown. |

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Use `mq-up('md')` / `mq-up('lg')` from `src/styles/base/_breakpoints.scss`.

| Concern | `< md` (< 48em) | `md` – `lg` (48em–62em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| **Header alignment** | Left | As configured | As configured |
| **Benefit columns** | 1 | 2 | As configured (2–4) |
| **Column gap** | Row gap only (24px via `row-gap`) | 24px | As configured |
| **Top divider** | Hidden | Visible | Visible |
| **Accent indicator** | Hidden | Visible | Visible |
| **Icon size** | `small` (32px) | As configured | As configured |

> **Mobile:** Benefits stack vertically. The horizontal divider and accent indicator are hidden since they don't translate well to a vertical layout.

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **Heading hierarchy** | Section heading uses appropriate `<h2>` or `<h3>` level for page outline. Benefit headings use `<h3>` or `<h4>`. |
| **Icons** | Inline SVGs have `aria-hidden="true"` + `focusable="false"`. Custom `<img>` icons use `alt=""` (decorative). Icon meaning is conveyed by the adjacent heading text. |
| **Divider / accent** | Purely decorative elements — no ARIA attributes needed. Hidden from screen readers via `aria-hidden="true"` if needed. |
| **Colour contrast** | Icon color, divider color, and accent color respect scheme contrast. Defaults fall back to scheme tokens which are merchant-configured for accessibility. |
| **Reduced motion** | No motion-driven features in this section. Accent-indicator resize repositioning is instantaneous. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-benefits.liquid` |
| Styles | `src/styles/sections/_section-benefits.scss` |
| Style forward | `@forward 'section-benefits';` in `src/styles/sections/index.scss` |
| Scripts | `src/scripts/section-benefits.ts` |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.benefits` in `locales/en.default.schema.json` + `sections.benefits.*` in `locales/en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.benefits.*`** keys, merge **section-styles** settings, and follow schema constraints above.

```json
{
  "name": "t:sections.benefits.name",
  "tag": "section",
  "class": "section-benefits",
  "disabled_on": {
    "groups": ["header", "footer"]
  },
  "max_blocks": 4,
  "settings": [
    { "type": "header", "content": "t:sections.benefits.headers.header" },
    { "type": "text", "id": "eyebrow_text", "label": "t:sections.benefits.labels.eyebrow_text" },
    { "type": "text", "id": "heading", "label": "t:sections.benefits.labels.heading" },
    { "type": "select", "id": "heading_size", "label": "t:sections.benefits.labels.heading_size", "default": "large", "options": [
      { "value": "small", "label": "t:sections.benefits.options.heading_size.small" },
      { "value": "medium", "label": "t:sections.benefits.options.heading_size.medium" },
      { "value": "large", "label": "t:sections.benefits.options.heading_size.large" },
      { "value": "xlarge", "label": "t:sections.benefits.options.heading_size.xlarge" }
    ]},
    { "type": "textarea", "id": "description", "label": "t:sections.benefits.labels.description" },
    { "type": "select", "id": "text_alignment", "label": "t:sections.benefits.labels.text_alignment", "default": "left", "options": [
      { "value": "left", "label": "t:sections.benefits.options.text_alignment.left" },
      { "value": "center", "label": "t:sections.benefits.options.text_alignment.center" }
    ]},

    { "type": "header", "content": "t:sections.benefits.headers.benefits_row" },
    { "type": "select", "id": "columns", "label": "t:sections.benefits.labels.columns", "default": "3", "options": [
      { "value": "2", "label": "t:sections.benefits.options.columns.2" },
      { "value": "3", "label": "t:sections.benefits.options.columns.3" },
      { "value": "4", "label": "t:sections.benefits.options.columns.4" }
    ]},
    { "type": "select", "id": "column_gap", "label": "t:sections.benefits.labels.column_gap", "default": "medium", "options": [
      { "value": "small", "label": "t:sections.benefits.options.column_gap.small" },
      { "value": "medium", "label": "t:sections.benefits.options.column_gap.medium" },
      { "value": "large", "label": "t:sections.benefits.options.column_gap.large" }
    ]},
    { "type": "select", "id": "icon_size", "label": "t:sections.benefits.labels.icon_size", "default": "medium", "options": [
      { "value": "small", "label": "t:sections.benefits.options.icon_size.small" },
      { "value": "medium", "label": "t:sections.benefits.options.icon_size.medium" },
      { "value": "large", "label": "t:sections.benefits.options.icon_size.large" }
    ]},
    { "type": "color", "id": "icon_color", "label": "t:sections.benefits.labels.icon_color", "default": "rgba(0,0,0,0)", "info": "t:sections.benefits.info.icon_color" },
    { "type": "checkbox", "id": "show_top_divider", "label": "t:sections.benefits.labels.show_top_divider", "default": true },
    { "type": "color", "id": "divider_color", "label": "t:sections.benefits.labels.divider_color", "default": "rgba(0,0,0,0)", "info": "t:sections.benefits.info.divider_color" },
    { "type": "color", "id": "accent_color", "label": "t:sections.benefits.labels.accent_color", "default": "rgba(0,0,0,0)", "info": "t:sections.benefits.info.accent_color" },

    { "type": "header", "content": "t:sections.benefits.headers.width" },
    { "type": "checkbox", "id": "full_width", "label": "t:sections.benefits.labels.full_width", "default": false },

    { "type": "header", "content": "t:sections.benefits.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "label": "t:sections.benefits.labels.section_color_scheme_mode", "options": [
      { "value": "default", "label": "t:sections.benefits.options.color_scheme_mode.default" },
      { "value": "custom", "label": "t:sections.benefits.options.color_scheme_mode.custom" }
    ], "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.benefits.labels.color_scheme", "default": "scheme-6", "visible_if": "{{ section.settings.section_color_scheme_mode == 'custom' }}" },

    "/* === section-styles settings (padding, margin, background, border, radii) === */",

    { "type": "header", "content": "t:sections.benefits.headers.padding" },
    { "type": "range", "id": "padding_top", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.benefits.labels.padding_top", "default": 80 },
    { "type": "range", "id": "padding_right", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.benefits.labels.padding_right", "default": 0 },
    { "type": "range", "id": "padding_bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.benefits.labels.padding_bottom", "default": 80 },
    { "type": "range", "id": "padding_left", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.benefits.labels.padding_left", "default": 0 },
    { "type": "header", "content": "t:sections.benefits.headers.margin" },
    { "type": "range", "id": "margin_top", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.benefits.labels.margin_top", "default": 0 },
    { "type": "range", "id": "margin_bottom", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.benefits.labels.margin_bottom", "default": 0 },
    { "type": "header", "content": "t:sections.benefits.headers.background" },
    { "type": "color", "id": "background_color", "label": "t:sections.benefits.labels.background_color", "default": "rgba(0,0,0,0)", "info": "t:sections.benefits.info.background_color" },
    { "type": "header", "content": "t:sections.benefits.headers.border" },
    { "type": "range", "id": "border_width", "min": 0, "max": 8, "step": 1, "unit": "px", "label": "t:sections.benefits.labels.border_width", "default": 0 },
    { "type": "select", "id": "border_style", "label": "t:sections.benefits.labels.border_style", "options": [
      { "value": "none", "label": "t:sections.benefits.options.border_style.none" },
      { "value": "solid", "label": "t:sections.benefits.options.border_style.solid" },
      { "value": "dashed", "label": "t:sections.benefits.options.border_style.dashed" },
      { "value": "dotted", "label": "t:sections.benefits.options.border_style.dotted" }
    ], "default": "solid" },
    { "type": "color", "id": "border_color", "label": "t:sections.benefits.labels.border_color", "default": "rgba(0,0,0,0)", "info": "t:sections.benefits.info.border_color" },
    { "type": "header", "content": "t:sections.benefits.headers.radius" },
    { "type": "range", "id": "border_radius_top_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.benefits.labels.radius_tl", "default": 0 },
    { "type": "range", "id": "border_radius_top_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.benefits.labels.radius_tr", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.benefits.labels.radius_br", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.benefits.labels.radius_bl", "default": 0 }
  ],
  "blocks": [
    {
      "type": "benefit",
      "name": "t:sections.benefits.blocks.benefit.name",
      "settings": [
        { "type": "select", "id": "icon", "label": "t:sections.benefits.blocks.benefit.labels.icon", "default": "none", "options": [
          { "value": "none", "label": "t:sections.benefits.options.icon.none" },
          { "value": "leaf", "label": "t:sections.benefits.options.icon.leaf" },
          { "value": "heart", "label": "t:sections.benefits.options.icon.heart" },
          { "value": "shield", "label": "t:sections.benefits.options.icon.shield" },
          { "value": "lock", "label": "t:sections.benefits.options.icon.lock" },
          { "value": "star", "label": "t:sections.benefits.options.icon.star" },
          { "value": "sparkle", "label": "t:sections.benefits.options.icon.sparkle" },
          { "value": "drop", "label": "t:sections.benefits.options.icon.drop" },
          { "value": "sun", "label": "t:sections.benefits.options.icon.sun" },
          { "value": "moon", "label": "t:sections.benefits.options.icon.moon" },
          { "value": "flower", "label": "t:sections.benefits.options.icon.flower" },
          { "value": "recycle", "label": "t:sections.benefits.options.icon.recycle" },
          { "value": "award", "label": "t:sections.benefits.options.icon.award" },
          { "value": "no-symbol", "label": "t:sections.benefits.options.icon.no_symbol" },
          { "value": "check", "label": "t:sections.benefits.options.icon.check" }
        ]},
        { "type": "image_picker", "id": "custom_icon", "label": "t:sections.benefits.blocks.benefit.labels.custom_icon", "info": "t:sections.benefits.blocks.benefit.info.custom_icon" },
        { "type": "text", "id": "heading", "label": "t:sections.benefits.blocks.benefit.labels.heading" },
        { "type": "textarea", "id": "description", "label": "t:sections.benefits.blocks.benefit.labels.description" },
        { "type": "checkbox", "id": "mark_as_featured", "label": "t:sections.benefits.blocks.benefit.labels.mark_as_featured", "default": false, "info": "t:sections.benefits.blocks.benefit.info.mark_as_featured" }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.benefits.presets.name",
      "blocks": [
        { "type": "benefit" },
        { "type": "benefit" },
        { "type": "benefit" }
      ]
    }
  ]
}
```

> Merge **section-styles** settings in the same order as `section-trust-bar.liquid` / `section-faq.liquid` — after colour, before blocks. The `"/* === section-styles … === */"` comment above marks the insertion point.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/SECTION_REGISTRY.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `.cursor/rules/liquid-patterns.mdc`.
2. Liquid: `section-styles` + `shopify-section-wrapper` on root; `ben` BEM root + `section-intro--heading-*` modifier; `section-intro__eyebrow` / `section-intro__heading` / `section-intro__copy` for header; `data-section-type="section-benefits"` for JS registration; `color-scheme-vars` on root; `full_width` + `section-content-width` inner wrapper; CSS variables for `--ben-columns`, `--ben-column-gap`, `--ben-icon-size`, `--ben-icon-color`, `--ben-divider-color`, `--ben-accent-color` on the section root with scheme fallbacks for clear overrides.
3. SCSS: mobile-first `mq-up('md')` / `mq-up('lg')`; CSS Grid for benefits row; `grid-template-columns: repeat(var(--ben-columns), 1fr)`; `column-gap` / `row-gap` from CSS variables; divider as `border-top`; accent indicator as absolutely-positioned inner element; `--font-size-*` tokens for heading sizes; `section-intro` heading styles via shared `_section-intro.scss` — no duplicate font-size ladder.
4. TS: `registerSection('section-benefits', …)`; lightweight JS for accent-indicator positioning (find featured block, calculate column center, position indicator); `resize` listener (debounced) for recalculation; `destroy()` cleanup with `AbortController`; no heavy dependencies — native DOM APIs only.
5. Schema: `t:` keys in `locales/en.default.schema.json`; merge section-styles settings; `checkbox` not `toggle`; `disabled_on`; `max_blocks: 4`; presets with 3 default benefit blocks.
6. `npm run check` + `npm run build`.

---

## Implementation notes

- **Top divider with accent indicator:** Render the divider as a `<div>` with `border-top` using `--ben-divider-color` (fallback to `--cs-border` when clear). The accent segment is an inner `<div>` positioned absolutely above the divider line. On init (and on resize), JS calculates the horizontal center of the featured block's column and sets `left` + `width` on the accent indicator to match one column width. On mobile/tablet (where the divider is hidden), skip positioning.
- **Accent indicator positioning logic:** Find the first block with `data-ben-featured="true"` (set in Liquid from `mark_as_featured`), get its `getBoundingClientRect()`, calculate `left` relative to the divider parent. Width equals the block's column width (computed from the grid). If no block is featured, hide the accent indicator.
- **Featured logic:** Set `data-ben-featured="true"` on the first block where `mark_as_featured` is `true`. Subsequent blocks with `mark_as_featured` are ignored. If no blocks are marked, no accent is shown. The JS reads `data-ben-featured` from the DOM — the Liquid pre-sorts this so the featured block is known at render time. This avoids reliance on JS for the first-featured selection rule.
- **Icons:** Render inline SVGs from the theme icon library via a conditional block per icon value. `icon_color` is applied via `fill: currentColor` or `stroke: currentColor` using `color: var(--ben-icon-color, var(--cs-text))` on the icon wrapper. Custom icon via `image_picker` renders as `<img>` with fixed `width`/`height` matching `icon_size`. If `custom_icon` is set, skip the predefined SVG.
- **Column gap values:** Map `small`/`medium`/`large` to 24px/40px/64px via a CSS variable `--ben-column-gap` set from Liquid: `{% case section.settings.column_gap %}{% when 'small' %}24{% when 'medium' %}40{% when 'large' %}64{% endcase %}`. On mobile, `row-gap` uses 24px regardless.
- **Icon size values:** Map `small`/`medium`/`large` to 32px/40px/48px via `--ben-icon-size` from Liquid, same case pattern. On mobile (`< md`), force to `small` (32px).
- **`max_blocks: 4`** matches the max columns setting — preserves grid integrity. The grid will never have more items than it can display in one row.
- **Empty blocks:** Blocks with no icon (including `none` selected and no custom icon), no heading, and no description render as empty grid cells. Use Liquid `{% if block.settings.heading != blank or block.settings.description != blank or block.settings.icon != 'none' or block.settings.custom_icon != blank %}` to guard rendering. Merchants should remove unused blocks to avoid gaps.
- **`full_width`** follows the product-slider family contract: when enabled, the section root gets class `full-width`; the inner content wrapper (holding the intro and benefits row) gets class `section-content-width`. When disabled, all content is naturally constrained.
- **Breakpoint behaviour:** At `< md` (mobile), columns stack to 1, the divider and accent are hidden, and icon size forces to `small`. Between `md` and `lg` (tablet), max 2 columns with 24px gap, divider/accent visible. At `lg+`, full configured columns and gap.
