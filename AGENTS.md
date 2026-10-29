# GameDev Atlas · AI 工作规范

本仓库的 AI 写作、内容同步与发布必须遵循 [AI_ARTICLE_WORKFLOW.md](AI_ARTICLE_WORKFLOW.md)。

## 硬规则

1. **本地笔记只写 `docs/notes/*.md`**。不要手改 `docs/` 下的同步文章、模块索引、`tags/index.md`、`sources/index.md`、`sidebar.json`、`tag-index.json`、`notes-index.json`。
2. **新文章来源只改 `sources.json`**，然后执行 `npm run sync`。主来源 `prefix` 留空；附加来源使用 `sources/<id>`。
3. **标签先查 `scripts/tag-rules.json`**。新增规则必须精确，跑 `npm run check:tags` 验证没有假阳性；不要用「资源管理」这类泛词。
4. **发布顺序固定**：`sync → check:content → check:tags → check:links → build → preview/浏览器验收 → commit/push → Actions 成功`。
5. **不逐字搬运参考内容**。文章必须是原创整理；标注来源；没有逐字稿就注明「基于公开资料整理」，不编造引语。
6. **不改写 git 历史、不 force push**。发现并发提交先读 `git status`、`git log`、`git ls-remote`，在最新 HEAD 上追加提交。
7. **完成必须报告证据**：改动文件、命令读数、commit、线上 URL、已知限制。

## 常用命令

```bash
npm run sync
npm run check:content
npm run check:tags
npm run check:links
npm run build
npm run preview -- --host 127.0.0.1 --port 5173
```

本地预览若 404 或资源缺失，先彻底停止 5173 上的旧进程再启动，不能同时开多个 preview。
