"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  CreateTeacherSchema,
  UpdateTeacherSchema,
  type ActionResult,
  type CreateTeacherInput,
  type UpdateTeacherInput,
} from "@/types/index";
import type { EnrollmentTeacher } from "@/generated/prisma/client";

export async function createTeacher(
  input: CreateTeacherInput
): Promise<ActionResult<EnrollmentTeacher>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = CreateTeacherSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const teacher = await prisma.enrollmentTeacher.create({ data: parsed.data });
    await writeAuditLog(user.id, "CREATE", "EnrollmentTeacher", teacher.id, { after: teacher });
    return { success: true, data: teacher };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateTeacher(
  id: string,
  input: UpdateTeacherInput
): Promise<ActionResult<EnrollmentTeacher>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = UpdateTeacherSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const before = await prisma.enrollmentTeacher.findUnique({ where: { id } });
    if (!before) return { success: false, error: "招生老师不存在" };

    const teacher = await prisma.enrollmentTeacher.update({ where: { id }, data: parsed.data });
    await writeAuditLog(user.id, "UPDATE", "EnrollmentTeacher", id, { before, after: teacher });
    return { success: true, data: teacher };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function deleteTeacher(id: string): Promise<ActionResult<void>> {
  try {
    const user = await requireRole("ADMIN");
    const teacher = await prisma.enrollmentTeacher.findUnique({
      where: { id },
      include: {
        _count: { select: { enrolledStudents: true, recruitedStudents: true } },
      },
    });
    if (!teacher) return { success: false, error: "招生老师不存在" };

    const total = teacher._count.enrolledStudents + teacher._count.recruitedStudents;
    if (total > 0) {
      return {
        success: false,
        error: `该老师还关联着 ${total} 名学生，请先将学生转移后再删除`,
      };
    }

    await prisma.enrollmentTeacher.delete({ where: { id } });
    await writeAuditLog(user.id, "DELETE", "EnrollmentTeacher", id, { before: teacher });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getTeachers() {
  await requireAuth();
  return prisma.enrollmentTeacher.findMany({
    where: { active: true },
    include: { _count: { select: { enrolledStudents: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getTeacherById(id: string) {
  await requireAuth();
  return prisma.enrollmentTeacher.findUnique({
    where: { id },
    include: {
      enrolledStudents: {
        select: {
          id: true,
          studentNo: true,
          name: true,
          enrollmentStatus: true,
          paymentStatus: true,
        },
        orderBy: { studentNo: "asc" },
      },
      _count: { select: { enrolledStudents: true } },
    },
  });
}
