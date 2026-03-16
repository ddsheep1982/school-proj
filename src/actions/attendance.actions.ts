"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { AttendanceTimeSchema, type ActionResult } from "@/types/index";
import type { AttendanceRecord } from "@/generated/prisma/client";

export type DailyAttendanceItem = {
  studentId: string;
  studentNo: string;
  name: string;
  className: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  duration: number | null;
};

function parseDateTime(date: string, time: string): Date {
  // date: "YYYY-MM-DD", time: "HH:MM"
  return new Date(`${date}T${time}:00`);
}

export async function recordCheckIn(
  studentId: string,
  date: string,
  time: string
): Promise<ActionResult<AttendanceRecord>> {
  try {
    const user = await requireAuth();
    const parsed = AttendanceTimeSchema.safeParse({ studentId, date, time });
    if (!parsed.success) {
      return { success: false, error: "输入数据无效" };
    }

    const checkInTime = parseDateTime(date, time);
    const dateOnly = new Date(date);

    const existing = await prisma.attendanceRecord.findUnique({
      where: { studentId_date: { studentId, date: dateOnly } },
    });

    let record: AttendanceRecord;
    if (existing) {
      if (existing.checkIn) {
        return { success: false, error: "该学生今日已签到" };
      }
      record = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { checkIn: checkInTime },
      });
    } else {
      record = await prisma.attendanceRecord.create({
        data: {
          studentId,
          date: dateOnly,
          checkIn: checkInTime,
        },
      });
    }

    await writeAuditLog(user.id, "CREATE", "AttendanceRecord", record.id, { after: record });
    return { success: true, data: record };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function recordCheckOut(
  studentId: string,
  date: string,
  time: string
): Promise<ActionResult<AttendanceRecord>> {
  try {
    const user = await requireAuth();
    const parsed = AttendanceTimeSchema.safeParse({ studentId, date, time });
    if (!parsed.success) {
      return { success: false, error: "输入数据无效" };
    }

    const checkOutTime = parseDateTime(date, time);
    const dateOnly = new Date(date);

    const existing = await prisma.attendanceRecord.findUnique({
      where: { studentId_date: { studentId, date: dateOnly } },
    });

    if (!existing || !existing.checkIn) {
      return { success: false, error: "尚未签到，无法签出" };
    }

    if (checkOutTime <= existing.checkIn) {
      return { success: false, error: "签出时间不能早于签到时间" };
    }

    const durationMinutes = Math.round(
      (checkOutTime.getTime() - existing.checkIn.getTime()) / 60000
    );

    const record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: {
        checkOut: checkOutTime,
        duration: durationMinutes,
      },
    });

    await writeAuditLog(user.id, "UPDATE", "AttendanceRecord", record.id, {
      before: existing,
      after: record,
    });
    return { success: true, data: record };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getDailyAttendance(date: string): Promise<DailyAttendanceItem[]> {
  await requireAuth();
  const dateOnly = new Date(date);

  const students = await prisma.student.findMany({
    where: { enrollmentStatus: "ACTIVE" },
    select: {
      id: true,
      studentNo: true,
      name: true,
      class: { select: { name: true } },
      attendanceRecords: {
        where: { date: dateOnly },
        select: { checkIn: true, checkOut: true, duration: true },
        take: 1,
      },
    },
    orderBy: { studentNo: "asc" },
  });

  return students.map((s) => ({
    studentId: s.id,
    studentNo: s.studentNo,
    name: s.name,
    className: s.class?.name ?? null,
    checkIn: s.attendanceRecords[0]?.checkIn ?? null,
    checkOut: s.attendanceRecords[0]?.checkOut ?? null,
    duration: s.attendanceRecords[0]?.duration ?? null,
  }));
}

export async function getAttendanceByStudent(
  studentId: string
): Promise<AttendanceRecord[]> {
  await requireAuth();
  return prisma.attendanceRecord.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
  });
}
