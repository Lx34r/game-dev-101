<script setup>
import { onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

const data = ref(null)
const loading = ref(true)
const error = ref('')

const accents = ['#a3e635', '#22d3ee', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c']
const configSample = `{
  "id": "team-notes",
  "name": "团队笔记",
  "origin": "https://example.com",
  "docsPath": "/docs/",
  "llms": "https://example.com/llms.txt",
  "url": "https://example.com/docs",
  "prefix": "sources/team-notes",
  "enabled": true
}`

onMounted(async () => {
  try {
    const response = await fetch(withBase('/data/sources-index.json'))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    data.value = await response.json()
  } catch (caught) {
    error.value = String(caught)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home sources-page">
    <div class="home-wrap">
      <header class="sources-header">
        <p class="sources-eyebrow"><span class="live-dot"></span> SOURCES <span class="slash">/</span> 内容来源</p>
        <h1>可持续同步的来源</h1>
        <p class="sources-lead">
          每篇文章保留来源、原文地址与同步时间。新来源接入后，文章会自动进入标签体系与词云。
        </p>
        <div v-if="data" class="sources-stats">
          <span><b>{{ data.sources.length }}</b> 个来源</span>
          <span><b>{{ data.docs }}</b> 篇文章</span>
          <span><b>{{ data.tags }}</b> 个标签</span>
          <span>最近同步 <b>{{ data.generatedAt.slice(0, 10) }}</b></span>
        </div>
      </header>

      <p v-if="loading" class="sources-loading">正在加载来源信息…</p>
      <p v-else-if="error" class="sources-loading">来源信息加载失败：{{ error }}</p>

      <template v-else>
        <section class="source-grid">
          <article
            v-for="(source, index) in data.sources"
            :key="source.id"
            class="source-card"
            :style="{ '--accent': accents[index % accents.length] }"
          >
            <div class="source-card-top">
              <span class="source-index">{{ String(index + 1).padStart(2, '0') }} / SYNCED</span>
              <span class="source-id">{{ source.id }}</span>
            </div>
            <h2>{{ source.name }}</h2>
            <p class="source-meta">{{ source.pages }} 篇文章 · {{ source.lastSync }} 同步</p>
            <div class="source-tags">
              <a
                v-for="tag in source.topTags"
                :key="tag.id"
                :href="withBase(`/tags/#${tag.id}`)"
              >
                # {{ tag.label }}<sup>{{ tag.count }}</sup>
              </a>
            </div>
            <footer class="source-actions">
              <a :href="source.url" target="_blank" rel="noreferrer">源站 ↗</a>
              <a :href="withBase(source.path)">浏览文章 →</a>
            </footer>
          </article>
        </section>

        <section class="source-how">
          <div class="source-how-copy">
            <p class="sources-kicker">ADD A SOURCE</p>
            <h2>接入下一个来源</h2>
            <p>
              在 <code>sources.json</code> 增加一条配置，执行 <code>npm run sync</code>。
              非主来源会自动放到 <code>sources/&lt;id&gt;/</code> 下，并参与标签与词云生成。
            </p>
            <ol>
              <li>填写站点根地址、文档路径与 llms.txt。</li>
              <li>为附加来源设置独立 prefix，避免路径冲突。</li>
              <li>同步后检查标签覆盖与失效链接报告。</li>
            </ol>
          </div>
          <pre class="source-how-code"><code>{{ configSample }}</code></pre>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sources-page {
  padding: 84px 0 96px;
  min-height: 100vh;
}

.sources-header {
  max-width: 820px;
  padding: 28px 0 44px;
}

.sources-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
}

.sources-header h1 {
  margin: 0;
  font-size: clamp(2.6rem, 5.4vw, 4.4rem);
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: -0.05em;
}

.sources-lead {
  max-width: 620px;
  margin: 18px 0 0;
  color: var(--home-muted);
  font-size: 15px;
  line-height: 1.8;
}

.sources-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 26px;
  margin-top: 26px;
  color: var(--home-muted);
  font-size: 12px;
}

.sources-stats b {
  color: var(--home-fg);
  font-family: var(--vp-font-family-mono);
  font-size: 15px;
}

.sources-loading {
  border: 1px solid var(--home-line);
  border-radius: 16px;
  background: var(--home-card);
  padding: 24px;
  color: var(--home-muted);
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 14px;
}

.source-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--home-line);
  border-radius: 22px;
  background:
    linear-gradient(150deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 58%),
    var(--home-card);
  padding: 24px;
  box-shadow: var(--home-shadow);
}

.source-card::after {
  content: '';
  position: absolute;
  right: -50px;
  top: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: var(--accent);
  filter: blur(60px);
  opacity: 0.12;
  pointer-events: none;
}

.source-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
}

.source-index {
  color: var(--accent);
}

.source-card h2 {
  margin: 20px 0 0;
  font-size: clamp(1.4rem, 2.6vw, 1.9rem);
  letter-spacing: -0.03em;
}

.source-meta {
  margin: 7px 0 0;
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 20px 0 0;
}

.source-tags a {
  border: 1px solid var(--home-line);
  border-radius: 999px;
  padding: 4px 9px;
  color: var(--home-muted);
  font-size: 11px;
  text-decoration: none;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.source-tags a:hover {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--home-line));
  color: var(--home-fg);
}

.source-tags sup {
  margin-left: 2px;
  font-family: var(--vp-font-family-mono);
  font-size: 8px;
}

.source-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
  border-top: 1px solid var(--home-line);
  padding-top: 16px;
}

.source-actions a {
  color: var(--home-muted);
  font-size: 12px;
  text-decoration: none;
}

.source-actions a:last-child {
  color: var(--accent);
}

.source-actions a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.source-how {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 32px;
  align-items: start;
  border: 1px solid var(--home-line);
  border-radius: 24px;
  background: var(--home-card);
  padding: 32px;
  margin-top: 14px;
}

.sources-kicker {
  margin: 0 0 10px;
  color: var(--home-accent);
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
}

.source-how h2 {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  letter-spacing: -0.03em;
}

.source-how p {
  margin: 14px 0 0;
  color: var(--home-muted);
  font-size: 13px;
  line-height: 1.8;
}

.source-how code {
  border: 1px solid var(--home-line);
  border-radius: 5px;
  background: var(--home-bg);
  padding: 1px 5px;
  font-size: 11px;
}

.source-how ol {
  margin: 16px 0 0;
  padding-left: 18px;
  color: var(--home-muted);
  font-size: 12.5px;
  line-height: 1.9;
}

.source-how-code {
  overflow-x: auto;
  border: 1px solid var(--home-line);
  border-radius: 16px;
  background: var(--home-bg);
  padding: 18px;
  color: var(--home-fg);
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .source-grid,
  .source-how {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .sources-page {
    padding: calc(var(--home-nav-offset) + 44px) 0 64px;
  }

  .sources-header {
    padding-bottom: 28px;
  }

  .source-how {
    padding: 22px;
  }
}
</style>
