import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

/**
 * Integration tests for student management enhancements:
 * - withdrawStudent / deleteStudent
 * - deleteClass (active students check)
 * - createRefundRecord / deleteRefundRecord
 */

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

const { withdrawStudent, deleteStudent } = await import("@/actions/student.actions");
const { deleteClass } = await import("@/actions/class.actions");
const { createRefundRecord, deleteRefundRecord } = await import("@/actions/refund.actions");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-enhancements-${Date.now()}`;

let testUserId: string;
let testStudentId: string;
let testClassId: string;
let testStudentWithRecordsId: string;
let testStudentForRefundWithdrawId: string;

beforeAll(async () => {
  const hashedPw = await hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Test Admin",
      email: `admin-${TEST_TAG}@test.com`,
      hashedPassword: hashedPw,
      role: "ADMIN",
    },
  });
  testUserId = user.id;
  _testUser = { id: user.id, name: user.name, email: user.email, role: "ADMIN" };

  const cls = await prisma.class.create({
    data: { name: `TestClass-${TEST_TAG}`, capacity: 10 },
  });
  testClassId = cls.id;

  const student = await prisma.student.create({
    data: {
      studentNo: `S2026T${Date.now()}`,
      name: "Test Student",
      phone: "13800000001",
      guardianPhone: "13800000002",
    },
  });
  testStudentId = student.id;

  const studentWithRecords = await prisma.student.create({
    data: {
      studentNo: `S2026T${Date.now() + 1}`,
      name: "Test Student With Records",
      phone: "13800000003",
      guardianPhone: "13800000004",
    },
  });
  testStudentWithRecordsId = studentWithRecords.id;

  const studentForRefundWithdraw = await prisma.student.create({
    data: {
      studentNo: `S2026T${Date.now() + 2}`,
      name: "Test Student Refund Withdraw",
      phone: "13800000060",
      guardianPhone: "13800000061",
    },
  });
  testStudentForRefundWithdrawId = studentForRefundWithdraw.id;

  // Add a payment record to testStudentWithRecordsId to block hard deletion
  await prisma.paymentRecord.create({
    data: {
      studentId: testStudentWithRecordsId,
      amount: 100,
      paymentDate: new Date(),
      paymentType: "CASH",
      createdById: testUserId,
    },
  });

  // Add payment so refund tests can pass (refund validation checks totalPaid)
  await prisma.paymentRecord.create({
    data: {
      studentId: testStudentId,
      amount: 600,
      paymentDate: new Date(),
      paymentType: "CASH",
      createdById: testUserId,
    },
  });

  await prisma.paymentRecord.create({
    data: {
      studentId: testStudentForRefundWithdrawId,
      amount: 2000,
      paymentDate: new Date(),
      paymentType: "CASH",
      createdById: testUserId,
    },
  });
});

afterAll(async () => {
  // Clean up in dependency order — delete child records before students
  const testStudents = await prisma.student.findMany({
    where: { phone: { startsWith: "138000000" } },
    select: { id: true },
  });
  const testStudentIds = testStudents.map((s) => s.id);

  await prisma.paymentRecord.deleteMany({ where: { createdById: testUserId } });
  await prisma.refundRecord.deleteMany({ where: { studentId: { in: testStudentIds } } });
  await prisma.invoice.deleteMany({ where: { studentId: { in: testStudentIds } } });
  await prisma.feeAssignment.deleteMany({ where: { studentId: { in: testStudentIds } } });
  await prisma.student.deleteMany({ where: { id: { in: testStudentIds } } });
  await prisma.class.delete({ where: { id: testClassId } }).catch(() => {});
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  await prisma.$disconnect();
});

// ─── withdrawStudent ─────────────────────────────────────────────────────────

describe("withdrawStudent", () => {
  it("sets withdrawalDate and withdrawalReason, changes status to WITHDRAWN", async () => {
    const result = await withdrawStudent(testStudentId, {
      withdrawalDate: new Date("2026-03-17T00:00:00.000Z").toISOString(),
      withdrawalReason: "家庭原因",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enrollmentStatus).toBe("WITHDRAWN");
      expect(result.data.withdrawalReason).toBe("家庭原因");
      expect(result.data.withdrawalDate).not.toBeNull();
    }
  });

  it("rejects withdrawing an already withdrawn student", async () => {
    const result = await withdrawStudent(testStudentId, {
      withdrawalDate: new Date().toISOString(),
      withdrawalReason: "重复退学",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("已退学");
    }
  });
});

// ─── deleteStudent ────────────────────────────────────────────────────────────

describe("deleteStudent", () => {
  it("blocks deletion of student with associated records", async () => {
    const result = await deleteStudent(testStudentWithRecordsId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("关联记录");
    }
  });

  it("permanently deletes student with no records", async () => {
    const student = await prisma.student.create({
      data: {
        studentNo: `S2026DEL${Date.now()}`,
        name: "Delete Me",
        phone: "13800000099",
        guardianPhone: "13800000099",
      },
    });
    const result = await deleteStudent(student.id);
    expect(result.success).toBe(true);
    const check = await prisma.student.findUnique({ where: { id: student.id } });
    expect(check).toBeNull();
  });
});

// ─── deleteClass ──────────────────────────────────────────────────────────────

describe("deleteClass", () => {
  it("blocks deletion of class with students", async () => {
    // Add a student to the test class
    const student = await prisma.student.create({
      data: {
        studentNo: `S2026CLS${Date.now()}`,
        name: "Class Student",
        phone: "13800000010",
        guardianPhone: "13800000010",
        classId: testClassId,
      },
    });

    const result = await deleteClass(testClassId);
    expect(result.success).toBe(false);

    // clean up
    await prisma.student.delete({ where: { id: student.id } });
  });

  it("deletes empty class successfully", async () => {
    const emptyClass = await prisma.class.create({
      data: { name: `EmptyClass-${TEST_TAG}`, capacity: 5 },
    });
    const result = await deleteClass(emptyClass.id);
    expect(result.success).toBe(true);
    const check = await prisma.class.findUnique({ where: { id: emptyClass.id } });
    expect(check).toBeNull();
  });
});

// ─── createRefundRecord / deleteRefundRecord ──────────────────────────────────

describe("createRefundRecord", () => {
  it("creates a refund record without invoice", async () => {
    const result = await createRefundRecord({
      studentId: testStudentId,
      amount: 500,
      reason: "退部分学费",
      refundDate: new Date("2026-03-17T00:00:00.000Z").toISOString(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.studentId).toBe(testStudentId);
      expect(Number(result.data.amount)).toBe(500);
    }
  });

  it("rejects refund with invoiceId belonging to different student", async () => {
    const otherStudent = await prisma.student.create({
      data: {
        studentNo: `S2026INV${Date.now()}`,
        name: "Other Student",
        phone: "13800000050",
        guardianPhone: "13800000050",
      },
    });

    // Create a fee structure and assignment to get a valid invoice
    const feeStructure = await prisma.feeStructure.create({
      data: { name: `Fee-${TEST_TAG}`, amount: 1000, recurrence: "ONE_TIME", academicYear: "2026" },
    });
    const assignment = await prisma.feeAssignment.create({
      data: {
        feeStructureId: feeStructure.id,
        studentId: otherStudent.id,
        dueDate: new Date(),
      },
    });
    const invoice = await prisma.invoice.create({
      data: {
        feeAssignmentId: assignment.id,
        studentId: otherStudent.id,
        amountDue: 1000,
        dueDate: new Date(),
      },
    });

    // Try to link this invoice to testStudentId
    const result = await createRefundRecord({
      studentId: testStudentId,
      invoiceId: invoice.id,
      amount: 100,
      reason: "退费",
      refundDate: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("发票不属于该学生");
    }

    // clean up
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.feeAssignment.delete({ where: { id: assignment.id } });
    await prisma.feeStructure.delete({ where: { id: feeStructure.id } });
    await prisma.student.delete({ where: { id: otherStudent.id } });
  });

  it("deletes a refund record", async () => {
    const record = await prisma.refundRecord.create({
      data: {
        studentId: testStudentId,
        amount: 200,
        reason: "测试退费",
        refundDate: new Date(),
        createdById: testUserId,
      },
    });
    const result = await deleteRefundRecord(record.id);
    expect(result.success).toBe(true);
    const check = await prisma.refundRecord.findUnique({ where: { id: record.id } });
    expect(check).toBeNull();
  });
});

// ─── withdrawStudent with refund ──────────────────────────────────────────────

describe("withdrawStudent with refund", () => {
  it("withdraws without refund fields — does not create RefundRecord", async () => {
    // Use a fresh student created in beforeAll
    const freshStudent = await prisma.student.create({
      data: {
        studentNo: `S2026NR${Date.now()}`,
        name: "No Refund Student",
        phone: "13800000070",
        guardianPhone: "13800000071",
      },
    });

    const before = await prisma.refundRecord.count({ where: { studentId: freshStudent.id } });
    const result = await withdrawStudent(freshStudent.id, {
      withdrawalDate: new Date("2026-03-17T00:00:00.000Z").toISOString(),
      withdrawalReason: "无退款退学",
    });
    expect(result.success).toBe(true);
    const after = await prisma.refundRecord.count({ where: { studentId: freshStudent.id } });
    expect(after).toBe(before); // no RefundRecord created

    await prisma.student.delete({ where: { id: freshStudent.id } });
  });

  it("withdraws with complete refund fields — atomically creates RefundRecord", async () => {
    const result = await withdrawStudent(testStudentForRefundWithdrawId, {
      withdrawalDate: new Date("2026-03-17T00:00:00.000Z").toISOString(),
      withdrawalReason: "转学退费",
      refundAmount: 1500,
      refundDate: new Date("2026-03-17T00:00:00.000Z").toISOString(),
      refundReason: "退还剩余学费",
    });
    expect(result.success).toBe(true);

    const refundRecords = await prisma.refundRecord.findMany({
      where: { studentId: testStudentForRefundWithdrawId },
    });
    expect(refundRecords).toHaveLength(1);
    expect(Number(refundRecords[0].amount)).toBe(1500);
    expect(refundRecords[0].reason).toBe("退还剩余学费");
  });

  it("rejects withdrawal with refundAmount but missing refundDate and refundReason", async () => {
    const freshStudent = await prisma.student.create({
      data: {
        studentNo: `S2026PR${Date.now()}`,
        name: "Partial Refund Student",
        phone: "13800000080",
        guardianPhone: "13800000081",
      },
    });

    const result = await withdrawStudent(freshStudent.id, {
      withdrawalDate: new Date().toISOString(),
      withdrawalReason: "退学",
      refundAmount: 500,
      // refundDate and refundReason intentionally omitted
    });
    expect(result.success).toBe(false);

    await prisma.student.delete({ where: { id: freshStudent.id } });
  });

  it("rejects withdrawal with refundAmount = 0", async () => {
    const freshStudent = await prisma.student.create({
      data: {
        studentNo: `S2026ZR${Date.now()}`,
        name: "Zero Refund Student",
        phone: "13800000082",
        guardianPhone: "13800000083",
      },
    });

    const result = await withdrawStudent(freshStudent.id, {
      withdrawalDate: new Date().toISOString(),
      withdrawalReason: "退学",
      refundAmount: 0,
      refundDate: new Date().toISOString(),
      refundReason: "退款",
    });
    expect(result.success).toBe(false);

    await prisma.student.delete({ where: { id: freshStudent.id } });
  });

  it("rejects withdrawal when refundInvoiceId belongs to a different student", async () => {
    const freshStudent = await prisma.student.create({
      data: {
        studentNo: `S2026WI${Date.now()}`,
        name: "Wrong Invoice Student",
        phone: "13800000084",
        guardianPhone: "13800000085",
      },
    });
    const otherStudent = await prisma.student.create({
      data: {
        studentNo: `S2026OI${Date.now()}`,
        name: "Other Invoice Owner",
        phone: "13800000086",
        guardianPhone: "13800000087",
      },
    });

    const feeStructure = await prisma.feeStructure.create({
      data: { name: `Fee-WI-${Date.now()}`, amount: 1000, recurrence: "ONE_TIME", academicYear: "2026" },
    });
    const assignment = await prisma.feeAssignment.create({
      data: { feeStructureId: feeStructure.id, studentId: otherStudent.id, dueDate: new Date() },
    });
    const invoice = await prisma.invoice.create({
      data: { feeAssignmentId: assignment.id, studentId: otherStudent.id, amountDue: 1000, dueDate: new Date() },
    });

    const result = await withdrawStudent(freshStudent.id, {
      withdrawalDate: new Date().toISOString(),
      withdrawalReason: "退学",
      refundAmount: 500,
      refundDate: new Date().toISOString(),
      refundReason: "退款",
      refundInvoiceId: invoice.id,
    });
    expect(result.success).toBe(false);

    // clean up
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.feeAssignment.delete({ where: { id: assignment.id } });
    await prisma.feeStructure.delete({ where: { id: feeStructure.id } });
    await prisma.student.delete({ where: { id: freshStudent.id } });
    await prisma.student.delete({ where: { id: otherStudent.id } });
  });
});
