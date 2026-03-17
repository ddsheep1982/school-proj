## Why

目前系统缺少学生和班级的删除功能，退学退费流程没有记录机制，且每个学生只关联一位招生老师，无法追踪接待老师的贡献和奖励。这些功能是日常运营中的基本需求。

## What Changes

- **删除学生**：支持软删除（退学）和硬删除，退学时需填写退学原因；退学操作需要记录退费情况
- **删除班级**：支持删除无在读学生的班级；有学生的班级不可删除
- **退费记录**：学生退学时记录退还金额、退费原因，与对应发票/缴费记录关联
- **接待老师**：学生档案增加「接待老师」字段（独立于招生老师），接待老师同样可以配置招生奖励金额
- **接待老师奖励**：`RecruitmentCost` 记录扩展，支持接待老师作为奖励接收方

## Capabilities

### New Capabilities
- `student-withdrawal`: 学生退学流程——退学状态、退费记录（金额、原因、关联发票）
- `reception-teacher`: 每个学生新增接待老师字段，接待老师奖励记录与展示

### Modified Capabilities
- `payments`: 支持退费记录（负向或独立退款条目）
- `fee-assignments`: 退学学生的未付发票处理（自动豁免或保留）
- `student-financial-tab`: 新增退费记录展示和接待老师奖励展示

## Impact

- **Prisma schema**: `Student` 新增 `receptionTeacherId`、`withdrawalDate`、`withdrawalReason`；新增 `RefundRecord` 模型；`RecruitmentCost` 扩展接待老师类型
- **Server Actions**: 新增 `withdrawStudent`、`deleteStudent`、`deleteClass`、`createRefundRecord`
- **UI**: 学生列表/详情页增加退学按钮、退费表单；班级列表增加删除按钮；学生财务 Tab 展示退费记录；接待老师选择器
