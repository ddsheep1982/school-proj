"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  CreateFeeAssignmentSchema,
  type ActionResult,
  type CreateFeeAssignmentInput,
} from "@/types/index";
import type { FeeAssignment } from "@/generated/prisma/client";

export type FeeAssignmentWithDetails = FeeAssignment & {
  feeStructure: { name: string; academicYear: string };
  student: { name: string; studentNo: string } | null;
  class: { name: string } | null;
  _count: { invoices: number };
};

export async function createFeeAssignment(
  input: CreateFeeAssignmentInput
): Promise<ActionResult<{ assignment: FeeAssignment; invoicesCreated: number }>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = CreateFeeAssignmentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: data.feeStructureId },
    });
    if (!feeStructure) return { success: false, error: "费用项目不存在" };

    const dueDate = new Date(data.dueDate);

    if (data.targetType === "student") {
      const student = await prisma.student.findUnique({ where: { id: data.studentId } });
      if (!student) return { success: false, error: "学生不存在" };

      const assignment = await prisma.feeAssignment.create({
        data: {
          feeStructureId: data.feeStructureId,
          studentId: data.studentId,
          dueDate,
          invoices: {
            create: {
              studentId: data.studentId,
              amountDue: feeStructure.amount,
              dueDate,
            },
          },
        },
      });

      await writeAuditLog(user.id, "CREATE", "FeeAssignment", assignment.id, {
        after: { ...assignment, invoicesCreated: 1 },
      });
      return { success: true, data: { assignment, invoicesCreated: 1 } };
    } else {
      const students = await prisma.student.findMany({
        where: { classId: data.classId, enrollmentStatus: "ACTIVE" },
        select: { id: true },
      });

      const assignment = await prisma.feeAssignment.create({
        data: {
          feeStructureId: data.feeStructureId,
          classId: data.classId,
          dueDate,
          invoices: {
            create: students.map((s) => ({
              studentId: s.id,
              amountDue: feeStructure.amount,
              dueDate,
            })),
          },
        },
      });

      await writeAuditLog(user.id, "CREATE", "FeeAssignment", assignment.id, {
        after: { ...assignment, invoicesCreated: students.length },
      });
      return { success: true, data: { assignment, invoicesCreated: students.length } };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getFeeAssignments(filters?: {
  feeStructureId?: string;
  classId?: string;
}): Promise<FeeAssignmentWithDetails[]> {
  await requireRole("ADMIN");
  return prisma.feeAssignment.findMany({
    where: {
      ...(filters?.feeStructureId ? { feeStructureId: filters.feeStructureId } : {}),
      ...(filters?.classId ? { classId: filters.classId } : {}),
    },
    include: {
      feeStructure: { select: { name: true, academicYear: true } },
      student: { select: { name: true, studentNo: true } },
      class: { select: { name: true } },
      _count: { select: { invoices: true } },
    },
    orderBy: { createdAt: "desc" },
  }) as Promise<FeeAssignmentWithDetails[]>;
}

export async function deleteFeeAssignment(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole("ADMIN");

    const invoicesWithPayments = await prisma.invoice.count({
      where: {
        feeAssignmentId: id,
        payments: { some: {} },
      },
    });
    if (invoicesWithPayments > 0) {
      return { success: false, error: "该分配下存在已支付发票，无法删除" };
    }

    await prisma.feeAssignment.delete({ where: { id } });
    await writeAuditLog(user.id, "DELETE", "FeeAssignment", id, {});
    return { success: true, data: { id } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
