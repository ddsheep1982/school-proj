import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

/**
 * Integration tests for teacher.actions.ts (T048)
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

const { createTeacher, deleteTeacher, getTeacherById } =
  await import("@/actions/teacher.actions");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-teacher-${Date.now()}`;

let testUserId: string;
const createdTeacherIds: string[] = [];

const mockAdminUser = {
  id: "",
  name: "Teacher Test Admin",
  email: `teacher-admin-${TEST_TAG}@test.com`,
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
  await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
  for (const id of createdTeacherIds) {
    await prisma.enrollmentTeacher.delete({ where: { id } }).catch(() => {});
  }
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("createTeacher", () => {
  it("persists teacher with name and phone", async () => {
    const result = await createTeacher({
      name: `Teacher ${TEST_TAG}`,
      phone: "13700000001",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    createdTeacherIds.push(result.data.id);
    expect(result.data.name).toBe(`Teacher ${TEST_TAG}`);
    expect(result.data.phone).toBe("13700000001");
    expect(result.data.active).toBe(true);
  });

  it("returns fieldErrors for missing required fields", async () => {
    const result = await createTeacher({} as never);
    expect(result.success).toBe(false);
  });
});

describe("deleteTeacher", () => {
  it("successfully deletes a teacher with no students assigned", async () => {
    const createResult = await createTeacher({
      name: `Delete Teacher ${TEST_TAG}`,
      phone: "13700000002",
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const result = await deleteTeacher(createResult.data.id);
    expect(result.success).toBe(true);
  });

  it("blocks deletion when active students are enrolled by the teacher", async () => {
    const createResult = await createTeacher({
      name: `Busy Teacher ${TEST_TAG}`,
      phone: "13700000003",
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const teacherId = createResult.data.id;
    createdTeacherIds.push(teacherId);

    // Create a student enrolled by this teacher
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
        name: `Teacher Student ${TEST_TAG}`,
        phone: "13800003000",
        guardianPhone: "13900003000",
        enrollmentTeacherId: teacherId,
      },
    });

    const deleteResult = await deleteTeacher(teacherId);
    expect(deleteResult.success).toBe(false);
    if (deleteResult.success) return;
    expect(deleteResult.error).toMatch(/学生/);

    // Clean up student before teacher
    await prisma.student.delete({ where: { id: student.id } });
  });

  it("returns error for non-existent teacher", async () => {
    const result = await deleteTeacher("clxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("招生老师不存在");
  });
});

describe("getTeacherById", () => {
  it("returns teacher with enrolled student portfolio including paymentStatus", async () => {
    const createResult = await createTeacher({
      name: `Portfolio Teacher ${TEST_TAG}`,
      phone: "13700000004",
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const teacherId = createResult.data.id;
    createdTeacherIds.push(teacherId);

    // Assign a student
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
        name: `Portfolio Student ${TEST_TAG}`,
        phone: "13800004000",
        guardianPhone: "13900004000",
        enrollmentTeacherId: teacherId,
        paymentStatus: "PARTIAL",
      },
    });

    const teacher = await getTeacherById(teacherId);
    expect(teacher).not.toBeNull();
    expect(teacher?.enrolledStudents.length).toBeGreaterThanOrEqual(1);

    const portfolioStudent = teacher?.enrolledStudents.find(
      (s) => s.id === student.id
    );
    expect(portfolioStudent).toBeDefined();
    expect(portfolioStudent?.paymentStatus).toBe("PARTIAL");

    // Clean up student
    await prisma.student.delete({ where: { id: student.id } });
  });

  it("returns null for non-existent teacher ID", async () => {
    const teacher = await getTeacherById("clxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(teacher).toBeNull();
  });
});
