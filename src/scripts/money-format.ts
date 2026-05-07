/**
 * Matches storefront money from `window.__themeRoutes.money_format` (injected in layout/theme.liquid).
 * Shared by predictive search, client-side price markup, etc.
 */
export function formatMoney(cents: string | number): string {
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
