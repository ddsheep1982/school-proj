"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  CreateRefundRecordSchema,
  type ActionResult,
  type CreateRefundRecordInput,
} from "@/types/index";
import type { RefundRecord } from "@/generated/prisma/client";

export type RefundRecordWithInvoice = Omit<RefundRecord, "amount"> & {
  amount: number;
  invoice: { id: string; amountDue: number } | null;
};

export async function createRefundRecord(
  input: CreateRefundRecordInput
): Promise<ActionResult<RefundRecord>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = CreateRefundRecordSchema.safeParse(input);
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
      if (invoice.studentId !== data.studentId) return { success: false, error: "发票不属于该学生" };
    }

    const record = await prisma.refundRecord.create({
      data: {
        studentId: data.studentId,
        invoiceId: data.invoiceId ?? null,
        amount: data.amount,
        reason: data.reason,
        refundDate: new Date(data.refundDate),
        createdById: user.id,
      },
    });

    await writeAuditLog(user.id, "CREATE", "RefundRecord", record.id, { after: record });
    return { success: true, data: record };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getRefundsByStudent(studentId: string): Promise<RefundRecordWithInvoice[]> {
  await requireRole("ADMIN");
  const records = await prisma.refundRecord.findMany({
    where: { studentId },
    include: {
      invoice: { select: { id: true, amountDue: true } },
    },
    orderBy: { refundDate: "desc" },
  });
  return records.map((r) => ({
    ...r,
    amount: Number(r.amount),
    invoice: r.invoice ? { id: r.invoice.id, amountDue: Number(r.invoice.amountDue) } : null,
  })) as RefundRecordWithInvoice[];
}

export async function deleteRefundRecord(id: string): Promise<ActionResult<void>> {
  try {
    const user = await requireRole("ADMIN");
    const record = await prisma.refundRecord.findUnique({ where: { id } });
    if (!record) return { success: false, error: "记录不存在" };

    await prisma.refundRecord.delete({ where: { id } });
    await writeAuditLog(user.id, "DELETE", "RefundRecord", id, { before: record });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
