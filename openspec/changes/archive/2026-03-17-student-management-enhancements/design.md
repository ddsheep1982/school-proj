## Context

系统当前已有学生、班级、招生老师、费用管理等模块。学生记录无退学状态，班级无删除入口，招生奖励只记录招生老师/代理，不支持接待老师。`RecruitmentCost` 已有 `TEACHER | AGENT` 两种类型枚举。

## Goals / Non-Goals

**Goals:**
- 支持学生软删除（退学，保留历史记录）和硬删除（无任何关联数据时）
- 支持班级删除（无在读学生时）
- 退学时可记录退费金额、原因，关联原发票
- 学生档案增加接待老师，接待老师可记录奖励费用
- 接待老师奖励在财务 Tab 中可见

**Non-Goals:**
- 自动计算退费金额（由用户手动填写）
- 接待老师的系统账户/登录权限（复用现有 `EnrollmentTeacher` 表）
- 批量退学

## Decisions

### 1. 学生退学用软删除

**决定**：新增 `withdrawalDate DateTime?` 和 `withdrawalReason String?` 字段，不物理删除记录。

**理由**：学生有关联的缴费、发票、考勤等数据，物理删除会破坏财务历史。保留记录并标记退学状态，列表默认过滤已退学学生，管理员可查看全部。

**替代方案**：独立的 `WithdrawalRecord` 表 → 复杂度高，且查询时需 JOIN；软删除字段更简单。

### 2. 退费记录用独立模型 `RefundRecord`

**决定**：新增 `RefundRecord` 模型，关联 `studentId`、`invoiceId?`、`amount`、`reason`、`refundDate`、`createdById`。

**理由**：退费是独立的财务事件，需要审计追踪；与发票松耦合（`invoiceId` 可选，因为可能退的是一笔总款而非特定发票）。

**替代方案**：在 `PaymentRecord` 中用负数金额表示退款 → 会破坏现有支付逻辑，报表区分困难。

### 3. 接待老师复用 `EnrollmentTeacher` 表

**决定**：`Student` 新增 `receptionTeacherId String?`（FK 到 `EnrollmentTeacher`），不新建表。

**理由**：接待老师与招生老师是同一批人，只是角色不同；复用现有表减少冗余，代码更简单。

### 4. 接待老师奖励扩展 `RecruitmentCostRecipientType` 枚举

**决定**：扩展枚举：`TEACHER | AGENT | RECEPTION_TEACHER`，`RecruitmentCost` 的 `teacherId` 字段复用给接待老师。

**理由**：数据结构完全相同（金额、日期、老师 ID），只是语义不同；避免新建字段或表。

### 5. 班级删除：有学生则拒绝

**决定**：`deleteClass` action 检查是否有状态为 ACTIVE 的 Enrollment，有则返回错误，不级联删除。

**理由**：保护数据一致性；用户应先处理学生转班或退学后再删除班级。

## Risks / Trade-offs

- **退学学生的未付发票**：退学后发票仍处于 OUTSTANDING 状态。不自动豁免，由管理员手动处理（豁免或退费）。→ 缓解：退学时在 UI 展示未付发票提示
- **枚举扩展迁移**：`RecruitmentCostRecipientType` 增加值需要 Prisma migration，已有数据不受影响。→ 无风险
- **硬删除学生条件**：当学生有关联记录时禁止硬删除，只允许软删除（退学）。→ 在 action 中校验

## Migration Plan

1. 运行 `prisma migrate dev` 添加新字段和模型
2. 现有学生数据：`withdrawalDate` 为 null（未退学），`receptionTeacherId` 为 null（无接待老师）
3. 无破坏性变更，无需数据回填
4. 回滚：`prisma migrate resolve --rolled-back` 配合 revert commit
