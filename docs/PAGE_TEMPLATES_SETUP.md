# Shopify Theme — Page Templates Setup

This document covers every default page template required for a production-ready Shopify theme. It serves two purposes:

- **For AI Agents** — follow the file creation steps exactly, in order, for each template group
- **For Developers** — reference for structure, naming conventions, and what each template must render

---

## How templates work (quick recap)

Every template in `templates/` is a **JSON file** that declares which sections appear on that page and in what order. The actual markup lives in the section files under `sections/`. This separation allows merchants to customise layout via the theme editor without touching code.

```
templates/page.json        ← declares sections
sections/main-page.liquid  ← contains markup + schema
```

The only exception is `gift_card.liquid`, which must be a plain Liquid file (Shopify does not support JSON template for gift cards).

---

## File creation rules (agents must follow)

Before creating any file:

1. Check if the file already exists — never overwrite without instruction
2. Create section files before template JSON files (template references section by type)
3. Every section must have a `{% schema %}` block with valid JSON
4. Every section schema must include `"presets"` so it is addable from the editor
5. After creating all files, run `shopify theme check` to validate

---

## Template inventory

| Template file | Section file(s) | Required | Notes |
|---|---|---|---|
| `templates/index.json` | `sections/section-hero-slider.liquid`, `sections/section-feature-grid.liquid` | Yes | Homepage (orchestrator — see `SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`) |
| `templates/product.json` | `sections/main-product.liquid` | Yes | PDP |
| `templates/collection.json` | `sections/main-collection.liquid` | Yes | PLP |
| `templates/list-collections.json` | `sections/main-list-collections.liquid` | No | All collections |
| `templates/cart.json` | `sections/main-cart.liquid` | Yes | Cart page |
| `templates/404.json` | `sections/main-404.liquid` | Yes | Not found |
| `templates/password.json` | `sections/main-password.liquid` | Yes | Coming soon |
| `templates/page.json` | `sections/main-page.liquid` | No | Generic static page |
| `templates/blog.json` | `sections/main-blog.liquid` | No | Blog post list |
| `templates/article.json` | `sections/main-article.liquid` | No | Single blog post |
| `templates/gift_card.liquid` | *(self-contained)* | No | Gift card — Liquid only |
| `templates/customers/account.json` | `sections/main-customers-account.liquid` | No | Account dashboard |
| `templates/customers/login.json` | `sections/main-customers-login.liquid` | No | Login form |
| `templates/customers/register.json` | `sections/main-customers-register.liquid` | No | Register form |
| `templates/customers/order.json` | `sections/main-customers-order.liquid` | No | Order detail |
| `templates/customers/addresses.json` | `sections/main-customers-addresses.liquid` | No | Manage addresses |
| `templates/customers/reset_password.json` | `sections/main-customers-reset-password.liquid` | No | Reset password form |
| `templates/customers/activate_account.json` | `sections/main-customers-activate-account.liquid` | No | Activate account |

---

## Group 1 — Storefront core

### index (homepage)

The homepage template only **declares section order**. It composes reusable marketing sections (`section-hero-slider`, `section-feature-grid`) so merchants can reorder, hide, or insert sections without coupling. See `docs/SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md`.

**`templates/index.json`** (minimal shape)
```json
{
  "sections": {
    "hero": {
      "type": "section-hero-slider",
      "settings": {}
    },
    "feature_grid": {
      "type": "section-feature-grid",
      "settings": {},
      "blocks": {},
      "block_order": []
    }
  },
  "order": ["hero", "feature_grid"]
}
```

**`sections/section-hero-slider.liquid`** — Single job: hero (copy, CTAs, optional image). `data-section-type="section-hero-slider"`.

**`sections/section-feature-grid.liquid`** — Single job: repeating **feature** blocks in a grid. `data-section-type="section-feature-grid"`.

---

### 404

**`templates/404.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-404",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-404.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-404"
  data-section-type="main-404"
  data-section-id="{{ section.id }}"
>
  <h1 class="main-404__title">
    {{- section.settings.title | default: '404 — Page not found' | escape -}}
  </h1>
  <p class="main-404__message">
    {{- section.settings.message | default: 'The page you were looking for does not exist.' | escape -}}
  </p>
  <a class="main-404__cta btn" href="{{ routes.root_url }}">
    {{- section.settings.cta_label | default: 'Back to home' | escape -}}
  </a>
</div>

{% schema %}
{
  "name": "404",
  "tag": "section",
  "class": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Title", "default": "404 — Page not found" },
    { "type": "textarea", "id": "message", "label": "Message", "default": "The page you were looking for does not exist." },
    { "type": "text", "id": "cta_label", "label": "Button label", "default": "Back to home" }
  ],
  "presets": [{ "name": "404" }]
}
{% endschema %}
```

---

### password (coming soon)

**`templates/password.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-password",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-password.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-password"
  data-section-type="main-password"
  data-section-id="{{ section.id }}"
>
  <h1 class="main-password__heading">
    {{- section.settings.heading | default: shop.name | escape -}}
  </h1>
  <p class="main-password__message">
    {{- section.settings.message | escape -}}
  </p>

  {%- form 'storefront_password' -%}
    {{- form.errors | default_errors -}}
    <input
      type="password"
      name="password"
      id="Password"
      class="main-password__input"
      placeholder="{{ 'general.password_page.password_placeholder' | t }}"
      autocomplete="current-password"
    >
    <button type="submit" class="main-password__submit btn">
      {{- 'general.password_page.enter_store' | t -}}
    </button>
  {%- endform -%}
</div>

{% schema %}
{
  "name": "Password page",
  "tag": "section",
  "class": "section",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Opening soon" },
    { "type": "textarea", "id": "message", "label": "Message", "default": "We're working on something exciting. Enter the password to get early access." }
  ],
  "presets": [{ "name": "Password page" }]
}
{% endschema %}
```

> **Note:** `password.json` uses `layout/password.liquid`, not `layout/theme.liquid`. Ensure `layout/password.liquid` exists and includes `{{ content_for_layout }}`.

---

## Group 2 — Product & collection

### product (PDP)

**`templates/product.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-product",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-product.liquid`**

Must expose at minimum: product title, price, variant selector, add-to-cart form, and product media.

```liquid
<div
  class="section-{{ section.id }} section-main-product"
  data-section-type="main-product"
  data-section-id="{{ section.id }}"
>
  <div class="main-product__media">
    {%- for media in product.media -%}
      {{
        media
        | image_url: width: 1200
        | image_tag:
          loading: 'lazy',
          widths: '480, 720, 960, 1200',
          sizes: '(max-width: 768px) 100vw, 50vw',
          class: 'main-product__image'
      }}
    {%- endfor -%}
  </div>

  <div class="main-product__info">
    <h1 class="main-product__title">{{- product.title | escape -}}</h1>

    <div class="main-product__price">
      {%- if product.compare_at_price > product.price -%}
        <s class="main-product__price--compare">{{- product.compare_at_price | money -}}</s>
      {%- endif -%}
      <span class="main-product__price--current">{{- product.price | money -}}</span>
    </div>

    {%- form 'product', product, id: 'product-form', novalidate: 'novalidate' -%}
      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">

      {%- unless product.has_only_default_variant -%}
        {%- for option in product.options_with_values -%}
          <fieldset class="main-product__option">
            <legend>{{- option.name | escape -}}</legend>
            {%- for value in option.values -%}
              <label>
                <input
                  type="radio"
                  name="{{ option.name }}"
                  value="{{ value | escape }}"
                  {% if option.selected_value == value %}checked{% endif %}
                >
                {{- value | escape -}}
              </label>
            {%- endfor -%}
          </fieldset>
        {%- endfor -%}
      {%- endunless -%}

      <button
        type="submit"
        class="main-product__atc btn"
        {% unless product.selected_or_first_available_variant.available %}disabled{% endunless %}
      >
        {%- if product.selected_or_first_available_variant.available -%}
          {{- 'products.product.add_to_cart' | t -}}
        {%- else -%}
          {{- 'products.product.sold_out' | t -}}
        {%- endif -%}
      </button>
    {%- endform -%}

    <div class="main-product__description">
      {{- product.description -}}
    </div>
  </div>
</div>

<script>
  window.__productData = {{ product | json }};
</script>

{% schema %}
{
  "name": "Product",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "header",
      "content": "Media"
    },
    {
      "type": "select",
      "id": "media_size",
      "label": "Media width",
      "options": [
        { "value": "small", "label": "Small" },
        { "value": "medium", "label": "Medium" },
        { "value": "large", "label": "Large" }
      ],
      "default": "medium"
    }
  ],
  "blocks": [],
  "presets": [{ "name": "Product" }]
}
{% endschema %}
```

---

### collection (PLP)

**`templates/collection.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-collection",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-collection.liquid`**

Must include pagination. Product cards are rendered via snippet.

```liquid
<div
  class="section-{{ section.id }} section-main-collection"
  data-section-type="main-collection"
  data-section-id="{{ section.id }}"
>
  <h1 class="main-collection__title">{{- collection.title | escape -}}</h1>

  {%- if collection.description != blank -%}
    <div class="main-collection__description">{{- collection.description -}}</div>
  {%- endif -%}

  {%- paginate collection.products by section.settings.products_per_page -%}
    <ul class="main-collection__grid" role="list">
      {%- for product in collection.products -%}
        <li class="main-collection__grid-item">
          {%- render 'product-card', product: product -%}
        </li>
      {%- else -%}
        <li class="main-collection__empty">
          <p>{{- 'collections.general.no_matches' | t -}}</p>
        </li>
      {%- endfor -%}
    </ul>

    {%- if paginate.pages > 1 -%}
      <nav class="main-collection__pagination" aria-label="{{ 'general.pagination.label' | t }}">
        {{- paginate | default_pagination -}}
      </nav>
    {%- endif -%}
  {%- endpaginate -%}
</div>

{% schema %}
{
  "name": "Collection",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "range",
      "id": "products_per_page",
      "label": "Products per page",
      "min": 8,
      "max": 48,
      "step": 4,
      "default": 24
    },
    {
      "type": "select",
      "id": "columns_desktop",
      "label": "Columns on desktop",
      "options": [
        { "value": "2", "label": "2" },
        { "value": "3", "label": "3" },
        { "value": "4", "label": "4" }
      ],
      "default": "3"
    }
  ],
  "presets": [{ "name": "Collection" }]
}
{% endschema %}
```

> **Note:** `snippets/product-card.liquid` must exist. Create it if absent with at minimum: product image, title, and price.

---

### list-collections

**`templates/list-collections.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-list-collections",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-list-collections.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-list-collections"
  data-section-type="main-list-collections"
  data-section-id="{{ section.id }}"
>
  <h1 class="main-list-collections__title">
    {{- section.settings.title | default: 'Collections' | escape -}}
  </h1>

  <ul class="main-list-collections__grid" role="list">
    {%- for collection in collections -%}
      <li class="main-list-collections__item">
        <a href="{{ collection.url }}" class="main-list-collections__link">
          {%- if collection.image -%}
            {{
              collection.image
              | image_url: width: 600
              | image_tag: loading: 'lazy', alt: collection.title, class: 'main-list-collections__image'
            }}
          {%- endif -%}
          <span class="main-list-collections__name">{{- collection.title | escape -}}</span>
        </a>
      </li>
    {%- endfor -%}
  </ul>
</div>

{% schema %}
{
  "name": "All collections",
  "tag": "section",
  "class": "section",
  "settings": [
    { "type": "text", "id": "title", "label": "Heading", "default": "Collections" }
  ],
  "presets": [{ "name": "All collections" }]
}
{% endschema %}
```

---

### cart

**`templates/cart.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-cart",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-cart.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-cart"
  data-section-type="main-cart"
  data-section-id="{{ section.id }}"
>
  {%- if cart.item_count > 0 -%}
    {%- form 'cart', cart, id: 'cart-form' -%}
      <ul class="main-cart__items" role="list">
        {%- for item in cart.items -%}
          <li class="main-cart__item" data-key="{{ item.key }}">
            {{
              item.image
              | image_url: width: 200
              | image_tag: loading: 'lazy', alt: item.title, class: 'main-cart__item-image'
            }}
            <div class="main-cart__item-details">
              <a href="{{ item.url }}" class="main-cart__item-title">{{- item.title | escape -}}</a>
              <span class="main-cart__item-price">{{- item.final_price | money -}}</span>
              <input
                type="number"
                name="updates[]"
                value="{{ item.quantity }}"
                min="0"
                class="main-cart__item-qty"
                data-cart-qty
                aria-label="{{ 'cart.label.quantity' | t }}"
              >
              <a
                href="{{ item.url_to_remove }}"
                class="main-cart__item-remove"
                aria-label="{{ 'cart.label.remove' | t }}"
              >
                {{- 'cart.general.remove' | t -}}
              </a>
            </div>
          </li>
        {%- endfor -%}
      </ul>

      <div class="main-cart__footer">
        <div class="main-cart__subtotal">
          <span>{{- 'cart.general.subtotal' | t -}}</span>
          <span>{{- cart.total_price | money_with_currency -}}</span>
        </div>
        <p class="main-cart__taxes-note">
          {{- 'cart.general.taxes_and_shipping_at_checkout_html' | t -}}
        </p>
        <button type="submit" name="checkout" class="main-cart__checkout btn">
          {{- 'cart.general.checkout' | t -}}
        </button>
      </div>
    {%- endform -%}
  {%- else -%}
    <div class="main-cart__empty">
      <p>{{- 'cart.general.empty' | t -}}</p>
      <a href="{{ routes.all_products_collection_url }}" class="main-cart__continue btn">
        {{- 'cart.general.continue_shopping' | t -}}
      </a>
    </div>
  {%- endif -%}
</div>

{% schema %}
{
  "name": "Cart",
  "tag": "section",
  "class": "section",
  "settings": [],
  "presets": [{ "name": "Cart" }]
}
{% endschema %}
```

---

## Group 3 — Content pages

### page (generic static page)

**`templates/page.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-page",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-page.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-page"
  data-section-type="main-page"
  data-section-id="{{ section.id }}"
>
  {%- if section.settings.show_title -%}
    <h1 class="main-page__title">{{- page.title | escape -}}</h1>
  {%- endif -%}

  <div class="main-page__content rte">
    {{- page.content -}}
  </div>
</div>

{% schema %}
{
  "name": "Page",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_title",
      "label": "Show page title",
      "default": true
    }
  ],
  "presets": [{ "name": "Page" }]
}
{% endschema %}
```

> **Alternate templates:** Duplicate `templates/page.json` as `templates/page.<name>.json` for pages that need different layouts (e.g. `page.contact.json`, `page.faq.json`). Each alternate can reference a different section type.

---

### blog

**`templates/blog.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-blog",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-blog.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-blog"
  data-section-type="main-blog"
  data-section-id="{{ section.id }}"
>
  <h1 class="main-blog__title">{{- blog.title | escape -}}</h1>

  {%- paginate blog.articles by section.settings.articles_per_page -%}
    <ul class="main-blog__grid" role="list">
      {%- for article in blog.articles -%}
        <li class="main-blog__item">
          {%- render 'article-card', article: article, show_excerpt: section.settings.show_excerpt -%}
        </li>
      {%- endfor -%}
    </ul>

    {%- if paginate.pages > 1 -%}
      <nav class="main-blog__pagination" aria-label="{{ 'general.pagination.label' | t }}">
        {{- paginate | default_pagination -}}
      </nav>
    {%- endif -%}
  {%- endpaginate -%}
</div>

{% schema %}
{
  "name": "Blog",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "range",
      "id": "articles_per_page",
      "label": "Articles per page",
      "min": 4,
      "max": 24,
      "step": 2,
      "default": 12
    },
    {
      "type": "checkbox",
      "id": "show_excerpt",
      "label": "Show article excerpt",
      "default": true
    }
  ],
  "presets": [{ "name": "Blog" }]
}
{% endschema %}
```

> **Note:** `snippets/article-card.liquid` must exist. Parameters: `article`, `show_excerpt`.

---

### article

**`templates/article.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-article",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-article.liquid`**
```liquid
<article
  class="section-{{ section.id }} section-main-article"
  data-section-type="main-article"
  data-section-id="{{ section.id }}"
>
  <header class="main-article__header">
    <h1 class="main-article__title">{{- article.title | escape -}}</h1>

    {%- if section.settings.show_meta -%}
      <div class="main-article__meta">
        <span class="main-article__author">{{- article.author | escape -}}</span>
        <time class="main-article__date" datetime="{{ article.published_at | date: '%Y-%m-%d' }}">
          {{- article.published_at | date: format: 'date' -}}
        </time>
      </div>
    {%- endif -%}

    {%- if article.image and section.settings.show_featured_image -%}
      {{
        article.image
        | image_url: width: 1200
        | image_tag:
          loading: 'eager',
          widths: '600, 900, 1200',
          sizes: '(max-width: 768px) 100vw, 800px',
          class: 'main-article__featured-image'
      }}
    {%- endif -%}
  </header>

  <div class="main-article__body rte">
    {{- article.content -}}
  </div>

  {%- if section.settings.show_tags and article.tags.size > 0 -%}
    <footer class="main-article__footer">
      <ul class="main-article__tags" role="list">
        {%- for tag in article.tags -%}
          <li>
            <a href="{{ blog.url }}/tagged/{{ tag | handle }}" class="main-article__tag">
              {{- tag | escape -}}
            </a>
          </li>
        {%- endfor -%}
      </ul>
    </footer>
  {%- endif -%}
</article>

{% schema %}
{
  "name": "Article",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_featured_image",
      "label": "Show featured image",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_meta",
      "label": "Show author and date",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_tags",
      "label": "Show tags",
      "default": true
    }
  ],
  "presets": [{ "name": "Article" }]
}
{% endschema %}
```

---

## Group 4 — Gift card

### gift_card

This template **must** be a `.liquid` file — Shopify does not support JSON template for gift cards.

**`templates/gift_card.liquid`**
```liquid
<!DOCTYPE html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>{{ 'gift_cards.issued.title' | t: value: gift_card.initial_value | money_without_trailing_zeros, shop: shop.name }}</title>

    {{ content_for_header }}

    {{ 'base.css' | asset_url | stylesheet_tag }}
  </head>

  <body class="gift-card">
    <div class="gift-card__wrapper">
      <header class="gift-card__header">
        <a href="{{ routes.root_url }}" class="gift-card__shop-name">
          {{- shop.name | escape -}}
        </a>
      </header>

      <main class="gift-card__main">
        {%- if gift_card.enabled == false or gift_card.expired -%}
          <p class="gift-card__tag">{{- 'gift_cards.issued.expired' | t -}}</p>
        {%- endif -%}

        <h1 class="gift-card__title">
          {{- 'gift_cards.issued.subtext' | t -}}
        </h1>

        {%- if gift_card.image -%}
          {{
            gift_card.image
            | image_url: width: 600
            | image_tag: loading: 'eager', class: 'gift-card__image'
          }}
        {%- endif -%}

        <div class="gift-card__price">
          {%- if gift_card.balance != gift_card.initial_value -%}
            <p class="gift-card__balance">
              {{- 'gift_cards.issued.remaining_html' | t: balance: gift_card.balance | money -}}
            </p>
          {%- endif -%}
          <p class="gift-card__initial-value">
            {{- gift_card.initial_value | money_without_trailing_zeros -}}
          </p>
        </div>

        <div class="gift-card__code-wrapper">
          <input
            type="text"
            class="gift-card__code"
            id="GiftCardDigits"
            value="{{ gift_card.code | format_code }}"
            aria-label="{{ 'gift_cards.issued.gift_card_code' | t }}"
            readonly
          >
          <button
            class="gift-card__copy btn"
            data-copy-target="GiftCardDigits"
            type="button"
          >
            {{- 'gift_cards.issued.copy_code' | t -}}
          </button>
        </div>

        <a
          href="{{ shop.url }}"
          class="gift-card__shop-link btn btn--primary"
          target="_blank"
          rel="noopener"
        >
          {{- 'gift_cards.issued.shop_link' | t -}}
        </a>
      </main>
    </div>
  </body>
</html>
```

> **Note:** `gift_card.liquid` is a standalone HTML document — it must include `<!DOCTYPE html>`, `<head>`, and `{{ content_for_header }}`. It does not use `layout/theme.liquid`.

---

## Group 5 — Customer account

All customer templates follow the same JSON structure. They render inside `layout/theme.liquid`. Access to these pages requires `customer_accounts_optional` or `customer_accounts_required` to be enabled in Shopify admin → Settings → Customer accounts.

### account

**`templates/customers/account.json`**
```json
{
  "sections": {
    "main": {
      "type": "main-customers-account",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

**`sections/main-customers-account.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-customers-account"
  data-section-type="main-customers-account"
  data-section-id="{{ section.id }}"
>
  <h1 class="customers-account__title">
    {{- 'customer.account.title' | t -}}
  </h1>

  <p class="customers-account__greeting">
    {{- 'customer.account.details' | t: name: customer.first_name -}}
  </p>

  <section class="customers-account__orders">
    <h2>{{- 'customer.orders.title' | t -}}</h2>

    {%- if customer.orders.size > 0 -%}
      <table class="customers-account__orders-table">
        <thead>
          <tr>
            <th>{{- 'customer.orders.order_number' | t -}}</th>
            <th>{{- 'customer.orders.date' | t -}}</th>
            <th>{{- 'customer.orders.payment_status' | t -}}</th>
            <th>{{- 'customer.orders.fulfillment_status' | t -}}</th>
            <th>{{- 'customer.orders.total' | t -}}</th>
          </tr>
        </thead>
        <tbody>
          {%- for order in customer.orders -%}
            <tr>
              <td><a href="{{ order.customer_url }}">{{ order.name }}</a></td>
              <td>{{ order.created_at | date: format: 'date' }}</td>
              <td>{{ order.financial_status_label }}</td>
              <td>{{ order.fulfillment_status_label }}</td>
              <td>{{ order.total_price | money }}</td>
            </tr>
          {%- endfor -%}
        </tbody>
      </table>
    {%- else -%}
      <p>{{- 'customer.orders.none' | t -}}</p>
    {%- endif -%}
  </section>

  <section class="customers-account__address">
    <h2>{{- 'customer.addresses.title' | t -}}</h2>
    {%- if customer.default_address -%}
      {{- customer.default_address | format_address -}}
    {%- endif -%}
    <a href="{{ routes.account_addresses_url }}">{{- 'customer.addresses.view_all' | t -}}</a>
  </section>
</div>

{% schema %}
{
  "name": "Account",
  "tag": "section",
  "class": "section",
  "settings": [],
  "presets": [{ "name": "Account" }]
}
{% endschema %}
```

---

### login

**`templates/customers/login.json`**
```json
{
  "sections": {
    "main": { "type": "main-customers-login", "settings": {} }
  },
  "order": ["main"]
}
```

**`sections/main-customers-login.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-customers-login"
  data-section-type="main-customers-login"
  data-section-id="{{ section.id }}"
>
  <h1>{{- 'customer.login.title' | t -}}</h1>

  {%- form 'customer_login' -%}
    {{- form.errors | default_errors -}}

    <div class="field">
      <label for="CustomerEmail">{{- 'customer.login.email' | t -}}</label>
      <input
        type="email"
        name="customer[email]"
        id="CustomerEmail"
        autocomplete="email"
        autocorrect="off"
        autocapitalize="off"
        required
      >
    </div>

    <div class="field">
      <label for="CustomerPassword">{{- 'customer.login.password' | t -}}</label>
      <input
        type="password"
        name="customer[password]"
        id="CustomerPassword"
        autocomplete="current-password"
        required
      >
    </div>

    <a href="{{ routes.account_recover_url }}" class="customers-login__forgot">
      {{- 'customer.login.forgot_password' | t -}}
    </a>

    <button type="submit" class="btn btn--primary">
      {{- 'customer.login.sign_in' | t -}}
    </button>
  {%- endform -%}

  <p class="customers-login__register">
    {{- 'customer.login.create_account_html' | t: link: routes.account_register_url -}}
  </p>
</div>

{% schema %}
{
  "name": "Login",
  "tag": "section",
  "class": "section",
  "settings": [],
  "presets": [{ "name": "Login" }]
}
{% endschema %}
```

---

### register

**`templates/customers/register.json`**
```json
{
  "sections": {
    "main": { "type": "main-customers-register", "settings": {} }
  },
  "order": ["main"]
}
```

**`sections/main-customers-register.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-customers-register"
  data-section-type="main-customers-register"
  data-section-id="{{ section.id }}"
>
  <h1>{{- 'customer.register.title' | t -}}</h1>

  {%- form 'create_customer' -%}
    {{- form.errors | default_errors -}}

    <div class="field">
      <label for="FirstName">{{- 'customer.register.first_name' | t -}}</label>
      <input type="text" name="customer[first_name]" id="FirstName" autocomplete="given-name">
    </div>

    <div class="field">
      <label for="LastName">{{- 'customer.register.last_name' | t -}}</label>
      <input type="text" name="customer[last_name]" id="LastName" autocomplete="family-name">
    </div>

    <div class="field">
      <label for="RegisterEmail">{{- 'customer.register.email' | t -}}</label>
      <input
        type="email"
        name="customer[email]"
        id="RegisterEmail"
        autocomplete="email"
        required
      >
    </div>

    <div class="field">
      <label for="RegisterPassword">{{- 'customer.register.password' | t -}}</label>
      <input
        type="password"
        name="customer[password]"
        id="RegisterPassword"
        autocomplete="new-password"
        required
      >
    </div>

    <button type="submit" class="btn btn--primary">
      {{- 'customer.register.submit' | t -}}
    </button>
  {%- endform -%}

  <p>
    <a href="{{ routes.account_login_url }}">{{- 'customer.register.login' | t -}}</a>
  </p>
</div>

{% schema %}
{
  "name": "Register",
  "tag": "section",
  "class": "section",
  "settings": [],
  "presets": [{ "name": "Register" }]
}
{% endschema %}
```

---

### order

**`templates/customers/order.json`**
```json
{
  "sections": {
    "main": { "type": "main-customers-order", "settings": {} }
  },
  "order": ["main"]
}
```

**`sections/main-customers-order.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-customers-order"
  data-section-type="main-customers-order"
  data-section-id="{{ section.id }}"
>
  <h1>{{- 'customer.order.title' | t: name: order.name -}}</h1>

  <p>{{- 'customer.order.date_html' | t: date: order.created_at | date: format: 'date' -}}</p>

  {%- if order.cancelled -%}
    <p class="customers-order__cancelled">
      {{- 'customer.order.cancelled_html' | t: date: order.cancelled_at | date: format: 'date', reason: order.cancel_reason_label -}}
    </p>
  {%- endif -%}

  <table class="customers-order__items">
    <thead>
      <tr>
        <th>{{- 'customer.order.product' | t -}}</th>
        <th>{{- 'customer.order.sku' | t -}}</th>
        <th>{{- 'customer.order.price' | t -}}</th>
        <th>{{- 'customer.order.quantity' | t -}}</th>
        <th>{{- 'customer.order.total' | t -}}</th>
      </tr>
    </thead>
    <tbody>
      {%- for line_item in order.line_items -%}
        <tr>
          <td>
            <a href="{{ line_item.product.url }}">{{- line_item.title | escape -}}</a>
            {%- if line_item.fulfillment -%}
              <span class="customers-order__tracking">
                {{- 'customer.order.fulfilled_at_html' | t: date: line_item.fulfillment.created_at | date: format: 'date' -}}
                {%- if line_item.fulfillment.tracking_url -%}
                  <a href="{{ line_item.fulfillment.tracking_url }}" target="_blank" rel="noopener">
                    {{- line_item.fulfillment.tracking_company -}}
                  </a>
                {%- endif -%}
              </span>
            {%- endif -%}
          </td>
          <td>{{- line_item.sku | escape -}}</td>
          <td>{{- line_item.final_price | money -}}</td>
          <td>{{- line_item.quantity -}}</td>
          <td>{{- line_item.final_line_price | money -}}</td>
        </tr>
      {%- endfor -%}
    </tbody>
  </table>

  <div class="customers-order__summary">
    <p>{{- 'customer.order.subtotal' | t -}}: {{- order.subtotal_price | money -}}</p>
    {%- for discount in order.cart_level_discount_applications -%}
      <p>{{- discount.title | escape -}}: -{{- discount.total_allocated_amount | money -}}</p>
    {%- endfor -%}
    {%- for shipping_method in order.shipping_methods -%}
      <p>{{- shipping_method.title | escape -}}: {{- shipping_method.price | money -}}</p>
    {%- endfor -%}
    {%- for tax_line in order.tax_lines -%}
      <p>{{- tax_line.title | escape -}} ({{ tax_line.rate | times: 100 }}%): {{- tax_line.price | money -}}</p>
    {%- endfor -%}
    <p><strong>{{- 'customer.order.total' | t -}}: {{- order.total_price | money_with_currency -}}</strong></p>
  </div>
</div>

{% schema %}
{
  "name": "Order",
  "tag": "section",
  "class": "section",
  "settings": [],
  "presets": [{ "name": "Order" }]
}
{% endschema %}
```

---

### addresses

**`templates/customers/addresses.json`**
```json
{
  "sections": {
    "main": { "type": "main-customers-addresses", "settings": {} }
  },
  "order": ["main"]
}
```

**`sections/main-customers-addresses.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-customers-addresses"
  data-section-type="main-customers-addresses"
  data-section-id="{{ section.id }}"
>
  <h1>{{- 'customer.addresses.title' | t -}}</h1>

  <h2>{{- 'customer.addresses.add_new' | t -}}</h2>
  {%- form 'customer_address', customer.new_address -%}
    {{- form.errors | default_errors -}}
    {%- render 'address-form', form: form, address: customer.new_address -%}
    <button type="submit" class="btn">{{- 'customer.addresses.add' | t -}}</button>
  {%- endform -%}

  {%- if customer.addresses_count > 0 -%}
    <h2>{{- 'customer.addresses.entries_count' | t: count: customer.addresses_count -}}</h2>

    {%- paginate customer.addresses by 5 -%}
      {%- for address in customer.addresses -%}
        <div class="customers-address__entry">
          {{- address | format_address -}}
          {%- if address == customer.default_address -%}
            <span class="customers-address__default-badge">{{- 'customer.addresses.default' | t -}}</span>
          {%- endif -%}

          {%- form 'customer_address', address -%}
            {%- render 'address-form', form: form, address: address -%}
            <button type="submit" class="btn">{{- 'customer.addresses.update' | t -}}</button>
          {%- endform -%}

          {%- form 'customer_address', address, method: 'delete' -%}
            <button type="submit" class="btn btn--secondary">
              {{- 'customer.addresses.delete' | t -}}
            </button>
          {%- endform -%}
        </div>
      {%- endfor -%}
      {{- paginate | default_pagination -}}
    {%- endpaginate -%}
  {%- endif -%}
</div>

{% schema %}
{
  "name": "Addresses",
  "tag": "section",
  "class": "section",
  "settings": [],
  "presets": [{ "name": "Addresses" }]
}
{% endschema %}
```

> **Note:** `snippets/address-form.liquid` must exist. It should render all address fields (first name, last name, company, address1, address2, city, country, zip, phone) and handle country/province JS switching.

---

### reset_password

**`templates/customers/reset_password.json`**
```json
{
  "sections": {
    "main": { "type": "main-customers-reset-password", "settings": {} }
  },
  "order": ["main"]
}
```

**`sections/main-customers-reset-password.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-customers-reset-password"
  data-section-type="main-customers-reset-password"
  data-section-id="{{ section.id }}"
>
  <h1>{{- 'customer.reset_password.title' | t -}}</h1>

  {%- form 'reset_customer_password' -%}
    {{- form.errors | default_errors -}}

    <div class="field">
      <label for="Password">{{- 'customer.reset_password.password' | t -}}</label>
      <input type="password" name="customer[password]" id="Password" autocomplete="new-password" required>
    </div>

    <div class="field">
      <label for="PasswordConfirmation">{{- 'customer.reset_password.password_confirm' | t -}}</label>
      <input type="password" name="customer[password_confirmation]" id="PasswordConfirmation" autocomplete="new-password" required>
    </div>

    <button type="submit" class="btn btn--primary">
      {{- 'customer.reset_password.submit' | t -}}
    </button>
  {%- endform -%}
</div>

{% schema %}
{
  "name": "Reset password",
  "tag": "section",
  "class": "section",
  "settings": [],
  "presets": [{ "name": "Reset password" }]
}
{% endschema %}
```

---

### activate_account

**`templates/customers/activate_account.json`**
```json
{
  "sections": {
    "main": { "type": "main-customers-activate-account", "settings": {} }
  },
  "order": ["main"]
}
```

**`sections/main-customers-activate-account.liquid`**
```liquid
<div
  class="section-{{ section.id }} section-main-customers-activate-account"
  data-section-type="main-customers-activate-account"
  data-section-id="{{ section.id }}"
>
  <h1>{{- 'customer.activate_account.title' | t -}}</h1>
  <p>{{- 'customer.activate_account.subtext' | t -}}</p>

  {%- form 'activate_customer_password' -%}
    {{- form.errors | default_errors -}}

    <div class="field">
      <label for="ActivatePassword">{{- 'customer.activate_account.password' | t -}}</label>
      <input type="password" name="customer[password]" id="ActivatePassword" autocomplete="new-password" required>
    </div>

    <div class="field">
      <label for="ActivatePasswordConfirmation">{{- 'customer.activate_account.password_confirm' | t -}}</label>
      <input type="password" name="customer[password_confirmation]" id="ActivatePasswordConfirmation" autocomplete="new-password" required>
    </div>

    <button type="submit" class="btn btn--primary">
      {{- 'customer.activate_account.submit' | t -}}
    </button>
  {%- endform -%}
</div>

{% schema %}
{
  "name": "Activate account",
  "tag": "section",
  "class": "section",
  "settings": [],
  "presets": [{ "name": "Activate account" }]
}
{% endschema %}
```

---

## Snippets required by the above templates

These snippets are referenced in section files above and must exist before those sections will render correctly.

| Snippet | Used by | Minimum parameters |
|---|---|---|
| `snippets/product-card.liquid` | `main-collection`, `main-list-collections` | `product` |
| `snippets/article-card.liquid` | `main-blog` | `article`, `show_excerpt` |
| `snippets/address-form.liquid` | `main-customers-addresses` | `form`, `address` |

---

## Translation keys required

Add these keys to `locales/en.default.json` if they do not already exist. Shopify will throw a liquid error on `| t` calls for any missing key.

```json
{
  "general": {
    "pagination": { "label": "Pagination" },
    "password_page": {
      "password_placeholder": "Your password",
      "enter_store": "Enter"
    }
  },
  "products": {
    "product": {
      "add_to_cart": "Add to cart",
      "sold_out": "Sold out"
    }
  },
  "cart": {
    "general": {
      "subtotal": "Subtotal",
      "taxes_and_shipping_at_checkout_html": "Taxes and shipping calculated at checkout",
      "checkout": "Check out",
      "empty": "Your cart is empty",
      "continue_shopping": "Continue shopping",
      "remove": "Remove"
    },
    "label": {
      "quantity": "Quantity",
      "remove": "Remove item"
    }
  },
  "collections": {
    "general": { "no_matches": "No products found" }
  },
  "customer": {
    "login": {
      "title": "Log in",
      "email": "Email",
      "password": "Password",
      "sign_in": "Sign in",
      "forgot_password": "Forgot your password?",
      "create_account_html": "New customer? <a href=\"%{link}\">Create an account</a>"
    },
    "register": {
      "title": "Create account",
      "first_name": "First name",
      "last_name": "Last name",
      "email": "Email",
      "password": "Password",
      "submit": "Create",
      "login": "Already have an account? Log in"
    },
    "account": {
      "title": "My account",
      "details": "Hello, %{name}"
    },
    "orders": {
      "title": "Order history",
      "none": "You haven't placed any orders yet.",
      "order_number": "Order",
      "date": "Date",
      "payment_status": "Payment status",
      "fulfillment_status": "Fulfillment status",
      "total": "Total"
    },
    "order": {
      "title": "Order %{name}",
      "date_html": "Placed on %{date}",
      "cancelled_html": "Cancelled on %{date}. Reason: %{reason}",
      "product": "Product",
      "sku": "SKU",
      "price": "Price",
      "quantity": "Quantity",
      "total": "Total",
      "subtotal": "Subtotal",
      "fulfilled_at_html": "Fulfilled %{date}"
    },
    "addresses": {
      "title": "Addresses",
      "add_new": "Add a new address",
      "add": "Add address",
      "update": "Update address",
      "delete": "Delete",
      "default": "Default",
      "view_all": "View all addresses",
      "entries_count": "%{count} saved address"
    },
    "reset_password": {
      "title": "Reset password",
      "password": "New password",
      "password_confirm": "Confirm password",
      "submit": "Reset password"
    },
    "activate_account": {
      "title": "Activate account",
      "subtext": "Create your password to activate your account.",
      "password": "Password",
      "password_confirm": "Confirm password",
      "submit": "Activate account"
    }
  },
  "gift_cards": {
    "issued": {
      "title": "%{value} gift card for %{shop}",
      "subtext": "Your gift card",
      "remaining_html": "%{balance} remaining",
      "expired": "Expired",
      "copy_code": "Copy code",
      "shop_link": "Shop now",
      "gift_card_code": "Gift card code"
    }
  }
}
```

---

## Validation checklist

Run through this checklist after creating all template and section files:

- [ ] `shopify theme check` passes with no errors
- [ ] All `{% schema %}` blocks contain valid JSON (no trailing commas)
- [ ] All `{% for %}` loops have matching `{% endfor %}`
- [ ] All `{% if %}` blocks have matching `{% endif %}`
- [ ] All `{% form %}` blocks have matching `{% endform %}`
- [ ] All snippet `render` calls reference snippets that exist
- [ ] All translation keys used with `| t` exist in `locales/en.default.json`
- [ ] `templates/customers/` directory exists (Shopify requires this exact path)
- [ ] `gift_card.liquid` is a full HTML document with `<!DOCTYPE html>` and `{{ content_for_header }}`
- [ ] `layout/password.liquid` exists and contains `{{ content_for_layout }}`