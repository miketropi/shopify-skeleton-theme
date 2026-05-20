# Before & After

> **Status:** Specification only — **not in the repository yet.** When implemented, use `sections/section-before-after.liquid` and the checklist below. Compare intro-column patterns with `sections/section-collection-slide.liquid` (product-slider family intro + CTA).

> Two-column layout: **intro panel** (eyebrow, heading, description, CTA) beside an interactive **before/after image comparison** with a draggable divider. Stacks to a single column below `lg`. Touch-friendly on mobile.

---

![Before & After section example](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/ss-after-before.jpg)

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = intro copy + one comparison slider only. No blocks, no secondary carousels. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: `section-before-after.liquid`. BEM root: `before-after`. Interactive: `data-section-type="section-before-after"`. SCSS: `src/styles/sections/_section-before-after.scss` (or `before-after/` partials if it grows). TS: `section-before-after.ts` + `section-before-after.runtime.ts` (pointer/keyboard divider + optional GSAP reveal). Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | `{% render 'section-styles', section: section %}` + `shopify-section-wrapper` on the section root. **Do not** use standalone `section_padding_top` / `section_padding_bottom` only — merge the **section-styles** block from `snippets/section-styles.liquid` (padding four sides, margin, background, border, radii). Merchants can set padding to `0` for a flush band. See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | `section_color_scheme_mode` + `color_scheme` + `color-scheme-vars` for the section band and intro typography. Slider chrome (`divider_color`) stays a dedicated color setting. See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Typography (product-slider family)** | Intro **eyebrow** → `product-slider__eyebrow`. Intro **heading** → `product-slider__heading`. Section root: `product-slider--heading-{{ section.settings.heading_size }}` with values `small` \| `medium` \| `large` \| `xlarge` only. Description in a section-specific RTE wrapper (e.g. `before-after__description rte`). |
| **CTA** | Match Collection slide / home slider: `home-slider__actions` wrapper + `before-after__btn before-after__btn--{{ button_style }}` where `button_style` is `primary` \| `outline` \| `ghost` (not `filled` / `outlined` — map legacy labels in Liquid if needed). Hide button when `button_label` or `button_link` is blank. |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: `sm` 36em, **`md` 48em (768px)**, **`lg` 62em (992px)**, `xl` 75em. Two columns at **`lg+`**; stack below `lg`. Prefer `mq-up('lg')` over 1024px literals. |
| **Typography tokens** | Body/description via `var(--font-size-*, …)` from `snippets/css-variables.liquid`. See `.cursor/rules/scss-styles.mdc`. |
| **JS-driven UI** | Comparison slider is **JS-primary**: wait until before/after images are ready → remove loading state → optional **GSAP soft reveal**; merchant toggle **`entrance_animate_on_scroll`** (default on). Divider drag via pointer events; `prefers-reduced-motion` respected; full `destroy()` in section registry. See `.cursor/rules/liquid-patterns.mdc` → *JS-driven UI* and `docs/SECTION_REGISTRY.md`. **No Swiper** — custom slider only. |
| **Locales** | Schema `name` / `label` / `info` → **`t:sections.before_after.*`**; storefront strings (`before_label`, `after_label`, slider aria) in `locales/en.default.json`; schema strings in `locales/en.default.schema.json`. |
| **Schema constraints** | Required **text** settings use **non-empty `default`** values (no `"default": ""`). Optional intro copy can use merchant-clear defaults (e.g. placeholder heading) or hide UI when blank — document behavior in Liquid. |
| **Theme Check** | `npm run check` after Liquid; `npm run build` after TS/SCSS. |

**Not the same section as** image-story slideshows, promo cards, or collection slide carousels — this is a single comparison control with a static image pair.

---

## Layout (target UX)

| Region | Content |
| --- | --- |
| **Intro column (left at `lg+`)** | Eyebrow → heading → description → optional CTA button. |
| **Slider column (right at `lg+`)** | Layered before/after images, vertical divider + drag handle, optional pill labels. |

**Interaction:** Divider position driven by a CSS custom property (e.g. `--before-after-position`, `0–100%`) updated on pointer drag and keyboard. After layer clipped with `clip-path` or `overflow: hidden` on a wrapper — no third-party compare library required.

---

## Section settings (functional spec)

### Intro column

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_text` | text | `Real Results. Visible Change` | Small label above heading; hide row when blank. |
| `heading` | text | `Before & After Skin Results` | Main headline. |
| `heading_size` | select | `large` | `small` \| `medium` \| `large` \| `xlarge`. |
| `description` | textarea | _(suggested default copy in schema)_ | Short paragraph; `rte` class on output. |
| `button_label` | text | `Explore Now` | CTA label; hide when blank. |
| `button_link` | url | — | CTA destination; hide when blank. |
| `button_style` | select | `primary` | `primary` \| `outline` \| `ghost`. |

### Layout & shell

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `column_layout` | select | `40` | Intro / slider width split at `lg+`: `30` (30/70), `40` (40/60), `50` (50/50). Expose as CSS vars e.g. `--before-after-intro-fr` / `--before-after-slider-fr`. |
| `image_border_radius` | select | `medium` | Slider frame corners: `none`, `small` (8px), `medium` (16px), `large` (24px). |
| `full_width` | checkbox | `false` | Full-bleed background; inner grid uses `section-content-width` when on. |
| `entrance_animate_on_scroll` | checkbox | `true` | When on, reveal after section intersects viewport; when off, reveal after images ready without scroll gate. |
| `section_color_scheme_mode` | select | `default` | `default` \| `custom` — same pattern as Collection slide. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. |
| *(shell)* | — | — | `padding_*`, `margin_*`, `background_color`, `border_*`, corner radii from **`section-styles`**. |

### Before / after slider

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `before_image` | image_picker | — | “Before” image. Recommend ≥ 1200×900px; **same aspect ratio** as after image. |
| `after_image` | image_picker | — | “After” image; must match before dimensions/aspect. |
| `initial_position` | range | `50` | Divider start position (% from left). Min 20, max 80, step 5. |
| `before_label` | text | `Before` | Bottom-left pill label; translatable via locale. |
| `after_label` | text | `After` | Bottom-right pill label. |
| `show_labels` | checkbox | `true` | Show before/after pills on the slider. |
| `divider_color` | color | `#FFFFFF` | Divider line and handle accent. |
| `drag_icon_style` | select | `lines` | Handle icon: `lines`, `arrows`, `dots` — inline SVG, no external assets. |

**Out of scope unless spec changes:** multiple comparison pairs per section (use a second section instance), video compare, blocks, per-image colour schemes, standalone `section_padding_top` / `section_padding_bottom` only.

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS.

| Concern | `< lg` (&lt; 62em) | `lg+` (≥ 62em) |
| --- | --- | --- |
| Layout | Single column — intro above slider | Two columns per `column_layout` |
| Intro / slider width | 100% each | Configured ratio (30/70, 40/60, 50/50) |
| Drag | Touch + mouse on handle | Mouse + touch |
| Labels / handle | Visible (when settings on) | Visible |
| Column gap | Use section padding / sensible `gap` token | As designed |

---

## Accessibility & interaction

| Requirement | Implementation hint |
| --- | --- |
| **Slider role** | Divider handle: `role="slider"`, `aria-valuemin="20"`, `aria-valuemax="80"`, `aria-valuenow` synced to position, `aria-label` from locale (e.g. “Compare before and after”). |
| **Keyboard** | Handle focusable; **Arrow Left/Right** (and optionally Home/End) move position in 5% steps; respect min/max from `initial_position` range. |
| **Pointer** | `pointerdown` / `pointermove` / `pointerup` with capture; touch-friendly hit target on handle. |
| **Labels** | Pills are decorative text; not focusable. |
| **Images** | Meaningful `alt` from settings or fallback to `before_label` / `after_label`; after image can use `alt=""` if purely comparative and described in intro — document choice in Liquid. |
| **Reduced motion** | Skip or shorten GSAP entrance; optional static divider at `initial_position` without animating reveal. |
| **No-JS** | Show before image only (or a static 50/50 split via CSS) so content is not hidden; enhance when JS loads. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-before-after.liquid` |
| Snippet (optional) | `snippets/before-after-slider.liquid` — compare markup + handle |
| Styles | `src/styles/sections/_section-before-after.scss` |
| Scripts | `src/scripts/sections/section-before-after.ts`, `section-before-after.runtime.ts` |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.before_after` in `en.default.schema.json` + `en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.before_after.*`**, merge **section-styles** settings, and follow non-empty text defaults. Structural hint only:

```json
{
  "name": "t:sections.before_after.name",
  "tag": "section",
  "class": "section-before-after",
  "max_blocks": 0,
  "settings": [
    { "type": "header", "content": "t:sections.before_after.headers.intro" },
    { "type": "text", "id": "eyebrow_text", "label": "…", "default": "Real Results. Visible Change" },
    { "type": "text", "id": "heading", "label": "…", "default": "Before & After Skin Results" },
    { "type": "select", "id": "heading_size", "default": "large", "options": [
      { "value": "small", "label": "…" },
      { "value": "medium", "label": "…" },
      { "value": "large", "label": "…" },
      { "value": "xlarge", "label": "…" }
    ]},
    { "type": "textarea", "id": "description", "label": "…", "default": "See the difference with skincare designed to improve texture and enhance radiance." },
    { "type": "text", "id": "button_label", "label": "…", "default": "Explore Now" },
    { "type": "url", "id": "button_link", "label": "…" },
    { "type": "select", "id": "button_style", "default": "primary", "options": [
      { "value": "primary", "label": "…" },
      { "value": "outline", "label": "…" },
      { "value": "ghost", "label": "…" }
    ]},
    { "type": "header", "content": "t:sections.before_after.headers.layout" },
    { "type": "select", "id": "column_layout", "default": "40", "options": [
      { "value": "30", "label": "30 / 70" },
      { "value": "40", "label": "40 / 60" },
      { "value": "50", "label": "50 / 50" }
    ]},
    { "type": "select", "id": "image_border_radius", "default": "medium" },
    { "type": "checkbox", "id": "full_width", "default": false },
    { "type": "checkbox", "id": "entrance_animate_on_scroll", "default": true },
    { "type": "select", "id": "section_color_scheme_mode", "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "default": "scheme-6" },
    { "type": "header", "content": "t:sections.before_after.headers.slider" },
    { "type": "image_picker", "id": "before_image", "label": "…" },
    { "type": "image_picker", "id": "after_image", "label": "…" },
    { "type": "range", "id": "initial_position", "min": 20, "max": 80, "step": 5, "default": 50 },
    { "type": "checkbox", "id": "show_labels", "default": true },
    { "type": "text", "id": "before_label", "default": "Before" },
    { "type": "text", "id": "after_label", "default": "After" },
    { "type": "color", "id": "divider_color", "default": "#FFFFFF" },
    { "type": "select", "id": "drag_icon_style", "default": "lines" }
  ],
  "presets": [{ "name": "t:sections.before_after.presets.name" }]
}
```

> Merge **section-styles** range/color settings after layout headers (same order as `section-promo-cards.liquid` / `section-collection-slide.liquid`).

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/SECTION_REGISTRY.md`, `docs/COLOR_SCHEME_SYSTEM.md`.
2. Liquid: `section-styles` + `shopify-section-wrapper`; `before-after` + `product-slider--heading-*`; `data-section-type` / `data-section-id`; `data-before-after-*` for initial position and entrance flag.
3. Snippet (optional): slider markup only; pass images, labels, divider settings from section.
4. SCSS: mobile-first; `--before-after-position`, column ratio vars, `image_border_radius` on slider frame; no 1024px/767px literals.
5. TS: `registerSection('section-before-after', …)`; runtime loads images → drops loading class → optional GSAP reveal (shared entrance helpers if useful); pointer + keyboard on handle; `AbortController` / listener cleanup in `destroy()`.
6. Locales: `sections.before_after` in schema + storefront JSON.
7. `npm run check` + `npm run build`.

---

## Implementation notes

- **No blocks** — single-instance section; all settings at section level.
- **Same-size images** — editor `info` on both pickers: matching aspect ratio avoids layout shift while dragging.
- **Clip strategy** — fixed aspect box (e.g. from before image intrinsic ratio or a section-level ratio setting in a future revision); after image absolutely positioned and clipped.
- **Loading** — root class e.g. `before-after--loading` until both images `decode` / `load`; then `before-after--revealed` for GSAP.
- **Editor** — respect `window.Shopify.designMode`; shorten entrance delays per *JS-driven UI* rules.
- **Divider** — `divider_color` on line + handle; icon variant via `drag_icon_style` modifier class.
- **Progressive enhancement** — comparison interaction requires JS; non-JS fallback shows usable static content.
