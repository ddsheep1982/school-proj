import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

/**
 * Integration tests for student.actions.ts (T024)
 * TDD-RED: run `npm run test:integration` — confirm FAIL before implementing.
 *
 * Prerequisites: school_mgmt_test DB exists and is migrated.
 *   psql -c "CREATE DATABASE school_mgmt_test;"
 *   DATABASE_URL=".env.test value" npx prisma migrate deploy
 */

// Mock @/lib/auth before any imports so requireAuth/requireRole return a test user.
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

const { createStudent, updateStudent, getStudents, getStudentById } =
  await import("@/actions/student.actions");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-student-${Date.now()}`;

let testUserId: string;
let testClassId: string;

const mockAdminUser = {
  id: "",
  name: "Test Admin",
  email: `admin-${TEST_TAG}@test.com`,
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

  const cls = await prisma.class.create({
    data: { name: `Test Class ${TEST_TAG}`, capacity: 30 },
  });
  testClassId = cls.id;
});

afterAll(async () => {
  // Clean up in reverse dependency order
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  await prisma.student.deleteMany({
    where: { name: { contains: TEST_TAG } },
  });
  await prisma.class.delete({ where: { id: testClassId } }).catch(() => {});
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("createStudent", () => {
  it("returns success with auto-generated studentNo in S<YEAR><4-digit> format", async () => {
    const year = new Date().getFullYear();
    const result = await createStudent({
      name: `Student ${TEST_TAG}`,
      phone: "13800000001",
      guardianPhone: "13900000001",
      enrollmentDate: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.studentNo).toMatch(new RegExp(`^S${year}\\d{4,}$`));
    expect(result.data.name).toBe(`Student ${TEST_TAG}`);
    expect(result.data.enrollmentStatus).toBe("ACTIVE");
    expect(result.data.paymentStatus).toBe("PAID");
  });

  it("returns fieldErrors when required fields are missing", async () => {
    const result = await createStudent({} as never);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors).toBeDefined();
  });
});

describe("updateStudent", () => {
  it("reflects changes on the persisted record", async () => {
    const createResult = await createStudent({
      name: `UpdateTarget ${TEST_TAG}`,
      phone: "13800000002",
      guardianPhone: "13900000002",
      enrollmentDate: new Date().toISOString(),
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const studentId = createResult.data.id;

    const updateResult = await updateStudent(studentId, {
      name: `Updated ${TEST_TAG}`,
      enrollmentStatus: "GRADUATED",
      paymentStatus: "PARTIAL",
    });

    expect(updateResult.success).toBe(true);
    if (!updateResult.success) return;
    expect(updateResult.data.name).toBe(`Updated ${TEST_TAG}`);
    expect(updateResult.data.enrollmentStatus).toBe("GRADUATED");
    expect(updateResult.data.paymentStatus).toBe("PARTIAL");
  });

  it("returns error for non-existent student ID", async () => {
    const result = await updateStudent("clxxxxxxxxxxxxxxxxxxxxxxxxx", { name: "Ghost" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("学生不存在");
  });
});

describe("getStudents", () => {
  it("filters by enrollmentStatus", async () => {
    await createStudent({
      name: `Withdrawn ${TEST_TAG}`,
      phone: "13800000003",
      guardianPhone: "13900000003",
      enrollmentDate: new Date().toISOString(),
    });

    const { students } = await getStudents({ enrollmentStatus: "WITHDRAWN" });
    // All returned students must have WITHDRAWN status
    students.forEach((s) => {
      expect(s.enrollmentStatus).toBe("WITHDRAWN");
    });
  });

  it("filters by classId", async () => {
    await createStudent({
      name: `InClass ${TEST_TAG}`,
      phone: "13800000004",
      guardianPhone: "13900000004",
      enrollmentDate: new Date().toISOString(),
      classId: testClassId,
    });

    const { students } = await getStudents({ classId: testClassId });
    expect(students.length).toBeGreaterThanOrEqual(1);
    students.forEach((s) => {
      expect(s.class?.id).toBe(testClassId);
    });
  });

  it("returns paginated total count", async () => {
    const { total } = await getStudents({ page: 1, pageSize: 5 });
    expect(typeof total).toBe("number");
    expect(total).toBeGreaterThanOrEqual(0);
  });
});

describe("getStudentById", () => {
  it("returns the student with relations when found", async () => {
    const createResult = await createStudent({
      name: `ById ${TEST_TAG}`,
      phone: "13800000005",
      guardianPhone: "13900000005",
      enrollmentDate: new Date().toISOString(),
      classId: testClassId,
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const student = await getStudentById(createResult.data.id);
    expect(student).not.toBeNull();
    expect(student?.id).toBe(createResult.data.id);
    expect(student?.class?.id).toBe(testClassId);
  });

  it("returns null for a missing ID", async () => {
    const student = await getStudentById("clxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(student).toBeNull();
  });
});
