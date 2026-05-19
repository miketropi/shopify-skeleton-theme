# Product Images Story

> Two-column layout: product card on the left with eyebrow/heading, and an image slideshow on the right — responsive across Desktop, Tablet, and Mobile.

**Status:** implemented as **`section-product-images-story`**. Product card uses **`snippets/tcard-product.liquid`** (not `product-card.liquid`). Slideshow uses **Swiper** with lazy **`section-product-images-story.runtime.ts`**.

| Piece | Location |
| --- | --- |
| Liquid | `sections/section-product-images-story.liquid` |
| Styles | `src/styles/sections/_section-product-images-story.scss` |
| Script | `src/scripts/sections/section-product-images-story.ts` + `*.runtime.ts` |
| Section type | `data-section-type="section-product-images-story"` |
| Schema / locales | `t:sections.product_images_story.*`, `sections.product_images_story` in `en.default.json` |

**Responsive (theme breakpoints):** stacked below **`md` (48em)**; two columns **`md+`** with **50/50** product/slideshow width; **`lg+` (62em)** uses the merchant **column layout** (40/50/60% product). The **nav row** (slide **current / total** + dot pagination) is hidden when there is only one slide or pagination dots are turned off.

---

![Product Images Story mock](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/product-image-slide-story.jpg)

## Section Settings

| Option | Type | Default | Description |
|---|---|---|---|
| `eyebrow_text` | text | _(empty)_ | Small label above the heading. Example: *"Hero Skincare Pick"*. |
| `heading` | text | _(empty)_ | Section main heading. Example: *"Daily Glow Serum"*. |
| `heading_size` | select | `Large` | Heading size: Small, Medium, Large, Extra large. |
| `column_layout` | select | `50/50` | Width ratio between product and image columns. Options: 40/60, 50/50, 60/40. |
| `image_border_radius` | select | `Medium (16px)` | Corner rounding applied to both the product card image and the slideshow. Options: None, Small (8px), Medium (16px), Large (24px). |
| `section_padding_top` | range | `80` | Top padding in px. Range: 0–160, step 8. |
| `section_padding_bottom` | range | `80` | Bottom padding in px. Range: 0–160, step 8. |

---

## Section Settings — Product Column

| Option | Type | Default | Description |
|---|---|---|---|
| `product` | product | _(empty)_ | Product to feature. If left empty, the theme uses the **first product** from the **All products** collection (when the store has products); otherwise the manual “select a product” placeholder appears. |

---

## Section Settings — Image Slideshow Column

Controls the right-column slideshow behavior. Individual images are managed as blocks (see below).

| Option | Type | Default | Description |
|---|---|---|---|
| `slideshow_autoplay` | toggle | `false` | Auto-advance slides in the right column. While autoplay is on, hovering the slideshow with a **mouse** pauses advancement until the pointer leaves (Swiper `pauseOnMouseEnter`). |
| `slideshow_speed` | number | `4` | Seconds per slide when autoplay is on. Range: 2–10. |
| `show_pagination_dots` | toggle | `true` | When on (and there are ≥2 slides), shows **dot** indicators together with a **current / total** slide counter in a **top-centered** glass pill over the slideshow. |
| `slide_transition` | select | `Cards` | Swiper **Cards** (stacked), **Fade**, or **Slide**. **Reduced motion** falls back to fade when Cards is selected. |
| `slideshow_image_ratio` | select | `Fill column` | Slideshow frame: **Fill column** (height follows product column on desktop), or fixed **4:3**, **1:1**, **3:4**, **16:9**. |
| `slideshow_object_fit` | select | `Cover` | **Cover** fills the frame (may crop); **Contain** shows the full image (may letterbox). |

---

## Image Slide Block

Each block adds one image to the right-column slideshow.

| Option | Type | Default | Description |
|---|---|---|---|
| `image` | image | _(empty)_ | Slide image. Recommended size: ≥ 1200×900px for sharp rendering. If empty, the theme shows Shopify’s **placeholder image** (SVG) for that slide; lightbox is omitted for that slide. |
| `image_position` | select | `Center center` | Image focal point: Center center, Top center, Bottom center, Left center, Right center. |
| `description` | richtext | _(empty)_ | Optional copy **below** the image, **centered**, **secondary** tone; **active** slide only. Links and basic formatting. |

---

## Responsive Behavior

| Setting | Desktop ≥ 1024px | Tablet 768–1023px | Mobile ≤ 767px |
|---|---|---|---|
| Layout | 2 columns (product \| slideshow) | 2 columns (product \| slideshow) | Single column — product stacked above slideshow |
| Column ratio | As configured | 50/50 fixed | Full width each |
| Pagination | Dots + slide **1 / n** counter (top glass pill) | Same | Same |
| Slideshow height | Matches product column | Matches product column | **Fill column:** height follows each image’s natural aspect ratio; fixed ratios use the chosen aspect box. |

---

## Shopify Schema — Suggested Structure

```json
{
  "name": "Product Images Story",
  "settings": [
    { "type": "text", "id": "eyebrow_text", "label": "Eyebrow text" },
    { "type": "text", "id": "heading", "label": "Heading" },
    { "type": "select", "id": "heading_size", "label": "Heading size", "default": "large", "options": [
      { "value": "small", "label": "Small" },
      { "value": "medium", "label": "Medium" },
      { "value": "large", "label": "Large" },
      { "value": "xlarge", "label": "Extra large" }
    ]},
    { "type": "select", "id": "column_layout", "label": "Column layout", "default": "50", "options": [
      { "value": "40", "label": "40 / 60" },
      { "value": "50", "label": "50 / 50" },
      { "value": "60", "label": "60 / 40" }
    ]},
    { "type": "select", "id": "image_border_radius", "label": "Image border radius", "default": "medium", "options": [
      { "value": "none", "label": "None" },
      { "value": "small", "label": "Small (8px)" },
      { "value": "medium", "label": "Medium (16px)" },
      { "value": "large", "label": "Large (24px)" }
    ]},
    { "type": "range", "id": "section_padding_top", "label": "Padding top (px)", "min": 0, "max": 160, "step": 8, "default": 80 },
    { "type": "range", "id": "section_padding_bottom", "label": "Padding bottom (px)", "min": 0, "max": 160, "step": 8, "default": 80 },
    { "type": "header", "content": "Product Column" },
    { "type": "product", "id": "product", "label": "Product" },
    { "type": "header", "content": "Image Slideshow" },
    { "type": "checkbox", "id": "slideshow_autoplay", "label": "Autoplay", "default": false },
    { "type": "range", "id": "slideshow_speed", "label": "Autoplay speed (s)", "min": 2, "max": 10, "step": 1, "default": 4 },
    { "type": "checkbox", "id": "show_pagination_dots", "label": "Show pagination dots", "default": true },
    { "type": "select", "id": "slide_transition", "label": "Slide transition", "default": "fade", "options": [
      { "value": "fade", "label": "Fade" },
      { "value": "slide", "label": "Slide" }
    ]}
  ],
  "blocks": [
    {
      "type": "slide",
      "name": "Image Slide",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "select", "id": "image_position", "label": "Image position", "default": "center center", "options": [
          { "value": "center center", "label": "Center center" },
          { "value": "top center", "label": "Top center" },
          { "value": "bottom center", "label": "Bottom center" },
          { "value": "left center", "label": "Left center" },
          { "value": "right center", "label": "Right center" }
        ]}
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Product Images Story" }]
}
```

---

## Implementation Notes

- **Slide UI (slideshow):** **Flat** stack — no slide border, panel, or corner radius (aligned with **`.pis__card .tcard`** square treatment). Image sits in **`.pis__slide-media`** with neutral **shim** tint only; **`.pis__slide-desc`** is **centered** under the image, **secondary** text colour, simple underline links. **Pagination** is **inside** **`.pis__swiper-clip`**, **top-centered** over the slide with a light **glass** chip: **numeric `current / total`** beside **dots** so position is obvious; **description** stays below the image. Multi-slide uses light **opacity** on non-active frames only.

- **Lightbox:** slide images are wrapped in **`.pis__slide-zoomable`** (`role="button"`). Click / Enter / Space opens **`createImageLightbox`** from `src/scripts/image-lightbox.ts` with items from **`lightboxItemsFromPisSlides`** (full-res `data-pis-lightbox-src`, optional plain-text caption from the block description). Labels come from the section root `data-lightbox-*` attributes (dialog title uses **`sections.product_images_story.lightbox_dialog`**; close/prev/next/counter reuse **`products.product.*`**).

- **Product card:** `{% render 'tcard-product', product: section.settings.product, … %}` — badges, price, optional quick-add. Placeholder copy when no product is selected.
- **Slideshow height:** `md+` uses a flex row with **`align-items: stretch`** so the gallery column matches the product column height; images use **`object-fit: cover`**.
- **Blocks:** up to **6** `slide` blocks with `image_picker` + focal **`object-position`**.
- **Images:** first slide **`loading="eager"`**, others **`lazy`**; inline **`style`** for `object-position` per block.
- **Shell:** padding, margin, background, border, and radius from **`section-styles`** (defaults align with other marketing sections, not the older 80px-only note in the table below).

---