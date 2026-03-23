## Why

目前系统中只有「班级」一个维度，无法区分不同校区和年级。随着学校规模扩展，需要将班级组织成「学院（校区）→ 年级 → 班级」三层层级，使管理员可以按校区和年级快速筛选、管理学生和班级。

## What Changes

- 新增 `Campus`（学院/校区）实体，支持 CRUD 管理
- 新增 `Grade`（年级）实体，隶属于校区，支持 CRUD 管理
- 现有 `Class`（班级）新增 `gradeId` 外键，关联到年级（从而间接关联到校区）
- 现有班级数据通过数据库迁移自动分配到「默认校区」下的「默认年级」
- 班级列表、学生筛选支持按校区/年级过滤
- 新建/编辑班级时需选择所属年级

## Capabilities

### New Capabilities

- `campus-management`: 管理员可创建、编辑、归档校区（学院）
- `grade-management`: 管理员可在校区下创建、编辑、归档年级

### Modified Capabilities

- `class-management`: 班级新增所属年级字段；班级列表支持按校区/年级筛选；新建/编辑班级需选择年级

## Impact

- **数据库**：新增 `Campus`、`Grade` 表；`Class` 新增 `gradeId`（可空，用于迁移）
- **Prisma schema**：`prisma/schema.prisma` 新增两个 model，修改 `Class` model
- **迁移脚本**：创建默认校区和默认年级，将所有现有班级的 `gradeId` 指向默认年级
- **Server Actions**：新增 `campus.actions.ts`、`grade.actions.ts`；修改 `class.actions.ts` 支持 `gradeId`
- **UI**：新增校区管理页、年级管理页；修改班级管理页（新增筛选 + 年级选择）；修改学生筛选（按校区/年级过滤）
- **Zod schemas**：`src/types/index.ts` 新增 `CreateCampusSchema`、`CreateGradeSchema`；修改 `CreateClassSchema`/`UpdateClassSchema`
