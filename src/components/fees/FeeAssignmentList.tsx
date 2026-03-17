"use client";

import { useRouter } from "next/navigation";
import { deleteFeeAssignment } from "@/actions/fee-assignment.actions";
import type { FeeAssignmentWithDetails } from "@/actions/fee-assignment.actions";

interface Props {
  assignments: FeeAssignmentWithDetails[];
}

export default function FeeAssignmentList({ assignments }: Props) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("确定删除该分配记录？此操作将同时删除未支付的发票。")) return;
    const result = await deleteFeeAssignment(id);
    if (!result.success) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold">分配记录</h2>
      </div>
      {assignments.length === 0 ? (
        <p className="p-6 text-center text-gray-400 text-sm">暂无分配记录</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">费用项目</th>
              <th className="px-4 py-3 text-left">学年</th>
              <th className="px-4 py-3 text-left">分配对象</th>
              <th className="px-4 py-3 text-center">发票数</th>
              <th className="px-4 py-3 text-left">截止日期</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.feeStructure.name}</td>
                <td className="px-4 py-3 text-gray-500">{a.feeStructure.academicYear}</td>
                <td className="px-4 py-3">
                  {a.student ? (
                    <span>{a.student.name} <span className="text-gray-400">({a.student.studentNo})</span></span>
                  ) : a.class ? (
                    <span className="text-blue-600">班级：{a.class.name}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">{a._count.invoices}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(a.dueDate).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-red-500 hover:underline text-xs"
                    title="有已支付发票时不可删除"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
