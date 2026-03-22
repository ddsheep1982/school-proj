## 1. Unit Tests (RED — write failing tests first)

- [x] 1.1 In `__tests__/unit/schemas.test.ts`, add test cases for `CreateStudentSchema`: valid phone accepted, 10-digit number rejected, invalid prefix (120...) rejected, non-numeric characters rejected, empty phone rejected
- [x] 1.2 Add test cases for `CreateStudentSchema` `guardianPhone`: same format validations as above
- [x] 1.3 Add test cases for `UpdateStudentSchema`: valid phone accepted when present, invalid phone rejected when present, missing phone field accepted
- [x] 1.4 Add test cases for `CreateTeacherSchema` and `UpdateTeacherSchema` phone field with same validations

## 2. Schema Changes

- [x] 2.1 In `src/types/index.ts`, define a shared phone regex constant: `const cnMobilePhone = /^1[3-9]\d{9}$/`
- [x] 2.2 Update `CreateStudentSchema`: replace `phone` and `guardianPhone` `.min(1, ...)` with `.regex(cnMobilePhone, "请输入有效的11位中国大陆手机号码")`
- [x] 2.3 Update `UpdateStudentSchema`: replace `phone` and `guardianPhone` with `.regex(cnMobilePhone, "请输入有效的11位中国大陆手机号码").optional()`
- [x] 2.4 Update `CreateTeacherSchema`: replace `phone` with `.regex(cnMobilePhone, "请输入有效的11位中国大陆手机号码")`
- [x] 2.5 Update `UpdateTeacherSchema`: replace `phone` with `.regex(cnMobilePhone, "请输入有效的11位中国大陆手机号码").optional()`
- [x] 2.6 Run `npm run test:unit` — all new tests should now pass (GREEN)

## 3. Frontend Form Error Display

- [x] 3.1 In `src/components/students/StudentForm.tsx`, add field-level error state (`fieldErrors`) parsed from the server action result; display error message below the `phone` input
- [x] 3.2 Display error message below the `guardianPhone` input in `StudentForm.tsx`
- [x] 3.3 In `src/app/(dashboard)/teachers/new/page.tsx`, display Zod field-level error below the `phone` input after submit
- [x] 3.4 In `src/app/(dashboard)/teachers/[id]/edit/EditTeacherForm.tsx`, display Zod field-level error below the `phone` input after submit

## 4. Verify End-to-End

- [ ] 4.1 Manually test creating a student with an invalid phone — confirm error message appears in form
- [ ] 4.2 Manually test creating a teacher with an invalid phone — confirm error message appears
- [ ] 4.3 Manually test with a valid phone (e.g., `13812345678`) — confirm form submits successfully

