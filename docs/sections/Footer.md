# Footer

> **Status:** **Implemented** — `sections/footer.liquid`, `snippets/footer-*.liquid`, `_footer.scss`, `footer.ts`, `footer-group.json`.

> Full-width **global chrome** footer: optional newsletter bar, brand + link columns + store info, policy links, payment icons, copyright, and back-to-top. Rendered via `{% sections 'footer-group' %}` in `layout/theme.liquid` — not added per JSON template.

![Footer section screenshot](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Footer.jpg)

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = site footer chrome only (navigation, brand, newsletter, legal, payments). No mixed hero, product grids, or page content. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | **Global chrome exception:** keep `sections/footer.liquid` and `sections/footer-group.json` (same pattern as `header.liquid` — do **not** rename to `section-footer.liquid`). BEM root: **`site-footer`** (existing). `data-section-type="footer"` only if JS is added (back-to-top, mobile accordions). SCSS: `src/styles/sections/_footer.scss` (already forwarded). Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | **Omit** `section-styles` + `shopify-section-wrapper` — footer is layout chrome. See `.cursor/rules/liquid-patterns.mdc` → *Section shell* (header/footer group). Internal spacing uses section SCSS (`clamp()` padding on `.site-footer__inner`) or optional CSS vars on the `<footer>` root — **not** the shared section-styles snippet. |
| **Colour** | Match **header/footer pattern:** `color_scheme_source` (`global` \| `custom`) + `color_scheme` picker (`visible_if` custom) + `{% render 'color-scheme-vars', scheme: …, inline_only: true %}` on the `<footer>` root. See `docs/COLOR_SCHEME_SYSTEM.md`. Link hover already uses `--footer-link-hover` in `_footer.scss`. Optional **bottom bar** contrast: merchant colour overrides as root CSS vars (e.g. `--footer-bar-bg`, `--footer-bar-text`) with `color-mix` fallbacks from `--cs-*` — **do not** hard-code hex in SCSS. |
| **Typography** | Column headings, tagline, copyright use `var(--font-size-*, …)` and `--cs-font-*`. Newsletter heading size: reuse **product-slider / section-intro** scale (`small` \| `medium` \| `large` \| `xlarge`) or equivalent footer heading modifiers — not ad-hoc px sizes. See `.cursor/rules/scss-styles.mdc`. |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Prefer `mq-up('md')` / `mq-up('lg')` over 767px / 1024px literals. |
| **JS (when needed)** | **Back-to-top** and **mobile link-column accordions** need a thin `src/scripts/footer.ts` (or `sections/footer.ts`) registered in `theme.ts` before `bootSections()`. Use `AbortController` in `destroy()`; respect `prefers-reduced-motion` (`scroll-behavior` / instant scroll). **Newsletter AJAX** (inline success/error without reload) is optional progressive enhancement — form must work without JS via native POST. |
| **Locales** | Schema → **`t:sections.footer.*`** (extend existing keys in `locales/en.default.schema.json`); storefront strings (nav aria labels, newsletter success/error, back-to-top, accordion toggles) in `locales/en.default.json`. |
| **Schema constraints** | Use `checkbox` (not `toggle`), `image_picker`, `link_list`, `range` with min/max/step. Text fields with merchant-visible defaults use **non-empty `default`** values. |
| **Theme Check** | `npm run check` after Liquid; `npm run build` after TS/SCSS. |

**Not the same section as** Header top bar (`header-top-bar` — compact utility strip; may share newsletter form pattern), Trust bar, or any `section-*` marketing band.

---

## Current implementation (baseline)

What ships today in `sections/footer.liquid`:

| Region | Behaviour |
| --- | --- |
| **Brand** | Optional shop name (linked to home) + optional tagline. **No logo image.** |
| **Menus** | Two fixed **`link_list`** settings (`menu`, `secondary_menu`) with separate heading text — **not** blocks. |
| **Social** | Optional; URLs from **Theme settings → Social media** via `snippets/footer-socials.liquid` → `social-icons-row.liquid`. |
| **Bottom** | Optional **policy links** (`shop.policies`), **payment icons** (`shop.enabled_payment_types` + `payment_type_svg_tag`), copyright (`©` + year + shop name + optional `copyright_note` + `powered_by_link`). |
| **Colour** | `color_scheme_source` + `color_scheme` on footer root. |
| **Missing vs design** | _(resolved in implementation)_ |

---

## Target layout (design UX)

| Zone | Region | Content |
| --- | --- | --- |
| **1 — Newsletter bar** | Top strip | Optional heading + email field + subscribe button; optional divider below. |
| **2 — Main body** | Middle grid | **Brand** (logo or shop name, tagline, social) \| up to **2 link column blocks** \| optional **store info** (phone, address, email). |
| **3 — Bottom bar** | Footer strip | Copyright line, payment icons, optional **back-to-top** control anchored to body/footer. |

---

## Section settings (functional spec)

### Zone 1 — Newsletter bar

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_newsletter` | checkbox | `true` | Show newsletter bar above main body. |
| `newsletter_heading` | text | `Subscribe to our newsletter` | Bar heading. Hide bar content region if heading and form both empty (unlikely with defaults). |
| `newsletter_heading_size` | select | `large` | `small` \| `medium` \| `large` \| `xlarge` — theme type scale / section-intro parity. |
| `email_placeholder` | text | `Enter your email` | Email input placeholder. |
| `subscribe_button_label` | text | `Subscribe` | Submit button label. |
| `newsletter_esp_form_id` | text | _(empty)_ | Optional third-party ESP form ID. **Leave empty** for Shopify customer email list (`{% form 'customer' %}`, tag `newsletter`) — mirror `header-top-bar` subscribe pattern. |
| `show_newsletter_divider` | checkbox | `true` | Horizontal rule between newsletter bar and main body. |

### Zone 2 — Brand column

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_branding` | checkbox | `true` | Show brand column. |
| `logo` | image_picker | — | Footer logo. When set, render logo image; **else** fall back to shop name text (current behaviour). |
| `logo_width` | range | `120` | Logo width in px. Min 60, max 240, step 10 → `--footer-logo-width` on root. |
| `brand_tagline` | textarea | _(empty)_ | Short quote/description under logo/name. Maps to existing `tagline` setting (rename or alias in migration). |
| `show_social_icons` | checkbox | `false` | Show social row when theme social URLs exist. Reuse **`footer-socials`** snippet; URLs from **Theme settings → Social media** (not per-section URL fields). |

### Zone 2 — Store info column

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_store_info` | — | **Removed** — column auto-shows when phone, address, or email is filled in. |
| `store_info_heading` | text | `Our store` | Column heading. |
| `support_label` | text | `24/7 support center:` | Label above phone. |
| `phone_number` | text | _(empty)_ | Store phone (`tel:` link when set). |
| `address` | textarea | _(empty)_ | Store address (plain text; optional `address` schema type later). |
| `email_address` | text | _(empty)_ | Contact email (`mailto:` when set). |

### Zone 3 — Bottom bar

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_policy_links` | checkbox | `true` | Show `shop.policies` links (**keep from current footer**). |
| `copyright_note` | text | _(empty)_ | Optional extra line after shop name (existing setting). Prefer Liquid `{{ 'now' \| date: '%Y' }}` + `{{ shop.name }}` for year/name — **avoid** fragile `{year}` / `{shop_name}` string tokens unless a small Liquid replace helper is documented. |
| `show_payment_icons` | checkbox | `true` | Show payment icons when `shop.enabled_payment_types` is non-empty. |

**Global theme setting (Theme settings → Layout):**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_back_to_top` | checkbox | `true` | Fixed back-to-top control site-wide; rendered in footer when enabled. Respects `prefers-reduced-motion`. |

**Removed (non-functional or redundant):**

| Removed | Why |
| --- | --- |
| Legacy primary/secondary menus | Superseded by **Link column** blocks; settings did nothing when blocks existed. |
| `show_store_info` | Toggle had no visible effect when contact fields were empty. |
| `bottom_bar_color_mode` + custom bar colours | Bottom bar always derives from colour scheme via CSS `color-mix`. |

**Removed from original spec (use theme patterns instead):**

| Original | Replacement |
| --- | --- |
| `footer_background_color`, `footer_text_color`, `footer_link_color`, `footer_link_hover_color` | **`color_scheme_source` + `color_scheme`** + existing `--footer-link-hover` in SCSS. |
| `section_padding_top` / `section_padding_bottom` | Internal `.site-footer__inner` padding (SCSS `clamp`) or optional `--footer-body-padding-y` range on root — **not** `section-styles`. |
| `payment_icons` multi-select (Visa, MC, …) | **`shop.enabled_payment_types`** + `{{ type \| payment_type_svg_tag }}` — icons reflect Shopify Payments / gateway config. |

---

## Link column block (`link_column`)

Each block = one navigation column in the main body. **Max 2 blocks.**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `menu` | link_list | — | Menu from **Navigation**. Links from `linklists[menu].links` (or `menu.links` when assigned to variable). |
| `column_heading_override` | text | _(empty)_ | Optional heading; falls back to menu title. |

### Mobile link columns

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `link_columns_accordion_mobile` | checkbox | `true` | Below `md`, collapse link columns behind heading toggles (`aria-expanded`, `+`/`-` or chevron). Progressive enhancement: columns stay expanded if JS fails. |

---

## Colour (section-level)

| Option | Type | Default | Description |
| --- | --- | --- |
| `color_scheme_source` | select | `global` | `global` \| `custom` — same as current footer/header. |
| `color_scheme` | color_scheme | `scheme-6` | When source is `custom`. |

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Replace legacy 767px / 1024px with theme tokens.

| Concern | `< md` (&lt; 48em) | `md` – `lg` (48–61.99em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| **Newsletter bar** | Stacked (heading → form) | Stacked or side-by-side per design | Heading left, form right |
| **Main body columns** | Stacked: brand → link columns (accordion) → store info | Brand + store info row; link columns 2-up | Brand \| link cols (up to 2) \| store info |
| **Link columns** | 1 per row (accordion when enabled) | 2 per row | Side by side |
| **Bottom bar** | Stacked: copyright → payments | Row wrap | Copyright left, payments right |
| **Back-to-top** | Fixed/absolute bottom-right of footer body | Same | Same |

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **Landmark** | Single `<footer class="site-footer">` with `data-section-id` for editor. |
| **Nav columns** | Each link column: `<nav aria-label="…">` with translated label (menu title or override). |
| **Newsletter** | `<form>` with visible `<label>` or `aria-label` on email input; inline `aria-live="polite"` for success/error. |
| **Accordions** | Toggle is `<button type="button">` with `aria-expanded` / `aria-controls`; panel `id` matches. |
| **Back-to-top** | `<button type="button">` with translated `aria-label`; visible focus ring (`:focus-visible`). |
| **Social / payments** | Decorative SVGs `aria-hidden="true"`; list regions use translated `aria-label` (existing `footer.payment_aria`, etc.). |
| **Reduced motion** | Instant scroll for back-to-top; no mandatory motion on accordion open. |
| **No-JS** | Newsletter POST works; link lists readable expanded; payment icons and policies remain visible. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/footer.liquid` (extend in place) |
| Section group | `sections/footer-group.json` |
| Snippets | `snippets/footer-socials.liquid` (exists), optional `snippets/footer-newsletter.liquid`, `snippets/footer-link-column.liquid`, `snippets/footer-store-info.liquid` |
| Styles | `src/styles/sections/_footer.scss` (extend) |
| Scripts | `src/scripts/footer.ts` — **only if** back-to-top and/or mobile accordions |
| Layout | `layout/theme.liquid` → `{% sections 'footer-group' %}` |
| Locales | Extend `sections.footer` in `en.default.schema.json`; `footer.*` in `en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.footer.*`**, `visible_if` for conditional groups, and non-empty text defaults. Structural hint only:

```json
{
  "name": "t:sections.footer.name",
  "class": "section-footer",
  "max_blocks": 2,
  "settings": [
    { "type": "select", "id": "color_scheme_source", "default": "global" },
    { "type": "color_scheme", "id": "color_scheme", "default": "scheme-6" },
    { "type": "header", "content": "t:sections.footer.headers.newsletter" },
    { "type": "checkbox", "id": "show_newsletter", "default": true },
    { "type": "text", "id": "newsletter_heading", "default": "Subscribe to our newsletter" },
    { "type": "select", "id": "newsletter_heading_size", "default": "large" },
    { "type": "text", "id": "email_placeholder", "default": "Enter your email" },
    { "type": "text", "id": "subscribe_button_label", "default": "Subscribe" },
    { "type": "text", "id": "newsletter_esp_form_id" },
    { "type": "checkbox", "id": "show_newsletter_divider", "default": true },
    { "type": "header", "content": "t:sections.footer.headers.brand" },
    { "type": "checkbox", "id": "show_branding", "default": true },
    { "type": "image_picker", "id": "logo" },
    { "type": "range", "id": "logo_width", "min": 60, "max": 240, "step": 10, "default": 120 },
    { "type": "textarea", "id": "brand_tagline" },
    { "type": "checkbox", "id": "show_social_icons", "default": false },
    { "type": "header", "content": "t:sections.footer.headers.store_info" },
    { "type": "checkbox", "id": "show_store_info", "default": true },
    { "type": "text", "id": "store_info_heading", "default": "Our store" },
    { "type": "text", "id": "support_label", "default": "24/7 support center:" },
    { "type": "text", "id": "phone_number" },
    { "type": "textarea", "id": "address" },
    { "type": "text", "id": "email_address" },
    { "type": "header", "content": "t:sections.footer.headers.bottom" },
    { "type": "checkbox", "id": "show_policy_links", "default": true },
    { "type": "text", "id": "copyright_note" },
    { "type": "checkbox", "id": "show_payment_icons", "default": true },
    { "type": "checkbox", "id": "link_columns_accordion_mobile", "default": true }
  ],
  "blocks": [
    {
      "type": "link_column",
      "name": "t:sections.footer.blocks.link_column.name",
      "settings": [
        { "type": "link_list", "id": "menu" },
        { "type": "text", "id": "column_heading_override" }
      ]
    }
  ]
}
```

---

## Implementation notes

- **Global placement:** Footer lives in **`footer-group.json`**, included once from `layout/theme.liquid`. Merchants edit it under **Theme settings → Footer** (section group), not per template.
- **Newsletter:** Default path = Shopify `customer` form with `customer[tags]=newsletter` (see `sections/header-top-bar.liquid` subscribe form). Optional `newsletter_esp_form_id` for Klaviyo/app blocks is **out of scope for v1** unless product requires it — document as future enhancement or app embed.
- **Link columns:** **`link_column` blocks** (max 2). Preset in `footer-group.json` seeds two columns.
- **Payment icons:** Always **`shop.enabled_payment_types`** — do not ship a static multi-select icon list.
- **Copyright:** Keep **`powered_by_link`** for Theme Store compliance. Year via `{{ 'now' | date: '%Y' }}`.
- **Back-to-top:** Controlled by **Theme settings → Layout → Show back-to-top button** (`settings.show_back_to_top`). Show after scroll threshold (~400px); `window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })`; kill listeners in section `destroy()` when using registry.
- **Editor lifecycle:** If JS is registered, handle `shopify:section:load` / `unload` via section registry like other interactive sections.
- **Verification:** `npm run check` + `npm run build` after changes; test keyboard accordion + back-to-top + newsletter POST in theme editor and storefront.
