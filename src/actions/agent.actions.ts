"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  CreateAgentSchema,
  UpdateAgentSchema,
  type ActionResult,
  type CreateAgentInput,
  type UpdateAgentInput,
} from "@/types/index";
import type { RecruitmentAgent } from "@/generated/prisma/client";

export async function createAgent(
  input: CreateAgentInput
): Promise<ActionResult<RecruitmentAgent>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = CreateAgentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const agent = await prisma.recruitmentAgent.create({ data: parsed.data });
    await writeAuditLog(user.id, "CREATE", "RecruitmentAgent", agent.id, { after: agent });
    return { success: true, data: agent };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateAgent(
  id: string,
  input: UpdateAgentInput
): Promise<ActionResult<RecruitmentAgent>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = UpdateAgentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const before = await prisma.recruitmentAgent.findUnique({ where: { id } });
    if (!before) return { success: false, error: "招生代理不存在" };

    const agent = await prisma.recruitmentAgent.update({ where: { id }, data: parsed.data });
    await writeAuditLog(user.id, "UPDATE", "RecruitmentAgent", id, { before, after: agent });
    return { success: true, data: agent };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function deleteAgent(id: string): Promise<ActionResult<void>> {
  try {
    const user = await requireRole("ADMIN");
    const agent = await prisma.recruitmentAgent.findUnique({
      where: { id },
      include: { _count: { select: { recruitedStudents: true } } },
    });
    if (!agent) return { success: false, error: "招生代理不存在" };

    if (agent._count.recruitedStudents > 0) {
      return {
        success: false,
        error: `该代理还关联着 ${agent._count.recruitedStudents} 名学生，请先将学生转移后再删除`,
      };
    }

    await prisma.recruitmentAgent.delete({ where: { id } });
    await writeAuditLog(user.id, "DELETE", "RecruitmentAgent", id, { before: agent });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getAgents() {
  await requireAuth();
  return prisma.recruitmentAgent.findMany({
    where: { active: true },
    include: { _count: { select: { recruitedStudents: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getAgentById(id: string) {
  await requireAuth();
  return prisma.recruitmentAgent.findUnique({
    where: { id },
    include: {
      recruitedStudents: {
        select: {
          id: true,
          studentNo: true,
          name: true,
          enrollmentStatus: true,
          paymentStatus: true,
        },
        orderBy: { studentNo: "asc" },
      },
      _count: { select: { recruitedStudents: true } },
    },
  });
}
