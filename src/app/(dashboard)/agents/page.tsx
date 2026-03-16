import { getAgents } from "@/actions/agent.actions";
import Link from "next/link";

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">招生代理</h1>
        <Link href="/agents/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md">
          + 新增代理
        </Link>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">姓名</th>
              <th className="px-4 py-3 text-left">机构名称</th>
              <th className="px-4 py-3 text-left">联系电话</th>
              <th className="px-4 py-3 text-left">学生数</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">暂无数据</td></tr>
            )}
            {agents.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 text-gray-600">{a.agencyName ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{a.phone}</td>
                <td className="px-4 py-3">{a._count.recruitedStudents}</td>
                <td className="px-4 py-3">
                  <Link href={`/agents/${a.id}`} className="text-blue-600 hover:underline text-xs">查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
