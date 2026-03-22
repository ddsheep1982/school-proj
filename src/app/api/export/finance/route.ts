import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthlyFinancialBreakdown } from "@/lib/financial.queries";
import { buildFinanceExcel, type PaymentExportRow } from "@/lib/export/excel";
import { buildFinancePdf } from "@/lib/export/pdf";

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

  const year = parseInt(p.get("year") ?? String(new Date().getFullYear()), 10);
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const [entries, paymentRecords] = await Promise.all([
    getMonthlyFinancialBreakdown(year),
    prisma.paymentRecord.findMany({
      where: { paymentDate: { gte: start, lt: end }, isAdjustment: false },
      orderBy: { paymentDate: "asc" },
      select: {
        paymentDate: true,
        amount: true,
        paymentType: true,
        notes: true,
        student: { select: { studentNo: true, name: true } },
      },
    }),
  ]);

  const payments: PaymentExportRow[] = paymentRecords.map((r) => ({
    paymentDate: r.paymentDate,
    studentNo: r.student.studentNo,
    studentName: r.student.name,
    amount: Number(r.amount),
    paymentType: r.paymentType,
    notes: r.notes ?? "",
  }));

  const date = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const buf = await buildFinancePdf(entries, year);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="finance-${year}-${date}.pdf"`,
      },
    });
  }

  const buf = await buildFinanceExcel(entries, payments, year);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="finance-${year}-${date}.xlsx"`,
    },
  });
}
