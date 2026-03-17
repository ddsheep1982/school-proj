## Context

退学流程当前由 `withdrawStudent` Server Action 处理，仅更新学生的 `withdrawalDate`、`withdrawalReason` 和 `enrollmentStatus`。退款记录通过独立的 `createRefundRecord` action 在学生详情页财务 Tab 单独创建。

现有相关代码：
- `WithdrawStudentSchema`（`src/types/index.ts:334`）：仅含 `withdrawalDate` + `withdrawalReason`
- `withdrawStudent` action（`src/actions/student.actions.ts:214`）：单次 Prisma update，无事务
- `CreateRefundRecordSchema`（`src/types/index.ts:340`）：独立 schema，含 `studentId`, `invoiceId?`, `amount`, `reason`, `refundDate`
- `RefundRecord` Prisma 模型已存在，无需 schema 变更

## Goals / Non-Goals

**Goals:**
- 退学表单中新增可选退款字段（金额、日期、原因、关联账单）
- `withdrawStudent` 在单一数据库事务中原子性完成退学更新 + RefundRecord 创建
- 退款字段全部可选，不填则行为与现有退学流程完全一致

**Non-Goals:**
- 不修改独立的退款录入入口（财务 Tab 的 RefundRecordForm 保持不变）
- 不自动计算退款金额（由管理员手动填写）
- 不修改 Prisma schema（RefundRecord 模型已满足需求）

## Decisions

### 决策 1：扩展 WithdrawStudentSchema，而非新建 schema

**选择**：在 `WithdrawStudentSchema` 上添加可选退款字段（`refundAmount?`, `refundDate?`, `refundReason?`, `refundInvoiceId?`），并用 `.superRefine` 校验：若填写了退款金额，则退款日期和退款原因为必填。

**备选方案**：新建独立的 `WithdrawWithRefundSchema`。

**理由**：扩展现有 schema 保持 action 接口一致，调用方只需传入一个对象。superRefine 可以表达"要么全不填，要么金额+日期+原因都填"的业务规则，无需新增接口。

---

### 决策 2：使用 prisma.$transaction() 保证原子性

**选择**：将 `withdrawStudent` 内部改为 `prisma.$transaction(async (tx) => { ... })`，在事务中依次执行 `tx.student.update` 和（若有退款）`tx.refundRecord.create`。

**备选方案**：顺序执行两个独立 Prisma 调用，失败时手动回滚。

**理由**：事务保证退学+退款要么同时成功、要么同时失败，避免退学成功但退款记录未写入的不一致状态。

---

### 决策 3：UI 在退学 Dialog 内新增可折叠退款区域

**选择**：在现有退学 Dialog（`StudentActions.tsx` 或独立 `WithdrawStudentForm`）底部增加"退款信息（可选）"区块，展示 `refundAmount`、`refundDate`、`refundReason`、`refundInvoiceId`（下拉选择学生已有账单）输入项。退款区域使用 checkbox 或展开式 UI，默认折叠。

**备选方案**：退款信息独立为退学后的第二步弹窗。

**理由**：单一表单提交体验更流畅，减少操作步骤；且退款字段全部可选，不影响不需要退款的退学操作。

## Risks / Trade-offs

- **[Risk] 账单下拉需要异步加载** → 退学 Dialog 打开时请求学生的未结清 Invoice 列表；若 Invoice 为空则隐藏下拉（退款可以不关联账单）。
- **[Risk] 数字输入精度** → 退款金额使用 `z.number().positive()` 校验，UI 使用 `type="number" step="0.01"` 输入，与现有 PaymentForm 保持一致。
- **[Trade-off] 退款字段可选性** → 不做退款是常见场景（如学生主动转学无退款），故退款区块默认隐藏，不增加常规退学的操作负担。

## Migration Plan

1. 修改 `WithdrawStudentSchema`（向后兼容，新字段全部可选）
2. 修改 `withdrawStudent` action 改用事务
3. 修改退学 UI 表单组件新增退款区块
4. 无数据库迁移，无部署顺序要求

## Open Questions

- 退学 Dialog 目前在 `StudentActions.tsx` 内联，还是已抽为独立组件？（需要确认后决定改哪个文件）
