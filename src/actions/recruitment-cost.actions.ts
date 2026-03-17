"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  CreateRecruitmentCostSchema,
  type ActionResult,
  type CreateRecruitmentCostInput,
} from "@/types/index";
import type { RecruitmentCost } from "@/generated/prisma/client";

export type RecruitmentCostWithRecipient = RecruitmentCost & {
  teacher: { id: string; name: string } | null;
  agent: { id: string; name: string; agencyName: string | null } | null;
};

export async function createRecruitmentCost(
  input: CreateRecruitmentCostInput
): Promise<ActionResult<RecruitmentCost>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = CreateRecruitmentCostSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) return { success: false, error: "学生不存在" };

    if ((data.recipientType === "TEACHER" || data.recipientType === "RECEPTION_TEACHER") && data.teacherId) {
      const teacher = await prisma.enrollmentTeacher.findUnique({ where: { id: data.teacherId } });
      if (!teacher) return { success: false, error: "老师不存在" };
    }
    if (data.recipientType === "AGENT" && data.agentId) {
      const agent = await prisma.recruitmentAgent.findUnique({ where: { id: data.agentId } });
      if (!agent) return { success: false, error: "招生代理不存在" };
    }

    const record = await prisma.recruitmentCost.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        recipientType: data.recipientType,
        teacherId: data.teacherId ?? null,
        agentId: data.agentId ?? null,
        notes: data.notes ?? null,
        createdById: user.id,
      },
    });

    await writeAuditLog(user.id, "CREATE", "RecruitmentCost", record.id, { after: record });
    return { success: true, data: record };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getRecruitmentCostsByStudent(
  studentId: string
): Promise<RecruitmentCostWithRecipient[]> {
  await requireRole("ADMIN");
  return prisma.recruitmentCost.findMany({
    where: { studentId },
    include: {
      teacher: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true, agencyName: true } },
    },
    orderBy: { paymentDate: "desc" },
  }) as Promise<RecruitmentCostWithRecipient[]>;
}

export async function deleteRecruitmentCost(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole("ADMIN");
    const record = await prisma.recruitmentCost.findUnique({ where: { id } });
    if (!record) return { success: false, error: "记录不存在" };

    await prisma.recruitmentCost.delete({ where: { id } });
    await writeAuditLog(user.id, "DELETE", "RecruitmentCost", id, { before: record });
    return { success: true, data: { id } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
