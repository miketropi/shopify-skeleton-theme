# Search page — developer guide

This document describes how to build and maintain the **search results** experience in this theme so it meets **Shopify Theme Store** expectations, stays consistent with **theme settings** (colour, typography, layout), and delivers **clear, responsive** UI/UX on mobile and tablet.

**Code today:** `templates/search.json` → `sections/search.liquid`.  
**Related:** [COLOR_SCHEME_SYSTEM.md](./COLOR_SCHEME_SYSTEM.md) (tokens and `color-scheme-vars`), [SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md](./SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md).

---

## What Shopify provides

| Piece | Role |
|--------|------|
| **`templates/search.json`** | JSON template that mounts the main section(s) for `/search`. |
| **`search` Liquid object** | `search.performed`, `search.terms`, `search.results`, `search.results_count`, pagination. |
| **`routes.search_url`** | Form `action` for GET search (must stay the canonical search endpoint). |

Official reference: [Search template](https://shopify.dev/docs/storefronts/themes/architecture/templates/search) and [search object](https://shopify.dev/docs/api/liquid/objects/search).

---

## Theme Store–oriented goals

These are practical bars reviewers and merchants care about; they align with public Theme Store guidance on usability, accessibility, and consistency.

1. **Search must work end-to-end** — Form submits to `routes.search_url` with `name="q"`; results and empty states are understandable and translated.
2. **Accessibility** — Search is a landmark: `role="search"` on the form, visible **label** (not placeholder-only) wired to the input (`for` / `id`), submit control has an accessible name, focus order is logical.
3. **Touch and small screens** — Inputs are at least ~44×44px touch targets where interactive; layout does not require horizontal scrolling for core content; typography scales with theme `--cs-font-*` and spacing with `--page-margin` / `--page-width`.
4. **Performance** — Result images use appropriate `widths` / `sizes` (see `snippets/image.liquid` and Theme Store image guidance); avoid loading huge hero assets on the search page.
5. **No merchant traps** — Section schema is honest; settings that change behaviour are documented in the schema `info` when non-obvious.
6. **Consistency** — Surfaces use **`{% render 'color-scheme-vars' %}`** on the section root and **CSS variables** (`var(--cs-background)`, `var(--cs-text)`, etc.), not one-off hex in SCSS for layout chrome.

---

## Fitting this theme’s design system

### Colour and typography

- Add a **wrapper root** on `sections/search.liquid` (e.g. `<div class="section-search" …>`) and include **`{% render 'color-scheme-vars' %}`** on that root, same pattern as `sections/header.liquid` and product sections.
- Style with tokens: `var(--cs-background)`, `var(--cs-text)`, `var(--cs-text-secondary)`, `var(--cs-heading)`, `var(--cs-border)`, `var(--cs-accent)`, buttons `var(--cs-btn-primary-*)` / `var(--cs-btn-secondary-*)` as needed.
- Fonts: use `var(--cs-font-heading)` and `var(--cs-font-body)` (set on `:root` in `snippets/css-variables.liquid`) for headings and body copy — do **not** hard-code `font-family` to a Google font name in the search section.

### Layout tokens

- **`--page-width`** and **`--page-margin`** from theme settings constrain readable width and gutters; wrap main content in the same inner width pattern used elsewhere (e.g. a shared `.page-width` utility if the theme adds one).
- **`--style-border-radius-inputs`** should drive search field and button radius so the page matches **Theme settings → Layout → Input corner radius**.

### Moving styles out of the section

`{% stylesheet %}` inside the section is fine for Theme Store, but for consistency with the rest of the repo you may later move rules to `src/styles/sections/_search.scss` and forward from `src/styles/sections/index.scss` — keep selectors scoped under `.section-search` (or equivalent) to avoid leaks.

---

## UI/UX: full-page search results

### Information architecture

| State | UX expectation |
|--------|----------------|
| **First visit** (`search.performed` is false) | Clear page title, search field with label, optional short hint; optional popular links — keep minimal unless schema-driven. |
| **No results** | Plain language, repeat or refine query; consider links to catalog or contact — use `search.no_results_html` with safe `terms` interpolation. |
| **Has results** | Summarise count (`search.results_for_html`); show a **scannable** list or grid; distinguish **product** (price, availability) vs **article** vs **page** where helpful. |

### Product vs mixed results

The default section loops `search.results` where each item may be a **product**, **article**, or **page** (`result.object_type` is available). Theme Store–friendly patterns:

- **Mixed:** Show type badge or subtle label (“Product”, “Article”) for clarity.
- **Product-first storefront:** Offer a theme setting “Default search type” that appends `type=product` to links or document that merchants can use Shopify’s search URL parameters ([search URL parameters](https://shopify.dev/docs/api/liquid/objects/search#search-results)).

### Pagination

Keep `{% paginate search.results by N %}` with a reasonable **N** (e.g. 12–24). Style `default_pagination` output for tap targets and contrast on `--cs-background`.

### Smooth polish (no framework required)

- Clear focus styles on input and links (`outline` / `outline-offset` using `var(--cs-accent)` or a dedicated focus token).
- Adequate spacing between results; grid `minmax` breakpoints that **jump** cleanly at tablet widths (e.g. 2 columns tablet, 1 column phone).
- Optional: preserve scroll position when refining search is not native to Liquid-only forms; avoid jarring layout shift when results load (fixed min-height for image slots in cards).

---

## Tablet and mobile

| Concern | Approach |
|---------|----------|
| **Form** | Stack field + button vertically on narrow screens (`flex-direction: column` or grid); full-width input; button full-width or aligned end with min height. |
| **Results grid** | `repeat(auto-fill, minmax(min(100%, 280px), 1fr))` or similar so **one column** on small viewports without overflow. |
| **Images** | Pass `width` / `sizes` into `image` snippet so small screens do not download desktop-sized URLs. |
| **Typography** | Prefer `clamp()` or responsive type scales tied to theme fonts, not fixed `px` for body text only. |

Test in Shopify theme editor preview at phone and tablet breakpoints, not only desktop.

---

## Optional enhancements (document for future work)

| Feature | Notes |
|---------|--------|
| **Predictive search (theme app extension or Search & Discovery)** | Uses different surface (drawer/modal); if added, keep ARIA (`combobox`, `listbox`, live region) and keyboard navigation. `window.Shopify.routes.predictive_search_url` may be used from JS — still ship no‑JS fallback to this page. |
| **Section settings** | e.g. results per page (must still match `paginate` or be documented as display-only if Liquid limits apply), show product type only, heading text override — follow [settings best practices](https://shopify.dev/docs/storefronts/themes/architecture/settings). |
| **Facets** | Full collection-style faceting is **not** the same as template search; merchants often use apps or collection templates for heavy filtering. |

---

## Localization

All user-visible strings must go through **`{{ 'search.*' | t }}`** (or shared keys under `general`). Update **`locales/en.default.json`** and add matching keys for every locale file you ship. For Theme Store, avoid hard-coded English in Liquid.

---

## Implementation checklist

Use this when shipping or reviewing a search redesign:

- [ ] Section root includes `color-scheme-vars`; styles use `--cs-*` and layout tokens.
- [ ] Search form: `role="search"`, `method="get"`, `action="{{ routes.search_url }}"`, input `name="q"`, **associated label**, submit control accessible.
- [ ] Empty and results states use translation keys; HTML in locale strings is intentional and safe.
- [ ] Pagination and result links are keyboard-operable; visible focus.
- [ ] Layout verified at mobile, tablet, desktop; no critical horizontal scroll.
- [ ] Images in results are responsive and reasonably sized.
- [ ] `{% schema %}` name uses `t:` key where applicable; new settings have labels (and `info` if needed).
- [ ] `npm run check` passes after Liquid/JSON changes.

---

## File map (this repo)

| File | Purpose |
|------|---------|
| `templates/search.json` | Declares which section renders on the search template. |
| `sections/search.liquid` | Markup, pagination, inline stylesheet, schema. |
| `locales/en.default.json` | `search.title`, `search.placeholder`, `search.submit`, `search.no_results_html`, `search.results_for_html`. |
| `snippets/image.liquid` | Responsive images for result thumbnails. |

---

## References

- [Shopify — Search template](https://shopify.dev/docs/storefronts/themes/architecture/templates/search)
- [Shopify — search object](https://shopify.dev/docs/api/liquid/objects/search)
- [Shopify — Theme Store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements) (general; apply accessibility and performance sections to search)
- Internal: [COLOR_SCHEME_SYSTEM.md](./COLOR_SCHEME_SYSTEM.md)
