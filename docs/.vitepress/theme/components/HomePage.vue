<script setup>
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import modules from '../../data/modules.json'
import site from '../../data/site.json'
import tagCatalog from '../../data/tags.json'

const META = {
  Design: {
    desc: '数值、机制、系统与玩家心理，把体验翻译成可调参数。',
    accent: '#a3e635',
    tags: ['数值', '机制', '系统', '心理'],
    featured: true
  },
  Tech: {
    desc: '架构、渲染、网络与性能预算，写给要长期维护的项目。',
    accent: '#22d3ee',
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
  ...(META[module.dir] || { desc: '', accent: '#a3e635' })
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
  {
    tag: 'DESIGN',
    title: '核心数值体系定义手册',
    note: '数值框架的起点：把难度、节奏与成长写成公式。',
    link: '/Design/Numerical_Manual'
  },
  {
    tag: 'DESIGN',
    title: '战斗系统详解',
    note: '从输入缓冲到命中反馈，拆开动作手感。',
    link: '/Design/Mechanics/Combat_System'
  },
  {
    tag: 'TECH',
    title: '索敌系统综合指南',
    note: '高频查询、评分维度与空间划分的工程实现。',
    link: '/Tech/Mechanics/Targeting_System_Complete'
  },
  {
    tag: 'CASE',
    title: 'Hades 构建多样性',
    note: '肉鸽构筑如何做到每局都有新组合。',
    link: '/Case_Studies/Roguelike/Hades'
  },
  {
    tag: 'TECH',
    title: '性能预算与优化标准',
    note: '先定帧与内存的底线，再谈效果。',
    link: '/Tech/Performance_Budget'
  },
  {
    tag: 'GUIDE',
    title: 'Steam 发行策略研究',
    note: '从商店页到长线运营的完整路径。',
    link: '/Guides/Publishing/Steam_Complete_Guide'
  }
]

const heroEl = ref(null)

function handlePointer(event) {
  const element = heroEl.value
  if (!element) return
  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  element.style.setProperty('--mx', `${x}px`)
  element.style.setProperty('--my', `${y}px`)
  element.style.setProperty('--rx', `${((x / rect.width) - 0.5) * 6}deg`)
  element.style.setProperty('--ry', `${((y / rect.height) - 0.5) * -6}deg`)
}

function openSearch() {
  document.querySelector('.DocSearch-Button')?.click()
}


</script>

<template>
  <div ref="heroEl" class="home" @pointermove="handlePointer">
    <section class="home-hero">
      <div class="home-hero-bg" aria-hidden="true">
        <span class="orb orb-a"></span>
        <span class="orb orb-b"></span>
        <span class="orb orb-c"></span>
        <span class="grid-overlay"></span>
        <span class="noise"></span>
        <span class="cursor-glow"></span>
      </div>

      <div class="home-wrap home-hero-inner">
        <div class="home-hero-copy">
          <p class="home-eyebrow">
            <span class="live-dot"></span>
            GAMEDEV ATLAS
            <span class="slash">/</span>
            VOL. 01
          </p>
          <h1 class="home-title">
            把游戏做出来
            <span class="home-title-accent">从设计到上线</span>
          </h1>
          <p class="home-lead">
            一个可持续同步的开发知识备忘站。{{ site.docs }} 篇文章自动生成标签，
            按主题、模块与来源快速检索，也可以从词云进入。
          </p>
          <div class="home-actions">
            <a class="home-btn home-btn-primary" :href="withBase('/START_HERE')">
              开始探索
              <span class="btn-arrow">→</span>
            </a>
            <button class="home-btn home-btn-ghost" type="button" @click="openSearch">
              搜索文档
              <kbd>⌘K</kbd>
            </button>
            <a class="home-link" :href="withBase('/Full_Index')">全站索引 <span>↗</span></a>
          </div>
          <dl class="home-stats">
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

        <div class="home-atlas" aria-hidden="true">
          <div class="atlas-panel">
            <div class="atlas-head">
              <span>ATLAS / 01</span>
              <span class="atlas-live">LIVE INDEX</span>
            </div>
            <svg class="atlas-lines" viewBox="0 0 460 420" preserveAspectRatio="none">
              <path d="M70 300 C140 280 160 220 230 200 S330 140 390 90" />
              <path d="M90 100 C160 140 210 150 260 190 S340 260 372 320" />
              <path d="M70 300 C120 330 240 330 300 280 S350 220 390 90" />
            </svg>
            <span class="atlas-node node-design"><b>01</b> 设计</span>
            <span class="atlas-node node-tech"><b>02</b> 技术</span>
            <span class="atlas-node node-case"><b>03</b> 案例</span>
            <span class="atlas-node node-art"><b>04</b> 美术</span>
            <span class="atlas-node node-release"><b>05</b> 发行</span>
            <div class="atlas-card">
              <span class="atlas-card-kicker">FEATURED</span>
              <strong>核心数值体系定义手册</strong>
              <span class="atlas-card-meta">DESIGN · 数值 / 经济 / 成长</span>
              <span class="atlas-card-line"></span>
            </div>
            <span class="atlas-coord">X 128.4 / Y 36.2</span>
          </div>
          <span class="atlas-chip chip-docs">{{ site.docs }} 篇文章</span>
          <span class="atlas-chip chip-diagrams">46 张图表</span>
        </div>
      </div>
    </section>

    <section class="home-section">
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

        <div class="featured-grid">
          <a
            v-for="item in featured"
            :key="item.link"
            class="feature-card reveal"
            :href="withBase(item.link)"
          >
            <span class="feature-tag">{{ item.tag }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.note }}</p>
            <span class="feature-arrow">→</span>
          </a>
        </div>
      </div>
    </section>

    <section class="home-section">
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
