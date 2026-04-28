# ThemeModal — GSAP dialog utility

This theme includes a small, reusable modal helper in [`src/scripts/theme-modal.ts`](../src/scripts/theme-modal.ts). It handles **GSAP open/close motion**, **scroll locking**, **Escape**, **overlay dismiss**, **focus return** to the trigger, and a basic **Tab focus cycle** inside the dialog.

The **Size guide** uses it via [`src/scripts/size-guide.ts`](../src/scripts/size-guide.ts) and [`snippets/size-guide-modal.liquid`](../snippets/size-guide-modal.liquid). **`theme-modal` BEM classes** (see below) provide one consistent visual system so each new dialog does not need its own overlay, panel, header, or loading styles.

---

## When to use it

Use `ThemeModal` when you want:

- Consistent **show/hide animation** (overlay fade + panel move/scale) without hand-written timelines in each feature.
- **Accessibility defaults**: `aria-hidden` / `aria-modal` on open and close, focus restored to the control that opened the dialog, Tab wrapping inside the dialog.
- **`prefers-reduced-motion: reduce`** respected with shorter durations.

It is **not** a full UI kit: you still own feature-specific structure and content styles. The TypeScript class animates and wires behavior; pairing it with **`theme-modal` CSS** gives a consistent dialog shell across the theme.

---

## Shared UI (`theme-modal` classes)

Use these classes on markup that `ThemeModal` controls (styling: [`src/styles/components/_theme-modal.scss`](../src/styles/components/_theme-modal.scss)):

| Region | Class | Notes |
|--------|--------|--------|
| Host | `theme-modal` | Fixed full-viewport layer; **`overflow-y: auto`** — this is the scroll container (not `.theme-modal__body`). |
| Aligner | `theme-modal__aligner` | Wraps overlay + panel; `min-height: 100%` + flex spacers (`::before` / `::after`) center short dialogs on **desktop**; on **compact** (≤74.99em) spacers are off and the panel anchors as a **bottom sheet** (phone) or **floating card** (tablet). |
| Backdrop | `theme-modal__overlay` | Optional; pass as `overlay` in options. Uses **backdrop blur** on compact viewports when supported. |
| Handle | `theme-modal__handle` | Optional drag handle; add **`data-theme-modal-drag`** for an explicit target. On compact/sheet viewports, **`ThemeModal`** attaches pointer listeners so a **downward drag** past the threshold dismisses (with overlay fade during drag). |
| Surface | `theme-modal__panel` | Required animated panel. |
| Header | `theme-modal__header` | |
| Title | `theme-modal__title` | |
| Close | `theme-modal__close` | Include **`data-theme-modal-close`** — `ThemeModal` dismisses on click (no extra listener). |
| Body | `theme-modal__body` | Main content; **not** a scroll region (no `max-height` / inner overflow). |
| Shortcut hints | `theme-modal__hints`, `theme-modal__hints-inner`, `theme-modal__hint-list`, `theme-modal__hint`, `theme-modal__kbd` | Optional footer row; use snippet [`snippets/theme-modal-hints.liquid`](../snippets/theme-modal-hints.liquid). Copy lives in `general.modal` locale keys. |
| Loading | `theme-modal__loading`, `theme-modal__spinner` | Optional. |
| Status text | `theme-modal__message` | Empty / error copy inside the panel. |

Tokens such as `--cs-*` and `--style-border-radius-inputs` are used in the stylesheet so modal chrome tracks global theme settings.

---

## Import

From the theme bundle entry (already re-exported for convenience):

```ts
import { ThemeModal, type ThemeModalOptions } from './theme'
```

Or import the module directly:

```ts
import { ThemeModal, type ThemeModalOptions } from './theme-modal'
```

---

## Expected DOM shape

Structure:

1. **`root`** (`theme-modal`) — `position: fixed; inset: 0`. Scroll long content here (`overflow-y: auto`), not inside the body.
2. **`theme-modal__aligner`** — Wraps overlay + panel. **Desktop:** flex spacers center short dialogs. **Compact:** bottom-anchored sheet layout (see `_theme-modal.scss` + `THEME_MODAL_COMPACT_MQ` in `theme-modal.ts`).
3. **`overlay`** (optional) — Full bleed inside the aligner; grows with scrollable content. Clicks **only on the overlay element itself** close the modal.
4. **`panel`** — The animated “card” or sheet. GSAP animates this node’s `autoAlpha`, `y`, and `scale`.

Example:

```html
<div
  id="example-modal"
  class="theme-modal"
  role="dialog"
  aria-modal="false"
  aria-hidden="true"
  aria-labelledby="example-modal-title"
>
  <div class="theme-modal__aligner">
    <div class="theme-modal__overlay"></div>
    <div class="theme-modal__panel">
      <div
        class="theme-modal__handle"
        data-theme-modal-drag
        aria-label="{{ 'general.modal.handle_drag_close' | t }}"
      ></div>
      <div class="theme-modal__header">
        <h2 id="example-modal-title" class="theme-modal__title">Title</h2>
        <button type="button" class="theme-modal__close" data-theme-modal-close>Close</button>
      </div>
      <div class="theme-modal__body">
        <p>Content.</p>
      </div>
      {% render 'theme-modal-hints' %}
    </div>
  </div>
</div>
```

**Roles:** If `root` has `role="dialog"` or `role="alertdialog"`, `ThemeModal` will set `aria-modal="true"` while open and `aria-modal="false"` when closed.

**CSS:** Avoid long **`transition`**s on `opacity` / `visibility` for the same elements GSAP animates, or motion may fight. Prefer the shared [`_theme-modal.scss`](../src/styles/components/_theme-modal.scss) for chrome; add a small feature SCSS file only for content-specific layouts (tables, media, etc.), as with [`_size-guide.scss`](../src/styles/sections/_size-guide.scss).

---

## Constructor options

`ThemeModalOptions` (all fields except `root` / `panel` are optional):

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `root` | `HTMLElement` | (required) | Dialog host. |
| `panel` | `HTMLElement` \| `string` | (required) | Panel node or selector **relative to `root`**. |
| `overlay` | `HTMLElement` \| `string` \| `null` | `null` | Backdrop; fade in/out. Omit for no backdrop. |
| `overlayCloses` | `boolean` | `true` | Click on `overlay` closes (direct target only). |
| `escapeCloses` | `boolean` | `true` | Escape closes. |
| `lockScroll` | `boolean` | `true` | Sets `document.documentElement.style.overflow = 'hidden'` while open. |
| `durationOpen` | `number` | `0.4` | Open timeline length in **seconds** (shortened if reduced motion). |
| `durationClose` | `number` | `0.28` | Close timeline length in **seconds**. |
| `enterY` | `number` | `18` | Panel starts this many **pixels** lower; animates to `0` (non-compact / desktop). |
| `sheetMotion` | `boolean` | `true` | On **compact** viewports (`THEME_MODAL_COMPACT_MQ` / ≤74.99em), slide the panel like a **bottom sheet** (matches CSS). |
| `compactMediaQuery` | `string` | `THEME_MODAL_COMPACT_MQ` | Override breakpoint (must match `_theme-modal.scss`). |
| `sheetMargin` | `number` | `20` | Extra px when sliding the sheet off-screen. |
| `dragToClose` | `boolean` | `true` | On compact sheets, enable **drag handle** dismiss (`pointerdown` + vertical drag). |
| `dragCloseThresholdPx` | `number` | `72` | Release distance (px) that closes the sheet. |
| `dragVelocityDismiss` | `number` | `0.42` | Downward velocity (px/ms) on release that closes even under the distance threshold. |
| `dragHandle` | `HTMLElement` \| `string` \| `null` | (resolve) | Handle node or selector; `null` disables; default: `[data-theme-modal-drag]` then `.theme-modal__handle`. |

---

## API

| Member | Description |
|--------|--------------|
| `open(fromTrigger?: HTMLElement \| null): Promise<void>` | Runs open timeline, then focuses the first visible focusable inside `root`, or focuses the panel with `tabindex="-1"` if none. Pass **`fromTrigger`** so **close** can restore focus there. |
| `close(): Promise<void>` | Runs close timeline, clears scroll lock, removes listeners, restores focus to the last `open` trigger. |
| `destroy(): void` | Use when **`root` is removed** (e.g. custom element `disconnectedCallback`). Kills tweens, removes listeners, resets layout and ARIA, restores scroll/focus if still marked open. |
| `setClosedLayout(): void` | Resets GSAP “closed” state on `root` / overlay / panel (idempotent). |
| `root` | Getter: the host element. |
| `isOpen` | Getter: internal open flag (false as soon as `close()` starts). |

---

## Events

Fired on **`root`** (they bubble):

- **`theme-modal:opened`** — After the open timeline finishes and initial focus runs.
- **`theme-modal:closed`** — After the close timeline finishes and focus is restored.

```ts
document.querySelector('#example-modal')?.addEventListener('theme-modal:opened', () => {
  console.log('Open')
})
```

---

## Minimal TypeScript example

```ts
import { ThemeModal } from './theme-modal'

const root = document.querySelector<HTMLElement>('#example-modal')
if (!root) throw new Error('Missing #example-modal')

const modal = new ThemeModal({
  root,
  panel: '.theme-modal__panel',
  overlay: '.theme-modal__overlay',
})

document.querySelector('#example-open')?.addEventListener('click', (e) => {
  const btn = e.currentTarget as HTMLElement
  void modal.open(btn)
})
```

Use `void` or `await` depending on whether you need to chain work after open/close.

---

## Caveats

1. **Selectors** — `panel` and `overlay` are resolved with `root.querySelector` when passed as strings. They must be **descendants of `root`**.
2. **Nested modals** — Only one stack level is assumed. Escape / focus behavior is not stacked.
3. **Overlay clicks** — Closing uses `if (e.target === this.overlay)`. The overlay should not contain interactive children if those clicks should not close the dialog; put controls in `panel`.
4. **`data-theme-modal-close`** — Clicks are delegated from `root`; ensure close targets are **inside** `root`.
5. **Focusables** — Elements inside `[hidden]` or with no layout box are skipped for Tab and “first focus”.
6. **Concurrent open** — `open()` returns immediately if already open; it does not queue a second open.

---

## Reference implementation in this theme

- **Script:** [`src/scripts/size-guide.ts`](../src/scripts/size-guide.ts) — constructs `ThemeModal` with `.theme-modal__panel` and `.theme-modal__overlay`, then loads HTML into the panel after `open()`.
- **Markup:** [`snippets/size-guide-modal.liquid`](../snippets/size-guide-modal.liquid) — `<size-guide-modal class="theme-modal …">` host + shared `theme-modal__*` shell.
- **Related:** [Feature: Size Guide Modal with Section Rendering API](Feature:%20Size%20Guide%20Modal%20with%20Section%20Rendering%20API.md) — Section Rendering API and product context for the size guide, not `ThemeModal`-specific.

---

## Build note

`ThemeModal` depends on **GSAP** (already a theme dependency in `package.json`). No extra packages are required beyond the existing Vite bundle.
