<script setup>
import { withBase } from 'vitepress'

const docs = [
  { title: '核心数值体系定义手册', note: '数值框架的起点', link: '/Design/Numerical_Manual' },
  { title: '战斗系统详解', note: '机制与手感', link: '/Design/Mechanics/Combat_System' },
  { title: '肉鸽强化系统', note: 'Perk 与构筑', link: '/Design/Mechanics/Roguelike_Perks' },
  { title: '性能预算与优化标准', note: '帧与内存的底线', link: '/Tech/Performance_Budget' },
  { title: 'Hades 构建多样性', note: '案例拆解', link: '/Case_Studies/Roguelike/Hades' },
  { title: 'Steam 发行策略研究', note: '上线与长线', link: '/Guides/Publishing/Steam_Complete_Guide' }
]
</script>

<template>
  <div class="hot-grid">
    <a v-for="doc in docs" :key="doc.link" class="hot-card" :href="withBase(doc.link)">
      <span class="hot-title">{{ doc.title }}</span>
      <span class="hot-note">{{ doc.note }}</span>
    </a>
  </div>
</template>

<style scoped>
.hot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 32px;
}

.hot-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 14px 16px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.hot-card:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.hot-title {
  font-weight: 600;
  line-height: 1.4;
}

.hot-note {
  color: var(--vp-c-text-3);
  font-size: 13px;
}

@media (max-width: 720px) {
  .hot-grid {
    grid-template-columns: 1fr;
  }
}
</style>
