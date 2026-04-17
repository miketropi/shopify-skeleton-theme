# Product page (PDP) — developer guide

This document describes how to build and maintain the **product detail page** in this theme so it meets **Shopify Theme Store** expectations, stays aligned with **theme settings** (colour, typography, layout), and delivers **clear, responsive** UI/UX on phone and tablet.

**Code today:** `templates/product.json` → `sections/main-product.liquid`, styles in `src/styles/sections/_main-product.scss`, cart integration via `data-ajax-add-to-cart` and `src/scripts/cart-drawer.ts`.

**Related:** [COLOR_SCHEME_SYSTEM.md](./COLOR_SCHEME_SYSTEM.md), [SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md](./SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md), [SECTION_REGISTRY.md](./SECTION_REGISTRY.md), [OFFCANVAS_MINI_CART.md](./OFFCANVAS_MINI_CART.md), [SEARCH_PAGE.md](./SEARCH_PAGE.md).

---

## What Shopify provides

| Piece | Role |
|--------|------|
| **`templates/product.json`** | JSON template for the product URL; lists sections and order. |
| **`product` Liquid object** | Title, media, variants, price, description, options, etc. |
| **`form 'product'`** | Server-side add-to-cart POST; must expose `name="id"` (variant id) and optional `quantity`. |

Official references: [Product template](https://shopify.dev/docs/storefronts/themes/architecture/templates/product), [product object](https://shopify.dev/docs/api/liquid/objects/product), [product form](https://shopify.dev/docs/api/liquid/tags/form#form-product).

---

## Theme Store–oriented goals

1. **Purchasing path works** — Variant selection submits a valid variant id; unavailable variants cannot be added; sold-out state is obvious and translated.
2. **Accessibility** — Meaningful heading hierarchy (`h1` for product title); **labels** tied to every control (`select`, `quantity`, submit); disabled state on submit when appropriate; focus styles on interactive elements; images have useful `alt` (from media alt or title fallback).
3. **Media quality** — Responsive images with `widths` and `sizes`; first image may use `loading="eager"`; avoid shipping only a single huge asset with no `srcset`.
4. **Mobile and tablet** — Core content stacks in one column on small viewports; tap targets (~44px minimum) on submit and inputs; no horizontal scroll for the main buy box; layout breakpoints behave predictably (this theme uses a **two-column grid from `lg`** with configurable media column width).
5. **Honest settings** — Section schema options (vendor, quantity, media width) do what they say; use schema `info` when behaviour is non-obvious.
6. **Design consistency** — Section root uses **`{% render 'color-scheme-vars' %}`**; styles use **`var(--cs-*)`** and **`var(--cs-font-*)`**, not ad hoc hex for chrome. Inputs respect **`--style-border-radius-inputs`** from theme layout settings.

---

## Fitting this theme’s design system

### Colour and typography

- The PDP root is **`sections/main-product.liquid`** with **`color-scheme-vars`** on the same wrapper as **`data-section-type="main-product"`**.
- Typography: headings and body should continue to use **`var(--cs-font-heading)`** / **`var(--cs-font-body)`** in SCSS (already applied via global `body` and local rules).
- Buttons and fields: primary submit uses **`--cs-btn-primary-*`** tokens so the PDP matches the global colour scheme.

### Layout

- The **`shopify-section` grid** in `assets/critical.css` centers content with **`--page-width`** and **`--page-margin`**.
- **`media_size`** (`small` | `medium` | `large`) maps to modifier classes **`main-product--media-*`**, which control the **desktop** column ratio only; mobile stays a single column.

### Cart and AJAX

- The product form includes **`data-ajax-add-to-cart`** so **`registerAjaxCartAdd()`** in `cart-drawer.ts` intercepts submit, posts to **`/cart/add.js`**, then refreshes the drawer. Routes come from **`window.__themeRoutes`** (see `layout/theme.liquid`) with fallback to `Shopify.routes`.
- Ensure the theme entry registers cart behaviour **before** `bootSections()` (see `src/scripts/theme.ts`).
- For Theme Store, **non-JS** behaviour should still work: if JavaScript fails, a normal form POST to cart should remain possible (do not remove native `form` / `action` semantics without a documented progressive enhancement story).

---

## Current PDP behaviour (this repo)

| Area | Implementation |
|------|------------------|
| **Gallery** | All **`product.media`** rendered as stacked figures; first image eager, rest lazy; `sizes` favour half viewport on large screens. |
| **Variants** | Single `<select name="id">` when multiple variants; hidden input when only default variant. |
| **Price UI** | Inline JSON + small script updates price, compare-at visibility, submit **disabled** state, and label text on variant change. |
| **Quantity** | Optional **`show_quantity`**; `name="quantity"`, min 1. |
| **Description** | `product.description` in an **`.rte`** wrapper for prose styling. |
| **`window.__productData`** | Full **`product | json`** for apps or future features — keep valid JSON and avoid duplicate heavy scripts. |

### Future improvements (common Theme Store asks)

- **Structured data (JSON-LD)** for `Product` — often expected for SEO; add via Liquid or a dedicated snippet when you expand the PDP.
- **Variant pickers** — swatches, separate option rows (`product.options_with_values`) instead of one combined select; keep accessibility (radio group + labels or listbox pattern).
- **Media enhancements** — zoom, thumbnails, video poster handling, 3D model support (`media` types).
- **Sticky ATC / scroll** — optional; test focus and **keyboard** users if you duplicate controls.
- **Section JS in TypeScript** — migrate inline variant script to `src/scripts/` and **`registerSection('main-product', …)`** per [SECTION_REGISTRY.md](./SECTION_REGISTRY.md) for editor lifecycle and testability.

---

## Tablet and mobile checklist

| Concern | Approach in this theme |
|---------|-------------------------|
| **Column layout** | Single column below **`lg`**; grid splits gallery / buy box at **`lg`**. |
| **Sticky buy box** | **`.main-product__info`** is **`position: sticky`** from **`lg`** only — avoids odd overlap on short viewports. |
| **Touch** | Submit and inputs use comfortable min heights in **`_main-product.scss`** (`--product-field-h`). |
| **Images** | `sizes` / `widths` reduce over-fetching on narrow screens. |

Always verify in the theme editor preview at **mobile** and **tablet** widths, not only desktop.

---

## Localization and schema

- All customer-facing strings must use **`{{ 'products.product.*' | t }}`** (or shared keys under **`general`**). Extend **`locales/en.default.json`** and every locale you ship.
- Section **`{% schema %}`** should use **`t:`** keys for **name** and **settings** labels where possible for Theme Store and multilingual merchants (this section still has some English literals — migrate when you internationalize the schema via `locales/*.schema.json`).

---

## Implementation checklist

Use when extending or auditing the PDP:

- [ ] Section root has **`color-scheme-vars`**; SCSS uses **`--cs-*`** / **`--cs-font-*`**.
- [ ] Product **`h1`**; form controls have **labels** and logical **tab order**.
- [ ] Variant id always correct; unavailable variants **disabled** or blocked on submit.
- [ ] Images responsive; meaningful **alt** where Shopify provides it.
- [ ] Ajax add-to-cart degrades safely or documented; cart routes available from Liquid **`__themeRoutes`**.
- [ ] Verified on **mobile**, **tablet**, **desktop**; keyboard and screen reader spot-check on buy box.
- [ ] `npm run check` clean after Liquid / JSON / locale changes.

---

## File map (this repo)

| File | Purpose |
|------|---------|
| `templates/product.json` | Product template section list. |
| `sections/main-product.liquid` | PDP markup, product form, variant JSON, inline variant script, `__productData`. |
| `src/styles/sections/_main-product.scss` | Layout, gallery, form, RTE, visually-hidden utility for compare price. |
| `src/scripts/cart-drawer.ts` | Ajax intercept for `data-ajax-add-to-cart`. |
| `layout/theme.liquid` | `window.__themeRoutes` for cart endpoints. |
| `locales/en.default.json` | `products.product.*` strings. |

---

## References

- [Shopify — Product template](https://shopify.dev/docs/storefronts/themes/architecture/templates/product)
- [Shopify — product object](https://shopify.dev/docs/api/liquid/objects/product)
- [Shopify — Theme Store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements)
- Internal: [COLOR_SCHEME_SYSTEM.md](./COLOR_SCHEME_SYSTEM.md)
