<script setup>
import modules from '../../data/modules.json'
import { withBase } from 'vitepress'
</script>

<template>
  <section class="module-section">
    <h2 class="module-heading">按模块浏览</h2>
    <div class="module-grid">
      <a v-for="module in modules" :key="module.dir" class="module-card" :href="withBase(module.link)">
        <span class="module-emoji" aria-hidden="true">{{ module.emoji }}</span>
        <span class="module-label">{{ module.label }}</span>
        <span class="module-count">{{ module.count }} 篇</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.module-section {
  margin: 8px 0 48px;
}

.module-heading {
  margin: 0 0 16px;
  border: 0;
  padding: 0;
  font-size: 20px;
  letter-spacing: -0.01em;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  padding: 16px 18px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.module-card:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  transform: translateY(-2px);
}

.module-emoji {
  font-size: 22px;
  line-height: 1;
}

.module-label {
  font-weight: 600;
}

.module-count {
  margin-left: auto;
  color: var(--vp-c-text-3);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
