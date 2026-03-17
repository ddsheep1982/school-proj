"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  CreateFeeStructureSchema,
  UpdateFeeStructureSchema,
  type ActionResult,
  type CreateFeeStructureInput,
  type UpdateFeeStructureInput,
} from "@/types/index";
import type { FeeStructure } from "@/generated/prisma/client";

export async function createFeeStructure(
  input: CreateFeeStructureInput
): Promise<ActionResult<FeeStructure>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = CreateFeeStructureSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    const existing = await prisma.feeStructure.findUnique({
      where: { name_academicYear: { name: data.name, academicYear: data.academicYear } },
    });
    if (existing) {
      return { success: false, error: "该学年已存在同名费用项目" };
    }

    const record = await prisma.feeStructure.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        amount: data.amount,
        recurrence: data.recurrence,
        academicYear: data.academicYear,
      },
    });

    await writeAuditLog(user.id, "CREATE", "FeeStructure", record.id, { after: record });
    return { success: true, data: record };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getFeeStructures(academicYear?: string): Promise<FeeStructure[]> {
  await requireRole("ADMIN");
  return prisma.feeStructure.findMany({
    where: academicYear ? { academicYear } : undefined,
    orderBy: [{ academicYear: "desc" }, { name: "asc" }],
  });
}

export async function updateFeeStructure(
  id: string,
  input: UpdateFeeStructureInput
): Promise<ActionResult<FeeStructure>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = UpdateFeeStructureSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const assignmentCount = await prisma.feeAssignment.count({ where: { feeStructureId: id } });
    if (assignmentCount > 0) {
      return { success: false, error: "该费用项目已有关联分配记录，无法修改" };
    }

    const record = await prisma.feeStructure.update({
      where: { id },
      data: parsed.data,
    });

    await writeAuditLog(user.id, "UPDATE", "FeeStructure", record.id, { after: record });
    return { success: true, data: record };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function deleteFeeStructure(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole("ADMIN");

    const assignmentCount = await prisma.feeAssignment.count({ where: { feeStructureId: id } });
    if (assignmentCount > 0) {
      return { success: false, error: "该费用项目已有关联分配记录，无法删除" };
    }

    await prisma.feeStructure.delete({ where: { id } });
    await writeAuditLog(user.id, "DELETE", "FeeStructure", id, {});
    return { success: true, data: { id } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
