# AI 文章发布工作流规范

版本：1.0（2026-10-30）
适用仓库：`E:\Workspace\Vue\game-dev-101`（GameDev Atlas）

本规范定义两种可重复的 AI 工作流：

1. **写作流**：一句话需求 + 一个或多个参考（PDF、Markdown、网页、视频）→ 一篇原创笔记。
2. **同步流**：把一个外部站点的文章批量同步进本站，并自动进入标签、词云、来源与侧边栏。

所有 AI 会话都应先读 `AGENTS.md` 与本文件，再开始操作。

---

## 1. 目标与边界

### 目标

- 文章可追溯到来源，但不逐字复制。
- 每篇文章有稳定的结构、标签与引用。
- 同步是幂等的：重复执行不会产生重复页面或脏数据。
- 每次发布都有可复现的门禁与验收读数。

### 边界

- 不手改同步文章（`docs/` 下除 `notes/` 外的 Markdown）。
- 不手改生成文件：`docs/.vitepress/data/*`、`docs/public/data/*`、`docs/tags/index.md`、`docs/sources/index.md`、`docs/notes/index.md`、各模块 `index.md`。
- 不把未授权来源批量搬运到站点。
- 不为了通过门禁而删除检查、放宽判据或伪造报告。

---

## 2. 目录与职责

| 路径 | 职责 |
| - | - |
| `docs/notes/*.md` | 本地原创笔记，唯一允许手写的文章目录 |
| `sources.json` | 同步来源配置 |
| `scripts/sync-docs.mjs` | 抓取、清洗、改写链接、生成标签/来源/笔记索引 |
| `scripts/tag-rules.json` | 标签词表与匹配规则 |
| `scripts/lib/tags.mjs` | 标签评分与词云布局 |
| `docs/.vitepress/data/` | 同步生成的 sidebars/tags/site 数据 |
| `docs/public/data/` | 客户端加载的 tag-index、sources-index、notes-index |
| `reports/mirror-report.json` | 每次同步的页面、失效链接、标签统计 |
| `.github/workflows/deploy.yml` | GitHub Pages 构建与发布 |

---

## 3. 写作流：一句话 + 参考 → 文章

### 3.1 输入

最小输入：

```text
根据 <参考文件/URL> 写一篇《<主题>》，面向 <读者>，重点 <目标>。
```

示例：

```text
根据 E:\Books\设计模式与游戏完美开发.pdf 写一篇《设计模式与游戏开发》，面向 Unity 独立开发者，重点是可执行清单。
```

### 3.2 步骤

1. **确认参考可读**
   - 文本 PDF：`pypdf` 提取；缺字体时安装 `fonttools`。
   - 扫描 PDF：读 PDF 书签/目录与页面图；没有 OCR 时不要假装读到了正文。
   - 网页/视频：先取元数据、目录、字幕或转录；没有逐字稿就用公开资料整理并注明。
2. **提炼结构**：列出参考的章节/主题，选 3–7 个能支撑主题的部分，不照搬目录。
3. **提出论点**：用一句话写文章的核心主张（读者读完应记住什么）。
4. **选标签**：`module-notes` + 3–5 个现有标签；不足时先按第 7 节新增规则。
5. **写文件**：`docs/notes/<kebab-case>.md`，使用第 6 节模板。
6. **同步**：`npm run sync`，让笔记进入 `notes-index`、标签索引与来源页。
7. **门禁**：content → tags → links → build。
8. **浏览器验收**：标题、标签、公式、Mermaid、代码、移动端。
9. **提交发布**：commit → push → Actions 成功 → 线上 200。

### 3.3 内容标准

- **原创整理**：用自己的结构重写，不复制长段落；引用原文观点时给出处。
- **长度**：正文约 1500–4000 中文字；过短说明信息密度不足，过长优先拆成多篇。
- **结构**：H1 下直接进入问题；3–7 个二级标题；结尾给检查清单与参考。
- **可执行**：至少包含一种具体载体——代码、公式、表格、参数、流程或检查清单。
- **引用**：文末「参考与延伸」列出原始链接；区分「原文」「参考笔记」「本文整理」。
- **不编造**：没有逐字稿/数据时明确写「基于公开资料整理」，不虚构引语、销量、税率、版本号。
- **合规**：税务、法律、平台政策类内容必须写「以官方为准」；不提供个别案例的法律结论。

---

## 4. 同步流：外部站点 → 本站

### 4.1 适用条件

- 来源站提供可抓取的 Markdown 页面，最好有 `llms.txt` 或完整索引；
- 内容可授权镜像，或在页脚保留来源与原文链接；
- 不抓取登录后内容、付费墙内容或明确禁止转载的站点。

### 4.2 配置

编辑 `sources.json`：

```json
{
  "sources": [
    {
      "id": "primary",
      "name": "主来源",
      "origin": "https://docs.example.com",
      "docsPath": "/docs/",
      "llms": "https://docs.example.com/llms.txt",
      "url": "https://docs.example.com/docs",
      "prefix": "",
      "enabled": true
    },
    {
      "id": "team-notes",
      "name": "团队笔记",
      "origin": "https://notes.example.com",
      "docsPath": "/",
      "llms": "https://notes.example.com/llms.txt",
      "url": "https://notes.example.com",
      "prefix": "sources/team-notes",
      "enabled": true
    }
  ]
}
```

规则：

- 第一个来源可以 `prefix: ""`，文章落在站点根路径；
- 附加来源必须使用 `sources/<id>`，避免路径冲突；
- `origin` 不带尾部斜杠；`docsPath` 以 `/` 结尾；
- 没有 `llms` 时，脚本从首页与导航做 BFS；页面发现可能不完整，需检查报告。

### 4.3 同步步骤

```bash
npm run sync          # 抓取 + 清洗 + 改写 + 生成标签/来源/词云
npm run check:content
npm run check:tags
npm run check:links
npm run build
```

同步会：

- 保留 `docs/index.md`、`docs/notes/`、`.vitepress/`、`public/`；
- 删除并重建同步文章、模块索引、标签页、来源页；
- 把失效链接降级为纯文本，并写入 `reports/mirror-report.json`；
- 给每篇文章写入 `tags`、`source`、`sourceName`、`sourceUrl`；
- 生成 `tag-index.json`、`sources-index.json`、`notes-index.json`。

### 4.4 同步后必查

- `reports/mirror-report.json`：页面数、失败目标、失效链接、重映射；
- 新来源是否出现在 `/sources/`；
- 抽样 3 篇新文章：标题、标签、来源链接、正文图片；
- 附加来源是否在 `sources/<id>/` 下，且侧边栏存在；
- 若来源语言/编码特殊（中文文件名、mojibake），检查页面是否 404 或链接断裂。

---

## 5. 生成文件：只读

以下文件由 `sync` 生成，手改会在下次同步被覆盖：

- `docs/.vitepress/data/{modules,sidebar,tags,site}.json`
- `docs/public/data/{tag-index,sources-index,notes-index}.json`
- `docs/tags/index.md`
- `docs/sources/index.md`
- `docs/notes/index.md`
- 各模块与附加来源的 `index.md`

需要改变它们的内容时，改 `sources.json`、`tag-rules.json`、`sync-docs.mjs` 或本地笔记，再同步。

---

## 6. 文章模板

```markdown
---
title: "文章标题"
description: "一句话说明读者能获得什么。"
tags: ["module-notes", "tag-a", "tag-b", "tag-c"]
source: "notes"
sourceName: "GameDev Atlas 笔记"
outline: [2, 3]
---

# 文章标题

<ArticleTags />

导语：问题是什么，为什么值得读，本文给出什么。

## 1. 背景与问题

## 2. 方法 / 模型 / 案例

## 3. 实现或落地

## 4. 取舍与风险

## 5. 检查清单

## 参考与延伸

- 原始来源：...
- 参考笔记：...
- 相关文档：...
```

要求：

- 文件名 kebab-case，例如 `dual-stick-aim-assist.md`。
- `title` 与 H1 一致；`description` 不写空话。
- H1 后必须有 `<ArticleTags />`。
- 标签 4–6 个，包含 `module-notes`；不要超过 6 个。
- `source` 固定为 `notes`；`sourceName` 默认 `GameDev Atlas 笔记`。
- 正文中不要出现未转义的 Vue 插值 `{{ }}` 或 `<script>`。
- 公式用 KaTeX（`$...$` / `$$...$$`）；代码块标注语言；Mermaid 只写简单、可验证的语法。
- 内部链接使用站点路径（如 `/Tech/Network_Architecture`），必须真实存在。

---

## 7. 标签规范

### 7.1 选择顺序

1. `module-notes`（本地笔记必带）；
2. 主题关键词（如 `combat`、`network`、`publishing`）；
3. 技术/领域标签（如 `unity`、`audio`、`narrative`）；
4. 最多 6 个，避免同义标签堆叠。

### 7.2 新增标签规则

编辑 `scripts/tag-rules.json` 的 `rules`：

```json
{
  "id": "patterns",
  "label": "设计模式",
  "patterns": ["设计模式", "Design Pattern", "\\bGoF\\b"]
}
```

规则：

- 模式要精确，优先用多词/边界匹配，避免「资源管理」这种泛词；
- 新增后 `npm run sync`，检查命中文章是否符合预期；
- 如果某篇文章误命中，优先收紧规则，而不是手动改同步文章；
- 标签 id 只使用小写 kebab-case，label 用中文/通用英文；
- `check:tags` 必须通过：标签计数要与文章 frontmatter 完全一致。

---

## 8. 验证门禁

### 8.1 命令

```bash
npm run check:content   # frontmatter、Mintlify 残留、Vue 风险、绝对源链
npm run check:tags      # 标签覆盖、计数、词云重叠
npm run check:links     # 站内链接、侧边栏链接、模块索引
npm run build           # 生产构建
```

任一失败都不得提交。不要通过删除检查或放宽判据来“修复”。

### 8.2 浏览器验收

```bash
npm run preview -- --host 127.0.0.1 --port 5173
```

检查：

- 文章 H1、标签数、来源行；
- 公式（`mjx-container`）与 Mermaid SVG 是否渲染；
- 代码块与表格是否溢出；
- 375–390px 宽度无横向滚动；
- 控制台无 error；
- 首页/标签页/笔记页仍正常。

### 8.3 预览进程

若 preview 返回旧页面、资源 404 或数据缺失：

1. 找到 5173 上的旧进程（包括 CLOSED/FIN_WAIT 状态）；
2. 彻底停止；
3. 重新启动，确认 HTML 引用的 `app.*.js` 返回 200。

不要同时启动多个 preview 指向不同构建。

---

## 9. Git 与发布

```bash
git status
git diff --stat
git add docs scripts reports sources.json README.md
git commit -m "新增<主题>笔记

<一句动机/范围>。"
git push origin main
```

规则：

- 只提交源文件，不提交 `node_modules`、`.cache`、`docs/.vitepress/dist`。
- 提交信息一行主题 + 2–3 个短子句，不写流水账。
- 不改写已发布历史、不 force push。
- 并发会话可能修改 HEAD：先 `git status`、`git log`、`git ls-remote`，在最新 HEAD 上追加提交；冲突时保留双方内容并重跑门禁。
- push 后查看 Actions；`completed success` 后再验证线上 URL 与数据文件 200。

---

## 10. 失败处理

| 现象 | 处理 |
| - | - |
| 扫描 PDF 无文本 | 读书签/目录与页面图；不要编造正文；必要时只写目录级综述并注明 |
| 网页 403 / 反爬 | 用搜索摘要定位，不把摘要当全文；找可引用的官方/转录来源 |
| 视频无字幕 | 用标题/简介/公开资料整理，标注「无逐字稿」；不编造引语 |
| `check:tags` 计数不一致 | 重跑 `sync`；检查是否有并发写入/手动改文；再查规则 |
| 构建失败 | 读完整错误；不要 `ignoreDeadLinks` 或删组件绕过 |
| Actions 失败 | 看 job 日志；区分门禁失败、构建失败、Pages 权限；修复后追加提交 |
| 线上 404 | 确认 Actions 成功、base path、文件名大小写、部署传播时间 |

---

## 11. Definition of Done

- [ ] 文章文件存在，frontmatter 完整，H1 + `<ArticleTags />`
- [ ] 4–6 个有效标签，计数与 `tag-index` 一致
- [ ] `sync` 后笔记索引/来源页/标签页包含该文
- [ ] content / tags / links / build 全绿
- [ ] 浏览器验收：公式/Mermaid/代码/移动端正常
- [ ] commit 已推送，Actions `completed success`
- [ ] 线上 URL 返回 200，数据 JSON 200
- [ ] 报告包含来源、限制与证据读数

---

## 12. 常用素材提取

| 素材 | 方法 |
| - | - |
| 文本 PDF | `pypdf` 提取；缺字体装 `fonttools` |
| 扫描 PDF | 读 PDF 书签与页面图；无 OCR 时只做目录级整理 |
| B 站视频 | `api.bilibili.com/x/web-interface/view?bvid=...` 取标题/简介/分P；字幕接口常为空 |
| GDC 演讲 | `github.com/dklassic/GDC-transcript` 的 `static/src/transcript/<youtube-id>.txt` |
| 网页 | WebFetch/curl；403 时改用搜索摘要做线索，不冒充全文 |
| YouTube 字幕 | 本机 yt-dlp 对部分视频不可用；不可用就明确说明 |

---

## 13. 示例

### 写作流

```text
根据 E:\Books\设计模式与游戏完美开发.pdf 写一篇《设计模式与游戏开发》，面向 Unity 独立开发者，重点是可执行清单。
```

产出：

- `docs/notes/design-patterns-game-dev.md`
- 标签：`module-notes, architecture, patterns, unity, algorithm, team`
- 跑 sync/gates/build，提交并发布。

### 同步流

```text
把 https://docs.example.com 作为第二个来源同步进来，保留现有内容。
```

产出：

- `sources.json` 增加 `prefix: "sources/example"`
- `npm run sync`
- 检查 `/sources/` 与 `sources/example/`、标签覆盖、死链报告
- 全部门禁与浏览器验收后提交。

---

## 14. 最后一条

规范服务于内容质量，不服务于形式。任何步骤如果让文章更差、让维护更贵，应该先讨论再调整规范本身。
