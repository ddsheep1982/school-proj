import { getClasses } from "@/actions/class.actions";
import Link from "next/link";

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
        {classes.map((c) => {
          const enrolled = c._count.students;
          const remaining = c.capacity - enrolled;
          const full = remaining <= 0;
          return (
            <Link
              key={c.id}
              href={`/classes/${c.id}`}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{c.name}</h3>
                {full && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    已满
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {enrolled} / {c.capacity} 人
              </p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                <div
                  className={`h-1.5 rounded-full ${full ? "bg-red-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.min(100, (enrolled / c.capacity) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                剩余 {Math.max(0, remaining)} 个名额
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
