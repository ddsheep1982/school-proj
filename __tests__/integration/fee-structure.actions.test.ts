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

const { createFeeStructure, getFeeStructures, updateFeeStructure, deleteFeeStructure } =
  await import("@/actions/fee-structure.actions");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-fee-structure-${Date.now()}`;
let testUserId: string;

const mockAdminUser = {
  id: "",
  name: "FeeStructure Test Admin",
  email: `fee-structure-admin-${TEST_TAG}@test.com`,
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
});

afterAll(async () => {
  await prisma.feeStructure
    .deleteMany({ where: { name: { contains: TEST_TAG } } })
    .catch(() => {});
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("createFeeStructure", () => {
  it("creates a fee structure successfully", async () => {
    const result = await createFeeStructure({
      name: `Tuition ${TEST_TAG}`,
      amount: 5000,
      recurrence: "TERM",
      academicYear: "2026",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.name).toBe(`Tuition ${TEST_TAG}`);
    expect(result.data.recurrence).toBe("TERM");
  });

  it("rejects duplicate name + academicYear", async () => {
    await createFeeStructure({
      name: `Dup Fee ${TEST_TAG}`,
      amount: 1000,
      recurrence: "ONE_TIME",
      academicYear: "2026",
    });
    const result = await createFeeStructure({
      name: `Dup Fee ${TEST_TAG}`,
      amount: 1000,
      recurrence: "ONE_TIME",
      academicYear: "2026",
    });
    expect(result.success).toBe(false);
  });

  it("returns fieldErrors for invalid input", async () => {
    const result = await createFeeStructure({} as never);
    expect(result.success).toBe(false);
  });
});

describe("getFeeStructures", () => {
  it("returns all fee structures ordered by academicYear desc, name asc", async () => {
    await createFeeStructure({ name: `Z Fee ${TEST_TAG}`, amount: 200, recurrence: "ANNUAL", academicYear: "2024" });
    await createFeeStructure({ name: `A Fee ${TEST_TAG}`, amount: 300, recurrence: "ANNUAL", academicYear: "2025" });

    const all = await getFeeStructures();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("filters by academicYear", async () => {
    const results = await getFeeStructures("2024");
    results.forEach((r) => expect(r.academicYear).toBe("2024"));
  });
});

describe("updateFeeStructure", () => {
  it("blocks update when assignments exist", async () => {
    const created = await createFeeStructure({
      name: `Update Block ${TEST_TAG}`,
      amount: 999,
      recurrence: "ONE_TIME",
      academicYear: "2027",
    });
    expect(created.success).toBe(true);
    if (!created.success) return;
    const feeId = created.data.id;

    // Create a student and assignment to block the update
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
        name: `FS Update Block Student ${TEST_TAG}`,
        phone: "13800009999",
        guardianPhone: "13900009999",
      },
    });

    await prisma.feeAssignment.create({
      data: {
        feeStructureId: feeId,
        studentId: student.id,
        dueDate: new Date(),
        invoices: {
          create: { studentId: student.id, amountDue: 999, dueDate: new Date() },
        },
      },
    });

    const result = await updateFeeStructure(feeId, { amount: 1000 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("无法修改");

    // Cleanup
    await prisma.invoice.deleteMany({ where: { feeAssignment: { feeStructureId: feeId } } });
    await prisma.feeAssignment.deleteMany({ where: { feeStructureId: feeId } });
    await prisma.student.delete({ where: { id: student.id } }).catch(() => {});
    await prisma.feeStructure.delete({ where: { id: feeId } }).catch(() => {});
  });
});

describe("deleteFeeStructure", () => {
  it("deletes when no assignments exist", async () => {
    const created = await createFeeStructure({
      name: `Delete Me ${TEST_TAG}`,
      amount: 100,
      recurrence: "ONE_TIME",
      academicYear: "2028",
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const result = await deleteFeeStructure(created.data.id);
    expect(result.success).toBe(true);
  });

  it("blocks delete when assignments exist", async () => {
    const created = await createFeeStructure({
      name: `Delete Block ${TEST_TAG}`,
      amount: 500,
      recurrence: "TERM",
      academicYear: "2029",
    });
    expect(created.success).toBe(true);
    if (!created.success) return;
    const feeId = created.data.id;

    const year = new Date().getFullYear();
    const lastStudent = await prisma.student.findFirst({
      orderBy: { studentNo: "desc" },
      where: { studentNo: { startsWith: `S${year}` } },
      select: { studentNo: true },
    });
    const seq2 = lastStudent ? parseInt(lastStudent.studentNo.slice(5)) + 1 : 1;
    const student2 = await prisma.student.create({
      data: {
        studentNo: `S${year}${String(seq2).padStart(4, "0")}`,
        name: `FS Delete Block Student ${TEST_TAG}`,
        phone: "13800008888",
        guardianPhone: "13900008888",
      },
    });

    await prisma.feeAssignment.create({
      data: {
        feeStructureId: feeId,
        studentId: student2.id,
        dueDate: new Date(),
        invoices: {
          create: { studentId: student2.id, amountDue: 500, dueDate: new Date() },
        },
      },
    });

    const result = await deleteFeeStructure(feeId);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("无法删除");

    // Cleanup
    await prisma.invoice.deleteMany({ where: { feeAssignment: { feeStructureId: feeId } } });
    await prisma.feeAssignment.deleteMany({ where: { feeStructureId: feeId } });
    await prisma.student.delete({ where: { id: student2.id } }).catch(() => {});
    await prisma.feeStructure.delete({ where: { id: feeId } }).catch(() => {});
  });
});
