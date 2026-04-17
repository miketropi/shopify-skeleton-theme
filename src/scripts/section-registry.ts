type SectionInit = (container: HTMLElement) => void
type SectionDestroy = (container: HTMLElement) => void

type SectionHandlers = { init: SectionInit; destroy: SectionDestroy }

const registry = new Map<string, SectionHandlers>()
const initializedSections = new WeakSet<HTMLElement>()

export function registerSection(
  type: string,
  init: SectionInit,
  destroy: SectionDestroy
): void {
  registry.set(type, { init, destroy })
}

function initSectionInContainer(container: HTMLElement): void {
  if (initializedSections.has(container)) return
  const type = container.dataset.sectionType
  if (!type) return
  const handlers = registry.get(type)
  if (!handlers) return
  handlers.init(container)
  initializedSections.add(container)
}

function destroySectionInContainer(container: HTMLElement): void {
  initializedSections.delete(container)
  const type = container.dataset.sectionType
  if (!type) return
  const handlers = registry.get(type)
  if (handlers) handlers.destroy(container)
}

let sectionMutationObserverStarted = false

function watchForNewSections(): void {
  if (sectionMutationObserverStarted || !document.body) return
  sectionMutationObserverStarted = true

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue
        if (node.hasAttribute('data-section-type')) {
          initSectionInContainer(node)
        }
        node.querySelectorAll<HTMLElement>('[data-section-type]').forEach((el) => {
          initSectionInContainer(el)
        })
      }
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

export function bootSections(): void {
  document.querySelectorAll<HTMLElement>('[data-section-type]').forEach((el) => {
    initSectionInContainer(el)
  })
  watchForNewSections()
}

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
