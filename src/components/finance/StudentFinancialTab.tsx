import type { PaymentRecordWithUser } from "@/actions/payment.actions";
import type { RecruitmentCostWithRecipient } from "@/actions/recruitment-cost.actions";
import RecruitmentCostList from "./RecruitmentCostList";
import RecruitmentCostForm from "./RecruitmentCostForm";

interface Teacher { id: string; name: string }
interface Agent { id: string; name: string; agencyName: string | null }

interface Props {
  studentId: string;
  payments: PaymentRecordWithUser[];
  recruitmentCosts: RecruitmentCostWithRecipient[];
  teachers: Teacher[];
  agents: Agent[];
}

function fmt(n: number) {
  return "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
}

export default function StudentFinancialTab({
  studentId,
  payments,
  recruitmentCosts,
  teachers,
  agents,
}: Props) {
  const totalTuition = payments
    .filter((p) => !p.isAdjustment)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCosts = recruitmentCosts.reduce((sum, c) => sum + Number(c.amount), 0);
  const netContribution = totalTuition - totalCosts;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">学费已缴</p>
          <p className="text-xl font-bold text-green-600">{fmt(totalTuition)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">招生费用</p>
          <p className="text-xl font-bold text-red-500">{fmt(totalCosts)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">净贡献</p>
          <p className={`text-xl font-bold ${netContribution >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {fmt(netContribution)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tuition payments */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold">学费缴纳记录</h3>
          </div>
          {payments.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center">暂无缴费记录</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">日期</th>
                  <th className="px-3 py-2 text-left">方式</th>
                  <th className="px-3 py-2 text-right">金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{new Date(p.paymentDate).toLocaleDateString("zh-CN")}</td>
                    <td className="px-3 py-2 text-gray-600">{p.paymentType}</td>
                    <td className={`px-3 py-2 text-right font-mono ${p.isAdjustment ? "text-gray-400 text-xs" : "text-green-700"}`}>
                      {p.isAdjustment && <span className="mr-1 text-xs">[调整]</span>}
                      {fmt(Number(p.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recruitment costs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold">招生费用记录</h3>
          </div>
          <div className="p-4 border-b border-gray-100">
            <RecruitmentCostForm studentId={studentId} teachers={teachers} agents={agents} />
          </div>
          <div className="overflow-x-auto">
            <RecruitmentCostList costs={recruitmentCosts} />
          </div>
        </div>
      </div>
    </div>
  );
}
