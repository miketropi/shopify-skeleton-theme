# Shopify Theme — Global Section Options
**Pattern: CSS Variables + Snippet Injection** | Version 1.0 | Agent-Ready

---

## 1. Overview

**Goal:** Give every section in a Shopify theme a consistent set of merchant-configurable options (padding, margin, background color, etc.) without duplicating logic across files. The solution uses CSS Custom Properties (variables) combined with Liquid snippet injection.

> **Important:** This pattern is used by Shopify's official Dawn theme. Agents must read through Section 2 in full before creating any files.

### 1.1 How It Works

1. Each section schema declares shared settings (`padding_top`, `padding_bottom`, etc.)
2. A Liquid snippet reads those settings and injects CSS variables into a `<style>` tag
3. A CSS class uses `var()` to apply the styles
4. Each section only needs to render the snippet and add the class — no inline CSS needed

### 1.2 File Structure

```
theme/
├── assets/
│   └── base.css                   # CSS class consuming CSS variables
├── snippets/
│   └── section-styles.liquid      # Core snippet — injects CSS vars
└── sections/
    ├── hero.liquid                 # Example section using the pattern
    ├── featured-collection.liquid
    └── ...                        # All other sections
```

---

## 2. File: `snippets/section-styles.liquid`

> **This is the core file. Agents must create this first.**
> The snippet accepts a `section` object and injects CSS variables based on that section's settings.

### 2.1 Full Content

```liquid
{%- comment -%}
  snippets/section-styles.liquid
  Usage: {%- render 'section-styles', section: section -%}
  Required: Place before the first HTML tag of the section.
{%- endcomment -%}

{%- liquid
  assign pt = section.settings.padding_top | default: 40
  assign pb = section.settings.padding_bottom | default: 40
  assign mt = section.settings.margin_top | default: 0
  assign mb = section.settings.margin_bottom | default: 0
  assign bg = section.settings.background_color
  assign color_scheme = section.settings.color_scheme | default: 'scheme-1'
-%}

<style>
  #shopify-section-{{ section.id }} {
    --section-padding-top: {{ pt }}px;
    --section-padding-bottom: {{ pb }}px;
    --section-margin-top: {{ mt }}px;
    --section-margin-bottom: {{ mb }}px;
    {%- if bg != blank and bg != 'rgba(0,0,0,0)' -%}
    --section-bg: {{ bg }};
    {%- endif -%}
  }
</style>
```

---

## 3. File: `assets/base.css`

> **Append this block to the existing `base.css`. Do not create a new file.**

```css
/* ── Global Section Styles ─────────────────────────────── */
.shopify-section-wrapper {
  padding-top:      var(--section-padding-top, 40px);
  padding-bottom:   var(--section-padding-bottom, 40px);
  margin-top:       var(--section-margin-top, 0px);
  margin-bottom:    var(--section-margin-bottom, 0px);
  background-color: var(--section-bg, transparent);
}

/* Color Schemes */
.color-scheme-1 { background-color: var(--color-background-1); }
.color-scheme-2 { background-color: var(--color-background-2); }
.color-scheme-3 { background-color: var(--color-background-3); }
```

---

## 4. Schema Settings (Copy into Each Section)

> **Important:** Shopify does not support shared schemas. Agents must copy this entire settings block into the `"settings"` array of **every** section that uses this pattern.

### 4.1 Full Settings Block

```json
{
  "type": "header",
  "content": "Spacing"
},
{
  "type": "range",
  "id": "padding_top",
  "min": 0, "max": 120, "step": 4, "unit": "px",
  "label": "Padding top",
  "default": 40
},
{
  "type": "range",
  "id": "padding_bottom",
  "min": 0, "max": 120, "step": 4, "unit": "px",
  "label": "Padding bottom",
  "default": 40
},
{
  "type": "range",
  "id": "margin_top",
  "min": 0, "max": 80, "step": 4, "unit": "px",
  "label": "Margin top",
  "default": 0
},
{
  "type": "range",
  "id": "margin_bottom",
  "min": 0, "max": 80, "step": 4, "unit": "px",
  "label": "Margin bottom",
  "default": 0
},
{
  "type": "header",
  "content": "Background"
},
{
  "type": "color",
  "id": "background_color",
  "label": "Background color",
  "default": "rgba(0,0,0,0)"
},
{
  "type": "select",
  "id": "color_scheme",
  "label": "Color scheme",
  "options": [
    { "value": "scheme-1", "label": "Scheme 1" },
    { "value": "scheme-2", "label": "Scheme 2" },
    { "value": "scheme-3", "label": "Scheme 3" }
  ],
  "default": "scheme-1"
}
```

---

## 5. Usage in a Section

### 5.1 Standard Template

Every section must follow this structure:

```liquid
{%- comment -%} sections/section-name.liquid {%- endcomment -%}

{%- render 'section-styles', section: section -%}

<div class="shopify-section-wrapper color-{{ section.settings.color_scheme }}">
  <div class="container">
    <!-- Section content here -->
  </div>
</div>

{% schema %}
{
  "name": "Section Name",
  "settings": [
    { "type": "header", "content": "Spacing" },
    { "type": "range", "id": "padding_top", ... },
    { "type": "range", "id": "padding_bottom", ... },
    { "type": "range", "id": "margin_top", ... },
    { "type": "range", "id": "margin_bottom", ... },
    { "type": "header", "content": "Background" },
    { "type": "color", "id": "background_color", ... },
    { "type": "select", "id": "color_scheme", ... }

    // Add section-specific settings below
  ]
}
{% endschema %}
```

---

## 6. Agent Execution Checklist

> **Execute in order. Do not skip any step.**

| Step | Action | Target File |
|------|--------|-------------|
| 1 | Create `snippets/section-styles.liquid` with content from Section 2 | `snippets/section-styles.liquid` |
| 2 | Append CSS block from Section 3 to `base.css` | `assets/base.css` |
| 3 | Copy schema settings from Section 4.1 into each section | `sections/*.liquid` |
| 4 | Add `{%- render 'section-styles' -%}` at the top of each section | `sections/*.liquid` |
| 5 | Wrap section content with `.shopify-section-wrapper` | `sections/*.liquid` |
| 6 | Test in Shopify Theme Editor — verify spacing sliders work | Theme Editor |

---

## 7. Rules & Constraints

### 7.1 Must Do

- Always render the snippet **before** the first HTML tag of the section
- Always use class `shopify-section-wrapper` on the outermost wrapper element
- Copy the **full** schema block — do not omit or shorten any field
- Use the default values defined in Section 4.1 (`padding: 40px`, `margin: 0px`)

### 7.2 Must Not Do

- Do not write inline `style` padding/margin/background directly on the section wrapper
- Do not create separate CSS files per section — use `base.css`
- Do not rename CSS variables (`--section-padding-top`, etc.) — they must stay consistent across all sections
- Do not add a second `<style>` block to override the snippet unless section-specific overrides are explicitly required

---

## 8. FAQ

**Q: Merchant changes padding but sees no update?**

Check that the snippet is being rendered. It must appear **before** the wrapper div, not inside it.

---

**Q: How do I add a new global option (e.g. `border_radius`) to all sections?**

1. Add to `snippets/section-styles.liquid`:
```liquid
--section-border-radius: {{ section.settings.border_radius }}px;
```

2. Add to `assets/base.css`:
```css
border-radius: var(--section-border-radius, 0px);
```

3. Copy the new setting into each section's schema.

---

**Q: Can I override the global styles for a specific section?**

Yes. After rendering the snippet, add a separate `<style>` block to override any variable for that section only:

```liquid
<style>
  #shopify-section-{{ section.id }} {
    --section-padding-top: 0px; /* Override for this section only */
  }
</style>
```