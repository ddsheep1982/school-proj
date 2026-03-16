"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCheckIn, recordCheckOut } from "@/actions/attendance.actions";

export default function AttendanceForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(today);
  const [time, setTime] = useState(now);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(type: "in" | "out") {
    setLoading(true);
    setError("");
    setSuccess("");

    const result =
      type === "in"
        ? await recordCheckIn(studentId, date, time)
        : await recordCheckOut(studentId, date, time);

    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(type === "in" ? "签到成功" : "签出成功");
      router.refresh();
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-medium">记录考勤</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">时间</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => handle("in")}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-md"
        >
          签到 (到校)
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handle("out")}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white text-sm rounded-md"
        >
          签出 (离校)
        </button>
      </div>
    </div>
  );
}
