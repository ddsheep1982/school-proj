"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteClass } from "@/actions/class.actions";
import type { ClassWithCount } from "@/actions/class.actions";

interface Props {
  cls: ClassWithCount;
}

export default function ClassCard({ cls }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const enrolled = cls._count.students;
  const remaining = cls.capacity - enrolled;
  const full = remaining <= 0;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`确定删除班级「${cls.name}」？此操作不可撤销。`)) return;
    setPending(true);
    try {
      const result = await deleteClass(cls.id);
      if (!result.success) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <Link href={`/classes/${cls.id}`} className="block">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{cls.name}</h3>
          {full && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">已满</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {enrolled} / {cls.capacity} 人
        </p>
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
          <div
            className={`h-1.5 rounded-full ${full ? "bg-red-500" : "bg-blue-500"}`}
            style={{ width: `${Math.min(100, (enrolled / cls.capacity) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          剩余 {Math.max(0, remaining)} 个名额
        </p>
      </Link>
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleDelete}
          disabled={pending || enrolled > 0}
          title={enrolled > 0 ? "有学生时不可删除" : "删除班级"}
          className="text-xs text-red-500 hover:underline disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          {pending ? "删除中..." : "删除"}
        </button>
      </div>
    </div>
  );
}
