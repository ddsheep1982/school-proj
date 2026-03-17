## 1. 数据库 Schema 变更

- [x] 1.1 在 `Student` 模型中新增 `withdrawalDate DateTime?`、`withdrawalReason String?`、`receptionTeacherId String?`（FK 到 `EnrollmentTeacher`）
- [x] 1.2 在 `EnrollmentTeacher` 模型中新增 back-relation `receptionStudents Student[]`
- [x] 1.3 在 `RecruitmentCostRecipientType` 枚举中新增 `RECEPTION_TEACHER` 值
- [x] 1.4 新增 `RefundRecord` 模型（id, studentId, invoiceId?, amount Decimal, reason, refundDate, createdById, createdAt）
- [x] 1.5 在 `Student`、`Invoice`、`User` 模型中新增对 `RefundRecord` 的 back-relation
- [x] 1.6 运行 `npx prisma migrate dev --name add_student_management_enhancements` 生成迁移文件
- [x] 1.7 运行 `npx prisma generate` 重新生成 Prisma Client

## 2. Zod Schema 和类型更新

- [x] 2.1 在 `src/types/index.ts` 中新增 `WithdrawStudentSchema`（withdrawalDate, withdrawalReason）
- [x] 2.2 在 `src/types/index.ts` 中新增 `CreateRefundRecordSchema`（studentId, invoiceId?, amount, reason, refundDate）
- [x] 2.3 扩展 `RecruitmentCostRecipientTypeEnum` 增加 `RECEPTION_TEACHER` 值
- [x] 2.4 更新 `CreateRecruitmentCostSchema` 以支持 `RECEPTION_TEACHER` 类型
- [x] 2.5 更新 `StudentFinancialSummary` 接口新增 `totalRefunded` 字段

## 3. Server Actions

- [x] 3.1 在 `src/actions/student.actions.ts` 中新增 `withdrawStudent(id, data)` action（requireRole ADMIN，设置 withdrawalDate/withdrawalReason，写审计日志）
- [x] 3.2 在 `src/actions/student.actions.ts` 中新增 `deleteStudent(id)` action（requireRole ADMIN，检查无关联记录，永久删除，写审计日志）
- [x] 3.3 更新 `getStudents()` action，默认过滤已退学学生，支持 `includeWithdrawn?: boolean` 参数
- [x] 3.4 更新 `createStudent()` 和 `updateStudent()` actions 以支持 `receptionTeacherId` 字段
- [x] 3.5 在 `src/actions/class.actions.ts` 中新增 `deleteClass(id)` action（requireRole ADMIN，检查无活跃学生，永久删除，写审计日志）
- [x] 3.6 新建 `src/actions/refund.actions.ts`，实现 `createRefundRecord`、`getRefundsByStudent`、`deleteRefundRecord` actions（均需 requireRole ADMIN，写审计日志）
- [x] 3.7 更新 `src/actions/recruitment-cost.actions.ts` 的 `createRecruitmentCost` 以支持 `RECEPTION_TEACHER` 类型（teacherId 必填）

## 4. UI — 学生列表与删除/退学

- [x] 4.1 在 `src/components/students/StudentList.tsx` 中新增"退学"按钮（弹出表单填写退学日期和原因）
- [x] 4.2 在 `src/components/students/StudentList.tsx` 中新增"删除"按钮（仅当学生无关联记录时显示或允许点击）
- [x] 4.3 在学生列表页 `src/app/(dashboard)/students/page.tsx` 中新增"显示已退学"切换，传入 `includeWithdrawn` 参数
- [x] 4.4 在学生列表中为已退学学生展示退学标记（如灰色文字 + "已退学" badge）

## 5. UI — 班级删除

- [x] 5.1 在 `src/components/classes/ClassList.tsx`（或对应组件）中新增"删除"按钮，调用 `deleteClass` action
- [x] 5.2 有活跃学生的班级显示删除按钮为禁用或隐藏，提示"有在读学生不可删除"

## 6. UI — 接待老师

- [x] 6.1 在学生创建/编辑表单中新增接待老师下拉选择器（复用 teachers 列表数据）
- [x] 6.2 在学生详情页基本信息区域展示接待老师姓名（无则显示"无"）
- [x] 6.3 在招生费用记录表单（RecruitmentCostForm）中的 recipientType 选项增加"接待老师"，选择后显示老师下拉
- [x] 6.4 更新 `RecruitmentCostList` 组件，对 `RECEPTION_TEACHER` 类型显示"接待老师"标签

## 7. UI — 退费记录

- [x] 7.1 新建 `src/components/finance/RefundRecordForm.tsx`（金额、原因、日期、可选关联发票）
- [x] 7.2 新建 `src/components/finance/RefundRecordList.tsx`（展示退费记录列表，支持删除）
- [x] 7.3 在 `src/components/finance/StudentFinancialTab.tsx` 中新增退费记录区块（RefundRecordForm + RefundRecordList）
- [x] 7.4 更新 `StudentFinancialTab` 的汇总数字，加入 `totalRefunded`，更新 netContribution 计算
- [x] 7.5 在 `StudentFinancialTab` 顶部展示退学状态（若已退学，显示退学日期和原因）
- [x] 7.6 更新 `src/app/(dashboard)/students/[id]/page.tsx`，在 `finance` tab 中额外 fetch `getRefundsByStudent(id)` 数据

## 8. 单元测试

- [x] 8.1 为 `withdrawStudent` action 写单元/集成测试（成功退学、重复退学报错）
- [x] 8.2 为 `deleteStudent` action 写测试（无记录可删、有记录报错）
- [x] 8.3 为 `deleteClass` action 写测试（空班级可删、有活跃学生报错）
- [x] 8.4 为 `createRefundRecord` / `deleteRefundRecord` action 写测试（发票匹配校验）
