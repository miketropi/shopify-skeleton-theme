# Off-canvas mini cart — implementation guide

This document describes how to add a **slide-out (off-canvas) cart drawer** to this theme in a way that fits **Shopify Theme Store** expectations: accessible, merchant-configurable, localized, and maintainable alongside the existing `/cart` page (`sections/main-cart.liquid`).

---

## Goals

- **Mini cart**: Quick view of the cart without leaving the current page; primary actions (checkout, continue shopping) remain obvious.
- **Full cart page**: Keep `templates/cart.json` + `main-cart` as the canonical place for full editing, notes, and complex cart UX. The drawer should not replace required cart functionality.
- **Theme Store alignment**: Keyboard access, visible focus, screen reader announcements, `prefers-reduced-motion`, no hard-coded English strings, and settings that merchants can understand.

---

## Architecture (recommended)

| Piece | Responsibility |
|--------|----------------|
| **Snippet** (e.g. `snippets/cart-drawer.liquid`) | Markup for the drawer shell: overlay, panel, close control, live region, optional loading state. |
| **Section** (e.g. `sections/cart-drawer.liquid`) | Wraps the snippet, exposes **theme editor** settings (position, color scheme, optional behavior toggles), and outputs `data-section-id` / `data-section-type` for JS lifecycle. |
| **Header** (`sections/header.liquid`) | Cart **icon control** opens the drawer (button or link that behaves like a button); keep a **fallback** `href="{{ routes.cart_url }}"` for no-JS and middle-click. |
| **JS** (`assets/theme.js` or a dedicated module) | Open/close, focus trap, `Escape`, fetch/update via **Cart API** + **Section Rendering API**, dispatch events other features can listen for. |
| **Locales** | All user-visible strings in `locales/*.json`; merchant-facing labels in `locales/*.schema.json`. |

**Section groups:** If the drawer must appear on every layout, add the section to a group that `layout/theme.liquid` already loads (e.g. after `header-group`) or inject via the header section’s schema as a **static block** only if your theme’s architecture supports it cleanly.

---

## Markup and ARIA

Use a **dialog pattern** consistent with [WAI-ARIA APG dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/):

1. **Trigger**: Prefer `<button type="button">` with clear accessible name (e.g. “Cart” + item count in visually hidden or `aria-describedby`). If you keep an `<a href="{{ routes.cart_url }}">`, enhance with JS: `preventDefault` when JS runs, `role="button"` is optional if it remains a real link for no-JS.
2. **Container**: `role="dialog"` (or native `<dialog>` if you polyfill behavior consistently), `aria-modal="true"`, `aria-labelledby` pointing at the drawer title.
3. **Focus**: On open, move focus to the **first focusable** in the drawer or the close button. On close, return focus to the trigger.
4. **Focus trap**: Tab cycles inside the drawer while open.
5. **`Escape`**: Closes the drawer unless focus is inside a nested widget that uses Escape (then follow that widget’s pattern).
6. **Overlay**: Clicking the backdrop closes the drawer; ensure the backdrop is not focusable in a way that breaks the trap.

**Live region:** After cart updates (add line, change qty, remove), update a **polite** `aria-live="polite"` region with a short message (e.g. “Cart updated, 3 items”) using existing translation keys or new ones under `cart.drawer.*`.

**Motion:** Respect `prefers-reduced-motion: reduce` by disabling or shortening slide animations.

---

## Liquid: reusing cart line item structure

Mirror the data you already output in `sections/main-cart.liquid` (line items, `item.key`, `item.url_to_remove`, `updates[]` names for full form posts, subtotal, taxes note, checkout button).

For the **drawer**, you typically:

- Render **line items** from `cart.items` on first paint (server-rendered HTML inside the section/snippet).
- After AJAX changes, replace that HTML with a **section render** response so Liquid stays the single source of truth (see below).

**Selling plans / properties / discounts:** If the theme Store listing claims full cart support, ensure the drawer either shows the same fields as `main-cart` or clearly defers merchants to the cart page for edge cases—avoid silently hiding required cart information.

---

## JavaScript: Cart API + Section Rendering API

### Add to cart from product forms

`sections/main-product.liquid` uses a standard `{% form 'product', product %}`. Options:

1. **Intercept `submit`** on the product form: `fetch` to `{{ routes.cart_add_url }}.js` with `FormData`, then open the drawer and refresh drawer HTML.
2. **Listen for `cart:updated`** (or a custom event your cart code dispatches) so quick-add or app blocks can reuse the same path.

Use the **JSON** cart add endpoint responses to handle errors (422 variant unavailable, quantity rules, etc.) and surface messages in the drawer or product section.

### Refresh drawer contents

After any mutation (`/cart/add.js`, `/cart/change.js`, `/cart/update.js`):

1. Request rendered HTML for **only** the cart drawer section, e.g.  
   `GET ${Shopify.routes.root}sections/cart-drawer?sections=cart-drawer`  
   (adjust query to match your section file name and [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering) usage.)
2. Replace the inner container of the drawer with the response.
3. Update **header badge** (item count) from the JSON response or from parsed section HTML.
4. Announce changes via the live region.

### Quantity and remove

- **Remove:** Either POST to `cart/change.js` with `quantity: 0` or link to `item.url_to_remove` with full navigation as fallback.
- **Quantity:** Debounce updates to `cart/change.js` or batch with `cart/update.js` to match how `main-cart` behaves.

### Theme editor

Register the drawer in `theme.js` with the same pattern as other sections: `data-section-type` and listeners for `shopify:section:load` / `shopify:section:unload` so **customizer previews** do not duplicate listeners or leak focus traps.

---

## Section schema (merchant settings)

Keep settings **minimal and clear** for Theme Store review:

- Drawer **position**: left / right.
- **Color scheme** (if the theme uses scheme pickers): reuse `color-scheme-vars` pattern from existing sections.
- Optional: **Auto-open** after add to cart (default on is common; allow off for merchants who prefer subtle badges only).
- Optional: Show **cart note** in drawer only if you implement note sync with the cart API; otherwise omit.

Every setting label and info text should use **schema translations** (`t:` keys in `locales/en.default.schema.json`), not literal English in the schema JSON.

---

## Localization

Add keys for:

- Drawer title (“Your cart”, or reuse `cart.title` if appropriate).
- Open cart / close cart (for `aria-label`s).
- Empty state (can reuse `cart.general.empty`).
- “View cart” link to `routes.cart_url`.
- Checkout / subtotal / tax strings (reuse existing `cart.general.*` where possible).

Provide the same keys in **every** `locales/*.json` file the theme ships, even if English is the default copy for some locales—Theme Store themes are expected to ship complete locale files.

---

## Performance and quality

- **No duplicate cart CSS:** Share rules between `main-cart` and drawer where possible (CSS variables, shared class BEM block, or a single `{% stylesheet %}` snippet).
- **Images:** Reuse `image_url` widths appropriate for a narrow drawer; `loading="lazy"` for below-the-fold lines.
- **Avoid layout thrash:** Batch DOM updates when replacing section HTML.
- **Security / CSP:** Avoid inline scripts in Liquid; keep JS in assets.

---

## Theme Store checklist (cart drawer)

Use this as a pre-submission pass:

- [ ] All new UI strings translated; schema labels use `t:`.
- [ ] Open, close, and operate drawer **with keyboard only**.
- [ ] Focus visible and **returns to trigger** on close.
- [ ] Screen reader announces cart updates meaningfully.
- [ ] `prefers-reduced-motion` respected.
- [ ] Works with **JS disabled**: cart icon still reaches `/cart` (link fallback).
- [ ] **Cart page** still works and matches storefront policies (subtotal, taxes disclaimer, checkout).
- [ ] No console errors on add, remove, quantity change, or section load in the theme editor.
- [ ] **Dawn / reference behavior** sanity check: compare with Shopify’s reference patterns where helpful ([cart drawer patterns in Shopify themes](https://shopify.dev/docs/storefronts/themes/pricing-payments/cart)).

---

## References (Shopify)

- [Cart API (Ajax)](https://shopify.dev/docs/api/ajax/reference/cart)
- [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering)
- [Cart template architecture](https://shopify.dev/docs/storefronts/themes/architecture/templates/cart)
- [Theme Store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements) (accessibility, settings, localization)

---

## Map to this repo (current state)

| File | Relevance |
|------|-----------|
| `sections/main-cart.liquid` | Reference for cart rows, form names, money filters, empty state. |
| `sections/header.liquid` | Cart icon link; replace/enhance with drawer trigger. |
| `assets/theme.js` | Extend section registry for `cart-drawer` lifecycle. |
| `locales/en.default.json` | `cart.*` keys for reuse and extension. |

This skeleton does **not** yet implement a drawer; use this doc as the build spec and keep behavior aligned with the full cart section so merchants get a consistent experience.
