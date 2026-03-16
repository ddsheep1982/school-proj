"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPayment } from "@/actions/payment.actions";

export default function PaymentForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentType: "CASH",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createPayment({
      studentId,
      amount: parseFloat(form.amount),
      paymentDate: new Date(form.paymentDate + "T00:00:00").toISOString(),
      paymentType: form.paymentType as "CASH" | "BANK_TRANSFER" | "WECHAT" | "ALIPAY" | "OTHER",
      notes: form.notes || undefined,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setForm({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), paymentType: "CASH", notes: "" });
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium">记录缴费</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">金额 (元) *</label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">缴费日期</label>
          <input
            type="date"
            value={form.paymentDate}
            onChange={(e) => set("paymentDate", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">缴费方式</label>
          <select
            value={form.paymentType}
            onChange={(e) => set("paymentType", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CASH">现金</option>
            <option value="BANK_TRANSFER">银行转账</option>
            <option value="WECHAT">微信</option>
            <option value="ALIPAY">支付宝</option>
            <option value="OTHER">其他</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">备注</label>
          <input
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-md"
      >
        {loading ? "保存中..." : "记录缴费"}
      </button>
    </form>
  );
}
