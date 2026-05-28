# Testimonials — Section Document

> **Status:** **Draft — Not Implemented.** This spec has been reviewed against project rules (`.cursor/rules/`, `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `docs/SECTION_REGISTRY.md`, `.cursor/skills/shopify-skeleton-theme/SKILL.md`) and updated accordingly. No Liquid, SCSS, TS, or template wiring exists yet.

> A centered carousel of customer review quotes. Each testimonial is a block with a quote, author name, role/label, and optional avatar. Designed for a clean, editorial full-width display. Uses Swiper for the carousel — matches the lazy-runtime pattern from `section-home-slider`.

> **Architectural note — justified section:** The testimonials are all instances of the same block type (`testimonial`) and share a single carousel container with coordinated transition, swipe, and autoplay state. The carousel rendering depends on Swiper's init and teardown, which must own the container DOM. The parts are tightly coupled — splitting individual testimonials into separate sections would break the carousel UX. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md` → *When a monolithic section is justified*.

---

![Section preview — Testimonials carousel](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Client-say.jpg)

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = **testimonials carousel**. Blocks are all type `testimonial` — instances of the same repeating component. No hero content, no product grids, no unrelated blocks. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: **`sections/section-testimonials.liquid`**. BEM root: **`testimonials`**. JS-driven: **`data-section-type="section-testimonials"`**. SCSS: **`src/styles/sections/_section-testimonials.scss`**. TS: **`src/scripts/sections/section-testimonials.ts`** + lazy **`section-testimonials.runtime.ts`** (Swiper bundle). Register in **`theme.ts`** before **`bootSections()`**. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | **`{% render 'section-styles', section: section %}`** + **`shopify-section-wrapper`** on the section root for merchant padding/margin/background/border. The original `section_padding_top`, `section_padding_bottom`, and `section_background_color` are **replaced** by the shared section-styles contract. See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | **`section_color_scheme_mode`** (`default` \| `custom`) + **`color_scheme`** + **`{% render 'color-scheme-vars', scheme: … %}`** on the section root. Per-element overrides (`quote_text_color`, `author_name_color`, `author_label_color`, `quote_icon_color`) use the **clear = scheme** override pattern (`rgba(0,0,0,0)` default) — not hard-coded hex like `#1A1A1A` / `#999999`. See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Product-slider family** | Section uses **`section-intro__eyebrow`** for the eyebrow label and **`section-intro__heading`** for any heading text (if a heading setting is exposed). Root gets **`section-intro--heading-{{ section.settings.heading_size }}`** for heading scale. Reuse `heading_size` values `small` \| `medium` \| `large` \| `xlarge` only. See `.cursor/rules/liquid-patterns.mdc` → *Product-slider family*. |
| **Typography** | Quote text size and author text size consume **`--font-size-*`** tokens from `snippets/css-variables.liquid` with fallbacks. **Not** arbitrary "Small / Medium / Large / Extra large" labels — the `quote_text_size` select maps to token keys (e.g. `sm` → `--font-size-lg`, `xl` → `--font-size-3xl`). See `.cursor/rules/scss-styles.mdc` → *Typography and font size*. |
| **Full width** | **`full_width`** checkbox (default **`false`**) — when on, inner content wrapper gets **`section-content-width`** (same contract as product slider / trust bar / promo cards). |
| **JS-driven UI** | **Swiper carousel** — follows the JS-driven UI pattern: **loading state** (opacity off while Swiper inits + images load), **soft GSAP reveal** after readiness, merchant **checkbox** for **scroll-into-view** / entrance animation (on by default). **`destroy()`** disconnects observer, kills GSAP tweens, destroys Swiper instance, aborts `AbortController`. See `.cursor/rules/liquid-patterns.mdc` → *JS-driven UI: loading, reveal, and scroll effects*. |
| **Slow connections / editor** | **`Shopify.designMode`**: skip scroll gate, shorten wait so merchant sees content. **`prefers-reduced-motion: reduce`**: skip decorative loader motion and use instant reveal; same in CSS `@media (prefers-reduced-motion: reduce)`. |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Prefer **`mq-up('md')` / `mq-up('lg')`** — **not** 767px / 1024px literals from the original draft. |
| **Schema constraints** | Use **`checkbox`** (not `toggle`), **`color_scheme`**, **`range`** with min/max/step. Reuse **section-styles** setting ids from `snippets/section-styles.liquid`. Include `"disabled_on": { "groups": ["header", "footer"] }`. |
| **Locales** | Schema → **`t:sections.testimonials.*`** in `locales/en.default.schema.json`. Storefront runtime strings in `locales/en.default.json`. |
| **Theme Check** | `npm run check` after Liquid/JSON changes; `npm run build` after TS/SCSS changes. |

**Not the same section as:**

| Existing | Difference |
| --- | --- |
| **`section-home-slider`** | Full-bleed image hero slider with overlaid text/CTA. Uses Swiper but is a hero band, not a centered text testimonial carousel. Different block type, different layout, different purpose. |
| **`section-product-slider`** | Product card carousel with `tcard-product` snippet. Different block type, different card markup, different design system. |

---

## Template placement (OS 2.0)

Testimonials is a **reusable `section-*`** band merchants can add/reorder in any JSON template. Typical use:

| Template | Suggested usage |
| --- | --- |
| **`index.json`** | Social proof band below hero/features on the homepage. |
| **`product.json`** | Below-the-fold social proof for product detail pages. |
| **`page.about.json`** | About page with customer stories. |
| **`collection.json`** | Trust builder above or below the product grid. |

No template-specific coupling — works anywhere.

---

## Section settings (functional spec)

### Header / Intro

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_quote_icon` | checkbox | `true` | Show a large decorative quotation mark icon above the eyebrow label. Uses an inline SVG or Liquid-rendered icon. |
| `quote_icon_color` | color | `rgba(0,0,0,0)` | Color of the decorative quote icon. Clear uses scheme `--cs-text`. |
| `eyebrow_text` | text | `"Customer Reviews"` | Small uppercase label below the quote icon. Rendered with `section-intro__eyebrow` class. |
| `heading` | text | _(empty)_ | Optional section heading below the eyebrow. Rendered with `section-intro__heading`. Leave empty to hide. |
| `heading_size` | select | `large` | Heading step: `small` \| `medium` \| `large` \| `xlarge`. Root gets `section-intro--heading-{{ value }}`. Matches product-slider family scale. |

### Carousel

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `autoplay` | checkbox | `true` | Auto-advance testimonials. |
| `autoplay_speed` | range | `5` | Seconds per slide. Range: 2–10, step 1. |
| `show_dots` | checkbox | `true` | Show pagination dot indicators below the testimonial. |
| `show_arrows` | checkbox | `false` | Show prev/next arrow buttons. Hidden below `md` regardless (touch swipe preferred). |
| `transition_effect` | select | `fade` | Transition between slides: `fade`, `slide`. |

### Style

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `quote_text_size` | select | `large` | Quote font size. Maps to `--font-size-*` tokens in SCSS: `small` → `--font-size-lg`, `medium` → `--font-size-xl`, `large` → `--font-size-2xl`, `xlarge` → `--font-size-3xl`. |
| `quote_text_color` | color | `rgba(0,0,0,0)` | Color of the quote text. Clear uses scheme `--cs-text`. |
| `quote_max_width` | range | `800` | Max width of the quote text in px to control line length. Range: 480–1200, step 40. Set via CSS custom property on the section root. |
| `author_name_color` | color | `rgba(0,0,0,0)` | Color of the author name. Clear uses scheme `--cs-text`. |
| `author_label_color` | color | `rgba(0,0,0,0)` | Color of the author role/label text below the name. Clear uses scheme `--cs-text` at reduced opacity. |
| `avatar_size` | select | `medium` | Avatar image size: `small` (32px), `medium` (40px), `large` (52px). Set via CSS custom property on the section root. |

### Layout

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `full_width` | checkbox | `false` | Full-bleed section background; content constrained to `section-content-width`. |
| *(shell)* | — | — | **`padding_*`**, **`margin_*`**, **`background_color`**, **`border_*`**, corner radii from **section-styles**. Replaces the original `section_padding_top`, `section_padding_bottom`, `section_background_color`. |

### Colour

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `section_color_scheme_mode` | select | `default` | `default` — uses global scheme. `custom` — picks from `color_scheme`. Same pattern as product slider / trust bar / promo cards. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. Visible only when `section_color_scheme_mode == 'custom'`. |

### JS-Driven UI

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `animate_on_scroll` | checkbox | `true` | Reveal testimonials with entrance animation when the section scrolls into view (via `IntersectionObserver`). When off, reveal immediately after Swiper init + images load. |

---

## Testimonial block settings (functional spec)

Each block is one testimonial slide.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `quote` | textarea | _(empty)_ | The review quote text. Example: *"I Love How Gentle And Effective These Products Are, My Skin Feels Healthier Every Day With Consistent Use."* |
| `author_name` | text | _(empty)_ | Customer name. Example: *"Sophia Bennett"*. |
| `author_label` | text | `"Verified Customer"` | Role or label below the name. Example: *"Verified Customer"*, *"Skincare Enthusiast"*. |
| `avatar` | image_picker | _(empty)_ | Author avatar image. Displayed as a small circle. Recommended size: 80×80px. Leave empty to hide — author row adjusts layout automatically. |

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Use `mq-up('md')` / `mq-up('lg')` from `src/styles/base/_breakpoints.scss`.

| Setting | `< md` (< 48em) | `md` – `lg` (48em–62em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| Quote max width | Full width | As configured | As configured |
| Quote font size | Token as configured; SCSS scales down ~10% | Token as configured; SCSS scales down ~10% | Token as configured |
| Avatar | Visible (circle) | Visible (circle) | Visible (circle) |
| Navigation dots | Visible | Visible | Visible |
| Navigation arrows | Hidden | Hidden | Shown if `show_arrows` is on |
| Section padding | `--section-padding-*` clamp handles taper | `--section-padding-*` clamp handles taper | `--section-padding-*` clamp handles taper |

> **Section shell** (`section-styles`) uses `clamp()` math that automatically tapers padding on smaller viewports — no separate mobile padding override setting is needed.

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **Carousel role** | Swiper with `a11y` module: add `aria-roledescription="carousel"` on container, `aria-label` on each slide, `aria-roledescription="slide"` on slide elements. Prefer theme's existing Swiper a11y setup from `section-home-slider`. |
| **Slide announcements** | `aria-live="polite"` on the carousel wrapper so slide changes are announced to screen readers. |
| **Keyboard navigation** | Swiper's built-in keyboard module for prev/next arrow key navigation. Tab order must reach all interactive elements within the active slide only. |
| **Focus management** | Focus must remain inside the carousel area during keyboard navigation; hidden slides should not receive focus. |
| **Pause on hover** | Autoplay pauses on mouse enter and focus within the carousel; resumes on mouse leave + blur. |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)`: disable autoplay, use `transition: none` for slide changes, instant reveal (no fade-in animation). JS runtime detects `prefers-reduced-motion` before GSAP tweens. |
| **Avatar alt text** | `<img alt="{{ block.settings.avatar.alt }}" role="presentation">` when avatar is purely decorative; use the image's alt text if the merchant provides meaningful content. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-testimonials.liquid` |
| Styles | `src/styles/sections/_section-testimonials.scss` |
| Style forward | `@forward 'section-testimonials';` in `src/styles/sections/index.scss` |
| Scripts (registry) | `src/scripts/sections/section-testimonials.ts` |
| Scripts (runtime) | `src/scripts/sections/section-testimonials.runtime.ts` (Swiper + GSAP heavy) |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.testimonials` in `locales/en.default.schema.json` + `sections.testimonials.*` in `locales/en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.testimonials.*`** keys, merge **section-styles** settings, and follow schema constraints above.

```json
{
  "name": "t:sections.testimonials.name",
  "tag": "section",
  "class": "section-testimonials",
  "disabled_on": {
    "groups": ["header", "footer"]
  },
  "max_blocks": 12,
  "settings": [
    { "type": "header", "content": "t:sections.testimonials.headers.header_intro" },
    { "type": "checkbox", "id": "show_quote_icon", "label": "t:sections.testimonials.labels.show_quote_icon", "default": true },
    { "type": "color", "id": "quote_icon_color", "label": "t:sections.testimonials.labels.quote_icon_color", "default": "rgba(0,0,0,0)", "info": "t:sections.testimonials.info.quote_icon_color" },
    { "type": "text", "id": "eyebrow_text", "label": "t:sections.testimonials.labels.eyebrow_text", "default": "Customer Reviews" },
    { "type": "text", "id": "heading", "label": "t:sections.testimonials.labels.heading" },
    { "type": "select", "id": "heading_size", "label": "t:sections.testimonials.labels.heading_size", "default": "large", "options": [
      { "value": "small", "label": "t:sections.testimonials.options.heading_size.small" },
      { "value": "medium", "label": "t:sections.testimonials.options.heading_size.medium" },
      { "value": "large", "label": "t:sections.testimonials.options.heading_size.large" },
      { "value": "xlarge", "label": "t:sections.testimonials.options.heading_size.xlarge" }
    ]},

    { "type": "header", "content": "t:sections.testimonials.headers.carousel" },
    { "type": "checkbox", "id": "autoplay", "label": "t:sections.testimonials.labels.autoplay", "default": true },
    { "type": "range", "id": "autoplay_speed", "label": "t:sections.testimonials.labels.autoplay_speed", "min": 2, "max": 10, "step": 1, "default": 5 },
    { "type": "checkbox", "id": "show_dots", "label": "t:sections.testimonials.labels.show_dots", "default": true },
    { "type": "checkbox", "id": "show_arrows", "label": "t:sections.testimonials.labels.show_arrows", "default": false },
    { "type": "select", "id": "transition_effect", "label": "t:sections.testimonials.labels.transition_effect", "default": "fade", "options": [
      { "value": "fade", "label": "t:sections.testimonials.options.transition_effect.fade" },
      { "value": "slide", "label": "t:sections.testimonials.options.transition_effect.slide" }
    ]},

    { "type": "header", "content": "t:sections.testimonials.headers.style" },
    { "type": "select", "id": "quote_text_size", "label": "t:sections.testimonials.labels.quote_text_size", "default": "large", "options": [
      { "value": "small", "label": "t:sections.testimonials.options.quote_text_size.small" },
      { "value": "medium", "label": "t:sections.testimonials.options.quote_text_size.medium" },
      { "value": "large", "label": "t:sections.testimonials.options.quote_text_size.large" },
      { "value": "xlarge", "label": "t:sections.testimonials.options.quote_text_size.xlarge" }
    ]},
    { "type": "color", "id": "quote_text_color", "label": "t:sections.testimonials.labels.quote_text_color", "default": "rgba(0,0,0,0)", "info": "t:sections.testimonials.info.quote_text_color" },
    { "type": "range", "id": "quote_max_width", "label": "t:sections.testimonials.labels.quote_max_width", "min": 480, "max": 1200, "step": 40, "unit": "px", "default": 800 },
    { "type": "color", "id": "author_name_color", "label": "t:sections.testimonials.labels.author_name_color", "default": "rgba(0,0,0,0)", "info": "t:sections.testimonials.info.author_name_color" },
    { "type": "color", "id": "author_label_color", "label": "t:sections.testimonials.labels.author_label_color", "default": "rgba(0,0,0,0)", "info": "t:sections.testimonials.info.author_label_color" },
    { "type": "select", "id": "avatar_size", "label": "t:sections.testimonials.labels.avatar_size", "default": "medium", "options": [
      { "value": "small", "label": "t:sections.testimonials.options.avatar_size.small" },
      { "value": "medium", "label": "t:sections.testimonials.options.avatar_size.medium" },
      { "value": "large", "label": "t:sections.testimonials.options.avatar_size.large" }
    ]},

    { "type": "header", "content": "t:sections.testimonials.headers.layout" },
    { "type": "checkbox", "id": "full_width", "label": "t:sections.testimonials.labels.full_width", "default": false },

    { "type": "header", "content": "t:sections.testimonials.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "label": "t:sections.testimonials.labels.section_color_scheme_mode", "options": [
      { "value": "default", "label": "t:sections.testimonials.options.color_scheme_mode.default" },
      { "value": "custom", "label": "t:sections.testimonials.options.color_scheme_mode.custom" }
    ], "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.testimonials.labels.color_scheme", "default": "scheme-6", "visible_if": "{{ section.settings.section_color_scheme_mode == 'custom' }}" },

    { "type": "header", "content": "t:sections.testimonials.headers.animation" },
    { "type": "checkbox", "id": "animate_on_scroll", "label": "t:sections.testimonials.labels.animate_on_scroll", "default": true, "info": "t:sections.testimonials.info.animate_on_scroll" },

    "/* === section-styles settings (padding, margin, background, border, radii) === */",

    { "type": "header", "content": "t:sections.testimonials.headers.padding" },
    { "type": "range", "id": "padding_top", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.testimonials.labels.padding_top", "default": 80 },
    { "type": "range", "id": "padding_right", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.testimonials.labels.padding_right", "default": 0 },
    { "type": "range", "id": "padding_bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.testimonials.labels.padding_bottom", "default": 80 },
    { "type": "range", "id": "padding_left", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.testimonials.labels.padding_left", "default": 0 },
    { "type": "header", "content": "t:sections.testimonials.headers.margin" },
    { "type": "range", "id": "margin_top", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.testimonials.labels.margin_top", "default": 0 },
    { "type": "range", "id": "margin_bottom", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.testimonials.labels.margin_bottom", "default": 0 },
    { "type": "header", "content": "t:sections.testimonials.headers.background" },
    { "type": "color", "id": "background_color", "label": "t:sections.testimonials.labels.background_color", "default": "rgba(0,0,0,0)", "info": "t:sections.testimonials.info.background_color" },
    { "type": "header", "content": "t:sections.testimonials.headers.border" },
    { "type": "range", "id": "border_width", "min": 0, "max": 8, "step": 1, "unit": "px", "label": "t:sections.testimonials.labels.border_width", "default": 0 },
    { "type": "select", "id": "border_style", "label": "t:sections.testimonials.labels.border_style", "options": [
      { "value": "none", "label": "t:sections.testimonials.options.border_style.none" },
      { "value": "solid", "label": "t:sections.testimonials.options.border_style.solid" },
      { "value": "dashed", "label": "t:sections.testimonials.options.border_style.dashed" },
      { "value": "dotted", "label": "t:sections.testimonials.options.border_style.dotted" }
    ], "default": "solid" },
    { "type": "color", "id": "border_color", "label": "t:sections.testimonials.labels.border_color", "default": "rgba(0,0,0,0)", "info": "t:sections.testimonials.info.border_color" },
    { "type": "header", "content": "t:sections.testimonials.headers.radius" },
    { "type": "range", "id": "border_radius_top_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.testimonials.labels.radius_tl", "default": 0 },
    { "type": "range", "id": "border_radius_top_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.testimonials.labels.radius_tr", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.testimonials.labels.radius_br", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.testimonials.labels.radius_bl", "default": 0 }
  ],
  "blocks": [
    {
      "type": "testimonial",
      "name": "t:sections.testimonials.blocks.testimonial.name",
      "settings": [
        { "type": "textarea", "id": "quote", "label": "t:sections.testimonials.blocks.testimonial.labels.quote" },
        { "type": "text", "id": "author_name", "label": "t:sections.testimonials.blocks.testimonial.labels.author_name" },
        { "type": "text", "id": "author_label", "label": "t:sections.testimonials.blocks.testimonial.labels.author_label", "default": "Verified Customer" },
        { "type": "image_picker", "id": "avatar", "label": "t:sections.testimonials.blocks.testimonial.labels.avatar", "info": "t:sections.testimonials.blocks.testimonial.info.avatar" }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.testimonials.presets.name",
      "blocks": [
        { "type": "testimonial" },
        { "type": "testimonial" },
        { "type": "testimonial" }
      ]
    }
  ]
}
```

> Merge **section-styles** settings in the same order as `section-trust-bar.liquid` / `section-contact-form.liquid` — after colour, before blocks. The `"/* === section-styles … === */"` comment above marks the insertion point.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/SECTION_REGISTRY.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `.cursor/rules/liquid-patterns.mdc`.
2. **Liquid:** `section-styles` + `shopify-section-wrapper`; `testimonials` BEM root; `data-section-type="section-testimonials"` for JS registration; color-scheme-vars on root (same pattern as trust bar / promo cards); `section-intro__eyebrow` + `section-intro__heading` + `section-intro--heading-{{ size }}` for intro; `full_width` + `section-content-width` inner wrapper; slide markup inside Swiper container; `data-*` attributes on section root for JS runtime settings.
3. **SCSS:** mobile-first `mq-up('md')` / `mq-up('lg')`; center-aligned layout with `text-align: center`; quote font size via `--font-size-*` tokens from `css-variables.liquid`; avatar as `border-radius: 50%` with fixed `width`/`height`; fade transition via `opacity` (slides stacked absolutely, active = `opacity: 1`); slide transition via standard Swiper CSS; `prefers-reduced-motion` disables autoplay and transitions.
4. **TS (`section-testimonials.ts`):** thin registry file — `registerSection('section-testimonials', …)` + dynamic `import('./section-testimonials.runtime')`.
5. **TS (`section-testimonials.runtime.ts`):** Swiper init with fade/slide effect per `transition_effect`; `Autoplay` + `Pagination` + `Navigation` + `A11y` modules; loading overlay removed after Swiper init + images `load` + 2 `rAF` ticks; GSAP `autoAlpha: 1` reveal on container; `IntersectionObserver` when `animate_on_scroll` is true; `destroy()`: kill GSAP tweens, `swiper.destroy()`, disconnect observer, `AbortController`.
6. **Schema:** `t:` keys in `locales/en.default.schema.json`; merge section-styles settings; `checkbox` not `toggle`; `disabled_on`; `max_blocks: 12`; presets with 3 default testimonial blocks.
7. **Accessibility:** Swiper `a11y` module, `aria-live="polite"` on carousel, focus management, `prefers-reduced-motion` checks.
8. `npm run check` + `npm run build`.

---

## Implementation notes

- **Layout** is center-aligned: quote icon → eyebrow → heading → quote text → author row (avatar + name + label). All elements are `text-align: center`.
- **Section intro** uses shared `section-intro__eyebrow` and `section-intro__heading` classes from `src/styles/components/_section-intro.scss`. Do not invent parallel `testimonials__eyebrow` / `testimonials__heading` classes — the shared classes already handle typography, spacing, and heading scale.
- **Quote text size** maps to `--font-size-*` tokens in SCSS: `small` → `var(--font-size-lg, 1.25rem)`, `medium` → `var(--font-size-xl, 1.5rem)`, `large` → `var(--font-size-2xl, 2rem)`, `xlarge` → `var(--font-size-3xl, 2.625rem)`. A `--testimonials-quote-font-size` CSS variable is set on the section root via Liquid, and SCSS consumes it as a single `font-size` declaration.
- **Avatar** renders as a circle via `border-radius: 50%` with fixed `width`/`height` matching the `avatar_size` setting (set via `--testimonials-avatar-size` on the section root). Hidden with `display: none` if no image is set — author row adjusts layout automatically via flexbox. Use `<img loading="lazy" alt="">` with appropriate `widths`/`sizes`.
- **Fade transition** crossfades between slides using `opacity` — all slides are stacked absolutely on top of each other, only the active one has `opacity: 1`. Avoids horizontal layout shift during transition. The Swiper fade effect module handles this.
- **Slide transition** uses Swiper's default slide animation — no custom CSS needed.
- **Autoplay pauses** on hover (Swiper's `pauseOnMouseEnter: true`) and resumes on mouse leave.
- **Loading affordance:** a minimal loading indicator (subtle pulse on container or overlay) is shown while Swiper initializes and images load. Content is hidden (`opacity: 0`) via a scoped `{% style %}` block on `#shopify-section-{{ section.id }}`. The runtime removes the loader and fades in content with GSAP after readiness.
- **Entrance animation** (when `animate_on_scroll` is on): `IntersectionObserver` on the section root; once intersected, run GSAP `autoAlpha: 1` + slight `y` offset reveal. If the observer never fires (e.g. section is already visible on load), reveal after a short fallback timeout.
- **`Shopify.designMode`**: skip the scroll gate entirely so merchants see content immediately in the editor preview.
- **Maximum of 12 blocks** — enough for a rich social proof section without impacting performance. Each block is a Swiper slide; 12 slides of text content is lightweight.
