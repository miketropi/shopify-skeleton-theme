# FAQ — Section Document

> **Status:** **Draft — Not Implemented.** This spec has been reviewed against project rules (`.cursor/rules/`, `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `docs/SECTION_REGISTRY.md`, `.cursor/skills/shopify-skeleton-theme/SKILL.md`) and updated accordingly. No Liquid, SCSS, TS, or template wiring exists yet.

> Two-column layout: an optional sticky "Ask Your Question" contact form on the left and a list of FAQ accordion groups on the right. Each FAQ group is a block containing a group heading and up to 8 accordion items. Single-open accordion behavior requires a small JS snippet; otherwise the section uses native `<details>` / `<summary>` HTML elements.

> **Architectural note — justified monolithic section:** The form column and FAQ column share a two-column split layout with coordinated sticky-scroll behavior (form sticks while FAQ scrolls). The form can be toggled off entirely, but when present, the form's position state is tied to the FAQ column height. The parts are tightly coupled and share the same positioning context — moving one without the other would break both. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md` → *When a monolithic section is justified*.

---

## Relationship to this theme (rules & skill)

| Topic | How this spec should align |
| --- | --- |
| **One job** | One section = **FAQ with optional contact form** in a two-column split. When form is hidden, FAQ takes full width. Justified monolithic — form sticky + FAQ height share positioning context. No hero content, no product grids, no unrelated blocks. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`. |
| **Naming** | Liquid: **`sections/section-faq.liquid`**. BEM root: **`faq`**. Interactive (accordion single-open, form AJAX optional): **`data-section-type="section-faq"`**. SCSS: **`src/styles/sections/_section-faq.scss`**. TS: **`src/scripts/sections/section-faq.ts`** (+ optional **`section-faq.runtime.ts`** if bundle warrants). Register in **`theme.ts`** before **`bootSections()`**. Skill: `.cursor/skills/shopify-skeleton-theme/SKILL.md`. |
| **Section shell** | **`{% render 'section-styles', section: section %}`** + **`shopify-section-wrapper`** on the section root for merchant padding/margin/background/border. The original `section_padding_top` / `section_padding_bottom` (range 0–160, step 8) are **replaced** by the shared section-styles contract. See `.cursor/rules/liquid-patterns.mdc` → *Section shell*. |
| **Colour** | **`section_color_scheme_mode`** (`default` \| `custom`) + **`color_scheme`** + **`{% render 'color-scheme-vars', scheme: … %}`** on the section root. Per-element overrides (`form_background_color`, `answer_color`) use the **clear = scheme** override pattern (`rgba(0,0,0,0)` default) — not hard-coded hex like `#F9F3EE` / `#666666`. See `docs/COLOR_SCHEME_SYSTEM.md`. |
| **Typography** | FAQ heading uses `heading_size` (`small` \| `medium` \| `large` \| `xlarge`) — same value range as `section-intro` heading scale. Form heading uses a separate `form_heading` text setting (not tied to `section-intro`; it's card-level, not section-intro). Question size uses `question_size` with the same scale. Font sizes consume `--font-size-*` tokens from `snippets/css-variables.liquid`. |
| **Full width** | **`full_width`** checkbox (default **`false`**) — when on, inner wrapper gets **`section-content-width`** (same contract as trust bar / promo cards). |
| **Breakpoints** | `src/styles/base/_breakpoints.scss`: **`md` 48em**, **`lg` 62em**. Prefer **`mq-up('md')` / `mq-up('lg')`** — **not** 767px / 1024px literals from the original draft. |
| **JS-driven UI** | **Accordion single-open** behavior requires JS: when one `<details>` opens, close siblings. **Form submission** uses native Shopify `{% form 'contact' %}` (no custom backend). If AJAX form submission is desired later, add JS for fetch + success/error state. JS registration: `registerSection('section-faq', …)` with **`destroy()`** cleanup (`AbortController` for event listeners). No heavy dependencies — all native browser APIs. See `.cursor/rules/liquid-patterns.mdc` → *JS-driven UI*. |
| **Schema constraints** | Use **`checkbox`** (not `toggle`), **`color_scheme`**, **`richtext`** for answers, **`textarea`** for topic options, **`range`** with min/max/step. Reuse **section-styles** setting ids from `snippets/section-styles.liquid`. Include `"disabled_on": { "groups": ["header", "footer"] }`. |
| **Locales** | Schema → **`t:sections.faq.*`** in `locales/en.default.schema.json`. Storefront runtime strings (`empty_state`, `form_field_*`, `success_message` placeholder) in `locales/en.default.json`. |
| **Theme Check** | `npm run check` after Liquid/JSON changes; `npm run build` after TS/SCSS changes. |

**Not the same section as:**

| Existing | Difference |
| --- | --- |
| **`section-contact-form`** | Contact form section is a standalone centered form (name, email, phone, message) with `section-intro` heading — no FAQ accordion, no two-column split, no sticky behavior. FAQ form is a sidebar card inside a two-column layout with FAQ content alongside it. |
| **`product-tabs` / `pdp-accordion-blocks`** | Product-page accordion is product-context only (`main-product` bound). FAQ accordion is standalone, page-agnostic, with group-level blocks. |
| **`main-page`** | Template-bound page content renderer — not an FAQ accordion system. |
| **`section-columns`** | Multi-column grid with per-column image/text/button — no accordion, no form. |

---

## Template placement (OS 2.0)

FAQ is a **reusable `section-*`** band merchants can add/reorder in any JSON template. Typical use:

| Template | Suggested usage |
| --- | --- |
| **`page.faq.json`** / **`page.<handle>.json`** | Dedicated FAQ page — this section as the primary content. |
| **`index.json`** | Homepage FAQ band below hero/features. |
| **`product.json`** | Below-the-fold product FAQ (shipping, care, returns). |
| **`page.contact.json`** | Below the contact form as supplementary FAQ. |

No template-specific coupling — works anywhere.

---

## Section settings (functional spec)

### Layout

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `column_layout` | select | `30-70` | Width ratio: `30-70` (form 30% / FAQ 70%), `40-60` (form 40% / FAQ 60%). On tablet/mobile (`< lg`): single column — FAQ first, form below. |
| `full_width` | checkbox | `false` | Full-bleed section background; content constrained to `section-content-width`. |
| *(shell)* | — | — | **`padding_*`**, **`margin_*`**, **`background_color`**, **`border_*`**, corner radii from **section-styles**. Replaces the original `section_padding_top`, `section_padding_bottom`. |

### Form Column (Left)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_form` | checkbox | `true` | Show or hide the contact form column. When hidden, FAQ accordion takes full width. |
| `form_sticky` | checkbox | `true` | Keep the form sticky while FAQ scrolls. Uses `position: sticky` + `align-self: flex-start`. Disabled below `lg` and when `prefers-reduced-motion`. |
| `form_sticky_offset` | range | `80` | Sticky top offset in px. Min 0, max 160, step 8. Accounts for fixed header height. |
| `form_heading` | text | `"Ask Your Question"` | Heading text at the top of the form card. |
| `form_subtext` | text | `"Ask Anything. We're Here to Help"` | Short description below the form heading. |
| `form_background_color` | color | `rgba(0,0,0,0)` | Background color of the form card. Clear inherits from scheme `--cs-background`. |
| `form_card_radius` | select | `medium` | Corner rounding of the form card: `none` (0), `small` (8px), `medium` (16px), `large` (24px). |

### Form Fields

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `show_name_field` | checkbox | `true` | Show a Name input field in the form. |
| `name_label` | text | `"Name"` | Label for the name field. |
| `show_topic_dropdown` | checkbox | `true` | Show a topic/category dropdown. |
| `topic_label` | text | `"How can we help you?"` | Label for the topic dropdown. |
| `topic_options` | textarea | _(empty)_ | Comma-separated list of dropdown options. Parsed in Liquid via `\| split: ","`. |
| `show_message_field` | checkbox | `true` | Show a Message textarea in the form. |
| `message_label` | text | `"Message"` | Label for the message textarea. |
| `message_placeholder` | text | `"Your message..."` | Placeholder text inside the message textarea. |
| `submit_label` | text | `"Send Request"` | Label for the form submit button. |
| `submit_button_style` | select | `filled` | `filled` → `--cs-btn-primary-*` tokens. `outlined` → `--cs-btn-secondary-*` tokens. |
| `form_recipient` | text | _(empty)_ | Email address for form submissions. Falls back to store contact email if empty (see `settings.contact_email`). |
| `success_message` | text | `"Thank you! We'll get back to you shortly."` | Message shown after successful form submission. |

### FAQ Column (Right)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `accordion_behavior` | select | `single` | `single` — opening one closes others (needs JS). `multiple` — multiple items can be open (native `<details>` only). |
| `first_item_open` | checkbox | `true` | Automatically expand the first FAQ item on page load. |
| `show_divider` | checkbox | `true` | Show a horizontal divider line between accordion items. |
| `icon_style` | select | `chevron` | Toggle icon: `chevron` (∧ ∨), `plus` (+ −). |
| `question_size` | select | `medium` | Font size of FAQ question text: `small`, `medium`, `large`. Same scale as heading sizes. |
| `answer_color` | color | `rgba(0,0,0,0)` | Answer text color. Clear uses scheme `--cs-text`. |

### Colour

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `section_color_scheme_mode` | select | `default` | `default` — uses global scheme. `custom` — picks from `color_scheme`. Same pattern as trust bar / promo cards. |
| `color_scheme` | color_scheme | `scheme-6` | When mode is `custom`. Visible only when `section_color_scheme_mode == 'custom'`. |

---

## FAQ Group block settings (functional spec)

Each block = one FAQ group with a shared heading and up to 8 accordion Q&A pairs. Empty question/answer pairs are automatically hidden.

### Block — Group heading

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `group_heading` | text | _(empty)_ | Group heading displayed above the accordion items. Leave empty to hide. |

### Block — Items (1–8)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `q1`…`q8` | text | _(empty)_ | Question text. Hidden if blank. |
| `a1`…`a8` | richtext | _(empty)_ | Answer text. Supports bold, italic, links, lists via Shopify `richtext` type. Hidden if blank. |

> 💡 Empty question/answer pairs are automatically hidden — merchants only fill in as many as needed per group. Skip rendering in Liquid: `{% if block.settings.q1 != blank %}…{% endif %}`.

---

## Responsive behavior (theme breakpoints)

Mobile-first SCSS. Use `mq-up('md')` / `mq-up('lg')` from `src/styles/base/_breakpoints.scss`.

| Concern | `< md` (< 48em) | `md` – `lg` (48em–62em) | `lg+` (≥ 62em) |
| --- | --- | --- | --- |
| **Layout** | Single column — FAQ first, form below (when visible) | Single column — FAQ first, form below | Two columns (form \| FAQ) |
| **Form sticky** | Disabled (`position: static`) | Disabled | Active when `form_sticky` is on |
| **Form card** | Full width | Full width | Sidebar width per `column_layout` |
| **Accordion** | As configured | As configured | As configured |
| **Group headings** | Visible | Visible | Visible |

> 📱 **Mobile & Tablet:** The form drops out of the sticky column and stacks below the FAQ accordion at full width. FAQ content takes priority as the primary content. Sticky form is disabled to avoid poor UX on limited viewport height.

---

## Accessibility

| Requirement | Implementation hint |
| --- | --- |
| **Accordion** | Use native `<details>` / `<summary>` for built-in keyboard (Enter/Space to toggle), screen reader announcement, and `open` state. |
| **Single-open JS** | Only close sibling `<details>` via `toggle` event listener — do not break keyboard navigation or focus. |
| **Heading hierarchy** | FAQ group headings use `<h3>`; form heading uses `<h2>` or appropriate level for page outline. |
| **Form labels** | All inputs have `<label>` with matching `for`/`id`. Required fields marked with `aria-required="true"`. |
| **Success state** | After form submission, show success message with `role="status"` and `aria-live="polite"`. |
| **Reduced motion** | Disable form sticky (`position: static`) when `prefers-reduced-motion: reduce`. |
| **Keyboard** | All accordion items (via `<details>` / `<summary>`), form inputs, and submit button remain tabbable in natural DOM order. |

---

## Suggested file map (implementation)

| Artifact | Path |
| --- | --- |
| Section | `sections/section-faq.liquid` |
| Styles | `src/styles/sections/_section-faq.scss` |
| Style forward | `@forward 'section-faq';` in `src/styles/sections/index.scss` |
| Scripts | `src/scripts/sections/section-faq.ts` (+ optional `section-faq.runtime.ts`) |
| Register | `src/scripts/theme.ts` before `bootSections()` |
| Locales | `sections.faq` in `locales/en.default.schema.json` + `sections.faq.*` in `locales/en.default.json` |
| Docs | This file |

---

## Shopify schema — illustrative JSON

Production schema must use **`t:sections.faq.*`** keys, merge **section-styles** settings, and follow schema constraints above.

```json
{
  "name": "t:sections.faq.name",
  "tag": "section",
  "class": "section-faq",
  "disabled_on": {
    "groups": ["header", "footer"]
  },
  "max_blocks": 6,
  "settings": [
    { "type": "header", "content": "t:sections.faq.headers.layout" },
    { "type": "select", "id": "column_layout", "label": "t:sections.faq.labels.column_layout", "default": "30-70", "options": [
      { "value": "30-70", "label": "t:sections.faq.options.column_layout.narrow_form" },
      { "value": "40-60", "label": "t:sections.faq.options.column_layout.wide_form" }
    ]},
    { "type": "checkbox", "id": "full_width", "label": "t:sections.faq.labels.full_width", "default": false },

    { "type": "header", "content": "t:sections.faq.headers.form_column" },
    { "type": "checkbox", "id": "show_form", "label": "t:sections.faq.labels.show_form", "default": true },
    { "type": "checkbox", "id": "form_sticky", "label": "t:sections.faq.labels.form_sticky", "default": true, "info": "t:sections.faq.info.form_sticky" },
    { "type": "range", "id": "form_sticky_offset", "label": "t:sections.faq.labels.form_sticky_offset", "min": 0, "max": 160, "step": 8, "unit": "px", "default": 80 },
    { "type": "text", "id": "form_heading", "label": "t:sections.faq.labels.form_heading", "default": "Ask Your Question" },
    { "type": "text", "id": "form_subtext", "label": "t:sections.faq.labels.form_subtext", "default": "Ask Anything. We're Here to Help" },
    { "type": "color", "id": "form_background_color", "label": "t:sections.faq.labels.form_background_color", "default": "rgba(0,0,0,0)", "info": "t:sections.faq.info.form_background_color" },
    { "type": "select", "id": "form_card_radius", "label": "t:sections.faq.labels.form_card_radius", "default": "medium", "options": [
      { "value": "none", "label": "t:sections.faq.options.radius.none" },
      { "value": "small", "label": "t:sections.faq.options.radius.small" },
      { "value": "medium", "label": "t:sections.faq.options.radius.medium" },
      { "value": "large", "label": "t:sections.faq.options.radius.large" }
    ]},

    { "type": "header", "content": "t:sections.faq.headers.form_fields" },
    { "type": "checkbox", "id": "show_name_field", "label": "t:sections.faq.labels.show_name_field", "default": true },
    { "type": "text", "id": "name_label", "label": "t:sections.faq.labels.name_label", "default": "Name" },
    { "type": "checkbox", "id": "show_topic_dropdown", "label": "t:sections.faq.labels.show_topic_dropdown", "default": true },
    { "type": "text", "id": "topic_label", "label": "t:sections.faq.labels.topic_label", "default": "How can we help you?" },
    { "type": "textarea", "id": "topic_options", "label": "t:sections.faq.labels.topic_options", "info": "t:sections.faq.info.topic_options" },
    { "type": "checkbox", "id": "show_message_field", "label": "t:sections.faq.labels.show_message_field", "default": true },
    { "type": "text", "id": "message_label", "label": "t:sections.faq.labels.message_label", "default": "Message" },
    { "type": "text", "id": "message_placeholder", "label": "t:sections.faq.labels.message_placeholder", "default": "Your message..." },
    { "type": "text", "id": "submit_label", "label": "t:sections.faq.labels.submit_label", "default": "Send Request" },
    { "type": "select", "id": "submit_button_style", "label": "t:sections.faq.labels.submit_button_style", "default": "filled", "options": [
      { "value": "filled", "label": "t:sections.faq.options.button_style.filled" },
      { "value": "outlined", "label": "t:sections.faq.options.button_style.outlined" }
    ]},
    { "type": "text", "id": "form_recipient", "label": "t:sections.faq.labels.form_recipient", "info": "t:sections.faq.info.form_recipient" },
    { "type": "text", "id": "success_message", "label": "t:sections.faq.labels.success_message", "default": "Thank you! We'll get back to you shortly." },

    { "type": "header", "content": "t:sections.faq.headers.faq_column" },
    { "type": "select", "id": "accordion_behavior", "label": "t:sections.faq.labels.accordion_behavior", "default": "single", "options": [
      { "value": "single", "label": "t:sections.faq.options.accordion_behavior.single" },
      { "value": "multiple", "label": "t:sections.faq.options.accordion_behavior.multiple" }
    ]},
    { "type": "checkbox", "id": "first_item_open", "label": "t:sections.faq.labels.first_item_open", "default": true },
    { "type": "checkbox", "id": "show_divider", "label": "t:sections.faq.labels.show_divider", "default": true },
    { "type": "select", "id": "icon_style", "label": "t:sections.faq.labels.icon_style", "default": "chevron", "options": [
      { "value": "chevron", "label": "t:sections.faq.options.icon_style.chevron" },
      { "value": "plus", "label": "t:sections.faq.options.icon_style.plus" }
    ]},
    { "type": "select", "id": "question_size", "label": "t:sections.faq.labels.question_size", "default": "medium", "options": [
      { "value": "small", "label": "t:sections.faq.options.question_size.small" },
      { "value": "medium", "label": "t:sections.faq.options.question_size.medium" },
      { "value": "large", "label": "t:sections.faq.options.question_size.large" }
    ]},
    { "type": "color", "id": "answer_color", "label": "t:sections.faq.labels.answer_color", "default": "rgba(0,0,0,0)", "info": "t:sections.faq.info.answer_color" },

    { "type": "header", "content": "t:sections.faq.headers.colour" },
    { "type": "select", "id": "section_color_scheme_mode", "label": "t:sections.faq.labels.section_color_scheme_mode", "options": [
      { "value": "default", "label": "t:sections.faq.options.color_scheme_mode.default" },
      { "value": "custom", "label": "t:sections.faq.options.color_scheme_mode.custom" }
    ], "default": "default" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.faq.labels.color_scheme", "default": "scheme-6", "visible_if": "{{ section.settings.section_color_scheme_mode == 'custom' }}" },

    "/* === section-styles settings (padding, margin, background, border, radii) === */",

    { "type": "header", "content": "t:sections.faq.headers.padding" },
    { "type": "range", "id": "padding_top", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.faq.labels.padding_top", "default": 80 },
    { "type": "range", "id": "padding_right", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.faq.labels.padding_right", "default": 0 },
    { "type": "range", "id": "padding_bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "label": "t:sections.faq.labels.padding_bottom", "default": 80 },
    { "type": "range", "id": "padding_left", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.faq.labels.padding_left", "default": 0 },
    { "type": "header", "content": "t:sections.faq.headers.margin" },
    { "type": "range", "id": "margin_top", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.faq.labels.margin_top", "default": 0 },
    { "type": "range", "id": "margin_bottom", "min": 0, "max": 80, "step": 4, "unit": "px", "label": "t:sections.faq.labels.margin_bottom", "default": 0 },
    { "type": "header", "content": "t:sections.faq.headers.background" },
    { "type": "color", "id": "background_color", "label": "t:sections.faq.labels.background_color", "default": "rgba(0,0,0,0)", "info": "t:sections.faq.info.background_color" },
    { "type": "header", "content": "t:sections.faq.headers.border" },
    { "type": "range", "id": "border_width", "min": 0, "max": 8, "step": 1, "unit": "px", "label": "t:sections.faq.labels.border_width", "default": 0 },
    { "type": "select", "id": "border_style", "label": "t:sections.faq.labels.border_style", "options": [
      { "value": "none", "label": "t:sections.faq.options.border_style.none" },
      { "value": "solid", "label": "t:sections.faq.options.border_style.solid" },
      { "value": "dashed", "label": "t:sections.faq.options.border_style.dashed" },
      { "value": "dotted", "label": "t:sections.faq.options.border_style.dotted" }
    ], "default": "solid" },
    { "type": "color", "id": "border_color", "label": "t:sections.faq.labels.border_color", "default": "rgba(0,0,0,0)", "info": "t:sections.faq.info.border_color" },
    { "type": "header", "content": "t:sections.faq.headers.radius" },
    { "type": "range", "id": "border_radius_top_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.faq.labels.radius_tl", "default": 0 },
    { "type": "range", "id": "border_radius_top_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.faq.labels.radius_tr", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_right", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.faq.labels.radius_br", "default": 0 },
    { "type": "range", "id": "border_radius_bottom_left", "min": 0, "max": 48, "step": 1, "unit": "px", "label": "t:sections.faq.labels.radius_bl", "default": 0 }
  ],
  "blocks": [
    {
      "type": "faq_group",
      "name": "t:sections.faq.blocks.faq_group.name",
      "settings": [
        { "type": "text", "id": "group_heading", "label": "t:sections.faq.blocks.faq_group.labels.group_heading", "info": "t:sections.faq.blocks.faq_group.info.group_heading" },
        { "type": "header", "content": "t:sections.faq.blocks.faq_group.headers.item_1" },
        { "type": "text", "id": "q1", "label": "t:sections.faq.blocks.faq_group.labels.question" },
        { "type": "richtext", "id": "a1", "label": "t:sections.faq.blocks.faq_group.labels.answer" },
        { "type": "header", "content": "t:sections.faq.blocks.faq_group.headers.item_2" },
        { "type": "text", "id": "q2", "label": "t:sections.faq.blocks.faq_group.labels.question" },
        { "type": "richtext", "id": "a2", "label": "t:sections.faq.blocks.faq_group.labels.answer" },
        { "type": "header", "content": "t:sections.faq.blocks.faq_group.headers.item_3" },
        { "type": "text", "id": "q3", "label": "t:sections.faq.blocks.faq_group.labels.question" },
        { "type": "richtext", "id": "a3", "label": "t:sections.faq.blocks.faq_group.labels.answer" },
        { "type": "header", "content": "t:sections.faq.blocks.faq_group.headers.item_4" },
        { "type": "text", "id": "q4", "label": "t:sections.faq.blocks.faq_group.labels.question" },
        { "type": "richtext", "id": "a4", "label": "t:sections.faq.blocks.faq_group.labels.answer" },
        { "type": "header", "content": "t:sections.faq.blocks.faq_group.headers.item_5" },
        { "type": "text", "id": "q5", "label": "t:sections.faq.blocks.faq_group.labels.question" },
        { "type": "richtext", "id": "a5", "label": "t:sections.faq.blocks.faq_group.labels.answer" },
        { "type": "header", "content": "t:sections.faq.blocks.faq_group.headers.item_6" },
        { "type": "text", "id": "q6", "label": "t:sections.faq.blocks.faq_group.labels.question" },
        { "type": "richtext", "id": "a6", "label": "t:sections.faq.blocks.faq_group.labels.answer" },
        { "type": "header", "content": "t:sections.faq.blocks.faq_group.headers.item_7" },
        { "type": "text", "id": "q7", "label": "t:sections.faq.blocks.faq_group.labels.question" },
        { "type": "richtext", "id": "a7", "label": "t:sections.faq.blocks.faq_group.labels.answer" },
        { "type": "header", "content": "t:sections.faq.blocks.faq_group.headers.item_8" },
        { "type": "text", "id": "q8", "label": "t:sections.faq.blocks.faq_group.labels.question" },
        { "type": "richtext", "id": "a8", "label": "t:sections.faq.blocks.faq_group.labels.answer" }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.faq.presets.name",
      "blocks": [
        { "type": "faq_group" }
      ]
    }
  ]
}
```

> Merge **section-styles** settings in the same order as `section-trust-bar.liquid` / `section-contact-form.liquid` — after colour, before blocks. The `"/* === section-styles … === */"` comment above marks the insertion point.

---

## Implementation checklist (from project skill)

1. Read `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`, `docs/SECTION_REGISTRY.md`, `docs/COLOR_SCHEME_SYSTEM.md`, `.cursor/rules/liquid-patterns.mdc`.
2. Liquid: `section-styles` + `shopify-section-wrapper`; `faq` BEM root; `data-section-type="section-faq"` for JS registration; color-scheme-vars on root (same pattern as trust bar / promo cards); `full_width` + `section-content-width` inner wrapper; native `{% form 'contact' %}` for the form column.
3. SCSS: mobile-first `mq-up('md')` / `mq-up('lg')`; two-column grid at `lg+`; form sticky via CSS `position: sticky` + `align-self: flex-start`; accordion `<details>` / `<summary>` styling with custom toggle icons; `prefers-reduced-motion` disables sticky.
4. TS: `registerSection('section-faq', …)`; single-open accordion behavior (close sibling `<details>` on `toggle` event); `destroy()` cleanup with `AbortController`; no heavy dependencies — native DOM APIs only.
5. Schema: `t:` keys in `locales/en.default.schema.json`; merge section-styles settings; `checkbox` not `toggle`; `richtext` for answers; `disabled_on`; `max_blocks: 6`; presets with 1 default FAQ group block.
6. `npm run check` + `npm run build`.

---

## Implementation notes

- **Accordion base:** Use native `<details>` / `<summary>` HTML elements for built-in keyboard support, screen reader announcement, and open/close semantics — no custom ARIA widgets needed.
- **Single-open behavior:** JS `toggle` event listener on the FAQ container (event delegation). When a `<details>` opens, iterate siblings and set `.open = false`. Multiple-open mode needs no JS — native `<details>` handles it.
- **Empty Q&A pairs:** Skip rendering in Liquid: `{% if block.settings.q1 != blank and block.settings.a1 != blank %}…{% endif %}`. No empty accordion items in the DOM.
- **Form submission:** Use Shopify's native `{% form 'contact' %}` with `action="/contact"`, `method="post"`. The topic dropdown value maps to `contact[body]` prefix or a hidden field (e.g., `<input type="hidden" name="contact[body]" value="[Topic]: ...">`). Form submission causes a full page reload with success/error state — this is acceptable for v1. AJAX form submission can be added later as progressive enhancement.
- **Topic options** are parsed from the comma-separated `topic_options` textarea in Liquid: `{% assign topics = section.settings.topic_options | split: "," %}` and rendered as `<option>` tags with a default "Select a topic" placeholder.
- **Form sticky** is CSS-only: `position: sticky; top: var(--faq-sticky-offset); align-self: flex-start` on the form column. `align-self: flex-start` is critical — without it, the column stretches to match the FAQ column height and `position: sticky` has no visual effect.
- **Form card styling:** `form_background_color` with `rgba(0,0,0,0)` default (clear = scheme `--cs-background`). `form_card_radius` key maps to px: `none`=0, `small`=8, `medium`=16, `large`=24.
- **Accordion dividers:** When `show_divider` is on, add `border-bottom` to each accordion item. Last item omits the border. Color uses `--cs-border` from scheme by default.
- **Toggle icons:** CSS-only custom icons via `::marker` or `::after` pseudo-elements on `<summary>`. Chevron: rotate on open. Plus/Minus: swap content on open.
- **`first_item_open`:** Add `open` attribute to the first `<details>` element in Liquid when the setting is true. JS single-open behavior does not auto-close the first item — it only closes siblings when a *new* item is opened.
- **`max_blocks: 6`** = 6 FAQ groups × 8 items each = up to 48 FAQ items total.
- **Richtext answers** use Shopify's `richtext` schema type which outputs HTML directly — supports `<b>`, `<i>`, `<a>`, `<ul>`, `<ol>`, `<br>`. Render with `{{ block.settings.a1 }}` (no escape).
- **Column layout values** (`30-70`, `40-60`): CSS Grid `grid-template-columns: 30% 1fr` / `40% 1fr` at `lg+`. Below `lg`, single column (FAQ first, form below). When `show_form` is off, FAQ spans `1fr` only.
