# Home Slider

**Status:** implemented as **`section-home-slider`**. This is **not** the full-bleed split-layout **Hero slider** (`section-hero-slider`).

| Piece | Location |
| --- | --- |
| Liquid | `sections/section-home-slider.liquid` |
| Styles | `src/styles/sections/_section-home-slider.scss` |
| Script | `src/scripts/sections/section-home-slider.ts` + `section-home-slider.runtime.ts` |
| Section type | `data-section-type="section-home-slider"` |
| Schema labels | `locales/en.default.schema.json` → `sections.home_slider` |
| Storefront strings | `locales/en.default.json` → `home_slider` |

---

## Behaviour

- **Promotional strip:** image slides with copy over the image; optional tint (full slide or text-area gradient).
- **Layout:** **Full width** (edge-to-edge): section spans the viewport; each slide’s **frame** (image + copy) uses **`var(--content-width)`**. With **Centered slides**, the Swiper **slide** width is also **`var(--content-width)`** so neighbours peek at the sides. **Full width off:** section uses the theme’s default content column only (`width: 100%` inside it — no extra viewport `max-width`, so width matches other sections). **Copy position** is set **per slide** in the slide block.
- **Centered “peek” carousel:** optional mode uses **`slidesPerView: 'auto'`** + **`centeredSlides`** so neighbours show at the sides (**fade** is disabled in JS while this is on). Each slide’s width is **`var(--content-width)`** (same as the global page content column from theme / `critical.css`).
- **Height:** section setting **Minimum height** — either fixed **px** or **vh** (viewport).
- **Carousel:** [Swiper](https://swiperjs.com/) with **slide** or **fade** transition; optional **arrows** and **pagination**; **autoplay** with delay; disabled / instant when `prefers-reduced-motion: reduce`.
- **Slides:** image, optional **mobile image** (`<picture>` below 768px), focal position, overlay, **`content_position`**, kicker / heading / body / primary + secondary CTAs, **primary button style** (accent / outline / ghost).
- **Colour:** section-level **`color_scheme`** + `color-scheme-vars` (`--cs-*` on the section root).
- **Progressive enhancement:** without JS, only the **first** slide is shown (see SCSS `html:not(.js)`).

---

## Section settings (implemented)

| Setting | Notes |
| --- | --- |
| `color_scheme` | Theme colour scheme for typography / surfaces. |
| `full_width` | **On:** spans grid full bleed; slide **frame** uses `var(--content-width)` (unless centered-slides). **Off:** section uses default grid column (same width as other sections); viewport is `width: 100%` only — no second `max-width` so it doesn’t end up narrower than peers. |
| `slide_centered_auto` | Centred slide with side peek; forces slide effect (not fade). |
| `min_height_mode` | `px` or `vh`. |
| `min_height_px` / `min_height_vh` | Visible per mode. |
| `slide_effect` | `slide` or `fade`. |
| `show_arrows` / `show_pagination` | Hide chrome when off (swipe / keyboard still work when multi-slide). |
| `initial_slide_index` | 1–8 (first slide = **1**). Clamped to real slide count. With JS off, first slide still shows. |
| `autoplay` / `autoplay_delay` | Same pattern as hero (delay in seconds in schema, ms in `data-home-autoplay-delay`). |

---

## Slide block

Up to **8** `slide` blocks: media, overlay, **`content_position`** (copy corner), kicker / heading / body / CTAs — see Liquid `{% schema %}` and `sections.home_slider.blocks.slide` in the locale file.

---

## Homepage template

`templates/index.json` includes a **`home_slider`** section instance between **hero** and **feature_grid** (auto-generated file; editor may rewrite).

---

## Maintenance

After TS/SCSS edits: `npm run build`. After Liquid edits: `npm run check`.
