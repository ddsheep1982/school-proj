## Context

系统已有 `getStudents()` 和 `getMonthlyFinancialBreakdown()` 两个查询，URL 参数驱动筛选。需在不改变现有数据层的前提下，新增两个 API Route 端点，读取查询结果并返回 Excel/PDF 二进制流供浏览器直接下载。

## Goals / Non-Goals

**Goals:**
- 导出学生列表（支持所有现有筛选参数）为 `.xlsx` 和 `.pdf`
- 导出财务收支年度明细为 `.xlsx` 和 `.pdf`
- 前端仅需点击按钮即可触发浏览器下载，无需额外交互
- 导出权限与现有页面一致（需登录，Admin/Staff 均可）

**Non-Goals:**
- 不支持自定义列选择
- 不支持后台异步任务（数据量小，同步生成即可）
- 不支持发送邮件或云端存储

## Decisions

**决策 1：使用 Next.js API Routes（`src/app/api/export/`）而非 Server Actions**
- Server Actions 只能返回 JSON，无法直接返回二进制流（Blob）
- API Route 可 `return new Response(buffer, { headers: { "Content-Disposition": "attachment;..." } })` 直接触发下载
- 替代方案：Base64 encode 后在 Server Action 返回，前端解码 — 性能差、实现繁琐，拒绝

**决策 2：Excel 使用 `exceljs`，PDF 使用 `pdfkit`**
- `exceljs`：纯 Node.js，支持 `.xlsx` 格式，API 简洁，打包体积合理
- `pdfkit`：纯 Node.js，适合表格型报表，无需 headless browser
- 替代方案（PDF）：`@react-pdf/renderer` — React 组件式声明，但需要更多配置且在 Route Handler 中使用较复杂，暂不选用
- 替代方案（PDF）：Puppeteer/playwright 截图 — 依赖重、不适合服务器端，拒绝

**决策 3：传参方式沿用 URL search params**
- 学生导出端点：`GET /api/export/students?format=xlsx&search=...&classId=...&enrollmentStatus=...`
- 财务导出端点：`GET /api/export/finance?format=xlsx&year=2026`
- 与现有页面 URL 参数完全一致，前端只需在当前 URL 基础上拼接 `/api/export/...`

**决策 4：前端用 `<a href="..." download>` 触发下载，无需 fetch**
- 直接跳转 API Route URL 即可触发浏览器下载，无需 JS 处理 Blob
- 导出按钮渲染为 Server Component 中的 `<a>` 链接，保持简单

## Risks / Trade-offs

- [风险] 学生数量较多时（500+）同步生成可能有延迟 → 缓解：目前数据规模小；若未来需要异步，可在 API Route 中加 streaming
- [风险] `pdfkit` 中文字体需内嵌或引用系统字体，否则中文乱码 → 缓解：在 `public/fonts/` 中内置一个开源中文字体（如 NotoSansSC-Regular.ttf）

## Migration Plan

无数据库变更。新增依赖和文件，直接部署。回滚只需删除 `src/app/api/export/` 目录并卸载依赖。
