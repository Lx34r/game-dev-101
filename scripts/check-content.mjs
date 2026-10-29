import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const DOCS = path.join(ROOT, 'docs')
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

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/

for (const file of walk(DOCS)) {
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  if (rel === 'index.md') continue
  const text = fs.readFileSync(file, 'utf8')
  if (!text.startsWith('---\n') || !/^title:/m.test(text.slice(0, 500))) {
    problems.push(`${rel}: missing frontmatter title`)
  }
  if (text.includes('Documentation Index')) problems.push(`${rel}: leftover llms header`)
  if (text.includes('built and hosted on [Mintlify]')) problems.push(`${rel}: leftover Mintlify footer`)

  const content = text.replace(FRONTMATTER, '')
  if (content.includes('docs.wanyouxi.online/docs/')) {
    problems.push(`${rel}: absolute origin link remains`)
  }

  let inFence = false
  content.split(/\r?\n/).forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      return
    }
    if (inFence) return
    if (line.includes('图片链接')) problems.push(`${rel}:${index + 1}: placeholder image remains`)
    if (/\{\{/.test(line)) problems.push(`${rel}:${index + 1}: Vue interpolation outside code fence`)
    if (/<script\b/i.test(line)) problems.push(`${rel}:${index + 1}: raw script tag outside code fence`)
  })
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem)
  console.error(`\n${problems.length} content problem(s)`)
  process.exitCode = 1
} else {
  console.log(`content check passed: ${walk(DOCS).length} markdown files`)
}
