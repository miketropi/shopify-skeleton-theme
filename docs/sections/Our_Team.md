# Our Team — Section Document

> **Status:** **Draft — Not Implemented.** This spec has been reviewed against project rules (`.cursor/rules/`, `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `docs/SECTION_REGISTRY.md`, `.cursor/skills/shopify-skeleton-theme/SKILL.md`) and updated accordingly. No Liquid, SCSS, TS, or template wiring exists yet.

> A Swiper carousel of team member cards. Each card shows a photo, name, role/title, optional short bio, optional link, and optional social icons. Configurable slides per view (1–4), autoplay, navigation arrows, pagination dots, and slide/fade transitions. Designed for an About page or standalone brand story band.

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = **team member grid**. Blocks are all type `team_member` — instances of the same repeating component. No hero content, no product grids, no unrelated blocks. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: **`sections/section-our-team.liquid`**. BEM root: **`our-team`**. JS-driven Swiper carousel: **`data-section-type="section-our-team"`**. SCSS: **`src/styles/sections/_section-our-team.scss`**. TS: **`src/scripts/sections/section-our-team.ts`** + lazy **`section-our-team.runtime.ts`** (Swiper + entrance animation). Register in **`theme.ts`** before **`bootSections()`**. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | **`{% render 'section-styles', section: section %}`** + **`shopify-section-wrapper`** on the section root for merchant padding/margin/background/border. See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | **`section_color_scheme_mode`** (`default` \| `custom`) + **`color_scheme`** + **`{% render 'color-scheme-vars', scheme: … %}`** on the section root. Per-element overrides (`name_color`, `role_color`, `bio_color`) use the **clear = scheme** override pattern (`rgba(0,0,0,0)` default). See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Product-slider family** | Section uses **`section-intro__eyebrow`** for the eyebrow label and **`section-intro__heading`** for the section heading. Root gets **`section-intro--heading-{{ section.settings.heading_size }}`** for heading scale. Reuse `heading_size` values `small` \| `medium` \| `large` \| `xlarge` only. See `.cursor/rules/liquid-patterns.mdc` → *Product-slider family*. |
| **Typography** | Card name and role sizes consume **`--font-size-*`** tokens from `snippets/css-variables.liquid` with fallbacks. Name: `--font-size-lg`. Role: `--font-size-sm`. Bio: `--font-size-base`. |
| **Full width** | **`full_width`** checkbox (default **`false`**) — when on, inner content wrapper gets **`section-content-width`** (same contract as product slider / trust bar). |
| **Swiper carousel** | CSS Grid replaced by Swiper carousel — slides per view (1–4), autoplay, navigation arrows, pagination dots, slide/fade transitions. Follows the same Swiper + entrance animation pattern as testimonials and trust-bar. |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Use **`mq-up('md')` / `mq-up('lg')`** for column count changes and gap scaling. |
| **Schema constraints** | Use **`checkbox`** (not `toggle`), **`color_scheme`**, **`range`** with min/max/step, **`richtext`** for bio. Reuse **section-styles** setting ids from `snippets/section-styles.liquid`. Include `"disabled_on": { "groups": ["header", "footer"] }`. |
| **Locales** | Schema → **`t:sections.our_team.*`** in `locales/en.default.schema.json`. Storefront runtime strings in `locales/en.default.json`. |
| **Theme Check** | `npm run check` after Liquid/JSON changes; `npm run build` after SCSS changes. |

**Not the same section as:**

| Existing | Difference |
| --- | --- |
| **`section-feature-grid`** | Icon + text cards with link-only CTAs. No team member photos, no role/title hierarchy, no bio richtext. Different block type, different design. |
| **`section-columns`** | Multi-column layout with per-column image/text/button. Team cards are a specific card pattern (image → name → role → bio), not generic columns. |

---

## Template placement (OS 2.0)

Our Team is a **reusable `section-*`** band merchants can add/reorder in any JSON template. Typical use:

| Template | Suggested usage |
| --- | --- |
| **`page.about.json`** | Primary team grid on the About page. |
| **`index.json`** | Brand story band with team behind the products. |
| **`page.our-story.json`** | Dedicated team/company culture page. |

No template-specific coupling — works anywhere.

---

## Section settings (functional spec)

### Header / Intro

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `eyebrow_text` | text | `"Meet the Team"` | Small uppercase label above the heading. Rendered with `section-intro__eyebrow` class. |
| `heading` | text | `"Our Team"` | Section main heading. Rendered with `section-intro__heading`. Leave empty to hide. |
| `heading_size` | select | `large` | Heading step: `small` \| `medium` \| `large` \| `xlarge`. Root gets `section-intro--heading-{{ value }}`. |
| `heading_alignment` | select | `center` | Intro text alignment: `left`, `center`. |

### Layout

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `desktop_columns` | select | `4` | Number of columns on large screens (≥ `lg` 62em): `2`, `3`, `4`. At `md` (48em–62em): 2 columns. Below `md`: 1 column (single-column stack). |
| `card_gap` | select | `medium` | Space between cards: `small` (16px), `medium` (32px), `large` (48px). Set via CSS custom property on the section root. |
| `card_border_radius` | select | `medium` | Corner rounding of the team member card: `none` (0), `small` (8px), `medium` (16px), `large` (24px). |
| `full_width` | checkbox | `false` | Full-bleed section background; content constrained to `section-content-width`. |
| *(shell)* | — | — | **`padding_*`**, **`margin_*`**, **`background_color`**, **`border_*`**, corner radii from **section-styles**. |

### Card Style

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `image_ratio` | select | `portrait` | Photo frame shape: `square` (1:1), `portrait` (3:4), `circle` (1:1 rounded to 50%). |
| `image_border_radius` | select | `medium` | Photo corner rounding: `none` (0), `small` (8px), `medium` (12px), `large` (20px). Ignored when `image_ratio` is `circle`. |
| `show_social_links` | checkbox | `false` | Show social link icons at the bottom of each card when a member has URLs set. |
| `card_text_align` | select | `center` | Text alignment inside each card: `left`, `center`. |

### Colour

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `section_color_scheme_mode` | select | `default` | `default` — uses global scheme. `custom` — picks from `color_scheme`. Same pattern as product slider / trust bar. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. Visible only when `section_color_scheme_mode == 'custom'`. |
| `name_color` | color | `rgba(0,0,0,0)` | Member name colour. Clear uses scheme `--cs-heading`. |
| `role_color` | color | `rgba(0,0,0,0)` | Member role/title colour. Clear uses scheme `--cs-text-secondary`. |
| `bio_color` | color | `rgba(0,0,0,0)` | Bio text colour. Clear uses scheme `--cs-text`. |

---

## Team Member block settings (functional spec)

Each block is one team member card. Blocks render as columns in the grid.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `photo` | image_picker | _(empty)_ | Team member photo. Displayed at the top of the card. Recommended size: 600×800px for portrait. If empty, the card renders without an image area (name/role/bio shift up). |
| `name` | text | _(empty)_ | Full name. Example: *"Sarah Chen"*. |
| `role` | text | _(empty)_ | Job title or role. Example: *"Founder & Creative Director"*. |
| `bio` | richtext | _(empty)_ | Short bio or fun fact. Supports bold, italic, links, lists via Shopify `richtext` type. |
| `link` | url | _(empty)_ | Optional link wrapping the entire card or the photo. Leave empty for no link. |
| `open_in_new_tab` | checkbox | `false` | Open the card link in a new tab. |
| `email` | text | _(empty)_ | Email address. Shown as a mailto icon when `show_social_links` is on. |
| `social_facebook` | url | _(empty)_ | Facebook profile URL. |
| `social_instagram` | url | _(empty)_ | Instagram profile URL. |
| `social_x` | url | _(empty)_ | X (Twitter) profile URL. |
| `social_linkedin` | url | _(empty)_ | LinkedIn profile URL. |
| `social_tiktok` | url | _(empty)_ | TikTok profile URL. |

> Social links only render when `show_social_links` is on at the section level **and** at least one social URL or email is set on the block. Dynamic rendering: `{% if section.settings.show_social_links and block.settings.email != blank %}…{% endif %}`.

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Use `mq-up('md')` / `mq-up('lg')` from `src/styles/base/_breakpoints.scss`.

| Concern | `< md` (< 48em) | `md` – `lg` (48em–62em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| Columns | 1 (stacked) | 2 | As configured (`desktop_columns`: 2–4) |
| Card gap | As configured | As configured | As configured |
| Intro alignment | Force center | As configured (`heading_alignment`) | As configured |
| Card text alignment | Force center | As configured (`card_text_align`) | As configured |
| Photo size | Full width within card | Full width within card | Full width within card |

> **Column collapse:** Below `md`, cards stack in a single column regardless of `desktop_columns`. Below `lg`, 2 columns max even if `desktop_columns` is set to 3 or 4. This ensures readable card widths on smaller screens.

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **Heading hierarchy** | Section heading uses `<h2>` (or appropriate level for page outline). Member names use `<h3>` within each card. |
| **Image alt text** | Photos use `<img alt="{{ block.settings.photo.alt }}" loading="lazy">`. If alt text is empty, add `role="presentation"` for decorative images. |
| **Link semantics** | If a card link wraps the photo, use a single `<a>` anchor around the photo (not the whole card) to avoid nested interactive elements and long link text. Alternatively, wrap the photo + name in one `<a>` and leave the bio as plain text. |
| **Social icons** | Each social icon link must have an `aria-label` (e.g. `"Sarah Chen on LinkedIn"`). Use `target="_blank"` + `rel="noopener noreferrer"` for external links. |
| **Keyboard** | All links (card link, social icons) must be tabbable in natural DOM order. No focus traps needed — static grid. |
| **Reduced motion** | No JS animations — CSS transitions only for hover states on card images (scale or opacity). Wrap in `@media (prefers-reduced-motion: no-preference)` if motion is added. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-our-team.liquid` |
| Styles | `src/styles/sections/_section-our-team.scss` |
| Style forward | `@forward 'section-our-team';` in `src/styles/sections/index.scss` |
| Scripts (registry) | `src/scripts/sections/section-our-team.ts` |
| Scripts (runtime) | `src/scripts/sections/section-our-team.runtime.ts` (entrance animation) |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.our_team` in `locales/en.default.schema.json` + `sections.our_team.*` in `locales/en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.our_team.*`** keys, merge **section-styles** settings, and follow schema constraints above.

```json
{
  "name": "t:sections.our_team.name",
  "tag": "section",
  "class": "section-our-team",
  "disabled_on": {
    "groups": ["header", "footer"]
  },
  "max_blocks": 24,
  "settings": [
    { "type": "header", "content": "t:sections.our_team.headers.header_intro" },
    { "type": "text", "id": "eyebrow_text", "label": "t:sections.our_team.labels.eyebrow_text", "default": "Meet the Team" },
    { "type": "text", "id": "heading", "label": "t:sections.our_team.labels.heading", "default": "Our Team" },
    { "type": "select", "id": "heading_size", "label": "t:sections.our_team.labels.heading_size", "default": "large", "options": [
      { "value": "small", "label": "t:sections.our_team.options.heading_size.small" },
      { "value": "medium", "label": "t:sections.our_team.options.heading_size.medium" },
      { "value": "large", "label": "t:sections.our_team.options.heading_size.large" },
      { "value": "xlarge", "label": "t:sections.our_team.options.heading_size.xlarge" }
    ]},
    { "type": "select", "id": "heading_alignment", "label": "t:sections.our_team.labels.heading_alignment", "default": "center", "options": [
      { "value": "left", "label": "t:sections.our_team.options.heading_alignment.left" },
      { "value": "center", "label": "t:sections.our_team.options.heading_alignment.center" }
    ]},

    { "type": "header", "content": "t:sections.our_team.headers.layout" },
    { "type": "select", "id": "desktop_columns", "label": "t:sections.our_team.labels.desktop_columns", "default": "4", "options": [
      { "value": "2", "label": "t:sections.our_team.options.desktop_columns.two" },
      { "value": "3", "label": "t:sections.our_team.options.desktop_columns.three" },
      { "value": "4", "label": "t:sections.our_team.options.desktop_columns.four" }
    ]},
    { "type": "select", "id": "card_gap", "label": "t:sections.our_team.labels.card_gap", "default": "medium", "options": [
      { "value": "small", "label": "t:sections.our_team.options.card_gap.small" },
      { "value": "medium", "label": "t:sections.our_team.options.card_gap.medium" },
      { "value": "large", "label": "t:sections.our_team.options.card_gap.large" }
    ]},
    { "type": "select", "id": "card_border_radius", "label": "t:sections.our_team.labels.card_border_radius", "default": "medium", "options": [
      { "value": "none", "label": "t:sections.our_team.options.radius.none" },
      { "value": "small", "label": "t:sections.our_team.options.radius.small" },
      { "value": "medium", "label": "t:sections.our_team.options.radius.medium" },
      { "value": "large", "label": "t:sections.our_team.options.radius.large" }
    ]},
    { "type": "checkbox", "id": "full_width", "label": "t:sections.our_team.labels.full_width", "info": "t:sections.our_team.info.full_width", "default": false },

    { "type": "header", "content": "t:sections.our_team.headers.card_style" },
    { "type": "select", "id": "image_ratio", "label": "t:sections.our_team.labels.image_ratio", "default": "portrait", "options": [
      { "value": "square", "label": "t:sections.our_team.options.image_ratio.square" },
      { "value": "portrait", "label": "t:sections.our_team.options.image_ratio.portrait" },
      { "value": "circle", "label": "t:sections.our_team.options.image_ratio.circle" }
    ]},
    { "type": "select", "id": "image_border_radius", "label": "t:sections.our_team.labels.image_border_radius", "default": "medium", "info": "t:sections.our_team.info.image_border_radius", "options": [
      { "value": "none", "label": "t:sections.our_team.options.image_radius.none" },
      { "value": "small", "label": "t:sections.our_team.options.image_radius.small" },
      { "value": "medium", "label": "t:sections.our_team.options.image_radius.medium" },
      { "value": "large", "label": "t:sections.our_team.options.image_radius.large" }
    ]},
    { "type": "checkbox", "id": "show_social_links", "label": "t:sections.our_team.labels.show_social_links", "default": false },
    { "type": "select", "id": "card_text_align", "label": "t:sections.our_team.labels.card_text_align", "default": "center", "options": [
      { "value": "left", "label": "t:sections.our_team.options.card_text_align.left" },
      { "value": "center", "label": "t:sections.our_team.options.card_text_align.center" }
    ]},

    { "type": "header", "content": "t:sections.our_team.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "label": "t:sections.our_team.labels.section_color_scheme_mode", "options": [
      { "value": "default", "label": "t:sections.our_team.options.color_scheme_mode.default" },
      { "value": "custom", "label": "t:sections.our_team.options.color_scheme_mode.custom" }
    ], "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.our_team.labels.color_scheme", "default": "scheme-6", "visible_if": "{{ section.settings.section_color_scheme_mode == 'custom' }}" },
    { "type": "color", "id": "name_color", "label": "t:sections.our_team.labels.name_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team.info.name_color" },
    { "type": "color", "id": "role_color", "label": "t:sections.our_team.labels.role_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team.info.role_color" },
    { "type": "color", "id": "bio_color", "label": "t:sections.our_team.labels.bio_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team.info.bio_color" },

    "/* === section-styles settings (padding, margin, background, border, radii) === */",

    { "type": "header", "content": "t:sections.our_team.headers.padding" },
    { "type": "range", "id": "padding_top", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.our_team.labels.padding_top", "default": 80 },
    { "type": "range", "id": "padding_right", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_team.labels.padding_right", "default": 0 },
    { "type": "range", "id": "padding_bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.our_team.labels.padding_bottom", "default": 80 },
    { "type": "range", "id": "padding_left", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_team.labels.padding_left", "default": 0 },
    { "type": "header", "content": "t:sections.our_team.headers.margin" },
    { "type": "range", "id": "margin_top", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_team.labels.margin_top", "default": 0 },
    { "type": "range", "id": "margin_bottom", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.our_team.labels.margin_bottom", "default": 0 },
    { "type": "header", "content": "t:sections.our_team.headers.background" },
    { "type": "color", "id": "background_color", "label": "t:sections.our_team.labels.background_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team.info.background_color" },
    { "type": "header", "content": "t:sections.our_team.headers.border" },
    { "type": "range", "id": "border_width", "min": 0, "max": 8, "step": 1, "unit": "px", "label": "t:sections.our_team.labels.border_width", "default": 0 },
    { "type": "select", "id": "border_style", "label": "t:sections.our_team.labels.border_style", "options": [
      { "value": "none", "label": "t:sections.our_team.options.border_style.none" },
      { "value": "solid", "label": "t:sections.our_team.options.border_style.solid" },
      { "value": "dashed", "label": "t:sections.our_team.options.border_style.dashed" },
      { "value": "dotted", "label": "t:sections.our_team.options.border_style.dotted" }
    ], "default": "solid" },
    { "type": "color", "id": "border_color", "label": "t:sections.our_team.labels.border_color", "default": "rgba(0,0,0,0)", "info": "t:sections.our_team.info.border_color" },
    { "type": "header", "content": "t:sections.our_team.headers.radius" },
    { "type": "range", "id": "border_radius_top_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_team.labels.radius_tl", "default": 0 },
    { "type": "range", "id": "border_radius_top_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_team.labels.radius_tr", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_team.labels.radius_br", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.our_team.labels.radius_bl", "default": 0 }
  ],
  "blocks": [
    {
      "type": "team_member",
      "name": "t:sections.our_team.blocks.team_member.name",
      "settings": [
        { "type": "image_picker", "id": "photo", "label": "t:sections.our_team.blocks.team_member.labels.photo", "info": "t:sections.our_team.blocks.team_member.info.photo" },
        { "type": "text", "id": "name", "label": "t:sections.our_team.blocks.team_member.labels.name" },
        { "type": "text", "id": "role", "label": "t:sections.our_team.blocks.team_member.labels.role" },
        { "type": "richtext", "id": "bio", "label": "t:sections.our_team.blocks.team_member.labels.bio" },
        { "type": "header", "content": "t:sections.our_team.blocks.team_member.headers.link" },
        { "type": "url", "id": "link", "label": "t:sections.our_team.blocks.team_member.labels.link" },
        { "type": "checkbox", "id": "open_in_new_tab", "label": "t:sections.our_team.blocks.team_member.labels.open_in_new_tab", "default": false },
        { "type": "header", "content": "t:sections.our_team.blocks.team_member.headers.social" },
        { "type": "text", "id": "email", "label": "t:sections.our_team.blocks.team_member.labels.email" },
        { "type": "url", "id": "social_facebook", "label": "t:sections.our_team.blocks.team_member.labels.social_facebook" },
        { "type": "url", "id": "social_instagram", "label": "t:sections.our_team.blocks.team_member.labels.social_instagram" },
        { "type": "url", "id": "social_x", "label": "t:sections.our_team.blocks.team_member.labels.social_x" },
        { "type": "url", "id": "social_linkedin", "label": "t:sections.our_team.blocks.team_member.labels.social_linkedin" },
        { "type": "url", "id": "social_tiktok", "label": "t:sections.our_team.blocks.team_member.labels.social_tiktok" }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.our_team.presets.name",
      "blocks": [
        {
          "type": "team_member",
          "settings": {
            "name": "Sarah Chen",
            "role": "Founder & Creative Director"
          }
        },
        {
          "type": "team_member",
          "settings": {
            "name": "Marcus Rivera",
            "role": "Head of Product"
          }
        },
        {
          "type": "team_member",
          "settings": {
            "name": "Aiko Tanaka",
            "role": "Lead Designer"
          }
        },
        {
          "type": "team_member",
          "settings": {
            "name": "David Okafor",
            "role": "Community Manager"
          }
        }
      ]
    }
  ]
}
```

> Merge **section-styles** settings in the same order as `section-trust-bar.liquid` / `section-contact-form.liquid` — after colour, before blocks. The `"/* === section-styles … === */"` comment above marks the insertion point.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `.cursor/rules/liquid-patterns.mdc`.
2. **Liquid:** `section-styles` + `shopify-section-wrapper`; `our-team` BEM root; color-scheme-vars on root; `section-intro__eyebrow` + `section-intro__heading` + `section-intro--heading-{{ size }}` for intro; `full_width` + `section-content-width` inner wrapper; `<ul>` grid iterating `section.blocks` with type `team_member`; per-card markup: photo → name → role → bio → social icons.
3. **SCSS:** mobile-first `mq-up('md')` / `mq-up('lg')`; CSS Grid with column count driven by `--our-team-cols` CSS variable set from Liquid; gap via `--our-team-gap` variable; photo aspect ratio via `--our-team-image-ratio` (maps to `aspect-ratio` or padding-bottom trick for older browsers); circle photos use `border-radius: 50%`; card text alignment via BEM modifier; social icon row at card bottom; `prefers-reduced-motion: no-preference` wrap around any hover transitions.
4. **TS (`section-our-team.ts`):** thin registry file — `registerSection('section-our-team', …)` + dynamic `import('./section-our-team.runtime')`.
5. **TS (`section-our-team.runtime.ts`):** entrance animation only — no Swiper. `gsap.set` members to `autoAlpha: 0` + slight `y` offset; `waitSlideReady` for load + images; `IntersectionObserver` via `waitForSectionVisible` when `animate_on_scroll` is true; GSAP stagger reveal (0.62s, 0.08s stagger, `power2.out`); `destroy()`: kill GSAP tweens, disconnect observer, `AbortController`.
6. **Schema:** `t:` keys in `locales/en.default.schema.json`; merge section-styles settings; `checkbox` not `toggle`; `disabled_on`; `max_blocks: 24`; `richtext` for bio; presets with 4 default team member blocks. Add `animate_on_scroll` checkbox (default true) under an "Animation" header.
6. `npm run check` + `npm run build`.

---

## Implementation notes

- **Grid layout:** Use CSS Grid with `grid-template-columns: repeat(var(--our-team-cols, 2), 1fr)`. Set `--our-team-cols` from Liquid: `desktop_columns` value for `lg+`, `2` for `md`–`lg`, `1` for `< md`. Responsive via `mq-up()` with the variable overridden at each breakpoint.
- **Gap:** `gap: var(--our-team-gap)` — mapped from `card_gap` select to px values (`small`=16, `medium`=32, `large`=48). Set on the section root via Liquid.
- **Photo aspect ratio:** Use `aspect-ratio` CSS property. For `circle`, use `aspect-ratio: 1` + `border-radius: 50%`. For `square`, `aspect-ratio: 1`. For `portrait`, `aspect-ratio: 3 / 4`. Object-fit: cover on all images.
- **Card link:** When a member has a link, wrap the photo + name in one `<a>` tag. The bio remains unlinked. This avoids large link text for screen readers while keeping the primary visual elements clickable. Social icons are separate links.
- **Social icons:** Render as a row of SVG icons at the bottom of the card. Only render the icon row when `show_social_links` is on AND at least one social field is set. Email icon uses `mailto:` prefix. Social URLs use `target="_blank" rel="noopener noreferrer"`. Icons use `--cs-text-secondary` colour and inherit hover colour from scheme.
- **Richtext bio:** Use Shopify's `richtext` schema type — renders HTML directly via `{{ block.settings.bio }}`. Supports `<b>`, `<i>`, `<a>`, `<ul>`, `<ol>`, `<br>`. Wrap in a `<div>` with `our-team__member-bio` class for consistent styling.
- **Empty photo:** When no photo is set, hide the image wrapper entirely (`{% if block.settings.photo != blank %}`). The card layout should not collapse — name/role/bio render normally below.
- **`max_blocks: 24`** — large teams or agencies can list everyone. Grid reflows automatically.
- **No JS fallback:** Swiper's `watchOverflow` and responsive breakpoints ensure cards remain visible even if JS fails. The carousel is fully progressive — all cards are in the DOM and accessible without JavaScript.
