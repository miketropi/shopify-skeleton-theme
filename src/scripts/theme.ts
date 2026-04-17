import '../styles/theme.scss'

import { bootSections } from './section-registry'
import { registerCartDrawerSection, registerAjaxCartAdd } from './cart-drawer'
import { registerMainProductSection } from './main-product'
import { registerHeaderSection } from './header'

document.documentElement.classList.add('js')

registerCartDrawerSection()
registerAjaxCartAdd()
registerMainProductSection()
registerHeaderSection()

bootSections()

console.log('Theme loaded')
