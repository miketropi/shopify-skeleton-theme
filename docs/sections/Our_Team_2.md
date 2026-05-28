# Our Team 2 — Section Document

> **Status:** **Draft — Not Implemented.** This spec has been reviewed against project rules (`.cursor/rules/`, `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `docs/SECTION_REGISTRY.md`, `.cursor/skills/shopify-skeleton-theme/SKILL.md`) and updated accordingly. No Liquid, SCSS, TS, or template wiring exists yet.

> Two-column layout: static intro panel on the left (~30%) and a horizontal Swiper carousel on the right (~70%). Each member card shows a photo, name, and role; social icons overlay the image on hover. On tablet/mobile, the intro stacks above the carousel in a single column.

> **Architectural note — justified monolithic section:** The intro panel and carousel share a two-column split layout with coordinated sizing. The intro column's fixed width is part of the carousel column's available space calculation. The parts are tightly coupled by shared horizontal real estate — moving one without the other would break the layout. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md` → *When a monolithic section is justified*.

---

![Preview — Our Team 2 section](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Our-team-carousel.jpg)

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = **intro column + team carousel** in a two-column split. The intro panel is informational (eyebrow, heading, description, optional CTA). The carousel renders team member cards. Justified monolithic — intro width and carousel width share the same flex/grid layout. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: **`sections/section-our-team-2.liquid`**. BEM root: **`team-two`**. JS-driven Swiper carousel: **`data-section-type="section-our-team-2"`**. SCSS: **`src/styles/sections/_section-our-team-2.scss`**. TS: **`src/scripts/sections/section-our-team-2.ts`** + lazy **`section-our-team-2.runtime.ts`** (Swiper + entrance animation). Register in **`theme.ts`** before **`bootSections()`**. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | **`{% render 'section-styles', section: section %}`** + **`shopify-section-wrapper`** on the section root for merchant padding/margin/background/border. The original `section_padding_top`, `section_padding_bottom`, and `section_background_color` are **replaced** by the shared section-styles contract. See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | **`section_color_scheme_mode`** (`default` \| `custom`) + **`color_scheme`** + **`{% render 'color-scheme-vars', scheme: … %}`** on the section root. Per-element overrides (`name_color`, `role_color`, `description_color`) use the **clear = scheme** override pattern (`rgba(0,0,0,0)` default). See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Product-slider family** | Section uses **`section-intro__eyebrow`** for the eyebrow label and **`section-intro__heading`** for the section heading in the intro column. Root gets **`section-intro--heading-{{ section.settings.heading_size }}`** for heading scale. Reuse `heading_size` values `small` \| `medium` \| `large` \| `xlarge` only. See `.cursor/rules/liquid-patterns.mdc` → *Product-slider family*. |
| **Typography** | Intro description and member name/role sizes consume **`--font-size-*`** tokens from `snippets/css-variables.liquid` with fallbacks. Name: `--font-size-lg`. Role: `--font-size-sm`. Description: `--font-size-base`. See `.cursor/rules/scss-styles.mdc` → *Typography and font size*. |
| **Full width** | **`full_width`** checkbox (default **`false`**) — when on, inner content wrapper gets **`section-content-width`** (same contract as product slider / trust bar). |
| **JS-driven UI** | **Swiper carousel** in the right column — follows the JS-driven UI pattern: **loading state** (opacity off while Swiper inits + images load), **soft GSAP reveal** after readiness, merchant **checkbox** for **animate_on_scroll** (on by default). **`destroy()`** disconnects observer, kills GSAP tweens, destroys Swiper instance, aborts `AbortController`. See `.cursor/rules/liquid-patterns.mdc` → *JS-driven UI: loading, reveal, and scroll effects*. |
| **Slow connections / editor** | **`Shopify.designMode`**: skip scroll gate, shorten wait. **`prefers-reduced-motion: reduce`**: skip loader motion, instant reveal, disable social overlay hover transition. |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Use **`mq-up('md')` / `mq-up('lg')`** — **not** 767px / 1024px literals from the original draft. |
| **Schema constraints** | Use **`checkbox`** (not `toggle`), **`color_scheme`**, **`range`** with min/max/step. Reuse **section-styles** setting ids from `snippets/section-styles.liquid`. Include `"disabled_on": { "groups": ["header", "footer"] }`. |
| **Locales** | Schema → **`t:sections.our_team_2.*`** in `locales/en.default.schema.json`. Storefront runtime strings in `locales/en.default.json`. |
| **Theme Check** | `npm run check` after Liquid/JSON changes; `npm run build` after TS/SCSS changes. |

**Not the same section as:**

| Existing | Difference |
| --- | --- |
| **`section-our-team`** | Full-width carousel-only layout — all cards in a horizontal swipe track. No intro column, no two-column split, no hover social overlay. Different layout architecture entirely. |
| **`section-feature-grid`** | Icon + text cards in a CSS Grid. No Swiper, no two-column split, no social overlay, no team member photo + role pattern. |
| **`section-columns`** | Multi-column generic layout with per-column image/text/button. Not a carousel and not team-specific. |

---

## Template placement (OS 2.0)

Our Team 2 is a **reusable `section-*`** band merchants can add/reorder in any JSON template. Typical use:

| Template | Suggested usage |
| --- | --- |
| **`page.about.json`** | Primary team display on the About page — intro on the left, scrollable team cards on the right. |
| **`index.json`** | Brand story band with team showcase below the hero. |
| **`page.our-story.json`** | Dedicated team/company culture page. |

No template-specific coupling — works anywhere.

---

## Section settings (functional spec)

### Header / Intro Column (Left)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_text` | text | `"Created With Heart"` | Small uppercase label above the heading. Rendered with `section-intro__eyebrow` class. |
| `heading` | text | `"Meet Our Team"` | Section heading in the intro column. Rendered with `section-intro__heading`. |
| `heading_size` | select | `large` | Heading step: `small` \| `medium` \| `large` \| `xlarge`. Root gets `section-intro--heading-{{ value }}`. |
| `description` | textarea | _(empty)_ | Short paragraph below the heading. Rendered as `<p>` inside the intro column. Uses `--font-size-base` token. |
| `description_color` | color | `rgba(0,0,0,0)` | Description text colour. Clear uses scheme `--cs-text`. |
| `show_button` | checkbox | `false` | Show a CTA button below the description in the intro column. |
| `button_label` | text | `"View All"` | CTA button label text. |
| `button_link` | url | _(empty)_ | CTA button destination URL. |
| `button_style` | select | `filled` | Button style: `filled` (uses `--cs-btn-primary-*` tokens), `outlined` (uses `--cs-btn-secondary-*` tokens). |
| `column_ratio` | select | `30-70` | Intro column / carousel column width ratio on `lg+`: `30-70` (intro 30%, carousel 70%), `40-60`, `33-67`. Below `lg`: single column — intro stacked above carousel. |

### Carousel

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `cards_visible` | select | `3.2` | Number of cards visible at once on `lg+`. Options: `2`, `2.5` (peek), `3`, `3.2` (peek). Decimal values create a partial-card peek effect via Swiper `slidesPerView`. |
| `card_gap` | select | `medium` | Space between cards: `small` (12px), `medium` (20px), `large` (32px). Maps to Swiper `spaceBetween`. |
| `show_navigation_arrows` | checkbox | `true` | Show prev/next arrow buttons on the carousel. Hidden below `md` (swipe preferred on mobile). |
| `autoplay` | checkbox | `false` | Auto-advance the carousel. |
| `autoplay_speed` | range | `4` | Seconds per slide. Range: 2–10, step 1. |

### Card Style

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `image_ratio` | select | `portrait` | Photo frame shape: `square` (1:1), `portrait` (3:4). Set via CSS `aspect-ratio` on photo wrapper. |
| `card_border_radius` | select | `medium` | Corner rounding of each card image: `none` (0), `small` (8px), `medium` (16px), `large` (24px). |
| `show_social_on_hover` | checkbox | `true` | Show social icon buttons overlaid on the card image on hover (`opacity: 0 → 1` transition). On mobile (`< md`): always visible (`opacity: 1`). |
| `name_color` | color | `rgba(0,0,0,0)` | Member name colour. Clear uses scheme `--cs-heading`. |
| `role_color` | color | `rgba(0,0,0,0)` | Role text colour. Clear uses scheme `--cs-text-secondary`. |

### Layout

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `full_width` | checkbox | `false` | Full-bleed section background; content constrained to `section-content-width`. |
| *(shell)* | — | — | **`padding_*`**, **`margin_*`**, **`background_color`**, **`border_*`**, corner radii from **section-styles**. Replaces the original `section_padding_top`, `section_padding_bottom`, `section_background_color`. |

### Colour

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `section_color_scheme_mode` | select | `default` | `default` — uses global scheme. `custom` — picks from `color_scheme`. Same pattern as product slider / trust bar. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. Visible only when `section_color_scheme_mode == 'custom'`. |

### JS-Driven UI

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `animate_on_scroll` | checkbox | `true` | Reveal the section with entrance animation when it scrolls into view (via `IntersectionObserver`). When off, reveal immediately after Swiper init + images load. |

---

## Team Member block settings (functional spec)

Each block is one team member card in the carousel. Blocks render as Swiper slides.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `photo` | image_picker | _(empty)_ | Member portrait photo. Recommended ≥ 600×800px, portrait orientation. |
| `image_position` | select | `center top` | Photo focal point for `object-position`: `center center`, `center top`, `center bottom`. |
| `name` | text | _(empty)_ | Member full name. Example: *"Sophia Bennett"*. |
| `role` | text | _(empty)_ | Member job title or role. Example: *"Founder & Creative Director"*. |
| `member_url` | url | _(empty)_ | Link to the member's profile page. When set, the name renders as a clickable link. Leave empty for plain text name. |
| `social_facebook` | url | _(empty)_ | Facebook profile URL. Leave empty to hide icon. |
| `social_x` | url | _(empty)_ | X (Twitter) profile URL. Leave empty to hide icon. |
| `social_instagram` | url | _(empty)_ | Instagram profile URL. Leave empty to hide icon. |
| `social_pinterest` | url | _(empty)_ | Pinterest profile URL. Leave empty to hide icon. |
| `social_linkedin` | url | _(empty)_ | LinkedIn profile URL. Leave empty to hide icon. |

> **Social icon rendering:** Each icon is only rendered if its URL is non-empty — `{% if block.settings.social_instagram != blank %}`. The icons are positioned absolutely over the card image as a flex column. Visibility controlled by `show_social_on_hover` + CSS `opacity` transition on hover. On mobile (`< md`), icons are always visible at `opacity: 1`.

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Use `mq-up('md')` / `mq-up('lg')` from `src/styles/base/_breakpoints.scss`.

| Concern | `< md` (< 48em) | `md` – `lg` (48em–62em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| **Layout** | Single column — intro stacked above carousel | Single column — intro stacked above carousel | Two columns: intro (30%) \| carousel (70%) per `column_ratio` |
| **Cards visible** | 1.25 (peek) via Swiper `slidesPerView` | 2.2 (peek) via responsive breakpoint | As configured (`cards_visible`) |
| **Navigation arrows** | Hidden | Shown if `show_navigation_arrows` is on | Shown if `show_navigation_arrows` is on |
| **Social icons** | Always visible (`opacity: 1`) | On hover (`opacity: 0 → 1`) | On hover (`opacity: 0 → 1`) |
| **Intro column** | Full width | Full width | Fixed width per `column_ratio` |
| **Section padding** | `--section-padding-*` clamp handles taper | `--section-padding-*` clamp handles taper | `--section-padding-*` clamp handles taper |

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **Carousel role** | Swiper with `a11y` module: `aria-roledescription="carousel"` on wrapper, `aria-roledescription="slide"` on each slide, `aria-label` on slide. |
| **Slide announcements** | `aria-live="polite"` on the carousel wrapper so slide changes are announced. |
| **Keyboard navigation** | Swiper's built-in keyboard module. Tab order must reach all interactive elements within visible slides only. |
| **Navigation arrows** | Each arrow button has an `aria-label` (e.g. "Previous members", "Next members"). |
| **Social icons** | Each social link must have `aria-label` (e.g. "Sophia Bennett on Instagram"). Use `target="_blank" rel="noopener noreferrer"` for external links. |
| **Photo alt text** | `<img alt="{{ block.settings.photo.alt }}" loading="lazy">`. If alt is empty, use `role="presentation"`. |
| **Heading hierarchy** | Intro heading uses `<h2>`. Member names use `<h3>`. CTA button and social links follow natural tab order. |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)`: disable autoplay, `transition: none` for social overlay, instant reveal. JS runtime detects `prefers-reduced-motion` before GSAP tweens. |
| **Mobile social icons** | On mobile (`< md`), icons are always visible — no hover dependency. This is controlled via CSS media query on the social overlay opacity. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-our-team-2.liquid` |
| Styles | `src/styles/sections/_section-our-team-2.scss` |
| Style forward | `@forward 'section-our-team-2';` in `src/styles/sections/index.scss` |
| Scripts (registry) | `src/scripts/sections/section-our-team-2.ts` |
| Scripts (runtime) | `src/scripts/sections/section-our-team-2.runtime.ts` (Swiper + GSAP entrance) |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.our_team_2` in `locales/en.default.schema.json` + `sections.our_team_2.*` in `locales/en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.our_team_2.*`** keys, merge **section-styles** settings, and follow schema constraints above.

```json
{
  "name": "t:sections.our_team_2.name",
  "tag": "section",
  "class": "section-our-team-2",
  "disabled_on": {
    "groups": ["header", "footer"]
  },
  "max_blocks": 12,
  "settings": [
    { "type": "header", "content": "t:sections.our_team_2.headers.intro_column" },
    { "type": "text", "id": "eyebrow_text", "label": "t:sections.our_team_2.labels.eyebrow_text", "default": "Created With Heart" },
    { "type": "text", "id": "heading", "label": "t:sections.our_team_2.labels.heading", "default": "Meet Our Team" },
    { "type": "select", "id": "heading_size", "label": "t:sections.our_team_2.labels.heading_size", "default": "large", "options": [
      { "value": "small", "label": "t:sections.our_team_2.options.heading_size.small" },
      { "value": "medium", "label": "t:sections.our_team_2.options.heading_size.medium" },
      { "value": "large", "label": "t:sections.our_team_2.options.heading_size.large" },
      { "value": "xlarge", "label": "t:sections.our_team_2.options.heading_size.xlarge" }
    ]},
    { "type": "textarea", "id": "description", "label": "t:sections.our_team_2.labels.description" },
    { "type": "color", "id": "description_color", "label": "t:sections.our_team_2.labels.description_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team_2.info.description_color" },
    { "type": "checkbox", "id": "show_button", "label": "t:sections.our_team_2.labels.show_button", "default": false },
    { "type": "text", "id": "button_label", "label": "t:sections.our_team_2.labels.button_label", "default": "View All" },
    { "type": "url", "id": "button_link", "label": "t:sections.our_team_2.labels.button_link" },
    { "type": "select", "id": "button_style", "label": "t:sections.our_team_2.labels.button_style", "default": "filled", "options": [
      { "value": "filled", "label": "t:sections.our_team_2.options.button_style.filled" },
      { "value": "outlined", "label": "t:sections.our_team_2.options.button_style.outlined" }
    ]},
    { "type": "select", "id": "column_ratio", "label": "t:sections.our_team_2.labels.column_ratio", "default": "30-70", "options": [
      { "value": "30-70", "label": "t:sections.our_team_2.options.column_ratio.narrow_intro" },
      { "value": "33-67", "label": "t:sections.our_team_2.options.column_ratio.third" },
      { "value": "40-60", "label": "t:sections.our_team_2.options.column_ratio.wide_intro" }
    ]},

    { "type": "header", "content": "t:sections.our_team_2.headers.carousel" },
    { "type": "select", "id": "cards_visible", "label": "t:sections.our_team_2.labels.cards_visible", "default": "3.2", "options": [
      { "value": "2", "label": "t:sections.our_team_2.options.cards_visible.two" },
      { "value": "2.5", "label": "t:sections.our_team_2.options.cards_visible.two_half" },
      { "value": "3", "label": "t:sections.our_team_2.options.cards_visible.three" },
      { "value": "3.2", "label": "t:sections.our_team_2.options.cards_visible.three_two" }
    ]},
    { "type": "select", "id": "card_gap", "label": "t:sections.our_team_2.labels.card_gap", "default": "medium", "options": [
      { "value": "small", "label": "t:sections.our_team_2.options.card_gap.small" },
      { "value": "medium", "label": "t:sections.our_team_2.options.card_gap.medium" },
      { "value": "large", "label": "t:sections.our_team_2.options.card_gap.large" }
    ]},
    { "type": "checkbox", "id": "show_navigation_arrows", "label": "t:sections.our_team_2.labels.show_navigation_arrows", "default": true },
    { "type": "checkbox", "id": "autoplay", "label": "t:sections.our_team_2.labels.autoplay", "default": false },
    { "type": "range", "id": "autoplay_speed", "label": "t:sections.our_team_2.labels.autoplay_speed", "min": 2, "max": 10, "step": 1, "default": 4 },

    { "type": "header", "content": "t:sections.our_team_2.headers.card_style" },
    { "type": "select", "id": "image_ratio", "label": "t:sections.our_team_2.labels.image_ratio", "default": "portrait", "options": [
      { "value": "square", "label": "t:sections.our_team_2.options.image_ratio.square" },
      { "value": "portrait", "label": "t:sections.our_team_2.options.image_ratio.portrait" }
    ]},
    { "type": "select", "id": "card_border_radius", "label": "t:sections.our_team_2.labels.card_border_radius", "default": "medium", "options": [
      { "value": "none", "label": "t:sections.our_team_2.options.card_radius.none" },
      { "value": "small", "label": "t:sections.our_team_2.options.card_radius.small" },
      { "value": "medium", "label": "t:sections.our_team_2.options.card_radius.medium" },
      { "value": "large", "label": "t:sections.our_team_2.options.card_radius.large" }
    ]},
    { "type": "checkbox", "id": "show_social_on_hover", "label": "t:sections.our_team_2.labels.show_social_on_hover", "default": true },
    { "type": "color", "id": "name_color", "label": "t:sections.our_team_2.labels.name_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team_2.info.name_color" },
    { "type": "color", "id": "role_color", "label": "t:sections.our_team_2.labels.role_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team_2.info.role_color" },

    { "type": "header", "content": "t:sections.our_team_2.headers.layout" },
    { "type": "checkbox", "id": "full_width", "label": "t:sections.our_team_2.labels.full_width", "info": "t:sections.our_team_2.info.full_width", "default": false },

    { "type": "header", "content": "t:sections.our_team_2.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "label": "t:sections.our_team_2.labels.section_color_scheme_mode", "options": [
      { "value": "default", "label": "t:sections.our_team_2.options.color_scheme_mode.default" },
      { "value": "custom", "label": "t:sections.our_team_2.options.color_scheme_mode.custom" }
    ], "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.our_team_2.labels.color_scheme", "default": "scheme-6", "visible_if": "{{ section.settings.section_color_scheme_mode == 'custom' }}" },

    { "type": "header", "content": "t:sections.our_team_2.headers.animation" },
    { "type": "checkbox", "id": "animate_on_scroll", "label": "t:sections.our_team_2.labels.animate_on_scroll", "info": "t:sections.our_team_2.info.animate_on_scroll", "default": true },

    "/* === section-styles settings (padding, margin, background, border, radii) === */",

    { "type": "header", "content": "t:sections.our_team_2.headers.padding" },
    { "type": "range", "id": "padding_top", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.our_team_2.labels.padding_top", "default": 60 },
    { "type": "range", "id": "padding_right", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_team_2.labels.padding_right", "default": 0 },
    { "type": "range", "id": "padding_bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.our_team_2.labels.padding_bottom", "default": 60 },
    { "type": "range", "id": "padding_left", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_team_2.labels.padding_left", "default": 0 },
    { "type": "header", "content": "t:sections.our_team_2.headers.margin" },
    { "type": "range", "id": "margin_top", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_team_2.labels.margin_top", "default": 0 },
    { "type": "range", "id": "margin_bottom", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_team_2.labels.margin_bottom", "default": 0 },
    { "type": "header", "content": "t:sections.our_team_2.headers.background" },
    { "type": "color", "id": "background_color", "label": "t:sections.our_team_2.labels.background_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team_2.info.background_color" },
    { "type": "header", "content": "t:sections.our_team_2.headers.border" },
    { "type": "range", "id": "border_width", "min": 0, "max": 8, "step": 1, "unit": "px", "label": "t:sections.our_team_2.labels.border_width", "default": 0 },
    { "type": "select", "id": "border_style", "label": "t:sections.our_team_2.labels.border_style", "options": [
      { "value": "none", "label": "t:sections.our_team_2.options.border_style.none" },
      { "value": "solid", "label": "t:sections.our_team_2.options.border_style.solid" },
      { "value": "dashed", "label": "t:sections.our_team_2.options.border_style.dashed" },
      { "value": "dotted", "label": "t:sections.our_team_2.options.border_style.dotted" }
    ], "default": "solid" },
    { "type": "color", "id": "border_color", "label": "t:sections.our_team_2.labels.border_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team_2.info.border_color" },
    { "type": "header", "content": "t:sections.our_team_2.headers.radius" },
    { "type": "range", "id": "border_radius_top_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_team_2.labels.radius_tl", "default": 0 },
    { "type": "range", "id": "border_radius_top_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_team_2.labels.radius_tr", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_team_2.labels.radius_br", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_team_2.labels.radius_bl", "default": 0 }
  ],
  "blocks": [
    {
      "type": "member",
      "name": "t:sections.our_team_2.blocks.member.name",
      "settings": [
        { "type": "image_picker", "id": "photo", "label": "t:sections.our_team_2.blocks.member.labels.photo", "info": "t:sections.our_team_2.blocks.member.info.photo" },
        { "type": "select", "id": "image_position", "label": "t:sections.our_team_2.blocks.member.labels.image_position", "default": "center top", "options": [
          { "value": "center center", "label": "t:sections.our_team_2.blocks.member.options.image_position.center" },
          { "value": "center top", "label": "t:sections.our_team_2.blocks.member.options.image_position.top" },
          { "value": "center bottom", "label": "t:sections.our_team_2.blocks.member.options.image_position.bottom" }
        ]},
        { "type": "text", "id": "name", "label": "t:sections.our_team_2.blocks.member.labels.name" },
        { "type": "text", "id": "role", "label": "t:sections.our_team_2.blocks.member.labels.role" },
        { "type": "url", "id": "member_url", "label": "t:sections.our_team_2.blocks.member.labels.member_url", "info": "t:sections.our_team_2.blocks.member.info.member_url" },
        { "type": "header", "content": "t:sections.our_team_2.blocks.member.headers.social" },
        { "type": "url", "id": "social_facebook", "label": "t:sections.our_team_2.blocks.member.labels.social_facebook" },
        { "type": "url", "id": "social_x", "label": "t:sections.our_team_2.blocks.member.labels.social_x" },
        { "type": "url", "id": "social_instagram", "label": "t:sections.our_team_2.blocks.member.labels.social_instagram" },
        { "type": "url", "id": "social_pinterest", "label": "t:sections.our_team_2.blocks.member.labels.social_pinterest" },
        { "type": "url", "id": "social_linkedin", "label": "t:sections.our_team_2.blocks.member.labels.social_linkedin" }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.our_team_2.presets.name",
      "blocks": [
        { "type": "member", "settings": { "name": "Sophia Bennett", "role": "Founder & Creative Director" } },
        { "type": "member", "settings": { "name": "Marcus Rivera", "role": "Head of Product" } },
        { "type": "member", "settings": { "name": "Aiko Tanaka", "role": "Lead Designer" } },
        { "type": "member", "settings": { "name": "David Okafor", "role": "Community Manager" } }
      ]
    }
  ]
}
```

> Merge **section-styles** settings in the same order as `section-trust-bar.liquid` / `section-contact-form.liquid` — after colour, before blocks. The `"/* === section-styles … === */"` comment above marks the insertion point.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `.cursor/rules/liquid-patterns.mdc`.
2. **Liquid:** `section-styles` + `shopify-section-wrapper`; `team-two` BEM root; `data-section-type="section-our-team-2"`; color-scheme-vars on root; `section-intro__eyebrow` + `section-intro__heading` + `section-intro--heading-{{ size }}` in intro column; `full_width` + `section-content-width` inner wrapper; two-column layout: `.team-two__intro` + `.team-two__carousel-col`; Swiper viewport + wrapper + slides in carousel column; loading indicator; nav arrows; social icon overlay per card.
3. **SCSS:** mobile-first `mq-up('md')` / `mq-up('lg')`; single column below `lg`; two-column flex/grid at `lg+` per `column_ratio`; intro column fixed flex-basis; carousel column fills remaining space; photo `aspect-ratio` per `image_ratio`; `object-position` per `image_position`; social overlay positioned absolutely over photo with `opacity: 0 → 1` transition on hover; below `md`: `opacity: 1` always; hover scale on photo image; `prefers-reduced-motion` disables hover transitions.
4. **TS (`section-our-team-2.ts`):** thin registry file — `registerSection('section-our-team-2', …)` + dynamic `import('./section-our-team-2.runtime')`.
5. **TS (`section-our-team-2.runtime.ts`):** Swiper init with decimal `slidesPerView` (from `cards_visible` parsed as float); responsive breakpoints for mobile peek (1.25) and tablet (2.2); autoplay, navigation, keyboard modules; loading overlay; GSAP entrance animation with `animate_on_scroll` toggle; `IntersectionObserver`; `destroy()`: kill GSAP, `swiper.destroy()`, disconnect observer, `AbortController`.
6. **Schema:** `t:` keys in `locales/en.default.schema.json`; merge section-styles settings; `checkbox` not `toggle`; `disabled_on`; `max_blocks: 12`; presets with 4 default members.
7. `npm run check` + `npm run build`.

---

## Implementation notes

- **Two-column layout:** At `lg+`, use CSS Grid or flexbox with `grid-template-columns: 30% 1fr` (varies by `column_ratio`). Below `lg`, single column — intro column renders above the carousel in natural DOM order. Both columns are in a `.team-two__layout` wrapper.
- **Intro column:** Eyebrow → heading → description → CTA button. All content is left-aligned within the column. The column uses `align-self: flex-start` so it doesn't stretch to match the carousel height.
- **Button rendering:** Uses the theme's shared button patterns. `filled` → `--cs-btn-primary-bg` / `--cs-btn-primary-label`. `outlined` → `--cs-btn-secondary-label` / `--cs-btn-secondary-border`. Style via CSS custom properties. Render as `<a class="btn btn--{{ button_style }}">` if `button_link` is set, `<button>` fallback if not.
- **Cards_visible decimal:** Swiper `slidesPerView` accepts floats. `2.5` and `3.2` are passed directly as numeric values. The partial card peeks from the right edge to signal scrollability. At `lg+`, use the configured value directly. Below `lg`, Swiper breakpoints override: `< md` = 1.25, `md`–`lg` = 2.2.
- **Card gap:** Maps to Swiper `spaceBetween`: `small` = 12, `medium` = 20, `large` = 32. Applied uniformly across all breakpoints.
- **Social overlay:** Icons are positioned absolutely (`position: absolute; inset: 0`) over the photo wrapper. A flex column (vertically centered and centered in the lower half of the photo) renders the social icon links. CSS `opacity: 0` with `transition: opacity 0.3s`; on `.our-team-2__member:hover` → `opacity: 1`. Below `md`: `opacity: 1` via media query (icons always visible — no hover dependency on touch devices). Only social icons with non-empty URLs are rendered.
- **Social icon colors:** Icons use `color: white` with a semi-transparent dark background on the circle (`background: rgba(0,0,0,0.45)`). Hover changes to `background: rgba(0,0,0,0.65)` or scheme accent if desired.
- **Image position:** `object-position` is set via a CSS custom property on the photo wrapper, mapped from the select value: `center center`, `center top`, `center bottom`. This controls the focal point within the `object-fit: cover` image frame.
- **Photo hover effect:** Images scale up subtly (`transform: scale(1.04)`) on hover with a smooth transition. Wrapped in `@media (prefers-reduced-motion: no-preference)`.
- **Member URL:** If `member_url` is set, the member name renders as a link (`<a>`). If empty, the name is plain text. No separate `name_as_link` toggle — the presence of the URL determines link behavior.
- **Arrows position:** Navigation arrows are positioned at the top-right corner of the carousel column (not centered vertically on the carousel), so they don't overlap the card content. This keeps them cleanly above the visual area.
- **Maximum of 12 blocks** — suitable for small to mid-size teams. Each block is a Swiper slide.
