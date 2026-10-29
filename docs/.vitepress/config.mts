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
    items: [
      ...moreOrder
        .map((dir) => moduleByDir.get(dir))
        .filter(Boolean)
        .map((module) => ({ text: module.label, link: module.link })),
      { text: '内容来源', link: '/sources/' }
    ]
  },
  { text: '笔记', link: '/notes/' },
  { text: '标签', link: '/tags/' },
  { text: '全站索引', link: '/Full_Index' }
]

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: 'GameDev Atlas',
    titleTemplate: false,
    description: '面向独立游戏团队的设计与工程知识库：数值、机制、技术、美术、音频与发行。',
    base,
    appearance: 'dark',
    cleanUrls: false,
    head: [
      ['meta', { name: 'theme-color', content: '#0b0c0e' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'GameDev Atlas' }],
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
      siteTitle: 'GameDev Atlas',
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
        message: `本站是可持续同步的开发知识备忘站。各文章来源与同步状态见 <a href="${base}sources/">内容来源</a>。`,
        copyright: 'GameDev Atlas · 开发知识备忘站'
      }
    }
  })
)
