import { getCampuses } from "@/actions/campus.actions";
import Link from "next/link";

export default async function CampusesPage() {
  const campuses = await getCampuses();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">校区管理</h1>
        <Link
          href="/campuses/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
        >
          + 新建校区
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {campuses.length === 0 ? (
          <p className="text-gray-400 text-center py-12">暂无校区</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">校区名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">描述</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">年级数</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campuses.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.description ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{c._count.grades}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/campuses/${c.id}/edit`}
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
