# Rough Notation (integration guide — Skeleton Theme)

**Status:** Implemented. The [`rough-notation`](https://www.npmjs.com/package/rough-notation) package is listed in `package.json`. Logic lives in `src/scripts/rough-notation.ts` (imported from `src/scripts/theme.ts`), styles in `src/styles/components/_rough-notation.scss`, and the production bundle is `assets/theme.js` after `npm run build`. A global shim is available as `window.AnnotatedText` for AJAX or manual refresh. There is no Liquid IIFE snippet on purpose—this matches the theme’s Vite pipeline.

**Caveat:** `data-arn-threshold` is read per container but the shared `IntersectionObserver` currently uses `ROUGH_NOTATION_DEFAULTS.threshold` only. If you need different thresholds per subtree, extend the observer setup in `rough-notation.ts`.

Hand-drawn SVG annotation effects (underline, circle, highlight, box, strikethrough, bracket, etc.) that can animate on scroll, driven by shortcodes inside HTML/rich text.

---

## How this theme loads JavaScript (relevant to implementation)

- **Single bundle:** `layout/theme.liquid` loads `assets/theme.js` as a **deferred ES module** (`type="module"`). The source entry is `src/scripts/theme.ts` (Vite).
- **Section lifecycle:** Interactive sections register via `registerSection()` in `src/scripts/section-registry.ts`. The registry listens for `shopify:section:load` / `shopify:section:unload` and inits/destroys by `data-section-type` + `data-section-id`.
- **Styles:** Feature CSS belongs in `src/styles/**` and is pulled in through `src/styles/theme.scss`, not ad-hoc `assets/section-*.css` files (unless you deliberately add a static asset).

**Implication:** Prefer a **`src/scripts/rough-notation.ts` (or similar)** module imported from `theme.ts`, plus optional SCSS in `src/styles/components/`. A large inline IIFE in `snippets/rough-notation-global.liquid` is possible but **does not** match this project’s usual pattern.

---

## Architecture (as implemented)

```
┌─────────────────────────────────────────────────────────────────┐
│  layout/theme.liquid                                             │
│  └─ <script type="module" src="{{ 'theme.js' | asset_url }}">   │
│                                                                 │
│  src/scripts/theme.ts                                          │
│  └─ import { initRoughNotation, … } from './rough-notation'    │
│     ├─ DOMContentLoaded (or immediate): scan containers         │
│     ├─ IntersectionObserver → RoughNotation.annotate().show() │
│     ├─ document: shopify:section:load → re-scan / target tree   │
│     └─ Optional: export for AJAX / modals                       │
├─────────────────────────────────────────────────────────────────┤
│  sections/annotated.liquid                                      │
│  └─ data-annotated-text + richtext setting; editor help below  │
│     the field (no registerSection — init is global)             │
├─────────────────────────────────────────────────────────────────┤
│  Optional: src/styles/components/_rough-notation.scss           │
│  └─ .arn-* / pending visibility (FOUC) — imported via theme.scss│
└─────────────────────────────────────────────────────────────────┘
```

### Rough Notation dependency

- Add **`rough-notation`** to `package.json` and import it from the new module, **or** load the library from a CDN in a small loader (less consistent with this repo).
- Version/size claims in older drafts (e.g. “0.5.1 / 3.8kb gzip”) should be re-verified against the version you pin.

---

## Shortcode syntax

Same idea as typical shortcode systems (document for authors/merchants):

### Basic

```
[TYPE]text to annotate[/TYPE]
```

### With color

```
[TYPE color=#HEX]text to annotate[/TYPE]
```

### Types

| Shortcode | Effect | Rough Notation type |
|-----------|--------|---------------------|
| `[underline]…[/underline]` | Hand-drawn underline | `underline` |
| `[circle]…[/circle]` | Circle around text | `circle` |
| `[highlight]…[/highlight]` | Highlighter | `highlight` |
| `[box]…[/box]` | Box | `box` |
| `[strike]…[/strike]` | Strikethrough | `strike-through` |
| `[bracket]…[/bracket]` | Brackets | `bracket` |
| `[crossed-off]…[/crossed-off]` | Crossed-off | `crossed-off` |

### Examples (unchanged semantics)

```
Enjoy [highlight color=#FFEB3B]free shipping[/highlight] on all orders
We [underline]handpick every ingredient[/underline] …
[strike color=#999]$99[/strike] Now [circle]$49[/circle]
```

---

## Auto-discovery: selectors that match **this** codebase

Replace Dawn-oriented class names with **Skeleton** equivalents. Anything with Shopify’s usual **`.rte`** wrapper is a good candidate **if** merchants can enter shortcodes and they survive as plain text in HTML (rich text fields often strip unknown syntax — validate per field).

| Selector / hook | Where it appears in Skeleton (examples) |
|-------------------|----------------------------------------|
| `[data-annotated-text]` | Explicit opt-in wrapper you add around any block |
| `.rte` | Shared rich-text wrapper (many sections/snippets) |
| `.main-product__description` / `.main-product__tab-rte` / `.main-product__accordion-body` | PDP description & tabs (`snippets/pdp-*`, `sections/main-product.liquid`) |
| `.main-product__block--richtext` | Product media column rich text block |
| `.marticle__body` | Article body (`sections/main-article.liquid`, also `data-marticle-body`) |
| `.marticle__comment-content` | Comment bodies |
| `.main-page__content` | Static pages (`sections/main-page.liquid`) |
| `.mcol__desc` | Collection description (`sections/main-collection.liquid`) |
| `.hero-slide__body` | Hero slider slide copy (`sections/section-hero-slider.liquid`) |
| `.section-feature-grid__subheading` / `__item-text` | Feature grid (`sections/section-feature-grid.liquid`) |
| `.scrolling-promotion__text` | Scrolling promotion text items |
| `.header__drawer-block-body` | Header drawer rich text block |
| `.htbar__loc-notice-body` | Header top bar localization notice (if shortcodes ever allowed there) |

**Note:** Shortcodes in **inline_richtext** or sanitized admin fields may never reach the storefront. Treat product/collection/page/article bodies and section `richtext` settings as the realistic targets.

### Opt-in container

```html
<div data-annotated-text>
  <p>This text has [underline]annotations[/underline].</p>
</div>
```

---

## Per-container configuration (`data-arn-*`)

```html
<div
  data-annotated-text
  data-arn-color="#2196F3"
  data-arn-stroke="3"
  data-arn-duration="1200"
  data-arn-padding="8"
  data-arn-iterations="3"
  data-arn-multiline="true"
  data-arn-threshold="0.5"
>
  <p>Text with [underline]custom config[/underline].</p>
</div>
```

| Attribute | Default (example doc) | Notes |
|-----------|------------------------|--------|
| `data-arn-color` | `#E8593C` | |
| `data-arn-stroke` | `2` | |
| `data-arn-duration` | `800` | ms |
| `data-arn-padding` | `5` | px |
| `data-arn-iterations` | `2` | roughness |
| `data-arn-multiline` | `true` | |
| `data-arn-threshold` | `0.3` | IntersectionObserver ratio |

### Priority

1. Shortcode `color=`  
2. Container `data-arn-color`  
3. Optional Theme Editor setting (dedicated section)  
4. Hard-coded default in module  

---

## Public API shape (suggested)

Older drafts described `window.AnnotatedText` from a Liquid snippet. For Skeleton, **prefer ES exports** and only attach to `window` if you must support third-party snippets.

Suggested exports from `rough-notation.ts`:

- **`initRoughNotation(root?: ParentNode)`** — scan `root` or `document` once; safe to call after section loads.
- **`processContainer(element, configOverrides?)`** — process one subtree (dynamic insert).
- **`refresh()`** — full-page rescan (or delegate to `initRoughNotation(document)` with deduping guards).
- **`defaults`** — read-only default config object.

If you need legacy parity:

```js
window.AnnotatedText = { process: processContainer, refresh, defaults }
```

---

## Theme editor & section reloads

- Listen for **`shopify:section:load`** on `document` and re-run scanning for the affected subtree (or whole document if simpler). This is **separate** from `section-registry`: registry inits **typed** sections; Rough Notation scans **content** inside many arbitrary sections.
- On **`shopify:section:unload`**, cancel observers / tear down annotations if the library requires it (depends on Rough Notation API usage).
- Respect **`prefers-reduced-motion`** (project rule): skip or shorten animations when the media query matches.

---

## Server-side shortcodes (Liquid)

The **Annotated** section pipes rich text through **`{% render 'rough-notation-html', html: section.settings.text %}`** so shortcodes are expanded before the response is sent. Shoppers never see raw `[highlight]…[/highlight]` while `theme.js` is still loading.

Output markup matches the client parser: **`<span class="arn-target arn-pending" data-rn-type="…" data-rn-color="…">…</span>`** (not `<u data-rn>`), so the same Rough Notation `annotate()` call path and CSS apply. Reuse the snippet anywhere you need SSR parsing:

```liquid
{% render 'rough-notation-html', html: some_richtext_field %}
```

**Liquid limitations** (see snippet comments): do not nest the same shortcode type; optional colour must not contain `]`. Any remaining shortcodes are still handled in the browser when `theme.js` runs.

---

## Theme section (`annotated.liquid`)

Shipped as **Annotated** in the theme editor:

- Root: `data-annotated-text`, `data-section-type="annotated"`, `data-section-id="{{ section.id }}"`, `shopify-section-wrapper` + `section-styles` (padding).
- Primary setting: **Rich text** passed through **`rough-notation-html`** (server-side shortcodes), with a client fallback in `rough-notation.ts` for any other `.rte` regions; two **paragraph** settings (locale strings) give merchants an in-editor description and syntax reference directly under that field.
- Colours use **`{% render 'color-scheme-vars' %}`** (store / global scheme). Per-span `color=` in shortcodes still overrides stroke colour.
- No `registerSection` entry: Rough Notation scans this block via `data-annotated-text` and re-runs on `shopify:section:load`.

Styles: `src/styles/sections/_annotated.scss` (imported from `sections/index.scss`).

---

## Technical notes

### Regex (reference)

```
\[(underline|circle|highlight|box|strike|bracket|crossed-off)(?:\s+color=["']?([^"'\]]+)["']?)?\]([\s\S]*?)\[\/\1\]
```

### FOUC / pending state

**`arn-pending`** targets stay **visible** (no `visibility: hidden`) so Liquid-expanded copy is readable before `theme.js` runs. IntersectionObserver still promotes spans to **`arn-ready`** and calls `annotation.show()` when they enter view.

### Performance

- IntersectionObserver-based triggers avoid scroll listeners.
- Process each logical container once (e.g. guard with a `data-` or WeakSet) to avoid duplicate annotations on re-scan.
- Lazy-load the library if annotations are rare (`dynamic import()`).

### Browser support

Modern evergreen browsers only (aligned with ES modules already required by `theme.js`). No IE11.

### CSS prefix

Keep theme-specific classes prefixed (e.g. `arn-`) to avoid clashes with `.rte` and BEM blocks.

---

## Troubleshooting (Skeleton-specific)

| Issue | Likely cause | Direction |
|-------|----------------|----------|
| Nothing runs | Module not imported in `theme.ts` / build not run | `npm run build` / `npm run dev` |
| Shortcodes show verbatim | Admin stripped markup or field not raw HTML | Test in a `richtext` section setting or description field that preserves text |
| No animation | Threshold / element already “visible” | Lower threshold; test scroll |
| Duplicate drawings | Re-init without clearing guards | Clear annotation instances or skip already-processed nodes |
| Editor preview stale | Section DOM replaced | Ensure `shopify:section:load` triggers a rescan |

---

## Extending within this repo

- **PDP:** Ensure description/tab HTML is inside one of the `.main-product__* .rte` nodes listed above, or add `data-annotated-text`.
- **Blog:** `.marticle__body.rte` is the main target (`data-marticle-body` on the same node in the article section).
- **Collections / pages:** `.mcol__desc.rte`, `.main-page__content.rte`.
- **Dynamic content:** After injecting HTML, call **`processContainer`** or **`refresh`** from the same module that loaded the HTML (cart drawer, search modal, etc.) — follow existing **`AbortController`** cleanup patterns where listeners are added.

---

## Installation checklist

1. Add npm dependency (`rough-notation`).
2. `src/scripts/rough-notation.ts` + import from `theme.ts` (`initRoughNotation`, `shopify:section:load`).
3. `snippets/rough-notation-html.liquid` + `rough-notation-replace-first.liquid` for SSR (Annotated section).
4. `src/styles/components/_rough-notation.scss` + section layout `src/styles/sections/_annotated.scss`.
5. `sections/annotated.liquid` + schema locale keys under `sections.annotated`.
6. Run `npm run check` and `npm run build`.

No `{% render 'rough-notation-global' %}` in `theme.liquid` is required if all logic ships in `theme.js` — that keeps a single bundle and matches Skeleton’s current layout.
