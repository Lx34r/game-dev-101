<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import modules from '../../data/modules.json'
import site from '../../data/site.json'
import tagCatalog from '../../data/tags.json'

const META = {
  Design: {
    desc: '数值、机制、系统与玩家心理，把体验翻译成可调参数。',
    accent: '#42b983',
    tags: ['数值', '机制', '系统', '心理'],
    featured: true
  },
  Tech: {
    desc: '架构、渲染、网络与性能预算，写给要长期维护的项目。',
    accent: '#42b4b9',
    tags: ['架构', '图形', '网络', '性能'],
    featured: true
  },
  Case_Studies: { desc: '成功与失败的设计复盘，拆到可复用的决策。', accent: '#fbbf24' },
  Dev_Guides: { desc: '工具链、测试、发行与团队协作。', accent: '#a78bfa' },
  Art: { desc: '画面、特效、UI 与视觉层级。', accent: '#f472b6' },
  Audio: { desc: '中间件、动态音乐与音效设计。', accent: '#60a5fa' },
  Unity_Standards: { desc: '命名、目录与工业化流程。', accent: '#94a3b8' },
  Guides: { desc: 'Steam 与 TapTap 的发行策略。', accent: '#fb923c' },
  Research: { desc: '在研课题与资料清单。', accent: '#2dd4bf' },
  Tools: { desc: '编辑器工具与自动化。', accent: '#f87171' }
}

const moduleCards = modules.map((module) => ({
  ...module,
  ...(META[module.dir] || { desc: '', accent: '#42b983' })
}))

const tagPreview = computed(() => {
  const entries = Object.entries(tagCatalog)
    .filter(([, tag]) => tag.kind === 'keyword')
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 24)
  const counts = entries.map(([, tag]) => tag.count)
  const min = Math.min(...counts)
  const max = Math.max(...counts)
  return entries.map(([id, tag]) => ({
    id,
    ...tag,
    size: Math.round(12 + Math.sqrt(max === min ? 1 : (tag.count - min) / (max - min)) * 13)
  }))
})

const paths = [
  {
    index: '01',
    title: '立项：把想法收到可做的范围',
    note: '先确定体验目标，再决定系统与数值的复杂度。',
    links: [
      { label: '设计哲学与系统架构', link: '/Design/Philosophy_And_Systems' },
      { label: '混合类型游戏分析', link: '/Design/Philosophy_And_Systems/Hybrid_Genre_Analysis' },
      { label: '核心数值体系定义手册', link: '/Design/Numerical_Manual' }
    ]
  },
  {
    index: '02',
    title: '战斗：把体验做成系统',
    note: '从输入、索敌到伤害结算，让手感可调、可测。',
    links: [
      { label: '战斗系统详解', link: '/Design/Mechanics/Combat_System' },
      { label: '肉鸽强化系统', link: '/Design/Mechanics/Roguelike_Perks' },
      { label: '索敌系统综合指南', link: '/Tech/Mechanics/Targeting_System_Complete' }
    ]
  },
  {
    index: '03',
    title: '工程：让帧率与上线都可控',
    note: '性能预算、代码结构与发行清单，按上线标准倒推。',
    links: [
      { label: '性能预算与优化标准', link: '/Tech/Performance_Budget' },
      { label: 'Unity C# 高性能实践', link: '/Tech/Optimization/Unity_Advanced_CSharp_Performance' },
      { label: 'Steam 发行策略研究', link: '/Guides/Publishing/Steam_Complete_Guide' }
    ]
  }
]

const featured = [
  { tag: 'DESIGN', title: '核心数值体系定义手册', note: '数值框架的起点：把难度、节奏与成长写成公式。', link: '/Design/Numerical_Manual' },
  { tag: 'DESIGN', title: '战斗系统详解', note: '从输入缓冲到命中反馈，拆开动作手感。', link: '/Design/Mechanics/Combat_System' },
  { tag: 'TECH', title: '索敌系统综合指南', note: '高频查询、评分维度与空间划分的工程实现。', link: '/Tech/Mechanics/Targeting_System_Complete' },
  { tag: 'CASE', title: 'Hades 构建多样性', note: '肉鸽构筑如何做到每局都有新组合。', link: '/Case_Studies/Roguelike/Hades' },
  { tag: 'TECH', title: '性能预算与优化标准', note: '先定帧与内存的底线，再谈效果。', link: '/Tech/Performance_Budget' },
  { tag: 'GUIDE', title: 'Steam 发行策略研究', note: '从商店页到长线运营的完整路径。', link: '/Guides/Publishing/Steam_Complete_Guide' }
]

const heroEl = ref(null)
const canvasEl = ref(null)
let ctx = null
let raf = 0
let particles = []
let W = 0
let H = 0
let visible = true
let reduced = false
let io = null
const pointer = { x: -9999, y: -9999, on: false }

function seed() {
  const count = Math.max(36, Math.min(90, Math.round((W * H) / 18000)))
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: 1 + Math.random() * 2.4
  }))
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)
  const LINK = 240
  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i]
    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const d2 = dx * dx + dy * dy
      if (d2 < LINK * LINK) {
        const alpha = 0.5 * (1 - Math.sqrt(d2) / LINK)
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
    if (pointer.on) {
      const dx = a.x - pointer.x
      const dy = a.y - pointer.y
      const d2 = dx * dx + dy * dy
      const GRAB = 200
      if (d2 < GRAB * GRAB) {
        const alpha = 0.8 * (1 - Math.sqrt(d2) / GRAB)
        ctx.strokeStyle = `rgba(66,185,131,${alpha.toFixed(3)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(pointer.x, pointer.y)
        ctx.stroke()
      }
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  for (const p of particles) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function resize() {
  const canvas = canvasEl.value
  const hero = heroEl.value
  if (!canvas || !hero) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = hero.clientWidth
  H = hero.clientHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = `${W}px`
  canvas.style.height = `${H}px`
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  seed()
  if (reduced) draw()
}

function step() {
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    if (p.x < -10) p.x = W + 10
    else if (p.x > W + 10) p.x = -10
    if (p.y < -10) p.y = H + 10
    else if (p.y > H + 10) p.y = -10
  }
  draw()
}

function loop() {
  step()
  raf = requestAnimationFrame(loop)
}

function start() {
  if (reduced || raf) return
  raf = requestAnimationFrame(loop)
}

function stop() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
}

function onVis() {
  if (document.hidden) stop()
  else if (visible) start()
}

function onPointerMove(event) {
  const rect = heroEl.value.getBoundingClientRect()
  pointer.x = event.clientX - rect.left
  pointer.y = event.clientY - rect.top
  pointer.on = true
}

function onPointerLeave() {
  pointer.on = false
}

function onClick(event) {
  const rect = heroEl.value.getBoundingClientRect()
  particles.push({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: 1 + Math.random() * 2.4
  })
  if (particles.length > 120) particles.shift()
  if (reduced) draw()
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resize()
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVis)
  io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (visible && !document.hidden) start()
      else stop()
    },
    { threshold: 0.05 }
  )
  io.observe(heroEl.value)
  if (!reduced) start()
})

onBeforeUnmount(() => {
  stop()
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVis)
  io?.disconnect()
})

function openSearch() {
  document.querySelector('.DocSearch-Button')?.click()
}
</script>

<template>
  <div class="home">
    <section
      ref="heroEl"
      class="home-hero"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @click="onClick"
    >
      <canvas ref="canvasEl" class="hero-canvas" aria-hidden="true"></canvas>
      <span class="hero-moon" aria-hidden="true"></span>

      <div class="hero-center">
        <h1 class="hero-title">GameDev Atlas</h1>
        <p class="hero-tagline">把游戏做出来 · 从设计到上线</p>
        <nav class="hero-links" aria-label="快速入口">
          <a :href="withBase('/START_HERE')">开始探索</a>
          <a :href="withBase('/tags/')">标签图谱</a>
          <a :href="withBase('/sources/')">内容来源</a>
          <a :href="withBase('/notes/')">笔记</a>
        </nav>
        <dl class="hero-stats">
          <div>
            <dt>DOCS</dt>
            <dd>{{ site.docs }}</dd>
          </div>
          <div>
            <dt>TAGS</dt>
            <dd>{{ site.tags }}</dd>
          </div>
          <div>
            <dt>SOURCES</dt>
            <dd>{{ site.sources }}</dd>
          </div>
          <div>
            <dt>DIAGRAMS</dt>
            <dd>{{ site.diagrams }}</dd>
          </div>
        </dl>
      </div>

      <a class="hero-down" href="#modules" aria-label="向下滚动">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>

    <section id="modules" class="home-section">
      <div class="home-wrap">
        <header class="home-section-head reveal">
          <div>
            <p class="home-kicker">01 / MODULES</p>
            <h2>一张图看完知识地图</h2>
          </div>
          <p class="home-section-note">按工作流而非文件夹组织：从立项、机制到性能与发行。</p>
        </header>

        <div class="home-bento">
          <a
            v-for="(module, index) in moduleCards"
            :key="module.dir"
            class="bento-card reveal"
            :class="{ 'is-featured': module.featured }"
            :style="{ '--accent': module.accent }"
            :href="withBase(module.link)"
          >
            <span class="bento-top">
              <span class="bento-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="bento-arrow">↗</span>
            </span>
            <span v-if="module.featured" class="bento-ghost" aria-hidden="true">{{ module.count }}</span>
            <h3>{{ module.label }}</h3>
            <p>{{ module.desc }}</p>
            <span class="bento-foot">
              <span class="bento-count">{{ module.count }} 篇</span>
              <span v-if="module.tags" class="bento-tags">
                <span v-for="tag in module.tags" :key="tag">{{ tag }}</span>
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>

    <section class="home-section home-section-alt">
      <div class="home-wrap">
        <header class="home-section-head reveal">
          <div>
            <p class="home-kicker">02 / START HERE</p>
            <h2>三条可执行的阅读路线</h2>
          </div>
          <p class="home-section-note">不必从头读到尾。选一个当前目标，按顺序走。</p>
        </header>

        <div class="path-grid">
          <article v-for="path in paths" :key="path.index" class="path-card reveal">
            <span class="path-index">{{ path.index }}</span>
            <h3>{{ path.title }}</h3>
            <p class="path-note">{{ path.note }}</p>
            <ol class="path-links">
              <li v-for="item in path.links" :key="item.link">
                <a :href="withBase(item.link)">
                  <span>{{ item.label }}</span>
                  <span class="path-arrow">↗</span>
                </a>
              </li>
            </ol>
          </article>
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="home-wrap">
        <header class="home-section-head reveal">
          <div>
            <p class="home-kicker">03 / READING LIST</p>
            <h2>精选六篇</h2>
          </div>
          <p class="home-section-note">如果只读六篇，从这六篇开始。</p>
        </header>

        <dl class="post-list reveal">
          <template v-for="item in featured" :key="item.link">
            <dt>
              <code class="post-badge">{{ item.tag }}</code>
              <span class="post-chevron">»</span>
              <a :href="withBase(item.link)">{{ item.title }}</a>
            </dt>
            <dd>{{ item.note }}</dd>
          </template>
        </dl>
      </div>
    </section>

    <section class="home-section home-section-alt">
      <div class="home-wrap">
        <header class="home-section-head reveal">
          <div>
            <p class="home-kicker">04 / TAGS</p>
            <h2>从标签进入</h2>
          </div>
          <p class="home-section-note">标签由标题、章节与正文自动提取，可组合来源筛选，也可以直接看词云。</p>
        </header>
        <div class="home-tag-cloud reveal">
          <a
            v-for="tag in tagPreview"
            :key="tag.id"
            class="home-tag"
            :href="withBase(`/tags/#${tag.id}`)"
            :style="{ fontSize: `${tag.size}px` }"
          >
            # {{ tag.label }}<sup>{{ tag.count }}</sup>
          </a>
          <a class="home-tag-more" :href="withBase('/tags/')">打开标签图谱 →</a>
        </div>
      </div>
    </section>

    <section class="home-section home-section-cta">
      <div class="home-wrap">
        <div class="home-cta reveal">
          <div>
            <p class="home-kicker">05 / BEGIN</p>
            <h2>下一步，读一篇今天就能用上的文档。</h2>
          </div>
          <div class="home-actions">
            <a class="home-btn home-btn-primary" :href="withBase('/START_HERE')">新人上路 <span class="btn-arrow">→</span></a>
            <button class="home-btn home-btn-ghost" type="button" @click="openSearch">搜索全站 <kbd>⌘K</kbd></button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>