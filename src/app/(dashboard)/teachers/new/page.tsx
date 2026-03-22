"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeacher } from "@/actions/teacher.actions";

export default function NewTeacherPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPhoneError("");
    const result = await createTeacher({ name, phone });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      setPhoneError(result.fieldErrors?.phone?.[0] ?? "");
    } else {
      router.push("/teachers");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">新增招生老师</h1>
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
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${phoneError ? "border-red-400" : "border-gray-300"}`} />
          {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-md">
            {loading ? "保存中..." : "创建老师"}
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
