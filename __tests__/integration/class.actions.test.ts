import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

/**
 * Integration tests for class.actions.ts (T042)
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

const { createClass, deleteClass, getClassById, getClasses } =
  await import("@/actions/class.actions");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-class-${Date.now()}`;

let testUserId: string;
const createdClassIds: string[] = [];

const mockAdminUser = {
  id: "",
  name: "Class Test Admin",
  email: `class-admin-${TEST_TAG}@test.com`,
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
  // Delete any remaining test classes
  for (const id of createdClassIds) {
    await prisma.class.delete({ where: { id } }).catch(() => {});
  }
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("createClass", () => {
  it("persists class with name and capacity", async () => {
    const result = await createClass({
      name: `Test Class ${TEST_TAG}`,
      capacity: 25,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    createdClassIds.push(result.data.id);
    expect(result.data.name).toBe(`Test Class ${TEST_TAG}`);
    expect(result.data.capacity).toBe(25);
    expect(result.data.archived).toBe(false);
  });

  it("returns fieldErrors for missing required fields", async () => {
    const result = await createClass({} as never);
    expect(result.success).toBe(false);
  });
});

describe("deleteClass", () => {
  it("successfully deletes a class with no students assigned", async () => {
    const createResult = await createClass({
      name: `Delete Me ${TEST_TAG}`,
      capacity: 10,
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const classId = createResult.data.id;
    const deleteResult = await deleteClass(classId);
    expect(deleteResult.success).toBe(true);
  });

  it("blocks deletion when students are assigned to the class", async () => {
    // Create a class
    const classResult = await createClass({
      name: `Occupied Class ${TEST_TAG}`,
      capacity: 20,
    });
    expect(classResult.success).toBe(true);
    if (!classResult.success) return;

    const classId = classResult.data.id;
    createdClassIds.push(classId);

    // Assign a student to the class
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
        name: `Class Student ${TEST_TAG}`,
        phone: "13800002000",
        guardianPhone: "13900002000",
        classId,
      },
    });

    // Attempt to delete the occupied class
    const deleteResult = await deleteClass(classId);
    expect(deleteResult.success).toBe(false);
    if (deleteResult.success) return;
    expect(deleteResult.error).toMatch(/学生/);

    // Clean up the student
    await prisma.student.delete({ where: { id: student.id } });
  });

  it("returns error for non-existent class", async () => {
    const result = await deleteClass("clxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("班级不存在");
  });
});

describe("getClassById", () => {
  it("returns class with _count.students alongside capacity", async () => {
    const createResult = await createClass({
      name: `Detail Class ${TEST_TAG}`,
      capacity: 15,
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const classId = createResult.data.id;
    createdClassIds.push(classId);

    const cls = await getClassById(classId);
    expect(cls).not.toBeNull();
    expect(cls?.capacity).toBe(15);
    expect(cls?._count.students).toBe(0);
    expect(typeof cls?._count.students).toBe("number");
  });

  it("returns null for non-existent ID", async () => {
    const cls = await getClassById("clxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(cls).toBeNull();
  });
});

describe("getClasses", () => {
  it("excludes archived classes", async () => {
    // Create an archived class
    const createResult = await createClass({
      name: `Archived Class ${TEST_TAG}`,
      capacity: 5,
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const archivedClassId = createResult.data.id;
    await prisma.class.update({
      where: { id: archivedClassId },
      data: { archived: true },
    });

    const classes = await getClasses();
    const archivedInResult = classes.find((c) => c.id === archivedClassId);
    expect(archivedInResult).toBeUndefined();

    // Clean up
    await prisma.class.delete({ where: { id: archivedClassId } });
  });

  it("includes _count.students on returned classes", async () => {
    const classes = await getClasses();
    classes.forEach((c) => {
      expect(typeof c._count.students).toBe("number");
    });
  });
});
