import { getDashboardMetrics, getKanbanData } from "@/lib/dashboard.queries";
import MetricCard from "@/components/dashboard/MetricCard";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import type { DashboardFilters } from "@/types/index";

interface Props {
  searchParams: Promise<{
    classId?: string;
    enrollmentTeacherId?: string;
    recruitmentChannelType?: string;
    recruitmentAgentId?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const sp = await searchParams;

  const filters: DashboardFilters = {
    classId: sp.classId,
    enrollmentTeacherId: sp.enrollmentTeacherId,
    recruitmentChannelType: sp.recruitmentChannelType as DashboardFilters["recruitmentChannelType"],
    recruitmentAgentId: sp.recruitmentAgentId,
  };

  const [metrics, kanban] = await Promise.all([
    getDashboardMetrics(filters),
    getKanbanData(filters),
  ]);

  const enrollmentMap = Object.fromEntries(
    metrics.byEnrollmentStatus.map((e) => [e.status, e.count])
  );
  const paymentMap = Object.fromEntries(
    metrics.byPaymentStatus.map((p) => [p.status, p.count])
  );

  const filterQuery = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][]
  ).toString();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="在读学生"
          value={metrics.totalActive}
          href="/students?enrollmentStatus=ACTIVE"
          color="blue"
        />
        <MetricCard
          title="今日到校"
          value={metrics.todayAttendanceCount}
          href="/attendance"
          color="green"
        />
        <MetricCard
          title="欠费学生"
          value={paymentMap["OVERDUE"] ?? 0}
          href="/students?paymentStatus=OVERDUE"
          color="red"
        />
        <MetricCard
          title="部分缴费"
          value={paymentMap["PARTIAL"] ?? 0}
          href="/students?paymentStatus=PARTIAL"
          color="yellow"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="在读"
          value={enrollmentMap["ACTIVE"] ?? 0}
          href="/students?enrollmentStatus=ACTIVE"
          color="green"
        />
        <MetricCard
          title="退学"
          value={enrollmentMap["WITHDRAWN"] ?? 0}
          href="/students?enrollmentStatus=WITHDRAWN"
          color="red"
        />
        <MetricCard
          title="毕业"
          value={enrollmentMap["GRADUATED"] ?? 0}
          href="/students?enrollmentStatus=GRADUATED"
          color="blue"
        />
      </div>

      {/* Kanban */}
      <div>
        <h2 className="text-lg font-semibold mb-3">学生看板</h2>
        <KanbanBoard data={kanban} filterQuery={filterQuery} />
      </div>
    </div>
  );
}
