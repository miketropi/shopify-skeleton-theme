<h1 align="center">
  <br>
  <img src="./assets/shoppy-x-ray.svg" alt="logo" width="200">
  <br>
  Shopify Skeleton Theme
</h1>

A minimal Shopify theme with a clear folder layout, Theme Check–friendly Liquid, and a small **TypeScript + Vite** pipeline for storefront JavaScript.

<p align="center">
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
  <a href="https://github.com/Shopify/skeleton-theme/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Shopify/skeleton-theme/actions/workflows/ci.yml/badge.svg"></a>
</p>

---

## Quick reference (for humans and tooling)

| Area | Path | Notes |
|------|------|--------|
| Theme (Liquid, JSON templates) | `layout/`, `sections/`, `snippets/`, `templates/`, `blocks/`, `config/`, `locales/` | Standard [theme architecture](https://shopify.dev/docs/storefronts/themes/architecture) |
| Storefront JS (source) | `src/theme.ts` | Edit here; TypeScript, strict mode (`tsconfig.json`) |
| Storefront JS (built) | `assets/theme.js` | Produced by Vite; `vite.config.ts` uses `emptyOutDir: false` so other assets stay put |
| Global `window.Shopify` typings | `src/types/shopify.d.ts` | Extend as needed |
| Theme Check | `.theme-check.yml` | Extends `theme-check:recommended` |
| CI | `.github/workflows/ci.yml` | Runs Theme Check on push |

---

## Prerequisites

- **Node.js** (current LTS) — for npm scripts, Vite, ESLint, Prettier  
- **[Shopify CLI](https://shopify.dev/docs/api/shopify-cli)** — `shopify theme dev`, `shopify theme check`, `shopify theme package`

Optional:

- **[Shopify Liquid VS Code extension](https://shopify.dev/docs/storefronts/themes/tools/shopify-liquid-vscode)** — Liquid syntax, linting, completions

---

## Getting started

### Install dependencies

```bash
npm install
```

### Local development

Run Theme CLI and the JS bundler together (watch mode rebuilds `assets/theme.js` when `src/` changes):

```bash
npm run dev
```

This runs `shopify theme dev` and `vite build --watch` in parallel via `concurrently`.

### Build JavaScript only

```bash
npm run build
```

Output: `assets/theme.js` (and any future chunks, all named under `assets/` per `vite.config.ts`).

### Package the theme for upload

```bash
npm run package
```

Runs a production Vite build, then `shopify theme package`.

---

## npm scripts

| Script | Command | When to use |
|--------|---------|-------------|
| `dev` | `concurrently "shopify theme dev" "vite build --watch"` | Daily development |
| `build` | `vite build` | Before commit or inside `package` |
| `check` | `shopify theme check` | Liquid/theme validation (matches CI) |
| `lint` | `eslint src --ext .ts` | TypeScript in `src/` |
| `format` | `prettier --write src` | Format TS under `src/` |
| `package` | `npm run build && shopify theme package` | Ship a `.zip` theme |

---

## Loading the Vite bundle in Liquid

The default layout does not include `theme.js`. When you want the compiled script on the storefront, add a tag in `layout/theme.liquid` (for example before `</body>`):

```liquid
{{ 'theme.js' | asset_url | script_tag }}
```

Use `defer` or Shopify’s recommended loading pattern if you adjust this for performance.

You can still use Liquid [`{% javascript %}`](https://shopify.dev/docs/api/liquid/tags/javascript) for small inline or tag-based scripts; the Vite entry is for larger, typed modules.

---

## Theme architecture

```text
.
├── assets          # Static assets (CSS, JS, images, fonts) + Vite output (e.g. theme.js)
├── blocks          # Reusable, nestable theme blocks
├── config          # Theme settings
├── layout          # theme.liquid, password.liquid, …
├── locales         # Translations
├── sections        # Sections + optional section groups (JSON)
├── snippets        # Reusable Liquid fragments
├── src             # TypeScript source for Vite (not uploaded as Liquid)
├── templates       # JSON templates
└── vite.config.ts  # Build: src/theme.ts → assets/theme.js
```

More detail: [Theme architecture](https://shopify.dev/docs/storefronts/themes/architecture).

### Templates

[Templates](https://shopify.dev/docs/storefronts/themes/architecture/templates#template-types) define what renders on each page type. This repo uses [JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates) where applicable. See the [template types reference](https://shopify.dev/docs/storefronts/themes/architecture/templates#template-types) for the full list.

### Sections

[Sections](https://shopify.dev/docs/storefronts/themes/architecture/sections) are Liquid modules with a `{% schema %}` so merchants can customize them in the editor.

### Blocks

[Blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks) are smaller reusable pieces inside sections, also configured with `{% schema %}`.

---

## Schema and CSS guidelines

When mapping settings to styles:

- **Single CSS property** → prefer a CSS variable on the element and `var(--name)` in `{% stylesheet %}`.
- **Several properties** → prefer a class per option (e.g. layout presets) in `{% stylesheet %}`.

See the [section schema](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema) and [block schema](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/schema) docs for structure.

Example patterns (abbreviated):

```liquid
<div class="collection" style="--gap: {{ block.settings.gap }}px">
  ...
</div>

{% stylesheet %}
  .collection { gap: var(--gap); }
{% endstylesheet %}
```

```liquid
<div class="collection {{ block.settings.layout }}">...</div>

{% stylesheet %}
  .collection--full-width { /* … */ }
  .collection--narrow { /* … */ }
{% endstylesheet %}
```

---

## CSS and JavaScript in Liquid

- Prefer [`{% stylesheet %}`](https://shopify.dev/docs/api/liquid/tags/stylesheet) and [`{% javascript %}`](https://shopify.dev/docs/api/liquid/tags/javascript) for co-located CSS/JS in sections and snippets (deduplicated by Shopify).
- **Critical CSS** for every page lives in `assets/critical.css` and is loaded from the layout.

---

## Contributing

This project stays intentionally small and foundational. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for process and standards.

---

## License

Skeleton Theme is open-sourced under the [MIT](./LICENSE.md) license.
