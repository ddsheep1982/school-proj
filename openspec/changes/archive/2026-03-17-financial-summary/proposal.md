## Why

管理员目前无法直观地看到学校的财务全貌：学费收入来自哪些学生、招生费用支付给了哪些老师或代理，以及两者之间的净利润。需要一个统一的"费用"标签（Tab）和统计看板，帮助管理员监控收支状况。

## What Changes

- 在每个学生详情页新增"费用"Tab，展示该学生的学费缴纳记录及其招生费用成本
- 新增招生费用（RecruitmentCost）模型，记录为招募该学生实际支付给老师/代理的佣金金额
- 在管理后台新增"财务概览"页面，按时间范围统计：
  - 学费收入总额（来自 PaymentRecord）
  - 招生费用支出总额（来自 RecruitmentCost）
  - 净收入 = 学费收入 - 招生费用支出
- 可按学年、月份、班级筛选统计数据

## Capabilities

### New Capabilities
- `recruitment-costs`: 记录每位学生对应的招生费用（佣金），支持按老师或代理维度查询
- `financial-overview`: 管理后台财务概览页，统计学费收入、招生费用支出及净收入，支持时间/班级筛选
- `student-financial-tab`: 学生详情页"费用"Tab，汇总该学生的学费缴纳历史与招生成本

### Modified Capabilities

（无现有规格文件需要变更）

## Impact

- **Database**: 新增 `RecruitmentCost` 表（studentId, amount, paymentDate, recipientType, teacherId?, agentId?, notes）
- **Prisma schema**: `prisma/schema.prisma` 新增模型
- **Server actions**: 新增 `src/actions/recruitment-cost.actions.ts`、`src/lib/financial.queries.ts`
- **UI**:
  - `src/app/(dashboard)/students/[id]/page.tsx` 新增"费用"Tab
  - `src/app/(dashboard)/finance/page.tsx` 财务概览新页面
- **导航**: 侧边栏新增"财务"入口
