import DefaultTheme from 'vitepress/theme'
import HomeModules from './components/HomeModules.vue'
import HomeHot from './components/HomeHot.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeModules', HomeModules)
    app.component('HomeHot', HomeHot)
  }
}
