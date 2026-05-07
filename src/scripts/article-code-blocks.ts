import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import scss from 'highlight.js/lib/languages/scss'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

/** Map common short class names to hljs registration ids. */
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  py: 'python',
  python: 'python',
  rust: 'rust',
  go: 'go',
  golang: 'go',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  html: 'xml',
  xml: 'xml',
  liquid: 'xml',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  sql: 'sql',
  json: 'json',
}

const DISPLAY_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
  bash: 'Bash',
  yaml: 'YAML',
  markdown: 'Markdown',
  xml: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sql: 'SQL',
  json: 'JSON',
}

function registerHljs(): void {
  hljs.registerLanguage('javascript', javascript)
  hljs.registerLanguage('typescript', typescript)
  hljs.registerLanguage('json', json)
  hljs.registerLanguage('css', css)
  hljs.registerLanguage('scss', scss)
  hljs.registerLanguage('bash', bash)
  hljs.registerLanguage('python', python)
  hljs.registerLanguage('sql', sql)
  hljs.registerLanguage('yaml', yaml)
  hljs.registerLanguage('xml', xml)
  hljs.registerLanguage('markdown', markdown)
  hljs.registerLanguage('rust', rust)
  hljs.registerLanguage('go', go)
}

let registered = false

function ensureRegistered(): void {
  if (registered) return
  registered = true
  registerHljs()
}

/** Normalize `language-*` on <code> so hljs can resolve grammars. */
function normalizeLanguageClass(code: HTMLElement): string {
  let raw = ''
  for (const c of code.classList) {
    const m = /^language-([\w#+.-]+)$/i.exec(c)
    if (!m) continue
    raw = m[1].toLowerCase()
    break
  }
  if (!raw) return ''

  const canonical = LANGUAGE_ALIASES[raw] ?? raw
  if (canonical !== raw || !hljs.getLanguage(canonical)) {
    for (const c of [...code.classList]) {
      if (/^language-/i.test(c)) code.classList.remove(c)
    }
    if (hljs.getLanguage(canonical)) {
      code.classList.add(`language-${canonical}`)
      return canonical
    }
    code.classList.add(`language-${raw}`)
    return raw
  }
  return canonical
}

function displayLabelFor(canonicalOrRaw: string): string {
  const lower = canonicalOrRaw.toLowerCase()
  if (DISPLAY_LABELS[lower]) return DISPLAY_LABELS[lower]
  return canonicalOrRaw
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

/**
 * Highlights `<pre><code class="language-...">` blocks in the article body.
 * Unknown `language-*` ids are still labeled; hljs may no-op or partially highlight.
 */
export function initArticleCodeBlocks(body: HTMLElement): void {
  ensureRegistered()

  body.querySelectorAll<HTMLElement>('pre > code').forEach((code) => {
    if (code.parentElement?.tagName !== 'PRE') return
    if (code.dataset.highlighted === 'yes') return

    const canonical = normalizeLanguageClass(code)
    const pre = code.parentElement as HTMLPreElement

    if (canonical) {
      pre.dataset.codeLang = displayLabelFor(canonical)
    } else {
      delete pre.dataset.codeLang
    }

    try {
      hljs.highlightElement(code)
    } catch {
      /* Unregistered or invalid grammar — keep raw text + optional label. */
    }
  })
}
