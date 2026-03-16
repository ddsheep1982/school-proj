import { getDailyAttendance } from "@/actions/attendance.actions";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function AttendancePage({ searchParams }: Props) {
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = sp.date ?? today;

  const attendance = await getDailyAttendance(date);
  const present = attendance.filter((a) => a.checkIn !== null).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">考勤管理</h1>
        <form method="GET" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit"
            className="px-4 py-1.5 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700">
            查询
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">应到学生</p>
          <p className="text-3xl font-bold mt-1">{attendance.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">已到校</p>
          <p className="text-3xl font-bold mt-1 text-green-700">{present}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">未到校</p>
          <p className="text-3xl font-bold mt-1 text-red-700">{attendance.length - present}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">学号</th>
              <th className="px-4 py-3 text-left">姓名</th>
              <th className="px-4 py-3 text-left">班级</th>
              <th className="px-4 py-3 text-left">签到时间</th>
              <th className="px-4 py-3 text-left">签出时间</th>
              <th className="px-4 py-3 text-left">在校时长</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendance.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">暂无数据</td></tr>
            )}
            {attendance.map((a) => (
              <tr key={a.studentId} className={`hover:bg-gray-50 ${!a.checkIn ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.studentNo}</td>
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 text-gray-600">{a.className ?? "—"}</td>
                <td className="px-4 py-3">
                  {a.checkIn
                    ? new Date(a.checkIn).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
                    : <span className="text-gray-300">未签到</span>}
                </td>
                <td className="px-4 py-3">
                  {a.checkOut
                    ? new Date(a.checkOut).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  {a.duration != null
                    ? `${Math.floor(a.duration / 60)}h ${a.duration % 60}m`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/students/${a.studentId}?tab=attendance`}
                    className="text-blue-600 hover:underline text-xs">
                    详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
