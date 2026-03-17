"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withdrawStudent, deleteStudent } from "@/actions/student.actions";

interface Props {
  studentId: string;
  hasRecords: boolean;
  isWithdrawn: boolean;
}

export default function StudentActions({ studentId, hasRecords, isWithdrawn }: Props) {
  const router = useRouter();
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().slice(0, 10));
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundDate, setRefundDate] = useState(new Date().toISOString().slice(0, 10));
  const [refundReason, setRefundReason] = useState("");
  const [refundInvoiceId, setRefundInvoiceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resetForm() {
    setShowWithdrawForm(false);
    setWithdrawalReason("");
    setShowRefund(false);
    setRefundAmount("");
    setRefundReason("");
    setRefundInvoiceId("");
    setError(null);
  }

  async function handleWithdraw() {
    if (!withdrawalReason.trim()) { setError("请填写退学原因"); return; }
    if (showRefund) {
      if (!refundAmount || Number(refundAmount) <= 0) { setError("退款金额必须大于0"); return; }
      if (!refundDate) { setError("请填写退款日期"); return; }
      if (!refundReason.trim()) { setError("请填写退款原因"); return; }
    }
    setError(null);
    setPending(true);
    try {
      const input: Parameters<typeof withdrawStudent>[1] = {
        withdrawalDate: new Date(withdrawalDate + "T00:00:00").toISOString(),
        withdrawalReason,
        ...(showRefund && {
          refundAmount: Number(refundAmount),
          refundDate: new Date(refundDate + "T00:00:00").toISOString(),
          refundReason,
          ...(refundInvoiceId.trim() && { refundInvoiceId: refundInvoiceId.trim() }),
        }),
      };
      const result = await withdrawStudent(studentId, input);
      if (!result.success) {
        setError(result.error);
      } else {
        resetForm();
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("确定永久删除该学生？此操作不可撤销。")) return;
    setPending(true);
    try {
      const result = await deleteStudent(studentId);
      if (!result.success) {
        alert(result.error);
      } else {
        router.push("/students");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!isWithdrawn && (
        <button
          onClick={() => setShowWithdrawForm(true)}
          className="text-orange-600 hover:underline text-xs"
          disabled={pending}
        >
          退学
        </button>
      )}
      {!hasRecords && (
        <button
          onClick={handleDelete}
          className="text-red-500 hover:underline text-xs"
          disabled={pending}
          title="仅无关联记录的学生可删除"
        >
          删除
        </button>
      )}

      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4">
            <h3 className="font-semibold text-lg">办理退学</h3>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">退学日期</label>
              <input
                type="date"
                value={withdrawalDate}
                onChange={(e) => setWithdrawalDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">退学原因</label>
              <textarea
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                rows={3}
                placeholder="请填写退学原因..."
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div className="border-t pt-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRefund}
                  onChange={(e) => setShowRefund(e.target.checked)}
                  className="rounded"
                />
                同时记录退款
              </label>
              {showRefund && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">退款金额（元）</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="请输入退款金额"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">退款日期</label>
                    <input
                      type="date"
                      value={refundDate}
                      onChange={(e) => setRefundDate(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">退款原因</label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="请填写退款原因"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">关联账单 ID（可选）</label>
                    <input
                      type="text"
                      value={refundInvoiceId}
                      onChange={(e) => setRefundInvoiceId(e.target.value)}
                      placeholder="留空则不关联账单"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-sm rounded-md"
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                disabled={pending}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-md"
              >
                {pending ? "处理中..." : "确认退学"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
