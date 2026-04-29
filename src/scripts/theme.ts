/**
 * Theme styles
 */
import '../styles/theme.scss'

/**
 * Swiper styles
 */
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'

/**
 * Sections
 */
import { bootSections } from './section-registry'
import { registerCartDrawerSection, registerAjaxCartAdd } from './cart-drawer'
import { registerMainProductSection } from './main-product'
import { registerProductTabsSection } from './product-tabs'
import { registerHeaderSection } from './header'
import { registerSectionHeroSlider } from './sections/section-hero-slider'
import './size-guide'

export type { ThemeModalOptions } from './theme-modal'
export { ThemeModal, THEME_MODAL_COMPACT_MQ } from './theme-modal'

document.documentElement.classList.add('js')

registerCartDrawerSection()
registerAjaxCartAdd()
registerMainProductSection()
registerProductTabsSection()
registerHeaderSection() 
registerSectionHeroSlider()

bootSections()

console.log('Theme loaded')
