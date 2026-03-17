"use client";

import { useRouter } from "next/navigation";
import { deleteRecruitmentCost } from "@/actions/recruitment-cost.actions";
import type { RecruitmentCostWithRecipient } from "@/actions/recruitment-cost.actions";

interface Props {
  costs: RecruitmentCostWithRecipient[];
}

export default function RecruitmentCostList({ costs }: Props) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("确定删除该招生费用记录？")) return;
    const result = await deleteRecruitmentCost(id);
    if (!result.success) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  if (costs.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">暂无招生费用记录</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
        <tr>
          <th className="px-3 py-2 text-left">支付日期</th>
          <th className="px-3 py-2 text-left">收款方</th>
          <th className="px-3 py-2 text-right">金额</th>
          <th className="px-3 py-2 text-left">备注</th>
          <th className="px-3 py-2 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {costs.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 text-gray-500">{new Date(c.paymentDate).toLocaleDateString("zh-CN")}</td>
            <td className="px-3 py-2">
              {c.recipientType === "TEACHER"
                ? c.teacher?.name ?? "—"
                : c.agent
                  ? `${c.agent.name}${c.agent.agencyName ? ` (${c.agent.agencyName})` : ""}`
                  : "—"}
              <span className="ml-1 text-xs text-gray-400">
                ({c.recipientType === "TEACHER" ? "老师" : "代理"})
              </span>
            </td>
            <td className="px-3 py-2 text-right font-mono text-red-500">
              ¥{Number(c.amount).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
            </td>
            <td className="px-3 py-2 text-gray-400 text-xs">{c.notes ?? "—"}</td>
            <td className="px-3 py-2 text-right">
              <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline text-xs">删除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
