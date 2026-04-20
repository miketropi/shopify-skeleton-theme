# Header — color schemes, logo retina & mobile logo

## Scope

This document covers three interconnected header features:

1. **Dual color schemes** — default scheme + transparent scheme (active when header overlaps a hero at scroll top)
2. **Retina logo** — 2x image for high-DPI screens
3. **Mobile logo** — separate logo for viewports `< 768px`, with its own retina variant

All three features share the same `color-scheme-vars` snippet and the same JS init flow defined in `HEADER-STICKY.md`. Read that document first.

---

## Mental model

```
Scroll position > header height
  → .site-header--scrolled class on wrapper
  → default color scheme active

Scroll position ≤ header height  (at top, overlapping hero)
  → no .site-header--scrolled
  → transparent color scheme active

Logo render priority (desktop):
  logo_retina set   → use logo_retina as src, logo as fallback srcset 1x
  logo set          → use logo only
  neither           → shop.name SVG text fallback

Logo render priority (< 768px):
  logo_mobile_retina set  → use logo_mobile_retina, logo_mobile as 1x
  logo_mobile set         → use logo_mobile only
  neither                 → fall through to desktop logo logic
```

---

## Schema settings

Add all settings below to `sections/header.liquid` schema, under a `"Theme"` header group. Order matters — Colour first, then Transparent colour, then Logo groups.

```json
{
  "type": "header",
  "content": "Colour"
},
{
  "type": "color_scheme",
  "id": "color_scheme",
  "label": "Colour",
  "info": "Applied when the header has a solid background.",
  "default": "scheme-1"
},
{
  "type": "color_scheme",
  "id": "color_scheme_transparent",
  "label": "Colour when transparent",
  "info": "Applied when the header overlaps a hero at the top of the page. Use a light scheme for dark hero images.",
  "default": "scheme-1"
},
{
  "type": "header",
  "content": "Logo"
},
{
  "type": "image_picker",
  "id": "logo",
  "label": "Logo"
},
{
  "type": "image_picker",
  "id": "logo_retina",
  "label": "Logo — retina",
  "info": "Optional 2× version for sharp display on high-DPI screens. Upload at double the intended display size."
},
{
  "type": "range",
  "id": "logo_width",
  "label": "Logo width",
  "info": "Sets the display width of the logo. Upload your retina logo at twice this value.",
  "min": 40,
  "max": 300,
  "step": 10,
  "unit": "px",
  "default": 120
},
{
  "type": "header",
  "content": "Mobile logo"
},
{
  "type": "image_picker",
  "id": "logo_mobile",
  "label": "Mobile logo",
  "info": "Shown on screens narrower than 768px. Falls back to the main logo if not set."
},
{
  "type": "image_picker",
  "id": "logo_mobile_retina",
  "label": "Mobile logo — retina",
  "info": "Optional 2× version of the mobile logo. Upload at double the intended mobile display size."
},
{
  "type": "range",
  "id": "logo_mobile_width",
  "label": "Mobile logo width",
  "info": "Sets the display width of the mobile logo.",
  "min": 24,
  "max": 200,
  "step": 4,
  "unit": "px",
  "default": 80
}
```

---

## Liquid — `sections/header.liquid`

### Root element

The header root element carries both scheme data attributes. JS reads `data-sticky`; CSS `:has()` reads both scheme attributes to swap tokens.

```liquid
{%- liquid
  assign scheme_default     = section.settings.color_scheme
  assign scheme_transparent = section.settings.color_scheme_transparent
-%}

<header
  class="site-header"
  data-section-type="header"
  data-section-id="{{ section.id }}"
  data-sticky="{{ section.settings.sticky_header }}"
  data-scheme-default="{{ scheme_default.id }}"
  data-scheme-transparent="{{ scheme_transparent.id }}"
  {{ section.shopify_attributes }}
>
```

### Logo snippet — `snippets/header-logo.liquid`

Extract logo rendering into a dedicated snippet. The snippet handles all four logo states: desktop, desktop retina, mobile, mobile retina — and falls back to `shop.name` when no image is set.

Create `snippets/header-logo.liquid`:

```liquid
{%- comment -%}
  Renders the header logo with retina and mobile variants.
  Falls back to shop.name as SVG text when no logo image is set.

  @param {Section} section - The header section object
{%- endcomment -%}

{%- liquid
  assign logo              = section.settings.logo
  assign logo_retina       = section.settings.logo_retina
  assign logo_width        = section.settings.logo_width
  assign logo_mobile       = section.settings.logo_mobile
  assign logo_mobile_retina = section.settings.logo_mobile_retina
  assign logo_mobile_width = section.settings.logo_mobile_width

  assign has_logo          = false
  assign has_logo_mobile   = false
  if logo != blank
    assign has_logo = true
  endif
  if logo_mobile != blank
    assign has_logo_mobile = true
  endif
-%}

<a href="{{ routes.root_url }}" class="header-logo" aria-label="{{ shop.name | escape }}">

  {%- if has_logo -%}

    {%- comment -%} Desktop logo {%- endcomment -%}
    <span class="header-logo__desktop">
      {%- if logo_retina != blank -%}
        {{
          logo
          | image_url: width: logo_width
          | image_tag:
            loading: 'eager',
            width: logo_width,
            height: 'auto',
            class: 'header-logo__img',
            srcset: logo | image_url: width: logo_width | append: ' 1x, ' | append: (logo_retina | image_url: width: logo_width | times: 2) | append: ' 2x'
        }}
      {%- else -%}
        {{
          logo
          | image_url: width: logo_width
          | image_tag:
            loading: 'eager',
            width: logo_width,
            height: 'auto',
            class: 'header-logo__img'
        }}
      {%- endif -%}
    </span>

    {%- comment -%} Mobile logo — falls back to desktop logo if not set {%- endcomment -%}
    <span class="header-logo__mobile">
      {%- if has_logo_mobile -%}
        {%- if logo_mobile_retina != blank -%}
          {{
            logo_mobile
            | image_url: width: logo_mobile_width
            | image_tag:
              loading: 'eager',
              width: logo_mobile_width,
              height: 'auto',
              class: 'header-logo__img',
              srcset: logo_mobile | image_url: width: logo_mobile_width | append: ' 1x, ' | append: (logo_mobile_retina | image_url: width: logo_mobile_width | times: 2) | append: ' 2x'
          }}
        {%- else -%}
          {{
            logo_mobile
            | image_url: width: logo_mobile_width
            | image_tag:
              loading: 'eager',
              width: logo_mobile_width,
              height: 'auto',
              class: 'header-logo__img'
          }}
        {%- endif -%}
      {%- else -%}
        {%- comment -%} No mobile logo — reuse desktop logo at mobile width {%- endcomment -%}
        {%- if logo_retina != blank -%}
          {{
            logo
            | image_url: width: logo_mobile_width
            | image_tag:
              loading: 'eager',
              width: logo_mobile_width,
              height: 'auto',
              class: 'header-logo__img',
              srcset: logo | image_url: width: logo_mobile_width | append: ' 1x, ' | append: (logo_retina | image_url: width: logo_mobile_width | times: 2) | append: ' 2x'
          }}
        {%- else -%}
          {{
            logo
            | image_url: width: logo_mobile_width
            | image_tag:
              loading: 'eager',
              width: logo_mobile_width,
              height: 'auto',
              class: 'header-logo__img'
          }}
        {%- endif -%}
      {%- endif -%}
    </span>

  {%- else -%}

    {%- comment -%} No logo image — SVG text fallback {%- endcomment -%}
    <span class="header-logo__text" aria-hidden="true">
      {{- shop.name | escape -}}
    </span>

  {%- endif -%}

</a>
```

Render the snippet inside `sections/header.liquid`:

```liquid
{%- render 'header-logo', section: section -%}
```

---

## SCSS — `src/styles/sections/_header.scss`

### Color scheme token injection

The wrapper carries both scheme token sets as CSS custom properties simultaneously. The active set is determined by the scrolled state.

```scss
// Default scheme tokens — always present, active when scrolled
.shopify-section:has(.site-header) {
  // Injected inline via color-scheme-vars snippet on <header>
  // Tokens: --cs-background, --cs-text, --cs-heading, etc.
}

// Transparent scheme tokens — scoped under a secondary data attribute
// Injected as --cs-t-* prefixed tokens when at scroll top
.site-header:not(.site-header--scrolled) {
  --cs-background:           var(--cs-t-background);
  --cs-background-secondary: var(--cs-t-background-secondary);
  --cs-border:               var(--cs-t-border);
  --cs-text:                 var(--cs-t-text);
  --cs-text-secondary:       var(--cs-t-text-secondary);
  --cs-heading:              var(--cs-t-heading);
  --cs-accent:               var(--cs-t-accent);
  --cs-accent-text:          var(--cs-t-accent-text);
  --cs-btn-primary-bg:       var(--cs-t-btn-primary-bg);
  --cs-btn-primary-text:     var(--cs-t-btn-primary-text);
  --cs-btn-primary-border:   var(--cs-t-btn-primary-border);
  --cs-btn-secondary-bg:     var(--cs-t-btn-secondary-bg);
  --cs-btn-secondary-text:   var(--cs-t-btn-secondary-text);
  --cs-btn-secondary-border: var(--cs-t-btn-secondary-border);
  --cs-font-heading:         var(--cs-t-font-heading);
  --cs-font-body:            var(--cs-t-font-body);
  --cs-font-mono:            var(--cs-t-font-mono);
}

// Sticky wrapper
.shopify-section:has(.site-header[data-sticky='always']),
.shopify-section:has(.site-header[data-sticky='scroll-up']) {
  position: sticky;
  top: 0;
  z-index: 100;
}

.shopify-section:has(.site-header[data-sticky='scroll-up']) {
  transition: transform 0.3s ease;

  &.shopify-section--header-hidden {
    transform: translateY(-100%);
  }
}

// Background transition between transparent and solid
.site-header {
  background-color: var(--cs-background);
  color: var(--cs-text);
  transition:
    background-color 0.25s ease,
    color 0.2s ease;
}
```

### Logo responsive visibility

```scss
.header-logo {
  display: block;
  flex-shrink: 0;
  text-decoration: none;

  &__img {
    display: block;
    width: var(--logo-width);
    height: auto;
  }

  &__desktop {
    display: block;

    @media (max-width: 767px) {
      display: none;
    }
  }

  &__mobile {
    display: none;

    @media (max-width: 767px) {
      display: block;
    }
  }

  &__text {
    display: block;
    font-family: var(--cs-font-heading);
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--cs-heading);
    white-space: nowrap;
  }
}
```

Logo width is injected as a CSS custom property from Liquid, not hardcoded:

```liquid
{%- comment -%} In sections/header.liquid, on the root <header> element's style attribute {%- endcomment -%}
style="
  --logo-width: {{ section.settings.logo_width }}px;
  --logo-mobile-width: {{ section.settings.logo_mobile_width }}px;
"
```

Update `header-logo.liquid` to use these tokens on `.header-logo__img`:

```scss
.header-logo {
  &__desktop .header-logo__img {
    width: var(--logo-width);
  }

  &__mobile .header-logo__img {
    width: var(--logo-mobile-width);
  }
}
```

---

## Update `snippets/color-scheme-vars.liquid`

The snippet needs a second output mode for the transparent scheme. Add an optional `prefix` parameter — when `prefix` is set, all tokens are output as `--cs-t-*` instead of `--cs-*`.

```liquid
{%- comment -%}
  Renders inline CSS custom properties for a color scheme.

  @param {ColorScheme} scheme  - The color_scheme object from section.settings
  @param {String}      prefix  - Optional. When 'transparent', outputs --cs-t-* tokens.
{%- endcomment -%}

{%- liquid
  assign s = scheme.settings
  assign p = '--cs-'
  if prefix == 'transparent'
    assign p = '--cs-t-'
  endif

  case s.font_pairing
    when 'classic'
      assign cs_font_heading = "'Playfair Display', Georgia, serif"
      assign cs_font_body    = "'Inter', system-ui, sans-serif"
      assign cs_font_mono    = "'JetBrains Mono', monospace"
    when 'modern'
      assign cs_font_heading = "'Plus Jakarta Sans', system-ui, sans-serif"
      assign cs_font_body    = "'DM Sans', system-ui, sans-serif"
      assign cs_font_mono    = "'DM Mono', monospace"
    when 'editorial'
      assign cs_font_heading = "'Cormorant', Georgia, serif"
      assign cs_font_body    = "'Source Sans 3', system-ui, sans-serif"
      assign cs_font_mono    = "'Source Code Pro', monospace"
    when 'geometric'
      assign cs_font_heading = "'Outfit', system-ui, sans-serif"
      assign cs_font_body    = "'Outfit', system-ui, sans-serif"
      assign cs_font_mono    = "'Space Mono', monospace"
    when 'humanist'
      assign cs_font_heading = "'Fraunces', Georgia, serif"
      assign cs_font_body    = "'Nunito Sans', system-ui, sans-serif"
      assign cs_font_mono    = "'Fira Code', monospace"
    when 'technical'
      assign cs_font_heading = "'Space Grotesk', system-ui, sans-serif"
      assign cs_font_body    = "'Space Grotesk', system-ui, sans-serif"
      assign cs_font_mono    = "'IBM Plex Mono', monospace"
    else
      assign cs_font_heading = "system-ui, sans-serif"
      assign cs_font_body    = "system-ui, sans-serif"
      assign cs_font_mono    = "monospace"
  endcase
-%}style="
  {{ p }}background:           {{ s.background }};
  {{ p }}background-secondary: {{ s.background_secondary }};
  {{ p }}border:               {{ s.border }};
  {{ p }}text:                 {{ s.text }};
  {{ p }}text-secondary:       {{ s.text_secondary }};
  {{ p }}heading:              {{ s.heading }};
  {{ p }}accent:               {{ s.accent }};
  {{ p }}accent-text:          {{ s.accent_text }};
  {{ p }}btn-primary-bg:       {{ s.btn_primary_bg }};
  {{ p }}btn-primary-text:     {{ s.btn_primary_text }};
  {{ p }}btn-primary-border:   {{ s.btn_primary_border }};
  {{ p }}btn-secondary-bg:     {{ s.btn_secondary_bg }};
  {{ p }}btn-secondary-text:   {{ s.btn_secondary_text }};
  {{ p }}btn-secondary-border: {{ s.btn_secondary_border }};
  {{ p }}font-heading:         {{ cs_font_heading }};
  {{ p }}font-body:            {{ cs_font_body }};
  {{ p }}font-mono:            {{ cs_font_mono }};
"
```

### Usage in `sections/header.liquid`

Both schemes are injected on the root `<header>` element — default scheme as `--cs-*`, transparent scheme as `--cs-t-*`. CSS swaps between them based on scroll state.

```liquid
<header
  class="site-header"
  data-section-type="header"
  data-section-id="{{ section.id }}"
  data-sticky="{{ section.settings.sticky_header }}"
  {% render 'color-scheme-vars',
    scheme: section.settings.color_scheme %}
  {%- comment -%}
    Transparent tokens appended to same style attribute.
    color-scheme-vars outputs style="..." so we close and reopen
    to merge — or use a capture block.
  {%- endcomment -%}
>
```

Because `color-scheme-vars` outputs a full `style="..."` attribute, merging two calls on one element requires a `capture` block:

```liquid
{%- capture scheme_styles -%}
  {%- render 'color-scheme-vars', scheme: section.settings.color_scheme -%}
{%- endcapture -%}
{%- capture scheme_transparent_styles -%}
  {%- render 'color-scheme-vars', scheme: section.settings.color_scheme_transparent, prefix: 'transparent' -%}
{%- endcapture -%}

{%- comment -%}
  Strip the style="..." wrapper from both captures and merge into one attribute.
{%- endcomment -%}
{%- assign default_vars     = scheme_styles | remove: 'style="' | remove: '"' -%}
{%- assign transparent_vars = scheme_transparent_styles | remove: 'style="' | remove: '"' -%}

<header
  class="site-header"
  data-section-type="header"
  data-section-id="{{ section.id }}"
  data-sticky="{{ section.settings.sticky_header }}"
  style="
    --logo-width: {{ section.settings.logo_width }}px;
    --logo-mobile-width: {{ section.settings.logo_mobile_width }}px;
    {{ default_vars }}
    {{ transparent_vars }}
  "
  {{ section.shopify_attributes }}
>
```

---

## TypeScript — update `src/scripts/sections/header.ts`

Add transparent state management to the existing init function:

```typescript
export function init(container: HTMLElement): void {
  const wrapper = container.closest<HTMLElement>('.shopify-section')

  // --header-height for other sections to consume
  const resizeObserver = new ResizeObserver(() => {
    document.documentElement.style.setProperty(
      '--header-height',
      `${container.offsetHeight}px`
    )
  })
  resizeObserver.observe(container)

  // Transparent ↔ solid state — based on scroll position vs header height
  const updateTransparentState = () => {
    const atTop = window.scrollY < container.offsetHeight
    container.classList.toggle('site-header--scrolled', !atTop)
  }

  updateTransparentState()
  window.addEventListener('scroll', updateTransparentState, { passive: true })

  // Scroll-up hide — only when sticky mode is scroll-up
  const mode = container.dataset.sticky
  if (mode !== 'scroll-up' || !wrapper) return

  let lastY = window.scrollY

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY
      const scrollingDown = y > lastY && y > container.offsetHeight
      wrapper.classList.toggle('shopify-section--header-hidden', scrollingDown)
      lastY = y
    },
    { passive: true }
  )
}

export function destroy(container: HTMLElement): void {
  const wrapper = container.closest<HTMLElement>('.shopify-section')
  wrapper?.classList.remove('shopify-section--header-hidden')
  container.classList.remove('site-header--scrolled')
  document.documentElement.style.removeProperty('--header-height')
}
```

---

## Token flow summary

```
section.settings.color_scheme         → --cs-*   (default, active when scrolled)
section.settings.color_scheme_transparent → --cs-t-* (active when at top / transparent)

.site-header:not(.site-header--scrolled) {
  swaps all --cs-* to reference --cs-t-* via CSS aliases
}

JS adds .site-header--scrolled when window.scrollY > header height
JS removes .site-header--scrolled when window.scrollY ≤ header height
CSS transition handles the visual swap between the two states
```

---

## Checklist

- [ ] `color_scheme` and `color_scheme_transparent` both added to header schema
- [ ] `logo`, `logo_retina`, `logo_width` settings added
- [ ] `logo_mobile`, `logo_mobile_retina`, `logo_mobile_width` settings added
- [ ] `snippets/header-logo.liquid` created with all four logo states and `shop.name` fallback
- [ ] `snippets/color-scheme-vars.liquid` updated with `prefix` parameter support
- [ ] Both scheme token sets merged into one `style` attribute via `capture` blocks
- [ ] `--logo-width` and `--logo-mobile-width` injected in same `style` attribute
- [ ] `.site-header--scrolled` toggled by JS based on `window.scrollY`
- [ ] CSS swaps `--cs-*` to reference `--cs-t-*` when `.site-header--scrolled` is absent
- [ ] `background-color` and `color` transitions set on `.site-header` for smooth swap
- [ ] `.header-logo__desktop` hidden below 768px, `.header-logo__mobile` shown
- [ ] Verified: at page top, transparent scheme tokens are active
- [ ] Verified: after scrolling past header height, default scheme tokens are active
- [ ] Verified: retina logo renders sharp on a high-DPI display (use browser DevTools device emulation)
- [ ] Verified: mobile logo appears correctly below 768px
- [ ] Verified: `shop.name` fallback renders when no logo is uploaded