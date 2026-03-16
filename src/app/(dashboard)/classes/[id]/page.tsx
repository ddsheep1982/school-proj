import { notFound } from "next/navigation";
import { getClassById } from "@/actions/class.actions";
import { EnrollmentStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({ params }: Props) {
  const { id } = await params;
  const cls = await getClassById(id);
  if (!cls) notFound();

  const enrolled = cls._count.students;
  const remaining = cls.capacity - enrolled;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/classes" className="text-gray-400 hover:text-gray-600">
            ← 班级列表
          </Link>
          <h1 className="text-2xl font-bold">{cls.name}</h1>
          <span className="text-gray-400 text-sm">
            {enrolled}/{cls.capacity} 人 · 剩余 {Math.max(0, remaining)} 个名额
          </span>
        </div>
        <Link
          href={`/classes/${id}/edit`}
          className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
        >
          编辑
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-medium">学生名单</h2>
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
            {cls.students.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  暂无学生
                </td>
              </tr>
            )}
            {cls.students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.studentNo}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">
                  <EnrollmentStatusBadge status={s.enrollmentStatus} />
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={s.paymentStatus} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/students/${s.id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    查看
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
