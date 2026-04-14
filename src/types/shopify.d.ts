declare global {
  interface Window {
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