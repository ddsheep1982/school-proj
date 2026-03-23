"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { CreateGradeSchema, UpdateGradeSchema } from "@/types/index";
import type { ActionResult } from "@/types/index";
import type { Grade } from "@/generated/prisma/client";

export type GradeWithCount = Grade & {
  campus: { id: string; name: string };
  _count: { classes: number };
};

export async function getGrades(campusId?: string): Promise<GradeWithCount[]> {
  await requireAuth();
  return prisma.grade.findMany({
    where: { archived: false, ...(campusId ? { campusId } : {}) },
    orderBy: [{ campus: { name: "asc" } }, { name: "asc" }],
    include: { campus: { select: { id: true, name: true } }, _count: { select: { classes: true } } },
  });
}

export async function createGrade(input: unknown): Promise<ActionResult<Grade>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = CreateGradeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "输入数据无效", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    const grade = await prisma.grade.create({ data: parsed.data });
    await writeAuditLog(user.id, "CREATE", "Grade", grade.id, { after: grade });
    return { success: true, data: grade };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateGrade(id: string, input: unknown): Promise<ActionResult<Grade>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = UpdateGradeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "输入数据无效", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    const before = await prisma.grade.findUnique({ where: { id } });
    const grade = await prisma.grade.update({ where: { id }, data: parsed.data });
    await writeAuditLog(user.id, "UPDATE", "Grade", id, { before, after: grade });
    return { success: true, data: grade };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
