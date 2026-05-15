# Product Slider

> **Status:** Specification for a future marketing section. There is no `section-product-slider` (or equivalent) in this repository yet—compare with `sections/section-home-slider.liquid` (Swiper carousel) and `sections/main-collection.liquid` + `snippets/tcard-product.liquid` (product cards).

Horizontal scrolling **or** wrapping product row: intro (eyebrow + heading), optional arrows, configurable columns and gap. Cards should reuse the theme’s shared product card snippet unless a deliberate fork is justified.

---

![Product slider reference mock](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/product-slide.jpg)

## Relationship to this theme (current codebase)

| Topic | In this repo today |
| --- | --- |
| Product card markup | `snippets/tcard-product.liquid` — **not** `product-card.liquid` (that file does not exist). |
| Card features | Sale / sold-out / video badges, title, price (`snippets/price-display`), optional vendor, optional quick-add (single-variant ATC or “Choose options” link). **No** color swatches or trust-badge strip in the snippet as of this doc. |
| Where cards are used | `sections/main-collection.liquid`, `sections/search.liquid`. |
| Carousel / Swiper precedent | `sections/section-home-slider.liquid` + `src/scripts/sections/section-home-slider.*` — registration, lazy runtime, a11y patterns. |
| Section shell (padding, margin, background, border) | `snippets/section-styles.liquid` + class `shopify-section-wrapper` + shared settings block — see `.cursor/rules/liquid-patterns.mdc` (*Section shell*). |
| Breakpoints | `src/styles/base/_breakpoints.scss`: `sm` 36em, `md` 48em (768px), `lg` 62em (992px), `xl` 75em (1200px). Prefer these over ad-hoc 1024px / 767px cutoffs. |
| Typography | Merchant scale via `snippets/css-variables.liquid` (`--font-size-*`). Section headings should use those tokens in SCSS — see `.cursor/rules/scss-styles.mdc`. |
| Section naming | Planned file: `sections/section-product-slider.liquid`, SCSS `src/styles/sections/_section-product-slider.scss`, optional `data-section-type="section-product-slider"` if JS is required. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |

If the product vision requires **swatches, trust badges, or richer quick options**, plan either an extension to `tcard-product` (and `src/styles/sections/_tcard.scss`) or section-local markup — do not assume they already exist on the card.

---

## Section settings (functional spec)

Global settings for the entire section.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_text` | text | *(empty)* | Small label above the heading. Example: *"Clean Beauty Picks"*. |
| `heading` | text | *(empty)* | Section main heading. Example: *"Nature Powered Skincare"*. |
| `heading_size` | select | `large` | Heading step: map to typography tokens / BEM modifiers (e.g. `small` → `lg`, `xlarge` → `3xl`) rather than one-off `rem` values. |
| `show_navigation_arrows` | checkbox | `true` | Prev/next controls (carousel mode). Hide on small viewports if UX calls for touch-only scroll. |
| `products_per_row` | select | `4` | Visible “columns” at `lg+` (conceptually). Options: `2`, `3`, `4`. Scale down at `md` / base per design. |
| `gap` | select | `medium` | Spacing between cards (`small` / `medium` / `large` → CSS variables or spacing tokens on the section root). |
| `enable_carousel` | checkbox | `true` | When `true`, horizontal carousel (likely Swiper, matching other sliders). When `false`, wrap as a static responsive grid. |
| *(shell)* | — | — | When using `section-styles`, add padding, margin, background, border, and radius settings from `snippets/section-styles.liquid` and merge into schema + locales (`t:` keys). |

### Recommended card-related **section** toggles

Because `tcard-product` is driven by **render parameters**, expose these as **section** settings (apply to every card) unless you add per-block overrides later:

| Option | Type | Default | Maps to snippet |
| --- | --- | --- | --- |
| `show_secondary_image` | checkbox | `false` | `show_secondary_image` |
| `show_vendor` | checkbox | `false` | `show_vendor` |
| `show_quick_add` | checkbox | `false` | `show_quick_add` |

---

## Product block

Each block is one product in the row.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `product` | product | *(empty)* | Shopify product; title, URL, media, variants, prices come from the object. Render with `{% render 'tcard-product', product: block.settings.product, ... %}`. |

---

## Responsive behavior (align to theme breakpoints)

Use **min-width** mobile-first queries (`mq-up('md')`, `mq-up('lg')`) in SCSS. The table below translates the original spec into theme tokens; exact peek / column counts are design decisions during implementation.

| Concern | `< md` (&lt; 48em / 768px) | `md`–`lg` (48–61.99em) | `lg+` (≥ 62em / 992px) |
| --- | --- | --- | --- |
| Visible cards | ~1 + peek (e.g. 1.5) if carousel | 2–3 | Up to `products_per_row` (2–4) |
| Navigation arrows | Often hidden | Optional | Shown if `show_navigation_arrows` |
| Gap | Tightest step | Medium | As configured (`gap` setting) |

---

## Shopify schema — **illustrative** JSON

Production schema in this theme uses **`"t:sections...."`** keys for `name` / `label` and merges **section shell** settings from `snippets/section-styles.liquid`. Treat this block as a structural hint only; run `npm run check` and extend `locales/en.default.schema.json` when implementing.

```json
{
  "name": "t:sections.product_slider.name",
  "settings": [
    { "type": "text", "id": "eyebrow_text", "label": "t:sections.product_slider.settings.eyebrow_text" },
    { "type": "text", "id": "heading", "label": "t:sections.product_slider.settings.heading", "default": "Nature Powered Skincare" },
    { "type": "select", "id": "heading_size", "label": "t:sections.product_slider.settings.heading_size", "default": "large", "options": [
      { "value": "small", "label": "t:sections.product_slider.settings.heading_size_options.small" },
      { "value": "medium", "label": "t:sections.product_slider.settings.heading_size_options.medium" },
      { "value": "large", "label": "t:sections.product_slider.settings.heading_size_options.large" },
      { "value": "xlarge", "label": "t:sections.product_slider.settings.heading_size_options.xlarge" }
    ]},
    { "type": "checkbox", "id": "show_secondary_image", "label": "t:sections.product_slider.settings.show_secondary_image", "default": false },
    { "type": "checkbox", "id": "show_vendor", "label": "t:sections.product_slider.settings.show_vendor", "default": false },
    { "type": "checkbox", "id": "show_quick_add", "label": "t:sections.product_slider.settings.show_quick_add", "default": false },
    { "type": "checkbox", "id": "show_navigation_arrows", "label": "t:sections.product_slider.settings.show_navigation_arrows", "default": true },
    { "type": "select", "id": "products_per_row", "label": "t:sections.product_slider.settings.products_per_row", "default": "4", "options": [
      { "value": "2", "label": "2" },
      { "value": "3", "label": "3" },
      { "value": "4", "label": "4" }
    ]},
    { "type": "select", "id": "gap", "label": "t:sections.product_slider.settings.gap", "default": "medium", "options": [
      { "value": "small", "label": "t:sections.product_slider.settings.gap_options.small" },
      { "value": "medium", "label": "t:sections.product_slider.settings.gap_options.medium" },
      { "value": "large", "label": "t:sections.product_slider.settings.gap_options.large" }
    ]},
    { "type": "checkbox", "id": "enable_carousel", "label": "t:sections.product_slider.settings.enable_carousel", "default": true }
  ],
  "blocks": [
    {
      "type": "product",
      "name": "t:sections.product_slider.blocks.product.name",
      "settings": [
        { "type": "product", "id": "product", "label": "t:sections.product_slider.blocks.product.settings.product" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [{ "name": "t:sections.product_slider.presets.name" }]
}
```

---

## Implementation checklist (when you build it)

1. **Liquid:** `sections/section-product-slider.liquid` — `{% render 'section-styles', section: section %}`, `shopify-section-wrapper`, color scheme vars (`color-scheme-vars`) consistent with `section-feature-grid` / `section-home-slider`.
2. **Cards:** `{% render 'tcard-product', product: block.settings.product, show_secondary_image: section.settings.show_secondary_image, show_vendor: section.settings.show_vendor, show_quick_add: section.settings.show_quick_add %}` (adjust setting ids).
3. **SCSS:** `src/styles/sections/_section-product-slider.scss` + `@forward` in `sections/index.scss`; use `--font-size-*` for headings; use breakpoint mixin for layout.
4. **JS:** If carousel: `registerSection` + prefer lazy `*.runtime.ts` if Swiper bundle is non-trivial; respect `prefers-reduced-motion`; mirror a11y patterns from `section-home-slider`.
5. **Images:** Match `tcard-product` lazy loading; consider `loading: 'eager'` only for the first visible card’s image if it is LCP-critical.
6. **QA:** `npm run check`, `npm run build`.

---

## Performance and UX notes

- **Block limit:** `max_blocks`: 12 (or similar) keeps editor and client work reasonable.
- **Carousel:** Disabling carousel yields a static grid — useful for reduced motion / no-JS fallbacks if implemented with progressive enhancement.
- **Peek on mobile:** Shows scroll affordance; implement with slide width / `slidesPerView` fractional or CSS, consistent with Swiper docs and theme patterns.
