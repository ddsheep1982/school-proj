## 1. Dependencies & Setup

- [x] 1.1 Install `exceljs` and `pdfkit` and their TypeScript types: `npm install exceljs pdfkit && npm install -D @types/pdfkit`
- [x] 1.2 Download a NotoSansSC-Regular.ttf (or similar open-source CJK font) to `public/fonts/NotoSansSC-Regular.otf` for PDF Chinese rendering
- [x] 1.3 Create `src/lib/export/` directory structure with placeholder files: `excel.ts` and `pdf.ts`

## 2. Student Export API Route

- [x] 2.1 Create `src/app/api/export/students/route.ts` — GET handler that calls `auth()`, reads search params (format, search, classId, enrollmentStatus, paymentStatus, enrollmentTeacherId, recruitmentChannelType, recruitmentAgentId), and queries Prisma directly with no pagination
- [x] 2.2 Implement `buildStudentExcel(students)` in `src/lib/export/excel.ts` using `exceljs`: create workbook with sheet "学生列表", columns: 学号、姓名、联系电话、家长电话、班级、在读状态、缴费状态、入学日期; return `Buffer`
- [x] 2.3 Implement `buildStudentPdf(students)` in `src/lib/export/pdf.ts` using `pdfkit` with embedded NotoSansSC font: title + table with same columns; return `Buffer`
- [x] 2.4 In the route handler: if `format=xlsx` call `buildStudentExcel` and return response with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition: attachment; filename="students-<date>.xlsx"`
- [x] 2.5 If `format=pdf` call `buildStudentPdf` and return response with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="students-<date>.pdf"`
- [x] 2.6 Return HTTP 401 if auth fails; return HTTP 400 for unsupported format values

## 3. Finance Export API Route

- [x] 3.1 Create `src/app/api/export/finance/route.ts` — GET handler that calls `auth()`, reads `format` and `year` params (default year = current year), then calls `getMonthlyFinancialBreakdown(year)` and queries `PaymentRecord` for the year
- [x] 3.2 Implement `buildFinanceExcel(monthlyEntries, payments, year)` in `src/lib/export/excel.ts`: Sheet 1 "月度汇总" with columns 月份、学费收入、招生提成、退费、净收入; Sheet 2 "收费明细" with columns 日期、学号、姓名、金额、支付方式、备注; return `Buffer`
- [x] 3.3 Implement `buildFinancePdf(monthlyEntries, year)` in `src/lib/export/pdf.ts`: title "财务报表 <year>年" + monthly summary table; return `Buffer`
- [x] 3.4 Wire up the route handler with proper `Content-Disposition` headers and format routing (same pattern as student route)

## 4. Frontend Export Buttons

- [x] 4.1 In `src/app/(dashboard)/students/page.tsx`, add export button group above the student table: "导出 Excel" and "导出 PDF" as `<a>` links pointing to `/api/export/students?format=xlsx&<current-search-params>` and `/api/export/students?format=pdf&<current-search-params>` respectively
- [x] 4.2 In `src/app/(dashboard)/finance/page.tsx`, add export button group: "导出 Excel" and "导出 PDF" as `<a>` links pointing to `/api/export/finance?format=xlsx&year=<selected-year>` and `/api/export/finance?format=pdf&year=<selected-year>`

## 5. Verify End-to-End

- [ ] 5.1 Manually test student Excel export — open the file and verify Chinese names and all columns render correctly
- [ ] 5.2 Manually test student PDF export — verify Chinese characters show without garbling
- [ ] 5.3 Manually test finance Excel export — verify two sheets (月度汇总 + 收费明细) with correct data
- [ ] 5.4 Manually test finance PDF export — verify table layout and amounts
- [ ] 5.5 Test with filters applied on student list — confirm exported file only contains filtered students
