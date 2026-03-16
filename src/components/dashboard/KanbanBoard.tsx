import Link from "next/link";
import type { KanbanData, KanbanCard } from "@/types/index";
import { PaymentStatusBadge } from "@/components/shared/StatusBadge";

const columns = [
  { key: "ACTIVE" as const, label: "在读", color: "bg-green-50 border-green-200" },
  { key: "WITHDRAWN" as const, label: "退学", color: "bg-red-50 border-red-200" },
  { key: "GRADUATED" as const, label: "毕业", color: "bg-blue-50 border-blue-200" },
];

function KanbanCard({ card }: { card: KanbanCard }) {
  return (
    <Link
      href={`/students/${card.id}`}
      className="block bg-white rounded-md shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">{card.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{card.studentNo}</p>
        </div>
        <PaymentStatusBadge status={card.paymentStatus} />
      </div>
      {(card.className || card.enrollmentTeacherName) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.className && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {card.className}
            </span>
          )}
          {card.enrollmentTeacherName && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {card.enrollmentTeacherName}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export default function KanbanBoard({ data, filterQuery = "" }: { data: KanbanData; filterQuery?: string }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map((col) => {
        const cards = data[col.key];
        const href = `/students?enrollmentStatus=${col.key}${filterQuery ? `&${filterQuery}` : ""}`;

        return (
          <div key={col.key} className={`border rounded-lg p-3 ${col.color}`}>
            <Link
              href={href}
              className="flex items-center justify-between mb-3 hover:opacity-80"
            >
              <h3 className="font-semibold text-sm">{col.label}</h3>
              <span className="text-sm font-bold">{cards.length}</span>
            </Link>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {cards.map((card) => (
                <KanbanCard key={card.id} card={card} />
              ))}
              {cards.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">暂无数据</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
