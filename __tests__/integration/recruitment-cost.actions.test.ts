import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

let _testUser: { id: string; name: string; email: string; role: string } | null = null;

jest.unstable_mockModule("@/lib/auth", () => ({
  requireAuth: async () => {
    if (!_testUser) throw new Error("Unauthorized");
    return _testUser;
  },
  requireRole: async () => {
    if (!_testUser) throw new Error("Unauthorized");
    return _testUser;
  },
}));

const { createRecruitmentCost, getRecruitmentCostsByStudent, deleteRecruitmentCost } =
  await import("@/actions/recruitment-cost.actions");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-recruitment-cost-${Date.now()}`;
let testUserId: string;
let testStudentId: string;
let testTeacherId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: "RecruitmentCost Test Admin",
      email: `rc-admin-${TEST_TAG}@test.com`,
      hashedPassword: await hash("test-password", 10),
      role: "ADMIN",
    },
  });
  testUserId = user.id;
  _testUser = { id: user.id, name: user.name, email: user.email, role: "ADMIN" };

  const year = new Date().getFullYear();
  const lastStudent = await prisma.student.findFirst({
    orderBy: { studentNo: "desc" },
    where: { studentNo: { startsWith: `S${year}` } },
    select: { studentNo: true },
  });
  const seq = lastStudent ? parseInt(lastStudent.studentNo.slice(5)) + 1 : 1;

  const student = await prisma.student.create({
    data: {
      studentNo: `S${year}${String(seq).padStart(4, "0")}`,
      name: `RC Student ${TEST_TAG}`,
      phone: "13800005555",
      guardianPhone: "13900005555",
    },
  });
  testStudentId = student.id;

  const teacher = await prisma.enrollmentTeacher.create({
    data: { name: `RC Teacher ${TEST_TAG}`, phone: "13700005555" },
  });
  testTeacherId = teacher.id;
});

afterAll(async () => {
  await prisma.recruitmentCost.deleteMany({ where: { studentId: testStudentId } });
  await prisma.student.delete({ where: { id: testStudentId } }).catch(() => {});
  await prisma.enrollmentTeacher.delete({ where: { id: testTeacherId } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("createRecruitmentCost", () => {
  it("creates a cost entry linked to a teacher", async () => {
    const result = await createRecruitmentCost({
      studentId: testStudentId,
      amount: 500,
      paymentDate: new Date().toISOString(),
      recipientType: "TEACHER",
      teacherId: testTeacherId,
      notes: "入学佣金",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.studentId).toBe(testStudentId);
    expect(result.data.teacherId).toBe(testTeacherId);
    expect(result.data.recipientType).toBe("TEACHER");
  });

  it("returns fieldErrors for missing required fields", async () => {
    const result = await createRecruitmentCost({} as never);
    expect(result.success).toBe(false);
  });

  it("returns error for non-existent student", async () => {
    const result = await createRecruitmentCost({
      studentId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      amount: 100,
      paymentDate: new Date().toISOString(),
      recipientType: "TEACHER",
      teacherId: testTeacherId,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("学生不存在");
  });
});

describe("getRecruitmentCostsByStudent", () => {
  it("returns cost records with recipient info in descending paymentDate order", async () => {
    const records = await getRecruitmentCostsByStudent(testStudentId);
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records[0].teacher).toBeDefined();
  });
});

describe("deleteRecruitmentCost", () => {
  it("deletes a cost record successfully", async () => {
    const created = await createRecruitmentCost({
      studentId: testStudentId,
      amount: 200,
      paymentDate: new Date().toISOString(),
      recipientType: "TEACHER",
      teacherId: testTeacherId,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const result = await deleteRecruitmentCost(created.data.id);
    expect(result.success).toBe(true);
  });

  it("returns error for non-existent id", async () => {
    const result = await deleteRecruitmentCost("clxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("记录不存在");
  });
});
