import DefaultTheme from 'vitepress/theme'
import HomePage from './components/HomePage.vue'
import ArticleTags from './components/ArticleTags.vue'
import TagsPage from './components/TagsPage.vue'
import SourcesPage from './components/SourcesPage.vue'
import './custom.css'
import './home.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
    app.component('ArticleTags', ArticleTags)
    app.component('TagsPage', TagsPage)
    app.component('SourcesPage', SourcesPage)
  }
}
