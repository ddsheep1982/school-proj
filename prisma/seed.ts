import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Admin user
  const adminPassword = await hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      name: "系统管理员",
      email: "admin@school.com",
      hashedPassword: adminPassword,
      role: "ADMIN",
    },
  });

  // Staff user
  const staffPassword = await hash("staff123456", 12);
  await prisma.user.upsert({
    where: { email: "staff@school.com" },
    update: {},
    create: {
      name: "教务老师",
      email: "staff@school.com",
      hashedPassword: staffPassword,
      role: "STAFF",
    },
  });

  // 2. Default Campus & Grade (migration backfill)
  const defaultCampus = await prisma.campus.upsert({
    where: { name: "默认校区" },
    update: {},
    create: { name: "默认校区", description: "系统默认校区" },
  });
  const defaultGrade = await prisma.grade.upsert({
    where: { name_campusId: { name: "默认年级", campusId: defaultCampus.id } },
    update: {},
    create: { name: "默认年级", campusId: defaultCampus.id },
  });

  // Backfill existing classes that have no gradeId
  await prisma.class.updateMany({
    where: { gradeId: null },
    data: { gradeId: defaultGrade.id },
  });

  // 3. Classes (upsert by composite key name+gradeId)
  const class1 = await prisma.class.upsert({
    where: { name_gradeId: { name: "初级班", gradeId: defaultGrade.id } },
    update: {},
    create: { name: "初级班", capacity: 20, gradeId: defaultGrade.id },
  });
  const class2 = await prisma.class.upsert({
    where: { name_gradeId: { name: "中级班", gradeId: defaultGrade.id } },
    update: {},
    create: { name: "中级班", capacity: 25, gradeId: defaultGrade.id },
  });
  const class3 = await prisma.class.upsert({
    where: { name_gradeId: { name: "高级班", gradeId: defaultGrade.id } },
    update: {},
    create: { name: "高级班", capacity: 15, gradeId: defaultGrade.id },
  });

  // 3. Enrollment Teachers
  const teacher1 = await prisma.enrollmentTeacher.create({
    data: { name: "李招生", phone: "13800000101" },
  }).catch(() => prisma.enrollmentTeacher.findFirst({ where: { phone: "13800000101" } })) as { id: string };
  const teacher2 = await prisma.enrollmentTeacher.create({
    data: { name: "王招生", phone: "13800000102" },
  }).catch(() => prisma.enrollmentTeacher.findFirst({ where: { phone: "13800000102" } })) as { id: string };

  // 4. Recruitment Agents
  const agent1 = await prisma.recruitmentAgent.create({
    data: { name: "赵代理", agencyName: "优学教育", phone: "13700000201" },
  }).catch(() => prisma.recruitmentAgent.findFirst({ where: { phone: "13700000201" } })) as { id: string };
  const agent2 = await prisma.recruitmentAgent.create({
    data: { name: "钱代理", phone: "13700000202" },
  }).catch(() => prisma.recruitmentAgent.findFirst({ where: { phone: "13700000202" } })) as { id: string };

  // 5. Students (10 students in mixed statuses)
  const students = [
    {
      studentNo: "S20260001",
      name: "张小明",
      phone: "13900000001",
      guardianPhone: "13900001001",
      enrollmentStatus: "ACTIVE" as const,
      paymentStatus: "PAID" as const,
      classId: class1.id,
      enrollmentTeacherId: teacher1.id,
      recruitmentChannelType: "TEACHER" as const,
      recruitmentTeacherId: teacher1.id,
    },
    {
      studentNo: "S20260002",
      name: "李小红",
      phone: "13900000002",
      guardianPhone: "13900001002",
      enrollmentStatus: "ACTIVE" as const,
      paymentStatus: "PARTIAL" as const,
      classId: class1.id,
      enrollmentTeacherId: teacher1.id,
      recruitmentChannelType: "AGENT" as const,
      recruitmentAgentId: agent1.id,
    },
    {
      studentNo: "S20260003",
      name: "王小华",
      phone: "13900000003",
      guardianPhone: "13900001003",
      enrollmentStatus: "ACTIVE" as const,
      paymentStatus: "OVERDUE" as const,
      classId: class2.id,
      enrollmentTeacherId: teacher2.id,
      recruitmentChannelType: "TEACHER" as const,
      recruitmentTeacherId: teacher2.id,
    },
    {
      studentNo: "S20260004",
      name: "赵小伟",
      phone: "13900000004",
      guardianPhone: "13900001004",
      enrollmentStatus: "ACTIVE" as const,
      paymentStatus: "PAID" as const,
      classId: class2.id,
      enrollmentTeacherId: teacher1.id,
      recruitmentChannelType: "AGENT" as const,
      recruitmentAgentId: agent2.id,
    },
    {
      studentNo: "S20260005",
      name: "陈小芳",
      phone: "13900000005",
      guardianPhone: "13900001005",
      enrollmentStatus: "ACTIVE" as const,
      paymentStatus: "PAID" as const,
      classId: class3.id,
      enrollmentTeacherId: teacher2.id,
    },
    {
      studentNo: "S20260006",
      name: "刘小峰",
      phone: "13900000006",
      guardianPhone: "13900001006",
      enrollmentStatus: "WITHDRAWN" as const,
      paymentStatus: "PAID" as const,
      classId: class1.id,
      enrollmentTeacherId: teacher1.id,
    },
    {
      studentNo: "S20260007",
      name: "孙小燕",
      phone: "13900000007",
      guardianPhone: "13900001007",
      enrollmentStatus: "WITHDRAWN" as const,
      paymentStatus: "OVERDUE" as const,
      classId: class2.id,
      enrollmentTeacherId: teacher2.id,
    },
    {
      studentNo: "S20260008",
      name: "杨小宇",
      phone: "13900000008",
      guardianPhone: "13900001008",
      enrollmentStatus: "GRADUATED" as const,
      paymentStatus: "PAID" as const,
      enrollmentTeacherId: teacher1.id,
    },
    {
      studentNo: "S20260009",
      name: "周小梅",
      phone: "13900000009",
      guardianPhone: "13900001009",
      enrollmentStatus: "GRADUATED" as const,
      paymentStatus: "PAID" as const,
      classId: class3.id,
      enrollmentTeacherId: teacher2.id,
    },
    {
      studentNo: "S20260010",
      name: "吴小杰",
      phone: "13900000010",
      guardianPhone: "13900001010",
      enrollmentStatus: "ACTIVE" as const,
      paymentStatus: "PARTIAL" as const,
      classId: class3.id,
      enrollmentTeacherId: teacher1.id,
      recruitmentChannelType: "AGENT" as const,
      recruitmentAgentId: agent1.id,
    },
  ];

  for (const student of students) {
    await prisma.student.upsert({
      where: { studentNo: student.studentNo },
      update: {},
      create: {
        ...student,
        enrollmentDate: new Date("2026-01-15"),
      },
    });
  }

  // 6. Sample payment records
  const firstStudent = await prisma.student.findFirst({ where: { studentNo: "S20260001" } });
  if (firstStudent) {
    await prisma.paymentRecord.create({
      data: {
        studentId: firstStudent.id,
        amount: 5000,
        paymentDate: new Date("2026-01-15"),
        paymentType: "CASH",
        notes: "首期学费",
        createdById: admin.id,
      },
    }).catch(() => {});
  }

  console.log("Seed complete!");
  console.log("Admin login: admin@school.com / admin123456");
  console.log("Staff login: staff@school.com / staff123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
