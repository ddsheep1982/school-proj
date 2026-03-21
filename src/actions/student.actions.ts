"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { generateStudentNo } from "@/lib/student-no";
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  StudentFiltersSchema,
  WithdrawStudentSchema,
  type ActionResult,
  type CreateStudentInput,
  type UpdateStudentInput,
  type StudentFilters,
  type WithdrawStudentInput,
} from "@/types/index";
import type { Student } from "@/generated/prisma/client";

export type StudentListItem = {
  id: string;
  studentNo: string;
  name: string;
  phone: string;
  enrollmentStatus: string;
  paymentStatus: string;
  enrollmentDate: Date;
  withdrawalDate: Date | null;
  class: { id: string; name: string } | null;
  enrollmentTeacher: { id: string; name: string } | null;
  hasRecords: boolean;
};

export type StudentDetail = Student & {
  class: { id: string; name: string } | null;
  enrollmentTeacher: { id: string; name: string } | null;
  receptionTeacher: { id: string; name: string } | null;
  recruitmentTeacher: { id: string; name: string } | null;
  recruitmentAgent: { id: string; name: string; agencyName: string | null } | null;
};

export async function createStudent(
  input: CreateStudentInput
): Promise<ActionResult<Student>> {
  try {
    const user = await requireAuth();
    const parsed = CreateStudentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const studentNo = await generateStudentNo();
    const data = parsed.data;

    const student = await prisma.student.create({
      data: {
        studentNo,
        name: data.name,
        phone: data.phone,
        guardianPhone: data.guardianPhone,
        enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : new Date(),
        classId: data.classId ?? null,
        enrollmentTeacherId: data.enrollmentTeacherId ?? null,
        receptionTeacherId: data.receptionTeacherId ?? null,
        recruitmentChannelType: data.recruitmentChannelType ?? null,
        recruitmentTeacherId:
          data.recruitmentChannelType === "TEACHER" ? (data.recruitmentTeacherId ?? null) : null,
        recruitmentAgentId:
          data.recruitmentChannelType === "AGENT" ? (data.recruitmentAgentId ?? null) : null,
      },
    });

    await writeAuditLog(user.id, "CREATE", "Student", student.id, {
      after: student,
    });

    return { success: true, data: student };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateStudent(
  id: string,
  input: UpdateStudentInput
): Promise<ActionResult<Student>> {
  try {
    const user = await requireAuth();
    const parsed = UpdateStudentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const before = await prisma.student.findUnique({ where: { id } });
    if (!before) return { success: false, error: "学生不存在" };

    const data = parsed.data;

    if (data.enrollmentStatus === "WITHDRAWN") {
      return { success: false, error: "退学操作必须通过退学流程进行，不能直接修改在读状态" };
    }

    // If channel type changes, clear the other channel's id
    const channelType = data.recruitmentChannelType;
    const recruitmentTeacherId =
      channelType === "TEACHER" ? (data.recruitmentTeacherId ?? null) :
      channelType === null ? null :
      undefined;
    const recruitmentAgentId =
      channelType === "AGENT" ? (data.recruitmentAgentId ?? null) :
      channelType === null ? null :
      undefined;

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.guardianPhone !== undefined && { guardianPhone: data.guardianPhone }),
        ...(data.enrollmentDate !== undefined && { enrollmentDate: new Date(data.enrollmentDate) }),
        ...(data.enrollmentStatus !== undefined && { enrollmentStatus: data.enrollmentStatus }),
        ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
        ...("classId" in data && { classId: data.classId ?? null }),
        ...("enrollmentTeacherId" in data && { enrollmentTeacherId: data.enrollmentTeacherId ?? null }),
        ...("receptionTeacherId" in data && { receptionTeacherId: data.receptionTeacherId ?? null }),
        ...(channelType !== undefined && { recruitmentChannelType: channelType }),
        ...(recruitmentTeacherId !== undefined && { recruitmentTeacherId }),
        ...(recruitmentAgentId !== undefined && { recruitmentAgentId }),
      },
    });

    await writeAuditLog(user.id, "UPDATE", "Student", id, {
      before,
      after: student,
    });

    return { success: true, data: student };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getStudents(
  rawFilters: Partial<StudentFilters> & { includeWithdrawn?: boolean }
): Promise<{ students: StudentListItem[]; total: number }> {
  await requireAuth();
  const filters = StudentFiltersSchema.parse(rawFilters);
  const includeWithdrawn = rawFilters.includeWithdrawn === true;

  const where = {
    // Default: exclude withdrawn students unless explicitly requested or filtered by status
    ...(!filters.enrollmentStatus && !includeWithdrawn && {
      withdrawalDate: null,
    }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" as const } },
        { studentNo: { contains: filters.search, mode: "insensitive" as const } },
        { phone: { contains: filters.search } },
      ],
    }),
    ...(filters.classId && { classId: filters.classId }),
    ...(filters.enrollmentTeacherId && { enrollmentTeacherId: filters.enrollmentTeacherId }),
    ...(filters.recruitmentAgentId && { recruitmentAgentId: filters.recruitmentAgentId }),
    ...(filters.recruitmentChannelType && {
      recruitmentChannelType: filters.recruitmentChannelType,
    }),
    ...(filters.enrollmentStatus && { enrollmentStatus: filters.enrollmentStatus }),
    ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        studentNo: true,
        name: true,
        phone: true,
        enrollmentStatus: true,
        paymentStatus: true,
        enrollmentDate: true,
        withdrawalDate: true,
        class: { select: { id: true, name: true } },
        enrollmentTeacher: { select: { id: true, name: true } },
        _count: { select: { paymentRecords: true, recruitmentCosts: true, refundRecords: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    students: students.map((s) => {
      const { _count, ...rest } = s;
      return {
        ...rest,
        hasRecords: _count.paymentRecords > 0 || _count.recruitmentCosts > 0 || _count.refundRecords > 0,
      };
    }),
    total,
  };
}

export async function getStudentById(id: string): Promise<StudentDetail | null> {
  await requireAuth();
  return prisma.student.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true } },
      enrollmentTeacher: { select: { id: true, name: true } },
      receptionTeacher: { select: { id: true, name: true } },
      recruitmentTeacher: { select: { id: true, name: true } },
      recruitmentAgent: { select: { id: true, name: true, agencyName: true } },
    },
  });
}

export async function withdrawStudent(
  id: string,
  input: WithdrawStudentInput
): Promise<ActionResult<Student>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = WithdrawStudentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "输入数据无效", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }

    const before = await prisma.student.findUnique({ where: { id } });
    if (!before) return { success: false, error: "学生不存在" };
    if (before.withdrawalDate) return { success: false, error: "该学生已退学" };

    const { refundAmount, refundDate, refundReason, refundInvoiceId } = parsed.data;

    if (refundInvoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: refundInvoiceId } });
      if (!invoice || invoice.studentId !== id) {
        return { success: false, error: "发票不属于该学生" };
      }
    }

    if (refundAmount !== undefined) {
      const [paymentAgg, refundAgg] = await Promise.all([
        prisma.paymentRecord.aggregate({
          _sum: { amount: true },
          where: { studentId: id, isAdjustment: false },
        }),
        prisma.refundRecord.aggregate({
          _sum: { amount: true },
          where: { studentId: id },
        }),
      ]);
      const totalPaid = Number(paymentAgg._sum.amount ?? 0);
      const totalRefunded = Number(refundAgg._sum.amount ?? 0);
      if (refundAmount + totalRefunded > totalPaid) {
        const available = (totalPaid - totalRefunded).toFixed(2);
        return { success: false, error: `退款金额超出已缴费用，可退金额：¥${available}` };
      }
    }

    const student = await prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id },
        data: {
          withdrawalDate: new Date(parsed.data.withdrawalDate),
          withdrawalReason: parsed.data.withdrawalReason,
          enrollmentStatus: "WITHDRAWN",
        },
      });

      if (refundAmount !== undefined) {
        await tx.refundRecord.create({
          data: {
            studentId: id,
            amount: refundAmount,
            refundDate: new Date(refundDate!),
            reason: refundReason!,
            invoiceId: refundInvoiceId ?? null,
            createdById: user.id,
          },
        });
      }

      return updated;
    });

    await writeAuditLog(user.id, "UPDATE", "Student", id, { before, after: student });
    return { success: true, data: student };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function deleteStudent(id: string): Promise<ActionResult<void>> {
  try {
    const user = await requireRole("ADMIN");
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            paymentRecords: true,
            invoices: true,
            attendanceRecords: true,
            recruitmentCosts: true,
            refundRecords: true,
          },
        },
      },
    });
    if (!student) return { success: false, error: "学生不存在" };

    const counts = student._count;
    const hasRecords = counts.paymentRecords > 0 || counts.invoices > 0 ||
      counts.attendanceRecords > 0 || counts.recruitmentCosts > 0 || counts.refundRecords > 0;

    if (hasRecords) {
      return { success: false, error: "该学生存在关联记录，无法删除。如需退学请使用退学功能。" };
    }

    await prisma.student.delete({ where: { id } });
    await writeAuditLog(user.id, "DELETE", "Student", id, { before: student });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
