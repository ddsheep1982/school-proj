import { getClasses } from "@/actions/class.actions";
import { getCampuses } from "@/actions/campus.actions";
import { getGrades } from "@/actions/grade.actions";
import Link from "next/link";
import ClassCard from "@/components/classes/ClassCard";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ClassesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const campusId = sp.campusId || undefined;
  const gradeId = sp.gradeId || undefined;

  const [classes, campuses, grades] = await Promise.all([
    getClasses({ campusId, gradeId }),
    getCampuses(),
    getGrades(campusId),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">班级管理</h1>
        <Link
          href="/classes/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
        >
          + 新建班级
        </Link>
      </div>

      <form method="GET" className="flex flex-wrap gap-3 bg-white p-4 rounded-lg border border-gray-200">
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
        <select
          name="gradeId"
          defaultValue={gradeId ?? ""}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有年级</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-1.5 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700"
        >
          筛选
        </button>
        <Link href="/classes" className="px-4 py-1.5 border border-gray-300 text-sm rounded-md hover:bg-gray-50">
          重置
        </Link>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classes.length === 0 && (
          <p className="text-gray-400 col-span-3 text-center py-12">暂无班级</p>
        )}
        {classes.map((c) => (
          <ClassCard key={c.id} cls={c} />
        ))}
      </div>
    </div>
  );
}
