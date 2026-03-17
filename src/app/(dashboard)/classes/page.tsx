import { getClasses } from "@/actions/class.actions";
import Link from "next/link";
import ClassCard from "@/components/classes/ClassCard";

export default async function ClassesPage() {
  const classes = await getClasses();

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
