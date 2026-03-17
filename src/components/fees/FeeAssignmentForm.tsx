"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFeeAssignment } from "@/actions/fee-assignment.actions";
import type { FeeStructure, Class } from "@/generated/prisma/client";

type SerializedFeeStructure = Omit<FeeStructure, "amount"> & { amount: number };

interface Props {
  structures: SerializedFeeStructure[];
  classes: Class[];
}

export default function FeeAssignmentForm({ structures, classes }: Props) {
  const router = useRouter();
  const [targetType, setTargetType] = useState<"student" | "class">("class");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    try {
      const feeStructureId = fd.get("feeStructureId") as string;
      const dueDate = new Date(fd.get("dueDate") as string).toISOString();

      const input =
        targetType === "class"
          ? { targetType: "class" as const, feeStructureId, classId: fd.get("classId") as string, dueDate }
          : { targetType: "student" as const, feeStructureId, studentId: fd.get("studentId") as string, dueDate };

      const result = await createFeeAssignment(input);
      if (!result.success) {
        setError(result.error);
      } else {
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">费用项目</label>
        <select
          name="feeStructureId"
          required
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择...</option>
          {structures.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.academicYear})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分配对象</label>
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              value="class"
              checked={targetType === "class"}
              onChange={() => setTargetType("class")}
            />
            班级（批量）
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              value="student"
              checked={targetType === "student"}
              onChange={() => setTargetType("student")}
            />
            单个学生
          </label>
        </div>
      </div>
      {targetType === "class" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">班级</label>
          <select
            name="classId"
            required
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">学生ID</label>
          <input
            name="studentId"
            required
            placeholder="学生 CUID..."
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
        <input
          name="dueDate"
          type="date"
          required
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md"
      >
        {pending ? "分配中..." : "创建分配"}
      </button>
    </form>
  );
}
