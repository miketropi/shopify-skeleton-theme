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
import { registerHeaderSection } from './header'
import { registerSectionHeroSlider } from './sections/section-hero-slider'

document.documentElement.classList.add('js')

registerCartDrawerSection()
registerAjaxCartAdd()
registerMainProductSection()
registerHeaderSection() 
registerSectionHeroSlider()

bootSections()

console.log('Theme loaded')
