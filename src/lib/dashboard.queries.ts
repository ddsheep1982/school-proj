import { prisma } from "@/lib/prisma";
import type {
  DashboardFilters,
  DashboardMetrics,
  KanbanData,
  KanbanCard,
  EnrollmentStatus,
  PaymentStatus,
} from "@/types/index";

function buildStudentWhere(filters: DashboardFilters) {
  return {
    ...(filters.classId && { classId: filters.classId }),
    ...(filters.enrollmentTeacherId && { enrollmentTeacherId: filters.enrollmentTeacherId }),
    ...(filters.recruitmentChannelType && {
      recruitmentChannelType: filters.recruitmentChannelType,
    }),
    ...(filters.recruitmentAgentId && { recruitmentAgentId: filters.recruitmentAgentId }),
  };
}

export async function getDashboardMetrics(
  filters: DashboardFilters = {}
): Promise<DashboardMetrics> {
  const where = buildStudentWhere(filters);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalActive, byEnrollmentStatus, byPaymentStatus, todayAttendance] =
    await Promise.all([
      prisma.student.count({ where: { ...where, enrollmentStatus: "ACTIVE" } }),

      prisma.student.groupBy({
        by: ["enrollmentStatus"],
        _count: { _all: true },
        where,
      }),

      prisma.student.groupBy({
        by: ["paymentStatus"],
        _count: { _all: true },
        where,
      }),

      prisma.attendanceRecord.count({
        where: {
          date: today,
          checkIn: { not: null },
          student: where,
        },
      }),
    ]);

  return {
    totalActive,
    byEnrollmentStatus: byEnrollmentStatus.map((r) => ({
      status: r.enrollmentStatus as EnrollmentStatus,
      count: r._count._all,
    })),
    byPaymentStatus: byPaymentStatus.map((r) => ({
      status: r.paymentStatus as PaymentStatus,
      count: r._count._all,
    })),
    todayAttendanceCount: todayAttendance,
  };
}

export async function getKanbanData(filters: DashboardFilters = {}): Promise<KanbanData> {
  const where = buildStudentWhere(filters);

  const students = await prisma.student.findMany({
    where,
    select: {
      id: true,
      studentNo: true,
      name: true,
      phone: true,
      enrollmentStatus: true,
      paymentStatus: true,
      class: { select: { name: true } },
      enrollmentTeacher: { select: { name: true } },
    },
    orderBy: { studentNo: "asc" },
  });

  const result: KanbanData = {
    ACTIVE: [],
    WITHDRAWN: [],
    GRADUATED: [],
  };

  for (const s of students) {
    const card: KanbanCard = {
      id: s.id,
      studentNo: s.studentNo,
      name: s.name,
      phone: s.phone,
      paymentStatus: s.paymentStatus as PaymentStatus,
      className: s.class?.name,
      enrollmentTeacherName: s.enrollmentTeacher?.name,
    };
    result[s.enrollmentStatus as keyof KanbanData].push(card);
  }

  return result;
}
