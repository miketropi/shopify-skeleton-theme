import { registerSection } from './section-registry'

function initArticle(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLElement>('[data-copy-url]')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-copy-url')
        if (!url) return

        void navigator.clipboard.writeText(url).then(() => {
          const svg = btn.querySelector('svg')
          if (!svg) return

          const original = svg.innerHTML
          svg.innerHTML =
            '<polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'

          setTimeout(() => {
            svg.innerHTML = original
          }, 1500)
        })
      })
    })
}

function destroyArticle(_container: HTMLElement): void {
  // click listeners are garbage-collected when section is removed
}

export function registerMainArticleSection(): void {
  registerSection('main-article', initArticle, destroyArticle)
}
