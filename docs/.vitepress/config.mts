import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docsDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const dataDir = path.join(docsDir, '.vitepress', 'data')

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'))
  } catch {
    return fallback
  }
}

const modules = readJson('modules.json', [])
const sidebar = readJson('sidebar.json', { '/': [] })
const rawBase = process.env.BASE_PATH || ''
const base = rawBase ? `/${rawBase.replace(/^\/+|\/+$/g, '')}/` : '/'
const REPO_URL = 'https://github.com/Lx34r/game-dev-101'

const navOrder = ['Design', 'Tech', 'Case_Studies', 'Dev_Guides', 'Art', 'Audio']
const moreOrder = ['Unity_Standards', 'Guides', 'Research', 'Tools']
const moduleByDir = new Map(modules.map((module) => [module.dir, module]))

const nav = [
  ...navOrder
    .map((dir) => moduleByDir.get(dir))
    .filter(Boolean)
    .map((module) => ({ text: module.label, link: module.link })),
  {
    text: '更多',
    items: moreOrder
      .map((dir) => moduleByDir.get(dir))
      .filter(Boolean)
      .map((module) => ({ text: module.label, link: module.link }))
  },
  { text: '全站索引', link: '/Full_Index' }
]

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: '游戏开发 101',
    titleTemplate: false,
    description: '塔防 + Roguelike + 刷宝 的游戏开发知识库：设计、技术、美术、音频、案例与发行。',
    base,
    appearance: 'dark',
    cleanUrls: false,
    head: [
      ['meta', { name: 'theme-color', content: '#0b0c0e' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: '游戏开发 101' }],
      ['link', { rel: 'icon', href: `${base}logo.svg` }]
    ],
    sitemap: {
      hostname: 'https://lx34r.github.io/game-dev-101/'
    },
    markdown: {
      math: true
    },
    mermaid: {
      theme: 'dark'
    },
    themeConfig: {
      logo: '/logo.svg',
      siteTitle: '游戏开发 101',
      nav,
      sidebar,
      outline: {
        level: [2, 3],
        label: '本页目录'
      },
      search: {
        provider: 'local',
        options: {
          miniSearch: {
            options: {
              tokenize: (text) =>
                Array.from(
                  new Intl.Segmenter('zh-Hans', { granularity: 'word' }).segment(text),
                  (entry) => entry.segment
                ).filter((term) => /[\p{L}\p{N}]/u.test(term))
            },
            searchOptions: {
              fuzzy: 0.2,
              prefix: true,
              boost: { title: 4, text: 2, titles: 1 }
            }
          },
          translations: {
            button: {
              buttonText: '搜索文档',
              buttonAriaLabel: '搜索文档'
            },
            modal: {
              noResultsText: '没有找到结果',
              resetButtonTitle: '清除查询',
              footer: {
                selectText: '选择',
                navigateText: '切换',
                closeText: '关闭'
              }
            }
          }
        }
      },
      docFooter: {
        prev: '上一篇',
        next: '下一篇'
      },
      lastUpdated: false,
      returnToTopLabel: '回到顶部',
      sidebarMenuLabel: '目录',
      darkModeSwitchLabel: '主题',
      lightModeSwitchTitle: '切换到浅色模式',
      darkModeSwitchTitle: '切换到深色模式',
      socialLinks: [{ icon: 'github', link: REPO_URL }],
      footer: {
        message:
          '内容镜像自 <a href="https://docs.wanyouxi.online/docs" target="_blank" rel="noreferrer">游戏开发 101</a>，按原站结构整理，供离线阅读与检索。',
        copyright: '本站为可部署镜像站点'
      }
    }
  })
)
