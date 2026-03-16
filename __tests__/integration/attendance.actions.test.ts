import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

/**
 * Integration tests for attendance.actions.ts (T060)
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

const { recordCheckIn, recordCheckOut } =
  await import("@/actions/attendance.actions");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-attendance-${Date.now()}`;

let testUserId: string;
let testStudentId: string;

// Use a unique date per test run to avoid @@unique([studentId, date]) conflicts
const TEST_DATE = `2025-0${Math.floor(Math.random() * 9) + 1}-15`;

const mockAdminUser = {
  id: "",
  name: "Attendance Test Admin",
  email: `attendance-admin-${TEST_TAG}@test.com`,
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

  // Create a test student for attendance records
  const year = new Date().getFullYear();
  const lastStudent = await prisma.student.findFirst({
    orderBy: { studentNo: "desc" },
    where: { studentNo: { startsWith: `S${year}` } },
    select: { studentNo: true },
  });
  const seq = lastStudent ? parseInt(lastStudent.studentNo.slice(5)) + 1 : 1;
  const studentNo = `S${year}${String(seq).padStart(4, "0")}`;

  const student = await prisma.student.create({
    data: {
      studentNo,
      name: `Attendance Student ${TEST_TAG}`,
      phone: "13800007000",
      guardianPhone: "13900007000",
    },
  });
  testStudentId = student.id;
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  await prisma.attendanceRecord.deleteMany({ where: { studentId: testStudentId } });
  await prisma.student.delete({ where: { id: testStudentId } }).catch(() => {});
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

// Use different dates per test to avoid unique constraint conflicts
const date1 = `2025-01-10`;
const date2 = `2025-01-11`;
const date3 = `2025-01-12`;
const date4 = `2025-01-13`;
const date5 = `2025-01-14`;

describe("recordCheckIn", () => {
  it("creates an attendance record with checkIn time", async () => {
    const result = await recordCheckIn(testStudentId, date1, "09:00");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.studentId).toBe(testStudentId);
    expect(result.data.checkIn).toBeDefined();
    expect(result.data.checkOut).toBeNull();
  });

  it("rejects duplicate check-in on the same day", async () => {
    // First check-in (date1 already has one from previous test)
    const result = await recordCheckIn(testStudentId, date1, "10:00");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("已签到");
  });
});

describe("recordCheckOut", () => {
  it("rejects check-out when no check-in exists for that date", async () => {
    const result = await recordCheckOut(testStudentId, date2, "17:00");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("签到");
  });

  it("rejects check-out with time equal to check-in", async () => {
    await recordCheckIn(testStudentId, date3, "09:00");
    const result = await recordCheckOut(testStudentId, date3, "09:00");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/签出时间/);
  });

  it("rejects check-out with time before check-in", async () => {
    await recordCheckIn(testStudentId, date4, "10:00");
    const result = await recordCheckOut(testStudentId, date4, "09:00");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/签出时间/);
  });

  it("computes duration in minutes correctly on successful check-out", async () => {
    await recordCheckIn(testStudentId, date5, "08:00");
    const result = await recordCheckOut(testStudentId, date5, "10:30");

    expect(result.success).toBe(true);
    if (!result.success) return;
    // 8:00 → 10:30 = 150 minutes
    expect(result.data.duration).toBe(150);
    expect(result.data.checkOut).toBeDefined();
  });
});
