"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  CreatePaymentSchema,
  CreateAdjustmentSchema,
  type ActionResult,
  type CreatePaymentInput,
  type CreateAdjustmentInput,
} from "@/types/index";
import type { PaymentRecord } from "@/generated/prisma/client";

export type PaymentRecordWithUser = PaymentRecord & {
  createdBy: { id: string; name: string };
  original: PaymentRecord | null;
};

export async function createPayment(
  input: CreatePaymentInput
): Promise<ActionResult<PaymentRecord>> {
  try {
    const user = await requireAuth();
    const parsed = CreatePaymentSchema.safeParse(input);
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

    if (data.invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
      if (!invoice) return { success: false, error: "发票不存在" };
      if (invoice.studentId !== data.studentId) {
        return { success: false, error: "发票与学生不匹配" };
      }
    }

    const record = await prisma.paymentRecord.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentType: data.paymentType,
        notes: data.notes ?? null,
        invoiceId: data.invoiceId ?? null,
        createdById: user.id,
      },
    });

    await writeAuditLog(user.id, "CREATE", "PaymentRecord", record.id, { after: record });

    return { success: true, data: { ...record, amount: Number(record.amount) } as unknown as PaymentRecord };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function createAdjustment(
  input: CreateAdjustmentInput
): Promise<ActionResult<PaymentRecord>> {
  try {
    const user = await requireAuth();
    const parsed = CreateAdjustmentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    const original = await prisma.paymentRecord.findUnique({
      where: { id: data.originalId },
    });
    if (!original) return { success: false, error: "原始记录不存在" };

    const record = await prisma.paymentRecord.create({
      data: {
        studentId: original.studentId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentType: data.paymentType,
        notes: data.notes ?? null,
        isAdjustment: true,
        originalId: data.originalId,
        createdById: user.id,
      },
    });

    await writeAuditLog(user.id, "CREATE", "PaymentRecord", record.id, {
      after: { ...record, type: "adjustment", originalId: data.originalId },
    });

    return { success: true, data: { ...record, amount: Number(record.amount) } as unknown as PaymentRecord };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getPaymentsByStudent(
  studentId: string
): Promise<PaymentRecordWithUser[]> {
  await requireAuth();
  return prisma.paymentRecord.findMany({
    where: { studentId },
    include: {
      createdBy: { select: { id: true, name: true } },
      original: true,
    },
    orderBy: { paymentDate: "asc" },
  });
}
