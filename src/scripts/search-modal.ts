const DEBOUNCE_MS = 300
const RESULT_LIMIT = 6
const RESOURCE_TYPES = 'product,collection,article,page'
const RECENT_KEY = 'search_recent'
const RECENT_MAX = 5

interface PredictiveResult {
  title: string
  url: string
  image?: string
  price?: string
  compareAtPrice?: string
  vendor?: string
  available?: boolean
  type: string
}

let modal: HTMLElement | null = null
let input: HTMLInputElement | null = null
let resultsContainer: HTMLElement | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let fetchController: AbortController | null = null
let selectedIndex = -1
let currentQuery = ''

// ── Recent searches (localStorage) ────────────────────────

function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string').slice(0, RECENT_MAX)
  } catch {
    return []
  }
}

function saveRecent(list: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)))
  } catch { /* quota / private browsing — silently ignore */ }
}

function addRecent(term: string): void {
  const trimmed = term.trim()
  if (!trimmed) return
  const list = getRecent().filter((t) => t.toLowerCase() !== trimmed.toLowerCase())
  list.unshift(trimmed)
  saveRecent(list)
}

function removeRecent(term: string): void {
  saveRecent(getRecent().filter((t) => t !== term))
}

function clearRecent(): void {
  try { localStorage.removeItem(RECENT_KEY) } catch { /* ignore */ }
}

function renderRecentSearches(): void {
  if (!resultsContainer) return
  const recent = getRecent()
  if (recent.length === 0) {
    resultsContainer.innerHTML = ''
    return
  }

  let html = `<div class="search-modal__group"><div class="search-modal__group-heading"><span class="search-modal__group-title">Recent searches</span><button type="button" class="search-modal__recent-clear" data-recent-clear-all>Clear all</button></div>`

  for (const term of recent) {
    html += `<div class="search-modal__item search-modal__item--recent" data-recent-term="${escapeAttr(term)}"><svg class="search-modal__recent-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span class="search-modal__item-body"><span class="search-modal__item-title">${escapeHtml(term)}</span></span><button type="button" class="search-modal__recent-remove" data-recent-remove="${escapeAttr(term)}" aria-label="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`
  }

  html += '</div>'
  resultsContainer.innerHTML = html
  selectedIndex = -1
}

// ── Init ──────────────────────────────────────────────────

export function initSearchModal(): void {
  modal = document.querySelector<HTMLElement>('[data-search-modal]')
  if (!modal) return

  input = modal.querySelector<HTMLInputElement>('[data-search-input]')
  resultsContainer = modal.querySelector<HTMLElement>('[data-search-results]')

  document.querySelectorAll<HTMLElement>('[data-search-open]').forEach((btn) => {
    btn.addEventListener('click', open)
  })

  modal.querySelectorAll<HTMLElement>('[data-search-close]').forEach((el) => {
    el.addEventListener('click', close)
  })

  document.addEventListener('keydown', handleGlobalKeydown)
  input?.addEventListener('input', handleInput)
  input?.addEventListener('keydown', handleInputKeydown)
  resultsContainer?.addEventListener('click', handleResultClick)
}

function open(): void {
  if (!modal || !input) return
  modal.classList.add('is-open')
  modal.setAttribute('aria-hidden', 'false')
  document.body.style.overflow = 'hidden'
  input.value = ''
  selectedIndex = -1
  currentQuery = ''
  renderRecentSearches()
  requestAnimationFrame(() => input!.focus())
}

function close(): void {
  if (!modal) return
  modal.classList.remove('is-open')
  modal.setAttribute('aria-hidden', 'true')
  document.body.style.overflow = ''
  fetchController?.abort()
}

function isOpen(): boolean {
  return modal?.classList.contains('is-open') ?? false
}

function handleGlobalKeydown(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (isOpen()) {
      close()
    } else {
      open()
    }
    return
  }

  if (e.key === 'Escape' && isOpen()) {
    e.preventDefault()
    close()
  }
}

function handleInput(): void {
  const query = input?.value.trim() ?? ''

  if (debounceTimer) clearTimeout(debounceTimer)

  if (query.length < 2) {
    hideLoading()
    if (query.length === 0) {
      renderRecentSearches()
    } else {
      clearResults()
    }
    currentQuery = ''
    return
  }

  showLoading()
  debounceTimer = setTimeout(() => fetchResults(query), DEBOUNCE_MS)
}

function showLoading(): void {
  modal?.classList.add('is-searching')
  if (!resultsContainer) return
  const existing = resultsContainer.querySelector('.search-modal__skeleton')
  if (existing) return
  resultsContainer.innerHTML = `<div class="search-modal__skeleton" aria-hidden="true">${Array.from({ length: 4 }, () => `<div class="search-modal__skeleton-row"><div class="search-modal__skeleton-thumb"></div><div class="search-modal__skeleton-lines"><div class="search-modal__skeleton-line search-modal__skeleton-line--wide"></div><div class="search-modal__skeleton-line search-modal__skeleton-line--narrow"></div></div></div>`).join('')}</div>`
}

function hideLoading(): void {
  modal?.classList.remove('is-searching')
}

function handleInputKeydown(e: KeyboardEvent): void {
  const items = getSelectableItems()
  if (items.length === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex = Math.min(selectedIndex + 1, items.length - 1)
    updateSelection(items)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex = Math.max(selectedIndex - 1, -1)
    updateSelection(items)
  } else if (e.key === 'Enter' && selectedIndex >= 0) {
    e.preventDefault()
    const item = items[selectedIndex]

    const recentTerm = item.getAttribute('data-recent-term')
    if (recentTerm && input) {
      input.value = recentTerm
      addRecent(recentTerm)
      fetchResults(recentTerm)
      return
    }

    const href = item.getAttribute('href')
    if (href) window.location.href = href
  }
}

function handleResultClick(e: MouseEvent): void {
  const target = e.target as HTMLElement

  const removeBtn = target.closest<HTMLElement>('[data-recent-remove]')
  if (removeBtn) {
    e.preventDefault()
    e.stopPropagation()
    const term = removeBtn.getAttribute('data-recent-remove')
    if (term) {
      removeRecent(term)
      renderRecentSearches()
    }
    return
  }

  const clearAllBtn = target.closest<HTMLElement>('[data-recent-clear-all]')
  if (clearAllBtn) {
    e.preventDefault()
    clearRecent()
    clearResults()
    return
  }

  const recentItem = target.closest<HTMLElement>('[data-recent-term]')
  if (recentItem && input) {
    e.preventDefault()
    const term = recentItem.getAttribute('data-recent-term')
    if (term) {
      input.value = term
      addRecent(term)
      fetchResults(term)
    }
    return
  }

  const link = target.closest<HTMLAnchorElement>('a[href]')
  if (link) close()
}

function getSelectableItems(): HTMLElement[] {
  if (!resultsContainer) return []
  return Array.from(resultsContainer.querySelectorAll<HTMLElement>('.search-modal__item'))
}

function updateSelection(items: HTMLElement[]): void {
  items.forEach((item, i) => {
    item.classList.toggle('is-selected', i === selectedIndex)
  })
  if (selectedIndex >= 0 && items[selectedIndex]) {
    items[selectedIndex].scrollIntoView({ block: 'nearest' })
  }
}

async function fetchResults(query: string): Promise<void> {
  const routes = window.__themeRoutes
  if (!routes?.predictive_search_url) return

  fetchController?.abort()
  fetchController = new AbortController()

  currentQuery = query
  addRecent(query)

  try {
    const url = `${routes.predictive_search_url}?q=${encodeURIComponent(query)}&resources[type]=${RESOURCE_TYPES}&resources[limit]=${RESULT_LIMIT}`
    const resp = await fetch(url, {
      signal: fetchController.signal,
      headers: { Accept: 'application/json' },
    })

    if (!resp.ok) return

    const data = (await resp.json()) as {
      resources: {
        results: {
          products?: PredictiveProduct[]
          collections?: PredictiveCollection[]
          articles?: PredictiveArticle[]
          pages?: PredictivePage[]
        }
      }
    }

    if (currentQuery !== query) return
    hideLoading()
    renderResults(data.resources.results, query)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return
    hideLoading()
  }
}

// ── Shopify Predictive Search response types ──────────────

interface PredictiveProduct {
  title: string
  url: string
  handle: string
  price: string
  price_min: string
  price_max: string
  compare_at_price_min: string
  compare_at_price_max: string
  image?: string
  featured_image?: { url: string; alt: string }
  vendor: string
  type: string
  available: boolean
}

interface PredictiveCollection {
  title: string
  url: string
  featured_image?: { url: string; alt: string }
}

interface PredictiveArticle {
  title: string
  url: string
  image?: string
  featured_image?: { url: string; alt: string }
}

interface PredictivePage {
  title: string
  url: string
}

function renderResults(
  results: {
    products?: PredictiveProduct[]
    collections?: PredictiveCollection[]
    articles?: PredictiveArticle[]
    pages?: PredictivePage[]
  },
  query: string
): void {
  if (!resultsContainer) return

  selectedIndex = -1

  const { products = [], collections = [], articles = [], pages = [] } = results
  const total = products.length + collections.length + articles.length + pages.length

  if (total === 0) {
    resultsContainer.innerHTML = `<div class="search-modal__empty">No results found</div>`
    return
  }

  let html = ''

  if (products.length > 0) {
    html += renderGroup('Products', products.map((p) => {
      const imgUrl = p.featured_image?.url ?? p.image ?? ''
      const hasPriceRange = p.price_min !== p.price_max
      const hasCompare = parseFloat(p.compare_at_price_min) > 0 && parseFloat(p.compare_at_price_min) > parseFloat(p.price_min)
      return {
        title: p.title,
        url: p.url,
        image: imgUrl,
        price: hasPriceRange
          ? `${formatMoney(p.price_min)} – ${formatMoney(p.price_max)}`
          : formatMoney(p.price),
        compareAtPrice: hasCompare ? formatMoney(p.compare_at_price_min) : undefined,
        vendor: p.vendor || undefined,
        available: p.available,
        type: 'product',
      }
    }))
  }

  if (collections.length > 0) {
    html += renderGroup('Collections', collections.map((c) => ({
      title: c.title,
      url: c.url,
      image: c.featured_image?.url ?? '',
      type: 'collection',
    })))
  }

  if (articles.length > 0) {
    html += renderGroup('Articles', articles.map((a) => ({
      title: a.title,
      url: a.url,
      image: a.featured_image?.url ?? a.image ?? '',
      type: 'article',
    })))
  }

  if (pages.length > 0) {
    html += renderGroup('Pages', pages.map((p) => ({
      title: p.title,
      url: p.url,
      type: 'page',
    })))
  }

  const routes = window.__themeRoutes
  const searchUrl = routes?.search_url ?? '/search'
  const encodedQuery = encodeURIComponent(query)
  html += `<a class="search-modal__view-all" href="${searchUrl}?q=${encodedQuery}">View all results<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></a>`

  resultsContainer.innerHTML = html
}

function renderGroup(title: string, items: PredictiveResult[]): string {
  let html = `<div class="search-modal__group"><div class="search-modal__group-title">${escapeHtml(title)}</div>`

  for (const item of items) {
    const imageHtml = item.image
      ? `<img class="search-modal__item-image" src="${escapeAttr(item.image)}&width=96" alt="" loading="lazy">`
      : `<div class="search-modal__item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>`

    let metaHtml = ''
    if (item.vendor) {
      metaHtml += `<span class="search-modal__item-vendor">${escapeHtml(item.vendor)}</span>`
    }
    if (item.type !== 'product') {
      metaHtml += `<span>${escapeHtml(capitalize(item.type))}</span>`
    }

    let priceHtml = ''
    if (item.price) {
      if (item.available === false) {
        priceHtml = `<span class="search-modal__item-price search-modal__item-price--soldout">Sold out</span>`
      } else if (item.compareAtPrice) {
        priceHtml = `<div class="search-modal__item-price-wrap"><span class="search-modal__item-price search-modal__item-price--sale">${item.price}</span><s class="search-modal__item-price search-modal__item-price--compare">${item.compareAtPrice}</s></div>`
      } else {
        priceHtml = `<span class="search-modal__item-price">${item.price}</span>`
      }
    }

    html += `<a class="search-modal__item" href="${escapeAttr(item.url)}">${imageHtml}<div class="search-modal__item-body"><div class="search-modal__item-title">${escapeHtml(item.title)}</div>${metaHtml ? `<div class="search-modal__item-meta">${metaHtml}</div>` : ''}</div>${priceHtml}</a>`
  }

  html += '</div>'
  return html
}

function clearResults(): void {
  if (resultsContainer) resultsContainer.innerHTML = ''
  selectedIndex = -1
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatMoney(cents: string | number): string {
  const amount = typeof cents === 'string' ? parseFloat(cents) : cents
  if (isNaN(amount)) return ''
  const fmt = window.__themeRoutes?.money_format ?? '${{amount}}'
  const valueWithDecimals = amount.toFixed(2)
  const [whole, dec = '00'] = valueWithDecimals.split('.')
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const withDotsComma = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const withSpaces = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  return fmt
    .replace('{{amount_with_comma_separator}}', `${withDotsComma},${dec}`)
    .replace('{{amount_no_decimals_with_comma_separator}}', withDotsComma)
    .replace('{{amount_no_decimals_with_space_separator}}', withSpaces)
    .replace('{{amount_with_apostrophe_separator}}', `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, "'")}.${dec}`)
    .replace('{{amount_no_decimals}}', withCommas.split('.')[0])
    .replace('{{amount}}', `${withCommas}.${dec}`)
    .replace('{{amount_with_space_separator}}', `${withSpaces},${dec}`)
}
