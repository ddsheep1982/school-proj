import type { InvoiceStatus } from "@/types/index";

export type InvoiceForStatus = {
  amountDue: { toNumber(): number } | number;
  waivedAt: Date | null;
  payments: Array<{ amount: { toNumber(): number } | number }>;
};

function toNumber(val: { toNumber(): number } | number): number {
  return typeof val === "number" ? val : val.toNumber();
}

export function computeInvoiceStatus(invoice: InvoiceForStatus): InvoiceStatus {
  if (invoice.waivedAt !== null) return "WAIVED";

  const amountDue = toNumber(invoice.amountDue);
  const amountPaid = invoice.payments.reduce(
    (sum, p) => sum + toNumber(p.amount),
    0
  );

  if (amountPaid >= amountDue) return "PAID";
  if (amountPaid > 0) return "PARTIAL";
  return "OUTSTANDING";
}

export function computeAmountPaid(
  payments: Array<{ amount: { toNumber(): number } | number }>
): number {
  return payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
}
