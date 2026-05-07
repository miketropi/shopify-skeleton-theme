declare global {
  interface Window {
    /** Populated from Liquid in layout/theme.liquid; preferred over Shopify.routes for cart URLs. */
    __themeRoutes?: {
      root: string
      cart_url: string
      cart_add_url: string
      cart_change_url: string
      cart_update_url: string
      search_url: string
      predictive_search_url: string
      money_format: string
      currency_iso: string
      currency_symbol: string
      price_decimal_sep: string
    }
    Shopify: {
      shop: string
      locale: string
      currency: { active: string; rate: string }
      country: string
      designMode: boolean
      routes: {
        root: string
        cart_add_url: string
        cart_change_url: string
        cart_update_url: string
        cart_url: string
        predictive_search_url: string
      }
      theme: {
        name: string
        id: number
      }
    }
  }
}

export {}