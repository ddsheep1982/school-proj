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

const { createFeeAssignment, getFeeAssignments, deleteFeeAssignment } =
  await import("@/actions/fee-assignment.actions");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-fee-assign-${Date.now()}`;
let testUserId: string;
let testStudentId: string;
let testStudent2Id: string;
let testClassId: string;
let testFeeStructureId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: "FeeAssignment Test Admin",
      email: `fee-assign-admin-${TEST_TAG}@test.com`,
      hashedPassword: await hash("test-password", 10),
      role: "ADMIN",
    },
  });
  testUserId = user.id;
  _testUser = { id: user.id, name: user.name, email: user.email, role: "ADMIN" };

  const feeStructure = await prisma.feeStructure.create({
    data: { name: `Test Fee ${TEST_TAG}`, amount: 2000, recurrence: "TERM", academicYear: "2026" },
  });
  testFeeStructureId = feeStructure.id;

  const cls = await prisma.class.create({
    data: { name: `Test Class ${TEST_TAG}`, capacity: 10 },
  });
  testClassId = cls.id;

  const year = new Date().getFullYear();
  const lastStudent = await prisma.student.findFirst({
    orderBy: { studentNo: "desc" },
    where: { studentNo: { startsWith: `S${year}` } },
    select: { studentNo: true },
  });
  let seq = lastStudent ? parseInt(lastStudent.studentNo.slice(5)) + 1 : 1;

  const s1 = await prisma.student.create({
    data: {
      studentNo: `S${year}${String(seq++).padStart(4, "0")}`,
      name: `FA Student1 ${TEST_TAG}`,
      phone: "13800000001",
      guardianPhone: "13900000001",
      classId: testClassId,
    },
  });
  testStudentId = s1.id;

  const s2 = await prisma.student.create({
    data: {
      studentNo: `S${year}${String(seq++).padStart(4, "0")}`,
      name: `FA Student2 ${TEST_TAG}`,
      phone: "13800000002",
      guardianPhone: "13900000002",
      classId: testClassId,
    },
  });
  testStudent2Id = s2.id;
});

afterAll(async () => {
  await prisma.paymentRecord.deleteMany({
    where: { studentId: { in: [testStudentId, testStudent2Id] } },
  });
  await prisma.invoice.deleteMany({
    where: { studentId: { in: [testStudentId, testStudent2Id] } },
  });
  await prisma.feeAssignment.deleteMany({ where: { feeStructureId: testFeeStructureId } });
  await prisma.student.deleteMany({ where: { id: { in: [testStudentId, testStudent2Id] } } }).catch(() => {});
  await prisma.class.delete({ where: { id: testClassId } }).catch(() => {});
  await prisma.feeStructure.delete({ where: { id: testFeeStructureId } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("createFeeAssignment — individual student", () => {
  it("creates assignment and one invoice for the student", async () => {
    const result = await createFeeAssignment({
      targetType: "student",
      feeStructureId: testFeeStructureId,
      studentId: testStudentId,
      dueDate: new Date("2026-06-30T00:00:00.000Z").toISOString(),
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.invoicesCreated).toBe(1);

    const invoices = await prisma.invoice.findMany({
      where: { studentId: testStudentId, feeAssignmentId: result.data.assignment.id },
    });
    expect(invoices).toHaveLength(1);
    expect(invoices[0].amountDue.toNumber()).toBe(2000);
  });

  it("rejects duplicate assignment for same student + fee structure", async () => {
    // First assignment already created above — create a second one
    const result = await createFeeAssignment({
      targetType: "student",
      feeStructureId: testFeeStructureId,
      studentId: testStudentId,
      dueDate: new Date("2026-06-30T00:00:00.000Z").toISOString(),
    });
    // Should fail due to unique constraint
    expect(result.success).toBe(false);
  });
});

describe("createFeeAssignment — class bulk", () => {
  it("creates one invoice per enrolled active student in the class", async () => {
    const result = await createFeeAssignment({
      targetType: "class",
      feeStructureId: testFeeStructureId,
      classId: testClassId,
      dueDate: new Date("2026-12-31T00:00:00.000Z").toISOString(),
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    // testStudentId and testStudent2Id are both in the class and ACTIVE
    expect(result.data.invoicesCreated).toBeGreaterThanOrEqual(2);
  });
});

describe("getFeeAssignments", () => {
  it("returns assignments with feeStructure and target info", async () => {
    const assignments = await getFeeAssignments({ feeStructureId: testFeeStructureId });
    expect(assignments.length).toBeGreaterThanOrEqual(1);
    expect(assignments[0].feeStructure.name).toBe(`Test Fee ${TEST_TAG}`);
  });
});

describe("deleteFeeAssignment", () => {
  it("blocks delete when invoices have linked payments", async () => {
    // Get the student assignment created in the first test
    const assignments = await prisma.feeAssignment.findMany({
      where: { feeStructureId: testFeeStructureId, studentId: testStudentId },
      include: { invoices: true },
    });
    expect(assignments.length).toBeGreaterThanOrEqual(1);
    const assignment = assignments[0];
    const invoice = assignment.invoices[0];

    const payUser = await prisma.user.findUnique({ where: { id: testUserId } });
    await prisma.paymentRecord.create({
      data: {
        studentId: testStudentId,
        amount: 500,
        paymentDate: new Date(),
        paymentType: "CASH",
        invoiceId: invoice.id,
        createdById: payUser!.id,
      },
    });

    const result = await deleteFeeAssignment(assignment.id);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("已支付发票");
  });
});
