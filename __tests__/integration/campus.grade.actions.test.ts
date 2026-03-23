import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

/**
 * Integration tests for campus.actions.ts and grade.actions.ts
 *
 * Key regression guard: getCampuses() and getGrades() must be accessible to
 * STAFF users (requireAuth), because students/page.tsx and classes/page.tsx
 * call these to populate filter dropdowns for all authenticated users.
 */

let _testUser: { id: string; name: string; email: string; role: string } | null = null;

// Role-aware mock — mirrors real requireRole behaviour so STAFF/ADMIN distinction is testable.
jest.unstable_mockModule("@/lib/auth", () => ({
  requireAuth: async () => {
    if (!_testUser) throw new Error("Unauthorized");
    return _testUser;
  },
  requireRole: async (required: string) => {
    if (!_testUser) throw new Error("Unauthorized");
    if (_testUser.role !== required) throw new Error(`Forbidden: need ${required}`);
    return _testUser;
  },
}));

const { getCampuses, createCampus, updateCampus } = await import("@/actions/campus.actions");
const { getGrades, createGrade, updateGrade } = await import("@/actions/grade.actions");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-campus-grade-${Date.now()}`;

let adminUserId: string;
let staffUserId: string;

const mockAdmin = { id: "", name: "CG Admin", email: `cg-admin-${TEST_TAG}@test.com`, role: "ADMIN" };
const mockStaff = { id: "", name: "CG Staff", email: `cg-staff-${TEST_TAG}@test.com`, role: "STAFF" };

beforeAll(async () => {
  const [admin, staff] = await Promise.all([
    prisma.user.create({
      data: { name: mockAdmin.name, email: mockAdmin.email, hashedPassword: await hash("pw", 10), role: "ADMIN" },
    }),
    prisma.user.create({
      data: { name: mockStaff.name, email: mockStaff.email, hashedPassword: await hash("pw", 10), role: "STAFF" },
    }),
  ]);
  adminUserId = admin.id;
  staffUserId = staff.id;
  mockAdmin.id = admin.id;
  mockStaff.id = staff.id;
  _testUser = mockAdmin;
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { userId: { in: [adminUserId, staffUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [adminUserId, staffUserId] } } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("getCampuses — auth requirement", () => {
  it("ADMIN can list campuses", async () => {
    _testUser = mockAdmin;
    const result = await getCampuses();
    expect(Array.isArray(result)).toBe(true);
  });

  it("STAFF can list campuses (requireAuth, not requireRole)", async () => {
    _testUser = mockStaff;
    // Must not throw — STAFF needs this for student/class page filter dropdowns
    await expect(getCampuses()).resolves.toBeInstanceOf(Array);
  });
});

describe("getGrades — auth requirement", () => {
  it("ADMIN can list grades", async () => {
    _testUser = mockAdmin;
    const result = await getGrades();
    expect(Array.isArray(result)).toBe(true);
  });

  it("STAFF can list grades (requireAuth, not requireRole)", async () => {
    _testUser = mockStaff;
    await expect(getGrades()).resolves.toBeInstanceOf(Array);
  });
});

describe("createCampus", () => {
  let createdId: string | undefined;

  afterAll(async () => {
    if (createdId) {
      await prisma.campus.delete({ where: { id: createdId } }).catch(() => {});
    }
  });

  it("ADMIN can create a campus", async () => {
    _testUser = mockAdmin;
    const result = await createCampus({ name: `CampusCreate ${TEST_TAG}` });
    expect(result.success).toBe(true);
    if (result.success) createdId = result.data.id;
  });

  it("STAFF cannot create a campus", async () => {
    _testUser = mockStaff;
    const result = await createCampus({ name: `StaffCampus ${TEST_TAG}` });
    expect(result.success).toBe(false);
  });

  it("returns error on duplicate campus name", async () => {
    _testUser = mockAdmin;
    if (!createdId) return;
    const campus = await prisma.campus.findUnique({ where: { id: createdId } });
    if (!campus) return;
    const result = await createCampus({ name: campus.name });
    expect(result.success).toBe(false);
  });
});

describe("createGrade", () => {
  let campusId: string | undefined;
  let gradeId: string | undefined;

  beforeAll(async () => {
    _testUser = mockAdmin;
    const campus = await prisma.campus.create({ data: { name: `GradeCampus ${TEST_TAG}` } });
    campusId = campus.id;
  });

  afterAll(async () => {
    if (gradeId) await prisma.grade.delete({ where: { id: gradeId } }).catch(() => {});
    if (campusId) await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("ADMIN can create a grade", async () => {
    _testUser = mockAdmin;
    const result = await createGrade({ name: `GradeCreate ${TEST_TAG}`, campusId: campusId! });
    expect(result.success).toBe(true);
    if (result.success) gradeId = result.data.id;
  });

  it("STAFF cannot create a grade", async () => {
    _testUser = mockStaff;
    const result = await createGrade({ name: `StaffGrade ${TEST_TAG}`, campusId: campusId! });
    expect(result.success).toBe(false);
  });

  it("returns error on duplicate grade name within same campus", async () => {
    _testUser = mockAdmin;
    if (!gradeId || !campusId) return;
    const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
    if (!grade) return;
    const result = await createGrade({ name: grade.name, campusId });
    expect(result.success).toBe(false);
  });
});

describe("updateCampus / updateGrade", () => {
  let campusId: string;
  let gradeId: string;

  beforeAll(async () => {
    _testUser = mockAdmin;
    const campus = await prisma.campus.create({ data: { name: `UpdateCampus ${TEST_TAG}` } });
    campusId = campus.id;
    const grade = await prisma.grade.create({ data: { name: `UpdateGrade ${TEST_TAG}`, campusId } });
    gradeId = grade.id;
  });

  afterAll(async () => {
    await prisma.grade.delete({ where: { id: gradeId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("ADMIN can update campus name", async () => {
    _testUser = mockAdmin;
    const result = await updateCampus(campusId, { name: `UpdatedCampus ${TEST_TAG}` });
    expect(result.success).toBe(true);
  });

  it("STAFF cannot update campus", async () => {
    _testUser = mockStaff;
    const result = await updateCampus(campusId, { name: `StaffUpdate ${TEST_TAG}` });
    expect(result.success).toBe(false);
  });

  it("ADMIN can update grade name", async () => {
    _testUser = mockAdmin;
    const result = await updateGrade(gradeId, { name: `UpdatedGrade ${TEST_TAG}` });
    expect(result.success).toBe(true);
  });

  it("STAFF cannot update grade", async () => {
    _testUser = mockStaff;
    const result = await updateGrade(gradeId, { name: `StaffUpdateGrade ${TEST_TAG}` });
    expect(result.success).toBe(false);
  });
});
