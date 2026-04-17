# Section registry — hướng dẫn cho developer

*(Bản tiếng Anh: [SECTION_REGISTRY.md](./SECTION_REGISTRY.md))*

Theme này nối các **section** của Shopify với JavaScript thông qua **`src/scripts/section-registry.ts`**. Registry ánh xạ **chuỗi loại section** (từ Liquid) tới các handler **`init`** và **`destroy`** cho **node DOM gốc** của section đó.

Quy tắc thiết kế section rộng hơn (một section một việc, đặt tên), xem [SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md](./SECTION_ARCHITECTURE_DESIGN_PRINCIPLES.md). Quy ước Liquid như `data-section-type`, xem [BASE_THEME_SETUP.md](./BASE_THEME_SETUP.md).

---

## Những gì cần có trong Liquid

Trên **phần tử gốc** của section (thường là wrapper ngoài cùng):

| Thuộc tính | Mục đích |
|------------|----------|
| `data-section-type="<type>"` | **Bắt buộc cho JS.** Phải trùng với chuỗi bạn truyền vào `registerSection()` trong TypeScript (trong DOM tương ứng `dataset.sectionType`). |
| `data-section-id="{{ section.id }}"` | **Nên có.** Giúp sự kiện `shopify:section:load` / `shopify:section:unload` của Shopify tìm đúng container để dọn dẹp trong theme editor. |

Ví dụ (cùng kiểu với `sections/cart-drawer.liquid`):

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

## API công khai (TypeScript)

### `registerSection(type, init, destroy)`

- **`type`** — Cùng chuỗi với `data-section-type` (ví dụ `"cart-drawer"`, `"main-product"`).
- **`init(container)`** — Gọi khi phần tử gốc của section cần chạy phần thiết lập của bạn (listener, state, widget bên thứ ba — giới hạn trong `container`).
- **`destroy(container)`** — Gọi khi section bị gỡ hoặc thay (theme editor, Section API). Gỡ listener, hủy timer, chuyển focus nếu cần.

Hãy **đăng ký trước** khi `bootSections()` chạy để map đã có dữ liệu khi quét DOM.

### `bootSections()`

1. Tìm mọi `[data-section-type]` trong document và chạy **`init`** một lần cho mỗi phần tử (xem mục “Không khởi tạo hai lần” bên dưới).
2. Khởi động **một** `MutationObserver` trên `document.body` để các section chèn sau (Ajax, `innerHTML`, HTML từ Section Rendering API) cũng được khởi tạo giống vậy.

Thông thường bạn gọi hàm này **một lần** ở cuối entry theme (ví dụ `src/scripts/theme.ts`), sau mọi lệnh `registerSection`.

---

## Thứ tự boot rất quan trọng

Handler phải đã có trong registry **trước** khi DOM được xử lý:

```typescript
// src/scripts/theme.ts (minh họa)
import { bootSections } from './section-registry'
import { registerCartDrawerSection } from './cart-drawer'

registerCartDrawerSection() // đăng ký "cart-drawer"
bootSections()              // quét DOM + bật observer
```

Nếu gọi `bootSections()` trước, các phần tử mà loại tương ứng **chưa** được đăng ký sẽ bị bỏ qua cho đến khi có cơ hội tiếp theo (ví dụ mutation chèn lại, hoặc bạn dựa vào `shopify:section:load`). **Luôn đăng ký trước, boot sau.**

---

## Không khởi tạo hai lần

Registry giữ một **`WeakSet<HTMLElement>`** các container đã được khởi tạo. Gọi lại `bootSections()`, hoặc chèn cùng một node hai lần qua luồng khác nhau, **sẽ không** chạy **`init`** lần hai cho phần tử đó. **`destroy`** gỡ phần tử khỏi set đó để lần mount sau (khi Shopify thay node) có thể khởi tạo lại.

---

## Theme editor và Section Rendering API

File lắng nghe:

- **`shopify:section:load`** — Tìm `[data-section-id="…"]` và chạy **`init`** (vẫn tuân WeakSet).
- **`shopify:section:unload`** — Chạy **`destroy`** cho container đó và xóa khỏi WeakSet.

Giữ **`data-section-id="{{ section.id }}"`** trên gốc section để các sự kiện này nhắm đúng subtree.

---

## HTML chèn động

Sau lần `bootSections()` đầu tiên, **`MutationObserver`** theo dõi `document.body` với `{ childList: true, subtree: true }`. Với mỗi node được thêm:

1. Nếu chính node đó có `data-section-type`, nó được khởi tạo.
2. Mọi **con cháu** có **`[data-section-type]`** bên dưới node đó cũng được khởi tạo.

Vì vậy fetch HTML chứa đủ gốc section (hoặc fragment có các gốc section) là đủ; **không cần** gọi lại `bootSections()`.

---

## Ví dụ tối thiểu: section mới + script

**`sections/promo-banner.liquid`** (chỉ hiển thị thuộc tính gốc):

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
      // addEventListener, IntersectionObserver, v.v. — giới hạn trong `container`
    },
    (container) => {
      console.log('Promo destroyed')
      // gỡ listener gắn với section này
    }
  )
}
```

**`src/scripts/theme.ts`:** import và gọi `registerPromoBannerSection()` **trước** `bootSections()`.

---

## Mẫu thực tế trong repo này

`registerCartDrawerSection()` trong `src/scripts/cart-drawer.ts` dùng `registerSection` với một controller dùng chung: **`init`** tạo (hoặc thay) controller drawer cho `container`; **`destroy`** hủy việc đang làm, reset trạng thái DOM, và chuyển focus nếu phần tử đang focus nằm trong drawer. File Liquid đặt `data-section-type="cart-drawer"` và `data-section-id="{{ section.id }}"` để vòng đời trong editor và registry khớp nhau.

---

## Checklist nhanh

- [ ] Phần tử gốc có `data-section-type="…"` trùng tham số đầu của `registerSection`.
- [ ] Phần tử gốc có `data-section-id="{{ section.id }}"` cho unload/load trong theme editor.
- [ ] `registerSection` được gọi trước `bootSections()`.
- [ ] **`init`** / **`destroy`** chỉ giả định **`container`** được truyền vào; tránh singleton toàn document trừ khi cố ý phối hợp (như cart drawer).
- [ ] **`destroy`** dọn hết những gì **`init`** gắn vào (listener, observer, khóa overflow toàn cục, v.v.).
