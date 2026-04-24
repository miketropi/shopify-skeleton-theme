# Feature: Size Guide Modal with Section Rendering API

## Goal

Build a Size Guide modal on the product page that loads content via Shopify's Section Rendering API. Content is sourced from product metafields when available, falling back to global theme settings. The modal opens on button click, fetches HTML via AJAX (cached after first load), and supports close via button, overlay click, and ESC key.

---

## 1. Architecture Overview

```
User clicks "Size Guide" button
  → JS fetches: GET /products/{handle}?section_id=size-guide
  → Shopify renders size-guide.liquid in the context of the current product
  → JS injects returned HTML into modal container
  → Modal opens with animation
```

**Content priority:**

1. Product metafield `custom.size_guide` (per-product or per-category)
2. Global theme setting `size_guide_content` (fallback)
3. If neither exists → hide the Size Guide button entirely

---

## 2. Global Theme Settings

### File: `config/settings_schema.json`

Add a new settings group for the global size guide fallback. Append this object to the existing settings array:

```json
{
  "name": "Size Guide",
  "settings": [
    {
      "type": "checkbox",
      "id": "size_guide_enabled",
      "label": "Enable Size Guide",
      "default": true
    },
    {
      "type": "text",
      "id": "size_guide_title",
      "label": "Modal Title",
      "default": "Size Guide"
    },
    {
      "type": "richtext",
      "id": "size_guide_content",
      "label": "Default Size Guide Content",
      "info": "Used when a product does not have its own size guide metafield."
    },
    {
      "type": "image_picker",
      "id": "size_guide_image",
      "label": "Default Size Chart Image",
      "info": "Optional. Displayed below the rich text content."
    }
  ]
}
```

---

## 3. Product Metafield Definition

### Setup in Shopify Admin → Settings → Custom data → Products

Create a metafield definition:

- **Name:** Size Guide
- **Namespace and key:** `custom.size_guide`
- **Type:** One of the following (choose based on merchant preference):
  - `Rich text` — merchant writes content directly
  - `Page` reference — merchant links to an existing Shopify page
  - `File` reference — merchant uploads a size chart image

> **Recommendation:** Use `Rich text` for simplicity. If the merchant prefers visual size charts, use `File` (image). If reusing content across many products, use `Page` reference.

This prompt assumes `Rich text` type. Adjust the Liquid rendering logic if a different type is chosen.

---

## 4. Section File

### File: `sections/size-guide.liquid`

Create this file. It renders the size guide content for AJAX consumption.

```liquid
{%- comment -%}
  Size Guide Section
  Rendered via Section Rendering API for modal injection.
  Content priority: product metafield > global settings.
{%- endcomment -%}

{%- assign has_product_guide = false -%}
{%- if product.metafields.custom.size_guide != blank -%}
  {%- assign has_product_guide = true -%}
{%- endif -%}

{%- assign has_global_guide = false -%}
{%- if settings.size_guide_content != blank or settings.size_guide_image != blank -%}
  {%- assign has_global_guide = true -%}
{%- endif -%}

{%- if has_product_guide or has_global_guide -%}
  <div class="size-guide" data-size-guide>
    <div class="size-guide__header">
      <h2 class="size-guide__title">
        {{ settings.size_guide_title | default: 'Size Guide' }}
      </h2>
      <button
        type="button"
        class="size-guide__close"
        data-size-guide-close
        aria-label="Close size guide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="size-guide__body">
      {%- if has_product_guide -%}
        <div class="size-guide__content">
          {{ product.metafields.custom.size_guide | metafield_tag }}
        </div>
      {%- elsif has_global_guide -%}
        {%- if settings.size_guide_content != blank -%}
          <div class="size-guide__content rte">
            {{ settings.size_guide_content }}
          </div>
        {%- endif -%}
        {%- if settings.size_guide_image != blank -%}
          <div class="size-guide__image">
            {{
              settings.size_guide_image
              | image_url: width: 700
              | image_tag: loading: 'lazy', alt: 'Size chart'
            }}
          </div>
        {%- endif -%}
      {%- endif -%}
    </div>
  </div>
{%- endif -%}

{% schema %}
{
  "name": "Size Guide",
  "settings": []
}
{% endschema %}
```

**Important notes:**

- The `{% schema %}` block is required even if empty — without it, Shopify does not recognize the file as a valid section.
- The section uses `product` object, which is available because the Section Rendering API is called in the context of a product URL (`/products/{handle}?section_id=size-guide`).

---

## 5. Trigger Button

### File: `sections/main-product.liquid` (or equivalent product section)

Add the Size Guide trigger button near the Add to Cart button or variant selector. Wrap it in a conditional so it only renders when content exists:

```liquid
{%- assign show_size_guide = false -%}
{%- if settings.size_guide_enabled -%}
  {%- if product.metafields.custom.size_guide != blank -%}
    {%- assign show_size_guide = true -%}
  {%- elsif settings.size_guide_content != blank or settings.size_guide_image != blank -%}
    {%- assign show_size_guide = true -%}
  {%- endif -%}
{%- endif -%}

{%- if show_size_guide -%}
  <button
    type="button"
    class="size-guide-trigger link"
    data-size-guide-open
    aria-haspopup="dialog"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 3H3v7h18V3z"></path>
      <path d="M21 14H3v7h18v-7z"></path>
    </svg>
    {{ 'products.product.size_guide' | t | default: 'Size Guide' }}
  </button>
{%- endif -%}
```

---

## 6. Modal Wrapper

### File: `snippets/size-guide-modal.liquid`

Create this snippet for the modal shell:

```liquid
<div
  class="size-guide-modal"
  data-size-guide-modal
  aria-hidden="true"
  role="dialog"
  aria-label="{{ settings.size_guide_title | default: 'Size Guide' }}"
>
  <div class="size-guide-modal__overlay" data-size-guide-close></div>
  <div class="size-guide-modal__container">
    <div class="size-guide-modal__loading" data-size-guide-loading>
      <span class="spinner"></span>
    </div>
  </div>
</div>
```

### Render the snippet

In `layout/theme.liquid`, add before the closing `</body>` tag:

```liquid
{%- if settings.size_guide_enabled -%}
  {% render 'size-guide-modal' %}
{%- endif -%}
```

---

## 7. Stylesheet

### File: `assets/size-guide.css`

```css
/* ---------- Trigger button ---------- */
.size-guide-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0;
  color: inherit;
}

.size-guide-trigger:hover {
  opacity: 0.7;
}

/* ---------- Modal overlay ---------- */
.size-guide-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.size-guide-modal.is-open {
  opacity: 1;
  visibility: visible;
}

.size-guide-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

/* ---------- Modal container ---------- */
.size-guide-modal__container {
  position: relative;
  background: #fff;
  color: #333;
  max-width: 720px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

/* ---------- Inner content ---------- */
.size-guide {
  padding: 2rem;
}

.size-guide__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e5e5;
}

.size-guide__title {
  margin: 0;
  font-size: 1.25rem;
}

.size-guide__close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: inherit;
  line-height: 1;
}

.size-guide__close:hover {
  opacity: 0.6;
}

.size-guide__body {
  font-size: 0.9375rem;
  line-height: 1.6;
}

.size-guide__body table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.size-guide__body th,
.size-guide__body td {
  border: 1px solid #ddd;
  padding: 0.5rem 0.75rem;
  text-align: center;
}

.size-guide__body th {
  background: #f5f5f5;
  font-weight: 600;
}

.size-guide__image img {
  width: 100%;
  height: auto;
  display: block;
  margin-top: 1rem;
}

/* ---------- Loading spinner ---------- */
.size-guide-modal__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.size-guide-modal__loading.hidden {
  display: none;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e5e5;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ---------- Mobile ---------- */
@media (max-width: 749px) {
  .size-guide-modal__container {
    width: 100%;
    max-width: 100%;
    max-height: 100vh;
    height: 100%;
    border-radius: 0;
  }

  .size-guide {
    padding: 1.25rem;
  }
}
```

### Load the stylesheet

In `layout/theme.liquid` inside `<head>`:

```liquid
{%- if settings.size_guide_enabled -%}
  {{ 'size-guide.css' | asset_url | stylesheet_tag }}
{%- endif -%}
```

---

## 8. JavaScript

### File: `assets/size-guide.js`

```javascript
if (!customElements.get('size-guide-modal')) {
  class SizeGuideModal extends HTMLElement {
    constructor() {
      super();
      this.modal = this;
      this.container = this.querySelector('.size-guide-modal__container');
      this.loading = this.querySelector('[data-size-guide-loading]');
      this.loaded = false;
      this.isOpen = false;

      this.bindEvents();
    }

    bindEvents() {
      // Open triggers (delegated to document for dynamic content)
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-size-guide-open]');
        if (trigger) {
          e.preventDefault();
          this.open();
        }
      });

      // Close triggers (overlay + close button)
      this.addEventListener('click', (e) => {
        if (e.target.matches('[data-size-guide-close]') || e.target.closest('[data-size-guide-close]')) {
          this.close();
        }
      });

      // ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }

    async open() {
      if (!this.loaded) {
        await this.fetchContent();
      }
      this.classList.add('is-open');
      this.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this.isOpen = true;

      // Trap focus
      const firstFocusable = this.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
    }

    close() {
      this.classList.remove('is-open');
      this.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      this.isOpen = false;

      // Return focus to trigger
      const trigger = document.querySelector('[data-size-guide-open]');
      if (trigger) trigger.focus();
    }

    async fetchContent() {
      try {
        const sectionId = 'size-guide';
        const url = `${window.Shopify.routes.root}products/${this.getProductHandle()}?section_id=${sectionId}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();

        // Hide loading spinner
        if (this.loading) this.loading.classList.add('hidden');

        // Inject content
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const content = temp.querySelector('[data-size-guide]');

        if (content) {
          this.container.appendChild(content);
          this.loaded = true;
        } else {
          this.container.innerHTML = '<div class="size-guide" style="padding:2rem;text-align:center;">No size guide available for this product.</div>';
        }
      } catch (error) {
        console.error('[SizeGuide] Failed to load:', error);
        if (this.loading) this.loading.classList.add('hidden');
        this.container.innerHTML = '<div class="size-guide" style="padding:2rem;text-align:center;">Failed to load size guide. Please try again.</div>';
      }
    }

    getProductHandle() {
      // Extract product handle from current URL
      const match = window.location.pathname.match(/\/products\/([^/?#]+)/);
      return match ? match[1] : '';
    }
  }

  customElements.define('size-guide-modal', SizeGuideModal);
}
```

### Update the modal snippet to use custom element

In `snippets/size-guide-modal.liquid`, change the outer `<div>` to the custom element:

```liquid
<size-guide-modal
  class="size-guide-modal"
  data-size-guide-modal
  aria-hidden="true"
  role="dialog"
  aria-label="{{ settings.size_guide_title | default: 'Size Guide' }}"
>
  <div class="size-guide-modal__overlay" data-size-guide-close></div>
  <div class="size-guide-modal__container">
    <div class="size-guide-modal__loading" data-size-guide-loading>
      <span class="spinner"></span>
    </div>
  </div>
</size-guide-modal>
```

### Load the script

In `layout/theme.liquid` before `</body>`:

```liquid
{%- if settings.size_guide_enabled -%}
  <script src="{{ 'size-guide.js' | asset_url }}" defer="defer"></script>
{%- endif -%}
```

---

## 9. Locale Strings (Optional)

### File: `locales/en.default.json`

Add under the `products.product` namespace:

```json
{
  "products": {
    "product": {
      "size_guide": "Size Guide"
    }
  }
}
```

---

## 10. Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `config/settings_schema.json` | Edit | Add global Size Guide settings group |
| `sections/size-guide.liquid` | Create | Section rendered via AJAX with content logic |
| `snippets/size-guide-modal.liquid` | Create | Modal shell (overlay + container + loading) |
| `assets/size-guide.css` | Create | All modal and content styles |
| `assets/size-guide.js` | Create | Custom element: fetch, open, close, accessibility |
| `sections/main-product.liquid` | Edit | Add trigger button near Add to Cart |
| `layout/theme.liquid` | Edit | Load CSS in head, render modal snippet + load JS before body close |
| `locales/en.default.json` | Edit | Add translation string |

---

## 11. Implementation Order

Follow this sequence so each step can be verified independently:

1. **Global settings** — Add Size Guide group to `settings_schema.json`. Verify it appears in Theme Settings.
2. **Metafield definition** — Create `custom.size_guide` in Shopify Admin → Settings → Custom data → Products.
3. **Section** — Create `sections/size-guide.liquid`. Test by visiting `/products/{handle}?section_id=size-guide` in the browser — it should render the content with no layout.
4. **Modal snippet** — Create `snippets/size-guide-modal.liquid`. Render it in `theme.liquid`.
5. **Stylesheet** — Create `assets/size-guide.css`. Load in `theme.liquid` head.
6. **JavaScript** — Create `assets/size-guide.js`. Load in `theme.liquid` before body close.
7. **Trigger button** — Add the button to `main-product.liquid`. Verify modal opens.
8. **Content testing** — Test three scenarios:
   - Product WITH metafield → should show metafield content
   - Product WITHOUT metafield, global settings filled → should show global content
   - Product WITHOUT metafield, global settings empty → button should be hidden
9. **Mobile testing** — Verify full-screen modal on mobile, scroll behavior, close actions.
10. **Accessibility** — Verify focus trap, ESC close, aria attributes, screen reader.

---

## 12. Technical Notes

- **Section Rendering API context:** The fetch URL must include the product path (`/products/{handle}`) so the `product` Liquid object is available inside the section. Using just `/?section_id=size-guide` will NOT have product context.
- **Locale-aware URLs:** Use `window.Shopify.routes.root` as the base URL instead of `/` to support multi-language stores. This is already implemented in the JS above.
- **Caching:** The fetched content is cached in memory (`this.loaded = true`). If the user navigates to a different product (e.g., in a quick-view), the cache must be invalidated. For SPAs or AJAX-navigated themes, listen for `page:change` or equivalent events and reset `this.loaded = false`.
- **Custom element pattern:** Using `customElements.define()` follows Shopify's Dawn theme conventions and ensures the component initializes automatically when the DOM is ready. No manual `DOMContentLoaded` listener needed.
- **No theme policy violations:** This implementation uses only official Shopify APIs (Section Rendering API, metafields, theme settings). No undocumented endpoints or workarounds.
- **Performance:** CSS and JS are only loaded when `size_guide_enabled` is true. Content is lazy-loaded on first modal open, not on page load.