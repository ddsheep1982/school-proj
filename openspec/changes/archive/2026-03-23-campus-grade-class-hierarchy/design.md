## Context

现有 `Class` 是独立的扁平实体（无父级）。需引入 `Campus` 和 `Grade` 两个新实体，形成三层层级。现有班级不能无条件要求填写年级（会破坏存量数据），因此迁移策略是创建默认实体后补填。

## Goals / Non-Goals

**Goals:**
- 三层层级：Campus → Grade → Class
- 管理员可对校区和年级执行完整 CRUD（含归档）
- 新建班级必须选择年级（gradeId 必填）
- 学生列表、班级列表支持按校区/年级筛选
- 存量班级通过迁移脚本分配到「默认校区 > 默认年级」

**Non-Goals:**
- 不支持跨校区班级
- 不修改学费结构、招生成本等财务模块的校区维度（后续迭代）
- 不做校区级别的权限隔离（RBAC 扩展留在未来）

## Decisions

**决策 1：数据模型 — `Campus → Grade → Class` 三张独立表**
- `Campus`：id, name, description?, archived, createdAt, updatedAt
- `Grade`：id, name, campusId (FK), archived, createdAt, updatedAt
- `Class`：新增 `gradeId String?`（迁移后可考虑改为必填，但保留可空以防边缘情况）
- 替代方案：在 Class 上直接加 `campusId + gradeName` 字段 — 数据冗余、无法独立管理年级，拒绝

**决策 2：`gradeId` 在数据库层保持可空（String?），但在 CreateClassSchema 中设为必填**
- 数据库可空：方便迁移脚本分步执行，避免锁表
- Schema 必填：新建班级必须传 gradeId，防止新数据出现孤立班级
- UpdateClassSchema：gradeId 可选（不强制更新）

**决策 3：迁移脚本（Prisma seed 扩展）而非 SQL**
- 在 `prisma/seed.ts` 中新增迁移逻辑：`upsert` 默认校区 → 默认年级 → `updateMany` 所有 gradeId=null 的班级
- 替代方案：手写 SQL migration — 与 Prisma 工作流不一致，维护难，拒绝

**决策 4：校区筛选通过学生→班级→年级→校区的 JOIN 实现**
- 学生筛选加 `campusId` / `gradeId` 参数时，通过 `class.grade.campusId` 做嵌套过滤
- 不在 Student 表上加冗余外键

## Risks / Trade-offs

- [风险] 现有 Class.name UNIQUE 约束：引入年级后可能出现「同名但不同年级」的班级 → 缓解：修改唯一约束为 `@@unique([name, gradeId])`（同一年级内班级名唯一）
- [风险] 存量班级 gradeId=null，运行迁移脚本前可能出现 NPE → 缓解：UI 中 gradeId 为空时展示「未分配」

## Migration Plan

1. `npx prisma migrate dev --name add-campus-grade` — 创建 Campus、Grade 表，Class 加 gradeId 可空列
2. `npm run db:seed` — upsert 默认校区/年级，updateMany 存量班级
3. 部署新代码 — 新班级强制选年级，旧班级显示「未分配」并可编辑补填
