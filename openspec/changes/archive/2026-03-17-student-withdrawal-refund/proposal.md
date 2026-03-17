## Why

目前退学操作和退款记录是两个独立的步骤：管理员需要先办理退学，再单独去学生财务 Tab 添加退款记录。这导致操作分散，容易遗漏退款记录，也无法在退学时直观地看到应退金额。

## What Changes

- 在退学表单（WithdrawStudentForm）中新增可选的退款信息字段：退款金额、退款日期、退款原因、关联账单（可选）
- 退学提交时，若填写了退款金额，系统原子性地同时创建退学记录和 `RefundRecord`
- `withdrawStudent` Server Action 接受可选的退款字段，在同一事务中完成退学 + 退款记录写入
- 退学成功后跳转到学生详情页，财务 Tab 自动显示刚创建的退款记录

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `student-withdrawal`: 退学流程新增可选退款字段；`withdrawStudent` action 在单一事务中处理退款记录创建

## Impact

- `src/actions/student.actions.ts` — `withdrawStudent` 接受扩展后的 `WithdrawStudentSchema`（新增可选退款字段）
- `src/types/index.ts` — `WithdrawStudentSchema` 添加可选退款字段：`refundAmount?`, `refundDate?`, `refundReason?`, `refundInvoiceId?`
- `src/components/students/StudentActions.tsx` 或独立 `WithdrawStudentForm.tsx` — 退学 Dialog 中增加退款信息输入区域
- `prisma/schema.prisma` — 无变更（`RefundRecord` 模型已存在）
- 无破坏性变更：退款字段全部可选，现有退学流程不受影响
