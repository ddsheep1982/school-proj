"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTeacher } from "@/actions/teacher.actions";

export default function EditTeacherForm({
  id, name: n, phone: p, active: a,
}: { id: string; name: string; phone: string; active: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(n);
  const [phone, setPhone] = useState(p);
  const [active, setActive] = useState(a);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await updateTeacher(id, { name, phone, active });
    setLoading(false);
    if (!result.success) setError(result.error);
    else { router.push(`/teachers/${id}`); router.refresh(); }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
        <input required value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <label htmlFor="active" className="text-sm text-gray-700">在职状态</label>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-md">
          {loading ? "保存中..." : "保存修改"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50">
          取消
        </button>
      </div>
    </form>
  );
}
