import DefaultTheme from 'vitepress/theme'
import HomePage from './components/HomePage.vue'
import './custom.css'
import './home.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
  }
}
