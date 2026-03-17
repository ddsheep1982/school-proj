"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRefundRecord } from "@/actions/refund.actions";

interface Invoice { id: string; amountDue: number }

interface Props {
  studentId: string;
  invoices?: Invoice[];
}

export default function RefundRecordForm({ studentId, invoices = [] }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    try {
      const invoiceId = (fd.get("invoiceId") as string) || undefined;
      const result = await createRefundRecord({
        studentId,
        invoiceId,
        amount: parseFloat(fd.get("amount") as string),
        reason: fd.get("reason") as string,
        refundDate: new Date(fd.get("refundDate") as string).toISOString(),
      });
      if (!result.success) {
        setError(result.error);
      } else {
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">退费金额（元）</label>
          <input name="amount" type="number" step="0.01" min="0.01" required
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">退费日期</label>
          <input name="refundDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">退费原因</label>
        <input name="reason" required placeholder="退费原因..."
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {invoices.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">关联发票（可选）</label>
          <select name="invoiceId"
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">不关联发票</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                ¥{Number(inv.amountDue).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" disabled={pending}
        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-md">
        {pending ? "提交中..." : "记录退费"}
      </button>
    </form>
  );
}
