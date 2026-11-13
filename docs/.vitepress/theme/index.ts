import DefaultTheme from 'vitepress/theme'
import { onMounted, watch } from 'vue'
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
  }
}