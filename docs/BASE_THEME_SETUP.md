# Shopify Theme — Agent Instructions

You are an expert Shopify theme developer. This document is your single source of truth for every task in this codebase. Read it fully before taking any action.

---

## 1. Project context

This is a custom Shopify theme built on **Online Store 2.0**. The dev environment has been bootstrapped with:

- **TypeScript** for all JavaScript logic (compiled to `assets/`)
- **SCSS** for all styles (compiled to `assets/`)
- **Shopify CLI** for local dev server and theme push
- **Liquid** for all templating (sections, snippets, layouts, templates)

You are operating inside this existing codebase. Do **not** re-initialise the project, reinstall dependencies, or modify `package.json` / `tsconfig.json` / `vite.config.*` unless explicitly instructed.

---

## 2. Directory structure

```
theme/
├── assets/               # Compiled output only — never edit directly
├── config/
│   ├── settings_schema.json
│   └── settings_data.json
├── layout/
│   ├── theme.liquid       # Main layout wrapper — edit with caution
│   └── password.liquid
├── locales/               # i18n JSON files
├── sections/              # Drag-and-drop sections (.liquid)
├── snippets/              # Reusable partials (.liquid)
├── src/                   # TypeScript source files & Style 
└── templates/             # JSON templates (Online Store 2.0)
    ├── index.json
    ├── product.json
    ├── collection.json
    ├── cart.json
    ├── 404.json
    ├── password.json
    ├── page.json
    ├── blog.json
    ├── article.json
    └── customers/
        ├── account.json
        ├── login.json
        ├── register.json
        └── order.json
```

---

## 3. Naming conventions

| Type | Convention | Example |
|---|---|---|
| Section file | `kebab-case.liquid` | `product-hero.liquid` |
| Snippet file | `kebab-case.liquid` | `price-badge.liquid` |
| SCSS file | `_kebab-case.scss` | `_product-hero.scss` |
| TypeScript file | `kebab-case.ts` | `product-hero.ts` |
| Section schema `name` | Title Case | `"name": "Product Hero"` |
| CSS custom properties | `--component-property` | `--btn-bg-color` |
| Section setting IDs | `snake_case` | `"id": "heading_text"` |
| Block type names | `snake_case` | `"type": "feature_item"` |

---

## 4. How to create a new section

Follow these steps **in order**. Do not skip steps.

### Step 1 — Create the SCSS file

Create `src/styles/sections/_<section-name>.scss`. Import it in `src/styles/sections/index.scss` (or equivalent entry point):

```scss
@forward 'section-name';
```

Write styles scoped under the section's root class:

```scss
.section-<section-name> {
  // styles here
}
```

### Step 2 — Create the TypeScript file (if interactive)

Only create a TS file if the section requires client-side interactivity (sliders, accordions, AJAX, etc.). Create `src/scripts/sections/<section-name>.ts`.

Export a named `init` function and a `destroy` function for cleanup:

```ts
export function init(container: HTMLElement): void {
  // setup event listeners, observers, etc.
}

export function destroy(container: HTMLElement): void {
  // cleanup to support theme editor live reload
}
```

Register the section in the main entry point (e.g. `src/scripts/theme.ts`):

```ts
import * as SectionName from './sections/section-name';
// register with theme's section registry
```

### Step 3 — Create the Liquid file

Create `sections/<section-name>.liquid`. Every section file must include:

1. **HTML markup** using the CSS class `.section-<section-name>` as the root
2. **`{% schema %}`** block at the bottom
3. A `data-section-type` attribute on the root element for JS targeting

```liquid
<div
  class="section-{{ section.id }} section-<section-name>"
  data-section-type="<section-name>"
  data-section-id="{{ section.id }}"
>
  {%- comment -%} Section content here {%- endcomment -%}
</div>

{% schema %}
{
  "name": "Section Display Name",
  "tag": "section",
  "class": "section",
  "settings": [],
  "blocks": [],
  "presets": [
    {
      "name": "Section Display Name"
    }
  ]
}
{% endschema %}
```

### Step 4 — Add to a template (if required by task)

If the task specifies the section should appear on a particular template, add it to the relevant `templates/*.json`:

```json
{
  "sections": {
    "section-name": {
      "type": "section-name",
      "settings": {}
    }
  },
  "order": ["section-name"]
}
```

---

## 5. How to create a snippet

Snippets are stateless, reusable partials. They receive data via `{% render %}` parameters — never via `section.settings` directly.

```liquid
{%- comment -%}
  @param {String} title - The heading text
  @param {String} url   - Link href
{%- endcomment -%}

<a class="snippet-<snippet-name>" href="{{ url }}">
  {{- title | escape -}}
</a>
```

Render a snippet with explicit parameter passing:

```liquid
{%- render 'snippet-name', title: section.settings.heading, url: section.settings.link -%}
```

---

## 6. Liquid coding rules

These rules are **non-negotiable**. Violating them causes bugs in the Shopify theme editor.

- Always use `{%- -%}` (whitespace control) for logic tags, `{{- -}}` for output tags. Exception: content that intentionally needs surrounding whitespace.
- Never use `{% assign %}` inside a `{% for %}` loop for variables that persist after the loop — use `{% capture %}` or hoist the assign outside.
- Always check object existence before accessing properties: `{% if product != blank %}`.
- Never hardcode strings that should be translatable. Use `{{ 'key' | t }}` and add the key to `locales/en.default.json`.
- Use `| escape` for any user-generated content rendered in HTML attributes.
- Use `| json` when passing Liquid data to JavaScript: `const data = {{ product | json }};`
- Section settings are accessed via `section.settings.<id>`. Block settings via `block.settings.<id>`.
- Always include `{{ block.shopify_attributes }}` on block root elements to enable theme editor selection.

---

## 7. TypeScript rules

- All DOM queries must be scoped to the section container: `container.querySelector(...)`, never `document.querySelector(...)`.
- Use `CustomEvent` for cross-component communication, dispatched on `document`.
- Always handle Shopify theme editor events for live reload:

```ts
document.addEventListener('shopify:section:load', (e: Event) => {
  const event = e as CustomEvent;
  const container = event.detail.sectionId
    ? document.querySelector(`[data-section-id="${event.detail.sectionId}"]`) as HTMLElement
    : null;
  if (container) init(container);
});

document.addEventListener('shopify:section:unload', (e: Event) => {
  const event = e as CustomEvent;
  const container = event.detail.sectionId
    ? document.querySelector(`[data-section-id="${event.detail.sectionId}"]`) as HTMLElement
    : null;
  if (container) destroy(container);
});
```

- Never use `any`. Use proper types or `unknown` with type guards.
- Prefer `const` and arrow functions. No `var`.

---

## 8. SCSS rules

- All section styles must be scoped under `.section-<section-name>` — no global selectors.
- Use CSS custom properties for all design tokens (colours, spacing, font sizes). Define them in `src/styles/base/_variables.scss`.
- Do not use `@import` — use `@use` and `@forward` (Sass Modules).
- Mobile-first breakpoints. Use mixins defined in `src/styles/base/_breakpoints.scss`.
- Never use `!important` except for utility/override classes explicitly named `.u-*`.

---

## 9. Schema authoring rules

When writing `{% schema %}` blocks:

- Every setting must have a `label` that is clear to a non-technical merchant.
- Use `"default"` values for all settings so the section renders correctly out of the box in the theme editor.
- Group related settings with `"type": "header"` dividers.
- Limit blocks to a sensible `"limit"` (e.g. `"limit": 12` for feature lists).
- Always add at least one `"presets"` entry so the section is addable from the theme editor.
- Required schema settings for every section:

```json
{
  "name": "...",
  "tag": "section",
  "class": "section",
  "disabled_on": {
    "groups": ["header", "footer"]
  },
  "settings": [...],
  "presets": [{ "name": "..." }]
}
```

---

## 10. Task execution protocol

When you receive a task, follow this protocol exactly:

```
1. UNDERSTAND  — Restate the task in one sentence. Identify which files will be created or modified.
2. PLAN        — List every file action (CREATE / MODIFY / DELETE) with the full path.
3. EXECUTE     — Perform the file actions in dependency order (styles → scripts → liquid → template).
4. VERIFY      — Check: schema is valid JSON, Liquid tags are balanced, TS has no type errors (run `tsc --noEmit` if possible), SCSS import is added.
5. SUMMARISE   — List what was done and any follow-up actions the developer should take manually (e.g. `shopify theme push`, adding translation keys).
```

Do **not** skip straight to EXECUTE. Always state your PLAN before touching files.

---

## 11. What you must never do

- **Never edit files in `assets/`** — this is compiled output.
- **Never modify `layout/theme.liquid`** unless the task explicitly targets it.
- **Never install new npm packages** without explicit instruction.
- **Never push to the live theme** — only push to a development theme. The CLI command is `shopify theme push --theme=<dev-theme-id>`.
- **Never delete existing sections or snippets** unless the task explicitly says to remove them.
- **Never leave TODO comments** in delivered code — complete the implementation or raise a blocker in your SUMMARISE step.
- **Never use inline styles** in Liquid/HTML output — all styles go through SCSS.

---

## 12. Quick reference — Shopify CLI commands

```bash
# Start local dev server (hot reload)
shopify theme dev --store=<store>.myshopify.com

# Push to a specific development theme
shopify theme push --theme=<theme-id> --store=<store>.myshopify.com

# Pull latest from store
shopify theme pull --theme=<theme-id> --store=<store>.myshopify.com

# List themes
shopify theme list --store=<store>.myshopify.com

# Check theme for errors
shopify theme check
```

---

## 13. Useful Liquid patterns

**Responsive image with lazy load:**
```liquid
{{
  image
  | image_url: width: 1200
  | image_tag:
    loading: 'lazy',
    widths: '360, 720, 1080, 1200',
    sizes: '(max-width: 768px) 100vw, 50vw'
}}
```

**Money formatting:**
```liquid
{{ product.price | money }}
{{ product.price | money_with_currency }}
```

**Paginate a collection:**
```liquid
{% paginate collection.products by 24 %}
  {% for product in collection.products %}
    {%- render 'product-card', product: product -%}
  {% endfor %}
  {{- paginate | default_pagination -}}
{% endpaginate %}
```

**Pass product data to JS:**
```liquid
<script>
  window.__productData = {{ product | json }};
</script>
```