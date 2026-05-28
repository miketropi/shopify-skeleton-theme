# Columns — Section Document

> **Status:** **Draft — Not Implemented.** This spec has been reviewed against project rules (`.cursor/rules/`, `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `docs/SECTION_REGISTRY.md`, `.cursor/skills/shopify-skeleton-theme/SKILL.md`) and updated accordingly. No Liquid, SCSS, TS, or template wiring exists yet.

> A flexible multi-column layout section where each column is a block. Supports 2, 3, or 4 columns with configurable gap, optional vertical dividers, and an optional sticky scroll behavior — shorter columns stay pinned while the tallest column scrolls, keeping the layout visually balanced. No JavaScript is required; sticky scroll uses CSS `position: sticky` only.

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = **multi-column grid** only. No hero content, no forms, no product grids. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: **`sections/section-columns.liquid`**. BEM root: **`columns`**. No JS → no `data-section-type`, no TS, no registry registration. SCSS: **`src/styles/sections/_section-columns.scss`**. Forward in **`src/styles/sections/index.scss`**. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | **`{% render 'section-styles', section: section %}`** + **`shopify-section-wrapper`** on the section root for merchant padding/margin/background/border. The original `section_padding_top` / `section_padding_bottom` (range 0–160, step 8) and `section_background_color` are **replaced** by the shared section-styles contract. See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | **`section_color_scheme_mode`** (`default` \| `custom`) + **`color_scheme`** + **`{% render 'color-scheme-vars', scheme: … %}`** on the section root. Column-level `column_background_color`, `heading_color`, `description_color` use the **clear = scheme** override pattern (`rgba(0,0,0,0)` default) — not hard-coded hex. Divider color (`divider_color`) is a legitimate per-section override (similar to the "panel colours" pattern in `docs/COLOR_SCHEME_SYSTEM.md`). See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Typography** | Per-column heading uses `heading_size` (`small` \| `medium` \| `large` \| `xlarge`) — same value range as `section-intro` heading scale. No section-level eyebrow/heading intro; each column owns its text independently. Font sizes consume `--font-size-*` tokens from `snippets/css-variables.liquid`. See `.cursor/rules/scss-styles.mdc`. |
| **Full width** | **`full_width`** checkbox (default **`false`**) — when on, inner wrapper gets **`section-content-width`** (same contract as trust bar / promo cards). |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Prefer **`mq-up('md')` / `mq-up('lg')`** — **not** 767px / 1024px literals from the original draft. |
| **No JS** | Sticky scroll is pure CSS (`position: sticky; top: var(--columns-sticky-offset)`). No `data-section-type`, no `registerSection`, no `theme.ts` import. This is a CSS-only section. |
| **Schema constraints** | Use **`checkbox`** (not `toggle`), **`image_picker`** (not `image`), **`range`** with min/max/step, **`richtext`** for description. Reuse **section-styles** setting ids from `snippets/section-styles.liquid`. Include `"disabled_on": { "groups": ["header", "footer"] }`. |
| **Locales** | Schema → **`t:sections.columns.*`** in `locales/en.default.schema.json`. No storefront runtime strings needed. |
| **Theme Check** | `npm run check` after Liquid/JSON changes; `npm run build` after SCSS changes. |

**Not the same section as:**

| Existing | Difference |
| --- | --- |
| **`section-feature-grid`** | Feature grid has an eyebrow + section heading intro row + full-bleed toggle; content is icon + heading + description per feature. Columns has no section intro — each column is a self-contained content block (image, heading, description, button) with independent CTA. |
| **`section-promo-cards`** | Promo cards has grid/carousel layout toggle, card-level backgrounds, media (image/video), and JS-driven carousel + entrance animation. Columns is CSS-only, no carousel, no card backgrounds — columns are structural containers, not styled cards. |
| **`section-trust-bar`** | Trust bar renders icon + heading + description per trust item; grid/carousel toggle; no images/buttons per item. Columns has richer per-column content (image, heading, richtext description, button). |
| **`main-page`** | Template-bound page content renderer — not a reusable marketing grid. |

---

## Template placement (OS 2.0)

Columns is a **reusable `section-*`** band merchants can add/reorder in any JSON template. Typical use:

| Template | Suggested usage |
| --- | --- |
| **`page.json`** / **`page.<handle>.json`** | Feature grids, about pages, policy columns, step lists — any multi-column editorial layout. |
| **`index.json`** | Homepage marketing columns (value props, category links, etc.). |
| **`product.json`** | Below-the-fold editorial content (feature breakdowns, spec columns). |
| **`collection.json`** | Above or below the product grid for category descriptions. |

No template-specific coupling — works anywhere.

---

## Section settings (functional spec)

### Layout

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | select | `3` | Number of columns: `2`, `3`, `4`. On tablet (`< lg`): max 2. On mobile (`< md`): 1. |
| `column_gap` | select | `medium` | Horizontal gap: `none` (0), `small` (16px), `medium` (32px), `large` (48px). Passed as CSS var `--columns-gap`. |
| `row_gap` | select | `medium` | Vertical gap when columns wrap: `none` (0), `small` (16px), `medium` (32px), `large` (48px). Passed as CSS var `--columns-row-gap`. |
| `enable_sticky_scroll` | checkbox | `false` | Shorter columns stick to top while tallest scrolls. Disabled on mobile (`< md`). |
| `sticky_offset_top` | range | `80` | Sticky top offset in px (accounts for fixed header). Min 0, max 160, step 8. Only active when `enable_sticky_scroll` is on. |
| `vertical_alignment` | select | `top` | Column alignment when heights differ (non-sticky): `top`, `middle`, `bottom`. |
| `full_width` | checkbox | `false` | Full-bleed section background; content constrained to `section-content-width`. |
| *(shell)* | — | — | **`padding_*`**, **`margin_*`**, **`background_color`**, **`border_*`**, corner radii from **section-styles**. Replaces the original `section_padding_top`, `section_padding_bottom`, and `section_background_color`. |

### Style

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_dividers` | checkbox | `false` | Vertical divider lines between columns. Hidden below `md`. |
| `divider_color` | color | `#E5E5E5` | Divider color. Local override — clear uses scheme `--cs-border`. Only applies when `show_dividers` is on. |

### Colour

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `section_color_scheme_mode` | select | `default` | `default` — uses global scheme. `custom` — picks from `color_scheme`. Same pattern as trust bar / promo cards. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. Visible only when `section_color_scheme_mode == 'custom'`. |

---

## Column block settings (functional spec)

Each block = one column. Blocks render left to right. Content within a column is built from optional sub-elements — only enabled ones render.

### Block — Layout

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `column_width` | select | `auto` | Width override: `auto` (equal share), `25` (Narrow 25%), `33` (Default 33%), `50` (Wide 50%), `100` (Full 100%). Uses CSS Grid `grid-column: span N` or flex-basis. Collapses to responsive grid on tablet/mobile. |
| `content_alignment` | select | `left` | Horizontal alignment of all content: `left`, `center`, `right`. |
| `column_background_color` | color | `rgba(0,0,0,0)` | Per-column background. Clear inherits from section. Only visible when set. |
| `column_padding` | select | `none` | Inner padding: `none` (0), `small` (16px), `medium` (24px), `large` (40px). |
| `column_border_radius` | select | `none` | Corner rounding: `none` (0), `small` (8px), `medium` (16px), `large` (24px). Only visible when `column_background_color` or `column_padding` is set. |

### Block — Image

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_image` | checkbox | `false` | Show an image in this column. |
| `image` | image_picker | — | Column image. |
| `image_ratio` | select | `auto` | Aspect ratio: `auto` (original), `square` (1:1), `portrait` (3:4), `landscape` (4:3). |
| `image_border_radius` | select | `none` | Image corner rounding: `none` (0), `small` (8px), `medium` (16px), `large` (24px). |

### Block — Text content

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_text` | text | — | Small label above the heading. |
| `heading` | text | — | Column heading. |
| `heading_size` | select | `medium` | `small` \| `medium` \| `large` \| `xlarge`. Same scale as `section-intro` heading sizes. |
| `heading_color` | color | `rgba(0,0,0,0)` | Heading text color. Clear uses scheme `--cs-heading`. |
| `description` | richtext | — | Column body text. Supports bold, italic, links, lists via Shopify `richtext` type. |
| `description_color` | color | `rgba(0,0,0,0)` | Description text color. Clear uses scheme `--cs-text`. |

### Block — Button

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_button` | checkbox | `false` | Show a CTA button. |
| `button_label` | text | — | Button label. |
| `button_link` | url | — | Button destination. |
| `button_style` | select | `filled` | `filled` → `--cs-btn-primary-*` tokens. `outlined` → `--cs-btn-secondary-*` tokens. `text` → link-style (inline, underline). |
| `open_new_tab` | checkbox | `false` | Open link in new tab. |

---

## Responsive behavior (theme breakpoints)

Mobile-first. Use `mq-up('md')` / `mq-up('lg')` from `src/styles/base/_breakpoints.scss`.

| Concern | `< md` (< 48em) | `md` – `lg` (48em–62em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| **Columns** | 1 (stacked) | Max 2 | As configured (2–4) |
| **Sticky scroll** | **Disabled** (`position: static`) | Active | Active |
| **Column gap** | Row gap only | As configured | As configured |
| **Dividers** | Hidden | Vertical (2-col only) | Vertical |
| **Column width override** | Full width | Collapsed to 2-col grid | Respected |
| **Content alignment** | As configured | As configured | As configured |

> 📱 **Mobile:** All columns stack into a single column. Sticky scroll is disabled — `position: sticky` on mobile creates poor UX due to limited viewport height. Vertical dividers are hidden and replaced by row gap only.

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **Heading hierarchy** | Each column heading should use `<h3>` (or appropriate level for the page outline). Avoid skipping levels. |
| **Image alt text** | Use `image.alt` from the image picker; allow merchant to set meaningful alt text. |
| **Button contrast** | Buttons use `--cs-btn-primary-*` / `--cs-btn-secondary-*` scheme tokens — validated in theme editor. |
| **Link targets** | When `open_new_tab` is on, add `rel="noopener noreferrer"` and `target="_blank"`. |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` — disable sticky scroll (switch to `position: static`). |
| **Keyboard** | All interactive elements (buttons, links) remain tabbable in natural DOM order. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-columns.liquid` |
| Snippet (optional) | `snippets/column-block.liquid` (per-column markup, if columns want reuse) |
| Styles | `src/styles/sections/_section-columns.scss` |
| Style forward | `@forward 'section-columns';` in `src/styles/sections/index.scss` |
| Locales | `sections.columns` in `locales/en.default.schema.json` + reuse `general.*` / `labels.*` keys where applicable |
| Docs | This file |

No JS, no registry registration, no `theme.ts` import.

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.columns.*`** keys, merge **section-styles** settings, and follow schema constraints above.

```json
{
  "name": "t:sections.columns.name",
  "tag": "section",
  "class": "section-columns",
  "disabled_on": {
    "groups": ["header", "footer"]
  },
  "max_blocks": 4,
  "settings": [
    { "type": "header", "content": "t:sections.columns.headers.layout" },
    { "type": "select", "id": "columns", "label": "t:sections.columns.labels.columns", "default": "3", "options": [
      { "value": "2", "label": "2" },
      { "value": "3", "label": "3" },
      { "value": "4", "label": "4" }
    ]},
    { "type": "select", "id": "column_gap", "label": "t:sections.columns.labels.column_gap", "default": "medium", "options": [
      { "value": "none", "label": "t:sections.columns.options.gap.none" },
      { "value": "small", "label": "t:sections.columns.options.gap.small" },
      { "value": "medium", "label": "t:sections.columns.options.gap.medium" },
      { "value": "large", "label": "t:sections.columns.options.gap.large" }
    ]},
    { "type": "select", "id": "row_gap", "label": "t:sections.columns.labels.row_gap", "default": "medium", "options": [
      { "value": "none", "label": "t:sections.columns.options.gap.none" },
      { "value": "small", "label": "t:sections.columns.options.gap.small" },
      { "value": "medium", "label": "t:sections.columns.options.gap.medium" },
      { "value": "large", "label": "t:sections.columns.options.gap.large" }
    ]},
    { "type": "checkbox", "id": "enable_sticky_scroll", "label": "t:sections.columns.labels.enable_sticky_scroll", "default": false, "info": "t:sections.columns.info.enable_sticky_scroll" },
    { "type": "range", "id": "sticky_offset_top", "label": "t:sections.columns.labels.sticky_offset_top", "min": 0, "max": 160, "step": 8, "unit": "px", "default": 80, "info": "t:sections.columns.info.sticky_offset_top" },
    { "type": "select", "id": "vertical_alignment", "label": "t:sections.columns.labels.vertical_alignment", "default": "top", "options": [
      { "value": "top", "label": "t:sections.columns.options.vertical_alignment.top" },
      { "value": "middle", "label": "t:sections.columns.options.vertical_alignment.middle" },
      { "value": "bottom", "label": "t:sections.columns.options.vertical_alignment.bottom" }
    ]},
    { "type": "checkbox", "id": "full_width", "label": "t:sections.columns.labels.full_width", "default": false },
    { "type": "header", "content": "t:sections.columns.headers.style" },
    { "type": "checkbox", "id": "show_dividers", "label": "t:sections.columns.labels.show_dividers", "default": false },
    { "type": "color", "id": "divider_color", "label": "t:sections.columns.labels.divider_color", "default": "#E5E5E5" },
    { "type": "header", "content": "t:sections.columns.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "label": "t:sections.columns.labels.section_color_scheme_mode", "options": [
      { "value": "default", "label": "t:sections.columns.options.color_scheme_mode.default" },
      { "value": "custom", "label": "t:sections.columns.options.color_scheme_mode.custom" }
    ], "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.columns.labels.color_scheme", "default": "scheme-6", "visible_if": "{{ section.settings.section_color_scheme_mode == 'custom' }}" },

    "/* === section-styles settings (padding, margin, background, border, radii) === */",

    { "type": "header", "content": "t:sections.columns.headers.padding" },
    { "type": "range", "id": "padding_top", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.columns.labels.padding_top", "default": 60 },
    { "type": "range", "id": "padding_right", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.columns.labels.padding_right", "default": 0 },
    { "type": "range", "id": "padding_bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.columns.labels.padding_bottom", "default": 60 },
    { "type": "range", "id": "padding_left", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.columns.labels.padding_left", "default": 0 },
    { "type": "header", "content": "t:sections.columns.headers.margin" },
    { "type": "range", "id": "margin_top", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.columns.labels.margin_top", "default": 0 },
    { "type": "range", "id": "margin_bottom", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.columns.labels.margin_bottom", "default": 0 },
    { "type": "header", "content": "t:sections.columns.headers.background" },
    { "type": "color", "id": "background_color", "label": "t:sections.columns.labels.background_color", "default": "rgba(0,0,0,0)", "info": "t:sections.columns.info.background_color" },
    { "type": "header", "content": "t:sections.columns.headers.border" },
    { "type": "range", "id": "border_width", "min": 0, "max": 8, "step": 1, "unit": "px", "label": "t:sections.columns.labels.border_width", "default": 0 },
    { "type": "select", "id": "border_style", "label": "t:sections.columns.labels.border_style", "options": [
      { "value": "none", "label": "t:sections.columns.options.border_style.none" },
      { "value": "solid", "label": "t:sections.columns.options.border_style.solid" },
      { "value": "dashed", "label": "t:sections.columns.options.border_style.dashed" },
      { "value": "dotted", "label": "t:sections.columns.options.border_style.dotted" }
    ], "default": "solid" },
    { "type": "color", "id": "border_color", "label": "t:sections.columns.labels.border_color", "default": "rgba(0,0,0,0)", "info": "t:sections.columns.info.border_color" },
    { "type": "header", "content": "t:sections.columns.headers.radius" },
    { "type": "range", "id": "border_radius_top_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.columns.labels.radius_tl", "default": 0 },
    { "type": "range", "id": "border_radius_top_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.columns.labels.radius_tr", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.columns.labels.radius_br", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.columns.labels.radius_bl", "default": 0 }
  ],
  "blocks": [
    {
      "type": "column",
      "name": "t:sections.columns.blocks.column.name",
      "settings": [
        { "type": "header", "content": "t:sections.columns.blocks.column.headers.layout" },
        { "type": "select", "id": "column_width", "label": "t:sections.columns.blocks.column.labels.column_width", "default": "auto", "options": [
          { "value": "auto", "label": "t:sections.columns.blocks.column.options.column_width.auto" },
          { "value": "25", "label": "t:sections.columns.blocks.column.options.column_width.narrow" },
          { "value": "33", "label": "t:sections.columns.blocks.column.options.column_width.default" },
          { "value": "50", "label": "t:sections.columns.blocks.column.options.column_width.wide" },
          { "value": "100", "label": "t:sections.columns.blocks.column.options.column_width.full" }
        ]},
        { "type": "select", "id": "content_alignment", "label": "t:sections.columns.blocks.column.labels.content_alignment", "default": "left", "options": [
          { "value": "left", "label": "t:sections.columns.blocks.column.options.content_alignment.left" },
          { "value": "center", "label": "t:sections.columns.blocks.column.options.content_alignment.center" },
          { "value": "right", "label": "t:sections.columns.blocks.column.options.content_alignment.right" }
        ]},
        { "type": "color", "id": "column_background_color", "label": "t:sections.columns.blocks.column.labels.column_background_color", "default": "rgba(0,0,0,0)" },
        { "type": "select", "id": "column_padding", "label": "t:sections.columns.blocks.column.labels.column_padding", "default": "none", "options": [
          { "value": "none", "label": "t:sections.columns.options.padding.none" },
          { "value": "small", "label": "t:sections.columns.options.padding.small" },
          { "value": "medium", "label": "t:sections.columns.options.padding.medium" },
          { "value": "large", "label": "t:sections.columns.options.padding.large" }
        ]},
        { "type": "select", "id": "column_border_radius", "label": "t:sections.columns.blocks.column.labels.column_border_radius", "default": "none", "options": [
          { "value": "none", "label": "t:sections.columns.options.radius.none" },
          { "value": "small", "label": "t:sections.columns.options.radius.small" },
          { "value": "medium", "label": "t:sections.columns.options.radius.medium" },
          { "value": "large", "label": "t:sections.columns.options.radius.large" }
        ]},
        { "type": "header", "content": "t:sections.columns.blocks.column.headers.image" },
        { "type": "checkbox", "id": "show_image", "label": "t:sections.columns.blocks.column.labels.show_image", "default": false },
        { "type": "image_picker", "id": "image", "label": "t:sections.columns.blocks.column.labels.image" },
        { "type": "select", "id": "image_ratio", "label": "t:sections.columns.blocks.column.labels.image_ratio", "default": "auto", "options": [
          { "value": "auto", "label": "t:sections.columns.options.image_ratio.auto" },
          { "value": "square", "label": "t:sections.columns.options.image_ratio.square" },
          { "value": "portrait", "label": "t:sections.columns.options.image_ratio.portrait" },
          { "value": "landscape", "label": "t:sections.columns.options.image_ratio.landscape" }
        ]},
        { "type": "select", "id": "image_border_radius", "label": "t:sections.columns.blocks.column.labels.image_border_radius", "default": "none", "options": [
          { "value": "none", "label": "t:sections.columns.options.radius.none" },
          { "value": "small", "label": "t:sections.columns.options.radius.small" },
          { "value": "medium", "label": "t:sections.columns.options.radius.medium" },
          { "value": "large", "label": "t:sections.columns.options.radius.large" }
        ]},
        { "type": "header", "content": "t:sections.columns.blocks.column.headers.text" },
        { "type": "text", "id": "eyebrow_text", "label": "t:sections.columns.blocks.column.labels.eyebrow_text" },
        { "type": "text", "id": "heading", "label": "t:sections.columns.blocks.column.labels.heading" },
        { "type": "select", "id": "heading_size", "label": "t:sections.columns.blocks.column.labels.heading_size", "default": "medium", "options": [
          { "value": "small", "label": "t:sections.columns.options.heading_size.small" },
          { "value": "medium", "label": "t:sections.columns.options.heading_size.medium" },
          { "value": "large", "label": "t:sections.columns.options.heading_size.large" },
          { "value": "xlarge", "label": "t:sections.columns.options.heading_size.xlarge" }
        ]},
        { "type": "color", "id": "heading_color", "label": "t:sections.columns.blocks.column.labels.heading_color", "default": "rgba(0,0,0,0)" },
        { "type": "richtext", "id": "description", "label": "t:sections.columns.blocks.column.labels.description" },
        { "type": "color", "id": "description_color", "label": "t:sections.columns.blocks.column.labels.description_color", "default": "rgba(0,0,0,0)" },
        { "type": "header", "content": "t:sections.columns.blocks.column.headers.button" },
        { "type": "checkbox", "id": "show_button", "label": "t:sections.columns.blocks.column.labels.show_button", "default": false },
        { "type": "text", "id": "button_label", "label": "t:sections.columns.blocks.column.labels.button_label" },
        { "type": "url", "id": "button_link", "label": "t:sections.columns.blocks.column.labels.button_link" },
        { "type": "select", "id": "button_style", "label": "t:sections.columns.blocks.column.labels.button_style", "default": "filled", "options": [
          { "value": "filled", "label": "t:sections.columns.options.button_style.filled" },
          { "value": "outlined", "label": "t:sections.columns.options.button_style.outlined" },
          { "value": "text", "label": "t:sections.columns.options.button_style.text" }
        ]},
        { "type": "checkbox", "id": "open_new_tab", "label": "t:sections.columns.blocks.column.labels.open_new_tab", "default": false }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.columns.presets.name",
      "blocks": [
        { "type": "column" },
        { "type": "column" },
        { "type": "column" }
      ]
    }
  ]
}
```

> Merge **section-styles** settings in the same order as `section-trust-bar.liquid` / `section-promo-cards.liquid` — after colour, before blocks. The `"/* === section-styles … === */"` comment above marks the insertion point.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `.cursor/rules/liquid-patterns.mdc`.
2. Liquid: `section-styles` + `shopify-section-wrapper`; `columns` BEM root; color-scheme-vars on root (same pattern as trust bar / promo cards); `full_width` + `section-content-width` inner wrapper.
3. SCSS: mobile-first `mq-up('md')` / `mq-up('lg')`; gap as CSS vars; sticky scroll (`position: sticky` with offset var, disabled below `md` via `@media (max-width: …)`); dividers as `border-right` on columns except `:last-child`; column width override via `grid-column: span N`; `prefers-reduced-motion` disables sticky.
4. Schema: `t:` keys in `locales/en.default.schema.json`; merge section-styles settings; `checkbox` not `toggle`; `image_picker` not `image`; `disabled_on`; `max_blocks: 4`; presets with 3 default column blocks.
5. No JS — omit `data-section-type`, no `registerSection`, no `theme.ts` import.
6. `npm run check` + `npm run build`.

---

## Implementation notes

- **Sticky scroll** is pure CSS: `position: sticky; top: var(--columns-sticky-offset, 80px)` on each `.columns__item`. The column unsticks when the section's bottom edge scrolls past the viewport — no JS required. Disable below `md`: `@media (max-width: 47.9375em) { position: static; }`. Also disable when `prefers-reduced-motion: reduce`.
- **Column width override** uses CSS Grid `grid-column: span N` (e.g. `span 1` for auto, `span 2` for 50% in a 4-col grid). On tablet/mobile, all overrides collapse to the responsive grid. Column width values (`25`, `33`, `50`, `100`) map to percentage of the total column count — compute the span in Liquid: for a 4-column grid, `50` means span 2; for a 2-column grid, `50` means span 1. The `auto` value means equal share (span 1).
- **`max_blocks: 4`** matches the max columns setting — adding a 5th block while on a 4-column layout would break the grid.
- **Dividers** are `border-right` on each `.columns__item` except `:last-child`. Hidden below `md` breakpoint. `divider_color` defaults to `#E5E5E5` but merchants should be encouraged to use the scheme border (`--cs-border`) via keeping it clear (future enhancement: use `rgba(0,0,0,0)` default and fall back to `--cs-border` in CSS).
- **Richtext description** uses Shopify's `richtext` schema type which outputs HTML directly — supports `<b>`, `<i>`, `<a>`, `<ul>`, `<ol>`. Render with `{{ block.settings.description }}` (no escape).
- **Button style** maps to scheme tokens: `filled` → `.btn--primary` (`--cs-btn-primary-bg`, `--cs-btn-primary-text`, `--cs-btn-primary-border`); `outlined` → `.btn--secondary` (`--cs-btn-secondary-bg`, `--cs-btn-secondary-text`, `--cs-btn-secondary-border`); `text` → inline link style with `--cs-accent` color and underline on hover.
- **Content alignment** sets `text-align` and `align-items` on the column flex container. Does not affect the grid placement.
- This section is intentionally **content-agnostic** — it can be used for feature grids, about pages, policy columns, step lists, or any multi-column editorial layout.
