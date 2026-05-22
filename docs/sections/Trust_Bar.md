# Trust Bar

> **Status:** **Implemented** — `sections/section-trust-bar.liquid`, `snippets/trust-bar-*.liquid`, `_section-trust-bar.scss`, `section-trust-bar.ts` + runtime.

> A horizontal band of **icon + heading + description** items highlighting store policies or benefits (returns, shipping, support, etc.). Typically placed between content sections as a full-width strip.

![Trust Bar section example mock](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Trust%20Bar.jpg)

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = trust / policy highlights only. No mixed product cards, hero slides, or FAQ blocks. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: `section-trust-bar.liquid`. Block type: `trust_item`. BEM root: `trust-bar`. Interactive (carousel): `data-section-type="section-trust-bar"`. SCSS: `src/styles/sections/_section-trust-bar.scss`. TS: `section-trust-bar.ts` + `section-trust-bar.runtime.ts` when Swiper is used. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | `{% render 'section-styles', section: section %}` + `shopify-section-wrapper` on the section root. **Do not** use standalone `section_padding_top` / `section_padding_bottom` only — merge **section-styles** from `snippets/section-styles.liquid` (padding four sides, margin, background, border, radii). See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | **`section_color_scheme_mode`** + **`color_scheme`** + `color-scheme-vars` for the section band and default heading/body text. Optional **`icon_color`** (and legacy **`text_color`** only if design needs a fixed override outside the scheme) as CSS variables on the section root — prefer scheme tokens first. See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Typography** | Item **heading** / **description** use `var(--font-size-*, …)` tokens and theme fonts (`--cs-font-heading` / `--cs-font-body`). Merchant overrides: **heading/description size** and **colours** (clear = scheme). See `.cursor/rules/scss-styles.mdc`. |
| **Icons** | Predefined icons via **`snippets/trust-bar-icon.liquid`** (inline SVG, `currentColor` for `icon_color`). **`custom_icon`** (`image_picker`) overrides library icon when set — render as `<img>` with fixed dimensions + `alt=""` if decorative (heading carries label). **`icon_color`** and **`icon_size`** optional — clear/`theme` uses scheme tokens and responsive defaults. Reuse **stroke SVG style** from `snippets/promo-cards-icon.liquid` where icons overlap (`heart`, `leaf`, `star`, …); add trust-specific glyphs (return, shipping, shield, …) in the new snippet. |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Prefer `mq-up('md')` / `mq-up('lg')` over 767px / 1024px literals. |
| **JS-driven UI** | **Grid mode:** CSS grid at `md+`; **carousel track** below `md` (or when `layout` is `carousel`) via **Swiper** — same patterns as **Promo cards** / **Product slider**: loading state → optional **GSAP reveal** (`entrance_animate_on_scroll`, default on), `prefers-reduced-motion`, `destroy()` cleanup. Reuse helpers from `src/scripts/lib/carousel-section-entrance.ts` where applicable. **Pure grid-only** (no Swiper) is acceptable only if `< md` uses native scroll without JS — document chosen approach in Liquid. |
| **Locales** | Schema `name` / `label` / `info` → **`t:sections.trust_bar.*`**; storefront strings in `locales/en.default.json`; schema strings in `locales/en.default.schema.json`. |
| **Schema constraints** | Text settings that require defaults use **non-empty `default`** values (no `"default": ""`). Use `image_picker` (not `image`), `checkbox` (not `toggle`). |
| **Theme Check** | `npm run check` after Liquid; `npm run build` after TS/SCSS. |

**Not the same section as** Feature grid (`section-feature-grid` — section heading + image blocks + links), Promo cards (editorial cards with CTA), or Scrolling promotion (marquee text/logos).

---

## Layout (target UX)

| Region | Content |
| --- | --- |
| **Item row** | Repeating **trust_item** blocks: icon → heading → description. |
| **Dividers** | Optional vertical rules between items (desktop single-row grid only). |

**No section intro row** — copy lives entirely on blocks.

---

## Section settings (functional spec)

### Layout & appearance

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `layout` | select | `grid` | `grid` — CSS grid at `md+`; Swiper peek carousel below `md` (see Responsive). `carousel` — Swiper track at all breakpoints (like Promo cards carousel). |
| `show_dividers` | checkbox | `true` | Vertical dividers between items in **single-row desktop grid** only. Hidden when wrapping or in carousel mode. |
| `text_alignment` | select | `center` | `left` \| `center` — applies to icon + text stack within each item. |
| `item_heading_size` | select | `small` | `small` \| `medium` \| `large` — theme `--font-size-*` scale. |
| `item_description_size` | select | `small` | `small` \| `medium` — theme type scale. |
| `icon_size` | select | `theme` | `theme` (responsive 32→40px) \| `small` \| `medium` \| `large`. |
| `heading_color` | color | clear | Override item heading colour; clear uses scheme `--cs-heading`. |
| `description_color` | color | clear | Override description colour; clear uses `--cs-text-secondary`. |
| `icon_color` | color | clear | Icon tint; clear uses scheme heading colour via `currentColor`. |
| `full_width` | checkbox | `false` | Full-bleed background; inner uses `section-content-width` when on. |
| `entrance_animate_on_scroll` | checkbox | `true` | GSAP reveal after intersect vs on ready (carousel/grid items). |

### Colour & shell

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `section_color_scheme_mode` | select | `default` | `default` \| `custom`. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. |
| *(shell)* | — | — | `padding_*`, `margin_*`, `background_color`, `border_*`, corner radii from **`section-styles`**. |

**Removed from original spec (use shell instead):** standalone `section_padding_top` / `section_padding_bottom`, standalone `background_color` / `text_color` only — band background comes from **section-styles** `background_color`; body/heading color from **color scheme** unless a future override setting is added intentionally.

---

## Trust item block (`trust_item`)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | select | `none` | Predefined icon: `none`, `return`, `shipping`, `support`, `member`, `leaf`, `shield`, `heart`, `gift`, `lock`, `star`. |
| `custom_icon` | image_picker | — | Custom SVG/PNG; overrides `icon` when set. ~40×40px recommended. |
| `heading` | text | `Free Shipping` | Item title; hide line when blank. |
| `description` | text | `On orders over $50.` | Supporting line; hide when blank. |
| `link` | url | — | Optional destination URL. When set, item is clickable and shows an arrow below the text. |
| `open_in_new_tab` | checkbox | `false` | Open link in a new tab. |

**Blocks:** `max_blocks: 6` (4 is a common preset count).

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Replace legacy 767px / 1024px with theme tokens.

| Concern | `< md` (&lt; 48em) | `md` – `lg` (48–61.99em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| **layout: grid** | Swiper carousel, ~1.2–1.5 slides visible (peek) | 2-column CSS grid | 1 column per block (up to 6), single row when count allows |
| **layout: carousel** | Swiper peek / track | Swiper (e.g. 2 slides) | Swiper or wider peek — match Promo cards `slidesPerView` patterns |
| **Dividers** | Hidden | Hidden | Visible when `show_dividers` and items sit in one row |
| **Text alignment** | As configured (often `center` on small screens) | As configured | As configured |
| **Icon size** | ~32px | ~36px | ~40px (CSS vars e.g. `--trust-bar-icon-size`) |

> **Mobile (`layout: grid`):** Carousel below `md` signals horizontal scroll; dividers off. **Desktop:** equal-width columns in one row when block count ≤ 6.

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **List semantics** | `<ul>` / `<ol>` with `<li>` per item; heading level consistent (e.g. `<p>` or `<h3>` per item if no section `<h2>`). |
| **Icons** | Decorative predefined SVGs: `aria-hidden="true"`. Custom images: empty `alt` if heading duplicates meaning. |
| **Carousel** | Swiper container: `role="region"`, `aria-roledescription`, prev/next buttons with translated labels (Promo cards / Product slider pattern). Keyboard: Swiper `Keyboard` module. |
| **Reduced motion** | Shorten or skip GSAP entrance; avoid autoplay (N/A). |
| **No-JS** | Grid mode: items stack or scroll horizontally with CSS; readable without Swiper init. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-trust-bar.liquid` |
| Snippets | `snippets/trust-bar-icon.liquid`, optional `snippets/trust-bar-items.liquid` |
| Styles | `src/styles/sections/_section-trust-bar.scss` |
| Scripts | `src/scripts/sections/section-trust-bar.ts`, `section-trust-bar.runtime.ts` |
| Shared | `src/scripts/lib/carousel-section-entrance.ts` (reveal helpers) |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.trust_bar` in `en.default.schema.json` + `en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.trust_bar.*`**, merge **section-styles**, and follow non-empty text defaults. Structural hint only:

```json
{
  "name": "t:sections.trust_bar.name",
  "tag": "section",
  "class": "section-trust-bar",
  "max_blocks": 6,
  "settings": [
    { "type": "header", "content": "t:sections.trust_bar.headers.layout" },
    { "type": "select", "id": "layout", "default": "grid" },
    { "type": "checkbox", "id": "show_dividers", "default": true },
    { "type": "select", "id": "text_alignment", "default": "center" },
    { "type": "color", "id": "icon_color", "default": "#1A1A1A" },
    { "type": "checkbox", "id": "full_width", "default": false },
    { "type": "checkbox", "id": "entrance_animate_on_scroll", "default": true },
    { "type": "header", "content": "t:sections.trust_bar.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "default": "scheme-6" }
  ],
  "blocks": [
    {
      "type": "trust_item",
      "name": "t:sections.trust_bar.blocks.trust_item.name",
      "settings": [
        { "type": "select", "id": "icon", "default": "shipping" },
        { "type": "image_picker", "id": "custom_icon" },
        { "type": "text", "id": "heading", "default": "Free Shipping" },
        { "type": "text", "id": "description", "default": "On orders over $50." }
      ]
    }
  ],
  "presets": [{
    "name": "t:sections.trust_bar.presets.name",
    "blocks": [
      { "type": "trust_item", "settings": { "icon": "return", "heading": "14-Day Returns", "description": "Risk-free shopping with easy returns." } },
      { "type": "trust_item", "settings": { "icon": "shipping", "heading": "Free Shipping", "description": "Complimentary delivery on qualifying orders." } },
      { "type": "trust_item", "settings": { "icon": "support", "heading": "Expert Support", "description": "We're here to help you choose the right routine." } },
      { "type": "trust_item", "settings": { "icon": "shield", "heading": "Secure Checkout", "description": "Your payment information is always protected." } }
    ]
  }]
}
```

> Merge **section-styles** settings (padding, margin, background, border, radii) after colour headers — same order as `section-promo-cards.liquid` / `section-routine-guide.liquid`.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/SECTION_REGISTRY.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `docs/sections/Promo_Cards.md` (carousel + entrance).
2. Liquid: `section-styles` + `shopify-section-wrapper`; `trust-bar` root; `data-section-type` / `data-section-id`; `data-trust-bar-*` for layout, entrance flag.
3. Snippets: `trust-bar-icon` SVG set; item partial with icon + heading + description.
4. SCSS: mobile-first; `mq-up('md')` / `mq-up('lg')`; CSS grid + divider rules; icon size CSS vars; `--trust-bar-icon-color`.
5. TS: `registerSection('section-trust-bar', …)` when Swiper required; runtime init/destroy Swiper + optional GSAP reveal; `shopify:section:load/unload` via registry.
6. Locales: `sections.trust_bar` in schema + storefront JSON.
7. `npm run check` + `npm run build`.

---

## Implementation notes

- **Icons:** Inline SVGs use `stroke="currentColor"` (Promo cards style) so `icon_color` applies via CSS `color` on `.trust-bar__icon`.
- **Custom icon:** `<img>` with explicit `width` / `height`; lazy-load unless first visible slide/item.
- **Dividers:** `border-inline-end` on items except last in a single-row `lg` grid; class modifier `trust-bar--dividers` when `show_dividers`.
- **Carousel:** Mirror Promo cards — `data-trust-bar-layout`, loading shell, Swiper `slidesPerView: 'auto'` or fractional peek on mobile, navigation optional.
- **Editor:** `window.Shopify.designMode` — shorten entrance delays per *JS-driven UI* rules.
- **Empty state:** Hide section or show schema preset blocks only; no orphan strip when all blocks removed.
