import Link from "next/link";
import { EnrollmentStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import StudentActions from "@/components/students/StudentActions";
import type { StudentListItem } from "@/actions/student.actions";

interface Props {
  students: StudentListItem[];
  total: number;
  page: number;
  pageSize: number;
  searchParams?: Record<string, string | undefined>;
}

export default function StudentTable({ students, total, page, pageSize, searchParams }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (searchParams) {
      for (const [k, v] of Object.entries(searchParams)) {
        if (v && k !== "page") params.set(k, v);
      }
    }
    params.set("page", String(p));
    return `?${params.toString()}`;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">学号</th>
              <th className="px-4 py-3 text-left">姓名</th>
              <th className="px-4 py-3 text-left">联系电话</th>
              <th className="px-4 py-3 text-left">班级</th>
              <th className="px-4 py-3 text-left">招生老师</th>
              <th className="px-4 py-3 text-left">在读状态</th>
              <th className="px-4 py-3 text-left">缴费状态</th>
              <th className="px-4 py-3 text-left">入学日期</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {students.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className={`hover:bg-gray-50 ${s.withdrawalDate ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.studentNo}</td>
                <td className="px-4 py-3 font-medium">
                  {s.name}
                  {s.withdrawalDate && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">已退学</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                <td className="px-4 py-3 text-gray-600">{s.class?.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{s.enrollmentTeacher?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <EnrollmentStatusBadge status={s.enrollmentStatus} />
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={s.paymentStatus} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(s.enrollmentDate).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/students/${s.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      查看
                    </Link>
                    <StudentActions
                      studentId={s.id}
                      hasRecords={s.hasRecords}
                      isWithdrawn={!!s.withdrawalDate}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>共 {total} 条</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                上一页
              </Link>
            )}
            <span className="px-3 py-1">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={pageUrl(page + 1)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                下一页
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
