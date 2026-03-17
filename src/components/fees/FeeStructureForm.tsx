"use client";

import { useState } from "react";
import { createFeeStructure } from "@/actions/fee-structure.actions";
import { useRouter } from "next/navigation";

export default function FeeStructureForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    try {
      const result = await createFeeStructure({
        name: fd.get("name") as string,
        description: (fd.get("description") as string) || undefined,
        amount: parseFloat(fd.get("amount") as string),
        recurrence: fd.get("recurrence") as "ONE_TIME" | "TERM" | "ANNUAL",
        academicYear: fd.get("academicYear") as string,
      });
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
        <label className="block text-sm font-medium text-gray-700 mb-1">费用名称</label>
        <input
          name="name"
          required
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">描述（可选）</label>
        <input
          name="description"
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">金额（元）</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">周期类型</label>
        <select
          name="recurrence"
          required
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ONE_TIME">一次性</option>
          <option value="TERM">每学期</option>
          <option value="ANNUAL">每学年</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">学年</label>
        <input
          name="academicYear"
          required
          placeholder="e.g. 2026"
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md"
      >
        {pending ? "提交中..." : "创建费用项目"}
      </button>
    </form>
  );
}
