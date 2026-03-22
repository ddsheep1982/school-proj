import ExcelJS from "exceljs";
import type { MonthlyFinancialEntry } from "@/types/index";

const STATUS_MAP: Record<string, string> = {
  ACTIVE: "在读",
  WITHDRAWN: "已退学",
  GRADUATED: "已毕业",
  PAID: "已缴费",
  PARTIAL: "部分缴费",
  OVERDUE: "欠费",
  CASH: "现金",
  BANK_TRANSFER: "银行转账",
  WECHAT: "微信",
  ALIPAY: "支付宝",
  OTHER: "其他",
};

export type StudentExportRow = {
  studentNo: string;
  name: string;
  phone: string;
  guardianPhone: string;
  className: string;
  enrollmentStatus: string;
  paymentStatus: string;
  enrollmentDate: Date;
};

export type PaymentExportRow = {
  paymentDate: Date;
  studentNo: string;
  studentName: string;
  amount: number;
  paymentType: string;
  notes: string;
};

export async function buildStudentExcel(students: StudentExportRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("学生列表");

  ws.columns = [
    { header: "学号", key: "studentNo", width: 14 },
    { header: "姓名", key: "name", width: 12 },
    { header: "联系电话", key: "phone", width: 14 },
    { header: "家长电话", key: "guardianPhone", width: 14 },
    { header: "班级", key: "className", width: 12 },
    { header: "在读状态", key: "enrollmentStatus", width: 10 },
    { header: "缴费状态", key: "paymentStatus", width: 10 },
    { header: "入学日期", key: "enrollmentDate", width: 12 },
  ];

  // Header style
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  });

  for (const s of students) {
    ws.addRow({
      studentNo: s.studentNo,
      name: s.name,
      phone: s.phone,
      guardianPhone: s.guardianPhone,
      className: s.className,
      enrollmentStatus: STATUS_MAP[s.enrollmentStatus] ?? s.enrollmentStatus,
      paymentStatus: STATUS_MAP[s.paymentStatus] ?? s.paymentStatus,
      enrollmentDate: new Date(s.enrollmentDate).toISOString().slice(0, 10),
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function buildFinanceExcel(
  entries: MonthlyFinancialEntry[],
  payments: PaymentExportRow[],
  year: number
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: monthly summary
  const ws1 = wb.addWorksheet("月度汇总");
  ws1.columns = [
    { header: "月份", key: "label", width: 8 },
    { header: "学费收入", key: "tuitionIncome", width: 12 },
    { header: "招生提成", key: "recruitmentCost", width: 12 },
    { header: "退费", key: "refundAmount", width: 12 },
    { header: "净收入", key: "netIncome", width: 12 },
  ];
  ws1.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  });
  for (const e of entries) {
    ws1.addRow({
      label: e.label,
      tuitionIncome: e.tuitionIncome,
      recruitmentCost: e.recruitmentCost,
      refundAmount: e.refundAmount,
      netIncome: e.netIncome,
    });
  }
  // Totals row
  ws1.addRow({
    label: "合计",
    tuitionIncome: entries.reduce((s, e) => s + e.tuitionIncome, 0),
    recruitmentCost: entries.reduce((s, e) => s + e.recruitmentCost, 0),
    refundAmount: entries.reduce((s, e) => s + e.refundAmount, 0),
    netIncome: entries.reduce((s, e) => s + e.netIncome, 0),
  });
  const lastRow = ws1.lastRow;
  if (lastRow) lastRow.font = { bold: true };

  // Sheet 2: payment details
  const ws2 = wb.addWorksheet("收费明细");
  ws2.columns = [
    { header: "日期", key: "paymentDate", width: 12 },
    { header: "学号", key: "studentNo", width: 14 },
    { header: "姓名", key: "studentName", width: 12 },
    { header: "金额", key: "amount", width: 12 },
    { header: "支付方式", key: "paymentType", width: 12 },
    { header: "备注", key: "notes", width: 20 },
  ];
  ws2.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  });
  for (const p of payments) {
    ws2.addRow({
      paymentDate: new Date(p.paymentDate).toISOString().slice(0, 10),
      studentNo: p.studentNo,
      studentName: p.studentName,
      amount: p.amount,
      paymentType: STATUS_MAP[p.paymentType] ?? p.paymentType,
      notes: p.notes,
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
