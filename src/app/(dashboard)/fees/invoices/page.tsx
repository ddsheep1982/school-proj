import { listInvoices } from "@/actions/invoice.actions";
import InvoiceTable from "@/components/fees/InvoiceTable";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "OUTSTANDING", label: "未付" },
  { value: "PARTIAL", label: "部分付款" },
  { value: "PAID", label: "已付清" },
  { value: "WAIVED", label: "已豁免" },
];

export default async function InvoicesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = sp.page ? parseInt(sp.page) : 1;
  const status = sp.status as "OUTSTANDING" | "PARTIAL" | "PAID" | "WAIVED" | undefined;
  const academicYear = sp.academicYear;

  const { invoices, total } = await listInvoices({ status, academicYear, page, pageSize: 20 });
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">发票管理</h1>
        <span className="text-sm text-gray-500">共 {total} 条</span>
      </div>

      <form method="GET" className="flex flex-wrap gap-3 bg-white p-4 rounded-lg border border-gray-200">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          name="academicYear"
          defaultValue={academicYear}
          placeholder="筛选学年..."
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm rounded"
        >
          筛选
        </button>
      </form>

      <InvoiceTable invoices={invoices} />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}${status ? `&status=${status}` : ""}${academicYear ? `&academicYear=${academicYear}` : ""}`}
              className={`px-3 py-1 text-sm rounded border ${
                p === page
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
