import '../styles/theme.scss'

type SectionInit = (container: HTMLElement) => void
type SectionDestroy = (container: HTMLElement) => void

type SectionHandlers = { init: SectionInit; destroy: SectionDestroy }

const registry = new Map<string, SectionHandlers>()

export function registerSection(
  type: string,
  init: SectionInit,
  destroy: SectionDestroy
): void {
  registry.set(type, { init, destroy })
}

function initSectionInContainer(container: HTMLElement): void {
  const type = container.dataset.sectionType
  if (!type) return
  const handlers = registry.get(type)
  if (handlers) handlers.init(container)
}

function destroySectionInContainer(container: HTMLElement): void {
  const type = container.dataset.sectionType
  if (!type) return
  const handlers = registry.get(type)
  if (handlers) handlers.destroy(container)
}

function bootExistingSections(): void {
  document.querySelectorAll<HTMLElement>('[data-section-type]').forEach((el) => {
    initSectionInContainer(el)
  })
}

bootExistingSections()

document.addEventListener('shopify:section:load', (e: Event) => {
  const event = e as CustomEvent<{ sectionId?: string }>
  const id = event.detail?.sectionId
  const container = id
    ? (document.querySelector(`[data-section-id="${id}"]`) as HTMLElement | null)
    : null
  if (container) initSectionInContainer(container)
})

document.addEventListener('shopify:section:unload', (e: Event) => {
  const event = e as CustomEvent<{ sectionId?: string }>
  const id = event.detail?.sectionId
  const container = id
    ? (document.querySelector(`[data-section-id="${id}"]`) as HTMLElement | null)
    : null
  if (container) destroySectionInContainer(container)
})

console.log('Theme loaded')
