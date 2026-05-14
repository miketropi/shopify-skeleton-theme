# Font Size Base — Typographic Scale System

## Purpose of this document

This file describes the theme’s **global typographic scale** (merchant base size → tokens → fluid sizing) and how to extend it. The **foundation is implemented** in code; component-level migration is ongoing.

---

## Current project status (skeleton-theme)

**Implemented**

| Area | What exists |
| ---- | ----------- |
| **Theme settings** | `config/settings_schema.json` — **Typography** → **Type scale**: `font_size_base` (`16` / `18` / `20` px). Works with existing `typography_mode`, `font_pairing`, and custom font pickers. |
| **Runtime CSS variables** | `snippets/css-variables.liquid` outputs **`--font-size-xs`** through **`--font-size-4xl`** (Major Third ratio, fluid `clamp()` between 375px and 1440px for steps above `sm`), plus **`--line-height-tight`**, **`--line-height-snug`**, **`--line-height-normal`**, **`--line-height-relaxed`**. |
| **Base typography** | `src/styles/base/_fonts.scss` — `body` uses `--font-size-base` and `--line-height-normal`; `h1–h6` map to `--font-size-4xl` … `--font-size-base` with paired line heights; `h6` is `font-weight: 700`. |
| **Critical CSS** | `assets/critical.css` — `body` sets `font-size` / `line-height` from the same tokens for early paint. |
| **Theme blocks** | `blocks/text.liquid` — `.text--title`, `.text--subtitle`, `.text--normal` use scale tokens + line-height vars. |

**Still to migrate (follow-up)**

| Area | Notes |
| ---- | ----- |
| **Components** | Many `font-size` values remain **hardcoded** in `src/styles/**/*.scss` (rem, px, local `clamp()`). Prefer adopting `var(--font-size-*)` where the semantic role matches. |
| **Other layouts** | e.g. `layout/password.liquid` does not render `css-variables`; password/gift-card pages may differ unless aligned later. |

**Build:** Vite compiles SCSS → `assets/theme.css`. Merchant-driven sizes come only from Liquid (`{% style %}` in `css-variables.liquid`), not from Vite.

**Implication:** Sections below remain **reference** for ratios, semantics, and migration. Phase B is an incremental audit of component SCSS.

---

## Overview (behaviour)

A single **Base font size** in **Theme settings → Typography** drives the scale. Derived steps use a **1.25** ratio; larger steps use **fluid `clamp()`** so type scales between mobile and wide desktop without separate breakpoint settings.

---

## 1. Setting definition

**Implemented** in the theme (this section documents the live shape).

### Schema (`config/settings_schema.json`)

Under **Typography**, after custom font pickers, a **Type scale** header and **select**:

```json
{
  "type": "select",
  "id": "font_size_base",
  "label": "t:labels.font_size_base",
  "default": "16",
  "options": [
    { "value": "16", "label": "t:options.font_size_base.16" },
    { "value": "18", "label": "t:options.font_size_base.18" },
    { "value": "20", "label": "t:options.font_size_base.20" }
  ],
  "info": "t:info.font_size_base"
}
```

Matching keys live in [`locales/en.default.schema.json`](locales/en.default.schema.json) (`labels.font_size_base`, `options.font_size_base.*`, `info.font_size_base`, `headers.type_scale`).

---

## 2. Typographic scale (reference)

### Scale ratio: 1.25 (Major Third)

A **1.25** ratio is a common choice: enough contrast between steps without extreme jumps.

### Token table

From the base value, derive CSS custom properties:

| Token               | Formula           | @16px   | @18px   | @20px   |
| ------------------- | ----------------- | ------- | ------- | ------- |
| `--font-size-xs`    | base ÷ 1.25²      | 10.24px | 11.52px | 12.80px |
| `--font-size-sm`    | base ÷ 1.25       | 12.80px | 14.40px | 16.00px |
| `--font-size-base`  | base              | 16.00px | 18.00px | 20.00px |
| `--font-size-lg`    | base × 1.25       | 20.00px | 22.50px | 25.00px |
| `--font-size-xl`    | base × 1.25²      | 25.00px | 28.13px | 31.25px |
| `--font-size-2xl`   | base × 1.25³      | 31.25px | 35.16px | 39.06px |
| `--font-size-3xl`   | base × 1.25⁴      | 39.06px | 43.95px | 48.83px |
| `--font-size-4xl`   | base × 1.25⁵      | 48.83px | 54.93px | 61.04px |

### Semantic mapping (suggested)

| UI element   | Token              | Notes |
| -------------- | ------------------ | ----- |
| Body / `p` / `.rte` | `--font-size-base` | |
| Small / caption | `--font-size-sm` | |
| Extra small | `--font-size-xs` | |
| Button | `--font-size-base` or `--font-size-sm` | |
| H6 | `--font-size-base` (bold) | |
| H5 | `--font-size-lg` | |
| H4 | `--font-size-xl` | |
| H3 | `--font-size-2xl` | |
| H2 | `--font-size-3xl` | |
| H1 / hero | `--font-size-4xl` | |

---

## 3. Responsive strategy — fluid typography with `clamp()` (reference)

### Breakpoints (for formulas below)

| Name    | Width  | Role |
| ------- | ------ | ---- |
| Mobile  | 375px  | Typical clamp floor |
| Desktop | 1440px | Typical clamp ceiling |

### Mobile scale factors (example)

| Token             | Mobile scale | Rationale |
| ----------------- | ------------ | --------- |
| `--font-size-xs`  | 1.0          | Already small |
| `--font-size-sm`  | 1.0          | |
| `--font-size-base`| 0.875        | e.g. 16→14 |
| `--font-size-lg`  | 0.85         | |
| `--font-size-xl`  | 0.8          | |
| `--font-size-2xl` | 0.75         | |
| `--font-size-3xl` | 0.7          | |
| `--font-size-4xl` | 0.65         | Largest steps shrink more |

### Example (`--font-size-base` at 16px desktop, 14px mobile min)

```css
--font-size-base: clamp(14px, 12.69px + 0.19vw, 16px);
```

Tools such as [Utopia](https://utopia.fyi) can generate clamp pairs; match whatever form the team standardises (verbose `calc` vs simplified).

---

## 4. CSS implementation (where it should live in *this* repo)

### Primary output: `snippets/css-variables.liquid`

This theme already wraps storefront-driven variables in **`{% style %}`** inside `snippets/css-variables.liquid` (see `:root` block with `--page-width`, colours, `--cs-font-*`). **Add `--font-size-*` generation there** so tokens are available before `theme.css` and work with the existing Typography settings.

Do **not** rely on Vite SCSS alone for merchant-controlled base sizes — SCSS is compiled without Liquid.

### Optional: `assets/critical.css`

You may set `body { font-size: var(--font-size-base); }` here **after** tokens exist, so first paint tracks the scale (ensure the `css-variables` `<style>` is ordered before critical/theme CSS can read it — today `css-variables` is rendered in `<head>` before `critical.css` / `theme.css`, which is correct).

### Consuming tokens in SCSS

After tokens exist on `:root`, component SCSS in `src/styles/**` should prefer `var(--font-size-*)` instead of raw rem/px for *text roles* that should follow global typography. **`src/styles/base/_fonts.scss`** is the natural place for default `h1–h6` / `small` sizes and line-heights once the scale exists.

### Doc correction (Liquid tag)

Shopify’s documented tag is **`{% style %}…{% endstyle %}`** (as used in this project). Older examples sometimes show `{%- style -%}`; align snippets with theme-check expectations.

---

## 5. Line height pairing (reference)

| Token | Suggested line-height | Usage |
| ----- | --------------------- | ----- |
| `--font-size-xs` | 1.6–1.7 | Fine print |
| `--font-size-sm` | 1.5–1.6 | Labels |
| `--font-size-base` | 1.5–1.6 | Body |
| Larger steps | tighten toward ~1.1 | Display headings |

Optional shared props:

```css
--line-height-tight: 1.1;
--line-height-snug: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.625;
```

---

## 6. Usage map (reference only)

Use as a *migration guide* when replacing hardcoded sizes — this theme’s components will not match this table until refactored.

| Area | Suggested token |
| ---- | ---------------- |
| `body`, `.rte` | `--font-size-base` |
| `h1` / hero | `--font-size-4xl` |
| Section titles | `--font-size-3xl` … |
| Nav, buttons | `--font-size-base` / `--font-size-sm` |
| Badges, fine print | `--font-size-xs` |

---

## 7. Implementation checklist (aligned to skeleton-theme)

**Phase A — Foundation**

- [x] Add `font_size_base` to `config/settings_schema.json` under Typography + `en.default.schema.json` strings.
- [x] Extend `snippets/css-variables.liquid` to output all `--font-size-*` (and line-height props) using ratio 1.25 + `clamp()` rules.
- [x] Set global defaults in `src/styles/base/_fonts.scss` and `assets/critical.css` for `body` and `h1–h6` to use tokens.
- [x] `blocks/text.liquid` uses tokens for title / subtitle / normal.

**Phase B — Migration (large)**

- [ ] Audit remaining `src/styles/**/*.scss` and Liquid for hardcoded `font-size`; map to tokens or document intentional exceptions (e.g. legal minimums, one-off display locks).
- [ ] Regression-test key templates: index, collection, product, cart, article, header drawer/modal.

**Phase C — QA**

- [ ] Theme editor: switch all `font_size_base` options; check long titles, `.rte`, and RTL if applicable.
- [ ] Viewports ~375px, ~768px, ~1440px; confirm no clipping/regressions.
- [ ] Accessibility: no intentional text below ~10px; contrast on `xs`/`sm`; browser zoom still usable.

---

## 8. Constraints & rules (targets, not current reality)

1. **Aspirational:** Prefer `var(--font-size-*)` for *semantic text roles* — the codebase today uses many fixed sizes; migrating is incremental.
2. **Scale ratio** (e.g. 1.25) can remain a **developer** decision, not a merchant control, unless you explicitly add it later.
3. **Avoid separate mobile/desktop base settings** if `clamp()` covers the range.
4. **Schema `info`** must explain the cascade to merchants.
5. **Shopify Section Rendering API:** keep dynamic typography variables in theme-wide Liquid (`{% style %}` in `css-variables` or layout), consistent with current patterns.
6. **Accessibility:** enforce a practical minimum computed size for body UI; document exceptions.

Rules such as “never use rem” conflict with the **current** codebase (rem is common here). If you adopt px-based clamps for *tokens*, components can still use `rem` elsewhere during transition — document the team’s end state.

---

## 9. Accessibility notes

- WCAG expects content to be resizable (browser zoom is standard).
- Smallest base (16) with a 0.875 mobile factor yields ~14px body minimum in the example — verify comfort and contrast.
- `--font-size-xs` / `--font-size-sm` need strong contrast when used for essential copy.

---

## 10. Files likely touched (skeleton-theme)

| File | Role |
| ---- | ---- |
| `config/settings_schema.json` | Add global typography size control(s). |
| `locales/en.default.schema.json` | Schema labels/info for new settings. |
| `snippets/css-variables.liquid` | Emit `--font-size-*` (and optional line heights) on `:root`. |
| `assets/critical.css` | Optional: `body` / base resets using tokens. |
| `src/styles/base/_fonts.scss` | Default heading/body sizing from tokens. |
| `src/styles/**/*.scss` | Gradual replacement of hardcoded sizes. |
| `blocks/text.liquid` (and similar) | Inline sizes → tokens or classes. |

---

## 11. Related theme docs / snippets

- `snippets/font-pairing-loader.liquid` / `font-pairing-link.liquid` — font **loading** for preset pairings (orthogonal to **size** scale).
- `docs/Shopify Theme — Global Section Options.md` — section shell vars; not the same as global type scale.

When this document and the codebase match, you can trim **§ Current project status** or rewrite it to say “implemented” and point to the canonical token list in `css-variables.liquid`.
