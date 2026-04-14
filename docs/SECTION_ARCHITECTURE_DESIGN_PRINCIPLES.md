# Section architecture — design principles

## Core rule

Every section does exactly one job. If you can describe a section with "and", it needs to be split.

```
✗  "Hero and feature grid"
✓  "Hero"
✓  "Feature grid"
```

---

## The homepage is an orchestrator, not a container

`templates/index.json` declares which sections appear and in what order. It never contains logic or markup of its own. The actual content lives entirely in section files.

```json
{
  "sections": {
    "hero":               { "type": "section-hero",               "settings": {} },
    "feature-grid":       { "type": "section-feature-grid",       "settings": {} },
    "featured-collection":{ "type": "featured-collection",        "settings": {} }
  },
  "order": ["hero", "feature-grid", "featured-collection"]
}
```

A merchant must be able to:
- Reorder any two sections without breaking either one
- Hide one section without affecting the others
- Add a new section between two existing ones

If your section design prevents any of the above, the sections are wrongly coupled.

---

## When a monolithic section is justified

Only when the parts have **tight layout coupling** — they must share positioning context or real-time state that cannot be passed through the DOM. The coupling must be technical, not just visual proximity.

| Situation | Verdict |
|---|---|
| Hero text + hero image (same visual unit, same data) | Single section — OK |
| Product media gallery + sticky ATC bar (need shared scroll state) | Single section — OK |
| Hero + feature grid (independent layout, independent data) | Must be split |
| Collection filters + product grid (filter state drives grid) | Single section — OK |
| Blog post body + unrelated testimonials block | Must be split |

Ask yourself: if I moved these two parts to different pages, would either one break? If no — split them.

---

## Section naming convention

Name sections after what they render, not where they appear.

```
✗  main-index.liquid          (location-based — not reusable)
✓  section-hero.liquid        (content-based — reusable anywhere)
✓  section-feature-grid.liquid
✓  section-featured-collection.liquid
```

A section named after a page (`main-index`, `main-homepage`) is a signal that it was designed for one location only. Avoid this unless the section genuinely cannot appear anywhere else (e.g. `main-product` — the product form requires a product context).

---

## Implementation in this repository

| Principle | How this theme applies it |
|-----------|---------------------------|
| Homepage as orchestrator | `templates/index.json` lists `section-hero` and `section-feature-grid` (and any others you add) in `order` only — no markup in the template. |
| One job per section | `section-hero.liquid` = hero only. `section-feature-grid.liquid` = grid of `feature` blocks only. |
| `main-*` for template context | `main-product`, `main-collection`, `main-cart`, etc. require Shopify objects (`product`, `collection`, …). |
| `section-*` for reusable marketing | Hero and feature grid can be added to JSON templates other than the homepage if desired. |
| Blocks = repeated instances | Feature grid blocks are all type `feature`; they are not mixed with hero content. |

**Styles:** `src/styles/sections/_section-hero.scss` and `_section-feature-grid.scss` are forwarded from `src/styles/sections/index.scss`.

Exception: sections that wrap Shopify system objects (`product`, `collection`, `blog`, `article`, `cart`) are legitimately page-specific. Prefix these with `main-` to signal they require a template context:

```
main-product.liquid       ← requires product object
main-collection.liquid    ← requires collection object
section-hero.liquid       ← works on any page
section-feature-grid.liquid ← works on any page
```

---

## Blocks are for repeated items within one section, not for separate content areas

Blocks belong inside a section when they are **instances of the same component type** — a list of features, a set of testimonials, a row of logos.

```
✓  section-feature-grid.liquid  with blocks of type "feature"
✓  section-testimonials.liquid  with blocks of type "testimonial"
✗  section-hero.liquid          with blocks of type "feature_grid_item"
   (feature grid items are not part of the hero — split the section)
```

If a block type would make no sense without the other content in the section, it belongs there. If it could stand alone, it belongs in its own section.

---

## Checklist before creating a section

Answer these before writing any code:

1. **Single responsibility** — Can I describe this section in one noun phrase with no "and"?
2. **Reusability** — Could this section appear on a page other than the one I'm building it for right now?
3. **Independence** — Can this section be removed from the template without breaking any other section on that page?
4. **Naming** — Does the filename describe the content, not the page location? (Exception: `main-*` for system-object sections.)
5. **Blocks** — Do my blocks represent instances of a single repeating component, not separate content areas?

If any answer is no — redesign before writing code.