# Collection Slide

> Two-column layout: static intro on the left (~30% on large screens) and a **Swiper** horizontal collection card carousel on the right — stacks on small screens.

**Status:** implemented as **`section-collection-slide`**.

| Piece | Location |
| --- | --- |
| Liquid | `sections/section-collection-slide.liquid` |
| Styles | `src/styles/sections/_section-collection-slide.scss` |
| Script | `src/scripts/sections/section-collection-slide.ts` + `section-collection-slide.runtime.ts` |
| Section type | `data-section-type="section-collection-slide"` |
| Schema / locales | `t:sections.collection_slide.*` in `locales/en.default.schema.json`; storefront strings under `sections.collection_slide` in `en.default.json` |

---

![Collection Slide mock](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Collections-Slide.jpg)

---

## Behaviour

- **Shell:** `section-styles` + `shopify-section-wrapper` + optional **custom colour scheme** (same pattern as collection list / product slider).
- **Collection cards (blocks):** Rounded image only; title and “view” line sit **below** with no background panel, border, or card shadow (unboxed). Hover lightly scales the **image** only.
- **Intro:** Eyebrow, heading (`product-slider--heading-*` scale), description, optional CTA: **primary / outline / ghost** variants use the section colour scheme’s **Button — primary** and **Button — secondary** tokens (`--cs-btn-primary-*`, `--cs-btn-secondary-*`), not overlay accent colours.
- **Carousel:** `collection_card` blocks only count when **collection** and/or **custom URL** is set. **Swiper** with `slidesPerView` **1.2** (mobile), **min(2, setting)** (tablet), **2 / 2.5 / 3** (desktop from `cards_visible`). **Space between** from gap setting (16 / 24 / 32 px).
- **Arrows:** Sides of viewport, vertically positioned toward the **image** band; **hidden below 768px** (spec: mobile relies on swipe).
- **Motion:** Loading dots + GSAP stagger reveal; **`entrance_animate_on_scroll`** toggles waiting for `IntersectionObserver` (like product slider). **`prefers-reduced-motion`** skips stagger, image hover scale, and pulse.
- **Blocks:** `collection_card`, max **10**. Preset adds three empty card blocks.

---

## Section settings — Intro column

| Option | Type | Default | Notes |
|--------|------|---------|--------|
| `eyebrow_text` | text | — | |
| `heading` | text | — | |
| `heading_size` | select | `large` | Shared product-slider heading scale classes. |
| `description` | textarea | — | |
| `button_label` / `button_link` | text / url | — | Both required for CTA to show. |
| `button_style` | select | `primary` | **Primary** = filled primary scheme button. **Outline** = border/text from primary button colours. **Ghost** = translucent secondary button colours (soft glass). |

---

## Section settings — Carousel

| Option | Type | Default | Notes |
|--------|------|---------|--------|
| `show_navigation_arrows` | checkbox | `true` | Only if **>1** slide; still hidden on narrow CSS breakpoint. |
| `cards_visible` | select | `2.5` | `2`, `2.5`, `3` — applied at **992px+**. |
| `card_gap` | select | `medium` | 16 / 24 / 32 px. |
| `image_ratio` | select | `portrait` | `square` (1:1) or `portrait` (3:4). |
| `image_border_radius` | select | `medium` | Card + image top corners. |

---

## Section settings — Card labels

| Option | Type | Default |
|--------|------|---------|
| `collection_title_size` | select | `medium` |
| `show_view_collection_link` | checkbox | `true` |
| `view_collection_label` | text | `View Collection` |

---

## Block: `collection_card`

| Option | Notes |
|--------|--------|
| `collection` | Optional if `custom_url` set. |
| `custom_title` | Fallback: collection title or URL. |
| `custom_image` | Fallback: collection image; else placeholder SVG. |
| `image_position` | `object-position` on image. |
| `custom_url` | Overrides link. |

---

## Responsive

| | Large (`lg`+) | Small |
|--|---------------|--------|
| Layout | ~30% intro \| flex carousel | Stacked; full width. |
| Arrows | Shown (if enabled & 2+ slides) | Hidden (swipe). |

---

## Shopify schema (reference)

The live schema lives in **`sections/section-collection-slide.liquid`**. The section also includes **padding, margin, background, border, corner radius** settings compatible with **`snippets/section-styles.liquid`**.

---

*Implemented stack: Swiper Navigation + Keyboard, section registry, lazy runtime chunk.*
