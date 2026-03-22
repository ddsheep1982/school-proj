## Context

当前 `src/types/index.ts` 中学生、家长、教师的电话字段仅做 `z.string().min(1)` 非空校验。校验逻辑分散在四个 Schema（`CreateStudentSchema`、`UpdateStudentSchema`、`CreateTeacherSchema`、`UpdateTeacherSchema`）中，需统一升级为中国大陆手机号格式正则。前端表单（`StudentForm.tsx`）已有错误展示机制，可复用。

## Goals / Non-Goals

**Goals:**
- 在 Zod schema 层统一添加正则 `/^1[3-9]\d{9}$/` 校验
- 学生 `phone`、`guardianPhone`，教师 `phone` 共三个字段全部覆盖
- 前端表单实时展示友好的中文错误提示
- 单元测试覆盖合法号码、非法号码、空值等边界情况

**Non-Goals:**
- 不支持固定电话、香港/台湾号码格式
- 不做短信验证（实时验证号码真实性）
- 不修改数据库字段类型（仍为 String）
- 不对历史存量数据做迁移或补校验

## Decisions

**决策 1：正则选用 `/^1[3-9]\d{9}$/`**
- 覆盖中国大陆所有运营商号段（13x–19x，排除 12x 等无效前缀）
- 替代方案：仅校验 11 位数字 `/^\d{11}$/`，但无法排除非手机号格式，拒绝

**决策 2：在 Zod schema 层集中校验，不在 UI 层单独写正则**
- Server Action 已通过 `safeParse` 调用 Schema，错误自动抛出，无需额外改动 action 代码
- 前端复用 `errors` 对象展示 Zod 错误信息，保持一致的错误处理模式

**决策 3：`UpdateStudentSchema` / `UpdateTeacherSchema` 的 phone 字段为 optional**
- 编辑时字段可不传（partial update），但若传入则必须通过格式校验
- 实现：`.regex(...).optional()` 或 `z.string().regex(...).optional()`

## Risks / Trade-offs

- [风险] 存量数据中可能存在格式错误的号码，编辑这些学生时表单会预填非法值导致无法提交 → 缓解：编辑 Schema 中 phone 为 optional，用户可清空后重填；不阻断查看流程

## Migration Plan

无数据库迁移。仅 Schema + 前端展示层变更，直接部署即可。回滚只需还原 `src/types/index.ts` 相关行。
