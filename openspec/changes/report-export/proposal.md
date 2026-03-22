## Why

管理员目前只能在系统界面查看学生列表和财务数据，无法将数据导出用于存档、打印或二次处理（如 Excel 汇总、PDF 归档）。需要提供一键导出功能，让管理员可将当前筛选结果下载为 Excel 或 PDF 文件。

## What Changes

- 学生管理列表页新增"导出"按钮，支持将当前筛选条件下的学生列表导出为 `.xlsx` 或 `.pdf`
- 财务页新增"导出"按钮，支持将财务收支明细（含逐月分类：学费收入、招生提成、退费）导出为 `.xlsx` 或 `.pdf`
- 导出操作通过 Server Action 或 API Route 实现，文件直接下载到本地
- 不引入新的数据库表；导出数据从现有查询复用

## Capabilities

### New Capabilities

- `student-list-export`: 管理员可将学生列表（含当前所有筛选条件）导出为 Excel 或 PDF
- `financial-report-export`: 管理员可将财务收支明细（月度汇总表 + 明细记录）导出为 Excel 或 PDF

### Modified Capabilities

（无——导出为新增入口，不修改现有功能的需求行为）

## Impact

- **新依赖**：`exceljs`（Excel 生成）、`@react-pdf/renderer` 或 `pdfkit`（PDF 生成）
- **新文件**：`src/app/api/export/students/route.ts`、`src/app/api/export/finance/route.ts`（API Routes，返回二进制流）
- **UI 修改**：`src/app/(dashboard)/students/page.tsx`（加导出按钮）、`src/app/(dashboard)/finance/page.tsx`（加导出按钮）
- **查询复用**：`src/actions/student.actions.ts` → `getStudents`；`src/lib/financial.queries.ts` → `getMonthlyFinancialBreakdown`
