# Trust Bar — Section Document

> A horizontal row of icon + heading + description items highlighting key store policies or benefits. Typically used as a full-width strip between content sections.

---

![Trust Bar section example mock](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/Trust%20Bar.jpg)

## Section Settings

| Option | Type | Default | Description |
|---|---|---|---|
| `layout` | select | `Grid` | Display mode: Grid (equal columns, no scroll), Carousel (horizontal scroll on mobile). |
| `show_dividers` | toggle | `true` | Show vertical divider lines between items. |
| `text_alignment` | select | `Center` | Text alignment for all items: Left, Center. |
| `background_color` | color | `#FFFFFF` | Background color of the trust bar section. |
| `text_color` | color | `#1A1A1A` | Default text color for all headings and descriptions. |
| `icon_color` | color | `#1A1A1A` | Color applied to all icons. |
| `section_padding_top` | range | `40` | Top padding in px. Range: 0–120, step 8. |
| `section_padding_bottom` | range | `40` | Bottom padding in px. Range: 0–120, step 8. |

---

## Trust Item Block

Each block is one trust item. Merchant can reorder, add, or remove blocks freely.

| Option | Type | Default | Description |
|---|---|---|---|
| `icon` | select | `None` | Predefined icon from the theme icon library. Options: Return, Shipping, Support, Member/Badge, Leaf, Shield, Heart, Gift, Lock, Star. |
| `custom_icon` | image | _(empty)_ | Upload a custom SVG or PNG icon. Overrides the predefined `icon` if set. Recommended size: 40×40px. |
| `heading` | text | _(empty)_ | Item heading. Example: *"14-Day Returns"*, *"Free Shipping"*. |
| `description` | text | _(empty)_ | Short supporting text below the heading. Example: *"Risk-free shopping with easy returns."* |

---

## Responsive Behavior

| Setting | Desktop ≥ 1024px | Tablet 768–1023px | Mobile ≤ 767px |
|---|---|---|---|
| Layout | Equal columns (1 per block) | 2 columns grid | Carousel (1.5 visible, peek) |
| Dividers | Visible | Hidden | Hidden |
| Text alignment | As configured | Center | Center |
| Icon size | 40px | 36px | 32px |

> 📱 **Mobile:** Switches to a carousel with 1.5 items visible to signal scrollability. Dividers are hidden in multi-row and carousel modes.

---

## Shopify Schema — Suggested Structure

```json
{
  "name": "Trust Bar",
  "settings": [
    { "type": "select", "id": "layout", "label": "Layout", "default": "grid", "options": [
      { "value": "grid", "label": "Grid" },
      { "value": "carousel", "label": "Carousel" }
    ]},
    { "type": "checkbox", "id": "show_dividers", "label": "Show dividers", "default": true },
    { "type": "select", "id": "text_alignment", "label": "Text alignment", "default": "center", "options": [
      { "value": "left", "label": "Left" },
      { "value": "center", "label": "Center" }
    ]},
    { "type": "color", "id": "background_color", "label": "Background color", "default": "#FFFFFF" },
    { "type": "color", "id": "text_color", "label": "Text color", "default": "#1A1A1A" },
    { "type": "color", "id": "icon_color", "label": "Icon color", "default": "#1A1A1A" },
    { "type": "range", "id": "section_padding_top", "label": "Padding top (px)", "min": 0, "max": 120, "step": 8, "default": 40 },
    { "type": "range", "id": "section_padding_bottom", "label": "Padding bottom (px)", "min": 0, "max": 120, "step": 8, "default": 40 }
  ],
  "blocks": [
    {
      "type": "trust_item",
      "name": "Trust Item",
      "settings": [
        { "type": "select", "id": "icon", "label": "Icon", "default": "none", "options": [
          { "value": "none", "label": "None" },
          { "value": "return", "label": "Return" },
          { "value": "shipping", "label": "Shipping" },
          { "value": "support", "label": "Support" },
          { "value": "member", "label": "Member / Badge" },
          { "value": "leaf", "label": "Leaf" },
          { "value": "shield", "label": "Shield" },
          { "value": "heart", "label": "Heart" },
          { "value": "gift", "label": "Gift" },
          { "value": "lock", "label": "Lock" },
          { "value": "star", "label": "Star" }
        ]},
        { "type": "image_picker", "id": "custom_icon", "label": "Custom icon", "info": "Overrides the predefined icon if set. SVG or PNG, 40×40px recommended." },
        { "type": "text", "id": "heading", "label": "Heading" },
        { "type": "text", "id": "description", "label": "Description" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [{ "name": "Trust Bar" }]
}
```

---

## Implementation Notes

- Icons are rendered as inline SVGs from the theme icon library. `icon_color` is applied via `fill` or `stroke` using `currentColor`.
- **Custom icon** via `image_picker` is a fallback for merchants who need a brand-specific icon not in the library. Render as an `<img>` tag with fixed `width` and `height`.
- Dividers are CSS `border-right` on each item except the last — hidden automatically when wrapping to multiple rows on tablet/mobile.
- Maximum of **6 blocks** — 4 is the most common and visually balanced count for this pattern.