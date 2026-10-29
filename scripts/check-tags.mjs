import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { textWidth } from './lib/tags.mjs'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const DOCS = path.join(ROOT, 'docs')
const TAG_INDEX = path.join(DOCS, 'public', 'data', 'tag-index.json')
const problems = []

if (!fs.existsSync(TAG_INDEX)) {
  console.error('tag index missing; run npm run sync')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(TAG_INDEX, 'utf8'))
const catalog = new Map(data.tags.map((tag) => [tag.id, tag]))

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.vitepress' || entry.name === 'public') continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(abs, out)
    else if (entry.name.endsWith('.md')) out.push(abs)
  }
  return out
}

const taggedPages = []
for (const file of walk(DOCS)) {
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  const text = fs.readFileSync(file, 'utf8')
  if (!/^source:\s*"/m.test(text)) continue
  const match = text.match(/^tags:\s*(\[[^\]]*\])$/m)
  if (!match) {
    problems.push(`${rel}: missing tags frontmatter`)
    continue
  }
  let tags
  try {
    tags = JSON.parse(match[1])
  } catch {
    problems.push(`${rel}: tags is not valid JSON array`)
    continue
  }
  if (!Array.isArray(tags) || tags.length === 0) problems.push(`${rel}: empty tags`)
  if (tags.length > 7) problems.push(`${rel}: too many tags (${tags.length})`)
  for (const id of tags) {
    if (!catalog.has(id)) problems.push(`${rel}: unknown tag ${id}`)
  }
  taggedPages.push({ rel, tags })
}

if (taggedPages.length !== data.articleCount) {
  problems.push(`tagged pages ${taggedPages.length} != articleCount ${data.articleCount}`)
}

for (const tag of data.tags) {
  const actual = taggedPages.filter((page) => page.tags.includes(tag.id)).length
  if (actual !== tag.count) problems.push(`tag ${tag.id}: count ${tag.count} != actual ${actual}`)
}

for (let i = 0; i < data.cloud.length; i += 1) {
  const word = data.cloud[i]
  if (word.x - 10 < 0 || word.x + 10 > 1000 || word.y - 10 < 0 || word.y + 10 > 520) {
    problems.push(`cloud ${word.id}: out of bounds`)
  }
  for (let j = i + 1; j < data.cloud.length; j += 1) {
    const other = data.cloud[j]
    const a = { x: word.x, y: word.y, w: textWidth(word.label, word.size) + 14, h: word.size * 1.22 }
    const b = { x: other.x, y: other.y, w: textWidth(other.label, other.size) + 14, h: other.size * 1.22 }
    const overlap = !(
      a.x + a.w / 2 + 8 < b.x - b.w / 2 ||
      a.x - a.w / 2 - 8 > b.x + b.w / 2 ||
      a.y + a.h / 2 + 8 < b.y - b.h / 2 ||
      a.y - a.h / 2 - 8 > b.y + b.h / 2
    )
    if (overlap) problems.push(`cloud overlap: ${word.id} / ${other.id}`)
  }
}

for (const file of ['tags/index.md', 'sources/index.md']) {
  if (!fs.existsSync(path.join(DOCS, file))) problems.push(`${file}: missing generated page`)
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem)
  console.error(`\n${problems.length} tag problem(s)`)
  process.exitCode = 1
} else {
  console.log(`tag check passed: ${taggedPages.length} tagged pages, ${data.tagCount} tags, ${data.cloud.length} cloud words`)
}
