"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { WaiveInvoiceSchema, ListInvoicesSchema, type ActionResult, type WaiveInvoiceInput, type ListInvoicesInput } from "@/types/index";
import { computeInvoiceStatus, computeAmountPaid } from "@/lib/invoice.utils";
import type { Invoice } from "@/generated/prisma/client";

export type InvoiceWithStatus = Invoice & {
  feeAssignment: { feeStructure: { name: string; academicYear: string } };
  student: { name: string; studentNo: string };
  payments: { amount: { toNumber(): number } }[];
  status: import("@/types/index").InvoiceStatus;
  amountPaid: number;
};

function enrichInvoice(
  invoice: Invoice & {
    feeAssignment: { feeStructure: { name: string; academicYear: string } };
    student: { name: string; studentNo: string };
    payments: { amount: { toNumber(): number } }[];
  }
): InvoiceWithStatus {
  return {
    ...invoice,
    status: computeInvoiceStatus(invoice),
    amountPaid: computeAmountPaid(invoice.payments),
  };
}

export async function getStudentInvoices(studentId: string): Promise<InvoiceWithStatus[]> {
  await requireAuth();
  const invoices = await prisma.invoice.findMany({
    where: { studentId },
    include: {
      feeAssignment: { include: { feeStructure: { select: { name: true, academicYear: true } } } },
      student: { select: { name: true, studentNo: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { dueDate: "asc" },
  });
  return invoices.map(enrichInvoice);
}

export async function waiveInvoice(input: WaiveInvoiceInput): Promise<ActionResult<Invoice>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = WaiveInvoiceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: parsed.data.invoiceId },
      include: { payments: { select: { amount: true } } },
    });
    if (!invoice) return { success: false, error: "发票不存在" };

    const status = computeInvoiceStatus(invoice);
    if (status === "PAID") return { success: false, error: "已付清的发票无法豁免" };

    const updated = await prisma.invoice.update({
      where: { id: parsed.data.invoiceId },
      data: { waivedAt: new Date(), waivedReason: parsed.data.waivedReason },
    });

    await writeAuditLog(user.id, "UPDATE", "Invoice", updated.id, {
      after: { waivedAt: updated.waivedAt, waivedReason: updated.waivedReason },
    });
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getStudentOutstandingBalance(studentId: string): Promise<number> {
  await requireAuth();
  const invoices = await prisma.invoice.findMany({
    where: { studentId, waivedAt: null },
    include: { payments: { select: { amount: true } } },
  });

  return invoices.reduce((total, inv) => {
    const amountDue = inv.amountDue.toNumber();
    const amountPaid = computeAmountPaid(inv.payments);
    const remaining = Math.max(0, amountDue - amountPaid);
    return total + remaining;
  }, 0);
}

export async function listInvoices(input: ListInvoicesInput): Promise<{
  invoices: InvoiceWithStatus[];
  total: number;
}> {
  await requireRole("ADMIN");
  const parsed = ListInvoicesSchema.parse(input);
  const { page, pageSize, academicYear } = parsed;

  const allInvoices = await prisma.invoice.findMany({
    where: academicYear
      ? { feeAssignment: { feeStructure: { academicYear } } }
      : undefined,
    include: {
      feeAssignment: { include: { feeStructure: { select: { name: true, academicYear: true } } } },
      student: { select: { name: true, studentNo: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const enriched = allInvoices.map(enrichInvoice);

  const filtered = parsed.status
    ? enriched.filter((inv) => inv.status === parsed.status)
    : enriched;

  const start = (page - 1) * pageSize;
  return {
    invoices: filtered.slice(start, start + pageSize),
    total: filtered.length,
  };
}
