import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { scoreArticleTags, buildTagStats } from './lib/tags.mjs'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const ASSETS = path.join(ROOT, 'assets')
const DOCS = path.join(ROOT, 'docs')
const CACHE = path.join(ROOT, '.cache', 'raw')
const REPORTS = path.join(ROOT, 'reports')
const PUBLIC_IMAGES = path.join(DOCS, 'public', 'images')
const PUBLIC_DATA = path.join(DOCS, 'public', 'data')
const DATA_DIR = path.join(DOCS, '.vitepress', 'data')
const MODULES_DATA = path.join(DATA_DIR, 'modules.json')
const SIDEBAR_DATA = path.join(DATA_DIR, 'sidebar.json')
const TAGS_DATA = path.join(DATA_DIR, 'tags.json')
const SITE_DATA = path.join(DATA_DIR, 'site.json')

const SOURCE_CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources.json'), 'utf8'))
const TAG_RULES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'tag-rules.json'), 'utf8'))
const REFRESH = process.argv.includes('--refresh')
const CONCURRENCY = 8

const MODULES = [
  { dir: 'Design', emoji: '🎮', label: '游戏设计' },
  { dir: 'Tech', emoji: '🖥️', label: '技术实现' },
  { dir: 'Case_Studies', emoji: '📖', label: '案例研究' },
  { dir: 'Dev_Guides', emoji: '🛠️', label: '开发指南' },
  { dir: 'Art', emoji: '🎨', label: '美术' },
  { dir: 'Audio', emoji: '🎵', label: '音频' },
  { dir: 'Unity_Standards', emoji: '📋', label: '规范标准' },
  { dir: 'Guides', emoji: '🚀', label: '发行指南' },
  { dir: 'Research', emoji: '🧪', label: '研究' },
  { dir: 'Tools', emoji: '🧰', label: '工具' }
]

const ALIASES = {
  'index.md': 'overview.md',
  'Art/Tech/Mobile_Optimization_Guide.md': 'Tech/Performance/Mobile_Optimization_Complete.md',
  'Tech/Mobile_Optimization_Guide.md': 'Tech/Performance/Mobile_Optimization_Complete.md',
  'Tech/Architecture/Unified_Decision_System.md': 'Tech/Architecture/Decision_System.md',
  'Tech/Architecture/ECS_Theory_And_Practice.md': 'Tech/Architecture/ECS_Complete_Guide.md',
  'Dev_Guides/Technical_Implementation/ECS_Performance_Optimization.md': 'Tech/Architecture/ECS_Complete_Guide.md',
  'Dev_Guides/Technical_Implementation/Procedural_Generation_WFC.md': 'Tech/Algorithms/Procedural_Generation_Complete.md',
  'Design/Content/Level_Design_Theory.md': 'Design/Content/Level_Design_Guide.md',
  'Dev_Guides/Collaboration/Git_Commit_Standards.md': 'Guides/Collaboration/Git_Complete_Guide.md',
  'Dev_Guides/Publishing/Steam_Strategy.md': 'Guides/Publishing/Steam_Complete_Guide.md',
  'Dev_Guides/Publishing/Steam_Unity_Quality_Standards.md': 'Dev_Guides/Publishing/Steam_Unity_Functionality_Floor_Ceiling_KB.md'
}

const FOLDER_LABELS = {
  'Art/Tech_Art': '技术美术',
  'Art/UI_UX': '界面设计',
  'Art/VFX': '视觉特效',
  'Case_Studies/Coop': '合作游戏',
  'Case_Studies/Failure': '失败复盘',
  'Case_Studies/Hybrid': '混合类型',
  'Case_Studies/Magic_System': '魔法系统',
  'Case_Studies/Roguelike': '肉鸽',
  'Case_Studies/Sandbox': '沙盒',
  'Case_Studies/Survivors': '幸存者',
  'Case_Studies/Tower_Defense': '塔防',
  'Design/Analytics': '数据分析',
  'Design/CaseStudies': '案例研究',
  'Design/Content': '内容设计',
  'Design/LiveOps': '长线运营',
  'Design/Mechanics': '核心机制',
  'Design/Narrative': '叙事设计',
  'Design/Numerical': '数值设计',
  'Design/Philosophy_And_Systems': '设计哲学',
  'Design/Product_Strategy': '产品策略',
  'Design/Production': '制作管理',
  'Design/Psychology': '玩家心理',
  'Design/Systems': '系统设计',
  'Design/UX': '用户体验',
  'Dev_Guides/Art_Pipeline': '美术管线',
  'Dev_Guides/Collaboration': '协作规范',
  'Dev_Guides/Community': '社区运营',
  'Dev_Guides/Debugging': '调试',
  'Dev_Guides/Publishing': '发行',
  'Dev_Guides/Technical_Implementation': '技术实现',
  'Dev_Guides/Testing': '测试',
  'Dev_Guides/Tools': '工具链',
  'Guides/Collaboration': '协作',
  'Guides/Publishing': '发行',
  'Tech/Algorithms': '算法',
  'Tech/Architecture': '架构',
  'Tech/Code_Snippets': '代码片段',
  'Tech/Graphics': '图形',
  'Tech/Math': '数学',
  'Tech/Mechanics': '玩法机制',
  'Tech/Optimization': '优化',
  'Tech/Performance': '性能'
}

const LOCAL_IMAGES = {
  'https://media.geeksforgeeks.org/wp-content/uploads/20230623123101/Stack-vs-Heap-Memory-Allocation.png':
    '/images/stack-vs-heap-memory.svg'
}

const collator = new Intl.Collator('zh-Hans-CN')
const CJK = /[\u3400-\u9fff]/
const SOURCES = SOURCE_CONFIG.sources.filter((source) => source.enabled !== false).map((source) => ({
  ...source,
  origin: source.origin.replace(/\/+$/, ''),
  docsPath: source.docsPath.endsWith('/') ? source.docsPath : `${source.docsPath}/`,
  prefix: source.prefix == null ? `sources/${source.id}` : source.prefix.replace(/^\/+|\/+$/g, '')
}))

for (const source of SOURCES) {
  if (source.prefix) {
    TAG_RULES.moduleTags[`source:${source.id}`] = {
      id: `source-${source.id}`,
      label: source.name
    }
  }
}

let activeSource = SOURCES[0]

const report = {
  generatedAt: new Date().toISOString(),
  sources: [],
  pages: 0,
  tags: 0,
  brokenLinks: [],
  remappedLinks: [],
  degradedLinks: [],
  images: [],
  skippedTargets: []
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function setActive(source) {
  activeSource = source
}

function siteRelFor(source, rel) {
  return source.prefix ? `${source.prefix}/${rel}` : rel
}

function siteRel(rel) {
  return siteRelFor(activeSource, rel)
}

function sourceHost(source = activeSource) {
  return new URL(source.origin).hostname
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeRel(rel, applyAlias = true) {
  let next = safeDecode(rel).replace(/\\/g, '/').replace(/^\/+/, '')
  if (next === 'index.md') next = 'overview.md'
  if (activeSource.id === 'wanyouxi') {
    if (next.startsWith('Research/Roguelike')) next = 'Research/Roguelike强化系统深度分析报告.md'
    if (applyAlias) next = ALIASES[next] || next
  }
  return next
}

function resolveRel(target, fromRel, applyAlias = true) {
  let raw = target.trim()
  if (!raw || raw.startsWith('#')) return null
  if (/^(mailto:|tel:|javascript:|data:)/i.test(raw)) return null
  raw = raw.replace(/^<|>$/g, '')

  const docsRoot = activeSource.docsPath.replace(/\/$/, '')

  if (/^https?:/i.test(raw)) {
    let url
    try {
      url = new URL(raw)
    } catch {
      return null
    }
    if (url.hostname !== sourceHost()) return null
    if (url.pathname === docsRoot || url.pathname === `${docsRoot}/` || url.pathname === `${docsRoot}.md`) {
      return 'overview.md'
    }
    if (!url.pathname.startsWith(activeSource.docsPath)) return null
    let rel = safeDecode(url.pathname.slice(activeSource.docsPath.length))
    if (!rel) return null
    if (!/\.[a-zA-Z0-9]+$/.test(rel)) rel += '.md'
    if (!rel.endsWith('.md')) return null
    return normalizeRel(rel, applyAlias)
  }

  if (raw.startsWith('/')) {
    if (!raw.startsWith(activeSource.docsPath)) return null
    let rel = safeDecode(raw.slice(activeSource.docsPath.length).split(/[?#]/)[0])
    if (!/\.[a-zA-Z0-9]+$/.test(rel)) rel += '.md'
    if (!rel.endsWith('.md')) return null
    return normalizeRel(rel, applyAlias)
  }

  const clean = raw.split('#')[0].split('?')[0]
  if (!clean) return null
  let rel = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), safeDecode(clean)))
  if (rel.startsWith('..')) return null
  if (!/\.[a-zA-Z0-9]+$/.test(rel)) rel += '.md'
  if (!rel.endsWith('.md')) return null
  return normalizeRel(rel, applyAlias)
}

function relLink(fromSiteRel, toSiteRel) {
  const target = path.posix.relative(path.posix.dirname(fromSiteRel), toSiteRel)
  return target || path.posix.basename(toSiteRel)
}

function extractLinks(markdown) {
  const links = []
  let inFence = false
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    for (const match of line.matchAll(/(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      links.push(match[2])
    }
  }
  return links
}

async function fetchText(url) {
  let lastError = ''
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 gamedev-atlas-sync' },
        signal: AbortSignal.timeout(30000)
      })
      const text = await response.text()
      if (response.status === 404 || text.includes('<title>Page Not Found</title>')) {
        return { ok: false, status: 404 }
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (text.trimStart().startsWith('# Page Not Found')) return { ok: false, status: 404 }
      return { ok: true, text }
    } catch (error) {
      lastError = String(error)
      await sleep(400 * (attempt + 1))
    }
  }
  return { ok: false, error: lastError }
}

function cachePath(source, rel) {
  return path.join(CACHE, source.id, rel)
}

function readCache(source, rel) {
  const file = cachePath(source, rel)
  if (!REFRESH && fs.existsSync(file)) return fs.readFileSync(file, 'utf8')
  if (!REFRESH && !source.prefix) {
    const legacy = path.join(CACHE, rel)
    if (fs.existsSync(legacy)) return fs.readFileSync(legacy, 'utf8')
  }
  return null
}

async function loadPage(source, rel) {
  const cached = readCache(source, rel)
  if (cached) return { ok: true, text: cached, cached: true }
  const fetchRel = rel === 'overview.md' ? 'index.md' : rel
  const url = new URL(`${source.docsPath}${fetchRel}`, source.origin).href
  const result = await fetchText(url)
  if (result.ok) {
    const file = cachePath(source, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, result.text)
  }
  return result
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

async function discover(source) {
  setActive(source)
  const seeds = new Set()
  if (source.llms) {
    const llms = await fetchText(source.llms)
    if (llms.ok) {
      const prefix = `${source.origin}${source.docsPath}`
      for (const match of llms.text.matchAll(new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^)\\s]+?\\.md`, 'g'))) {
        seeds.add(normalizeRel(match[0].replace(prefix, ''), false))
      }
    }
  }
  seeds.add('NAVIGATION.md')
  seeds.add('overview.md')

  const pages = new Map()
  const seen = new Set()
  const failed = new Map()
  let frontier = [...seeds]

  while (frontier.length > 0) {
    const batch = frontier.filter((rel) => !seen.has(rel))
    for (const rel of batch) seen.add(rel)
    const results = await mapLimit(batch, CONCURRENCY, async (rel) => {
      setActive(source)
      return { rel, result: await loadPage(source, rel) }
    })
    const next = []
    for (const { rel, result } of results) {
      if (!result.ok) {
        failed.set(rel, result)
        continue
      }
      pages.set(rel, result.text)
      setActive(source)
      for (const target of extractLinks(result.text)) {
        const targetRel = resolveRel(target, rel)
        if (!targetRel) continue
        if (!seen.has(targetRel) && !pages.has(targetRel)) next.push(targetRel)
      }
    }
    frontier = [...new Set(next)]
  }

  return { pages, failed }
}

function stripOriginChrome(markdown) {
  let text = markdown.replace(/^\uFEFF/, '')
  text = text.replace(
    /^>\s*## Documentation Index\s*\r?\n>\s*Fetch the complete documentation index at:[^\n]*\r?\n>\s*Use this file to discover all available pages before exploring further\.\s*\r?\n+/m,
    ''
  )
  text = text.replace(
    /\r?\nThis documentation is built and hosted on \[Mintlify\]\([^)]*\)[^\n]*\.?\s*$/m,
    '\n'
  )
  return text
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim().replace(/\\"/g, '"') : null
}

function extractSummary(markdown) {
  const match = markdown.match(/^>\s*\*\*摘要\*\*[：:]\s*(.+)$/m)
  return match ? match[1].trim() : null
}

function isMathSpan(content) {
  if (/\\/.test(content)) return true
  if (CJK.test(content)) return false
  if (/[\^_=<>|+*]/.test(content)) return true
  if (/^\s*[A-Za-z]\s*$/.test(content)) return true
  if (/^\s*[-+]?\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*$/.test(content)) return true
  if (/~/.test(content) && /^\s*[\d.,]+\s*~/.test(content)) return false
  if (/^\s*[\d.,]+\s*$/.test(content)) return false
  return true
}

function sanitizeDollars(line) {
  let out = ''
  let i = 0
  while (i < line.length) {
    const char = line[i]
    if (char !== '$' || line[i - 1] === '\\') {
      out += char
      i += 1
      continue
    }
    if (line[i + 1] === '$') {
      out += '$$'
      i += 2
      continue
    }
    const end = line.indexOf('$', i + 1)
    if (end === -1) {
      out += char
      i += 1
      continue
    }
    const content = line.slice(i + 1, end)
    if (content.length > 80) {
      out += char
      i += 1
      continue
    }
    if (isMathSpan(content)) {
      out += line.slice(i, end + 1)
    } else {
      out += `\\$${content}\\$`
    }
    i = end + 1
  }
  return out
}

async function downloadImage(url) {
  const normalized = url.replace(/\\&/g, '&')
  const pathname = new URL(normalized).pathname
  const ext = (path.extname(pathname) || '.png').toLowerCase()
  const hash = crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 12)
  const filename = `${hash}${ext}`
  const file = path.join(PUBLIC_IMAGES, filename)
  if (fs.existsSync(file)) return { ok: true, filename }
  const response = await fetch(normalized, {
    headers: { 'user-agent': 'Mozilla/5.0 gamedev-atlas-sync' },
    signal: AbortSignal.timeout(30000)
  })
  if (!response.ok) return { ok: false, status: response.status }
  fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()))
  return { ok: true, filename }
}

function moduleTagFor(source, rel) {
  if (source.prefix) {
    return TAG_RULES.moduleTags[`source:${source.id}`] || { id: `source-${source.id}`, label: source.name }
  }
  const first = rel.split('/')[0]
  return TAG_RULES.moduleTags[first] || TAG_RULES.moduleTags.site
}

function canonicalUrl(source, rel) {
  const fetchRel = rel === 'overview.md' ? 'index.md' : rel
  return new URL(`${source.docsPath}${fetchRel}`, source.origin).href
}

async function normalizePage(rel, raw, pageSet, outputRel) {
  let markdown = stripOriginChrome(raw)
  const title = extractTitle(markdown) || path.posix.basename(rel, '.md')
  const summary = extractSummary(markdown)
  const source = activeSource

  const lines = markdown.split(/\r?\n/)
  const output = []
  let inFence = false
  let inBlockMath = false
  const imageTasks = []
  const degraded = []

  for (let line of lines) {
    const fence = line.match(/^\s*```([a-zA-Z0-9+#_-]*)/)
    if (fence) {
      inFence = !inFence
      if (fence[1] === 'mermaid') line = line.replace(/^(\s*)```mermaid\s.*$/, '$1```mermaid')
      if (fence[1] === 'excel') line = line.replace('```excel', '```text')
      if (fence[1] === 'gitignore') line = line.replace('```gitignore', '```text')
      if (fence[1] === 'gitattributes') line = line.replace('```gitattributes', '```text')
      if (fence[1] === 'shader') line = line.replace('```shader', '```hlsl')
      output.push(line)
      continue
    }
    if (inFence) {
      output.push(line)
      continue
    }
    if (line.trim() === '$$') {
      inBlockMath = !inBlockMath
      output.push(line)
      continue
    }
    if (inBlockMath) {
      output.push(line)
      continue
    }

    line = line.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (match, bang, alt, rawTarget) => {
      const target = rawTarget.replace(/\\&/g, '&')

      if (bang === '!') {
        if (target === '图片链接' || target === '图片' || !/^https?:/i.test(target)) {
          return '（原站图片缺失）'
        }
        if (LOCAL_IMAGES[target]) {
          report.images.push({ from: outputRel, url: target, file: path.posix.basename(LOCAL_IMAGES[target]) })
          return `![${alt}](${LOCAL_IMAGES[target]})`
        }
        if (!target.startsWith(source.origin)) return match
        imageTasks.push(downloadImage(target).then((result) => {
          if (result.ok) {
            report.images.push({ from: outputRel, url: target, file: result.filename })
            return { match, replacement: `![${alt}](/images/${result.filename})` }
          }
          report.images.push({ from: outputRel, url: target, error: result.status || 'download failed' })
          return { match, replacement: match }
        }))
        return match
      }

      if (!target.startsWith(source.origin) && /^https?:/i.test(target)) return match

      const fragment = target.includes('#') ? target.slice(target.indexOf('#')) : ''
      const resolved = resolveRel(target, rel)
      if (!resolved) {
        if (target.startsWith(source.origin) || target.startsWith(source.docsPath) || /\.html?$/i.test(target.split('#')[0])) {
          degraded.push({ from: outputRel, target })
          return alt || match
        }
        return match
      }
      const resolvedSite = siteRelFor(source, resolved)
      if (!pageSet.has(resolvedSite)) {
        degraded.push({ from: outputRel, target, resolved: resolvedSite })
        return alt || match
      }
      const unmapped = resolveRel(target, rel, false)
      if (unmapped && resolved !== unmapped) {
        report.remappedLinks.push({ from: outputRel, target, resolved: resolvedSite })
      }
      return `[${alt}](${relLink(outputRel, resolvedSite)}${fragment})`
    })

    line = sanitizeDollars(line)
    output.push(line)
  }

  const imageResults = await Promise.all(imageTasks)
  let body = output.join('\n')
  for (const item of imageResults) {
    if (item.replacement !== item.match) {
      body = body.replace(item.match, () => item.replacement)
    }
  }

  for (const item of degraded) report.degradedLinks.push(item)

  const moduleTag = moduleTagFor(source, rel)
  const tags = scoreArticleTags({
    title,
    body,
    moduleTag,
    rules: TAG_RULES.rules,
    maxPerArticle: TAG_RULES.maxPerArticle || 6
  })

  const frontmatter = ['---', `title: ${JSON.stringify(title)}`]
  if (summary) frontmatter.push(`description: ${JSON.stringify(summary)}`)
  frontmatter.push(`tags: ${JSON.stringify(tags)}`)
  frontmatter.push(`source: ${JSON.stringify(source.id)}`)
  frontmatter.push(`sourceName: ${JSON.stringify(source.name)}`)
  frontmatter.push(`sourceUrl: ${JSON.stringify(canonicalUrl(source, rel))}`)
  frontmatter.push('outline: [2, 3]', '---', '', '')

  let content = body.trimStart()
  if (/^#\s+/m.test(content)) {
    content = content.replace(/^(#\s+.+)$/m, (heading) => `${heading}\n\n<ArticleTags />`)
  } else {
    content = `<ArticleTags />\n\n${content}`
  }

  return {
    rel: outputRel,
    title,
    summary,
    module: moduleTag.label,
    source: source.id,
    sourceName: source.name,
    tags,
    body: frontmatter.join('\n') + content
  }
}

function writePage(rel, content) {
  const file = path.join(DOCS, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`)
}

function readPageTitle(rel) {
  const file = path.join(DOCS, rel)
  if (!fs.existsSync(file)) return path.posix.basename(rel, '.md')
  const text = fs.readFileSync(file, 'utf8').slice(0, 1200)
  const match = text.match(/^title:\s*"(.*)"$/m) || text.match(/^#\s+(.+)$/m)
  return match ? match[1].replace(/\\"/g, '"') : path.posix.basename(rel, '.md')
}

function listModuleFiles(dir) {
  const out = []
  const walk = (relDir) => {
    const abs = path.join(DOCS, relDir)
    if (!fs.existsSync(abs)) return
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.posix.join(relDir, entry.name)
      if (entry.isDirectory()) walk(rel)
      else if (entry.name.endsWith('.md') && entry.name !== 'index.md') out.push(rel)
    }
  }
  walk(dir)
  return out
}

function generateModulePage(module) {
  const files = listModuleFiles(module.dir)
  const rootFiles = files.filter((rel) => path.posix.dirname(rel) === module.dir)
  const groups = new Map()
  for (const rel of files) {
    const dir = path.posix.dirname(rel)
    if (dir === module.dir) continue
    const label = FOLDER_LABELS[dir] || path.posix.basename(dir)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(rel)
  }

  const lines = [
    '---',
    `title: ${JSON.stringify(module.label)}`,
    `description: ${JSON.stringify(`${module.label}模块，共 ${files.length} 篇文档。`)}`,
    '---',
    '',
    `# ${module.emoji} ${module.label}`,
    '',
    `共 **${files.length}** 篇文档。`,
    ''
  ]

  const renderList = (rels) => {
    const sorted = [...rels].sort((a, b) => collator.compare(readPageTitle(a), readPageTitle(b)))
    return sorted.map((rel) => `- [${readPageTitle(rel)}](./${path.posix.relative(module.dir, rel)})`)
  }

  if (rootFiles.length > 0) lines.push('## 综合', '', ...renderList(rootFiles), '')
  for (const [label, rels] of [...groups.entries()].sort((a, b) => collator.compare(a[0], b[0]))) {
    lines.push(`## ${label}`, '', ...renderList(rels), '')
  }

  writePage(`${module.dir}/index.md`, lines.join('\n'))
  return { dir: module.dir, label: module.label, emoji: module.emoji, count: files.length, link: `/${module.dir}/` }
}

function generateSourcePage(source, records) {
  const files = records.filter((record) => record.rel.startsWith(`${source.prefix}/`))
  const lines = [
    '---',
    `title: ${JSON.stringify(source.name)}`,
    `description: ${JSON.stringify(`${source.name}来源，共 ${files.length} 篇文档。`)}`,
    'sidebar: false',
    '---',
    '',
    `# ${source.name}`,
    '',
    `共 **${files.length}** 篇文档，来自 [${source.name}](${source.url})。`,
    '',
    '## 文章',
    ''
  ]
  for (const file of files.sort((a, b) => collator.compare(a.title, b.title))) {
    lines.push(`- [${file.title}](./${path.posix.relative(`${source.prefix}`, file.rel)})`)
  }
  writePage(`${source.prefix}/index.md`, lines.join('\n'))
}

function generateSourcesPage(records, tagStats) {
  const tagById = new Map(tagStats.tags.map((tag) => [tag.id, tag]))
  const cards = SOURCES.map((source) => {
    const sourceRecords = records.filter((record) => record.source === source.id)
    const counts = new Map()
    for (const record of sourceRecords) {
      for (const id of record.tags) counts.set(id, (counts.get(id) || 0) + 1)
    }
    const topTags = [...counts.entries()]
      .map(([id, count]) => ({ id, count, label: tagById.get(id)?.label || id, kind: tagById.get(id)?.kind }))
      .filter((tag) => tag.kind === 'keyword')
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ id, label, count }) => ({ id, label, count }))
    return {
      id: source.id,
      name: source.name,
      url: source.url,
      pages: sourceRecords.length,
      lastSync: report.generatedAt.slice(0, 10),
      path: source.prefix ? `/${source.prefix}/` : '/Full_Index',
      topTags
    }
  })

  fs.writeFileSync(
    path.join(PUBLIC_DATA, 'sources-index.json'),
    `${JSON.stringify(
      {
        generatedAt: report.generatedAt,
        docs: records.length,
        tags: tagStats.tagCount,
        sources: cards
      },
      null,
      2
    )}\n`
  )

  writePage(
    'sources/index.md',
    [
      '---',
      'layout: page',
      'title: 内容来源',
      'description: 本站同步的文章来源与同步状态。',
      'sidebar: false',
      '---',
      '',
      '<SourcesPage />',
      ''
    ].join('\n')
  )
}

function generateTagsPage() {
  writePage(
    'tags/index.md',
    ['---', 'layout: page', 'title: 标签图谱', 'sidebar: false', '---', '', '<TagsPage />', ''].join('\n')
  )
}

function buildSidebar(sources) {
  const rootOrder = ['START_HERE.md', 'NAVIGATION.md', 'Full_Index.md']
  const rootItems = rootOrder
    .filter((rel) => fs.existsSync(path.join(DOCS, rel)))
    .map((rel) => ({ text: readPageTitle(rel), link: sidebarLink(rel) }))
  rootItems.push({ text: '标签图谱', link: '/tags/' })
  rootItems.push({ text: '内容来源', link: '/sources/' })

  const sidebar = {
    '/': [{ text: '开始', items: rootItems }]
  }
  for (const module of MODULES) {
    sidebar[`/${module.dir}/`] = buildModuleSidebar(module)
  }
  for (const source of sources) {
    if (!source.prefix) continue
    const files = listModuleFiles(source.prefix)
    sidebar[`/${source.prefix}/`] = [
      { text: '来源概览', link: `/${source.prefix}/` },
      { text: '文章', collapsed: false, items: sortedItems(files) }
    ]
  }
  return sidebar
}

function sidebarLink(rel) {
  return `/${rel.replace(/\.md$/, '')}`
}

function sortedItems(rels) {
  return [...rels]
    .sort((a, b) => collator.compare(readPageTitle(a), readPageTitle(b)))
    .map((rel) => ({ text: readPageTitle(rel), link: sidebarLink(rel) }))
}

function buildModuleSidebar(module) {
  const files = listModuleFiles(module.dir)
  const rootFiles = files.filter((rel) => path.posix.dirname(rel) === module.dir)
  const groups = new Map()
  for (const rel of files) {
    const dir = path.posix.dirname(rel)
    if (dir === module.dir) continue
    const label = FOLDER_LABELS[dir] || path.posix.basename(dir)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(rel)
  }

  const items = [{ text: '模块概览', link: `/${module.dir}/` }]
  if (rootFiles.length > 0) items.push({ text: '综合', collapsed: false, items: sortedItems(rootFiles) })
  for (const [label, rels] of [...groups.entries()].sort((a, b) => collator.compare(a[0], b[0]))) {
    items.push({ text: label, collapsed: true, items: sortedItems(rels) })
  }
  return items
}

async function main() {
  fs.mkdirSync(DOCS, { recursive: true })
  fs.mkdirSync(REPORTS, { recursive: true })
  fs.mkdirSync(CACHE, { recursive: true })
  fs.mkdirSync(PUBLIC_DATA, { recursive: true })
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.rmSync(PUBLIC_IMAGES, { recursive: true, force: true })
  fs.mkdirSync(PUBLIC_IMAGES, { recursive: true })
  if (fs.existsSync(ASSETS)) fs.cpSync(ASSETS, PUBLIC_IMAGES, { recursive: true })

  for (const entry of fs.readdirSync(DOCS)) {
    if (['.vitepress', 'public', 'index.md', 'notes'].includes(entry)) continue
    fs.rmSync(path.join(DOCS, entry), { recursive: true, force: true })
  }

  const discovered = []
  for (const source of SOURCES) {
    console.log(`discovering ${source.name}...`)
    const result = await discover(source)
    discovered.push({ source, ...result })
    console.log(`  ${source.name}: ${result.pages.size} pages, ${result.failed.size} failed targets`)
  }

  const pageSet = new Set()
  for (const item of discovered) {
    for (const rel of item.pages.keys()) pageSet.add(siteRelFor(item.source, rel))
  }

  const records = []
  let diagramCount = 0
  let count = 0
  for (const item of discovered) {
    setActive(item.source)
    for (const [rel, result] of item.failed) {
      report.skippedTargets.push({ source: item.source.id, rel, status: result.status || 404, error: result.error })
    }
    const entries = [...item.pages.entries()].sort(([a], [b]) => a.localeCompare(b))
    for (const [rel, raw] of entries) {
      const outputRel = siteRelFor(item.source, rel)
      const normalized = await normalizePage(rel, raw, pageSet, outputRel)
      writePage(outputRel, normalized.body)
      records.push({
        rel: outputRel,
        title: normalized.title,
        link: `/${outputRel.replace(/\.md$/, '')}`,
        module: normalized.module,
        source: normalized.source,
        sourceName: normalized.sourceName,
        tags: normalized.tags
      })
      diagramCount += (normalized.body.match(/^```mermaid$/gm) || []).length
      count += 1
      if (count % 20 === 0) console.log(`normalized ${count}`)
    }
    report.sources.push({
      id: item.source.id,
      name: item.source.name,
      pages: item.pages.size,
      failed: item.failed.size,
      url: item.source.url
    })
  }

  const modules = MODULES.map(generateModulePage)
  for (const source of SOURCES) {
    if (source.prefix) generateSourcePage(source, records)
  }
  generateTagsPage()

  const tagStats = buildTagStats({ articles: records, rules: TAG_RULES })
  generateSourcesPage(records, tagStats)
  fs.writeFileSync(path.join(PUBLIC_DATA, 'tag-index.json'), `${JSON.stringify(tagStats)}\n`)
  const catalog = Object.fromEntries(
    tagStats.tags.map((tag) => [tag.id, { label: tag.label, count: tag.count, kind: tag.kind }])
  )
  fs.writeFileSync(TAGS_DATA, `${JSON.stringify(catalog, null, 2)}\n`)
  fs.writeFileSync(MODULES_DATA, `${JSON.stringify(modules, null, 2)}\n`)
  fs.writeFileSync(
    SITE_DATA,
    `${JSON.stringify(
      {
        docs: records.length,
        modules: MODULES.length,
        tags: tagStats.keywordCount,
        sources: SOURCES.length,
        diagrams: diagramCount,
        generatedAt: report.generatedAt
      },
      null,
      2
    )}\n`
  )
  fs.writeFileSync(SIDEBAR_DATA, `${JSON.stringify(buildSidebar(SOURCES), null, 2)}\n`)

  report.pages = records.length
  report.tags = tagStats.tagCount
  report.brokenLinks = [...new Map(report.degradedLinks.map((item) => [`${item.from}|${item.target}`, item])).values()]
  report.remappedLinks = [...new Map(report.remappedLinks.map((item) => [`${item.from}|${item.target}`, item])).values()]
  fs.writeFileSync(path.join(REPORTS, 'mirror-report.json'), `${JSON.stringify(report, null, 2)}\n`)

  console.log(`wrote ${records.length} pages from ${SOURCES.length} source(s)`)
  console.log(`tags: ${tagStats.tagCount} total, ${tagStats.keywordCount} keyword, ${tagStats.cloud.length} in cloud`)
  console.log(`broken/orphan links: ${report.brokenLinks.length}`)
  console.log(`remapped links: ${report.remappedLinks.length}`)
  console.log(`images: ${report.images.filter((item) => item.file).length} downloaded, ${report.images.filter((item) => item.error).length} left remote`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
