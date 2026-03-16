import { getTeachers } from "@/actions/teacher.actions";
import Link from "next/link";

export default async function TeachersPage() {
  const teachers = await getTeachers();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">招生老师</h1>
        <Link
          href="/teachers/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
        >
          + 新增老师
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">姓名</th>
              <th className="px-4 py-3 text-left">联系电话</th>
              <th className="px-4 py-3 text-left">学生数</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teachers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">暂无数据</td>
              </tr>
            )}
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-gray-600">{t.phone}</td>
                <td className="px-4 py-3">{t._count.enrolledStudents}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${t.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {t.active ? "在职" : "离职"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/teachers/${t.id}`} className="text-blue-600 hover:underline text-xs">
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
