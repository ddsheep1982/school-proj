import {
  getFinancialSummary,
  getMonthlyFinancialBreakdown,
  getStudentFinancialSummaries,
} from "@/lib/financial.queries";
import { getClasses } from "@/actions/class.actions";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

const currentYear = new Date().getFullYear();

export default async function FinancePage({ searchParams }: Props) {
  const sp = await searchParams;
  const year = sp.year ? parseInt(sp.year) : currentYear;
  const classId = sp.classId || undefined;
  const startDate = sp.startDate ? new Date(sp.startDate).toISOString() : undefined;
  const endDate = sp.endDate ? new Date(sp.endDate + "T23:59:59.000Z").toISOString() : undefined;

  const [summary, monthly, studentSummaries, classes] = await Promise.all([
    getFinancialSummary({ startDate, endDate, classId }),
    getMonthlyFinancialBreakdown(year),
    getStudentFinancialSummaries({ classId }),
    getClasses(),
  ]);

  function fmt(n: number) {
    return "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">财务概览</h1>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">开始日期</label>
          <input
            name="startDate"
            type="date"
            defaultValue={sp.startDate}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">结束日期</label>
          <input
            name="endDate"
            type="date"
            defaultValue={sp.endDate}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">班级</label>
          <select
            name="classId"
            defaultValue={classId ?? ""}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部班级</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">月度年份</label>
          <input
            name="year"
            type="number"
            defaultValue={year}
            className="border border-gray-300 rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
          筛选
        </button>
      </form>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">学费收入</p>
          <p className="text-2xl font-bold text-green-600">{fmt(summary.totalIncome)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">招生费用支出</p>
          <p className="text-2xl font-bold text-red-500">{fmt(summary.totalCosts)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">净收入</p>
          <p className={`text-2xl font-bold ${summary.netIncome >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {fmt(summary.netIncome)}
          </p>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{year} 年月度收支</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">月份</th>
              <th className="px-4 py-3 text-right">学费收入</th>
              <th className="px-4 py-3 text-right">招生费用</th>
              <th className="px-4 py-3 text-right">净收入</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monthly.map((m) => (
              <tr key={m.month} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{m.label}</td>
                <td className="px-4 py-2 text-right text-green-700 font-mono">
                  {m.tuitionIncome > 0 ? fmt(m.tuitionIncome) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-2 text-right text-red-500 font-mono">
                  {m.recruitmentCost > 0 ? fmt(m.recruitmentCost) : <span className="text-gray-300">—</span>}
                </td>
                <td className={`px-4 py-2 text-right font-mono font-medium ${m.netIncome >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {m.tuitionIncome > 0 || m.recruitmentCost > 0 ? fmt(m.netIncome) : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-student summary */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">学生财务明细</h2>
        </div>
        {studentSummaries.length === 0 ? (
          <p className="p-6 text-center text-gray-400 text-sm">暂无数据</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">学号</th>
                <th className="px-4 py-3 text-left">姓名</th>
                <th className="px-4 py-3 text-right">学费已缴</th>
                <th className="px-4 py-3 text-right">招生费用</th>
                <th className="px-4 py-3 text-right">净贡献</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {studentSummaries.map((s) => (
                <tr key={s.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{s.studentNo}</td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2 text-right text-green-700 font-mono">{fmt(s.totalTuition)}</td>
                  <td className="px-4 py-2 text-right text-red-500 font-mono">{fmt(s.totalRecruitmentCost)}</td>
                  <td className={`px-4 py-2 text-right font-mono font-medium ${s.netContribution >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {fmt(s.netContribution)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
