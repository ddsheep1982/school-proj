import Link from "next/link";

interface Props {
  title: string;
  value: number;
  href?: string;
  color?: "blue" | "green" | "yellow" | "red";
}

const colorClasses = {
  blue: "border-l-blue-500 bg-blue-50",
  green: "border-l-green-500 bg-green-50",
  yellow: "border-l-yellow-500 bg-yellow-50",
  red: "border-l-red-500 bg-red-50",
};

export default function MetricCard({ title, value, href, color = "blue" }: Props) {
  const content = (
    <div
      className={`border-l-4 rounded-lg p-4 shadow-sm ${colorClasses[color]} ${href ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
