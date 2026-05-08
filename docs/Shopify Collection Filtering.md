# Shopify Collection Filtering — AI Agent Implementation Guide

## Overview

This document describes how to implement **native Shopify Storefront Filtering** on Collection pages using Shopify's built-in `collection.filters` Liquid object — no paid apps required. The filter supports Color, Size, Price Range, and any other product metafield-based filters configured in the **Search & Discovery** app.

---

## Prerequisites

Before implementing, verify the following:

1. **Search & Discovery app** (free, by Shopify) is installed and filters are configured under **Filters** tab.
2. Products have variants with option names that **exactly match** the filter labels (e.g. option named `Color`, not `Colour` or `color`).
3. Collection template uses `collection.filters` — not a legacy `collection.tags` approach.

---

## How It Works

Shopify exposes available filters via `collection.filters`. When a user selects a filter, the form submits as URL query parameters. Shopify's storefront engine handles the filtering server-side and returns only matching products — no custom backend logic needed.

**Example filtered URLs:**
```
/collections/all?filter.p.m.product.color=Red
/collections/all?filter.p.m.product.color=Red&filter.p.m.product.size=M
/collections/all?filter.v.price.gte=100&filter.v.price.lte=500
```

---

## Filter Object Reference

Each item in `collection.filters` exposes:

| Property | Description |
|---|---|
| `filter.label` | Display name (e.g. "Color", "Size") |
| `filter.type` | `list` or `price_range` |
| `filter.param_name` | URL parameter base name |
| `filter.values` | Array of available filter values (for `list` type) |
| `filter.active_values` | Currently selected values |
| `filter.min_value` / `filter.max_value` | Price range bounds (for `price_range` type) |
| `filter.range_max` | Maximum possible price (in cents) |

Each value in `filter.values` exposes:

| Property | Description |
|---|---|
| `value.label` | Display name |
| `value.value` | The actual filter value |
| `value.param_name` | Full URL param name to use as input `name` |
| `value.count` | Number of matching products |
| `value.active` | Whether this value is currently selected |
| `value.url_to_remove` | URL to deactivate this filter |

---

## File Structure

```
sections/
  main-collection.liquid       ← Main collection section (products grid + filter)
snippets/
  collection-filters.liquid    ← Filter sidebar UI
  collection-active-filters.liquid  ← Active filter badges / clear UI
  product-card.liquid          ← Individual product card
assets/
  collection-filters.js        ← Filter interaction JS
  collection-filters.css       ← Filter styles
```

---

## Implementation

### 1. Debug Snippet (verify data first)

Before building UI, temporarily add this to your collection template to confirm filters are available:

```liquid
{% for filter in collection.filters %}
  <p>{{ filter.label }} — {{ filter.type }} — {{ filter.values.size }} values</p>
{% endfor %}
```

If nothing renders, check that products have correctly named variant options and that Search & Discovery has been saved.

---

### 2. Main Collection Section (`sections/main-collection.liquid`)

```liquid
<div class="collection-layout">

  {%- comment -%} Active filter badges {%- endcomment -%}
  {% render 'collection-active-filters', results: collection %}

  <div class="collection-layout__inner">

    {%- comment -%} Filter sidebar {%- endcomment -%}
    <aside class="collection-sidebar">
      {% render 'collection-filters', results: collection %}
    </aside>

    {%- comment -%} Product grid {%- endcomment -%}
    <div class="collection-grid">

      {%- comment -%} Sort bar {%- endcomment -%}
      <div class="collection-sort">
        <label for="SortBy">Sort by</label>
        <select name="sort_by" id="SortBy" onchange="this.form && this.form.submit()">
          {%- for option in collection.sort_options -%}
            <option
              value="{{ option.value }}"
              {% if option.value == collection.sort_by %}selected{% endif %}
            >{{ option.name }}</option>
          {%- endfor -%}
        </select>
      </div>

      {%- paginate collection.products by 24 -%}
        <ul class="product-grid">
          {%- for product in collection.products -%}
            <li>{% render 'product-card', product: product %}</li>
          {%- else -%}
            <li class="no-results">No products match the selected filters.</li>
          {%- endfor -%}
        </ul>
        {% render 'pagination', paginate: paginate %}
      {%- endpaginate -%}

    </div>
  </div>
</div>
```

---

### 3. Filter Sidebar Snippet (`snippets/collection-filters.liquid`)

```liquid
{%- comment -%}
  Renders the filter sidebar form.
  Usage: {% render 'collection-filters', results: collection %}
  Accepts: results — the collection or search results object
{%- endcomment -%}

<form id="FacetFiltersForm" class="facets">

  {%- for filter in results.filters -%}
    <details
      class="facets__group"
      id="Facet-{{ filter.param_name }}"
      {% if filter.active_values.size > 0 or filter.min_value.value or filter.max_value.value %}open{% endif %}
    >
      <summary class="facets__group-title">
        <span>{{ filter.label }}</span>
        {%- if filter.active_values.size > 0 -%}
          <span class="facets__active-count">{{ filter.active_values.size }}</span>
        {%- endif -%}
      </summary>

      <div class="facets__group-content">

        {%- if filter.type == 'list' -%}

          <ul class="facets__list" role="list">
            {%- for value in filter.values -%}
              {%- assign is_color = false -%}
              {%- if filter.label == 'Color' or filter.label == 'Colour' -%}
                {%- assign is_color = true -%}
              {%- endif -%}

              <li class="facets__item">
                <label
                  class="facets__label{% if value.count == 0 and value.active == false %} facets__label--disabled{% endif %}"
                  for="Filter-{{ filter.param_name }}-{{ forloop.index }}"
                >
                  <input
                    type="checkbox"
                    class="facets__checkbox"
                    id="Filter-{{ filter.param_name }}-{{ forloop.index }}"
                    name="{{ value.param_name }}"
                    value="{{ value.value }}"
                    {% if value.active %}checked{% endif %}
                    {% if value.count == 0 and value.active == false %}disabled{% endif %}
                  >

                  {%- if is_color -%}
                    <span
                      class="facets__color-swatch"
                      style="background-color: {{ value.value | downcase | replace: ' ', '' }}"
                      title="{{ value.label }}"
                    ></span>
                  {%- endif -%}

                  <span class="facets__label-text">{{ value.label }}</span>
                  <span class="facets__count">({{ value.count }})</span>
                </label>
              </li>
            {%- endfor -%}
          </ul>

        {%- elsif filter.type == 'price_range' -%}

          {%- assign range_max = filter.range_max | divided_by: 100.0 | ceil -%}

          <div class="facets__price-range">
            <div class="facets__price-inputs">
              <label class="facets__price-label">
                <span>Min</span>
                <input
                  class="facets__price-input"
                  type="number"
                  name="{{ filter.min_value.param_name }}"
                  id="Filter-{{ filter.param_name }}-min"
                  value="{{ filter.min_value.value | divided_by: 100.0 | default: '' }}"
                  min="0"
                  max="{{ range_max }}"
                  placeholder="0"
                >
              </label>

              <span class="facets__price-separator">—</span>

              <label class="facets__price-label">
                <span>Max</span>
                <input
                  class="facets__price-input"
                  type="number"
                  name="{{ filter.max_value.param_name }}"
                  id="Filter-{{ filter.param_name }}-max"
                  value="{{ filter.max_value.value | divided_by: 100.0 | default: '' }}"
                  min="0"
                  max="{{ range_max }}"
                  placeholder="{{ range_max }}"
                >
              </label>
            </div>
          </div>

        {%- endif -%}
      </div>
    </details>
  {%- endfor -%}

  {%- comment -%} Preserve sort_by across filter changes {%- endcomment -%}
  <input type="hidden" name="sort_by" value="{{ results.sort_by }}">

  <button type="submit" class="facets__apply-btn">Apply Filters</button>

</form>
```

---

### 4. Active Filters Snippet (`snippets/collection-active-filters.liquid`)

```liquid
{%- comment -%}
  Renders active filter badges so users can individually remove filters.
  Usage: {% render 'collection-active-filters', results: collection %}
{%- endcomment -%}

{%- assign has_active_filters = false -%}
{%- for filter in results.filters -%}
  {%- if filter.active_values.size > 0 or filter.min_value.value or filter.max_value.value -%}
    {%- assign has_active_filters = true -%}
  {%- endif -%}
{%- endfor -%}

{%- if has_active_filters -%}
  <div class="active-filters">
    <span class="active-filters__label">Active filters:</span>

    <div class="active-filters__list">
      {%- for filter in results.filters -%}

        {%- for value in filter.active_values -%}
          <a href="{{ value.url_to_remove }}" class="active-filters__badge">
            <span>{{ filter.label }}: {{ value.label }}</span>
            <span class="active-filters__remove" aria-label="Remove filter">✕</span>
          </a>
        {%- endfor -%}

        {%- if filter.min_value.value or filter.max_value.value -%}
          <a href="{{ filter.url_to_remove }}" class="active-filters__badge">
            <span>
              Price:
              {%- if filter.min_value.value -%}
                {{ filter.min_value.value | divided_by: 100.0 | money_without_trailing_zeros }}
              {%- else -%}
                0
              {%- endif -%}
              —
              {%- if filter.max_value.value -%}
                {{ filter.max_value.value | divided_by: 100.0 | money_without_trailing_zeros }}
              {%- else -%}
                Max
              {%- endif -%}
            </span>
            <span class="active-filters__remove" aria-label="Remove filter">✕</span>
          </a>
        {%- endif -%}

      {%- endfor -%}

      <a href="{{ results.url }}" class="active-filters__clear">Clear all</a>
    </div>
  </div>
{%- endif -%}
```

---

### 5. JavaScript (`assets/collection-filters.js`)

```javascript
/**
 * Collection Filters — Interaction Handler
 * Handles: checkbox auto-submit, price range submit on Enter, mobile drawer toggle
 */

(function () {
  const form = document.getElementById('FacetFiltersForm');
  if (!form) return;

  // Auto-submit on checkbox change
  form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      form.submit();
    });
  });

  // Submit price range on Enter key
  form.querySelectorAll('.facets__price-input').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        form.submit();
      }
    });
  });

  // Mobile: toggle filter drawer
  const mobileToggle = document.getElementById('FilterDrawerToggle');
  const filterSidebar = document.querySelector('.collection-sidebar');

  if (mobileToggle && filterSidebar) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = filterSidebar.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('filter-drawer-open', isOpen);
    });

    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
      if (
        filterSidebar.classList.contains('is-open') &&
        !filterSidebar.contains(e.target) &&
        !mobileToggle.contains(e.target)
      ) {
        filterSidebar.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', false);
        document.body.classList.remove('filter-drawer-open');
      }
    });
  }
})();
```

---

### 6. CSS (`assets/collection-filters.css`)

```css
/* ─── Layout ─── */
.collection-layout { max-width: 1400px; margin: 0 auto; padding: 0 16px; }
.collection-layout__inner { display: grid; grid-template-columns: 280px 1fr; gap: 32px; }

/* ─── Sidebar ─── */
.collection-sidebar { position: sticky; top: 24px; align-self: start; }

/* ─── Filter Group ─── */
.facets__group { border-bottom: 1px solid #e5e5e5; padding: 16px 0; }
.facets__group-title {
  display: flex; justify-content: space-between; align-items: center;
  cursor: pointer; font-weight: 600; font-size: 14px; list-style: none;
  user-select: none;
}
.facets__group-title::-webkit-details-marker { display: none; }
.facets__active-count {
  background: #111; color: #fff; border-radius: 50%;
  width: 20px; height: 20px; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
}

/* ─── List ─── */
.facets__list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.facets__label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; }
.facets__label--disabled { opacity: 0.4; cursor: not-allowed; }
.facets__checkbox { width: 16px; height: 16px; cursor: pointer; }
.facets__count { color: #888; font-size: 12px; margin-left: auto; }

/* ─── Color Swatch ─── */
.facets__color-swatch {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid #e5e5e5; flex-shrink: 0;
}

/* ─── Price Range ─── */
.facets__price-inputs { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.facets__price-label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #888; }
.facets__price-input {
  width: 90px; padding: 6px 8px; border: 1px solid #e5e5e5;
  border-radius: 4px; font-size: 14px;
}
.facets__price-separator { color: #888; }

/* ─── Apply button ─── */
.facets__apply-btn {
  width: 100%; margin-top: 20px; padding: 10px;
  background: #111; color: #fff; border: none;
  border-radius: 4px; font-size: 14px; cursor: pointer;
}
.facets__apply-btn:hover { background: #333; }

/* ─── Active Filters ─── */
.active-filters { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.active-filters__label { font-size: 13px; color: #888; }
.active-filters__list { display: flex; flex-wrap: wrap; gap: 8px; }
.active-filters__badge {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px; background: #f3f3f3; border-radius: 20px;
  font-size: 13px; text-decoration: none; color: #111;
}
.active-filters__badge:hover { background: #e5e5e5; }
.active-filters__remove { font-size: 11px; color: #888; }
.active-filters__clear { font-size: 13px; color: #888; text-decoration: underline; }

/* ─── No results ─── */
.no-results { grid-column: 1 / -1; padding: 40px; text-align: center; color: #888; }

/* ─── Mobile ─── */
@media (max-width: 768px) {
  .collection-layout__inner { grid-template-columns: 1fr; }

  .collection-sidebar {
    position: fixed; top: 0; left: -100%; width: 80%; max-width: 320px;
    height: 100vh; background: #fff; z-index: 999;
    overflow-y: auto; padding: 24px 16px;
    transition: left 0.3s ease; box-shadow: 4px 0 20px rgba(0,0,0,0.1);
  }
  .collection-sidebar.is-open { left: 0; }

  .filter-drawer-open body { overflow: hidden; }
}
```

---

## Key Rules for AI Agent

When implementing or modifying this feature, follow these rules:

1. **Always use `value.param_name` as the input `name`** — never hardcode URL param strings. Shopify generates the correct param name automatically.

2. **Always use `value.value` as the input `value`** — not `value.label`. They may differ (e.g. label "Red" vs value "red").

3. **Preserve `sort_by`** — always include `<input type="hidden" name="sort_by" value="{{ results.sort_by }}">` inside the form so sorting is not lost when filters are applied.

4. **Disabled state matters** — when `value.count == 0 and value.active == false`, the filter value has no results. Add `disabled` attribute and visual styling to prevent user confusion.

5. **Auto-open active filter groups** — use `{% if filter.active_values.size > 0 %}open{% endif %}` on `<details>` so users can see what's currently filtered.

6. **Price values are in cents** — always divide by 100 when displaying: `filter.min_value.value | divided_by: 100.0`.

7. **Color swatches use CSS background-color** — map `value.value` (lowercase, no spaces) to a CSS color. For custom/non-standard colors, consider a Liquid map object or metafields.

8. **The `results` parameter** — snippets accept `results` which can be either `collection` (collection pages) or `search` (search results page). This makes snippets reusable across both contexts.

9. **Pagination works automatically** — Shopify handles paginating filtered results. Always wrap products in `{% paginate %}` tags.

10. **No JavaScript required for basic filtering** — the form submits as a standard GET request. JS is only needed for UX enhancements (auto-submit, mobile drawer).

---

## Adding a New Filter Type

When a new filter is added in Search & Discovery (e.g. "Material", "Brand"):

- No code changes needed if it's a `list` type — the loop `{% for filter in collection.filters %}` picks it up automatically.
- For custom display logic (e.g. image swatches instead of color names), add a condition inside the loop checking `filter.label`.

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `collection.filters` returns empty | Products lack matching variant option names | Rename product options to match filter label exactly |
| Filter applies but product count wrong | Shopify still indexing | Wait 2–5 min after saving Search & Discovery config |
| Sort resets when filter is applied | Missing hidden `sort_by` input in form | Add `<input type="hidden" name="sort_by" ...>` |
| Price filter shows cents | Missing `divided_by: 100.0` | Always convert: `filter.min_value.value \| divided_by: 100.0` |
| Color swatch shows wrong color | Value has spaces or uppercase | Use `value.value \| downcase \| replace: ' ', ''` |