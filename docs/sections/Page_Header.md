# Page Header

> **Status:** **Implemented** — `sections/section-page-header.liquid`, `snippets/page-header-*.liquid`, `_section-page-header.scss`, `section-page-header.ts` + runtime, `hero-parallax.ts`.

> Full-width page header: breadcrumb, page title, and short description over a solid, image, or video background with optional parallax. Intended as the **first section** on generic pages and other templates that do not already ship a template-bound hero (`main-page`, `section-contact-form`, About, FAQ, etc.).

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = **page intro hero** only (breadcrumb + title + short description + background). No forms, product grids, or body copy. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: **`sections/section-page-header.liquid`**. BEM root: **`page-header`**. Interactive (parallax, media load): **`data-section-type="section-page-header"`**. SCSS: **`src/styles/sections/_section-page-header.scss`**. TS: **`src/scripts/sections/section-page-header.ts`** (+ optional **`section-page-header.runtime.ts`** if bundle stays thin). Register in **`theme.ts`** before **`bootSections()`**. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | **`{% render 'section-styles', section: section %}`** + **`shopify-section-wrapper`** on the section root for merchant padding/margin/background/border — **in addition to** hero min-height and full-bleed media. See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. **Do not** use standalone `section_padding_top` / `section_padding_bottom` only. |
| **Colour** | Prefer **`section_color_scheme_mode`** (`default` \| `custom`) + **`color_scheme`** + **`{% render 'color-scheme-vars', scheme: … %}`** on the root. Text/breadcrumb colours come from **`--cs-heading`**, **`--cs-text`**, **`--cs-text-secondary`** by default. Optional merchant overrides (`heading_color`, `breadcrumb_color`) as root CSS vars with **clear = scheme** — **do not** hard-code `#1A1A1A` / `#999999` in SCSS. Overlay: **`color-mix`** from overlay colour + opacity setting. See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Typography** | Page title uses shared **`section-intro__heading`** + root modifier **`section-intro--heading-{{ heading_size }}`** (`small` \| `medium` \| `large` \| `xlarge`). Description uses **`var(--font-size-base, …)`** and theme line-height tokens. See `.cursor/rules/scss-styles.mdc` and *Product-slider family* in `.cursor/rules/liquid-patterns.mdc`. |
| **Full width** | **`full_width`** checkbox (default **`true`**) — edge-to-edge background media; inner content uses **`section-content-width`** when full-width is on (same contract as product slider / trust bar). |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Prefer **`mq-up('md')` / `mq-up('lg')`** — **not** 767px / 1024px literals from the original draft. |
| **JS-driven UI** | **Parallax** and **video/image hero** need JS registration: loading/reveal until media is ready (poster / first frame), optional merchant **`entrance_animate_on_scroll`** (default on) for soft GSAP intro of text — see `.cursor/rules/liquid-patterns.mdc` → *JS-driven UI*. **`prefers-reduced-motion`**: disable parallax and shorten/skip entrance. Teardown: **`AbortController`**, cancel rAF, reset transforms in **`destroy()`**. |
| **Parallax reuse** | Mirror existing patterns: **`src/scripts/mcol-hero-parallax.ts`** (collection hero), **`section-hero-slider.runtime.ts`** (`data-hero-parallax`). Prefer extracting a small shared helper (e.g. **`src/scripts/lib/hero-parallax.ts`**) rather than a third one-off scroll loop. Intensity maps to a **`data-page-header-parallax-intensity`** attribute (px), not hard-coded `30`. |
| **Locales** | Schema → **`t:sections.page_header.*`** in **`locales/en.default.schema.json`**; storefront strings (breadcrumb aria, home label, success N/A) in **`locales/en.default.json`**. |
| **Schema constraints** | Use **`checkbox`** (not `toggle`), **`image_picker`**, **`video`**, **`range`** with min/max/step. Reuse **section-styles** setting ids from **`snippets/section-styles.liquid`**. |
| **Theme Check** | `npm run check` after Liquid; `npm run build` after TS/SCSS. |

**Not the same section as:**

| Existing | Difference |
| --- | --- |
| **`main-collection`** hero (`mcol__hero`) | Template-bound PLP hero tied to **`collection`** + filters/grid. Keep unless a later refactor deduplicates media/parallax into a shared snippet. |
| **`main-blog`** hero (`mblog__hero`) | Template-bound blog list hero + tag filters. |
| **`main-page`** title block | Plain title + **`page.content`** — no background band. When Page Header is used, set **`show_title: false`** on **`main-page`** to avoid duplicate H1. |
| **`section-hero-slider`** | Marketing carousel with slides/blocks — not page-context breadcrumbs. |
| **`main-article`** breadcrumb | In-article chrome inside PDP/article layout — different IA; may share a **`page-header-breadcrumb`** snippet later. |

---

## Template placement (OS 2.0)

Page Header is a **reusable `section-*`** band merchants can add/reorder in the theme editor. Typical JSON template shape:

| Template | Suggested `order` | Notes |
| --- | --- | --- |
| **`page.contact.json`** | `page_header` → `main` → `form` | **`main-page`**: `show_title: false`; body copy only. **`section-contact-form`**: form below. |
| **`page.json`** / **`page.<handle>.json`** | `page_header` → `main` | Generic static pages. |
| **`cart.json`**, **`search.json`**, **`list-collections.json`** | Optional first section | Only when design calls for a hero strip; otherwise omit. |
| **`collection.json`**, **`blog.json`**, **`product.json`**, **`article.json`** | **Do not add by default** | These **`main-*`** sections already own hero/breadcrumb UX. |

---

## Layout (target UX)

| Region | Content |
| --- | --- |
| **Background layer** | Solid scheme background, **`image_picker`**, or **`video`** (muted, loop, playsinline) with optional overlay scrim. |
| **Content stack** | Optional breadcrumb → **one `<h1>`** (page title or custom) → optional description paragraph. |
| **Positioning** | Merchant **`content_position`** within the hero frame (grid / flex alignment). |

**No blocks** — single-instance section; all config in section settings.

---

## Liquid context — heading & description sources

Auto-resolve from template context when source is **`page`** / **`page_description`**; fall back gracefully when data is missing.

| `request.page_type` | Heading when `heading_source: page` | Description when `description_source: page` |
| --- | --- | --- |
| **`page`** | `page.title` | **No native Liquid meta-description field.** Use **`page.content \| strip_html \| truncatewords: 40`** for a short excerpt, or document optional future metafield. Prefer **`custom_description`** when merchants need SEO copy distinct from body. |
| **`collection`** | `collection.title` | `collection.description` (strip HTML) |
| **`blog`** | `blog.title` | Empty unless **`custom_description`** — blogs have no description field. |
| **`article`** | `article.title` | `article.excerpt` or truncated stripped content |
| **`search`** | Translation key e.g. **`page_header.search_title`** | Optional custom / translation |
| **Other** | **`custom_heading`** or shop name fallback | **`custom_description`** or hide region |

**Breadcrumb** — auto-generated from context (Home → … → current). Reuse patterns from **`snippets/pdp-breadcrumbs.liquid`** and **`main-article.liquid`** (`marticle__breadcrumb`). Extract to **`snippets/page-header-breadcrumb.liquid`** with params: `separator`, optional `color` vars. Only **`breadcrumb_separator`** is merchant-configured.

---

## Section settings (functional spec)

### Content

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_breadcrumb` | checkbox | `true` | Show breadcrumb above the title. |
| `breadcrumb_separator` | text | `/` | Separator between crumb items (`/`, `›`, `·`). Render with `aria-hidden="true"` between items; list semantics via `<ol>`. |
| `heading_source` | select | `page` | `page` — context title (see table above). `custom` — **`custom_heading`**. |
| `custom_heading` | text | _(empty)_ | Used when **`heading_source`** is `custom`. |
| `heading_size` | select | `large` | `small` \| `medium` \| `large` \| `xlarge` — **`section-intro--heading-*`** on root. |
| `description_source` | select | `page` | `page` — context description/excerpt (see table). `custom` — **`custom_description`**. |
| `custom_description` | inline_richtext | _(empty)_ | Custom copy or **dynamic source** (page/shop metafields). Renders as rich text; if empty, the description is hidden. |
| `description_max_width` | range | `480` | Max width of description in px. Min 320, max 800, step 40 → **`--page-header-desc-max`** on root. |
| `content_position` | select | `bottom-left` | `top-left` \| `middle-left` \| `bottom-left` \| `middle-center` \| `bottom-center` — positions content block inside hero. |

### Background & media

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `background_type` | select | `color` | `color` \| `image` \| `video`. |
| `background_image` | image_picker | — | When **`background_type`** is `image`, or **video poster / mobile fallback**. Recommend ≥ 1920×800. |
| `background_video` | video | — | When **`background_type`** is `video`. Muted, loop, **`playsinline`**. |
| `image_position` | select | `center center` | Focal point for image/video: `center center`, `top center`, `bottom center`, `left center`, `right center` → CSS `object-position`. |
| `enable_parallax` | checkbox | `false` | Parallax on image/video only. Off when **`prefers-reduced-motion`**, below **`md`**, or **`background_type: color`**. |
| `parallax_intensity` | range | `30` | Shift range in px. Min 10, max 80, step 10. Maps to **`data-page-header-parallax-intensity`**. |

**Removed from original spec (use theme patterns instead):**

| Original | Replacement |
| --- | --- |
| `background_color` hex `#F5F0EB` | **`color_scheme`** / **`--cs-background`**; optional **section-styles** `background_color` for band fill. |
| `text_color`, `breadcrumb_color` hex defaults | Scheme tokens + optional **`heading_color`** / **`breadcrumb_color`** overrides (clear = scheme). |
| `section_padding_top` / `section_padding_bottom` | **section-styles** `padding_*` (four sides) + hero **`section_height`** min-height. |

### Overlay

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_overlay` | checkbox | `false` | Scrim over image/video for text contrast. |
| `overlay_color` | color | `#000000` | Base overlay colour. |
| `overlay_opacity` | range | `20` | 0–80 (%). Applied via **`color-mix`** or alpha on scrim element. |

### Size, layout & colour

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `section_height` | select | `medium` | `small` (~200px) \| `medium` (~320px) \| `large` (~480px) \| `fullscreen` (`100vh` / `100dvh`) → CSS vars on root. |
| `full_width` | checkbox | `true` | Full-bleed background; content in **`section-content-width`**. |
| `section_color_scheme_mode` | select | `default` | `default` \| `custom`. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. |
| `heading_color` | color | clear | Optional title override. |
| `breadcrumb_color` | color | clear | Optional crumb override; clear uses **`--cs-text-secondary`**. |
| `entrance_animate_on_scroll` | checkbox | `true` | GSAP fade/slide of content stack when hero enters viewport. |
| *(shell)* | — | — | **`padding_*`**, **`margin_*`**, **`background_color`**, **`border_*`**, corner radii from **section-styles**. |

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Replace legacy 767px / 1024px from the original draft.

| Concern | `< md` (&lt; 48em) | `md+` (≥ 48em) |
| --- | --- | --- |
| **Section height** | **`auto`** min-height (content-driven); avoid fixed 200–480px traps on small screens | As **`section_height`** preset |
| **Parallax** | **Disabled** (performance) | Active when enabled + reduced motion off |
| **Content position** | **`bottom-left`** (fixed) or simplified stack | As configured |
| **Description max width** | `100%` | As **`description_max_width`** |
| **Video background** | Hide `<video>`; show **`background_image`** or scheme **`--cs-background`** | Video plays when **`background_type: video`** |

> **Mobile:** Parallax off below **`md`**. Video hidden on small viewports; poster image or solid scheme fallback required for acceptable LCP.

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **Page outline** | Exactly **one `<h1>`** in this section when it is the page intro; downstream sections (`main-page`, contact form) must **not** repeat the page title. |
| **Breadcrumb** | `<nav aria-label="{{ 'page_header.breadcrumb' \| t }}">` + `<ol>`; current page **`aria-current="page"`**; separator decorative (`aria-hidden="true"`). |
| **Background video** | **`muted`**, **`playsinline`**, no audio; decorative → **`aria-hidden="true"`** on media wrapper if title/description carry meaning. |
| **Contrast** | Encourage **`show_overlay`** when text sits on photography; validate against scheme tokens. |
| **Reduced motion** | No parallax; instant or minimal entrance. |
| **Focus** | Content stack remains tabbable; no `pointer-events: none` on links in breadcrumb. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-page-header.liquid` |
| Snippets | `snippets/page-header-breadcrumb.liquid`, optional `snippets/page-header-media.liquid` |
| Styles | `src/styles/sections/_section-page-header.scss` |
| Scripts | `src/scripts/sections/section-page-header.ts`, optional `section-page-header.runtime.ts` |
| Shared | `src/scripts/lib/hero-parallax.ts` (extract from `mcol-hero-parallax.ts` / hero slider) |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.page_header` in `en.default.schema.json` + `page_header.*` in `en.default.json` |
| Templates | Wire into `templates/page.contact.json`, `templates/page.json`, etc. |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.page_header.*`**, merge **section-styles**, and follow schema constraints above. Structural hint only:

```json
{
  "name": "t:sections.page_header.name",
  "tag": "section",
  "class": "section-page-header",
  "disabled_on": { "groups": ["header", "footer"] },
  "settings": [
    { "type": "header", "content": "t:sections.page_header.headers.content" },
    { "type": "checkbox", "id": "show_breadcrumb", "default": true },
    { "type": "text", "id": "breadcrumb_separator", "default": "/" },
    { "type": "select", "id": "heading_source", "default": "page" },
    { "type": "text", "id": "custom_heading" },
    { "type": "select", "id": "heading_size", "default": "large" },
    { "type": "select", "id": "description_source", "default": "page" },
    { "type": "textarea", "id": "custom_description" },
    { "type": "range", "id": "description_max_width", "min": 320, "max": 800, "step": 40, "default": 480 },
    { "type": "select", "id": "content_position", "default": "bottom-left" },
    { "type": "header", "content": "t:sections.page_header.headers.background" },
    { "type": "select", "id": "background_type", "default": "color" },
    { "type": "image_picker", "id": "background_image" },
    { "type": "video", "id": "background_video" },
    { "type": "select", "id": "image_position", "default": "center center" },
    { "type": "checkbox", "id": "enable_parallax", "default": false },
    { "type": "range", "id": "parallax_intensity", "min": 10, "max": 80, "step": 10, "default": 30 },
    { "type": "header", "content": "t:sections.page_header.headers.overlay" },
    { "type": "checkbox", "id": "show_overlay", "default": false },
    { "type": "color", "id": "overlay_color", "default": "#000000" },
    { "type": "range", "id": "overlay_opacity", "min": 0, "max": 80, "step": 5, "default": 20 },
    { "type": "header", "content": "t:sections.page_header.headers.layout" },
    { "type": "select", "id": "section_height", "default": "medium" },
    { "type": "checkbox", "id": "full_width", "default": true },
    { "type": "checkbox", "id": "entrance_animate_on_scroll", "default": true },
    { "type": "header", "content": "t:sections.page_header.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "default": "scheme-6" },
    { "type": "color", "id": "heading_color", "default": "rgba(0,0,0,0)" },
    { "type": "color", "id": "breadcrumb_color", "default": "rgba(0,0,0,0)" }
  ],
  "presets": [{ "name": "t:sections.page_header.presets.name" }]
}
```

> Merge **section-styles** settings after colour headers — same order as **`section-trust-bar.liquid`** / **`section-contact-form.liquid`**.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/SECTION_REGISTRY.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `.cursor/rules/liquid-patterns.mdc`.
2. Liquid: `section-styles` + `shopify-section-wrapper`; `page-header` root; `data-section-type` / `data-section-id`; `data-page-header-*` hooks for parallax, entrance, background type.
3. Snippets: breadcrumb partial; media partial (image + video + poster fallback).
4. SCSS: mobile-first; `mq-up('md')`; height presets as CSS vars; `section-intro__heading`; overlay scrim; **`overflow: hidden`** on hero clip for parallax.
5. TS: `registerSection('section-page-header', …)`; rAF scroll parallax (shared helper); optional GSAP entrance; **`destroy()`** cleanup; respect **`prefers-reduced-motion`**.
6. Locales: `sections.page_header` + storefront `page_header.*`.
7. Templates: update **`page.contact.json`** — add section, set **`main-page.show_title: false`**.
8. `npm run check` + `npm run build`.

---

## Implementation notes

- **Parallax:** `transform: translate3d` on media target inside **`overflow: hidden`** hero; rAF-throttled scroll handler (see **`mcol-hero-parallax.ts`**). Intensity setting scales shift range — do not hard-code `30px`.
- **Video:** Require **`background_image`** as poster / mobile fallback. Pattern: image layer behind or instead of `<video>` on `< md` (match **`main-collection`** / **`main-blog`** hero video markup).
- **Loading → reveal:** Hide or skeleton hero until poster/first image decodes; then reveal content (optional GSAP) — same *JS-driven UI* contract as carousels.
- **No duplicate titles:** Document in theme editor info: when Page Header is first, disable **`main-page`** title on that template.
- **Editor:** `window.Shopify.designMode` — shorten entrance delays; parallax may be simplified in editor preview.
- **Progressive enhancement:** Color-only hero works without JS; image background works without JS; parallax and entrance are enhancements only.
