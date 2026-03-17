"use client";

import { useRouter } from "next/navigation";
import { deleteRefundRecord } from "@/actions/refund.actions";
import type { RefundRecordWithInvoice } from "@/actions/refund.actions";

interface Props {
  records: RefundRecordWithInvoice[];
}

export default function RefundRecordList({ records }: Props) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("确定删除该退费记录？")) return;
    const result = await deleteRefundRecord(id);
    if (!result.success) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  if (records.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">暂无退费记录</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
        <tr>
          <th className="px-3 py-2 text-left">退费日期</th>
          <th className="px-3 py-2 text-left">原因</th>
          <th className="px-3 py-2 text-right">金额</th>
          <th className="px-3 py-2 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {records.map((r) => (
          <tr key={r.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 text-gray-500">{new Date(r.refundDate).toLocaleDateString("zh-CN")}</td>
            <td className="px-3 py-2 text-gray-600">{r.reason}</td>
            <td className="px-3 py-2 text-right font-mono text-orange-600">
              ¥{Number(r.amount).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
            </td>
            <td className="px-3 py-2 text-right">
              <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline text-xs">删除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
