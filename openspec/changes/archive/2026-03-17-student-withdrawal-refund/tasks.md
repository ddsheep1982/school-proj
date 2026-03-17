## 1. Schema 扩展

- [x] 1.1 在 `src/types/index.ts` 中扩展 `WithdrawStudentSchema`：新增可选字段 `refundAmount?`（正数）、`refundDate?`（datetime string）、`refundReason?`（min 1）、`refundInvoiceId?`（cuid），并用 `.superRefine` 校验：若提供了 `refundAmount` 则 `refundDate` 和 `refundReason` 为必填
- [x] 1.2 更新 `WithdrawStudentInput` 类型（由 `z.infer<typeof WithdrawStudentSchema>` 自动导出，确认导出正确）

## 2. TDD — 先写测试（RED）

- [x] 2.1 在 `__tests__/integration/student-management-enhancements.test.ts` 中新增测试用例：退学不带退款字段 → 不创建 RefundRecord；退学带完整退款字段 → 原子创建 RefundRecord；退学带不完整退款字段（仅 refundAmount）→ 返回校验错误；退款金额为 0 → 返回校验错误；refundInvoiceId 属于其他学生 → 返回错误
- [x] 2.2 运行 `npm run test:integration -- --testPathPattern student-management-enhancements` 确认新增测试 **RED（失败）**

## 3. Action 实现

- [x] 3.1 修改 `src/actions/student.actions.ts` 中的 `withdrawStudent`：将内部逻辑包裹在 `prisma.$transaction(async (tx) => { ... })` 中
- [x] 3.2 在事务内：若 `parsed.data.refundAmount` 存在且通过校验，则调用 `tx.refundRecord.create` 创建退款记录（`studentId`, `amount`, `refundDate`, `reason`, `invoiceId?`）
- [x] 3.3 若 `refundInvoiceId` 已提供，校验该 Invoice 的 `studentId` 等于被退学的学生 ID，不匹配时返回错误（事务自动回滚）
- [x] 3.4 `writeAuditLog` 调用保持在事务外（审计日志不影响业务原子性），记录退款字段是否被填写
- [x] 3.5 运行 `npm run test:integration -- --testPathPattern student-management-enhancements` 确认新增测试 **GREEN**

## 4. UI 修改

- [x] 4.1 在 `src/components/students/StudentActions.tsx` 中新增退款相关 state：`showRefund`（boolean，默认 false）、`refundAmount`、`refundDate`、`refundReason`、`refundInvoiceId`
- [x] 4.2 在退学 Dialog 底部新增"退款信息（可选）"区块：一个 checkbox「同时记录退款」控制 `showRefund`；展开后显示退款金额（number 输入）、退款日期（date 输入）、退款原因（text 输入）、关联账单 ID（text 输入，可选，可留空）
- [x] 4.3 更新 `handleWithdraw` 函数：当 `showRefund` 为 true 时，将退款字段附加到 `withdrawStudent` 的 input 参数中（refundDate 转换为 ISO datetime string）
- [x] 4.4 退款字段的简单前端校验：若勾选了「同时记录退款」则退款金额、日期、原因均不能为空，否则提示用户

## 5. 单元测试更新

- [x] 5.1 在 `__tests__/unit/schemas.test.ts` 中新增 `WithdrawStudentSchema` 测试：完整退款字段合法 → 通过；仅有 refundAmount 无其他退款字段 → 失败；refundAmount 为 0 → 失败；不带退款字段 → 通过（向后兼容）
- [x] 5.2 运行 `npm run test:unit` 确认所有单元测试 **GREEN**

## 6. 验证

- [x] 6.1 运行 `npm run test:integration` 确认所有集成测试套件通过
- [x] 6.2 运行 `npm run build` 确认 0 TypeScript 编译错误
