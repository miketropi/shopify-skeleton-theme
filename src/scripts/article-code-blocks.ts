/** Map common short class names on <code> to normalized `language-*` ids. */
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

/** Normalize `language-*` on `<code>` for consistent labeling (RTE output). */
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
  for (const c of [...code.classList]) {
    if (/^language-/i.test(c)) code.classList.remove(c)
  }
  code.classList.add(`language-${canonical}`)
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
 * Prepares `<pre><code class="language-...">` blocks: normalizes language classes
 * and sets `data-code-lang` on `<pre>` for the article label chip.
 */
export function initArticleCodeBlocks(body: HTMLElement): void {
  body.querySelectorAll<HTMLElement>('pre > code').forEach((code) => {
    if (code.parentElement?.tagName !== 'PRE') return
    if (code.dataset.articleCodeInit === 'yes') return

    code.classList.remove('hljs')

    const canonical = normalizeLanguageClass(code)
    const pre = code.parentElement as HTMLPreElement

    if (canonical) {
      pre.dataset.codeLang = displayLabelFor(canonical)
    } else {
      delete pre.dataset.codeLang
    } 

    code.dataset.articleCodeInit = 'yes'
  })
}
