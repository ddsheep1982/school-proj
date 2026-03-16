"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/actions/user.actions";

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createUser({ ...form, role: form.role as "ADMIN" | "STAFF" });
    setLoading(false);
    if (!result.success) setError(result.error);
    else { router.push("/admin/users"); router.refresh(); }
  }

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">新增用户</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {[
          { label: "姓名", field: "name", type: "text" },
          { label: "邮箱", field: "email", type: "email" },
          { label: "密码（至少8位）", field: "password", type: "password" },
        ].map(({ label, field, type }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
            <input required type={type} value={form[field as keyof typeof form]}
              onChange={(e) => set(field, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
          <select value={form.role} onChange={(e) => set("role", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="STAFF">教务 (Staff)</option>
            <option value="ADMIN">管理员 (Admin)</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-md">
            {loading ? "保存中..." : "创建用户"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
