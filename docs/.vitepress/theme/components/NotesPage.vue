<script setup>
import { onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

const data = ref(null)
const loading = ref(true)
const error = ref('')

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
})
</script>

<template>
  <div class="home notes-page">
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
        <a v-for="note in data.notes" :key="note.link" class="note-card" :href="withBase(note.link)">
          <span class="note-kicker">ORIGINAL NOTE</span>
          <h2>{{ note.title }}</h2>
          <p>{{ note.description }}</p>
          <div class="note-tags">
            <a
              v-for="tag in note.tags"
              :key="tag.id"
              :href="withBase(`/tags/#${tag.id}`)"
              @click.stop
            >
              # {{ tag.label }}
            </a>
          </div>
          <span class="note-arrow">→</span>
        </a>
      </div>

      <section class="notes-how">
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
  padding: 84px 0 96px;
  min-height: 100vh;
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
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.note-card:hover {
  border-color: color-mix(in srgb, var(--home-accent) 50%, var(--home-line));
  transform: translateY(-3px);
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

.note-card p {
  margin: 8px 0 0;
  color: var(--home-muted);
  font-size: 13px;
  line-height: 1.7;
}

.note-tags {
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
}

.note-tags a:hover {
  border-color: var(--home-accent);
  color: var(--home-fg);
}

.note-arrow {
  position: absolute;
  right: 20px;
  bottom: 18px;
  color: var(--home-muted);
  font-family: var(--vp-font-family-mono);
  font-size: 16px;
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
