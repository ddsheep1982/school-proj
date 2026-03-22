import PDFDocument from "pdfkit";
import path from "path";
import type { MonthlyFinancialEntry } from "@/types/index";
import type { StudentExportRow, PaymentExportRow } from "./excel";

const FONT_PATH = path.join(process.cwd(), "public", "fonts", "NotoSansSC-Regular.otf");

const STATUS_MAP: Record<string, string> = {
  ACTIVE: "在读",
  WITHDRAWN: "已退学",
  GRADUATED: "已毕业",
  PAID: "已缴费",
  PARTIAL: "部分缴费",
  OVERDUE: "欠费",
};

function bufferFromDoc(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  startX: number,
  startY: number,
  rowHeight = 20
) {
  let y = startY;

  // Header row
  doc.font(FONT_PATH).fontSize(9).fillColor("#444");
  let x = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.rect(x, y, colWidths[i], rowHeight).stroke();
    doc.text(headers[i], x + 3, y + 5, { width: colWidths[i] - 6, ellipsis: true });
    x += colWidths[i];
  }
  y += rowHeight;

  // Data rows
  doc.font(FONT_PATH).fontSize(8).fillColor("#000");
  for (const row of rows) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 40;
    }
    x = startX;
    for (let i = 0; i < row.length; i++) {
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.text(row[i] ?? "", x + 3, y + 5, { width: colWidths[i] - 6, ellipsis: true });
      x += colWidths[i];
    }
    y += rowHeight;
  }
  return y;
}

export async function buildStudentPdf(students: StudentExportRow[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
  doc.registerFont("NotoSans", FONT_PATH);

  doc.font("NotoSans").fontSize(14).text("学生列表", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(9).text(`导出时间：${new Date().toLocaleString("zh-CN")}`, { align: "right" });
  doc.moveDown(0.5);

  const headers = ["学号", "姓名", "联系电话", "家长电话", "班级", "在读状态", "缴费状态", "入学日期"];
  const colWidths = [90, 70, 90, 90, 80, 60, 60, 80];
  const rows = students.map((s) => [
    s.studentNo,
    s.name,
    s.phone,
    s.guardianPhone,
    s.className,
    STATUS_MAP[s.enrollmentStatus] ?? s.enrollmentStatus,
    STATUS_MAP[s.paymentStatus] ?? s.paymentStatus,
    new Date(s.enrollmentDate).toISOString().slice(0, 10),
  ]);

  drawTable(doc, headers, rows, colWidths, 30, doc.y);
  return bufferFromDoc(doc);
}

export async function buildFinancePdf(entries: MonthlyFinancialEntry[], year: number): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.registerFont("NotoSans", FONT_PATH);

  doc.font("NotoSans").fontSize(16).text(`${year}年 财务报表`, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(9).text(`导出时间：${new Date().toLocaleString("zh-CN")}`, { align: "right" });
  doc.moveDown(1);

  const headers = ["月份", "学费收入", "招生提成", "退费", "净收入"];
  const colWidths = [50, 90, 90, 90, 90];

  const fmt = (n: number) => `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const rows = entries.map((e) => [
    e.label,
    fmt(e.tuitionIncome),
    fmt(e.recruitmentCost),
    fmt(e.refundAmount),
    fmt(e.netIncome),
  ]);

  // Totals
  rows.push([
    "合计",
    fmt(entries.reduce((s, e) => s + e.tuitionIncome, 0)),
    fmt(entries.reduce((s, e) => s + e.recruitmentCost, 0)),
    fmt(entries.reduce((s, e) => s + e.refundAmount, 0)),
    fmt(entries.reduce((s, e) => s + e.netIncome, 0)),
  ]);

  drawTable(doc, headers, rows, colWidths, 40, doc.y);
  return bufferFromDoc(doc);
}
