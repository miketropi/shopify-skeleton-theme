import { registerSection } from './section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerMainBlogSection(): void {
  registerSection(
    'main-blog',
    (container) => {
      const p = import('./main-blog.runtime').then((m) => {
        m.initBlog(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./main-blog.runtime')
      m.destroyBlog(container)
      pending.delete(container)
    },
  )
}
