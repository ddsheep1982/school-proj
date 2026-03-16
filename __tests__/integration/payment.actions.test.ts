import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

/**
 * Integration tests for payment.actions.ts (T037)
 * TDD-RED: run `npm run test:integration` — confirm FAIL before implementing.
 *
 * Prerequisites: school_mgmt_test DB exists and is migrated.
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

const { createPayment, createAdjustment, getPaymentsByStudent } =
  await import("@/actions/payment.actions");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-payment-${Date.now()}`;

let testUserId: string;
let testStudentId: string;

const mockAdminUser = {
  id: "",
  name: "Payment Test Admin",
  email: `payment-admin-${TEST_TAG}@test.com`,
  role: "ADMIN",
};

beforeAll(async () => {

  const user = await prisma.user.create({
    data: {
      name: mockAdminUser.name,
      email: mockAdminUser.email,
      hashedPassword: await hash("test-password", 10),
      role: "ADMIN",
    },
  });
  testUserId = user.id;
  mockAdminUser.id = user.id;
  _testUser = mockAdminUser;

  // Create a test student for payment records
  const year = new Date().getFullYear();
  const lastStudent = await prisma.student.findFirst({
    orderBy: { studentNo: "desc" },
    where: { studentNo: { startsWith: `S${year}` } },
    select: { studentNo: true },
  });
  const seq = lastStudent
    ? parseInt(lastStudent.studentNo.slice(5)) + 1
    : 1;
  const studentNo = `S${year}${String(seq).padStart(4, "0")}`;

  const student = await prisma.student.create({
    data: {
      studentNo,
      name: `Payment Student ${TEST_TAG}`,
      phone: "13800001000",
      guardianPhone: "13900001000",
    },
  });
  testStudentId = student.id;
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  await prisma.paymentRecord.deleteMany({ where: { studentId: testStudentId } });
  await prisma.student.delete({ where: { id: testStudentId } }).catch(() => {});
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("createPayment", () => {
  it("creates an immutable payment record (no updatedAt field)", async () => {
    const result = await createPayment({
      studentId: testStudentId,
      amount: 5000,
      paymentDate: new Date().toISOString(),
      paymentType: "CASH",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.studentId).toBe(testStudentId);
    expect(result.data.isAdjustment).toBe(false);
    // PaymentRecord has no updatedAt — verify the field is absent
    expect((result.data as Record<string, unknown>).updatedAt).toBeUndefined();
  });

  it("returns fieldErrors for invalid input", async () => {
    const result = await createPayment({} as never);
    expect(result.success).toBe(false);
  });

  it("returns error for non-existent studentId", async () => {
    const result = await createPayment({
      studentId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      amount: 100,
      paymentDate: new Date().toISOString(),
      paymentType: "CASH",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("学生不存在");
  });
});

describe("createAdjustment", () => {
  it("links adjustment record to original via originalId", async () => {
    // Create the original payment
    const originalResult = await createPayment({
      studentId: testStudentId,
      amount: 3000,
      paymentDate: new Date().toISOString(),
      paymentType: "BANK_TRANSFER",
    });
    expect(originalResult.success).toBe(true);
    if (!originalResult.success) return;

    const originalId = originalResult.data.id;

    // Create adjustment
    const adjResult = await createAdjustment({
      originalId,
      amount: -500,
      paymentDate: new Date().toISOString(),
      paymentType: "CASH",
      notes: "Correction",
    });

    expect(adjResult.success).toBe(true);
    if (!adjResult.success) return;
    expect(adjResult.data.isAdjustment).toBe(true);
    expect(adjResult.data.originalId).toBe(originalId);
  });

  it("returns error when original payment does not exist", async () => {
    const result = await createAdjustment({
      originalId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      amount: -100,
      paymentDate: new Date().toISOString(),
      paymentType: "CASH",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("原始记录不存在");
  });
});

describe("getPaymentsByStudent", () => {
  it("returns records in chronological (paymentDate asc) order", async () => {
    // Create two payments on different dates
    await createPayment({
      studentId: testStudentId,
      amount: 1000,
      paymentDate: "2026-01-01T00:00:00.000Z",
      paymentType: "WECHAT",
    });
    await createPayment({
      studentId: testStudentId,
      amount: 2000,
      paymentDate: "2026-06-01T00:00:00.000Z",
      paymentType: "ALIPAY",
    });

    const records = await getPaymentsByStudent(testStudentId);
    expect(records.length).toBeGreaterThanOrEqual(2);

    // Verify ascending order
    for (let i = 1; i < records.length; i++) {
      expect(records[i].paymentDate.getTime()).toBeGreaterThanOrEqual(
        records[i - 1].paymentDate.getTime()
      );
    }
  });

  it("includes createdBy relation on each record", async () => {
    const records = await getPaymentsByStudent(testStudentId);
    expect(records.length).toBeGreaterThan(0);
    records.forEach((r) => {
      expect(r.createdBy).toBeDefined();
      expect(r.createdBy.id).toBe(testUserId);
    });
  });
});
