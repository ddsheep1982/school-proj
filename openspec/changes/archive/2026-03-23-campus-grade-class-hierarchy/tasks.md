## 1. Database Schema

- [x] 1.1 In `prisma/schema.prisma`, add `Campus` model: `id`, `name String @unique`, `description String?`, `archived Boolean @default(false)`, `createdAt`, `updatedAt`, relation: `grades Grade[]`
- [x] 1.2 Add `Grade` model: `id`, `name String`, `campusId String`, `campus Campus` (FK), `archived Boolean @default(false)`, `createdAt`, `updatedAt`, `classes Class[]`, `@@unique([name, campusId])`
- [x] 1.3 Add `gradeId String?` to `Class` model with relation `grade Grade? @relation(fields: [gradeId], references: [id])`; change `name` uniqueness from `@unique` to `@@unique([name, gradeId])`
- [x] 1.4 Run `npx prisma migrate dev --name add-campus-grade` to apply schema changes

## 2. Seed / Migration for Existing Data

- [x] 2.1 In `prisma/seed.ts`, add upsert for a "默认校区" Campus (use a fixed id or find-by-name)
- [x] 2.2 Add upsert for a "默认年级" Grade linked to "默认校区"
- [x] 2.3 Add `updateMany` to assign all existing Classes where `gradeId IS NULL` to the "默认年级"
- [x] 2.4 Run `npm run db:seed` to apply migration data

## 3. Zod Schemas & Types

- [x] 3.1 In `src/types/index.ts`, add `CreateCampusSchema` (name required), `UpdateCampusSchema` (name/description/archived optional)
- [x] 3.2 Add `CreateGradeSchema` (name + campusId required), `UpdateGradeSchema` (name/archived optional)
- [x] 3.3 Update `CreateClassSchema`: add `gradeId: z.string().cuid("请选择年级")`
- [x] 3.4 Update `UpdateClassSchema`: add `gradeId: z.string().cuid().optional()`
- [x] 3.5 Add `campusId` and `gradeId` optional fields to `StudentFiltersSchema`

## 4. Server Actions

- [x] 4.1 Create `src/actions/campus.actions.ts` with: `createCampus`, `updateCampus`, `getCampuses` (returns all non-archived + grade count), `deleteCampus` (block if has grades)
- [x] 4.2 Create `src/actions/grade.actions.ts` with: `createGrade`, `updateGrade`, `getGrades(campusId?)` (returns grades with class count), `deleteGrade` (block if has classes)
- [x] 4.3 Update `src/actions/class.actions.ts`: pass `gradeId` in `createClass` and `updateClass`; update `getClasses()` to include `grade { id, name, campus { id, name } }` in returned type; add optional `gradeId`/`campusId` filter params to `getClasses()`
- [x] 4.4 Update `src/actions/student.actions.ts` `getStudents()`: handle new `gradeId` and `campusId` filters using nested `class.gradeId` / `class.grade.campusId` Prisma where conditions

## 5. Campus Management Pages

- [x] 5.1 Create `src/app/(dashboard)/campuses/page.tsx` — list of campuses with grade count; "新建校区" button
- [x] 5.2 Create `src/app/(dashboard)/campuses/new/page.tsx` — form to create campus (name + optional description)
- [x] 5.3 Create `src/app/(dashboard)/campuses/[id]/edit/page.tsx` — edit campus form

## 6. Grade Management Pages

- [x] 6.1 Create `src/app/(dashboard)/grades/page.tsx` — list of grades with campus label and class count; filter by campus; "新建年级" button
- [x] 6.2 Create `src/app/(dashboard)/grades/new/page.tsx` — form to create grade (name + campus select)
- [x] 6.3 Create `src/app/(dashboard)/grades/[id]/edit/page.tsx` — edit grade form

## 7. Update Class Management Pages

- [x] 7.1 Update class create/edit form (`src/app/(dashboard)/classes/`) to include a grade selector (cascading: first select campus, then grade)
- [x] 7.2 Update class list page to show the grade and campus columns; add campus/grade filter dropdowns
- [x] 7.3 Update `getClasses()` call sites to pass `gradeId`/`campusId` filter from URL params

## 8. Update Student Filtering

- [x] 8.1 Update `src/app/(dashboard)/students/page.tsx` filter bar to add campus and grade dropdowns (grade list is filtered by selected campus)
- [x] 8.2 Pass `campusId` and `gradeId` from URL search params to `getStudents()`

## 9. Navigation

- [x] 9.1 Add "校区管理" and "年级管理" links to the sidebar/nav (`src/components/layout/Sidebar.tsx` or equivalent)

## 10. Verify End-to-End

- [ ] 10.1 Confirm existing classes appear with "默认校区 / 默认年级" after seed migration
- [ ] 10.2 Create a new campus, then a new grade under it, then a new class under that grade
- [ ] 10.3 Confirm student list filters by campus and grade correctly
