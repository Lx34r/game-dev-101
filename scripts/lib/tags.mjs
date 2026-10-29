const CJK_CHAR = /[\u3400-\u9fff]/
const CLOUD_COLORS = ['#a3e635', '#22d3ee', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#4ade80', '#60a5fa']

function countMatches(text, pattern) {
  if (!text) return 0
  const regex = new RegExp(pattern, 'gi')
  let count = 0
  while (regex.exec(text) !== null) {
    count += 1
    if (count > 200) break
  }
  return count
}

function headingsOf(body) {
  return body
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s/.test(line))
    .join('\n')
}

function stripCode(body) {
  return body.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ')
}

export function scoreArticleTags({ title, body, moduleTag, rules, maxPerArticle = 6 }) {
  const headingText = headingsOf(body)
  const prose = stripCode(body)
  const scored = []

  for (const rule of rules) {
    const patterns = rule.patterns || []
    let score = 0
    for (const pattern of patterns) {
      score += countMatches(title, pattern) * 5
      score += countMatches(headingText, pattern) * 2
      score += Math.min(countMatches(prose, pattern), 30)
    }
    if (score > 0) scored.push({ ...rule, score })
  }

  scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'zh-Hans-CN'))
  const keywordIds = scored.slice(0, Math.max(0, maxPerArticle - 1)).map((tag) => tag.id)
  return moduleTag ? [moduleTag.id, ...keywordIds] : keywordIds
}

export function textWidth(label, size) {
  let width = 0
  for (const char of label) {
    if (CJK_CHAR.test(char)) width += size
    else if (char === ' ') width += size * 0.3
    else width += size * 0.58
  }
  return width
}

function overlaps(a, b, padding = 10) {
  return !(
    a.x + a.w / 2 + padding < b.x - b.w / 2 ||
    a.x - a.w / 2 - padding > b.x + b.w / 2 ||
    a.y + a.h / 2 + padding < b.y - b.h / 2 ||
    a.y - a.h / 2 - padding > b.y + b.h / 2
  )
}

export function layoutCloud(tags, { width = 1000, height = 520 } = {}) {
  if (tags.length === 0) return []
  const counts = tags.map((tag) => tag.count)
  const min = Math.min(...counts)
  const max = Math.max(...counts)
  const placed = []
  const cx = width / 2
  const cy = height / 2

  tags.forEach((tag, index) => {
    const ratio = max === min ? 1 : (tag.count - min) / (max - min)
    const size = Math.round(15 + Math.sqrt(ratio) * 49)
    const w = textWidth(tag.label, size) + 14
    const h = size * 1.22
    let found = null

    for (let step = 0; step < 3200; step += 1) {
      const angle = step * 0.24
      const radius = 3.4 * angle
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius * 0.62
      if (x - w / 2 < 8 || x + w / 2 > width - 8 || y - h / 2 < 8 || y + h / 2 > height - 8) continue
      const candidate = { x, y, w, h }
      if (placed.some((other) => overlaps(candidate, other))) continue
      found = candidate
      break
    }

    if (found) {
      placed.push(found)
      tag.x = Math.round(found.x)
      tag.y = Math.round(found.y)
      tag.size = size
      tag.rotation = 0
      tag.color = CLOUD_COLORS[index % CLOUD_COLORS.length]
      tag.inCloud = true
    } else {
      tag.inCloud = false
    }
  })

  return tags
}

export function buildTagStats({ articles, rules }) {
  const moduleTags = rules.moduleTags || {}
  const tagMap = new Map()

  for (const tag of Object.values(moduleTags)) {
    tagMap.set(tag.id, { id: tag.id, label: tag.label, kind: 'module', count: 0, articles: [] })
  }
  for (const rule of rules.rules) {
    tagMap.set(rule.id, { id: rule.id, label: rule.label, kind: 'keyword', count: 0, articles: [] })
  }

  const articleIndex = articles.map((article) => {
    for (const tagId of article.tags) {
      const tag = tagMap.get(tagId)
      if (!tag) continue
      tag.count += 1
      tag.articles.push({
        title: article.title,
        link: article.link,
        module: article.module,
        source: article.source,
        sourceName: article.sourceName
      })
    }
    return {
      title: article.title,
      link: article.link,
      module: article.module,
      source: article.source,
      sourceName: article.sourceName,
      tags: article.tags
    }
  })

  const tags = [...tagMap.values()]
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-Hans-CN'))

  const cloudTags = tags.filter((tag) => tag.kind === 'keyword' && tag.count >= 2).slice(0, 64)
  layoutCloud(cloudTags)

  for (const tag of tags) {
    if (!cloudTags.includes(tag)) tag.inCloud = false
  }

  return {
    articleCount: articles.length,
    tagCount: tags.length,
    keywordCount: tags.filter((tag) => tag.kind === 'keyword').length,
    cloud: cloudTags.filter((tag) => tag.inCloud).map((tag) => ({
      id: tag.id,
      label: tag.label,
      count: tag.count,
      x: tag.x,
      y: tag.y,
      size: tag.size,
      color: tag.color
    })),
    tags: tags.map((tag) => ({
      id: tag.id,
      label: tag.label,
      kind: tag.kind,
      count: tag.count,
      inCloud: Boolean(tag.inCloud)
    })),
    articles: articleIndex
  }
}
