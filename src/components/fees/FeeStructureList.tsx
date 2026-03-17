"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFeeStructure, updateFeeStructure } from "@/actions/fee-structure.actions";
import type { FeeStructure } from "@/generated/prisma/client";

const RECURRENCE_LABELS: Record<string, string> = {
  ONE_TIME: "一次性",
  TERM: "每学期",
  ANNUAL: "每学年",
};

type SerializedFeeStructure = Omit<FeeStructure, "amount"> & { amount: number };

interface Props {
  structures: SerializedFeeStructure[];
  academicYear?: string;
}

export default function FeeStructureList({ structures, academicYear }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("确定删除该费用项目？")) return;
    const result = await deleteFeeStructure(id);
    if (!result.success) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleEditSave(id: string) {
    setEditError(null);
    const result = await updateFeeStructure(id, { name: editName });
    if (!result.success) {
      setEditError(result.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold">费用项目列表</h2>
        <form method="GET" className="flex gap-2">
          <input
            name="academicYear"
            defaultValue={academicYear}
            placeholder="筛选学年..."
            className="border border-gray-300 rounded px-2 py-1 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm rounded"
          >
            筛选
          </button>
        </form>
      </div>
      {structures.length === 0 ? (
        <p className="p-6 text-center text-gray-400 text-sm">暂无费用项目</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">名称</th>
              <th className="px-4 py-3 text-left">学年</th>
              <th className="px-4 py-3 text-left">周期</th>
              <th className="px-4 py-3 text-right">金额</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {structures.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editingId === s.id ? (
                    <div className="flex gap-1">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-0.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {editError && <span className="text-red-500 text-xs">{editError}</span>}
                    </div>
                  ) : (
                    <span>{s.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{s.academicYear}</td>
                <td className="px-4 py-3 text-gray-500">{RECURRENCE_LABELS[s.recurrence] ?? s.recurrence}</td>
                <td className="px-4 py-3 text-right font-mono">
                  ¥{Number(s.amount).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {editingId === s.id ? (
                    <>
                      <button
                        onClick={() => handleEditSave(s.id)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-500 hover:underline text-xs"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingId(s.id); setEditName(s.name); setEditError(null); }}
                        className="text-blue-600 hover:underline text-xs"
                        title="有分配记录时不可修改"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-500 hover:underline text-xs"
                        title="有分配记录时不可删除"
                      >
                        删除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
