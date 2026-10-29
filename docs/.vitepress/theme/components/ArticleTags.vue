<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import catalog from '../../data/tags.json'

const { frontmatter } = useData()

const tags = computed(() =>
  (frontmatter.value.tags || []).map((id) => ({
    id,
    kind: catalog[id]?.kind || 'keyword',
    label: catalog[id]?.label || id
  }))
)

const sourceName = computed(() => frontmatter.value.sourceName || '')
const sourceUrl = computed(() => frontmatter.value.sourceUrl || '')
</script>

<template>
  <div v-if="tags.length" class="article-meta">
    <div class="article-tags">
      <span class="article-tags__label">TAGS</span>
      <a
        v-for="tag in tags"
        :key="tag.id"
        :href="withBase(`/tags/#${tag.id}`)"
        class="article-tag"
        :class="{ 'is-module': tag.kind === 'module' }"
      >
        # {{ tag.label }}
      </a>
    </div>
    <p v-if="sourceName" class="article-source">
      来源 ·
      <a v-if="sourceUrl" :href="sourceUrl" target="_blank" rel="noreferrer">{{ sourceName }}</a>
      <span v-else>{{ sourceName }}</span>
    </p>
  </div>
</template>
