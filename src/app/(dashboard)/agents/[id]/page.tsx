import { notFound } from "next/navigation";
import { getAgentById } from "@/actions/agent.actions";
import { EnrollmentStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/agents" className="text-gray-400 hover:text-gray-600">← 招生代理</Link>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          {agent.agencyName && <span className="text-gray-500 text-sm">({agent.agencyName})</span>}
          <span className="text-gray-500 text-sm">{agent.phone}</span>
        </div>
        <Link href={`/agents/${id}/edit`}
          className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50">
          编辑
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">招生学生数</p>
          <p className="text-3xl font-bold mt-1">{agent._count.recruitedStudents}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-medium">招生学生名单</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">学号</th>
              <th className="px-4 py-3 text-left">姓名</th>
              <th className="px-4 py-3 text-left">在读状态</th>
              <th className="px-4 py-3 text-left">缴费状态</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agent.recruitedStudents.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">暂无学生</td></tr>
            )}
            {agent.recruitedStudents.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.studentNo}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3"><EnrollmentStatusBadge status={s.enrollmentStatus} /></td>
                <td className="px-4 py-3"><PaymentStatusBadge status={s.paymentStatus} /></td>
                <td className="px-4 py-3">
                  <Link href={`/students/${s.id}`} className="text-blue-600 hover:underline text-xs">查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
