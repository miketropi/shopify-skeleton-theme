# Home Slider (planned section)

**Status:** not implemented in this repo. There is **no** `sections/*home*slider*` Liquid file yet.

This document is the **product / build spec** for a future section whose merchant-facing name should be **“Home Slider”**. It is **unrelated** to the existing full-width marketing hero implemented as **`section-hero-slider`** (`sections/section-hero-slider.liquid`, `_section-hero-slider.scss`, `section-hero-slider.runtime.ts`). Do not conflate the two: different files, different `data-section-type`, different schema locale namespace.

---

## Why a separate section

| | **Home Slider (this spec)** | **Hero slider (`section-hero-slider`)** |
| --- | --- | --- |
| Role | TBD: e.g. homepage promotional strip, secondary carousel, or alternate layout | Full-bleed hero: fade slideshow, video, split copy grid, chrome-mid scheme sync |
| Implementation | To be added | Already in tree |

Adjust the first row once you lock positioning for merchants and templates.

---

## Suggested technical naming (when built)

Follow the skeleton theme section pattern:

| Piece | Suggested path / id |
| --- | --- |
| Liquid | `sections/section-home-slider.liquid` |
| Styles | `src/styles/sections/_section-home-slider.scss` (import from `src/styles/sections/index.scss`) |
| Script | `src/scripts/section-home-slider.ts` (or `sections/section-home-slider.runtime.ts` if you split like hero) |
| Section type | `data-section-type="section-home-slider"` |
| Schema labels | `locales/en.default.schema.json` → e.g. `sections.home_slider` with `t:` keys in schema |
| Registration | Import/register in `src/scripts/theme.ts`; run `npm run build` after TS/SCSS changes |

---

## Draft specification (to refine during implementation)

Everything below is **proposed** until the section exists in the codebase.

### Section-level settings (ideas)

- **Height behaviour:** e.g. viewport-based presets (`min-height` in `vh` or fixed `px` ranges) — distinct from hero’s current `min_height` px slider if you want different UX.
- **Slide transition:** e.g. horizontal slide vs cross-fade (hero today is fade-only; Home Slider can deliberately differ).
- **Navigation chrome:** toggles for arrows and dots/pagination, if Theme Store accessibility review allows (keyboard + focus must still work).
- **Autoplay:** on/off, delay, pause on hover / reduced motion (match `prefers-reduced-motion` policy used elsewhere).
- **Colour system:** prefer **`color_scheme`** + existing `color-scheme-vars` patterns over ad-hoc text colours; see `docs/COLOR_SCHEME_SYSTEM.md`.

### Slide blocks (ideas)

- **Media:** image; optional **alternate mobile image** if art direction differs from desktop.
- **Overlay / tint:** optional dimmer or gradient over media (coverage and opacity).
- **Copy:** kicker, heading (`inline_richtext`), subtext; optional **per-field colour pickers** only if you cannot express them via schemes (minimize arbitrary colours for Theme Store maintenance).
- **CTAs:** one or two links; optional **button style** presets (primary/secondary/outline) aligned with existing button classes.
- **Limits:** max slides, block order in theme editor.

Tune this list against `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md` and Theme Store requirements (schema completeness, accessibility, progressive enhancement).

---

## Implementation checklist (when you start the build)

- [ ] Add Liquid section with full `{% schema %}` and `t:` labels under a **new** locale namespace (not `sections.hero_slider`).
- [ ] Set `data-section-type` / `data-section-id` on the root; register with `registerSection` and clean up in `destroy()` (AbortController, Swiper/teardown, etc.).
- [ ] Respect **`prefers-reduced-motion`** for any motion (carousel and copy animation).
- [ ] After TS/SCSS edits: `npm run build`. After Liquid edits: `npm run check`.
- [ ] Update this doc’s **Draft specification** to match what shipped so it stays the source of truth for **Home Slider** only.

---

## Reference: existing hero (not this section)

For the **implemented** full-width hero slideshow, read the Liquid/SCSS/runtime under the `section-hero-slider` prefix — there is no separate markdown doc for it in `docs/sections/` unless you add one. This file must **not** be edited to describe that implementation.
