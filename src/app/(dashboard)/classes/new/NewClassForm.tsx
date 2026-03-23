"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClass } from "@/actions/class.actions";
import type { GradeWithCount } from "@/actions/grade.actions";

export default function NewClassForm({ grades }: { grades: GradeWithCount[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [gradeId, setGradeId] = useState(grades[0]?.id ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createClass({ name, capacity: parseInt(capacity), gradeId });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      router.push("/classes");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">年级 *</label>
        <select
          required
          value={gradeId}
          onChange={(e) => setGradeId(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择年级</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.campus.name} — {g.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">班级名称 *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">最大容量 *</label>
        <input
          required
          type="number"
          min="1"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-md"
        >
          {loading ? "保存中..." : "创建班级"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
