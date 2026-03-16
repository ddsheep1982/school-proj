type BadgeVariant = "green" | "yellow" | "red" | "blue" | "gray";

const variantClasses: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-800",
};

const enrollmentStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "在读", variant: "green" },
  WITHDRAWN: { label: "退学", variant: "red" },
  GRADUATED: { label: "毕业", variant: "blue" },
};

const paymentStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  PAID: { label: "已缴费", variant: "green" },
  PARTIAL: { label: "部分缴费", variant: "yellow" },
  OVERDUE: { label: "欠费", variant: "red" },
};

export function EnrollmentStatusBadge({ status }: { status: string }) {
  const config = enrollmentStatusMap[status] ?? { label: status, variant: "gray" as BadgeVariant };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[config.variant]}`}>
      {config.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const config = paymentStatusMap[status] ?? { label: status, variant: "gray" as BadgeVariant };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[config.variant]}`}>
      {config.label}
    </span>
  );
}
