import gsap from 'gsap'
import Swiper from 'swiper'
import { A11y, EffectFade, FreeMode, Keyboard, Navigation, Thumbs } from 'swiper/modules'
import { createImageLightbox, lightboxItemsFromGalleryImgs, type ImageLightboxHandle } from './image-lightbox'
import { registerSection } from './section-registry'

const SECTION_TYPE = 'main-product'

type VariantJson = {
  id: number
  available: boolean
  option1: string | null
  option2: string | null
  option3: string | null
  price: string
  compare_at_price: string | null
  compare_at_cents: number
  price_cents: number
  featured_media_id: number | null
  sku: string | null
}

type MediaEntry = {
  id: number
  src: string
  alt: string
  w: number
  h: number
}

type ProductDataVariant = {
  id: number
  option1?: string | null
  option2?: string | null
  option3?: string | null
  options?: string[] | null
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function readLightboxLabels(root: HTMLElement) {
  return {
    close: root.dataset.lightboxClose || 'Close',
    prev: root.dataset.lightboxPrev || 'Previous',
    next: root.dataset.lightboxNext || 'Next',
    dialog: root.dataset.lightboxDialog || 'Images',
    counterTemplate: root.dataset.lightboxCounter || '__CURRENT__ / __TOTAL__',
  }
}

function parseVariantsJson(container: HTMLElement): VariantJson[] | null {
  const el = container.querySelector('script[type="application/json"][data-product-variant-json]')
  if (!el?.textContent) return null
  try {
    const data = JSON.parse(el.textContent) as VariantJson[]
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

function parseMediaJson(container: HTMLElement): Record<string, MediaEntry> | null {
  const el = container.querySelector('script[type="application/json"][data-product-media-json]')
  if (!el?.textContent) return null
  try {
    return JSON.parse(el.textContent) as Record<string, MediaEntry>
  } catch {
    return null
  }
}

function getMediaIdOrder(container: HTMLElement): number[] {
  const raw = container.dataset.productMediaOrder || ''
  return raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n))
}

function normOpt(v: string | null | undefined): string {
  if (v == null || v === 'null') return ''
  return String(v).trim()
}

/**
 * Match variant using `window.__productData.variants[].options` (storefront shape)
 * so option strings align with the picker; falls back to option1/2/3 in JSON.
 */
function findVariantIdFromStorefront(choices: string[], groupCount: number): number | null {
  const w = window as unknown as { __productData?: { variants?: ProductDataVariant[] } }
  const list = w.__productData?.variants
  if (!list?.length) return null

  for (const v of list) {
    const opts: string[] =
      Array.isArray(v.options) && v.options.length
        ? v.options.map((x) => normOpt(x))
        : [normOpt(v.option1), normOpt(v.option2), normOpt(v.option3)]
    let ok = true
    for (let i = 0; i < groupCount; i++) {
      if (normOpt(choices[i]) !== normOpt(opts[i])) {
        ok = false
        break
      }
    }
    if (ok) return v.id
  }
  return null
}

function findVariantInJson(
  id: number,
  variants: VariantJson[]
): VariantJson | undefined {
  return variants.find((x) => x.id === id)
}

function findVariantJsonHeuristic(choices: string[], groupCount: number, variants: VariantJson[]): VariantJson | undefined {
  return variants.find((v) => {
    if (groupCount >= 1 && normOpt(v.option1) !== normOpt(choices[0] ?? '')) return false
    if (groupCount >= 2 && normOpt(v.option2) !== normOpt(choices[1] ?? '')) return false
    if (groupCount >= 3 && normOpt(v.option3) !== normOpt(choices[2] ?? '')) return false
    return true
  })
}

function getOptionValues(container: HTMLElement, groupCount: number): string[] {
  const out: string[] = []
  const groups = container.querySelectorAll<HTMLElement>('[data-product-option-group]')
  for (let i = 0; i < groupCount; i++) {
    const g = groups[i]
    if (!g) {
      out[i] = ''
      continue
    }
    const radio = g.querySelector<HTMLInputElement>('input[type="radio"][data-product-option]:checked')
    if (radio) {
      out[i] = radio.value
      continue
    }
    const sel = g.querySelector<HTMLSelectElement>('[data-product-option-select]')
    out[i] = sel?.value ?? ''
  }
  return out
}

function setRadiosAndSelectsFromVariant(container: HTMLElement, v: VariantJson, groupCount: number): void {
  const groups = container.querySelectorAll<HTMLElement>('[data-product-option-group]')
  const w = window as unknown as { __productData?: { variants?: ProductDataVariant[] } }
  const store = w.__productData?.variants?.find((x) => x.id === v.id)
  const opts: string[] =
    store && Array.isArray(store.options) && store.options.length
      ? store.options.map((x) => normOpt(x as string))
      : [normOpt(v.option1), normOpt(v.option2), normOpt(v.option3)]

  for (let i = 0; i < groupCount; i++) {
    const g = groups[i]
    if (!g) continue
    const val = normOpt(opts[i] ?? null)
    const rads = g.querySelectorAll<HTMLInputElement>('input[type="radio"][data-product-option]')
    if (rads.length > 0) {
      for (const r of rads) {
        r.checked = normOpt(r.value) === val
        r.labels?.[0]?.classList.toggle('is-selected', r.checked)
      }
    }
    const sel = g.querySelector<HTMLSelectElement>('[data-product-option-select]')
    if (sel) {
      const match = Array.from(sel.options).find((o) => normOpt(o.value) === val)
      if (match) sel.value = match.value
    }
  }
}

function applyVariantSku(container: HTMLElement, sku: string | null | undefined): void {
  const wrap = container.querySelector<HTMLElement>('[data-product-sku-wrap]')
  const el = container.querySelector<HTMLElement>('[data-product-sku]')
  if (!wrap || !el) return
  const s = sku != null && String(sku).trim() !== '' ? String(sku).trim() : ''
  el.textContent = s
  wrap.toggleAttribute('hidden', !s)
}

/** Opens share URLs in a new window (centered) so the product page is not left. */
function initProductShareExternal(root: HTMLElement, signal: AbortSignal): void {
  const list = root.querySelector<HTMLElement>('.main-product__meta-line--share .main-product__meta-list')
  if (!list) return

  list.addEventListener(
    'click',
    (e) => {
      const raw = e.target
      const el: Element | null =
        raw instanceof Text ? raw.parentElement : raw instanceof Element ? raw : null
      const link = el?.closest('a.main-product__meta-link') as HTMLAnchorElement | null
      if (!link || !list.contains(link)) return
      e.preventDefault()
      const url = link.href
      if (!url) return

      const w = 600
      const h = 560
      const sw = window.screenLeft ?? window.screenX ?? 0
      const st = window.screenTop ?? window.screenY ?? 0
      const vw = window.outerWidth ?? 1024
      const vh = window.outerHeight ?? 800
      const left = Math.round(sw + (vw - w) / 2)
      const top = Math.round(st + (vh - h) / 2)
      const features = [
        `width=${w}`,
        `height=${h}`,
        `left=${left}`,
        `top=${top}`,
        'scrollbars=yes',
        'resizable=yes',
      ].join(',')

      let child: Window | null = null
      try {
        child = window.open(url, 'pdp_share_social', features)
      } catch {
        child = null
      }
      if (child) {
        try {
          child.opener = null
        } catch {
          /* cross-origin */
        }
        child.focus()
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    },
    { signal }
  )
}

function initProductCopyLink(root: HTMLElement, signal: AbortSignal): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-product-share-copy]')
  if (!btn) return
  const url = (btn.dataset.shareUrl || '').trim()
  const labelDefault = (btn.dataset.labelDefault || btn.textContent || '').trim()
  const labelCopied = (btn.dataset.labelCopied || '').trim()
  if (!url || !labelDefault || !labelCopied) return

  btn.addEventListener(
    'click',
    async () => {
      try {
        await navigator.clipboard.writeText(url)
        btn.textContent = labelCopied
        btn.setAttribute('aria-label', labelCopied)
        const t = window.setTimeout(() => {
          btn.textContent = labelDefault
          btn.setAttribute('aria-label', labelDefault)
        }, 2200)
        signal.addEventListener('abort', () => window.clearTimeout(t), { once: true })
      } catch {
        /* clipboard may be denied */
      }
    },
    { signal }
  )
}

function initProductQuantityStepper(root: HTMLElement, signal: AbortSignal): void {
  const wrap = root.querySelector<HTMLElement>('[data-product-qty]')
  if (!wrap) return
  const input = wrap.querySelector<HTMLInputElement>('[data-product-qty-input]')
  if (!input) return
  const minus = wrap.querySelector<HTMLButtonElement>('[data-product-qty-minus]')
  const plus = wrap.querySelector<HTMLButtonElement>('[data-product-qty-plus]')

  const getMin = (): number => {
    const m = input.getAttribute('min')
    const n = m != null && m !== '' ? parseInt(m, 10) : 1
    return Number.isFinite(n) && n >= 1 ? n : 1
  }

  const getMax = (): number | null => {
    const m = input.getAttribute('max')
    if (m == null || m === '') return null
    const n = parseInt(m, 10)
    return Number.isFinite(n) ? n : null
  }

  const clamp = (n: number): number => {
    const min = getMin()
    const max = getMax()
    let v = Math.max(min, Math.floor(Number.isFinite(n) ? n : min))
    if (max != null) v = Math.min(v, max)
    return v
  }

  const readRaw = (): string => input.value.trim()

  const commitValue = (): void => {
    if (readRaw() === '') {
      input.value = String(getMin())
    } else {
      const parsed = parseInt(input.value, 10)
      input.value = String(clamp(parsed))
    }
  }

  const step = (delta: number): void => {
    const base = readRaw() === '' ? getMin() : parseInt(input.value, 10)
    const n = Number.isFinite(base) ? base : getMin()
    input.value = String(clamp(n + delta))
  }

  const syncDisabled = (): void => {
    const raw = readRaw()
    if (raw === '') {
      if (minus) minus.disabled = true
      if (plus) plus.disabled = false
      return
    }
    const v = parseInt(raw, 10)
    if (!Number.isFinite(v)) {
      if (minus) minus.disabled = false
      if (plus) plus.disabled = false
      return
    }
    if (minus) minus.disabled = v <= getMin()
    if (plus) {
      const max = getMax()
      plus.disabled = max != null && v >= max
    }
  }

  minus?.addEventListener(
    'click',
    () => {
      commitValue()
      step(-1)
      syncDisabled()
    },
    { signal }
  )
  plus?.addEventListener(
    'click',
    () => {
      commitValue()
      step(1)
      syncDisabled()
    },
    { signal }
  )

  input.addEventListener('blur', () => {
    commitValue()
    syncDisabled()
  }, { signal })
  input.addEventListener('change', () => {
    commitValue()
    syncDisabled()
  }, { signal })
  input.addEventListener('input', () => { syncDisabled() }, { signal })

  syncDisabled()
}

function setOptionSelectedLabels(container: HTMLElement, v: VariantJson, groupCount: number): void {
  const w = window as unknown as { __productData?: { variants?: ProductDataVariant[] } }
  const store = w.__productData?.variants?.find((x) => x.id === v.id)
  const opts: string[] =
    store && Array.isArray(store.options) && store.options.length
      ? store.options.map((x) => String(x))
      : [normOpt(v.option1), normOpt(v.option2), normOpt(v.option3)]

  const groups = container.querySelectorAll('[data-product-option-group]')
  for (let i = 0; i < groupCount; i++) {
    const g = groups[i] as HTMLElement | undefined
    if (!g) continue
    const el = g.querySelector('[data-product-option-selected]')
    if (el) el.textContent = normOpt(opts[i] ?? null) || '—'
  }
}

function killProductTweens(nodes: Element[]): void {
  for (const n of nodes) {
    gsap.killTweensOf(n)
  }
}

function getSlideIndexForMediaId(order: number[], id: number | null): number {
  if (id == null) return 0
  const i = order.indexOf(id)
  return i >= 0 ? i : 0
}

function updateSaleBadge(
  container: HTMLElement,
  variant: VariantJson
): void {
  const badge = container.querySelector<HTMLElement>('[data-product-badge]')
  if (!badge) return
  const c = variant.compare_at_cents
  const p = variant.price_cents
  if (c > p && c > 0) {
    const offPct = Math.round(((c - p) * 100) / c)
    const suffix = (container.dataset.saleOffLabel || '').trim()
    badge.hidden = false
    badge.classList.remove('is-visually-hidden', 'visually-hidden')
    badge.textContent = suffix ? `${offPct}% ${suffix}` : `${offPct}%`
  } else {
    badge.hidden = true
    badge.classList.add('is-visually-hidden')
  }
}

type MainProductTeardown = {
  (): void
}

export function registerMainProductSection(): void {
  registerSection(
    SECTION_TYPE,
    (container) => {
      const parsedVariants = parseVariantsJson(container)
      if (!parsedVariants) return
      const variants = parsedVariants

      const mediaMap = parseMediaJson(container)
      const mediaOrder = getMediaIdOrder(container)
      const reduced = prefersReducedMotion()
      const abort = new AbortController()
      const { signal } = abort

      initProductQuantityStepper(container, signal)
      initProductCopyLink(container, signal)
      initProductShareExternal(container, signal)

      const gallery = container.querySelector<HTMLElement>('[data-product-gallery]')
      const swiperEl = container.querySelector<HTMLElement>('[data-product-swiper]')
      const thumbsEl = container.querySelector<HTMLElement>('[data-product-thumbs-swiper]')

      let galleryLightbox: ImageLightboxHandle | null = null
      if (gallery && gallery.querySelector('[data-product-slide-img]')) {
        galleryLightbox = createImageLightbox({
          getItems: () => lightboxItemsFromGalleryImgs(gallery),
          labels: readLightboxLabels(container),
          reducedMotion: reduced,
        })

        const openLightboxFromTarget = (target: Element): void => {
          const img =
            target instanceof HTMLImageElement && target.hasAttribute('data-product-slide-img')
              ? target
              : target.querySelector<HTMLImageElement>('[data-product-slide-img]')
          if (!img || !gallery.contains(img)) return
          const imgs = [...gallery.querySelectorAll<HTMLImageElement>('[data-product-slide-img]')]
          const idx = imgs.indexOf(img)
          if (idx >= 0) galleryLightbox?.open(idx)
        }

        gallery.addEventListener(
          'click',
          (e) => {
            const t = e.target
            if (!(t instanceof Element)) return
            if (t.closest('.main-product__nav-btn, [data-product-thumb]')) return
            const img = t.closest<HTMLImageElement>('[data-product-slide-img]')
            const fig = t.closest('.main-product__figure--zoomable')
            if (img) openLightboxFromTarget(img)
            else if (fig) openLightboxFromTarget(fig)
          },
          { signal }
        )

        gallery.addEventListener(
          'keydown',
          (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            const t = e.target
            if (!(t instanceof Element)) return
            const fig = t.closest('.main-product__figure--zoomable')
            if (!fig || !gallery.contains(fig)) return
            e.preventDefault()
            openLightboxFromTarget(fig)
          },
          { signal }
        )
      }

      let mainSwiper: InstanceType<typeof Swiper> | null = null
      let thumbsSwiper: InstanceType<typeof Swiper> | null = null

      if (swiperEl && thumbsEl) {
        thumbsSwiper = new Swiper(thumbsEl, {
          modules: [A11y, FreeMode],
          watchSlidesProgress: true,
          observer: true,
          observeParents: true,
          spaceBetween: 8,
          slidesPerView: 4.2,
          freeMode: true,
          direction: 'horizontal',
          breakpoints: {
            480: { slidesPerView: 4.5 },
            768: {
              direction: 'vertical',
              slidesPerView: 'auto',
              spaceBetween: 8,
              freeMode: true,
            },
          },
        })
        mainSwiper = new Swiper(swiperEl, {
          modules: [A11y, EffectFade, Keyboard, Navigation, Thumbs],
          effect: 'fade',
          fadeEffect: { crossFade: true },
          speed: reduced ? 0 : 520,
          keyboard: { enabled: true, onlyInViewport: true },
          spaceBetween: 0,
          grabCursor: !reduced,
          watchOverflow: true,
          observer: true,
          observeParents: true,
          navigation: {
            nextEl: container.querySelector<HTMLElement>('[data-product-nav-next]') ?? undefined,
            prevEl: container.querySelector<HTMLElement>('[data-product-nav-prev]') ?? undefined,
          },
          thumbs: { swiper: thumbsSwiper },
          on: {
            slideChange(sw) {
              const id = mediaOrder[sw.activeIndex] ?? null
              if (gallery && id != null) gallery.setAttribute('data-active-media-id', String(id))
              container.querySelectorAll<HTMLButtonElement>('[data-product-thumb]').forEach((btn) => {
                const mid = btn.getAttribute('data-media-id')
                btn.setAttribute('aria-pressed', mid === String(id) ? 'true' : 'false')
              })
            },
          },
        })
        queueMicrotask(() => {
          thumbsSwiper?.update()
          mainSwiper?.update()
        })
      }

      const info = container.querySelector<HTMLElement>('[data-product-info]')
      const infoChildren = info ? (Array.from(info.children) as HTMLElement[]) : []
      const galleryForAnim: HTMLElement[] = []
      if (gallery) {
        const inner =
          gallery.querySelector<HTMLElement>('[data-product-gallery-frame]') ??
          gallery.querySelector<HTMLElement>('.main-product__media-inner')
        if (inner) galleryForAnim.push(inner)
      }

      const priceEl = container.querySelector('[data-product-price]')
      const compareEl = container.querySelector('[data-product-compare]')
      const submitBtn = container.querySelector<HTMLButtonElement>('[data-product-submit]')
      const submitLabel = container.querySelector('[data-product-submit-label]')
      const priceRow = container.querySelector('[data-product-price-row]')
      const form = container.querySelector<HTMLFormElement>('.main-product__form')
      const variantIdInput = container.querySelector<HTMLInputElement>('[data-product-variant-id]')
      const selectLegacy = container.querySelector<HTMLSelectElement>('[data-product-variant-select]')

      const addLabel = container.dataset.productAddLabel?.trim() || 'Add to cart'
      const soldLabel = container.dataset.productSoldLabel?.trim() || 'Sold out'

      const groupCount = container.querySelectorAll('[data-product-option-group]').length

      const pdpBleed = container.querySelector<HTMLElement>('.main-product__pdp-bleed')
      const animNodes = [...galleryForAnim, ...infoChildren, ...(pdpBleed ? [pdpBleed] : [])]

      if (animNodes.length > 0) {
        if (!reduced) {
          gsap.set(animNodes, { autoAlpha: 0, y: 20 })
          gsap.to(animNodes, {
            autoAlpha: 1,
            y: 0,
            duration: 0.68,
            ease: 'power3.out',
            stagger: 0.085,
            clearProps: 'transform,opacity,visibility',
          })
        } else {
          gsap.set(animNodes, { clearProps: 'all' })
        }
      }

      function goToMediaId(featuredId: number | null): void {
        if (featuredId == null || !mainSwiper || mediaOrder.length === 0) return
        const idx = getSlideIndexForMediaId(mediaOrder, featuredId)
        mainSwiper.slideTo(idx, reduced ? 0 : 480)
        if (gallery) gallery.setAttribute('data-active-media-id', String(featuredId))
      }

      function applySingleImageFromVariant(m: MediaEntry | undefined): void {
        const img = container.querySelector<HTMLImageElement>('[data-product-slide-img]')
        if (!img || !m) return
        img.src = m.src
        img.removeAttribute('srcset')
        img.setAttribute('width', String(m.w))
        img.setAttribute('height', String(m.h))
        img.alt = m.alt
        const fig = container.querySelector('[data-product-feature-figure]')
        if (fig) fig.setAttribute('data-media-id', String(m.id))
        if (gallery) gallery.setAttribute('data-active-media-id', String(m.id))
      }

      function applyMediaForVariant(v: VariantJson): void {
        const id = v.featured_media_id
        if (id == null) return
        if (mainSwiper && mediaOrder.length > 0) {
          goToMediaId(id)
          return
        }
        const m = mediaMap?.[String(id)]
        if (m) applySingleImageFromVariant(m)
      }

      function applyVariant(id: string): void {
        const v = variants.find((x) => String(x.id) === String(id))
        if (!v || !priceEl) return

        const updateDom = (): void => {
          priceEl.textContent = v.price
          if (compareEl) {
            if (v.compare_at_price) {
              compareEl.textContent = v.compare_at_price
              compareEl.classList.remove('is-visually-hidden')
            } else {
              compareEl.textContent = ''
              compareEl.classList.add('is-visually-hidden')
            }
          }
          if (submitBtn) {
            submitBtn.disabled = !v.available
            submitBtn.setAttribute('data-product-available', v.available ? 'true' : 'false')
          }
          if (submitLabel) submitLabel.textContent = v.available ? addLabel : soldLabel
          if (variantIdInput) variantIdInput.value = String(v.id)
          if (groupCount > 0) {
            setRadiosAndSelectsFromVariant(container, v, groupCount)
            setOptionSelectedLabels(container, v, groupCount)
          }
          updateSaleBadge(container, v)
          applyVariantSku(container, v.sku)
          applyMediaForVariant(v)
        }

        if (reduced || !priceRow) {
          updateDom()
          return
        }

        gsap.killTweensOf(priceRow)
        gsap
          .timeline()
          .to(priceRow, { autoAlpha: 0.55, y: -5, duration: 0.14, ease: 'power3.in' })
          .add(updateDom)
          .to(priceRow, { autoAlpha: 1, y: 0, duration: 0.26, ease: 'power3.out' })
      }

      function onOptionsChanged(): void {
        if (groupCount === 0) return
        const values = getOptionValues(container, groupCount)
        const sid = findVariantIdFromStorefront(values, groupCount)
        let vJson: VariantJson | undefined
        if (sid != null) {
          vJson = findVariantInJson(sid, variants)
        }
        if (!vJson) {
          vJson = findVariantJsonHeuristic(values, groupCount, variants)
        }
        if (vJson) {
          applyVariant(String(vJson.id))
        }
      }

      if (selectLegacy) {
        selectLegacy.addEventListener('change', () => applyVariant(selectLegacy.value), { signal })
      }

      for (const el of container.querySelectorAll<HTMLInputElement>('input[type="radio"][data-product-option]')) {
        el.addEventListener('change', onOptionsChanged, { signal })
      }
      for (const el of container.querySelectorAll<HTMLSelectElement>('[data-product-option-select]')) {
        el.addEventListener('change', onOptionsChanged, { signal })
      }

      if (form && submitBtn) {
        form.addEventListener(
          'submit',
          () => {
            if (submitBtn.disabled) return
            if (reduced) return
            gsap.killTweensOf(submitBtn)
            gsap.fromTo(
              submitBtn,
              { scale: 1 },
              {
                scale: 0.985,
                duration: 0.09,
                ease: 'power2.inOut',
                yoyo: true,
                repeat: 1,
              }
            )
          },
          { capture: true, signal }
        )
      }

      const extended = container as HTMLElement & { __mainProductTeardown?: MainProductTeardown }
      extended.__mainProductTeardown = () => {
        galleryLightbox?.destroy()
        galleryLightbox = null
        abort.abort()
        killProductTweens(animNodes)
        if (priceRow) gsap.killTweensOf(priceRow)
        if (submitBtn) gsap.killTweensOf(submitBtn)
        mainSwiper?.destroy(true, true)
        thumbsSwiper?.destroy(true, true)
        mainSwiper = null
        thumbsSwiper = null
      }
    },
    (container) => {
      const extended = container as HTMLElement & { __mainProductTeardown?: MainProductTeardown }
      extended.__mainProductTeardown?.()
      delete extended.__mainProductTeardown
    }
  )
}
