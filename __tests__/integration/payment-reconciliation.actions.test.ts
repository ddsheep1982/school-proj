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

const { createPayment } = await import("@/actions/payment.actions");
const { getStudentInvoices, getStudentOutstandingBalance } = await import("@/actions/invoice.actions");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-recon-${Date.now()}`;
let testUserId: string;
let testStudentId: string;
let otherStudentId: string;
let testInvoiceId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Recon Test Admin",
      email: `recon-admin-${TEST_TAG}@test.com`,
      hashedPassword: await hash("test-password", 10),
      role: "ADMIN",
    },
  });
  testUserId = user.id;
  _testUser = { id: user.id, name: user.name, email: user.email, role: "ADMIN" };

  const feeStructure = await prisma.feeStructure.create({
    data: { name: `Recon Fee ${TEST_TAG}`, amount: 4000, recurrence: "ONE_TIME", academicYear: "2026" },
  });

  const year = new Date().getFullYear();
  const lastStudent = await prisma.student.findFirst({
    orderBy: { studentNo: "desc" },
    where: { studentNo: { startsWith: `S${year}` } },
    select: { studentNo: true },
  });
  let seq = lastStudent ? parseInt(lastStudent.studentNo.slice(5)) + 1 : 1;

  const student = await prisma.student.create({
    data: {
      studentNo: `S${year}${String(seq++).padStart(4, "0")}`,
      name: `Recon Student ${TEST_TAG}`,
      phone: "13800002222",
      guardianPhone: "13900002222",
    },
  });
  testStudentId = student.id;

  const otherStudent = await prisma.student.create({
    data: {
      studentNo: `S${year}${String(seq++).padStart(4, "0")}`,
      name: `Recon Other Student ${TEST_TAG}`,
      phone: "13800003333",
      guardianPhone: "13900003333",
    },
  });
  otherStudentId = otherStudent.id;

  const assignment = await prisma.feeAssignment.create({
    data: {
      feeStructureId: feeStructure.id,
      studentId: testStudentId,
      dueDate: new Date("2026-12-31"),
      invoices: {
        create: { studentId: testStudentId, amountDue: 4000, dueDate: new Date("2026-12-31") },
      },
    },
    include: { invoices: true },
  });
  testInvoiceId = assignment.invoices[0].id;
});

afterAll(async () => {
  await prisma.paymentRecord.deleteMany({
    where: { studentId: { in: [testStudentId, otherStudentId] } },
  });
  await prisma.invoice.deleteMany({
    where: { studentId: { in: [testStudentId, otherStudentId] } },
  });
  await prisma.feeAssignment.deleteMany({ where: { studentId: { in: [testStudentId, otherStudentId] } } });
  await prisma.feeStructure.deleteMany({ where: { name: { contains: TEST_TAG } } });
  await prisma.student.deleteMany({ where: { id: { in: [testStudentId, otherStudentId] } } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("payment linked to invoice", () => {
  it("links payment to invoice and updates computed status", async () => {
    const result = await createPayment({
      studentId: testStudentId,
      amount: 2000,
      paymentDate: new Date().toISOString(),
      paymentType: "CASH",
      invoiceId: testInvoiceId,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.invoiceId).toBe(testInvoiceId);

    const invoices = await getStudentInvoices(testStudentId);
    const inv = invoices.find((i) => i.id === testInvoiceId);
    expect(inv?.status).toBe("PARTIAL");
    expect(inv?.amountPaid).toBe(2000);
  });

  it("rejects payment when invoiceId belongs to a different student", async () => {
    const result = await createPayment({
      studentId: otherStudentId,
      amount: 1000,
      paymentDate: new Date().toISOString(),
      paymentType: "CASH",
      invoiceId: testInvoiceId,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("不匹配");
  });
});

describe("getStudentOutstandingBalance", () => {
  it("returns correct remaining balance after partial payment", async () => {
    const balance = await getStudentOutstandingBalance(testStudentId);
    expect(balance).toBe(2000); // 4000 - 2000 already paid
  });

  it("returns 0 for student with no invoices", async () => {
    const balance = await getStudentOutstandingBalance(otherStudentId);
    expect(balance).toBe(0);
  });
});
