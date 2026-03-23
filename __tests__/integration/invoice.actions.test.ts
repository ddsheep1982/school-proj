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

const { getStudentInvoices, waiveInvoice, getStudentOutstandingBalance, listInvoices } =
  await import("@/actions/invoice.actions");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-invoice-${Date.now()}`;
let testUserId: string;
let testStudentId: string;
let testFeeStructureId: string;
let testAssignmentIds: string[] = [];
let invoiceIds: string[] = [];

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Invoice Test Admin",
      email: `invoice-admin-${TEST_TAG}@test.com`,
      hashedPassword: await hash("test-password", 10),
      role: "ADMIN",
    },
  });
  testUserId = user.id;
  _testUser = { id: user.id, name: user.name, email: user.email, role: "ADMIN" };

  const feeStructure = await prisma.feeStructure.create({
    data: { name: `Invoice Fee ${TEST_TAG}`, amount: 3000, recurrence: "TERM", academicYear: "2026" },
  });
  testFeeStructureId = feeStructure.id;

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
      name: `Invoice Student ${TEST_TAG}`,
      phone: "13800001111",
      guardianPhone: "13900001111",
    },
  });
  testStudentId = student.id;

  // Create 4 separate feeAssignments each with 1 invoice for the 4 status scenarios.
  // (@@unique([feeAssignmentId, studentId]) prevents multiple invoices per assignment+student)
  const assignments = await Promise.all(
    [0, 1, 2, 3].map(() =>
      prisma.feeAssignment.create({
        data: {
          feeStructureId: testFeeStructureId,
          studentId: testStudentId,
          dueDate: new Date("2026-12-31"),
          invoices: {
            create: [{ studentId: testStudentId, amountDue: 3000, dueDate: new Date("2026-12-31") }],
          },
        },
        include: { invoices: true },
      })
    )
  );
  testAssignmentIds = assignments.map((a) => a.id);
  invoiceIds = assignments.map((a) => a.invoices[0].id);

  // Invoice[0] → OUTSTANDING (no payments)
  // Invoice[1] → PARTIAL (1500 of 3000)
  // Invoice[2] → PAID (3000 of 3000)
  // Invoice[3] → WAIVED (will be waived in test)

  await prisma.paymentRecord.create({
    data: {
      studentId: testStudentId,
      amount: 1500,
      paymentDate: new Date(),
      paymentType: "CASH",
      invoiceId: invoiceIds[1],
      createdById: testUserId,
    },
  });

  await prisma.paymentRecord.create({
    data: {
      studentId: testStudentId,
      amount: 3000,
      paymentDate: new Date(),
      paymentType: "BANK_TRANSFER",
      invoiceId: invoiceIds[2],
      createdById: testUserId,
    },
  });
});

afterAll(async () => {
  await prisma.paymentRecord.deleteMany({ where: { studentId: testStudentId } });
  await prisma.invoice.deleteMany({ where: { feeAssignmentId: { in: testAssignmentIds } } });
  await prisma.feeAssignment.deleteMany({ where: { feeStructureId: testFeeStructureId } });
  await prisma.student.delete({ where: { id: testStudentId } }).catch(() => {});
  await prisma.feeStructure.delete({ where: { id: testFeeStructureId } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("getStudentInvoices", () => {
  it("returns invoices with computed OUTSTANDING status", async () => {
    const invoices = await getStudentInvoices(testStudentId);
    const outstanding = invoices.find((i) => i.id === invoiceIds[0]);
    expect(outstanding?.status).toBe("OUTSTANDING");
  });

  it("returns invoices with computed PARTIAL status", async () => {
    const invoices = await getStudentInvoices(testStudentId);
    const partial = invoices.find((i) => i.id === invoiceIds[1]);
    expect(partial?.status).toBe("PARTIAL");
    expect(partial?.amountPaid).toBe(1500);
  });

  it("returns invoices with computed PAID status", async () => {
    const invoices = await getStudentInvoices(testStudentId);
    const paid = invoices.find((i) => i.id === invoiceIds[2]);
    expect(paid?.status).toBe("PAID");
  });
});

describe("waiveInvoice", () => {
  it("waives an OUTSTANDING invoice", async () => {
    const result = await waiveInvoice({
      invoiceId: invoiceIds[3],
      waivedReason: "Scholarship granted",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.waivedAt).not.toBeNull();
    expect(result.data.waivedReason).toBe("Scholarship granted");

    const invoices = await getStudentInvoices(testStudentId);
    const waived = invoices.find((i) => i.id === invoiceIds[3]);
    expect(waived?.status).toBe("WAIVED");
  });

  it("rejects waiving a PAID invoice", async () => {
    const result = await waiveInvoice({
      invoiceId: invoiceIds[2],
      waivedReason: "Trying to waive paid",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("已付清");
  });
});

describe("getStudentOutstandingBalance", () => {
  it("returns sum of remaining amounts from OUTSTANDING and PARTIAL invoices", async () => {
    // OUTSTANDING: 3000 remaining, PARTIAL: 1500 remaining, PAID: 0, WAIVED: 0
    const balance = await getStudentOutstandingBalance(testStudentId);
    expect(balance).toBe(4500);
  });
});

describe("listInvoices", () => {
  it("filters by status OUTSTANDING", async () => {
    const result = await listInvoices({ status: "OUTSTANDING", page: 1, pageSize: 100 });
    result.invoices.forEach((inv) => expect(inv.status).toBe("OUTSTANDING"));
  });

  it("filters by academicYear", async () => {
    const result = await listInvoices({ academicYear: "2026", page: 1, pageSize: 100 });
    result.invoices.forEach((inv) =>
      expect(inv.feeAssignment.feeStructure.academicYear).toBe("2026")
    );
  });
});
