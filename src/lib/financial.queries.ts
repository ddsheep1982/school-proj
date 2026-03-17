import { prisma } from "@/lib/prisma";
import type {
  FinancialSummary,
  FinancialSummaryFilters,
  MonthlyFinancialEntry,
  StudentFinancialSummary,
} from "@/types/index";

function toNumber(val: { toNumber(): number } | number | string): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  return val.toNumber();
}

export async function getFinancialSummary(
  filters: FinancialSummaryFilters = {}
): Promise<FinancialSummary> {
  const { startDate, endDate, classId } = filters;

  const dateRange = startDate || endDate
    ? {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      }
    : undefined;

  const studentIdFilter = classId
    ? {
        in: (
          await prisma.student.findMany({
            where: { classId },
            select: { id: true },
          })
        ).map((s) => s.id),
      }
    : undefined;

  const [incomeAgg, costAgg] = await Promise.all([
    prisma.paymentRecord.aggregate({
      _sum: { amount: true },
      where: {
        ...(dateRange ? { paymentDate: dateRange } : {}),
        ...(studentIdFilter ? { studentId: studentIdFilter } : {}),
        isAdjustment: false,
      },
    }),
    prisma.recruitmentCost.aggregate({
      _sum: { amount: true },
      where: {
        ...(dateRange ? { paymentDate: dateRange } : {}),
        ...(studentIdFilter ? { studentId: studentIdFilter } : {}),
      },
    }),
  ]);

  const totalIncome = toNumber(incomeAgg._sum.amount ?? 0);
  const totalCosts = toNumber(costAgg._sum.amount ?? 0);
  return { totalIncome, totalCosts, netIncome: totalIncome - totalCosts };
}

export async function getMonthlyFinancialBreakdown(year: number): Promise<MonthlyFinancialEntry[]> {
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const [payments, costs] = await Promise.all([
    prisma.paymentRecord.findMany({
      where: { paymentDate: { gte: start, lt: end }, isAdjustment: false },
      select: { paymentDate: true, amount: true },
    }),
    prisma.recruitmentCost.findMany({
      where: { paymentDate: { gte: start, lt: end } },
      select: { paymentDate: true, amount: true },
    }),
  ]);

  const MONTH_LABELS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const entries: MonthlyFinancialEntry[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: MONTH_LABELS[i],
    tuitionIncome: 0,
    recruitmentCost: 0,
    netIncome: 0,
  }));

  for (const p of payments) {
    const m = new Date(p.paymentDate).getUTCMonth();
    entries[m].tuitionIncome += toNumber(p.amount);
  }
  for (const c of costs) {
    const m = new Date(c.paymentDate).getUTCMonth();
    entries[m].recruitmentCost += toNumber(c.amount);
  }
  for (const e of entries) {
    e.netIncome = e.tuitionIncome - e.recruitmentCost;
  }

  return entries;
}

export async function getStudentFinancialSummaries(
  filters: Pick<FinancialSummaryFilters, "classId"> = {}
): Promise<StudentFinancialSummary[]> {
  const students = await prisma.student.findMany({
    where: filters.classId ? { classId: filters.classId } : undefined,
    select: {
      id: true,
      studentNo: true,
      name: true,
      paymentRecords: {
        where: { isAdjustment: false },
        select: { amount: true },
      },
      recruitmentCosts: {
        select: { amount: true },
      },
      refundRecords: {
        select: { amount: true },
      },
    },
  });

  const summaries: StudentFinancialSummary[] = students.map((s) => {
    const totalTuition = s.paymentRecords.reduce((sum, p) => sum + toNumber(p.amount), 0);
    const totalRecruitmentCost = s.recruitmentCosts.reduce((sum, c) => sum + toNumber(c.amount), 0);
    const totalRefunded = s.refundRecords.reduce((sum, r) => sum + toNumber(r.amount), 0);
    return {
      studentId: s.id,
      studentNo: s.studentNo,
      name: s.name,
      totalTuition,
      totalRecruitmentCost,
      totalRefunded,
      netContribution: totalTuition - totalRecruitmentCost - totalRefunded,
    };
  });

  return summaries.sort((a, b) => b.netContribution - a.netContribution);
}
