"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { CreateCampusSchema, UpdateCampusSchema } from "@/types/index";
import type { ActionResult } from "@/types/index";
import type { Campus } from "@/generated/prisma/client";

export type CampusWithCount = Campus & { _count: { grades: number } };

export async function getCampuses(): Promise<CampusWithCount[]> {
  await requireAuth();
  return prisma.campus.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
    include: { _count: { select: { grades: true } } },
  });
}

export async function createCampus(input: unknown): Promise<ActionResult<Campus>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = CreateCampusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "输入数据无效", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    const campus = await prisma.campus.create({ data: parsed.data });
    await writeAuditLog(user.id, "CREATE", "Campus", campus.id, { after: campus });
    return { success: true, data: campus };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateCampus(id: string, input: unknown): Promise<ActionResult<Campus>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = UpdateCampusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "输入数据无效", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    const before = await prisma.campus.findUnique({ where: { id } });
    const campus = await prisma.campus.update({ where: { id }, data: parsed.data });
    await writeAuditLog(user.id, "UPDATE", "Campus", id, { before, after: campus });
    return { success: true, data: campus };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
