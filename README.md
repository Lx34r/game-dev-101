# GameDev Atlas · 开发知识备忘站

面向独立游戏团队的设计与工程知识备忘站：从多个站点同步文章，自动生成主题标签，并提供标签筛选与词云。使用 VitePress 构建，通过 GitHub Pages 发布。

## AI 工作流

写作、同步与发布规范见 [AI_ARTICLE_WORKFLOW.md](AI_ARTICLE_WORKFLOW.md)，AI 会话的硬规则见 [AGENTS.md](AGENTS.md)。

## 本地开发

```bash
npm install
npm run dev
```

## 同步与校验

```bash
npm run sync          # 按 sources.json 同步全部来源，生成标签与词云数据
npm run check:content # 检查同步残留与 Vue 模板风险
npm run check:tags    # 检查标签覆盖、计数与词云重叠
npm run check:links   # 检查站内链接
npm run build         # 生产构建
```

`npm run sync` 会重建 `docs/` 下的同步文章（保留首页、主题与静态资源），并把来源、失效链接与图片落地情况写入 [reports/mirror-report.json](reports/mirror-report.json)。标签、来源与词云数据生成在 `docs/public/data/` 与 `docs/.vitepress/data/`。

## 添加来源

在 [sources.json](sources.json) 增加一条配置后执行 `npm run sync`：

```json
{
  "id": "team-notes",
  "name": "团队笔记",
  "origin": "https://example.com",
  "docsPath": "/docs/",
  "llms": "https://example.com/llms.txt",
  "url": "https://example.com/docs",
  "prefix": "sources/team-notes",
  "enabled": true
}
```

- 第一个来源可以留空 `prefix`，文章直接位于站点根路径。
- 附加来源使用 `sources/<id>` 作为前缀，避免路径冲突。
- 标签规则在 [scripts/tag-rules.json](scripts/tag-rules.json) 维护，新增规则后重新同步。

## 本地笔记

在 `docs/notes/` 新建 Markdown，frontmatter 写 `title`、`description`、`tags` 与 `source: "notes"`，正文 H1 下放 `<ArticleTags />`。`npm run sync` 会保留笔记，并把它们加入笔记索引、标签与词云。

## 目录

- `docs/`：同步文章、首页与生成页面
- `docs/.vitepress/`：站点配置、主题、组件与生成数据
- `docs/public/data/`：标签索引与来源索引（客户端加载）
- `scripts/sync-docs.mjs`：多来源抓取、清洗、链接重写与页面生成
- `scripts/lib/tags.mjs`：标签评分与词云布局
- `scripts/check-*.mjs`：内容、标签与链接门禁
- `.github/workflows/deploy.yml`：GitHub Pages 构建与发布

## 内容说明

同步文章的版权归各来源作者所有；文章页保留来源与原文地址，失效链接在同步时降级为纯文本并记录在报告中。
