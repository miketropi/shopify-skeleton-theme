/**
 * Theme styles
 */
import '../styles/theme.scss'

/**
 * Sections
 */
import { bootSections } from './section-registry'
import { registerCartDrawerSection, registerAjaxCartAdd } from './cart-drawer'
import { registerMainProductSection } from './main-product'
import { registerProductTabsSection } from './product-tabs'
import { registerHeaderSection } from './header'
import { registerSectionHeroSlider } from './sections/section-hero-slider'
import { registerSectionHomeSlider } from './sections/section-home-slider'
import { registerSectionProductSlider } from './sections/section-product-slider'
import { registerSectionCollectionList } from './sections/section-collection-list'
import { registerSectionCollectionSlide } from './sections/section-collection-slide'
import { registerSectionProductImagesStory } from './sections/section-product-images-story'
import { registerCollectionGridSection } from './collection-grid'
import './size-guide'
import { initSearchModal } from './search-modal'
import { registerHeaderTopBarSection } from './header-top-bar'
import { registerMainBlogSection } from './main-blog'
import { registerMainArticleSection } from './main-article'
import { bindTcardHoverVideos } from './tcard-hover-video'
import {
  initRoughNotation,
  bindRoughNotationSectionEvents,
  attachRoughNotationGlobalShim,
} from './rough-notation'

export type { ThemeModalOptions } from './theme-modal'
export { ThemeModal, THEME_MODAL_COMPACT_MQ } from './theme-modal'
export {
  enhanceCustomSelectRoot,
  initCustomSelectsInContainer,
  destroyCustomSelectsInContainer,
} from './custom-select'
export {
  initRoughNotation,
  refreshRoughNotation,
  processContainer,
  ROUGH_NOTATION_DEFAULTS,
} from './rough-notation'

document.documentElement.classList.add('js')

registerCartDrawerSection()
registerAjaxCartAdd()
registerMainProductSection()
registerProductTabsSection()
registerHeaderSection() 
registerSectionHeroSlider()
registerSectionHomeSlider()
registerSectionProductSlider()
registerSectionCollectionList()
registerSectionCollectionSlide()
registerSectionProductImagesStory()
registerCollectionGridSection()
registerHeaderTopBarSection()
registerMainBlogSection()
registerMainArticleSection()

bootSections()
initSearchModal()
bindRoughNotationSectionEvents()
attachRoughNotationGlobalShim()

document.addEventListener('DOMContentLoaded', () => {
  bindTcardHoverVideos(document.body)
  initRoughNotation(document.body)
})

console.log('Theme loaded')
