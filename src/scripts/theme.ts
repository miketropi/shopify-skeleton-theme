import '../styles/theme.scss'

import { bootSections } from './section-registry'
import { registerCartDrawerSection, registerAjaxCartAdd } from './cart-drawer'

registerCartDrawerSection()
registerAjaxCartAdd()

bootSections()

console.log('Theme loaded')
