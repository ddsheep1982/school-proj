"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  CreateClassSchema,
  UpdateClassSchema,
  type ActionResult,
  type CreateClassInput,
  type UpdateClassInput,
} from "@/types/index";
import type { Class } from "@/generated/prisma/client";

export type ClassWithCount = Class & {
  _count: { students: number };
};

export async function createClass(
  input: CreateClassInput
): Promise<ActionResult<Class>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = CreateClassSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const cls = await prisma.class.create({ data: parsed.data });
    await writeAuditLog(user.id, "CREATE", "Class", cls.id, { after: cls });
    return { success: true, data: cls };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateClass(
  id: string,
  input: UpdateClassInput
): Promise<ActionResult<Class>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = UpdateClassSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const before = await prisma.class.findUnique({ where: { id } });
    if (!before) return { success: false, error: "班级不存在" };

    const cls = await prisma.class.update({ where: { id }, data: parsed.data });
    await writeAuditLog(user.id, "UPDATE", "Class", id, { before, after: cls });
    return { success: true, data: cls };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function deleteClass(id: string): Promise<ActionResult<void>> {
  try {
    const user = await requireRole("ADMIN");
    const cls = await prisma.class.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });
    if (!cls) return { success: false, error: "班级不存在" };
    if (cls._count.students > 0) {
      return { success: false, error: `该班级还有 ${cls._count.students} 名学生，请先转班后再删除` };
    }

    await prisma.class.delete({ where: { id } });
    await writeAuditLog(user.id, "DELETE", "Class", id, { before: cls });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getClasses(): Promise<ClassWithCount[]> {
  await requireAuth();
  return prisma.class.findMany({
    where: { archived: false },
    include: { _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getClassById(id: string) {
  await requireAuth();
  return prisma.class.findUnique({
    where: { id },
    include: {
      _count: { select: { students: true } },
      students: {
        select: {
          id: true,
          studentNo: true,
          name: true,
          phone: true,
          enrollmentStatus: true,
          paymentStatus: true,
        },
        orderBy: { studentNo: "asc" },
      },
    },
  });
}
