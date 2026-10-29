<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'

const data = ref(null)
const loading = ref(true)
const error = ref('')
const selected = ref('')
const query = ref('')
const sourceFilter = ref('')
const articleSection = ref(null)

const keywordTags = computed(() => data.value?.tags.filter((tag) => tag.kind === 'keyword') || [])
const moduleTags = computed(() => data.value?.tags.filter((tag) => tag.kind === 'module') || [])
const visibleTags = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return keywordTags.value.filter((tag) => !keyword || tag.label.toLowerCase().includes(keyword))
})
const selectedTag = computed(() => data.value?.tags.find((tag) => tag.id === selected.value) || null)
const sources = computed(() => {
  const map = new Map()
  for (const article of data.value?.articles || []) {
    const current = map.get(article.source) || { id: article.source, name: article.sourceName, count: 0 }
    current.count += 1
    map.set(article.source, current)
  }
  return [...map.values()]
})
const selectedArticles = computed(() => {
  if (!data.value || !selected.value) return []
  return data.value.articles.filter(
    (article) =>
      article.tags.includes(selected.value) &&
      (!sourceFilter.value || article.source === sourceFilter.value)
  )
})

function countForSize(tag) {
  const counts = keywordTags.value.map((item) => item.count)
  const min = Math.min(...counts)
  const max = Math.max(...counts)
  const ratio = max === min ? 1 : (tag.count - min) / (max - min)
  return `${Math.round(11 + Math.sqrt(ratio) * 7)}px`
}

function selectTag(id, updateHash = true, scroll = false) {
  if (!id || !data.value?.tags.some((tag) => tag.id === id)) return
  selected.value = id
  sourceFilter.value = ''
  if (updateHash) {
    history.replaceState(null, '', `#${id}`)
  }
  if (scroll) {
    nextTick(() => articleSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
}

function toggleSource(id) {
  sourceFilter.value = sourceFilter.value === id ? '' : id
}

function readHash() {
  const id = decodeURIComponent(window.location.hash.slice(1))
  if (id) selectTag(id, false)
}

onMounted(async () => {
  try {
    const response = await fetch(withBase('/data/tag-index.json'))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    data.value = await response.json()
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash && data.value.tags.some((tag) => tag.id === hash)) {
      selectTag(hash, false)
    } else {
      const preferred = ['unity', 'numerical', 'combat', 'performance', 'roguelike']
      const first =
        preferred.map((id) => data.value.tags.find((tag) => tag.id === id)).find(Boolean) ||
        data.value.tags.find((tag) => tag.kind === 'keyword')
      if (first) selectTag(first.id, false)
    }
    window.addEventListener('hashchange', readHash)
  } catch (caught) {
    error.value = String(caught)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => window.removeEventListener('hashchange', readHash))
</script>

<template>
  <div class="home tags-page">
    <div class="home-wrap">
      <header class="tags-header">
        <p class="tags-eyebrow"><span class="live-dot"></span> TAG ATLAS <span class="slash">/</span> 标签图谱</p>
        <h1>按标签找文档</h1>
        <p class="tags-lead">
          标签由文章标题、章节与正文自动提取。点击词云或标签即可筛选文章，也可以直接搜索标签。
        </p>
        <div v-if="data" class="tags-stats">
          <span><b>{{ data.articleCount }}</b> 篇文章</span>
          <span><b>{{ data.keywordCount }}</b> 个主题标签</span>
          <span><b>{{ sources.length }}</b> 个来源</span>
          <span><b>{{ data.cloud.length }}</b> 个词云词条</span>
        </div>
      </header>

      <p v-if="loading" class="tags-loading">正在加载标签索引…</p>
      <p v-else-if="error" class="tags-loading">标签索引加载失败：{{ error }}</p>

      <template v-else>
        <section class="tag-board">
          <div class="tag-cloud-panel">
            <div class="tag-cloud-head">
              <span>WORD CLOUD</span>
              <span>{{ keywordTags.length }} TAGS</span>
            </div>
            <svg
              v-if="data.cloud.length"
              class="tag-cloud-svg"
              viewBox="0 0 1000 520"
              role="img"
              aria-label="文章标签词云"
            >
              <a
                v-for="word in data.cloud"
                :key="word.id"
                :href="`#${word.id}`"
                tabindex="0"
                :aria-label="`${word.label}，${word.count} 篇文章`"
                @click.prevent="selectTag(word.id, true, true)"
              >
                <title>{{ word.label }} · {{ word.count }} 篇</title>
                <text
                  class="cloud-word"
                  :class="{ active: selected === word.id }"
                  :x="word.x"
                  :y="word.y"
                  :font-size="word.size"
                  :fill="word.color"
                  :font-weight="word.size > 42 ? 700 : 500"
                  text-anchor="middle"
                  dominant-baseline="middle"
                >
                  {{ word.label }}
                </text>
              </a>
            </svg>
            <div class="tag-cloud-mobile">
              <button
                v-for="tag in keywordTags.slice(0, 24)"
                :key="tag.id"
                class="mobile-cloud-tag"
                :class="{ active: selected === tag.id }"
                :style="{ fontSize: countForSize(tag) }"
                @click="selectTag(tag.id, true, true)"
              >
                {{ tag.label }}<sup>{{ tag.count }}</sup>
              </button>
            </div>
          </div>

          <aside class="tag-side">
            <label class="tag-search">
              <span>SEARCH TAGS</span>
              <input v-model="query" type="search" placeholder="搜索标签，例如 Unity / 数值" />
            </label>
            <div class="tag-list">
              <button
                v-for="tag in visibleTags"
                :key="tag.id"
                class="tag-list-item"
                :class="{ active: selected === tag.id }"
                @click="selectTag(tag.id, true, true)"
              >
                <span># {{ tag.label }}</span>
                <b>{{ tag.count }}</b>
              </button>
              <p v-if="visibleTags.length === 0" class="tag-empty">没有匹配的标签。</p>
            </div>
            <div class="tag-modules">
              <span class="tag-modules-label">MODULE TAGS</span>
              <button
                v-for="tag in moduleTags"
                :key="tag.id"
                class="module-tag"
                :class="{ active: selected === tag.id }"
                @click="selectTag(tag.id, true, true)"
              >
                {{ tag.label }} <b>{{ tag.count }}</b>
              </button>
            </div>
          </aside>
        </section>

        <section ref="articleSection" class="tag-results">
          <header class="tag-results-head">
            <div>
              <p class="tags-kicker">SELECTED TAG</p>
              <h2>
                <span v-if="selectedTag"># {{ selectedTag.label }}</span>
                <span v-else>选择一个标签</span>
                <small>{{ selectedArticles.length }} 篇</small>
              </h2>
            </div>
            <div v-if="sources.length > 1" class="tag-source-filter">
              <button
                v-for="source in sources"
                :key="source.id"
                :class="{ active: sourceFilter === source.id }"
                @click="toggleSource(source.id)"
              >
                {{ source.name }} <b>{{ source.count }}</b>
              </button>
            </div>
          </header>

          <div v-if="selectedArticles.length" class="tag-article-grid">
            <a
              v-for="article in selectedArticles"
              :key="article.link"
              class="tag-article"
              :href="withBase(article.link)"
            >
              <span class="tag-article-meta">{{ article.module }} · {{ article.sourceName }}</span>
              <h3>{{ article.title }}</h3>
              <span class="tag-article-arrow">→</span>
            </a>
          </div>
          <p v-else class="tag-empty">这个标签下暂无文章。</p>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tags-page {
  padding: 84px 0 96px;
  min-height: 100vh;
}

.tags-header {
  max-width: 820px;
  padding: 28px 0 44px;
}

.tags-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
}

.tags-header h1 {
  margin: 0;
  font-size: clamp(2.6rem, 5.4vw, 4.4rem);
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: -0.05em;
}

.tags-lead {
  max-width: 620px;
  margin: 18px 0 0;
  color: var(--home-muted);
  font-size: 15px;
  line-height: 1.8;
}

.tags-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 26px;
  margin-top: 26px;
  color: var(--home-muted);
  font-size: 12px;
}

.tags-stats b {
  color: var(--home-fg);
  font-family: var(--vp-font-family-mono);
  font-size: 15px;
}

.tags-loading {
  border: 1px solid var(--home-line);
  border-radius: 16px;
  background: var(--home-card);
  padding: 24px;
  color: var(--home-muted);
}

.tag-board {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(300px, 0.8fr);
  gap: 14px;
  align-items: stretch;
}

.tag-cloud-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--home-line);
  border-radius: 24px;
  background:
    radial-gradient(90% 80% at 10% 0%, color-mix(in srgb, var(--home-accent) 8%, transparent), transparent 55%),
    radial-gradient(80% 80% at 100% 100%, color-mix(in srgb, var(--home-accent-2) 9%, transparent), transparent 60%),
    var(--home-card);
  padding: 18px;
  box-shadow: var(--home-shadow);
}

.tag-cloud-head {
  display: flex;
  justify-content: space-between;
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
}

.tag-cloud-svg {
  display: block;
  width: 100%;
  height: auto;
  margin-top: 4px;
}

.cloud-word {
  cursor: pointer;
  opacity: 0.82;
  transition: opacity 0.2s ease, filter 0.2s ease;
}

.cloud-word:hover,
.cloud-word:focus-visible,
.cloud-word.active {
  opacity: 1;
  filter: drop-shadow(0 0 10px currentColor);
}

.tag-cloud-mobile {
  display: none;
}

.tag-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid var(--home-line);
  border-radius: 24px;
  background: var(--home-card);
  padding: 18px;
  box-shadow: var(--home-shadow);
}

.tag-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-search span,
.tag-modules-label {
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
}

.tag-search input {
  width: 100%;
  border: 1px solid var(--home-line);
  border-radius: 10px;
  outline: none;
  background: var(--home-bg);
  padding: 10px 12px;
  color: var(--home-fg);
  font-size: 13px;
}

.tag-search input:focus {
  border-color: color-mix(in srgb, var(--home-accent) 55%, var(--home-line));
}

.tag-list {
  display: flex;
  flex-direction: column;
  max-height: 286px;
  overflow-y: auto;
  padding-right: 4px;
}

.tag-list-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border: 0;
  border-bottom: 1px solid var(--home-line);
  background: transparent;
  padding: 8px 2px;
  color: var(--home-fg);
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  transition: color 0.2s ease, padding 0.2s ease;
}

.tag-list-item:hover,
.tag-list-item.active {
  color: var(--home-accent);
  padding-left: 6px;
}

.tag-list-item b {
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  font-weight: 500;
}

.tag-modules {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid var(--home-line);
  padding-top: 14px;
}

.tag-modules-label {
  width: 100%;
}

.module-tag,
.tag-source-filter button {
  border: 1px solid var(--home-line);
  border-radius: 999px;
  background: transparent;
  padding: 5px 9px;
  color: var(--home-muted);
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.module-tag b,
.tag-source-filter b {
  font-family: var(--vp-font-family-mono);
  font-size: 9px;
  font-weight: 500;
  opacity: 0.7;
}

.module-tag:hover,
.module-tag.active,
.tag-source-filter button:hover,
.tag-source-filter button.active {
  border-color: color-mix(in srgb, var(--home-accent) 55%, var(--home-line));
  background: color-mix(in srgb, var(--home-accent) 9%, transparent);
  color: var(--home-fg);
}

.tag-results {
  margin-top: 64px;
  scroll-margin-top: 90px;
}

.tag-results-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--home-line);
  padding-bottom: 18px;
  margin-bottom: 22px;
}

.tags-kicker {
  margin: 0 0 8px;
  color: var(--home-accent);
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
}

.tag-results-head h2 {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  letter-spacing: -0.03em;
}

.tag-results-head h2 small {
  margin-left: 10px;
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
}

.tag-source-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-article-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.tag-article {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 116px;
  border: 1px solid var(--home-line);
  border-radius: 16px;
  background: var(--home-card);
  padding: 18px;
  color: var(--home-fg);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.tag-article:hover {
  border-color: color-mix(in srgb, var(--home-accent) 50%, var(--home-line));
  background: color-mix(in srgb, var(--home-accent) 5%, var(--home-card));
  transform: translateY(-2px);
}

.tag-article-meta {
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.tag-article h3 {
  margin: 10px 0 0;
  padding-right: 26px;
  font-size: 15px;
  line-height: 1.5;
  letter-spacing: -0.01em;
}

.tag-article-arrow {
  position: absolute;
  right: 16px;
  bottom: 14px;
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  transition: color 0.2s ease, transform 0.2s ease;
}

.tag-article:hover .tag-article-arrow {
  color: var(--home-accent);
  transform: translateX(3px);
}

.tag-empty {
  color: var(--home-muted);
  font-size: 13px;
}

@media (max-width: 1080px) {
  .tag-board {
    grid-template-columns: 1fr;
  }

  .tag-side {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    align-items: start;
  }

  .tag-modules {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .tags-page {
    padding: calc(var(--home-nav-offset) + 44px) 0 64px;
  }

  .tags-header {
    padding-bottom: 28px;
  }

  .tag-cloud-svg {
    display: none;
  }

  .tag-cloud-mobile {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 12px;
    padding: 18px 4px 8px;
  }

  .mobile-cloud-tag {
    border: 0;
    background: transparent;
    color: var(--home-fg);
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
  }

  .mobile-cloud-tag sup {
    margin-left: 3px;
    color: var(--home-muted);
    font-family: var(--vp-font-family-mono);
    font-size: 8px;
    font-weight: 400;
  }

  .mobile-cloud-tag.active {
    color: var(--home-accent);
  }

  .tag-side {
    display: flex;
  }

  .tag-list {
    max-height: 240px;
  }

  .tag-results {
    margin-top: 44px;
  }

  .tag-results-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .tag-article-grid {
    grid-template-columns: 1fr;
  }
}
</style>
