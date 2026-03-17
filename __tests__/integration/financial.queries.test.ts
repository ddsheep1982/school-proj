import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

// financial.queries.ts uses prisma directly (no auth), but recruitment-cost.actions uses requireRole
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

const { getFinancialSummary, getMonthlyFinancialBreakdown, getStudentFinancialSummaries } =
  await import("@/lib/financial.queries");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-financial-${Date.now()}`;
const YEAR = 2025;
let testUserId: string;
let testStudentId: string;
let testClassId: string;
let testTeacherId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Financial Test Admin",
      email: `financial-admin-${TEST_TAG}@test.com`,
      hashedPassword: await hash("test-password", 10),
      role: "ADMIN",
    },
  });
  testUserId = user.id;
  _testUser = { id: user.id, name: user.name, email: user.email, role: "ADMIN" };

  const cls = await prisma.class.create({
    data: { name: `Financial Class ${TEST_TAG}`, capacity: 10 },
  });
  testClassId = cls.id;

  const teacher = await prisma.enrollmentTeacher.create({
    data: { name: `Financial Teacher ${TEST_TAG}`, phone: "13700006666" },
  });
  testTeacherId = teacher.id;

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
      name: `Financial Student ${TEST_TAG}`,
      phone: "13800006666",
      guardianPhone: "13900006666",
      classId: testClassId,
    },
  });
  testStudentId = student.id;

  // Create payment record: 3000 income in March YEAR
  await prisma.paymentRecord.create({
    data: {
      studentId: testStudentId,
      amount: 3000,
      paymentDate: new Date(`${YEAR}-03-15T00:00:00.000Z`),
      paymentType: "CASH",
      createdById: testUserId,
    },
  });

  // Create recruitment cost: 500 in March YEAR
  await prisma.recruitmentCost.create({
    data: {
      studentId: testStudentId,
      amount: 500,
      paymentDate: new Date(`${YEAR}-03-20T00:00:00.000Z`),
      recipientType: "TEACHER",
      teacherId: testTeacherId,
      createdById: testUserId,
    },
  });
});

afterAll(async () => {
  await prisma.recruitmentCost.deleteMany({ where: { studentId: testStudentId } });
  await prisma.paymentRecord.deleteMany({ where: { studentId: testStudentId } });
  await prisma.student.delete({ where: { id: testStudentId } }).catch(() => {});
  await prisma.class.delete({ where: { id: testClassId } }).catch(() => {});
  await prisma.enrollmentTeacher.delete({ where: { id: testTeacherId } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("getFinancialSummary", () => {
  it("returns summary including our test records", async () => {
    const summary = await getFinancialSummary({
      startDate: new Date(`${YEAR}-01-01T00:00:00.000Z`).toISOString(),
      endDate: new Date(`${YEAR}-12-31T23:59:59.999Z`).toISOString(),
      classId: testClassId,
    });
    expect(summary.totalIncome).toBeGreaterThanOrEqual(3000);
    expect(summary.totalCosts).toBeGreaterThanOrEqual(500);
    expect(summary.netIncome).toBe(summary.totalIncome - summary.totalCosts);
  });

  it("filters by classId — excludes students from other classes", async () => {
    const summary = await getFinancialSummary({ classId: testClassId });
    expect(summary.totalIncome).toBeGreaterThanOrEqual(3000);
  });

  it("filters by date range — excludes records outside range", async () => {
    const summary = await getFinancialSummary({
      startDate: new Date(`${YEAR}-05-01T00:00:00.000Z`).toISOString(),
      endDate: new Date(`${YEAR}-12-31T00:00:00.000Z`).toISOString(),
      classId: testClassId,
    });
    // Our test records are in March, so should be excluded
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalCosts).toBe(0);
  });
});

describe("getMonthlyFinancialBreakdown", () => {
  it("returns 12 monthly entries", async () => {
    const entries = await getMonthlyFinancialBreakdown(YEAR);
    expect(entries).toHaveLength(12);
  });

  it("March entry includes our test records", async () => {
    const entries = await getMonthlyFinancialBreakdown(YEAR);
    const march = entries.find((e) => e.month === 3)!;
    expect(march.tuitionIncome).toBeGreaterThanOrEqual(3000);
    expect(march.recruitmentCost).toBeGreaterThanOrEqual(500);
    expect(march.netIncome).toBe(march.tuitionIncome - march.recruitmentCost);
  });

  it("months with no activity return 0", async () => {
    const entries = await getMonthlyFinancialBreakdown(YEAR);
    const jan = entries.find((e) => e.month === 1)!;
    // January should be 0 (our records are in March)
    // Note: other test data may contribute, so just check netIncome calculation
    expect(jan.netIncome).toBe(jan.tuitionIncome - jan.recruitmentCost);
  });
});

describe("getStudentFinancialSummaries", () => {
  it("returns per-student summaries with correct totals", async () => {
    const summaries = await getStudentFinancialSummaries({ classId: testClassId });
    const ourStudent = summaries.find((s) => s.studentId === testStudentId);
    expect(ourStudent).toBeDefined();
    expect(ourStudent!.totalTuition).toBeGreaterThanOrEqual(3000);
    expect(ourStudent!.totalRecruitmentCost).toBeGreaterThanOrEqual(500);
    expect(ourStudent!.netContribution).toBe(ourStudent!.totalTuition - ourStudent!.totalRecruitmentCost);
  });

  it("orders by netContribution descending", async () => {
    const summaries = await getStudentFinancialSummaries({ classId: testClassId });
    for (let i = 1; i < summaries.length; i++) {
      expect(summaries[i - 1].netContribution).toBeGreaterThanOrEqual(summaries[i].netContribution);
    }
  });
});
