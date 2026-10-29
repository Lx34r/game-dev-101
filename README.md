# 游戏开发 101 · 知识库镜像

塔防 + Roguelike + 刷宝方向的游戏开发文档站点。内容镜像自 [docs.wanyouxi.online](https://docs.wanyouxi.online/docs)，使用 VitePress 构建，通过 GitHub Pages 发布。

## 本地开发

```bash
npm install
npm run dev
```

## 构建与校验

```bash
npm run sync        # 从原站重新抓取并清洗内容
npm run check:content # 检查镜像内容残留与 Vue 模板风险
npm run check:links # 检查站内链接
npm run build       # 生产构建
```

`npm run sync` 会重建 `docs/` 下的镜像内容（保留首页、主题与静态资源），并把抓取统计、失效链接与图片落地情况写入 [reports/mirror-report.json](reports/mirror-report.json)。

## 目录

- `docs/`：镜像后的 Markdown 内容与站点首页
- `docs/.vitepress/`：站点配置、主题、组件，以及同步生成的侧边栏数据
- `scripts/sync-docs.mjs`：抓取、清洗、链接重写、侧边栏生成
- `scripts/check-links.mjs`：站内链接校验
- `.github/workflows/deploy.yml`：GitHub Pages 构建与发布

## 内容说明

文档版权归原站作者所有；本仓库仅做结构镜像与离线检索，页脚保留原站出处链接。原站中已失效的链接在镜像中降级为纯文本，并在同步报告中记录。
