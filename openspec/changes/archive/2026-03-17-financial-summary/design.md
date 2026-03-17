## Context

系统已有 `PaymentRecord`（学费收款记录）和 `Student`（含 `recruitmentTeacher`/`recruitmentAgent` 关联）。但目前没有任何模型记录"学校为招募该学生实际支付了多少佣金"——只有招募渠道类型和来源，没有金额。

本次变更引入 `RecruitmentCost` 模型，补全支出侧数据；并在此基础上构建财务统计查询和 UI。

## Goals / Non-Goals

**Goals:**
- 新增 `RecruitmentCost` 表，按学生记录招生佣金支付（金额、日期、收款方）
- 财务概览页：按时间范围/班级聚合学费收入、招生费用、净收入
- 学生详情"费用"Tab：该学生的学费缴纳历史 + 招生成本
- 招生费用 CRUD（管理员可录入、删除）

**Non-Goals:**
- 自动从合同/协议生成佣金（手动录入即可）
- 多币种
- 财务报表导出（CSV/PDF）
- 应收账款/催收（已由 fee-management 覆盖）

## Decisions

### 1. RecruitmentCost 独立建模，不复用 PaymentRecord
**Decision**: 新增独立的 `RecruitmentCost` 模型，而非在 `PaymentRecord` 上加 `type` 字段区分收入/支出。

**Rationale**: `PaymentRecord` 语义上是"学生缴给学校的钱"（收入方向），而招生费用是"学校付给老师/代理的钱"（支出方向）。混在同一张表会使查询复杂，且违反现有的不可变支付记录设计。

**Alternative considered**: 在 `PaymentRecord` 加 `direction` 枚举。Rejected：破坏既有语义，需要修改现有查询、统计、UI。

---

### 2. 财务统计在 Server Component 查询层做，不做缓存
**Decision**: 统计查询（`getFinancialSummary`）作为纯 Prisma 聚合，放在 `src/lib/financial.queries.ts`，由 Server Component 直接调用，不引入额外缓存层。

**Rationale**: 数据量小（单校几百到几千条），PostgreSQL 聚合足够快；Next.js 的 full-route cache 已提供页面级缓存。

---

### 3. 招生费用收款方用 recipientType + 可选 FK 表示
**Decision**: `RecruitmentCost` 上有 `recipientType: TEACHER | AGENT`、`teacherId?`、`agentId?`，与 `Student.recruitmentChannelType` 保持一致。

**Rationale**: 便于按老师/代理汇总支出，同时保持与现有招募渠道模型的一致性。

## Risks / Trade-offs

- **数据录入负担**: 招生费用需手动录入，管理员可能忘记录入导致统计不准。→ 文档注明此为手动数据，统计旁加"基于已录入数据"说明。
- **与 PaymentRecord 时间不对齐**: 学费收款日期 vs 佣金支付日期可能不同。→ 两者均存储独立日期字段，统计时分别按各自日期过滤，不强制对齐。

## Migration Plan

1. 在 `prisma/schema.prisma` 新增 `RecruitmentCost` 模型。
2. `prisma migrate dev --name add-recruitment-cost`，无需数据回填。
3. 回滚：删除新表，无数据丢失。
