# Our Story — Section Document

> A centered editorial section with eyebrow, heading, description, and a grid of image + caption blocks below. Ideal for brand storytelling, about pages, or value proposition displays.

---

![Our Story Banner](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Our-story.jpg)

## Section Settings — Header

Reuses the shared `section-intro` typography classes (`section-intro__eyebrow`, `section-intro__heading`, `section-intro--heading-<size>`).

| Option | Type | Default | Description |
|---|---|---|---|
| `eyebrow_text` | text | _(empty)_ | Small uppercase label above the heading. |
| `heading` | text | _(empty)_ | Main heading. |
| `heading_size` | select | `large` | Heading size: Small, Medium, Large, Extra large. Controls `section-intro--heading-*` modifier. |
| `description` | textarea | _(empty)_ | Short paragraph below the heading. |
| `description_max_width` | range | `560` | Max width of the description in px. Range: 320–800, step 40. Applied as `--os-desc-max-width`. |
| `text_alignment` | select | `center` | Alignment of the header block: Left, Center. Root gets `section-our-story--align-<value>`. |

---

## Section Settings — Image Grid

Values are resolved to pixel/ratio CSS custom properties on the section root.

| Option | Type | Default | Description |
|---|---|---|---|
| `columns` | select | `3` | Columns on desktop: 2, 3, 4. Tablet: max 2. Mobile: 1. Sets `--os-cols-desktop`. |
| `column_gap` | select | `medium` | Grid gap: Small (12px), Medium (24px), Large (40px). Sets `--os-gap`. |
| `image_ratio` | select | `portrait` | Aspect ratio: Square (1:1), Portrait (4:5), Landscape (4:3). Sets `--os-img-ratio`. |
| `image_border_radius` | select | `medium` | Corner rounding: None (0), Small (8px), Medium (16px), Large (24px). Sets `--os-img-radius`. |

---

## Section Settings — Colour

Follows the 3-layer colour scheme system (`docs/COLOR_SCHEME_SYSTEM.md`).

| Option | Type | Default | Description |
|---|---|---|---|
| `section_color_scheme_mode` | select | `default` | Colour scheme mode: Default (global theme), Custom. |
| `color_scheme` | color_scheme | `scheme-6` | Colour scheme picker. Visible when mode is Custom. |
| `full_width` | checkbox | `false` | Edge-to-edge background with centred content column. Inner wrapper gets `section-content-width` when enabled. |

---

## Section Settings — Section Styles

Standard section shell from `snippets/section-styles.liquid` (padding 4 sides, margin, background, border, corner radius). Rendered via `{% render 'section-styles', section: section -%}`. Root carries `shopify-section-wrapper`.

---

## Story Card Block

Each block is one image card with a caption below. Blocks render left to right in the grid. Block heading/description colours override the scheme `--cs-heading` / `--cs-text-secondary` tokens on the card via inline `style`.

| Option | Type | Default | Description |
|---|---|---|---|
| `image` | image | _(empty)_ | Card image. Recommended: ≥ 800×1000px for Portrait ratio. |
| `image_position` | select | `center center` | Image focal point (maps to `object-position`). |
| `heading` | text | _(empty)_ | Caption heading below the image. |
| `description` | textarea | _(empty)_ | Short description below the caption heading. |
| `heading_color` | color | `#1A1A1A` | Overrides `--cs-heading` on the card. |
| `description_color` | color | `#666666` | Overrides `--cs-text-secondary` on the card. |

---

## Responsive Behaviour

| Setting | Desktop ≥ 62em (lg) | Tablet 48–62em (md) | Mobile ≤ 48em |
|---|---|---|---|
| Header alignment | As configured | Centre | Centre |
| Description max width | As configured | Full width | Full width |
| Grid columns | As configured (2–4) | 2 | 1 |
| Column gap | As configured | 16px fluid | 0 (row gap via CSS var) |
| Image ratio | As configured | As configured | As configured |
| Caption text | Visible | Visible | Visible |

---

## Shopify Schema — T: Key Reference

All user-facing strings use `t:` keys (`t:sections.our_story.*`). Entries live in `locales/en.default.schema.json` under `sections.our_story`.

```json
{
  "name": "t:sections.our_story.name",
  "tag": "section",
  "class": "section",
  "disabled_on": { "groups": ["header", "footer"] },
  "settings": [
    { "type": "header", "content": "t:sections.our_story.headers.header" },
    { "type": "text", "id": "eyebrow_text", "label": "t:sections.our_story.labels.eyebrow_text" },
    { "type": "text", "id": "heading", "label": "t:sections.our_story.labels.heading" },
    { "type": "select", "id": "heading_size", "label": "t:sections.our_story.labels.heading_size", "default": "large", "options": [
      { "value": "small", "label": "t:sections.our_story.options.heading_size.small" },
      { "value": "medium", "label": "t:sections.our_story.options.heading_size.medium" },
      { "value": "large", "label": "t:sections.our_story.options.heading_size.large" },
      { "value": "xlarge", "label": "t:sections.our_story.options.heading_size.xlarge" }
    ]},
    { "type": "textarea", "id": "description", "label": "t:sections.our_story.labels.description" },
    { "type": "range", "id": "description_max_width", "label": "t:sections.our_story.labels.description_max_width", "min": 320, "max": 800, "step": 40, "unit": "px", "default": 560 },
    { "type": "select", "id": "text_alignment", "label": "t:sections.our_story.labels.text_alignment", "default": "center", "options": [
      { "value": "left", "label": "t:sections.our_story.options.text_align.left" },
      { "value": "center", "label": "t:sections.our_story.options.text_align.center" }
    ]},
    { "type": "header", "content": "t:sections.our_story.headers.grid" },
    { "type": "select", "id": "columns", "label": "t:sections.our_story.labels.columns", "default": "3", "options": [
      { "value": "2", "label": "t:sections.our_story.options.columns.2" },
      { "value": "3", "label": "t:sections.our_story.options.columns.3" },
      { "value": "4", "label": "t:sections.our_story.options.columns.4" }
    ]},
    { "type": "select", "id": "column_gap", "label": "t:sections.our_story.labels.column_gap", "default": "medium", "options": [
      { "value": "small", "label": "t:sections.our_story.options.gap.small" },
      { "value": "medium", "label": "t:sections.our_story.options.gap.medium" },
      { "value": "large", "label": "t:sections.our_story.options.gap.large" }
    ]},
    { "type": "select", "id": "image_ratio", "label": "t:sections.our_story.labels.image_ratio", "default": "portrait", "options": [
      { "value": "square", "label": "t:sections.our_story.options.ratio.square" },
      { "value": "portrait", "label": "t:sections.our_story.options.ratio.portrait" },
      { "value": "landscape", "label": "t:sections.our_story.options.ratio.landscape" }
    ]},
    { "type": "select", "id": "image_border_radius", "label": "t:sections.our_story.labels.image_border_radius", "default": "medium", "options": [
      { "value": "none", "label": "t:sections.our_story.options.radius.none" },
      { "value": "small", "label": "t:sections.our_story.options.radius.small" },
      { "value": "medium", "label": "t:sections.our_story.options.radius.medium" },
      { "value": "large", "label": "t:sections.our_story.options.radius.large" }
    ]},
    { "type": "header", "content": "t:sections.our_story.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "label": "t:sections.our_story.section_color_scheme_mode", "default": "default", "options": [
      { "value": "default", "label": "t:sections.our_story.section_color_scheme_mode_default" },
      { "value": "custom", "label": "t:sections.our_story.section_color_scheme_mode_custom" }
    ]},
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.our_story.color_scheme", "info": "t:sections.our_story.color_scheme_info", "default": "scheme-6", "visible_if": "{{ section.settings.section_color_scheme_mode == 'custom' }}" },
    { "type": "header", "content": "t:sections.our_story.headers.layout" },
    { "type": "checkbox", "id": "full_width", "label": "t:sections.our_story.labels.full_width", "info": "t:sections.our_story.labels.full_width_info", "default": false },
    { "type": "header", "content": "t:sections.our_story.headers.padding" },
    { "type": "range", "id": "padding_top", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.our_story.labels.padding_top", "default": 80 },
    { "type": "range", "id": "padding_right", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_story.labels.padding_right", "default": 0 },
    { "type": "range", "id": "padding_bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.our_story.labels.padding_bottom", "default": 80 },
    { "type": "range", "id": "padding_left", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_story.labels.padding_left", "default": 0 },
    { "type": "header", "content": "t:sections.our_story.headers.margin" },
    { "type": "range", "id": "margin_top", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_story.labels.margin_top", "default": 0 },
    { "type": "range", "id": "margin_bottom", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_story.labels.margin_bottom", "default": 0 },
    { "type": "header", "content": "t:sections.our_story.headers.background" },
    { "type": "color", "id": "background_color", "label": "t:sections.our_story.labels.background_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_story.labels.background_color_info" },
    { "type": "header", "content": "t:sections.our_story.headers.border" },
    { "type": "range", "id": "border_width", "min": 0, "max": 8, "step": 1, "unit": "px", "label": "t:sections.our_story.labels.border_width", "default": 0 },
    { "type": "select", "id": "border_style", "label": "t:sections.our_story.labels.border_style", "options": [
      { "value": "none", "label": "t:sections.our_story.options.border_style.none" },
      { "value": "solid", "label": "t:sections.our_story.options.border_style.solid" },
      { "value": "dashed", "label": "t:sections.our_story.options.border_style.dashed" },
      { "value": "dotted", "label": "t:sections.our_story.options.border_style.dotted" }
    ], "default": "solid" },
    { "type": "color", "id": "border_color", "label": "t:sections.our_story.labels.border_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_story.labels.border_color_info" },
    { "type": "header", "content": "t:sections.our_story.headers.radius" },
    { "type": "range", "id": "border_radius_top_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_story.labels.radius_tl", "default": 0 },
    { "type": "range", "id": "border_radius_top_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_story.labels.radius_tr", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_story.labels.radius_br", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_story.labels.radius_bl", "default": 0 }
  ],
  "blocks": [
    {
      "type": "story_card",
      "name": "t:sections.our_story.blocks.story_card.name",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "t:sections.our_story.blocks.story_card.labels.image" },
        { "type": "select", "id": "image_position", "label": "t:sections.our_story.blocks.story_card.labels.image_position", "default": "center center", "options": [
          { "value": "center center", "label": "t:sections.our_story.options.image_position.center_center" },
          { "value": "top center", "label": "t:sections.our_story.options.image_position.top_center" },
          { "value": "bottom center", "label": "t:sections.our_story.options.image_position.bottom_center" },
          { "value": "left center", "label": "t:sections.our_story.options.image_position.left_center" },
          { "value": "right center", "label": "t:sections.our_story.options.image_position.right_center" }
        ]},
        { "type": "text", "id": "heading", "label": "t:sections.our_story.blocks.story_card.labels.heading" },
        { "type": "textarea", "id": "description", "label": "t:sections.our_story.blocks.story_card.labels.description" },
        { "type": "color", "id": "heading_color", "label": "t:sections.our_story.blocks.story_card.labels.heading_color", "default": "#1A1A1A" },
        { "type": "color", "id": "description_color", "label": "t:sections.our_story.blocks.story_card.labels.description_color", "default": "#666666" }
      ]
    }
  ],
  "max_blocks": 4,
  "presets": [
    {
      "name": "t:sections.our_story.presets.name",
      "settings": {
        "padding_top": 80,
        "padding_right": 0,
        "padding_bottom": 80,
        "padding_left": 0,
        "margin_top": 0,
        "margin_bottom": 0,
        "background_color": "rgba(0,0,0,0)",
        "border_width": 0,
        "border_style": "solid",
        "border_radius_top_left": 0,
        "border_radius_top_right": 0,
        "border_radius_bottom_right": 0,
        "border_radius_bottom_left": 0,
        "border_color": "rgba(0,0,0,0)",
        "heading_size": "large",
        "description_max_width": 560,
        "text_alignment": "center",
        "columns": "3",
        "column_gap": "medium",
        "image_ratio": "portrait",
        "image_border_radius": "medium",
        "full_width": false,
        "section_color_scheme_mode": "default"
      },
      "blocks": [
        { "type": "story_card" },
        { "type": "story_card" },
        { "type": "story_card" }
      ]
    }
  ]
}
```

---

## Implementation Notes

- **Header** uses shared `section-intro` typography: `section-intro__eyebrow` + `section-intro__heading` + `section-intro--heading-<size>` on root. Description is a standalone `section-our-story__description` element.
- **Colour scheme** follows the 3-layer system: `color-scheme-vars` on root, `--cs-*` tokens consumed in SCSS. Per-block `heading_color`/`description_color` override `--cs-heading`/`--cs-text-secondary` on the card element via inline `style`.
- **Section shell** uses the standard `section-styles` snippet + `shopify-section-wrapper` class.
- **Grid CSS variables** (`--os-cols-desktop`, `--os-gap`, `--os-img-ratio`, `--os-img-radius`, `--os-desc-max-width`) are set on the section root from Liquid settings. SCSS consumes them via `var()` with fallbacks.
- **`max_blocks: 4`** matches the max columns setting — keeps the grid intact.
- **Static section** — no JavaScript required. No `data-section-type`, no `registerSection`.
- Content-agnostic: while named "Our Story", the section works equally well as a values grid, features overview, or category showcase.
- **Entrance animation** — GSAP stagger via `section-our-story.runtime.ts`. When `entrance_animation` is enabled, cards hide behind `opacity: 0` (FOUC guard via `{% style %}`), then reveal with a soft 0.7 s `power2.out` stagger (0.1 s per card) when the section scrolls into view via IntersectionObserver. Respects `prefers-reduced-motion`, skips scroll-wait in design mode, and tears down cleanly on `shopify:section:unload`. Wired through `data-section-type="section-our-story"` + `registerSectionOurStory()` before `bootSections()`.
