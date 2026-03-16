"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { generateStudentNo } from "@/lib/student-no";
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  StudentFiltersSchema,
  type ActionResult,
  type CreateStudentInput,
  type UpdateStudentInput,
  type StudentFilters,
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
  class: { id: string; name: string } | null;
  enrollmentTeacher: { id: string; name: string } | null;
};

export type StudentDetail = Student & {
  class: { id: string; name: string } | null;
  enrollmentTeacher: { id: string; name: string } | null;
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
  rawFilters: Partial<StudentFilters>
): Promise<{ students: StudentListItem[]; total: number }> {
  await requireAuth();
  const filters = StudentFiltersSchema.parse(rawFilters);

  const where = {
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
        class: { select: { id: true, name: true } },
        enrollmentTeacher: { select: { id: true, name: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total };
}

export async function getStudentById(id: string): Promise<StudentDetail | null> {
  await requireAuth();
  return prisma.student.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true } },
      enrollmentTeacher: { select: { id: true, name: true } },
      recruitmentTeacher: { select: { id: true, name: true } },
      recruitmentAgent: { select: { id: true, name: true, agencyName: true } },
    },
  });
}
