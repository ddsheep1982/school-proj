## Why

学生和家长的联系电话字段目前只做了"非空"校验，无法阻止录入格式错误的号码（如座机号、位数不足等），导致后续联系时出现无效号码。需要在录入时强制校验符合中国大陆手机号格式（1开头的11位数字）。

## What Changes

- 学生联系电话（`phone`）和家长联系电话（`guardianPhone`）的 Zod schema 增加中国手机号正则校验（`/^1[3-9]\d{9}$/`）
- 教师联系电话（`phone`）同样增加相同校验
- 新建和编辑学生表单在前端实时展示格式错误提示
- 新建和编辑教师表单同样展示格式错误提示
- 所有相关 Server Actions 在服务端同步校验，拒绝格式错误的号码

## Capabilities

### New Capabilities

- `phone-number-validation`: 对学生、家长、教师的手机号码进行中国大陆格式校验（1开头11位数字），在 Zod schema 层统一执行，前端表单实时展示错误提示

### Modified Capabilities

- `student-enrollment`: 新建/编辑学生时 `phone` 和 `guardianPhone` 字段须通过手机号格式校验

## Impact

- `src/types/index.ts`：修改 `CreateStudentSchema`、`UpdateStudentSchema`、`CreateTeacherSchema`、`UpdateTeacherSchema` 中的 phone / guardianPhone 字段校验规则
- `src/actions/student.actions.ts`、`src/actions/teacher.actions.ts`：校验错误将通过 Zod parse 自动返回，无需额外改动
- `src/components/students/StudentForm.tsx`：展示 phone / guardianPhone 的 Zod 错误信息
- `src/components/teachers/TeacherForm.tsx`（如存在）：展示 phone 的 Zod 错误信息
- 单元测试：`__tests__/unit/schemas.test.ts` 新增手机号格式校验测试用例
