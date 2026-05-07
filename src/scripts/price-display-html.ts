import { formatMoney } from './money-format'

const ZERO_DECIMAL_ISO = new Set([
  'JPY',
  'KRW',
  'VND',
  'CLP',
  'PYG',
  'UGX',
  'XOF',
  'XAF',
  'BIF',
  'DJF',
  'GNF',
  'ISK',
  'KMF',
  'RWF',
  'VUV',
  'XPF',
  'HUF',
])

const THREE_DECIMAL_ISO = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'])

export type PriceDisplayVariant =
  | 'card'
  | 'pdp'
  | 'drawer'
  | 'cart'
  | 'summary'
  | 'search'
  | 'table'
  | 'gift'
  | 'pill'
  | 'account'

function subunitFor(isoRaw: string): { subunit: number; fracDigits: number } {
  const iso = isoRaw.toUpperCase()
  if (THREE_DECIMAL_ISO.has(iso)) return { subunit: 1000, fracDigits: 3 }
  if (ZERO_DECIMAL_ISO.has(iso)) return { subunit: 1, fracDigits: 0 }
  return { subunit: 100, fracDigits: 2 }
}

function stripSymbol(formatted: string): string {
  const sym = window.__themeRoutes?.currency_symbol?.trim() ?? ''
  let s = formatted.trim()
  if (!sym) return s
  if (s.startsWith(sym)) s = s.slice(sym.length).trim()
  if (s.endsWith(sym)) s = s.slice(0, -sym.length).trim()
  return s
}

function padFrac(frac: number, fracDigits: number): string {
  if (fracDigits <= 0) return ''
  if (fracDigits === 1) return String(frac)
  return String(frac).padStart(fracDigits, '0').slice(-fracDigits)
}

function screenReaderMoney(
  c: number,
  subunit: number,
  sym: string,
  iso: string,
  withCurrencyCode: boolean | undefined,
): string {
  if (subunit === 1) {
    const n = new Intl.NumberFormat(document.documentElement.lang || undefined, {
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(c)
    const base = sym ? `${sym}${n}` : n
    if (withCurrencyCode && iso) return `${base} ${iso}`.trim()
    return base
  }
  const m = formatMoney(c)
  if (withCurrencyCode && iso) return `${m} ${iso}`.trim()
  return m
}

/**
 * HTML mirror of `snippets/price-display.liquid` for predictive search and other JS-built UI.
 */
export function buildPriceDisplayHtml(
  cents: string | number,
  options?: {
    variant?: PriceDisplayVariant
    withCurrencyCode?: boolean
    omitZeroCents?: boolean
  },
): string {
  const c = typeof cents === 'string' ? parseInt(cents, 10) : cents
  if (!Number.isFinite(c)) return ''

  const iso = window.__themeRoutes?.currency_iso ?? 'USD'
  const { subunit, fracDigits } = subunitFor(iso)
  const decSep = window.__themeRoutes?.price_decimal_sep ?? '.'
  const sym = window.__themeRoutes?.currency_symbol?.trim() ?? ''
  const variant = options?.variant
  const variantClass = variant ? ` price-display--${variant}` : ''

  const main = Math.trunc(c / subunit)
  const frac = Math.abs(c % subunit)

  let intDisplay: string
  if (subunit === 1) {
    intDisplay = new Intl.NumberFormat(document.documentElement.lang || undefined, {
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(c)
  } else {
    const majorAmount = main * subunit
    const mf = stripSymbol(formatMoney(majorAmount))
    intDisplay = decSep === '.' ? mf.split('.')[0] ?? mf : mf.split(',')[0] ?? mf
  }

  let fracStr = fracDigits > 0 ? padFrac(frac, fracDigits) : ''
  const hideFrac =
    fracDigits > 0 &&
    options?.omitZeroCents === true &&
    /^0+$/.test(fracStr)

  const srMoney = escapeHtml(
    screenReaderMoney(c, subunit, sym, iso, options?.withCurrencyCode),
  )

  let visualInner = ''
  if (sym) visualInner += `<span class="price-display__sym">${escapeHtml(sym)}</span>`
  visualInner += `<span class="price-display__int">${escapeHtml(intDisplay)}</span>`
  if (fracDigits > 0 && !hideFrac) {
    visualInner += `<span class="price-display__sep">${escapeHtml(decSep)}</span><sup class="price-display__frac">${escapeHtml(fracStr)}</sup>`
  }
  if (options?.withCurrencyCode && iso) {
    visualInner += `<span class="price-display__code">${escapeHtml(iso)}</span>`
  }

  return `<span class="price-display${variantClass}"><span class="visually-hidden">${srMoney}</span><span class="price-display__visual" aria-hidden="true" translate="no">${visualInner}</span></span>`
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
