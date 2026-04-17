# Section registry — developer guide

[Vietnamese version / Bản tiếng Việt: SECTION_REGISTRY.vi.md](./SECTION_REGISTRY.vi.md)

This theme wires Shopify sections to JavaScript through **`src/scripts/section-registry.ts`**. The registry maps a **section type string** (from Liquid) to **`init`** and **`destroy`** handlers for the section’s root DOM node.

For broader section design rules (one job per section, naming), see [SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md](./SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md). For Liquid conventions like `data-section-type`, see [BASE_THEME_SETUP.md](./BASE_THEME_SETUP.md).

---

## What you put in Liquid

On the **root element** of the section (usually the outermost wrapper):

| Attribute | Purpose |
|-----------|---------|
| `data-section-type="<type>"` | **Required for JS.** Must match the string you pass to `registerSection()` in TypeScript (`dataset.sectionType` in the DOM). |
| `data-section-id="{{ section.id }}"` | **Recommended.** Lets Shopify’s `shopify:section:load` / `shopify:section:unload` events find the right container for teardown in the theme editor. |

Example (pattern used by `sections/cart-drawer.liquid`):

```liquid
<div
  class="cart-drawer section-{{ section.id }}"
  data-section-type="cart-drawer"
  data-section-id="{{ section.id }}"
>
  …
</div>
```

---

## Public API (TypeScript)

### `registerSection(type, init, destroy)`

- **`type`** — Same string as `data-section-type` (e.g. `"cart-drawer"`, `"main-product"`).
- **`init(container)`** — Called when that section’s root element should run your setup (listeners, state, third-party widgets scoped to `container`).
- **`destroy(container)`** — Called when the section is removed or replaced (theme editor, section APIs). Remove listeners, cancel timers, move focus if needed.

Register **before** `bootSections()` runs so the map is populated when the DOM is scanned.

### `bootSections()`

1. Finds every `[data-section-type]` in the document and runs **`init`** once per element (see “No double init” below).
2. Starts a **single** `MutationObserver` on `document.body` so sections injected later (Ajax, `innerHTML`, Section Rendering API HTML) are initialized the same way.

You normally call this **once** at the end of your theme entry (e.g. `src/scripts/theme.ts`), after all `registerSection` calls.

---

## Boot order matters

Handlers must exist in the registry before the DOM is processed:

```typescript
// src/scripts/theme.ts (illustrative)
import { bootSections } from './section-registry'
import { registerCartDrawerSection } from './cart-drawer'

registerCartDrawerSection() // registers "cart-drawer"
bootSections()              // scans DOM + starts observer
```

If you call `bootSections()` first, elements whose types were not registered yet will be skipped until the next opportunity (e.g. a mutation adds them again, or you rely on `shopify:section:load`). **Always register, then boot.**

---

## No double init

The registry keeps a **`WeakSet<HTMLElement>`** of containers that have already been initialized. Calling `bootSections()` again, or inserting the same node twice through different code paths, will not run **`init`** a second time for that element. **`destroy`** removes the element from that set so a future mount can initialize again if Shopify replaces the node.

---

## Theme editor and Section Rendering API

The file listens for:

- **`shopify:section:load`** — Finds `[data-section-id="…"]` and runs **`init`** (still subject to the WeakSet).
- **`shopify:section:unload`** — Runs **`destroy`** for that container and clears it from the WeakSet.

Keep **`data-section-id="{{ section.id }}"`** on the section root so these events target the correct subtree.

---

## Dynamically injected HTML

After the first `bootSections()`, a **`MutationObserver`** watches `document.body` with `{ childList: true, subtree: true }`. For each added node:

1. If the node itself has `data-section-type`, it is initialized.
2. Any **`[data-section-type]`** descendants under that node are initialized.

So fetching HTML that contains a full section root (or a fragment that includes section roots) is enough; you do not need to call `bootSections()` again.

---

## Minimal example: new section + script

**`sections/promo-banner.liquid`** (root attributes only shown):

```liquid
<section
  class="promo-banner"
  data-section-type="promo-banner"
  data-section-id="{{ section.id }}"
>
  <p data-promo-message>{{ section.settings.message }}</p>
</section>
```

**`src/scripts/promo-banner.ts`:**

```typescript
import { registerSection } from './section-registry'

const TYPE = 'promo-banner'

export function registerPromoBannerSection(): void {
  registerSection(
    TYPE,
    (container) => {
      const msg = container.querySelector('[data-promo-message]')
      console.log('Promo mounted', msg?.textContent)
      // addEventListener, IntersectionObserver, etc. — scope to `container`
    },
    (container) => {
      console.log('Promo destroyed')
      // remove listeners tied to this section
    }
  )
}
```

**`src/scripts/theme.ts`:** import and call `registerPromoBannerSection()` **before** `bootSections()`.

---

## Real-world pattern in this repo

`registerCartDrawerSection()` in `src/scripts/cart-drawer.ts` uses `registerSection` with a shared controller: **`init`** creates (or replaces) the drawer controller for the container; **`destroy`** aborts work, resets DOM state, and moves focus if the active element was inside the drawer. The Liquid file sets `data-section-type="cart-drawer"` and `data-section-id="{{ section.id }}"` so editor lifecycle and the registry stay aligned.

---

## Quick checklist

- [ ] Root element has `data-section-type="…"` matching `registerSection`’s first argument.
- [ ] Root element has `data-section-id="{{ section.id }}"` for theme editor unload/load.
- [ ] `registerSection` is invoked before `bootSections()`.
- [ ] **`init`** / **`destroy`** only assume the given **`container`**; avoid document-wide singletons unless you deliberately coordinate (like the cart drawer).
- [ ] **`destroy`** cleans up everything **`init`** attached (listeners, observers, global overflow locks, etc.).
