import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

/**
 * Integration tests for agent.actions.ts (T054)
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

const { createAgent, deleteAgent, getAgentById } =
  await import("@/actions/agent.actions");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const TEST_TAG = `integration-agent-${Date.now()}`;

let testUserId: string;
const createdAgentIds: string[] = [];

const mockAdminUser = {
  id: "",
  name: "Agent Test Admin",
  email: `agent-admin-${TEST_TAG}@test.com`,
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
  for (const id of createdAgentIds) {
    await prisma.recruitmentAgent.delete({ where: { id } }).catch(() => {});
  }
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  _testUser = null;
  await prisma.$disconnect();
});

describe("createAgent", () => {
  it("persists agent with required name and optional agencyName", async () => {
    const result = await createAgent({
      name: `Agent ${TEST_TAG}`,
      phone: "13600000001",
      agencyName: `Agency ${TEST_TAG}`,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    createdAgentIds.push(result.data.id);
    expect(result.data.name).toBe(`Agent ${TEST_TAG}`);
    expect(result.data.agencyName).toBe(`Agency ${TEST_TAG}`);
    expect(result.data.active).toBe(true);
  });

  it("persists agent without agencyName (optional field)", async () => {
    const result = await createAgent({
      name: `No Agency ${TEST_TAG}`,
      phone: "13600000002",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    createdAgentIds.push(result.data.id);
    expect(result.data.agencyName).toBeNull();
  });

  it("returns fieldErrors for missing required fields", async () => {
    const result = await createAgent({} as never);
    expect(result.success).toBe(false);
  });
});

describe("deleteAgent", () => {
  it("successfully deletes an agent with no students assigned", async () => {
    const createResult = await createAgent({
      name: `Delete Agent ${TEST_TAG}`,
      phone: "13600000003",
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const result = await deleteAgent(createResult.data.id);
    expect(result.success).toBe(true);
  });

  it("blocks deletion when active students are recruited by the agent", async () => {
    const createResult = await createAgent({
      name: `Busy Agent ${TEST_TAG}`,
      phone: "13600000004",
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const agentId = createResult.data.id;
    createdAgentIds.push(agentId);

    // Create a student recruited by this agent
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
        name: `Agent Student ${TEST_TAG}`,
        phone: "13800005000",
        guardianPhone: "13900005000",
        recruitmentChannelType: "AGENT",
        recruitmentAgentId: agentId,
      },
    });

    const deleteResult = await deleteAgent(agentId);
    expect(deleteResult.success).toBe(false);
    if (deleteResult.success) return;
    expect(deleteResult.error).toMatch(/学生/);

    // Clean up student before agent
    await prisma.student.delete({ where: { id: student.id } });
  });

  it("returns error for non-existent agent", async () => {
    const result = await deleteAgent("clxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("招生代理不存在");
  });
});

describe("getAgentById", () => {
  it("returns agent with recruited student portfolio including paymentStatus", async () => {
    const createResult = await createAgent({
      name: `Portfolio Agent ${TEST_TAG}`,
      phone: "13600000005",
      agencyName: `Portfolio Agency ${TEST_TAG}`,
    });
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const agentId = createResult.data.id;
    createdAgentIds.push(agentId);

    // Assign a student recruited by this agent
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
        name: `Agent Portfolio Student ${TEST_TAG}`,
        phone: "13800006000",
        guardianPhone: "13900006000",
        recruitmentChannelType: "AGENT",
        recruitmentAgentId: agentId,
        paymentStatus: "OVERDUE",
      },
    });

    const agent = await getAgentById(agentId);
    expect(agent).not.toBeNull();
    expect(agent?.recruitedStudents.length).toBeGreaterThanOrEqual(1);

    const portfolioStudent = agent?.recruitedStudents.find(
      (s) => s.id === student.id
    );
    expect(portfolioStudent).toBeDefined();
    expect(portfolioStudent?.paymentStatus).toBe("OVERDUE");

    // Clean up student
    await prisma.student.delete({ where: { id: student.id } });
  });

  it("returns null for non-existent agent ID", async () => {
    const agent = await getAgentById("clxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(agent).toBeNull();
  });
});
