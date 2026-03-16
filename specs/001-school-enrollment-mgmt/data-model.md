# Data Model

**Feature**: School Enrollment & Management Platform

## Entity Relationship Overview

```
User ──creates──► PaymentRecord ◄──belongs_to── Student
 │                                              │
 └──audit──► AuditLog                          ├── Class
                                               ├── EnrollmentTeacher (enrolled_by)
                                               ├── EnrollmentTeacher (recruited_by)
                                               ├── RecruitmentAgent (recruited_by)
                                               └── AttendanceRecord[]
```

## Entities

### Student (中心实体)
- `id`: cuid PK
- `studentNo`: unique, format `S<YEAR><4-digit>` e.g. `S20260001`
- `name`, `phone`, `guardianPhone`
- `enrollmentDate`: defaults to now
- `enrollmentStatus`: ACTIVE | WITHDRAWN | GRADUATED (default ACTIVE)
- `paymentStatus`: PAID | PARTIAL | OVERDUE (default PAID)
- FK: `classId` → Class
- FK: `enrollmentTeacherId` → EnrollmentTeacher (who processed enrollment)
- `recruitmentChannelType`: TEACHER | AGENT (nullable)
- FK: `recruitmentTeacherId` → EnrollmentTeacher (named relation "RecruitedByTeacher")
- FK: `recruitmentAgentId` → RecruitmentAgent (named relation "RecruitedByAgent")

**Indexes**: enrollmentStatus, paymentStatus, classId, enrollmentTeacherId

### Class (班级)
- `id`, `name` (unique), `capacity`, `archived` (default false)

### EnrollmentTeacher (招生老师)
- `id`, `name`, `phone`, `active` (default true)
- Has **two** named relations to Student:
  - `enrolledStudents` ("EnrolledBy"): students this teacher enrolled
  - `recruitedStudents` ("RecruitedByTeacher"): students recruited through this teacher as channel

### RecruitmentAgent (外部招生代理)
- `id`, `name`, `agencyName` (optional), `phone`, `active`
- Relation: `recruitedStudents` ("RecruitedByAgent")

### PaymentRecord (缴费记录)
- `id`, `studentId`, `amount` (Decimal 10,2), `paymentDate`, `paymentType`, `notes`
- `isAdjustment` (default false), `originalId` → self (nullable)
- `createdById` → User
- **No `updatedAt`** — records are immutable; corrections use `isAdjustment=true`

### AttendanceRecord (考勤记录)
- `id`, `studentId`, `date` (@db.Date), `checkIn`, `checkOut`
- `duration` (Int, stored minutes, computed on checkOut)
- `@@unique([studentId, date])` — enforced at DB level

### User (系统用户)
- `id`, `name`, `email` (unique), `hashedPassword`, `role` (ADMIN | STAFF), `active`

### AuditLog
- `id`, `userId`, `action` (CREATE|UPDATE|DELETE), `entity`, `entityId`, `changes` (Json)
- Indexes: (entity, entityId), (createdAt)

## Named Relations Explanation

`EnrollmentTeacher` has two FK relationships to `Student`:

1. **EnrolledBy**: The teacher who processed the student's enrollment paperwork.
2. **RecruitedByTeacher**: When `recruitmentChannelType = TEACHER`, the specific teacher who sourced/recruited the student.

These are semantically distinct. A student might be enrolled by Teacher A but recruited by Teacher B. Both must be tracked independently per the spec.

## Schema File
→ `prisma/schema.prisma`
