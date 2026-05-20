# Promo Cards

> **Status:** **Implemented.** `sections/section-promo-cards.liquid`, snippets `promo-cards-card`, `promo-cards-block-items`, `promo-cards-icon`; styles `src/styles/sections/promo-cards/`; JS `section-promo-cards` + `section-promo-cards.runtime.ts` with `src/scripts/lib/carousel-section-entrance.ts`.

> A grid or carousel of **editorial cards**. Each card uses a **solid background colour**, a top **eyebrow** row (label + optional icon), **heading**, an **inset image** in the middle, and a bottom **“View more”** CTA row (label + circular arrow). No full-bleed image overlay or hover image takeover — the image sits inside the coloured card.

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = promo editorial cards only. No mixed hero or product grid blocks. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: `section-promo-cards.liquid`. Block type: `promo_card`. BEM root: `promo-cards`. Interactive: `data-section-type="section-promo-cards"`. SCSS: `src/styles/sections/promo-cards/` partials (or `_section-promo-cards.scss` entry). TS: `section-promo-cards.ts` + lazy `section-promo-cards.runtime.ts`. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | Use `{% render 'section-styles', section: section %}` + `shopify-section-wrapper` on the section root. **Do not** add standalone `section_padding_top` / `section_padding_bottom` only — merge the **section-styles** settings block from `snippets/section-styles.liquid` (padding, margin, background, border, radii) and localize with `t:` keys. See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | **Per-card** `card_background_color` + `card_text_color` are intentional (editorial tints). Optional **section** colour scheme (`section_color_scheme_mode` + `color_scheme` + `color-scheme-vars`) only for the **outer band** / defaults where needed — not as a replacement for per-card fills. See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Typography (partial product-slider family)** | Card **eyebrow** and **heading** should use shared classes **`product-slider__eyebrow`** and **`product-slider__heading`** so scale and weight stay consistent. Section root: **`product-slider--heading-{{ section.settings.card_heading_size }}`** for the default heading step (`small` \| `medium` \| `large` \| `xlarge` only). Per-block **`heading_size`** may override via a block modifier (extend selectors in `_section-product-slider.scss` — do not fork font-size rules into a new partial). This section has **no** section-level intro row (`eyebrow_text` / `heading` on the section) — copy lives on each **block**. |
| **CTA** | **Not** Collection slide intro pills (`coll-slide__btn`) — bottom row is section-specific (`promo-cards__cta`, text + icon button). Reuse **scheme button tokens** only if a future variant adds primary/outline buttons. |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: `sm` 36em, **`md` 48em (768px)**, **`lg` 62em (992px)**, `xl` 75em. Prefer `mq-up('md')` / `mq-up('lg')` over 1024px / 767px literals. |
| **Typography tokens** | Body/eyebrow sizes via `var(--font-size-*, …)` from `snippets/css-variables.liquid`. See `.cursor/rules/scss-styles.mdc`. |
| **JS-driven UI** | Carousel/grid with Swiper when `layout` is carousel: **loading → GSAP reveal**, optional **scroll-into-view** (`entrance_animate_on_scroll` checkbox, default on), `prefers-reduced-motion`, `destroy()` cleanup. See `.cursor/rules/liquid-patterns.mdc` → *JS-driven UI* and `docs/SECTION_REGISTRY.md`. |
| **Locales** | Schema `name` / `label` / `info` use **`t:sections.promo_cards.*`**; storefront strings in `locales/en.default.json`; schema strings in `locales/en.default.schema.json`. |
| **Schema constraints** | Text settings need **non-empty `default`** values where Shopify requires them (no `"default": ""` on text fields). |
| **Theme Check** | Run `npm run check` after Liquid; `npm run build` after TS/SCSS. |

**Not the same section as** `sections/scrolling-promotion.liquid` (text/logo marquee).

---

## Card layout (target UX)

Top to bottom inside each card (flex column):

1. **Eyebrow row** — `space-between`: uppercase label (left), optional icon (right).
2. **Heading** — main headline.
3. **Image** — inset, own corner radius; focal point from `image_position`.
4. **CTA row** — `space-between`: link label (left), circular arrow control (right).

**Interaction:** One primary navigation target per card (`cta_link`). Prefer a single **card-level** hit area (`promo-cards__hit` or wrapping link) with the CTA row styled as part of the card — **avoid nested interactive elements** (link inside link). Favourite/rating/overlay patterns from older promo designs are **out of scope** for this spec.

---

## Section settings (functional spec)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `layout` | select | `grid` | `grid` — responsive columns, no horizontal scroll. `carousel` — Swiper track. |
| `columns` | select | `3` | Desktop column count at `lg+`. Options: `2`, `3`, `4`. Cap at **2** on tablet, **1** on small screens in grid mode. |
| `card_gap` | select | `medium` | `none` / `small` (12px) / `medium` (20px) / `large` (32px). Expose as `--promo-cards-gap` on section root. |
| `card_border_radius` | select | `medium` | Outer card rounding: `none`, `small` (8px), `medium` (16px), `large` (24px). Maps to `--promo-card-radius`. |
| `card_heading_size` | select | `large` | Default block heading step when block uses “match section”. Values: `small` \| `medium` \| `large` \| `xlarge` (product-slider scale). |
| `show_navigation_arrows` | checkbox | `true` | Carousel only; hide below `md` (swipe). Requires more than one card. |
| `entrance_animate_on_scroll` | checkbox | `true` | When on, entrance runs after section intersects viewport; when off, reveal after ready without scroll gate. |
| `section_color_scheme_mode` | select | `default` | `default` \| `custom` — same pattern as Collection slide / product-slider family. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. |
| `full_width` | checkbox | `false` | Full-bleed background; inner content uses `section-content-width` when on. |
| `media_aspect_ratio` | select | `auto` | Inset media frame: `auto` (natural height), `square`, `portrait`, `landscape`, `wide`. CSS `--promo-media-aspect`. |
| `media_size` | select | `medium` | Max render width for images/video posters: `small` (600px), `medium` (1200px), `large` (1600px), `xlarge` (2400px). |
| *(shell)* | — | — | Padding, margin, background, border, corner radii from **`section-styles`** (merged into schema). |

**Out of scope (do not reintroduce unless spec changes):** idle/hover full-bleed media takeover, overlay opacity, detail/stat rows, per-card scheme colour pickers separate from `card_background_color` / `card_text_color`.

---

## Promo Card block (`promo_card`)

**Background**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `card_background_color` | color | `#F4F4F4` | Card fill. Examples: `#E8500A`, `#C9C3E8`, `#C8D5C0`. |
| `card_text_color` | color | `#1A1A1A` | Eyebrow, heading, and CTA label colour; must contrast with background. |

**Eyebrow**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_label` | text | `Category` | Uppercase tag (left). Maps to markup class `product-slider__eyebrow`. |
| `eyebrow_icon` | select | `none` | Top-right icon: `none`, `star`, `spark`, `arrow`, `heart`, `leaf` — inline SVG from theme icon set, no external dependency. |

**Heading**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `heading` | text | `Promo heading` | Main headline (`product-slider__heading`). |
| `heading_size` | select | `section` | `section` (use section `card_heading_size`) or `small` \| `medium` \| `large` \| `xlarge`. |

**Media**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `media_type` | select | `image` | `image` or `video`. |
| `image` | image_picker | — | Inset image, or optional **poster** when `media_type` is `video`. |
| `video` | video | — | Shopify-hosted video; muted autoplay loop when type is `video`. |
| `image_position` | select | `center center` | Focal point for image and video (`object-position`). |
| `image_border_radius` | select | `small` | **Inset** media corners only: `none`, `small` (8px), `medium` (12px). |

**CTA**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `cta_label` | text | `View More` | Bottom-left label. |
| `cta_link` | url | — | Destination; empty hides CTA row or disables navigation per implementation choice (document in Liquid). |
| `open_new_tab` | checkbox | `false` | `rel="noopener noreferrer"` when true. |

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Translate original pixel bands as follows:

| Concern | `< md` (&lt; 48em) | `md` – `lg` (48–61.99em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| **Grid** columns | 1 | min(configured, 2) | `columns` (2–4) |
| **Carousel** `slidesPerView` | ~1.15 (peek) | min(configured, 2) | `columns` |
| Navigation arrows | Hidden | Shown if carousel + setting | Shown if carousel + setting |
| Card gap | 12px (or `small` step) | 16–20px | As configured |
| Eyebrow + icon row | Visible | Visible | Visible |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-promo-cards.liquid` |
| Snippets | `snippets/promo-cards-card.liquid`, `snippets/promo-cards-block-items.liquid`, optional `snippets/promo-cards-media.liquid` / `snippets/promo-cards-icon.liquid` |
| Styles | `src/styles/sections/promo-cards/_tokens.scss`, `_layout.scss`, `_card.scss`, `_index.scss` + `@forward` via `_section-promo-cards.scss` |
| Scripts | `src/scripts/sections/section-promo-cards.ts`, `section-promo-cards.runtime.ts` |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.promo_cards.*`**, merge **section-styles** settings, and follow non-empty text defaults. Structural hint only:

```json
{
  "name": "t:sections.promo_cards.name",
  "tag": "section",
  "class": "section-promo-cards",
  "max_blocks": 8,
  "settings": [
    { "type": "select", "id": "layout", "default": "grid", "options": [
      { "value": "grid", "label": "…" },
      { "value": "carousel", "label": "…" }
    ]},
    { "type": "select", "id": "columns", "default": "3", "options": [
      { "value": "2", "label": "2" },
      { "value": "3", "label": "3" },
      { "value": "4", "label": "4" }
    ]},
    { "type": "select", "id": "card_gap", "default": "medium" },
    { "type": "select", "id": "card_border_radius", "default": "medium" },
    { "type": "select", "id": "card_heading_size", "default": "large" },
    { "type": "checkbox", "id": "show_navigation_arrows", "default": true },
    { "type": "checkbox", "id": "entrance_animate_on_scroll", "default": true },
    { "type": "select", "id": "section_color_scheme_mode", "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "default": "scheme-6" },
    { "type": "checkbox", "id": "full_width", "default": false }
  ],
  "blocks": [
    {
      "type": "promo_card",
      "name": "t:sections.promo_cards.blocks.promo_card.name",
      "settings": [
        { "type": "color", "id": "card_background_color", "default": "#F4F4F4" },
        { "type": "color", "id": "card_text_color", "default": "#1A1A1A" },
        { "type": "text", "id": "eyebrow_label", "default": "Category" },
        { "type": "select", "id": "eyebrow_icon", "default": "none" },
        { "type": "text", "id": "heading", "default": "Promo heading" },
        { "type": "select", "id": "heading_size", "default": "section" },
        { "type": "image_picker", "id": "image" },
        { "type": "select", "id": "image_position", "default": "center center" },
        { "type": "select", "id": "image_border_radius", "default": "small" },
        { "type": "text", "id": "cta_label", "default": "View More" },
        { "type": "url", "id": "cta_link" },
        { "type": "checkbox", "id": "open_new_tab", "default": false }
      ]
    }
  ],
  "presets": [{ "name": "t:sections.promo_cards.presets.name", "blocks": [{ "type": "promo_card" }, { "type": "promo_card" }] }]
}
```

> **Theme Store:** `max_blocks: 8` is acceptable for editorial grids; if submission guidance requires a lower cap, use `6` and document that merchants can add a second section instance.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/SECTION_REGISTRY.md`, `docs/COLOR_SCHEME_SYSTEM.md`.
2. Liquid: `section-styles` + `shopify-section-wrapper`; root `promo-cards` + `product-slider--heading-*`; `data-section-type` / `data-section-id`; `data-promo-cards-*` attrs for gap, columns, layout, entrance, arrows.
3. Snippets: card markup only in snippets; pass `block`, gap/radius from section via `render` params.
4. SCSS: mobile-first, section-prefixed classes; CSS variables on card root (`--promo-card-bg`, `--promo-card-text`, `--promo-card-radius`, inset image radius).
5. TS: `registerSection('section-promo-cards', …)`; lazy runtime with Swiper + `revealStaggeredSlides` from `carousel-section-entrance.ts`; full `destroy()` teardown.
6. Locales: `sections.promo_cards` in `en.default.schema.json` and `en.default.json`.
7. `npm run check` + `npm run build`.

---

## Implementation notes

- **Flex column** card: eyebrow row → heading → flex-growing image area → CTA row. Image uses `object-fit: cover` and `image_position`.
- **Icons:** `eyebrow_icon` renders predefined inline SVGs (snippet or Liquid `case`); decorative icons use `aria-hidden="true"`.
- **No overlay** on the image; background is the solid `card_background_color`.
- **Carousel** loading overlay only when `layout === 'carousel'` (optional for grid-only reveal).
- **Editor:** respect `Shopify.designMode` — shorten entrance waits per *JS-driven UI* rules.
- **Accessibility:** keyboard focus visible on card link/CTA; respect `prefers-reduced-motion` for GSAP and hover transitions.
