<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'

const data = ref(null)
const loading = ref(true)
const error = ref('')
const pageEl = ref(null)
let revealIO = null

async function armReveals() {
  await nextTick()
  const nodes = pageEl.value?.querySelectorAll('.reveal') || []
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || !('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-visible'))
    return
  }
  revealIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          revealIO.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  )
  nodes.forEach((node, index) => {
    node.style.setProperty('--rd', `${Math.min((index % 6) * 70, 350)}ms`)
    revealIO.observe(node)
  })
}

onMounted(async () => {
  try {
    const response = await fetch(withBase('/data/notes-index.json'))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    data.value = await response.json()
  } catch (caught) {
    error.value = String(caught)
  } finally {
    loading.value = false
  }
  await armReveals()
})

onUnmounted(() => revealIO?.disconnect())
</script>

<template>
  <div ref="pageEl" class="home notes-page">
    <div class="home-wrap">
      <header class="notes-header">
        <p class="notes-eyebrow"><span class="live-dot"></span> NOTES <span class="slash">/</span> 笔记</p>
        <h1>本站笔记</h1>
        <p class="notes-lead">
          原创整理与专题备忘。笔记放在 <code>docs/notes/</code>，同步时保留，并自动参与标签、词云与来源筛选。
        </p>
        <div v-if="data" class="notes-stats">
          <span><b>{{ data.notes.length }}</b> 篇笔记</span>
          <span>更新于 <b>{{ data.generatedAt.slice(0, 10) }}</b></span>
        </div>
      </header>

      <p v-if="loading" class="notes-loading">正在加载笔记…</p>
      <p v-else-if="error" class="notes-loading">笔记加载失败：{{ error }}</p>
      <p v-else-if="data.notes.length === 0" class="notes-loading">暂无笔记。在 `docs/notes/` 新建 Markdown 即可。</p>

      <div v-else class="notes-grid">
        <article v-for="note in data.notes" :key="note.link" class="note-card reveal">
          <span class="note-kicker">ORIGINAL NOTE</span>
          <h2><a class="note-title-link" :href="withBase(note.link)">{{ note.title }}</a></h2>
          <p>{{ note.description }}</p>
          <div class="note-tags">
            <a
              v-for="tag in note.tags"
              :key="tag.id"
              :href="withBase(`/tags/#${tag.id}`)"
            >
              # {{ tag.label }}
            </a>
          </div>
          <svg class="note-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </article>
      </div>

      <section class="notes-how reveal">
        <p class="notes-kicker">WRITE A NOTE</p>
        <h2>写一篇新笔记</h2>
        <p>
          在 <code>docs/notes/</code> 新建 Markdown，写入 <code>title</code>、<code>description</code> 与
          <code>tags</code>，正文标题下放 <code>&lt;ArticleTags /&gt;</code>。执行 <code>npm run sync</code>
          后会进入笔记索引、标签与词云。
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.notes-page {
  position: relative;
  padding: 84px 0 96px;
  min-height: 100vh;
}

.notes-page::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 440px;
  background:
    radial-gradient(46% 62% at 12% 0%, var(--home-aurora-1), transparent 70%),
    radial-gradient(40% 56% at 88% 4%, var(--home-aurora-2), transparent 72%);
  pointer-events: none;
}

.notes-page .home-wrap {
  position: relative;
}

.notes-header {
  max-width: 820px;
  padding: 28px 0 44px;
}

.notes-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
}

.notes-header h1 {
  margin: 0;
  font-size: clamp(2.6rem, 5.4vw, 4.4rem);
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: -0.05em;
  background: linear-gradient(100deg, var(--home-title-a) 5%, var(--home-title-b) 55%, var(--home-title-c) 115%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.notes-lead {
  max-width: 660px;
  margin: 18px 0 0;
  color: var(--home-muted);
  font-size: 15px;
  line-height: 1.8;
}

.notes-lead code,
.notes-how code {
  border: 1px solid var(--home-line);
  border-radius: 5px;
  background: var(--home-card);
  padding: 1px 5px;
  font-size: 12px;
}

.notes-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 26px;
  margin-top: 26px;
  color: var(--home-muted);
  font-size: 12px;
}

.notes-stats b {
  color: var(--home-fg);
  font-family: var(--vp-font-family-mono);
  font-size: 15px;
}

.notes-loading {
  border: 1px solid var(--home-line);
  border-radius: 16px;
  background: var(--home-card);
  padding: 24px;
  color: var(--home-muted);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.note-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 220px;
  border: 1px solid var(--home-line);
  border-radius: 22px;
  background:
    radial-gradient(80% 100% at 0% 0%, color-mix(in srgb, var(--home-accent) 8%, transparent), transparent 60%),
    var(--home-card);
  padding: 24px;
  color: var(--home-fg);
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.notes-grid .note-card:nth-child(8n + 1) { --home-accent: var(--home-cloud-1); }
.notes-grid .note-card:nth-child(8n + 2) { --home-accent: var(--home-cloud-2); }
.notes-grid .note-card:nth-child(8n + 3) { --home-accent: var(--home-cloud-3); }
.notes-grid .note-card:nth-child(8n + 4) { --home-accent: var(--home-cloud-4); }
.notes-grid .note-card:nth-child(8n + 5) { --home-accent: var(--home-cloud-5); }
.notes-grid .note-card:nth-child(8n + 6) { --home-accent: var(--home-cloud-6); }
.notes-grid .note-card:nth-child(8n + 7) { --home-accent: var(--home-cloud-7); }
.notes-grid .note-card:nth-child(8n + 8) { --home-accent: var(--home-cloud-8); }

.note-card:hover {
  border-color: color-mix(in srgb, var(--home-accent) 50%, var(--home-line));
  transform: translateY(-3px);
}

.note-card:active {
  transform: translateY(-1px) scale(0.99);
}

.note-kicker {
  color: var(--home-accent);
  font-family: var(--vp-font-family-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
}

.note-card h2 {
  margin: 16px 0 0;
  font-size: clamp(1.3rem, 2.4vw, 1.7rem);
  letter-spacing: -0.03em;
}

.note-title-link {
  color: inherit;
  text-decoration: none;
}

.note-title-link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.note-card p {
  margin: 8px 0 0;
  color: var(--home-muted);
  font-size: 13px;
  line-height: 1.7;
}

.note-tags {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 18px;
}

.note-tags a {
  border: 1px solid var(--home-line);
  border-radius: 999px;
  padding: 4px 8px;
  color: var(--home-muted);
  font-size: 10.5px;
  text-decoration: none;
  transition: border-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
}

.note-tags a:hover {
  border-color: var(--home-accent);
  color: var(--home-fg);
}

.note-tags a:active {
  transform: scale(0.95);
}

.note-arrow {
  position: absolute;
  right: 20px;
  bottom: 18px;
  color: var(--home-muted);
  transition: color 0.2s ease, transform 0.2s ease;
}

.note-card:hover .note-arrow {
  color: var(--home-accent);
  transform: translateX(3px);
}

.notes-how {
  border: 1px solid var(--home-line);
  border-radius: 22px;
  background: var(--home-card);
  padding: 26px;
  margin-top: 14px;
}

.notes-kicker {
  margin: 0 0 8px;
  color: var(--home-accent);
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
}

.notes-how h2 {
  margin: 0;
  font-size: 1.4rem;
  letter-spacing: -0.02em;
}

.notes-how p {
  max-width: 780px;
  margin: 12px 0 0;
  color: var(--home-muted);
  font-size: 13px;
  line-height: 1.8;
}

@media (max-width: 760px) {
  .notes-page {
    padding: calc(var(--home-nav-offset) + 44px) 0 64px;
  }

  .notes-header {
    padding-bottom: 28px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>