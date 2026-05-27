# Map Location — Section Document

> Full-width interactive map with a floating information card overlay. Displays store location via Google Maps embed with contact details, address, and opening hours shown in a card positioned over the map.

---

![Map Location section example](https://pub-0645c3b9d3674132af6b362484df0f3c.r2.dev/map-location.jpg)

## Section Settings — Map

| Option | Type | Default | Description |
|---|---|---|---|
| `map_api_key` | text | _(empty)_ | Google Maps Embed API key. Required to render the interactive map. If empty, falls back to a static map image. |
| `map_address` | text | _(empty)_ | Address used to center the map pin. Example: *"2163 Phillips Gap Rd, West Jefferson, North Carolina, United States"*. |
| `map_zoom` | range | `14` | Map zoom level. Range: 8 (city) – 18 (street level). Default: 14 (neighborhood). |
| `map_style` | select | `Default` | Map color style: Default (Google standard), Light (muted/greyscale), Dark. Light and Dark require a custom map style JSON via Google Cloud Console. |
| `section_height` | select | `Medium (480px)` | Height of the map section: Small (320px), Medium (480px), Large (600px). |
| `map_border_radius` | select | `Medium (16px)` | Corner rounding of the map container. Options: None, Small (8px), Medium (16px), Large (24px). |
| `static_map_image` | image | _(empty)_ | Fallback static map image shown when no API key is provided or on map load failure. Recommended size: ≥ 1440×600px. |

---

## Section Settings — Info Card

| Option | Type | Default | Description |
|---|---|---|---|
| `card_position` | select | `Right` | Horizontal position of the info card over the map: Left, Right. |
| `card_heading` | text | `Information` | Heading text at the top of the info card. |
| `card_background_color` | color | `#FFFFFF` | Background color of the info card. |
| `card_border_radius` | select | `Medium (12px)` | Corner rounding of the info card. Options: None, Small (8px), Medium (12px), Large (20px). |
| `card_shadow` | toggle | `true` | Apply a soft drop shadow to the info card. |

---

## Section Settings — Contact Details

| Option | Type | Default | Description |
|---|---|---|---|
| `show_phone` | toggle | `true` | Show phone number in the info card. |
| `phone_label` | text | `Phone:` | Label for the phone field. |
| `phone_number` | text | _(empty)_ | Phone number. Example: *"+1 666 234 8888"*. |
| `show_email` | toggle | `true` | Show email address in the info card. |
| `email_label` | text | `Email:` | Label for the email field. |
| `email_address` | text | _(empty)_ | Email address. Example: *"hi.avitex@gmail.com"*. |
| `show_address` | toggle | `true` | Show store address in the info card. |
| `address_label` | text | `Address:` | Label for the address field. |
| `address` | textarea | _(empty)_ | Full store address. Example: *"2163 Phillips Gap Rd, West Jefferson, North Carolina, United States"*. |

---

## Section Settings — Opening Hours

| Option | Type | Default | Description |
|---|---|---|---|
| `show_hours` | toggle | `true` | Show opening hours in the info card. |
| `hours_label` | text | `Open Time:` | Label for the opening hours section. |
| `hours_row_1_days` | text | _(empty)_ | Days label for row 1. Example: *"Mon - Sat:"*. |
| `hours_row_1_time` | text | _(empty)_ | Hours for row 1. Example: *"7:30am – 8:00pm PST"*. |
| `hours_row_2_days` | text | _(empty)_ | Days label for row 2. Example: *"Sunday:"*. |
| `hours_row_2_time` | text | _(empty)_ | Hours for row 2. Example: *"9:00am – 5:00pm PST"*. |
| `hours_row_3_days` | text | _(empty)_ | Days label for row 3 (optional). Leave empty to hide. |
| `hours_row_3_time` | text | _(empty)_ | Hours for row 3 (optional). |

---

## Responsive Behavior

| Setting | Desktop ≥ 1024px | Tablet 768–1023px | Mobile ≤ 767px |
|---|---|---|---|
| Layout | Map full width, info card overlaid | Map full width, info card overlaid | Map top, info card stacked below |
| Info card position | Floating overlay (left or right) | Floating overlay (left or right) | Full width below map |
| Map height | As configured | As configured | Small (280px) fixed |
| Map interaction | Fully interactive | Fully interactive | Fully interactive |
| Card shadow | Visible | Visible | Hidden |

> 📱 **Mobile:** The info card drops out of the overlay and stacks below the map at full width. The map height reduces to 280px to keep the card reachable without excessive scrolling.

---

## Shopify Schema — Suggested Structure

```json
{
  "name": "Map Location",
  "settings": [
    { "type": "header", "content": "Map" },
    { "type": "text", "id": "map_api_key", "label": "Google Maps API key", "info": "Required for interactive map. Leave empty to use a static fallback image." },
    { "type": "text", "id": "map_address", "label": "Map address", "info": "Used to place the map pin and center the map." },
    { "type": "range", "id": "map_zoom", "label": "Zoom level", "min": 8, "max": 18, "step": 1, "default": 14 },
    { "type": "select", "id": "map_style", "label": "Map style", "default": "default", "options": [
      { "value": "default", "label": "Default" },
      { "value": "light", "label": "Light (greyscale)" },
      { "value": "dark", "label": "Dark" }
    ]},
    { "type": "select", "id": "section_height", "label": "Section height", "default": "medium", "options": [
      { "value": "small", "label": "Small (320px)" },
      { "value": "medium", "label": "Medium (480px)" },
      { "value": "large", "label": "Large (600px)" }
    ]},
    { "type": "select", "id": "map_border_radius", "label": "Map border radius", "default": "medium", "options": [
      { "value": "none", "label": "None" },
      { "value": "small", "label": "Small (8px)" },
      { "value": "medium", "label": "Medium (16px)" },
      { "value": "large", "label": "Large (24px)" }
    ]},
    { "type": "image_picker", "id": "static_map_image", "label": "Static map fallback image" },
    { "type": "header", "content": "Info Card" },
    { "type": "select", "id": "card_position", "label": "Card position", "default": "right", "options": [
      { "value": "left", "label": "Left" },
      { "value": "right", "label": "Right" }
    ]},
    { "type": "text", "id": "card_heading", "label": "Card heading", "default": "Information" },
    { "type": "color", "id": "card_background_color", "label": "Card background color", "default": "#FFFFFF" },
    { "type": "select", "id": "card_border_radius", "label": "Card border radius", "default": "medium", "options": [
      { "value": "none", "label": "None" },
      { "value": "small", "label": "Small (8px)" },
      { "value": "medium", "label": "Medium (12px)" },
      { "value": "large", "label": "Large (20px)" }
    ]},
    { "type": "checkbox", "id": "card_shadow", "label": "Show card shadow", "default": true },
    { "type": "header", "content": "Contact Details" },
    { "type": "checkbox", "id": "show_phone", "label": "Show phone", "default": true },
    { "type": "text", "id": "phone_label", "label": "Phone label", "default": "Phone:" },
    { "type": "text", "id": "phone_number", "label": "Phone number" },
    { "type": "checkbox", "id": "show_email", "label": "Show email", "default": true },
    { "type": "text", "id": "email_label", "label": "Email label", "default": "Email:" },
    { "type": "text", "id": "email_address", "label": "Email address" },
    { "type": "checkbox", "id": "show_address", "label": "Show address", "default": true },
    { "type": "text", "id": "address_label", "label": "Address label", "default": "Address:" },
    { "type": "textarea", "id": "address", "label": "Address" },
    { "type": "header", "content": "Opening Hours" },
    { "type": "checkbox", "id": "show_hours", "label": "Show opening hours", "default": true },
    { "type": "text", "id": "hours_label", "label": "Hours label", "default": "Open Time:" },
    { "type": "text", "id": "hours_row_1_days", "label": "Row 1 — Days" },
    { "type": "text", "id": "hours_row_1_time", "label": "Row 1 — Hours" },
    { "type": "text", "id": "hours_row_2_days", "label": "Row 2 — Days" },
    { "type": "text", "id": "hours_row_2_time", "label": "Row 2 — Hours" },
    { "type": "text", "id": "hours_row_3_days", "label": "Row 3 — Days (optional)" },
    { "type": "text", "id": "hours_row_3_time", "label": "Row 3 — Hours (optional)" }
  ],
  "max_blocks": 0,
  "presets": [{ "name": "Map Location" }]
}
```

---

## Implementation Notes

- **No blocks** — single-instance section, all config at settings level.
- **Google Maps** is embedded via the Maps JavaScript API (not the Embed API) to support custom map styles. The `map_api_key` is passed as a Liquid variable and injected into the `<script>` tag at render time — never hardcoded.
- **Static fallback**: when `map_api_key` is empty or the API fails to load, render `static_map_image` as a plain `<img>` behind the info card. The map pin can be simulated with a CSS-positioned SVG icon over the static image.
- **Map styles**: Light and Dark modes use a `styles` array passed to the `google.maps.Map` constructor. Store the style JSON as a theme asset (e.g. `map-style-light.json`, `map-style-dark.json`) and load the appropriate one based on the `map_style` setting.
- **Info card overlay**: positioned absolutely within the map container using `position: absolute; top: 50%; transform: translateY(-50%); right: 24px` (or left). On mobile, card exits the overlay and renders as a normal block below the map via a CSS breakpoint.
- **Phone and email** should be rendered as `<a href="tel:...">` and `<a href="mailto:...">` for tap-to-call and tap-to-email on mobile.
- **API key security**: restrict the Google Maps API key to the store domain in Google Cloud Console to prevent unauthorized usage.