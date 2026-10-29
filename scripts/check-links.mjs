import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const DOCS = path.join(ROOT, 'docs')
const DATA = path.join(DOCS, '.vitepress', 'data')

const problems = []

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.vitepress' || entry.name === 'public') continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(abs, out)
    else if (entry.name.endsWith('.md')) out.push(abs)
  }
  return out
}

function toDocRel(target) {
  let clean = target.split('#')[0].split('?')[0]
  if (!clean) return null
  try {
    clean = decodeURIComponent(clean)
  } catch {
    return null
  }
  if (clean.endsWith('/')) return `${clean.replace(/^\/+/, '')}index.md`
  if (!path.extname(clean)) return `${clean.replace(/^\/+/, '')}.md`
  return clean.replace(/^\/+/, '')
}

function checkMarkdown(file) {
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  let inFence = false
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      return
    }
    if (inFence) return
    for (const match of line.matchAll(/(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[2]
      if (/^(https?:|mailto:|tel:|data:|#)/i.test(target)) continue
      if (target.startsWith('/images/')) {
        const asset = path.join(DOCS, 'public', target.replace(/^\//, ''))
        if (!fs.existsSync(asset)) problems.push({ file: rel, line: index + 1, target, reason: 'missing asset' })
        continue
      }
      const docRel = toDocRel(target)
      if (!docRel) continue
      const resolved = target.startsWith('/')
        ? path.join(DOCS, docRel)
        : path.resolve(path.dirname(file), docRel)
      if (!fs.existsSync(resolved)) {
        problems.push({ file: rel, line: index + 1, target, reason: 'missing page' })
      }
    }
  })
}

function checkSidebar() {
  const file = path.join(DATA, 'sidebar.json')
  if (!fs.existsSync(file)) return
  const sidebar = JSON.parse(fs.readFileSync(file, 'utf8'))
  const walkItems = (items, group) => {
    for (const item of items) {
      if (item.items) walkItems(item.items, group)
      if (!item.link) continue
      const docRel = item.link.endsWith('/') ? `${item.link.slice(1)}index.md` : `${item.link.slice(1)}.md`
      if (!fs.existsSync(path.join(DOCS, docRel))) {
        problems.push({ file: 'sidebar.json', line: 0, target: item.link, reason: `missing page in ${group}` })
      }
    }
  }
  for (const [group, items] of Object.entries(sidebar)) walkItems(items, group)
}

function checkModules() {
  const file = path.join(DATA, 'modules.json')
  if (!fs.existsSync(file)) return
  for (const module of JSON.parse(fs.readFileSync(file, 'utf8'))) {
    if (!fs.existsSync(path.join(DOCS, module.dir, 'index.md'))) {
      problems.push({ file: 'modules.json', line: 0, target: module.link, reason: 'missing module index' })
    }
  }
}

for (const file of walk(DOCS)) checkMarkdown(file)
checkSidebar()
checkModules()

const pages = walk(DOCS).length
if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`${problem.file}:${problem.line} -> ${problem.target} (${problem.reason})`)
  }
  console.error(`\n${problems.length} broken internal link(s) across ${pages} pages`)
  process.exitCode = 1
} else {
  console.log(`link check passed: ${pages} pages, 0 broken internal links`)
}
