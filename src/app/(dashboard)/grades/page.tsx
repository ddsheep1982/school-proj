import { getGrades } from "@/actions/grade.actions";
import { getCampuses } from "@/actions/campus.actions";
import Link from "next/link";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function GradesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const campusId = sp.campusId || undefined;

  const [grades, campuses] = await Promise.all([getGrades(campusId), getCampuses()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">年级管理</h1>
        <Link
          href="/grades/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
        >
          + 新建年级
        </Link>
      </div>

      <form method="GET" className="flex gap-3">
        <select
          name="campusId"
          defaultValue={campusId ?? ""}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有校区</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-1.5 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700"
        >
          筛选
        </button>
        <Link href="/grades" className="px-4 py-1.5 border border-gray-300 text-sm rounded-md hover:bg-gray-50">
          重置
        </Link>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {grades.length === 0 ? (
          <p className="text-gray-400 text-center py-12">暂无年级</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">年级名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">所属校区</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">班级数</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grades.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-gray-500">{g.campus.name}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{g._count.classes}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/grades/${g.id}/edit`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      编辑
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
