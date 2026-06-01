# Image With Text — Section Document

> Two-column layout: a text content panel on one side and a full-bleed image on the other. A versatile editorial section for brand messaging, philosophy statements, or feature highlights.

---

![Image With Text Example](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Image-with-Text.jpg)

## Section Settings — Layout

| Option | Type | Default | Description |
|---|---|---|---|
| `content_position` | select | `left` | Which side the text content appears on. Left (text left, image right), Right (image left, text right). Root gets `section-image-with-text--position-<value>`. Swapped via `flex-direction: row-reverse`. |
| `column_ratio` | select | `50` | Width split between text and image columns: 40/60, 50/50, 60/40. Sets CSS custom properties `--iwt-text-fr` / `--iwt-image-fr` on root. Tablet fixed at 50/50. |
| `image_border_radius` | select | `none` | Corner rounding of the image. None (0), Small (8px), Medium (16px), Large (24px). Sets `--iwt-img-radius` on root. |
| `section_height` | select | `auto` | Height mode. **Auto** — matches the taller column (`align-items: stretch` on flex row). Small (400px), Medium (560px), Large (720px) — fixed `min-height` with `object-fit: cover` on image. Sets `--iwt-height`. |
| `content_padding` | select | `large` | Inner padding of the text content column: Small (24px), Medium (40px), Large (60px). Sets `--iwt-content-pad` on root. Tablet: capped at Medium; mobile: capped at Small. |

---

## Section Settings — Image

| Option | Type | Default | Description |
|---|---|---|---|
| `image` | image | _(empty)_ | Section image. Recommended: ≥ 1200×800px. Rendered with `image_tag`, `loading: lazy` (first paint image gets `eager`). |
| `image_position` | select | `center center` | Image focal point. Maps to `object-position`. |
| `mobile_image` | image | _(empty)_ | Separate image for mobile (landscape or square crop). Falls back to the main image if empty. |

---

## Section Settings — Content

Uses shared `section-intro` typography classes (`section-intro__eyebrow`, `section-intro__heading`, `section-intro--heading-<size>`).

| Option | Type | Default | Description |
|---|---|---|---|
| `eyebrow_text` | text | _(empty)_ | Small label above the heading. |
| `heading` | text | _(empty)_ | Main heading. |
| `heading_size` | select | `large` | Heading size: Small, Medium, Large, Extra large. Controls `section-intro--heading-*` modifier. |
| `description` | textarea | _(empty)_ | Body text below the heading. |
| `show_button` | checkbox | `false` | Show a CTA button below the description. |
| `button_label` | text | `"Explore Our Products"` | CTA button label. Visible only when `show_button` is true. |
| `button_link` | url | _(empty)_ | CTA button destination URL. |
| `button_style` | select | `outlined` | Button style: Filled, Outlined. Uses theme button classes (`btn btn--filled` / `btn btn--outlined`). |
| `open_new_tab` | checkbox | `false` | Open button link in a new tab. |

---

## Section Settings — Colour & Style

Follows the 3-layer colour scheme system (`docs/COLOR_SCHEME_SYSTEM.md`). Section root carries `{% render 'color-scheme-vars' %}` for `--cs-*` token inheritance. Per-element colours on the content column act as overrides via inline `style`.

| Option | Type | Default | Description |
|---|---|---|---|
| `section_color_scheme_mode` | select | `default` | Colour scheme mode: Default (global theme), Custom. |
| `color_scheme` | color_scheme | `scheme-6` | Pick a colour scheme. Visible when mode is Custom. |
| `content_background_color` | color | `#F5F0EB` | Background colour of the text content column. Overrides `--cs-background` on the column element. |
| `heading_color` | color | `#1A1A1A` | Heading text colour. Overrides `--cs-heading` on the heading element. |
| `description_color` | color | `#666666` | Description text colour. Overrides `--cs-text-secondary` on the description element. |
| `eyebrow_color` | color | `#999999` | Eyebrow label colour. Overrides `--cs-text-secondary` on the eyebrow element. |
| `content_vertical_alignment` | select | `middle` | Vertical alignment of the text block within the content column: Top, Middle, Bottom. Maps to `justify-content: flex-start | center | flex-end`. |
| `full_width` | checkbox | `false` | Edge-to-edge section background. Inner content gets `section-content-width` when enabled. |

---

## Section Settings — Section Styles

Standard section shell from `snippets/section-styles.liquid` (padding 4 sides, margin, background, border, corner radius). Rendered via `{% render 'section-styles', section: section -%}`. Root carries `shopify-section-wrapper`. Padding defaults to 0 so the section can sit flush edge-to-edge by default.

---

## Responsive Behaviour

| Setting | Desktop ≥ 62em (lg) | Tablet 48–62em (md) | Mobile ≤ 48em |
|---|---|---|---|
| Layout | 2 columns side by side | 2 columns side by side | Single column — image top, content bottom |
| Column ratio | As configured (`--iwt-text-fr` / `--iwt-image-fr`) | 50/50 fixed | Full width each |
| Section height | As configured | As configured | Auto |
| Mobile image | Falls back to main image | Falls back to main image | Mobile image (if set) |
| Content padding | As configured | Capped at Medium (40px) fluid | Capped at Small (24px) fluid |

> **Mobile:** Image stacks on top, text content below at full width. `mobile_image` allows a better-cropped version for narrow viewports.

---

## Shopify Schema — T: Key Reference

All user-facing strings use `t:` keys (`t:sections.image_with_text.*`). Entries live in `locales/en.default.schema.json` under `sections.image_with_text`.

```json
{
  "name": "t:sections.image_with_text.name",
  "tag": "section",
  "class": "section",
  "disabled_on": { "groups": ["header", "footer"] },
  "settings": [
    { "type": "header", "content": "t:sections.image_with_text.headers.layout" },
    { "type": "select", "id": "content_position", "label": "t:sections.image_with_text.labels.content_position", "default": "left", "options": [
      { "value": "left", "label": "t:sections.image_with_text.options.position.left" },
      { "value": "right", "label": "t:sections.image_with_text.options.position.right" }
    ]},
    { "type": "select", "id": "column_ratio", "label": "t:sections.image_with_text.labels.column_ratio", "default": "50", "options": [
      { "value": "40", "label": "t:sections.image_with_text.options.ratio.40" },
      { "value": "50", "label": "t:sections.image_with_text.options.ratio.50" },
      { "value": "60", "label": "t:sections.image_with_text.options.ratio.60" }
    ]},
    { "type": "select", "id": "image_border_radius", "label": "t:sections.image_with_text.labels.image_border_radius", "default": "none", "options": [
      { "value": "none", "label": "t:sections.image_with_text.options.radius.none" },
      { "value": "small", "label": "t:sections.image_with_text.options.radius.small" },
      { "value": "medium", "label": "t:sections.image_with_text.options.radius.medium" },
      { "value": "large", "label": "t:sections.image_with_text.options.radius.large" }
    ]},
    { "type": "select", "id": "section_height", "label": "t:sections.image_with_text.labels.section_height", "default": "auto", "options": [
      { "value": "auto", "label": "t:sections.image_with_text.options.height.auto" },
      { "value": "small", "label": "t:sections.image_with_text.options.height.small" },
      { "value": "medium", "label": "t:sections.image_with_text.options.height.medium" },
      { "value": "large", "label": "t:sections.image_with_text.options.height.large" }
    ]},
    { "type": "select", "id": "content_padding", "label": "t:sections.image_with_text.labels.content_padding", "default": "large", "options": [
      { "value": "small", "label": "t:sections.image_with_text.options.padding.small" },
      { "value": "medium", "label": "t:sections.image_with_text.options.padding.medium" },
      { "value": "large", "label": "t:sections.image_with_text.options.padding.large" }
    ]},
    { "type": "header", "content": "t:sections.image_with_text.headers.image" },
    { "type": "image_picker", "id": "image", "label": "t:sections.image_with_text.labels.image" },
    { "type": "select", "id": "image_position", "label": "t:sections.image_with_text.labels.image_position", "default": "center center", "options": [
      { "value": "center center", "label": "t:sections.image_with_text.options.image_position.center_center" },
      { "value": "top center", "label": "t:sections.image_with_text.options.image_position.top_center" },
      { "value": "bottom center", "label": "t:sections.image_with_text.options.image_position.bottom_center" },
      { "value": "left center", "label": "t:sections.image_with_text.options.image_position.left_center" },
      { "value": "right center", "label": "t:sections.image_with_text.options.image_position.right_center" }
    ]},
    { "type": "image_picker", "id": "mobile_image", "label": "t:sections.image_with_text.labels.mobile_image", "info": "t:sections.image_with_text.info.mobile_image" },
    { "type": "header", "content": "t:sections.image_with_text.headers.content" },
    { "type": "text", "id": "eyebrow_text", "label": "t:sections.image_with_text.labels.eyebrow_text" },
    { "type": "text", "id": "heading", "label": "t:sections.image_with_text.labels.heading" },
    { "type": "select", "id": "heading_size", "label": "t:sections.image_with_text.labels.heading_size", "default": "large", "options": [
      { "value": "small", "label": "t:sections.image_with_text.options.heading_size.small" },
      { "value": "medium", "label": "t:sections.image_with_text.options.heading_size.medium" },
      { "value": "large", "label": "t:sections.image_with_text.options.heading_size.large" },
      { "value": "xlarge", "label": "t:sections.image_with_text.options.heading_size.xlarge" }
    ]},
    { "type": "textarea", "id": "description", "label": "t:sections.image_with_text.labels.description" },
    { "type": "checkbox", "id": "show_button", "label": "t:sections.image_with_text.labels.show_button", "default": false },
    { "type": "text", "id": "button_label", "label": "t:sections.image_with_text.labels.button_label", "default": "Explore Our Products" },
    { "type": "url", "id": "button_link", "label": "t:sections.image_with_text.labels.button_link" },
    { "type": "select", "id": "button_style", "label": "t:sections.image_with_text.labels.button_style", "default": "outlined", "options": [
      { "value": "filled", "label": "t:sections.image_with_text.options.button.filled" },
      { "value": "outlined", "label": "t:sections.image_with_text.options.button.outlined" }
    ]},
    { "type": "checkbox", "id": "open_new_tab", "label": "t:sections.image_with_text.labels.open_new_tab", "default": false },
    { "type": "header", "content": "t:sections.image_with_text.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "label": "t:sections.image_with_text.section_color_scheme_mode", "default": "default", "options": [
      { "value": "default", "label": "t:sections.image_with_text.section_color_scheme_mode_default" },
      { "value": "custom", "label": "t:sections.image_with_text.section_color_scheme_mode_custom" }
    ]},
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.image_with_text.color_scheme", "info": "t:sections.image_with_text.color_scheme_info", "default": "scheme-6", "visible_if": "{{ section.settings.section_color_scheme_mode == 'custom' }}" },
    { "type": "color", "id": "content_background_color", "label": "t:sections.image_with_text.labels.content_background_color", "default": "#F5F0EB" },
    { "type": "color", "id": "heading_color", "label": "t:sections.image_with_text.labels.heading_color", "default": "#1A1A1A" },
    { "type": "color", "id": "description_color", "label": "t:sections.image_with_text.labels.description_color", "default": "#666666" },
    { "type": "color", "id": "eyebrow_color", "label": "t:sections.image_with_text.labels.eyebrow_color", "default": "#999999" },
    { "type": "select", "id": "content_vertical_alignment", "label": "t:sections.image_with_text.labels.content_vertical_alignment", "default": "middle", "options": [
      { "value": "top", "label": "t:sections.image_with_text.options.valign.top" },
      { "value": "middle", "label": "t:sections.image_with_text.options.valign.middle" },
      { "value": "bottom", "label": "t:sections.image_with_text.options.valign.bottom" }
    ]},
    { "type": "header", "content": "t:sections.image_with_text.headers.layout_width" },
    { "type": "checkbox", "id": "full_width", "label": "t:sections.image_with_text.labels.full_width", "info": "t:sections.image_with_text.labels.full_width_info", "default": false },
    { "type": "header", "content": "t:sections.image_with_text.headers.padding" },
    { "type": "range", "id": "padding_top", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.image_with_text.labels.padding_top", "default": 0 },
    { "type": "range", "id": "padding_right", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.image_with_text.labels.padding_right", "default": 0 },
    { "type": "range", "id": "padding_bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.image_with_text.labels.padding_bottom", "default": 0 },
    { "type": "range", "id": "padding_left", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.image_with_text.labels.padding_left", "default": 0 },
    { "type": "header", "content": "t:sections.image_with_text.headers.margin" },
    { "type": "range", "id": "margin_top", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.image_with_text.labels.margin_top", "default": 0 },
    { "type": "range", "id": "margin_bottom", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.image_with_text.labels.margin_bottom", "default": 0 },
    { "type": "header", "content": "t:sections.image_with_text.headers.background" },
    { "type": "color", "id": "background_color", "label": "t:sections.image_with_text.labels.background_color", "default": "rgba(0,0,0,0)", "info": "t:sections.image_with_text.labels.background_color_info" },
    { "type": "header", "content": "t:sections.image_with_text.headers.border" },
    { "type": "range", "id": "border_width", "min": 0, "max": 8, "step": 1, "unit": "px", "label": "t:sections.image_with_text.labels.border_width", "default": 0 },
    { "type": "select", "id": "border_style", "label": "t:sections.image_with_text.labels.border_style", "options": [
      { "value": "none", "label": "t:sections.image_with_text.options.border_style.none" },
      { "value": "solid", "label": "t:sections.image_with_text.options.border_style.solid" },
      { "value": "dashed", "label": "t:sections.image_with_text.options.border_style.dashed" },
      { "value": "dotted", "label": "t:sections.image_with_text.options.border_style.dotted" }
    ], "default": "solid" },
    { "type": "color", "id": "border_color", "label": "t:sections.image_with_text.labels.border_color", "default": "rgba(0,0,0,0)", "info": "t:sections.image_with_text.labels.border_color_info" },
    { "type": "header", "content": "t:sections.image_with_text.headers.radius" },
    { "type": "range", "id": "border_radius_top_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.image_with_text.labels.radius_tl", "default": 0 },
    { "type": "range", "id": "border_radius_top_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.image_with_text.labels.radius_tr", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.image_with_text.labels.radius_br", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.image_with_text.labels.radius_bl", "default": 0 }
  ],
  "presets": [
    {
      "name": "t:sections.image_with_text.presets.name",
      "settings": {
        "padding_top": 0,
        "padding_right": 0,
        "padding_bottom": 0,
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
        "content_position": "left",
        "column_ratio": "50",
        "image_border_radius": "none",
        "section_height": "auto",
        "content_padding": "large",
        "heading_size": "large",
        "button_style": "outlined",
        "show_button": false,
        "content_vertical_alignment": "middle",
        "full_width": false,
        "section_color_scheme_mode": "default"
      }
    }
  ]
}
```

---

## Implementation Notes

- **No blocks** — single-instance section, all config at schema settings level. No `blocks` array or `max_blocks` in schema.
- **`content_position: Right`** — swaps column order via CSS `flex-direction: row-reverse`. No duplicate markup. Root modifier: `section-image-with-text--position-right`.
- **`section_height: Auto`** — uses `align-items: stretch` on the flex row so both columns match the height of the taller one. Fixed height options use a `--iwt-height` CSS custom property: `min-height` on each column and `object-fit: cover` on the image.
- **`content_vertical_alignment`** — maps to `justify-content` on the inner content wrapper: `flex-start` (Top), `center` (Middle), `flex-end` (Bottom). Root modifier: `section-image-with-text--valign-<value>`.
- **Content column colours** — colour scheme `--cs-*` tokens are set on the section root via `{% render 'color-scheme-vars' %}`. Per-element colours (`content_background_color`, `heading_color`, `description_color`, `eyebrow_color`) override specific `--cs-*` tokens on their respective elements via inline `style`. The content column panel overrides `--cs-background` with `content_background_color`.
- **Intro typography** — uses shared `section-intro__eyebrow` + `section-intro__heading` + `section-intro--heading-<size>` on root for eyebrow/heading font sizes.
- **Section shell** — uses standard `section-styles` snippet + `shopify-section-wrapper`. Padding defaults to 0 for edge-to-edge layout.
- **CTA button** — renders as `<a>` with theme button classes. Only shown when `show_button` is true and `button_label` + `button_link` are both set.
- **Static section** — no JavaScript required. No `data-section-type`, no `registerSection`.
- Versatile: functions as brand statement, about snippet, feature highlight, or promotional banner.
