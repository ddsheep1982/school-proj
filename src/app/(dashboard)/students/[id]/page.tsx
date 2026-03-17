import { notFound } from "next/navigation";
import Link from "next/link";
import { getStudentById } from "@/actions/student.actions";
import { getPaymentsByStudent } from "@/actions/payment.actions";
import { getAttendanceByStudent } from "@/actions/attendance.actions";
import { getStudentInvoices, getStudentOutstandingBalance } from "@/actions/invoice.actions";
import { getRecruitmentCostsByStudent } from "@/actions/recruitment-cost.actions";
import { getRefundsByStudent } from "@/actions/refund.actions";
import { getTeachers } from "@/actions/teacher.actions";
import { getAgents } from "@/actions/agent.actions";
import { EnrollmentStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import PaymentForm from "@/components/payments/PaymentForm";
import PaymentHistory from "@/components/payments/PaymentHistory";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import StudentInvoiceList from "@/components/fees/StudentInvoiceList";
import StudentFinancialTab from "@/components/finance/StudentFinancialTab";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function StudentDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab = "info" } = await searchParams;

  const student = await getStudentById(id);
  if (!student) notFound();

  const [payments, attendance, invoices, outstandingBalance, recruitmentCosts, refundRecords, teachers, agents] =
    await Promise.all([
      tab === "payments" || tab === "finance" ? getPaymentsByStudent(id) : Promise.resolve([]),
      tab === "attendance" ? getAttendanceByStudent(id) : Promise.resolve([]),
      tab === "invoices" ? getStudentInvoices(id) : Promise.resolve([]),
      tab === "invoices" ? getStudentOutstandingBalance(id) : Promise.resolve(0),
      tab === "finance" ? getRecruitmentCostsByStudent(id) : Promise.resolve([]),
      tab === "finance" ? getRefundsByStudent(id) : Promise.resolve([]),
      tab === "finance" ? getTeachers() : Promise.resolve([]),
      tab === "finance" ? getAgents() : Promise.resolve([]),
    ]);

  const tabs = [
    { key: "info", label: "基本信息" },
    { key: "payments", label: "缴费记录" },
    { key: "attendance", label: "考勤记录" },
    { key: "invoices", label: "费用发票" },
    { key: "finance", label: "费用" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/students" className="text-gray-400 hover:text-gray-600">
            ← 学生列表
          </Link>
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <span className="text-gray-400 font-mono text-sm">{student.studentNo}</span>
          <EnrollmentStatusBadge status={student.enrollmentStatus} />
          <PaymentStatusBadge status={student.paymentStatus} />
        </div>
        <Link
          href={`/students/${id}/edit`}
          className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
        >
          编辑
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/students/${id}?tab=${t.key}`}
              className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Info tab */}
      {tab === "info" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-xs text-gray-500">学号</dt>
              <dd className="font-mono font-medium">{student.studentNo}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">姓名</dt>
              <dd className="font-medium">{student.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">联系电话</dt>
              <dd>{student.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">家长联系电话</dt>
              <dd>{student.guardianPhone}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">入学日期</dt>
              <dd>{new Date(student.enrollmentDate).toLocaleDateString("zh-CN")}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">班级</dt>
              <dd>
                {student.class ? (
                  <Link
                    href={`/classes/${student.classId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {student.class.name}
                  </Link>
                ) : (
                  "未分班"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">招生老师</dt>
              <dd>
                {student.enrollmentTeacher ? (
                  <Link
                    href={`/teachers/${student.enrollmentTeacherId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {student.enrollmentTeacher.name}
                  </Link>
                ) : (
                  "未指定"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">接待老师</dt>
              <dd>{student.receptionTeacher?.name ?? "无"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">招生渠道</dt>
              <dd>
                {student.recruitmentChannelType === "TEACHER" && student.recruitmentTeacher
                  ? `招生老师 · ${student.recruitmentTeacher.name}`
                  : student.recruitmentChannelType === "AGENT" && student.recruitmentAgent
                  ? `外部代理 · ${student.recruitmentAgent.name}${student.recruitmentAgent.agencyName ? ` (${student.recruitmentAgent.agencyName})` : ""}`
                  : "未指定"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Payments tab */}
      {tab === "payments" && (
        <div className="space-y-4">
          <PaymentForm studentId={id} />
          <PaymentHistory records={payments} />
        </div>
      )}

      {/* Invoices tab */}
      {tab === "invoices" && (
        <StudentInvoiceList invoices={invoices} outstandingBalance={outstandingBalance} />
      )}

      {/* Finance tab */}
      {tab === "finance" && (
        <StudentFinancialTab
          studentId={id}
          payments={payments}
          recruitmentCosts={recruitmentCosts}
          refundRecords={refundRecords}
          teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
          agents={agents.map((a) => ({ id: a.id, name: a.name, agencyName: a.agencyName ?? null }))}
          withdrawalDate={student.withdrawalDate}
          withdrawalReason={student.withdrawalReason}
        />
      )}

      {/* Attendance tab */}
      {tab === "attendance" && (
        <div className="space-y-4">
          <AttendanceForm studentId={id} />
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">日期</th>
                  <th className="px-4 py-3 text-left">签到时间</th>
                  <th className="px-4 py-3 text-left">签出时间</th>
                  <th className="px-4 py-3 text-left">在校时长</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      暂无考勤记录
                    </td>
                  </tr>
                )}
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      {new Date(a.date).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      {a.checkIn
                        ? new Date(a.checkIn).toLocaleTimeString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {a.checkOut
                        ? new Date(a.checkOut).toLocaleTimeString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {a.duration != null
                        ? `${Math.floor(a.duration / 60)}h ${a.duration % 60}m`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
