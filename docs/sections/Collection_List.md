# Collection List (curated two-column)

**Status:** implemented as **`section-collection-list`**. Still **unrelated** to **`main-list-collections`** (the Shopify `/collections` index grid).

| Piece | Location |
| --- | --- |
| Liquid | `sections/section-collection-list.liquid` |
| Styles | `src/styles/sections/_section-collection-list.scss` |
| Script | `src/scripts/sections/section-collection-list.ts` |
| Section type | `data-section-type="section-collection-list"` |
| Schema | `locales/en.default.schema.json` → `sections.collection_list` |
| Storefront strings | `locales/en.default.json` → `sections.collection_list` |

---

## Behaviour

- **Blocks:** Up to 8 **`collection_entry`** blocks. A row is shown if the block has a **collection** and/or **custom URL**.
- **Left column:** All entry images are stacked absolutely; **opacity crossfade** swaps the visible image (**CSS** `transition`, honouring **`prefers-reduced-motion`**).
- **Right column:** Linked rows (title, optional count, optional arrow); **active** row matches the visible image.
- **Interaction:** With **fine pointer + hover**, **mouseenter** on a row updates the active image. **Pointer down** and **focus** also activate (mobile tap / keyboard).
- **Default row:** **`default_active_index`** (1-based, clamped to the number of valid blocks).
- **Responsive:** Stacked **image above list** below **`md` (48em)**; **md–lg** uses a **40%** image column; **`lg` (62em)+** uses the **image column width** setting (40% / 50% / 60%).
- **Extras vs original spec:** **`full_width`** + full **`section-styles`** shell (padding, margin, background, border, radius) aligned with other sections; vertical padding defaults **80px** top/bottom with **0–160px** step **8** on those controls.

---

![iScreen Shoter - Dia - 260513153033.jpg](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/iScreen%20Shoter%20-%20Dia%20-%20260513153033.jpg)

## Section settings

Global settings for the entire section.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_text` | text | *(empty)* | Small label above the heading. Example: *"Our Skincare Categories"*. |
| `heading` | text | *(empty)* | Section main heading. Example: *"Essential Collections"*. |
| `heading_size` | select | `Large` | Heading size: Small, Medium, Large, Extra large. |
| `description` | textarea | *(empty)* | Short paragraph below the heading. Example: *"Explore curated categories designed to cleanse, and protect your skin…"* |
| `default_active_index` | number | `1` | Which collection entry is highlighted as active on page load (before any hover). 1-based index. |

---

## Section settings — Layout

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `full_width` | checkbox | `false` | Edge-to-edge section background; inner shell uses `section-content-width`. |
| `image_column_width` | select | `50%` | Width of the left image column **on large screens**. Options: 40%, 50%, 60%. Right column takes the remaining width. |
| `image_ratio` | select | `Landscape (4:3)` | Aspect ratio of the featured image area: Square (1:1), Landscape (4:3), Portrait (3:4). |
| `image_border_radius` | select | `Medium (16px)` | Corner rounding of the image: None, Small (8px), Medium (16px), Large (24px). |
| `padding_*` / `margin_*` / `background` / `border` / `radius` | *(section shell)* | *(per schema)* | Standard **`section-styles`** controls in the theme editor. |

---

## Section settings — Entry List Style

Controls the appearance of the collection entry rows in the right column.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_product_count` | toggle | `true` | Show the total product count below each collection title. Example: *"25 products"*. |
| `show_arrow_icon` | toggle | `true` | Show a right-arrow **SVG** (stroke, `currentColor`) at the right end of each entry row. |
| `entry_divider` | toggle | `true` | Show a horizontal divider line between entries. |
| `entry_title_use_scheme_colors` | toggle | `true` | When on, active row uses **`--cs-heading`** and inactive rows use **`--cs-text-secondary`** (from the section colour scheme). When off, use the custom colours below. |
| `active_title_color` | color | `#1A1A1A` | Shown only when scheme colours are off. Active / hovered entry title. |
| `inactive_title_color` | color | `#999999` | Shown only when scheme colours are off. Inactive entry title. |
| `title_size` | select | `Large` | Font size of the collection title in each entry: Small, Medium, Large. |
| `hover_transition_speed` | select | `Normal (300ms)` | Speed of the image crossfade on hover: Fast (150ms), Normal (300ms), Slow (500ms). |

---

## Collection Entry Block

Each block represents one collection entry row in the right column. The featured image on the left updates to reflect whichever block is currently active (hovered or default).

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `collection` | collection | *(empty)* | Collection picker — pulls title, URL, and product count from Shopify automatically. |
| `custom_title` | text | *(empty)* | Override the collection title. Falls back to the collection's name if left empty. |
| `custom_product_count` | text | *(empty)* | Override the product count label. Example: *"25 products"*. Falls back to the real count if empty. |
| `custom_image` | image | *(empty)* | Override the featured image shown on the left when this entry is active. Falls back to the collection's featured image if empty. |
| `custom_url` | url | *(empty)* | Override the link destination. Falls back to the collection's URL if empty. |
| `open_new_tab` | toggle | `false` | Open the collection link in a new tab. |

---

## Responsive Behaviour

| Setting | Desktop ≥ 1024px | Tablet 768–1023px | Mobile ≤ 767px |
| --- | --- | --- | --- |
| Layout | 2 columns (image \| list) | 2 columns (image \| list) | Single column — image stacked above list |
| Image column | Configurable width | 40% fixed | Full width |
| Hover image update | On hover | On hover | On tap (toggle active) |
| Product count | Visible | Visible | Visible |
| Arrow icon | Visible | Visible | Visible |
| Entry divider | Visible | Visible | Visible |

> **Mobile:** The left image column stacks above the entry list. Hover becomes a tap — tapping an entry updates the image above it.

---

## Shopify Schema — Suggested Structure

```json
{
  "name": "Collection List",
  "settings": [
    { "type": "text", "id": "eyebrow_text", "label": "Eyebrow text" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Essential Collections" },
    { "type": "select", "id": "heading_size", "label": "Heading size", "default": "large", "options": [
      { "value": "small", "label": "Small" },
      { "value": "medium", "label": "Medium" },
      { "value": "large", "label": "Large" },
      { "value": "xlarge", "label": "Extra large" }
    ]},
    { "type": "textarea", "id": "description", "label": "Description" },
    { "type": "range", "id": "default_active_index", "label": "Default active entry", "min": 1, "max": 8, "step": 1, "default": 1 },
    { "type": "header", "content": "Layout" },
    { "type": "select", "id": "image_column_width", "label": "Image column width", "default": "50", "options": [
      { "value": "40", "label": "40%" },
      { "value": "50", "label": "50%" },
      { "value": "60", "label": "60%" }
    ]},
    { "type": "select", "id": "image_ratio", "label": "Image ratio", "default": "landscape", "options": [
      { "value": "square", "label": "Square (1:1)" },
      { "value": "landscape", "label": "Landscape (4:3)" },
      { "value": "portrait", "label": "Portrait (3:4)" }
    ]},
    { "type": "select", "id": "image_border_radius", "label": "Image border radius", "default": "medium", "options": [
      { "value": "none", "label": "None" },
      { "value": "small", "label": "Small (8px)" },
      { "value": "medium", "label": "Medium (16px)" },
      { "value": "large", "label": "Large (24px)" }
    ]},
    { "type": "range", "id": "section_padding_top", "label": "Padding top (px)", "min": 0, "max": 160, "step": 8, "default": 80 },
    { "type": "range", "id": "section_padding_bottom", "label": "Padding bottom (px)", "min": 0, "max": 160, "step": 8, "default": 80 },
    { "type": "header", "content": "Entry List Style" },
    { "type": "checkbox", "id": "show_product_count", "label": "Show product count", "default": true },
    { "type": "checkbox", "id": "show_arrow_icon", "label": "Show arrow icon", "default": true },
    { "type": "checkbox", "id": "entry_divider", "label": "Show entry divider", "default": true },
    { "type": "color", "id": "active_title_color", "label": "Active title color", "default": "#1A1A1A" },
    { "type": "color", "id": "inactive_title_color", "label": "Inactive title color", "default": "#999999" },
    { "type": "select", "id": "title_size", "label": "Entry title size", "default": "large", "options": [
      { "value": "small", "label": "Small" },
      { "value": "medium", "label": "Medium" },
      { "value": "large", "label": "Large" }
    ]},
    { "type": "select", "id": "hover_transition_speed", "label": "Hover transition speed", "default": "300", "options": [
      { "value": "150", "label": "Fast (150ms)" },
      { "value": "300", "label": "Normal (300ms)" },
      { "value": "500", "label": "Slow (500ms)" }
    ]}
  ],
  "blocks": [
    {
      "type": "collection_entry",
      "name": "Collection Entry",
      "settings": [
        { "type": "collection", "id": "collection", "label": "Collection" },
        { "type": "header", "content": "Overrides" },
        { "type": "text", "id": "custom_title", "label": "Custom title", "info": "Overrides the collection name if set." },
        { "type": "text", "id": "custom_product_count", "label": "Custom product count label", "info": "e.g. '25 products'. Overrides the real count if set." },
        { "type": "image_picker", "id": "custom_image", "label": "Custom featured image", "info": "Overrides the collection's featured image on the left panel." },
        { "type": "url", "id": "custom_url", "label": "Custom URL", "info": "Overrides the collection link if set." },
        { "type": "checkbox", "id": "open_new_tab", "label": "Open in new tab", "default": false }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [{ "name": "Collection List" }]
}
```

---

## Implementation notes

- **Shipped file:** `sections/section-collection-list.liquid` — separate from **`main-list-collections`**.
- The **left image panel** renders all block images stacked with `opacity: 0`, and transitions `opacity: 1` on the currently active block's image — smooth crossfade without layout shift.
- **Active state** is driven by hover on desktop and tap on mobile. The `default_active_index` setting controls which entry is pre-selected on load.
- **`custom_image`** at block level is the primary way merchants can use lifestyle photos instead of Shopify collection images.
- **`custom_product_count`** accepts free text to allow labels like *"25 products"* or *"New arrivals"* — not limited to a number.
- Maximum of **8 blocks** to keep the entry list scannable.
