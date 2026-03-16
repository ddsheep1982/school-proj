import type { PaymentRecordWithUser } from "@/actions/payment.actions";

const paymentTypeLabels: Record<string, string> = {
  CASH: "现金",
  BANK_TRANSFER: "银行转账",
  WECHAT: "微信",
  ALIPAY: "支付宝",
  OTHER: "其他",
};

function toNumber(val: { toString(): string } | number): number {
  return typeof val === "number" ? val : parseFloat(val.toString());
}

export default function PaymentHistory({ records }: { records: PaymentRecordWithUser[] }) {
  let running = 0;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">缴费日期</th>
            <th className="px-4 py-3 text-left">缴费方式</th>
            <th className="px-4 py-3 text-right">金额</th>
            <th className="px-4 py-3 text-right">累计</th>
            <th className="px-4 py-3 text-left">类型</th>
            <th className="px-4 py-3 text-left">备注</th>
            <th className="px-4 py-3 text-left">操作人</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {records.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-gray-400">
                暂无缴费记录
              </td>
            </tr>
          )}
          {records.map((r) => {
            const amt = toNumber(r.amount);
            running += amt;
            return (
              <tr key={r.id} className={r.isAdjustment ? "bg-yellow-50" : ""}>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(r.paymentDate).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3">{paymentTypeLabels[r.paymentType] ?? r.paymentType}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {amt >= 0 ? "+" : ""}¥{amt.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">¥{running.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {r.isAdjustment ? (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                      调整
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                      正常
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.notes ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.createdBy.name}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
