"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStudent, updateStudent } from "@/actions/student.actions";
import type { StudentDetail } from "@/actions/student.actions";

interface Props {
  classes: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  agents: { id: string; name: string; agencyName: string | null }[];
  student?: StudentDetail;
}

export default function StudentForm({ classes, teachers, agents, student }: Props) {
  const router = useRouter();
  const isEdit = !!student;

  const [form, setForm] = useState({
    name: student?.name ?? "",
    phone: student?.phone ?? "",
    guardianPhone: student?.guardianPhone ?? "",
    enrollmentDate: student?.enrollmentDate
      ? new Date(student.enrollmentDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    enrollmentStatus: student?.enrollmentStatus ?? "ACTIVE",
    paymentStatus: student?.paymentStatus ?? "PAID",
    classId: student?.classId ?? "",
    enrollmentTeacherId: student?.enrollmentTeacherId ?? "",
    receptionTeacherId: student?.receptionTeacherId ?? "",
    recruitmentChannelType: student?.recruitmentChannelType ?? "",
    recruitmentTeacherId: student?.recruitmentTeacherId ?? "",
    recruitmentAgentId: student?.recruitmentAgentId ?? "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const enrollmentDate = new Date(form.enrollmentDate + "T00:00:00").toISOString();
    const channelType = form.recruitmentChannelType as "TEACHER" | "AGENT" | "" || undefined;

    const payload = {
      name: form.name,
      phone: form.phone,
      guardianPhone: form.guardianPhone,
      enrollmentDate,
      classId: form.classId || undefined,
      enrollmentTeacherId: form.enrollmentTeacherId || undefined,
      receptionTeacherId: form.receptionTeacherId || undefined,
      recruitmentChannelType: channelType,
      recruitmentTeacherId: channelType === "TEACHER" ? form.recruitmentTeacherId || undefined : undefined,
      recruitmentAgentId: channelType === "AGENT" ? form.recruitmentAgentId || undefined : undefined,
    };

    const result = isEdit
      ? await updateStudent(student!.id, {
          ...payload,
          enrollmentStatus: form.enrollmentStatus as "ACTIVE" | "WITHDRAWN" | "GRADUATED",
          paymentStatus: form.paymentStatus as "PAID" | "PARTIAL" | "OVERDUE",
        })
      : await createStudent(payload);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      router.push(`/students/${result.data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">基本信息</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              联系电话 <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              家长联系电话 <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.guardianPhone}
              onChange={(e) => set("guardianPhone", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">入学日期</label>
            <input
              type="date"
              value={form.enrollmentDate}
              onChange={(e) => set("enrollmentDate", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">在读状态</label>
              <select
                value={form.enrollmentStatus}
                onChange={(e) => set("enrollmentStatus", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">在读</option>
                <option value="WITHDRAWN">退学</option>
                <option value="GRADUATED">毕业</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">缴费状态</label>
              <select
                value={form.paymentStatus}
                onChange={(e) => set("paymentStatus", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PAID">已缴费</option>
                <option value="PARTIAL">部分缴费</option>
                <option value="OVERDUE">欠费</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">班级与招生信息</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">班级</label>
            <select
              value={form.classId}
              onChange={(e) => set("classId", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— 未分班 —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">招生老师</label>
            <select
              value={form.enrollmentTeacherId}
              onChange={(e) => set("enrollmentTeacherId", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— 未指定 —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">接待老师</label>
            <select
              value={form.receptionTeacherId}
              onChange={(e) => set("receptionTeacherId", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— 未指定 —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">招生渠道</label>
          <select
            value={form.recruitmentChannelType}
            onChange={(e) => set("recruitmentChannelType", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— 未指定 —</option>
            <option value="TEACHER">招生老师</option>
            <option value="AGENT">外部招生代理</option>
          </select>
        </div>

        {form.recruitmentChannelType === "TEACHER" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              招生老师 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.recruitmentTeacherId}
              onChange={(e) => set("recruitmentTeacherId", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— 请选择 —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {form.recruitmentChannelType === "AGENT" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              招生代理 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.recruitmentAgentId}
              onChange={(e) => set("recruitmentAgentId", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— 请选择 —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.agencyName ? ` (${a.agencyName})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md"
        >
          {loading ? "保存中..." : isEdit ? "保存修改" : "创建学生"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
