import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStudentExcel, type StudentExportRow } from "@/lib/export/excel";
import { buildStudentPdf } from "@/lib/export/pdf";
import type { EnrollmentStatus, PaymentStatus, RecruitmentChannelType } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const p = req.nextUrl.searchParams;
  const format = p.get("format") ?? "xlsx";
  if (format !== "xlsx" && format !== "pdf") {
    return Response.json({ error: "Invalid format. Use xlsx or pdf." }, { status: 400 });
  }

  const search = p.get("search") ?? undefined;
  const classId = p.get("classId") ?? undefined;
  const enrollmentStatus = (p.get("enrollmentStatus") ?? undefined) as EnrollmentStatus | undefined;
  const paymentStatus = (p.get("paymentStatus") ?? undefined) as PaymentStatus | undefined;
  const enrollmentTeacherId = p.get("enrollmentTeacherId") ?? undefined;
  const recruitmentChannelType = (p.get("recruitmentChannelType") ?? undefined) as RecruitmentChannelType | undefined;
  const recruitmentAgentId = p.get("recruitmentAgentId") ?? undefined;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { studentNo: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
      ],
    }),
    ...(classId && { classId }),
    ...(enrollmentTeacherId && { enrollmentTeacherId }),
    ...(recruitmentAgentId && { recruitmentAgentId }),
    ...(recruitmentChannelType && { recruitmentChannelType }),
    ...(enrollmentStatus && { enrollmentStatus }),
    ...(paymentStatus && { paymentStatus }),
  };

  const students = await prisma.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { class: { select: { name: true } } },
  });

  const rows: StudentExportRow[] = students.map((s) => ({
    studentNo: s.studentNo,
    name: s.name,
    phone: s.phone,
    guardianPhone: s.guardianPhone,
    className: s.class?.name ?? "",
    enrollmentStatus: s.enrollmentStatus,
    paymentStatus: s.paymentStatus,
    enrollmentDate: s.enrollmentDate,
  }));

  const date = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const buf = await buildStudentPdf(rows);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="students-${date}.pdf"`,
      },
    });
  }

  const buf = await buildStudentExcel(rows);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="students-${date}.xlsx"`,
    },
  });
}
