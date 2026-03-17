"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { waiveInvoice } from "@/actions/invoice.actions";
import type { InvoiceWithStatus } from "@/actions/invoice.actions";

const STATUS_BADGES: Record<string, string> = {
  OUTSTANDING: "bg-yellow-100 text-yellow-800",
  PARTIAL: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  WAIVED: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  OUTSTANDING: "未付",
  PARTIAL: "部分付款",
  PAID: "已付清",
  WAIVED: "已豁免",
};

interface Props {
  invoices: InvoiceWithStatus[];
  outstandingBalance: number;
}

export default function StudentInvoiceList({ invoices, outstandingBalance }: Props) {
  const router = useRouter();
  const [waivingId, setWaivingId] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState("");
  const [waiveError, setWaiveError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleWaive(id: string) {
    if (!waiveReason.trim()) { setWaiveError("请填写豁免原因"); return; }
    setPending(true);
    setWaiveError(null);
    try {
      const result = await waiveInvoice({ invoiceId: id, waivedReason: waiveReason });
      if (!result.success) {
        setWaiveError(result.error);
      } else {
        setWaivingId(null);
        setWaiveReason("");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">待缴总金额</span>
        <span className="text-xl font-bold text-red-600">
          ¥{outstandingBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
          暂无发票记录
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">费用项目</th>
                <th className="px-4 py-3 text-left">学年</th>
                <th className="px-4 py-3 text-right">应付</th>
                <th className="px-4 py-3 text-right">已付</th>
                <th className="px-4 py-3 text-left">截止日期</th>
                <th className="px-4 py-3 text-center">状态</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <>
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{inv.feeAssignment.feeStructure.name}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.feeAssignment.feeStructure.academicYear}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      ¥{Number(inv.amountDue).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      ¥{inv.amountPaid.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(inv.dueDate).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[inv.status] ?? ""}`}
                      >
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status !== "PAID" && inv.status !== "WAIVED" && (
                        <button
                          onClick={() => { setWaivingId(inv.id); setWaiveReason(""); setWaiveError(null); }}
                          className="text-orange-500 hover:underline text-xs"
                        >
                          豁免
                        </button>
                      )}
                    </td>
                  </tr>
                  {waivingId === inv.id && (
                    <tr key={`${inv.id}-waive`} className="bg-orange-50">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-orange-700 font-medium">豁免原因：</span>
                          <input
                            value={waiveReason}
                            onChange={(e) => setWaiveReason(e.target.value)}
                            placeholder="请填写豁免原因..."
                            className="border border-orange-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                          {waiveError && <span className="text-red-500 text-xs">{waiveError}</span>}
                          <button
                            onClick={() => handleWaive(inv.id)}
                            disabled={pending}
                            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm rounded"
                          >
                            {pending ? "处理中..." : "确认豁免"}
                          </button>
                          <button
                            onClick={() => setWaivingId(null)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm rounded"
                          >
                            取消
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
