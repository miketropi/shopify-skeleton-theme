# Instagram Feed

> **Status:** **Implemented** — `sections/section-instagram-feed.liquid`, `snippets/instagram-feed-*.liquid`, `_section-instagram-feed.scss`, `section-instagram-feed.ts` + runtime.

> A **manually curated** image/video gallery styled like an Instagram feed. Supports **grid** and **carousel** display modes. Clicking a card opens a **lightbox-style modal** with full media and caption — no live Instagram API.

![Instagram Feed reference mock](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Instagram%20Feed.jpg)

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = curated social-style feed + optional profile CTA + per-item lightbox. No mixed product cards, hero slides, or auto-fetched Instagram API. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: `section-instagram-feed.liquid`. Block type: `feed_item`. BEM root: `instagram-feed`. Interactive: `data-section-type="section-instagram-feed"`. SCSS: `src/styles/sections/_section-instagram-feed.scss` (or `instagram-feed/` partials if large). TS: `section-instagram-feed.ts` + `section-instagram-feed.runtime.ts`. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | `{% render 'section-styles', section: section %}` + `shopify-section-wrapper` on the section root. **Do not** use standalone `section_padding_top` / `section_padding_bottom` only — merge **section-styles** from `snippets/section-styles.liquid` (padding four sides, margin, background, border, radii). See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Intro (product-slider family)** | Section **eyebrow + heading + heading_size** use shared **`section-intro__*`** classes and root modifier **`section-intro--heading-{{ heading_size }}`**. See `.cursor/rules/liquid-patterns.mdc` → *Product-slider family*. Optional **`instagram_url`** may wrap the heading (and follow button) as links. |
| **Colour** | **`section_color_scheme_mode`** + **`color_scheme`** + `color-scheme-vars` on the section root for band, intro copy, and modal chrome defaults. See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Typography** | Intro + captions use `var(--font-size-*, …)` and `--cs-font-*` tokens. See `.cursor/rules/scss-styles.mdc`. |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Prefer `mq-up('md')` / `mq-up('lg')` over 767px / 1024px literals. |
| **JS-driven UI** | **Carousel:** Swiper + loading → optional **GSAP reveal** (`entrance_animate_on_scroll`, default on), `prefers-reduced-motion`, `destroy()` cleanup — same patterns as **Promo cards** / **Trust bar**; reuse `src/scripts/lib/carousel-section-entrance.ts`. **Grid load-more:** progressive reveal in DOM (no extra fetch). **Lightbox:** focus trap, `Esc`, prev/next, focus return — evaluate **`ThemeModal`** (`docs/theme-modal.md`) + section markup vs extending **`createImageLightbox`** (`src/scripts/image-lightbox.ts`); side-by-side caption layout likely needs a **section-specific modal** (PIS lightbox is image-centric). |
| **Locales** | Schema `name` / `label` / `info` → **`t:sections.instagram_feed.*`**; storefront strings (modal labels, empty state, carousel a11y) in `locales/en.default.json`; schema strings in `locales/en.default.schema.json`. |
| **Schema constraints** | Use `checkbox` (not `toggle`), `image_picker` (not `image`), `range` (not bare `number`) where applicable. Text settings that require defaults use **non-empty `default`** values (no `"default": ""` on required text fields). Optional intro fields (`eyebrow_text`, `heading`) may be blank — hide UI when empty. |
| **Theme Check** | `npm run check` after Liquid; `npm run build` after TS/SCSS. |

**Not the same section as** Product images story (`section-product-images-story` — product-bound slideshow + image lightbox), Feature grid (icon/image + text blocks + links), Promo cards (editorial solid cards), Scrolling promotion (marquee).

---

## Layout (target UX)

| Region | Content |
| --- | --- |
| **Intro row** | Optional eyebrow, heading (often `@handle`), optional **Follow on Instagram** button when `show_follow_button`. |
| **Feed track** | Repeating **`feed_item`** blocks as square/portrait/landscape cards; optional Instagram icon on hover. |
| **Load more** | Grid only: reveal hidden rows when `grid_max_rows` caps visible count. |
| **Lightbox** | One modal instance per section; populated on card click — media panel + caption panel + optional **View on Instagram** link. |

---

## Section settings (functional spec)

### Intro

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_text` | text | _(empty)_ | Small label above heading, e.g. *Follow us on Instagram*. Hide when blank. |
| `heading` | text | _(empty)_ | Section heading, often the handle. Hide when blank. |
| `heading_size` | select | `large` | `small` \| `medium` \| `large` \| `xlarge` — product-slider / `section-intro` scale. |
| `instagram_url` | url | _(empty)_ | Profile URL; applied to heading link and follow button when set. |
| `show_follow_button` | checkbox | `false` | Show follow CTA below intro. |
| `follow_button_label` | text | `Follow on Instagram` | Button label when follow CTA is on. |

### Display mode

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `display_mode` | select | `grid` | `grid` — fixed columns, wrapping. `carousel` — horizontal Swiper track. |

**Grid** _(when `display_mode` is `grid`)_

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `grid_columns` | select | `4` | Desktop columns: `2`–`5`. Tablet max **3**; mobile **2**. |
| `grid_gap` | select | `small` | `none` / `small` (8px) / `medium` (16px) / `large` (24px) → CSS var on root. |
| `grid_max_rows` | range | `1` | Max rows before truncation; **`0` = show all**. Min 0, max 6. |
| `show_load_more` | checkbox | `false` | Show load-more when rows are truncated and hidden items exist. |
| `load_more_label` | text | `Load more` | Load-more button label. |

**Carousel** _(when `display_mode` is `carousel`)_

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `carousel_columns` | select | `4` | Visible slides at `lg+`: `2`–`6`. Tablet **2**; mobile **~1.2 peek**. |
| `carousel_gap` | select | `small` | Same gap scale as grid. |
| `show_navigation_arrows` | checkbox | `true` | Prev/next; hide below `md` (swipe). Requires more than one item. |
| `autoplay` | checkbox | `false` | Auto-advance carousel. **Off** when `prefers-reduced-motion`. |
| `autoplay_speed` | range | `4` | Seconds per slide when autoplay on. Min 2, max 10. |

### Card style & animation

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `image_ratio` | select | `square` | `square` (1:1), `portrait` (4:5), `landscape` (4:3) — CSS `aspect-ratio` on cards. |
| `card_border_radius` | select | `medium` | `none` / `small` (8px) / `medium` (16px) / `large` (24px). |
| `show_instagram_icon` | checkbox | `true` | Instagram glyph overlay on card hover (`@media (hover: hover)`). |
| `full_width` | checkbox | `false` | Full-bleed background; inner uses `section-content-width` when on. |
| `entrance_animate_on_scroll` | checkbox | `true` | GSAP stagger reveal for cards after intersect vs on ready. |

### Colour & shell

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `section_color_scheme_mode` | select | `default` | `default` \| `custom`. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. |
| *(shell)* | — | — | `padding_*`, `margin_*`, `background_color`, `border_*`, corner radii from **`section-styles`**. |

**Removed from original spec (use shell instead):** standalone `section_padding_top` / `section_padding_bottom` — spacing comes from **section-styles**.

**Out of scope unless spec changes:** live Instagram oEmbed/API, post timestamps (no block field in v1 — do not show placeholder dates), favourite/like counts.

---

## Feed item block (`feed_item`)

Each block is one card. Click opens the lightbox at that item’s index.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `media_type` | select | `image` | `image` \| `video`. |
| `image` | image_picker | — | Card + lightbox poster. Recommend ≥ 800×800 for square. |
| `video` | video | — | Shopify-hosted video when `media_type` is `video`. **Card:** muted, looped, no controls. **Modal:** controls + unmute. |
| `description` | textarea | _(empty)_ | Caption in lightbox; supports line breaks (`| newline_to_br` or equivalent). Hide panel region when blank. |
| `view_more_url` | url | _(empty)_ | External post URL; hide link when blank. |
| `view_more_label` | text | `View on Instagram` | Modal link label. |

**Blocks:** `max_blocks: 20`.

---

## Lightbox modal (target UX)

Triggered by card click. Closes on backdrop, close control, or `Esc`. **Prev/next** cycles block order (wraps).

| Element | Description |
| --- | --- |
| **Media panel** | Full-size image or video — left (desktop) / top (mobile). |
| **Caption panel** | Handle/heading (from section intro when set), description, **View on Instagram** when `view_more_url` set. |
| **Close** | Top-right; `data-theme-modal-close` if using `ThemeModal`. |
| **Prev / Next** | Navigate without closing. |
| **Backdrop** | Dimmed overlay; click closes. |

**Implementation hint:** Modal markup lives **once** in the section (or snippet `instagram-feed-lightbox.liquid`); runtime passes block index and reads caption/media from `data-*` attributes or a JSON blob on the section root. Trap focus; return focus to triggering card on close.

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Replace legacy 767px / 1024px with theme tokens.

| Concern | `< md` (&lt; 48em) | `md` – `lg` (48–61.99em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| **Grid columns** | 2 | min(configured, 3) | as configured (2–5) |
| **Carousel slides** | ~1.2 peek | 2 | configured (2–6) |
| **Nav arrows** | Hidden (swipe) | Visible when enabled | Visible when enabled |
| **Modal layout** | Stacked (media → caption) | Side-by-side or stacked per design | Media \| caption |
| **Card hover** | N/A (no hover-only info) | Instagram icon overlay when `(hover: hover)` | Same |

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **Intro** | One `<h2 class="section-intro__heading">` when heading set; eyebrow is `<p>`, not a heading. |
| **Feed list** | `<ul>` / `<li>` per card; card trigger is `<button type="button">` (opens modal) — not nested links. |
| **Carousel** | `role="region"`, translated prev/next labels (Promo cards pattern); Swiper `Keyboard` module. |
| **Modal** | `role="dialog"`, `aria-modal="true"`, labelled by caption/heading; focus trap; `Esc` closes; focus returns to trigger. |
| **Video** | Card video `muted` + `playsinline`; modal exposes controls; respect reduced motion (prefer static poster if motion reduced — agent choice). |
| **Reduced motion** | Skip/disable carousel autoplay; shorten or skip GSAP entrance; minimal modal transitions. |
| **No-JS** | Grid: cards visible; lightbox and carousel require JS — acceptable for JS-primary UI per theme rules. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-instagram-feed.liquid` |
| Snippets | `snippets/instagram-feed-card.liquid`, `snippets/instagram-feed-items.liquid`, optional `snippets/instagram-feed-lightbox.liquid`, optional `snippets/instagram-feed-icon.liquid` |
| Styles | `src/styles/sections/_section-instagram-feed.scss` |
| Scripts | `src/scripts/sections/section-instagram-feed.ts`, `section-instagram-feed.runtime.ts` |
| Shared | `src/scripts/lib/carousel-section-entrance.ts`, `src/scripts/theme-modal.ts` or `src/scripts/image-lightbox.ts` (evaluate) |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.instagram_feed` in `en.default.schema.json` + `en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.instagram_feed.*`**, merge **section-styles**, `visible_if` for mode-specific groups, and non-empty text defaults. Structural hint only:

```json
{
  "name": "t:sections.instagram_feed.name",
  "tag": "section",
  "class": "section-instagram-feed",
  "max_blocks": 20,
  "settings": [
    { "type": "header", "content": "t:sections.instagram_feed.headers.intro" },
    { "type": "text", "id": "eyebrow_text" },
    { "type": "text", "id": "heading" },
    { "type": "select", "id": "heading_size", "default": "large" },
    { "type": "url", "id": "instagram_url" },
    { "type": "checkbox", "id": "show_follow_button", "default": false },
    { "type": "text", "id": "follow_button_label", "default": "Follow on Instagram" },
    { "type": "header", "content": "t:sections.instagram_feed.headers.display" },
    { "type": "select", "id": "display_mode", "default": "grid" },
    { "type": "select", "id": "grid_columns", "default": "4", "visible_if": "{{ section.settings.display_mode == 'grid' }}" },
    { "type": "range", "id": "grid_max_rows", "min": 0, "max": 6, "default": 1 },
    { "type": "checkbox", "id": "show_navigation_arrows", "default": true, "visible_if": "{{ section.settings.display_mode == 'carousel' }}" },
    { "type": "checkbox", "id": "entrance_animate_on_scroll", "default": true },
    { "type": "header", "content": "t:sections.instagram_feed.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "default": "scheme-6" }
  ],
  "blocks": [
    {
      "type": "feed_item",
      "name": "t:sections.instagram_feed.blocks.feed_item.name",
      "settings": [
        { "type": "select", "id": "media_type", "default": "image" },
        { "type": "image_picker", "id": "image" },
        { "type": "video", "id": "video" },
        { "type": "textarea", "id": "description" },
        { "type": "url", "id": "view_more_url" },
        { "type": "text", "id": "view_more_label", "default": "View on Instagram" }
      ]
    }
  ],
  "presets": [{ "name": "t:sections.instagram_feed.presets.name" }]
}
```

> Merge **section-styles** settings after colour headers — same order as `section-promo-cards.liquid` / `section-trust-bar.liquid`.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/SECTION_REGISTRY.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `docs/sections/Promo_Cards.md`, `docs/theme-modal.md`.
2. Liquid: `section-styles` + `shopify-section-wrapper`; `instagram-feed` root; `section-intro--heading-*`; `data-section-type` / `data-section-id`; `data-instagram-feed-*` for mode, entrance, lightbox labels.
3. Snippets: card (image/video), item loop, modal shell; Instagram hover icon SVG.
4. SCSS: mobile-first; `mq-up('md')` / `mq-up('lg')`; aspect-ratio cards; gap CSS vars; modal split layout.
5. TS: `registerSection('section-instagram-feed', …)`; runtime — Swiper (carousel), load-more (grid), modal open/nav/close with teardown; optional GSAP reveal via `carousel-section-entrance`.
6. Locales: `sections.instagram_feed` in schema + storefront JSON.
7. `npm run check` + `npm run build`.

---

## Implementation notes

- **No Instagram API** — all content is manual blocks; section is presentational only.
- **Lightbox vs PIS:** Product images story uses `createImageLightbox` for **images + caption below**. Instagram feed needs **side-by-side** layout and **video with audio in modal** — prefer **`ThemeModal`** + custom panel markup unless `image-lightbox` is extended deliberately.
- **Grid load more:** render all blocks; hide overflow with a class; reveal next row batch on button click — no network request.
- **Modal navigation:** prev/next index wraps; update media + caption in place; pause card videos when modal opens.
- **Card video:** ambient loop in grid (like routine guide / promo cards); do not autoplay off-screen batches without intersection guard.
- **Editor:** `window.Shopify.designMode` — shorten entrance waits; modal should still open in preview.
- **Empty state:** message when no `feed_item` blocks; hide feed track.
