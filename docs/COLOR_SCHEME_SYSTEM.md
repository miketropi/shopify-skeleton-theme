# Color scheme system

This document defines how color schemes and font pairings are architected, defined, and consumed across the theme. Read it fully before touching any color or typography file.

---

## Mental model

The system has three layers:

```
Layer 1 — Color schemes      config/settings_schema.json (color_scheme_group + custom_color_*)
          Named semantic tokens (and optional custom site-wide colours).
          "These colours define the storefront."

Layer 2 — Font registry      snippets/font-pairing-loader.liquid + src/styles/base/_fonts.scss
          Google Fonts / theme fonts and `--cs-font-*` on `:root`.
          "Load the correct fonts for this theme."

Layer 3 — Section roots      sections/*.liquid (`{% render 'color-scheme-vars' %}`)
          Each section root gets the same theme-wide `--cs-*` (preset:
          `settings.global_color_scheme`; custom: `custom_color_*`). Typography
          inherits from `:root`.
          "This section uses the store tokens."
```

No section ever references a raw hex value or a font family string directly. Sections only know about scheme tokens (`--cs-background`, `--cs-font-heading`, etc.). There is **no** separate “brand palette” setting group — it was not wired to any Liquid/CSS and has been removed.

### Shopify constraints in this theme

**Colour source** (`settings.color_mode`): **`preset`** uses `color_scheme_group` to define named schemes and **`global_color_scheme`** (theme setting) to choose which named scheme applies store-wide. **`custom`** uses theme-wide `custom_color_*` settings. `color-scheme-vars` and `:root` read those values; **sections do not have a `color_scheme` setting**. Shopify Theme Check does not allow `visible_if` on `color_scheme_group`, so the preset scheme editor stays visible in the admin when Custom is on but is **ignored** on the storefront.

Theme Check only allows `header`, `color`, and `color_background` inside `color_scheme_group.definition`, so a `select` such as `font_pairing` **cannot** live in the scheme object. In **preset** colour mode, **one scheme applies to the whole store** (`global_color_scheme`); **typography is theme-wide** under **Typography**: `settings.typography_mode` is **`preset`** (curated Google Font pairings via `settings.font_pairing` + `font-pairing-loader.liquid`) or **`custom`** (three `font_picker` settings — heading, body, mono — with `@font-face` from Shopify’s font system in `css-variables.liquid`). `snippets/css-variables.liquid` sets `--cs-font-*` on `:root` for either mode. `snippets/color-scheme-vars.liquid` outputs colour tokens only. In preset mode, `font-pairing-loader.liquid` loads all six pairing stylesheets because layout Liquid cannot list JSON template sections to dedupe URLs. The doc’s “Modern — Satoshi” pairing uses **Plus Jakarta Sans** in Google Fonts URLs (Satoshi is not on Google Fonts); stacks in Liquid must match `font-pairing-link.liquid`.

---

## Layer 1 — Color scheme group

In `config/settings_schema.json` under **Color schemes**: `color_mode`, optional **custom** colour pickers, **preset** `color_scheme_group` definitions, and **`global_color_scheme`** (which named preset applies store-wide). Merchants set semantic roles (background, text, buttons, etc.) directly on each scheme — there is no separate unused palette layer.

```json
{
  "name": "Color schemes",
  "settings": [
    {
      "type": "paragraph",
      "content": "Create colour schemes and assign them to individual sections. Each scheme defines a complete set of tokens for a visual style."
    },
    {
      "type": "color_scheme_group",
      "id": "color_schemes",
      "definition": [
        {
          "type": "header",
          "content": "Surface"
        },
        {
          "type": "color",
          "id": "background",
          "label": "Background",
          "default": "#ffffff"
        },
        {
          "type": "color",
          "id": "background_secondary",
          "label": "Background secondary",
          "default": "#f5f3ef"
        },
        {
          "type": "color",
          "id": "border",
          "label": "Border",
          "default": "#e8e6e1"
        },
        {
          "type": "header",
          "content": "Text"
        },
        {
          "type": "color",
          "id": "text",
          "label": "Body text",
          "default": "#1a1a1a"
        },
        {
          "type": "color",
          "id": "text_secondary",
          "label": "Secondary text",
          "default": "#9e9b96"
        },
        {
          "type": "color",
          "id": "heading",
          "label": "Heading",
          "default": "#0a0a0a"
        },
        {
          "type": "header",
          "content": "Accent"
        },
        {
          "type": "color",
          "id": "accent",
          "label": "Accent",
          "default": "#e85d30"
        },
        {
          "type": "color",
          "id": "accent_text",
          "label": "Text on accent",
          "default": "#ffffff"
        },
        {
          "type": "header",
          "content": "Button — primary"
        },
        {
          "type": "color",
          "id": "btn_primary_bg",
          "label": "Background",
          "default": "#1a1a1a"
        },
        {
          "type": "color",
          "id": "btn_primary_text",
          "label": "Label",
          "default": "#ffffff"
        },
        {
          "type": "color",
          "id": "btn_primary_border",
          "label": "Border",
          "default": "#1a1a1a"
        },
        {
          "type": "header",
          "content": "Button — secondary"
        },
        {
          "type": "color",
          "id": "btn_secondary_bg",
          "label": "Background",
          "default": "#ffffff"
        },
        {
          "type": "color",
          "id": "btn_secondary_text",
          "label": "Label",
          "default": "#1a1a1a"
        },
        {
          "type": "color",
          "id": "btn_secondary_border",
          "label": "Border",
          "default": "#1a1a1a"
        },
        {
          "type": "header",
          "content": "Typography"
        },
        {
          "type": "select",
          "id": "font_pairing",
          "label": "Font pairing",
          "options": [
            { "value": "classic",   "label": "Classic — Playfair Display + Inter" },
            { "value": "modern",    "label": "Modern — Satoshi + DM Sans" },
            { "value": "editorial", "label": "Editorial — Cormorant + Source Sans 3" },
            { "value": "geometric", "label": "Geometric — Outfit + Outfit" },
            { "value": "humanist",  "label": "Humanist — Fraunces + Nunito Sans" },
            { "value": "technical", "label": "Technical — Space Grotesk + IBM Plex Mono" }
          ],
          "default": "classic"
        }
      ],
      "role": {
        "background":          "background",
        "text":                "text",
        "primary_button":      "btn_primary_bg",
        "on_primary_button":   "btn_primary_text",
        "secondary_button":    "btn_secondary_bg",
        "on_secondary_button": "btn_secondary_text",
        "outline_button_label":"btn_secondary_text",
        "decorative":          "accent"
      }
    }
  ]
}
```

Shopify seeds three default schemes (`scheme-1`, `scheme-2`, `scheme-3`) when the theme is first installed. Merchant can create more from the theme editor — no code change needed.

---

## Layer 2 — Font registry

### Font pairing definitions

The registry lives in two snippets plus SCSS comments. Rules:

- **`snippets/font-pairing-loader.liquid`** is the **only** permitted render of the font-link pipeline. Call it **once**, inside **`<head>`** in **`layout/theme.liquid`**, **before** other stylesheets. It outputs two **`preconnect`** `<link>`s first (`fonts.googleapis.com`, `fonts.gstatic.com`), then loops and renders **`font-pairing-link`** so preconnect always precedes stylesheet requests.
- **`snippets/font-pairing-link.liquid`** must **never** be rendered from a section, another snippet, or outside `<head>`. Stylesheet `<link>` in `<body>` is invalid HTML and causes FOUC. Only the loader may call it.
- **`fonts.googleapis.com` / `fonts.gstatic.com`** are on Shopify’s theme CSP allowlist for Google Fonts — no `content_security_policy` changes needed while URLs stay there. If the font source moves (Adobe Fonts, Bunny Fonts, self-hosted, etc.), add the new host via **`layout/content_security_policy.liquid`** per [Shopify CSP for themes](https://shopify.dev/docs/storefronts/themes/architecture/layouts/content-security-policy); adding a `<link>` alone is not enough.

In this theme, preset mode loads **all** pairing stylesheets from the loader (layout Liquid cannot dedupe by “pairings in use”). Custom typography uses Shopify `font_face` in `snippets/css-variables.liquid` instead.

When adding a pairing slug, update **`font-pairing-link.liquid`**, the preset **`font_pairing`** options in **`config/settings_schema.json`**, the pairing `case` in **`snippets/css-variables.liquid`**, and the registry comment in **`src/styles/base/_fonts.scss`**.

### Font stacks in SCSS

**`src/styles/base/_fonts.scss`**

Maps each pairing slug to CSS custom property values. They are not hardcoded in SCSS — `--cs-font-*` are set on `:root` in `snippets/css-variables.liquid` (preset `case` or custom `font_picker`). This file documents which families belong to each role and applies base rules that consume those tokens.

```scss
// Font pairing registry
// Slug → (heading, body, mono) mapping.
// Actual --cs-font-* values are set in snippets/css-variables.liquid.
// Fallback stacks must match what font-pairing-link.liquid loads from Google Fonts.
//
// classic    Playfair Display  /  Inter           /  JetBrains Mono
// modern     Plus Jakarta Sans /  DM Sans         /  DM Mono
// editorial  Cormorant         /  Source Sans 3   /  Source Code Pro
// geometric  Outfit            /  Outfit          /  Space Mono
// humanist   Fraunces          /  Nunito Sans     /  Fira Code
// technical  Space Grotesk     /  Space Grotesk   /  IBM Plex Mono

body {
  font-family:      var(--cs-font-body);
  color:            var(--cs-text);
  background-color: var(--cs-background);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--cs-font-heading);
  color:       var(--cs-heading);
}

code, pre, kbd, samp {
  font-family: var(--cs-font-mono);
}
```

---

## Layer 3 — Consuming colours in a section

### Step 1 — No per-section colour setting

Store colours come only from **Theme settings** (`color_mode`, `global_color_scheme`, or `custom_color_*`). Do **not** add a `color_scheme` field to section schemas for store-wide colours.

### Step 2 — Render tokens on the section root

Use `color-scheme-vars` on the section’s outermost element. It injects the same theme-wide `--cs-*` values on every section (scoped to that root for inheritance).

```liquid
<div
  class="section-{{ section.id }} section-hero-slider"
  data-section-type="section-hero-slider"
  data-section-id="{{ section.id }}"
  {% render 'color-scheme-vars' %}
>
```

### Step 3 — Use `--cs-*` tokens in SCSS

All colour decisions inside a section use the scoped custom properties — never `settings.*` directly, never hardcoded hex.

```scss
.section-hero-slider {
  background-color: var(--cs-background);
  color:            var(--cs-text);
  border-color:     var(--cs-border);

  &__title {
    color: var(--cs-heading);
  }

  &__kicker {
    color: var(--cs-accent);
  }

  .btn--primary {
    background-color: var(--cs-btn-primary-bg);
    color:            var(--cs-btn-primary-text);
    border-color:     var(--cs-btn-primary-border);
  }

  .btn--secondary {
    background-color: var(--cs-btn-secondary-bg);
    color:            var(--cs-btn-secondary-text);
    border-color:     var(--cs-btn-secondary-border);
  }
}
```

---

## The color-scheme-vars snippet

**`snippets/color-scheme-vars.liquid`** maps theme settings to `--cs-*` on the element you attach it to. It takes **no parameters**: preset mode reads **`settings.global_color_scheme`** (with fallback to `scheme-1`); custom mode reads **`custom_color_*`**. Fonts are **not** set here — they come from **`snippets/css-variables.liquid`** on `:root`.

The snippet outputs only the `style="..."` fragment — use it inline on a section or group root opening tag.

---

## Section-level token overrides (the "tùy section" case)

Some sections need tokens that are not in the global scheme — for example a `section-split-hero` that has two panels each needing their own background. Handle this with **additional section settings** that extend the scheme locally.

```json
{
  "type": "header",
  "content": "Panel colours"
},
{
  "type": "color",
  "id": "panel_bg_override",
  "label": "Left panel background (overrides scheme)",
  "default": ""
}
```

In Liquid, apply the override after the scheme vars:

```liquid
{%- assign panel_bg = section.settings.panel_bg_override
    | default: settings.global_color_scheme.settings.background -%}

<div
  class="section-split-hero__panel"
  style="--cs-background: {{ panel_bg }};"
>
```

This pattern — scheme as default, setting as override — keeps the system composable without breaking the cascade.

---

## Global fallback in theme.liquid

Set scheme-1 as the page-level fallback so elements outside any section (header, footer, body) have a coherent colour base. In `layout/theme.liquid` inside `<head>`:

```liquid
{%- assign global_scheme = settings.color_schemes['scheme-1'] -%}
<style>
  :root {
    --cs-background:           {{ global_scheme.settings.background }};
    --cs-background-secondary: {{ global_scheme.settings.background_secondary }};
    --cs-border:               {{ global_scheme.settings.border }};
    --cs-text:                 {{ global_scheme.settings.text }};
    --cs-text-secondary:       {{ global_scheme.settings.text_secondary }};
    --cs-heading:              {{ global_scheme.settings.heading }};
    --cs-accent:               {{ global_scheme.settings.accent }};
    --cs-accent-text:          {{ global_scheme.settings.accent_text }};
    --cs-btn-primary-bg:       {{ global_scheme.settings.btn_primary_bg }};
    --cs-btn-primary-text:     {{ global_scheme.settings.btn_primary_text }};
    --cs-btn-primary-border:   {{ global_scheme.settings.btn_primary_border }};
    --cs-btn-secondary-bg:     {{ global_scheme.settings.btn_secondary_bg }};
    --cs-btn-secondary-text:   {{ global_scheme.settings.btn_secondary_text }};
    --cs-btn-secondary-border: {{ global_scheme.settings.btn_secondary_border }};
    --cs-font-heading:         "system-ui, sans-serif";
    --cs-font-body:            "system-ui, sans-serif";
    --cs-font-mono:            "monospace";
  }
</style>
```

Each section then overrides only the tokens it changes via the inline `style` attribute — the cascade does the rest.

---

## Header and footer schemes

Header and footer use the same snippet on their root element; they follow **`global_color_scheme`** or **custom** colours like every other section. To make the header visually different from the body, use a **local override** (extra section settings + inline `--cs-*`) rather than a separate global scheme picker per section.

```liquid
<header class="site-header" {% render 'color-scheme-vars' %}>
```

---

## Token reference

| CSS custom property | Scheme field | Usage |
|---|---|---|
| `--cs-background` | `background` | Section background, card backgrounds |
| `--cs-background-secondary` | `background_secondary` | Zebra rows, input backgrounds, hover states |
| `--cs-border` | `border` | Dividers, input borders, card borders |
| `--cs-text` | `text` | Body copy, captions, labels |
| `--cs-text-secondary` | `text_secondary` | Metadata, placeholders, helper text |
| `--cs-heading` | `heading` | h1–h4, display text |
| `--cs-accent` | `accent` | Badges, highlights, decorative elements, links |
| `--cs-accent-text` | `accent_text` | Text placed on accent-coloured backgrounds |
| `--cs-btn-primary-bg` | `btn_primary_bg` | Primary button fill |
| `--cs-btn-primary-text` | `btn_primary_text` | Primary button label |
| `--cs-btn-primary-border` | `btn_primary_border` | Primary button border |
| `--cs-btn-secondary-bg` | `btn_secondary_bg` | Ghost/secondary button fill |
| `--cs-btn-secondary-text` | `btn_secondary_text` | Ghost/secondary button label |
| `--cs-btn-secondary-border` | `btn_secondary_border` | Ghost/secondary button border |
| `--cs-font-heading` | `font_pairing` (computed) | Heading, display text — h1–h4 |
| `--cs-font-body` | `font_pairing` (computed) | Body copy, labels, captions |
| `--cs-font-mono` | `font_pairing` (computed) | Code blocks, monospaced UI |

---

## Rules agents must follow

- **Never use `settings.color_*` directly in a section.** Always go through a scheme.
- **Never hardcode hex values in SCSS or Liquid.** All colour decisions use `var(--cs-*)`.
- **Never define new `--cs-*` tokens** without adding them to both the `color_scheme_group` definition and the `color-scheme-vars` snippet.
- **Always use the `color-scheme-vars` snippet** on the outermost element of sections that participate in the layout — not on a child element.
- **Section-level overrides** (the panel pattern) are allowed for legitimate layout reasons. They are not a workaround for a missing token — if a token is missing, add it to the scheme definition.
- **Do not create per-section color settings** that duplicate scheme tokens (e.g. `"id": "hero_bg_color"` that just sets a background). Use the scheme system. Only add per-section colour settings for genuinely local needs (a second panel, an illustration fill, a decorative shape).
- **Never reference a font family string directly** in SCSS or Liquid. All font decisions use `var(--cs-font-heading)`, `var(--cs-font-body)`, or `var(--cs-font-mono)`.
- **When adding a new font pairing**, keep in sync: `color_scheme_group` select options, `font-pairing-link.liquid`, the preset `case` in `css-variables.liquid`, and `_fonts.scss` registry comment. Never call `font-pairing-link` except from `font-pairing-loader` in `<head>`.

---

## Checklist when adding a new section with colour support

- [ ] `{% render 'color-scheme-vars' %}` on section root (no per-section `color_scheme` schema setting)
- [ ] All colour decisions in SCSS use `var(--cs-*)` — no hardcoded hex, no `settings.*`
- [ ] If the section needs a token not in the standard set — added to `color_scheme_group` definition AND `color-scheme-vars` snippet
- [ ] Verified in theme editor: changing the scheme on this section updates all colours correctly
- [ ] Verified in theme editor: changing the font pairing updates `--cs-font-heading`, `--cs-font-body`, `--cs-font-mono` correctly
- [ ] `font-pairing-loader` snippet is present in `layout/theme.liquid` inside `<head>`
- [ ] New pairing slug (if added) exists in `font-pairing-link.liquid`, `css-variables.liquid` preset case, `_fonts.scss` registry comment, and `color_scheme_group` select options