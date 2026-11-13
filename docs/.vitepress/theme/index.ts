import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useData } from 'vitepress'
import HomePage from './components/HomePage.vue'
import ArticleTags from './components/ArticleTags.vue'
import TagsPage from './components/TagsPage.vue'
import SourcesPage from './components/SourcesPage.vue'
import NotesPage from './components/NotesPage.vue'
import './custom.css'
import './home.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
    app.component('ArticleTags', ArticleTags)
    app.component('TagsPage', TagsPage)
    app.component('SourcesPage', SourcesPage)
    app.component('NotesPage', NotesPage)
  },
  setup() {
    const { isDark } = useData()
    const syncChrome = () => {
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', isDark.value ? '#202124' : '#f6f8f7')
    }
    onMounted(syncChrome)
    watch(isDark, syncChrome)

    // 旧分享链接的 fragment 是去 emoji 的旧 slug，按归一化匹配回落到真实标题 id
    const resolveLegacyHash = () => {
      if (!location.hash) return
      let frag = location.hash.slice(1)
      try {
        frag = decodeURIComponent(frag)
      } catch {
        return
      }
      if (document.getElementById(frag)) return
      const norm = (s: string) =>
        s.replace(/\p{Extended_Pictographic}/gu, '').replace(/\uFE0F/g, '').toLowerCase()
      const want = norm(frag)
      const el = Array.from(document.querySelectorAll('.vp-doc [id]')).find((n) => norm(n.id) === want)
      if (!el) return
      history.replaceState(null, '', '#' + el.id)
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) || 64
      const top = window.scrollY + el.getBoundingClientRect().top - navH - 24
      window.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
    // 延后到 router 同 tick 的回顶滚动之后，避免落点被覆盖
    const scheduleResolve = () => nextTick(() => setTimeout(resolveLegacyHash, 0))
    onMounted(() => {
      scheduleResolve()
      window.addEventListener('hashchange', scheduleResolve)
    })
    onUnmounted(() => window.removeEventListener('hashchange', scheduleResolve))
  }
}