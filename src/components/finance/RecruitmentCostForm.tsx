"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRecruitmentCost } from "@/actions/recruitment-cost.actions";

interface Teacher { id: string; name: string }
interface Agent { id: string; name: string; agencyName: string | null }

interface Props {
  studentId: string;
  teachers: Teacher[];
  agents: Agent[];
}

export default function RecruitmentCostForm({ studentId, teachers, agents }: Props) {
  const router = useRouter();
  const [recipientType, setRecipientType] = useState<"TEACHER" | "AGENT">("TEACHER");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    try {
      const result = await createRecruitmentCost({
        studentId,
        amount: parseFloat(fd.get("amount") as string),
        paymentDate: new Date(fd.get("paymentDate") as string).toISOString(),
        recipientType,
        teacherId: recipientType === "TEACHER" ? (fd.get("teacherId") as string) || undefined : undefined,
        agentId: recipientType === "AGENT" ? (fd.get("agentId") as string) || undefined : undefined,
        notes: (fd.get("notes") as string) || undefined,
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
        <label className="block text-sm font-medium text-gray-700 mb-1">收款方类型</label>
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" value="TEACHER" checked={recipientType === "TEACHER"} onChange={() => setRecipientType("TEACHER")} />
            招生老师
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" value="AGENT" checked={recipientType === "AGENT"} onChange={() => setRecipientType("AGENT")} />
            招生代理
          </label>
        </div>
      </div>
      {recipientType === "TEACHER" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">招生老师</label>
          <select name="teacherId" required className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">请选择...</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">招生代理</label>
          <select name="agentId" required className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">请选择...</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}{a.agencyName ? ` (${a.agencyName})` : ""}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">金额（元）</label>
        <input name="amount" type="number" step="0.01" min="0.01" required className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">支付日期</label>
        <input name="paymentDate" type="date" required className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
        <input name="notes" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button type="submit" disabled={pending} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md">
        {pending ? "提交中..." : "记录招生费用"}
      </button>
    </form>
  );
}
