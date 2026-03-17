import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared result type for all Server Actions
// ---------------------------------------------------------------------------
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ---------------------------------------------------------------------------
// Enums (mirrors Prisma enums — avoids importing generated client in types)
// ---------------------------------------------------------------------------
export const EnrollmentStatusEnum = z.enum(["ACTIVE", "WITHDRAWN", "GRADUATED"]);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusEnum>;

export const PaymentStatusEnum = z.enum(["PAID", "PARTIAL", "OVERDUE"]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const RecruitmentChannelTypeEnum = z.enum(["TEACHER", "AGENT"]);
export type RecruitmentChannelType = z.infer<typeof RecruitmentChannelTypeEnum>;

export const PaymentTypeEnum = z.enum([
  "CASH",
  "BANK_TRANSFER",
  "WECHAT",
  "ALIPAY",
  "OTHER",
]);
export type PaymentType = z.infer<typeof PaymentTypeEnum>;

export const UserRoleEnum = z.enum(["ADMIN", "STAFF"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

// ---------------------------------------------------------------------------
// Student schemas
// ---------------------------------------------------------------------------
export const CreateStudentSchema = z
  .object({
    name: z.string().min(1, "姓名不能为空"),
    phone: z.string().min(1, "联系电话不能为空"),
    guardianPhone: z.string().min(1, "家长联系电话不能为空"),
    enrollmentDate: z.string().datetime(),
    classId: z.string().cuid().optional(),
    enrollmentTeacherId: z.string().cuid().optional(),
    receptionTeacherId: z.string().cuid().optional(),
    recruitmentChannelType: RecruitmentChannelTypeEnum.optional(),
    recruitmentTeacherId: z.string().cuid().optional(),
    recruitmentAgentId: z.string().cuid().optional(),
  })
  .refine(
    (d) => {
      if (d.recruitmentChannelType === "TEACHER") return !!d.recruitmentTeacherId;
      if (d.recruitmentChannelType === "AGENT") return !!d.recruitmentAgentId;
      return true;
    },
    {
      message: "必须根据招生渠道类型填写对应的招生老师或招生代理",
      path: ["recruitmentChannelType"],
    }
  );

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const UpdateStudentSchema = z
  .object({
    name: z.string().min(1, "姓名不能为空").optional(),
    phone: z.string().min(1, "联系电话不能为空").optional(),
    guardianPhone: z.string().min(1, "家长联系电话不能为空").optional(),
    enrollmentDate: z.string().datetime().optional(),
    enrollmentStatus: EnrollmentStatusEnum.optional(),
    paymentStatus: PaymentStatusEnum.optional(),
    classId: z.string().cuid().nullable().optional(),
    enrollmentTeacherId: z.string().cuid().nullable().optional(),
    receptionTeacherId: z.string().cuid().nullable().optional(),
    recruitmentChannelType: RecruitmentChannelTypeEnum.nullable().optional(),
    recruitmentTeacherId: z.string().cuid().nullable().optional(),
    recruitmentAgentId: z.string().cuid().nullable().optional(),
  })
  .refine(
    (d) => {
      if (d.recruitmentChannelType === "TEACHER") return !!d.recruitmentTeacherId;
      if (d.recruitmentChannelType === "AGENT") return !!d.recruitmentAgentId;
      return true;
    },
    {
      message: "必须根据招生渠道类型填写对应的招生老师或招生代理",
      path: ["recruitmentChannelType"],
    }
  );

export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;

export const StudentFiltersSchema = z.object({
  search: z.string().optional(),
  classId: z.string().optional(),
  enrollmentTeacherId: z.string().optional(),
  recruitmentAgentId: z.string().optional(),
  recruitmentChannelType: RecruitmentChannelTypeEnum.optional(),
  enrollmentStatus: EnrollmentStatusEnum.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type StudentFilters = z.infer<typeof StudentFiltersSchema>;

// ---------------------------------------------------------------------------
// Payment schemas
// ---------------------------------------------------------------------------
export const CreatePaymentSchema = z.object({
  studentId: z.string().cuid(),
  amount: z.number().positive("金额必须大于0"),
  paymentDate: z.string().datetime(),
  paymentType: PaymentTypeEnum,
  notes: z.string().optional(),
  invoiceId: z.string().cuid().optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const CreateAdjustmentSchema = z.object({
  originalId: z.string().cuid(),
  amount: z.number(),
  paymentDate: z.string().datetime(),
  paymentType: PaymentTypeEnum,
  notes: z.string().optional(),
});

export type CreateAdjustmentInput = z.infer<typeof CreateAdjustmentSchema>;

// ---------------------------------------------------------------------------
// Attendance schemas
// ---------------------------------------------------------------------------
export const AttendanceTimeSchema = z.object({
  studentId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "时间格式应为 HH:MM"),
});

export type AttendanceTimeInput = z.infer<typeof AttendanceTimeSchema>;

// ---------------------------------------------------------------------------
// Class schemas
// ---------------------------------------------------------------------------
export const CreateClassSchema = z.object({
  name: z.string().min(1, "班级名称不能为空"),
  capacity: z.number().int().positive("容量必须为正整数"),
});

export type CreateClassInput = z.infer<typeof CreateClassSchema>;

export const UpdateClassSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  archived: z.boolean().optional(),
});

export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;

// ---------------------------------------------------------------------------
// Enrollment Teacher schemas
// ---------------------------------------------------------------------------
export const CreateTeacherSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  phone: z.string().min(1, "联系电话不能为空"),
});

export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>;

export const UpdateTeacherSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>;

// ---------------------------------------------------------------------------
// Recruitment Agent schemas
// ---------------------------------------------------------------------------
export const CreateAgentSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  agencyName: z.string().optional(),
  phone: z.string().min(1, "联系电话不能为空"),
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  agencyName: z.string().nullable().optional(),
  phone: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;

// ---------------------------------------------------------------------------
// User schemas
// ---------------------------------------------------------------------------
export const CreateUserSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少8位"),
  role: UserRoleEnum,
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: UserRoleEnum.optional(),
  active: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// ---------------------------------------------------------------------------
// Dashboard types
// ---------------------------------------------------------------------------
export interface DashboardFilters {
  classId?: string;
  enrollmentTeacherId?: string;
  recruitmentChannelType?: RecruitmentChannelType;
  recruitmentAgentId?: string;
}

export interface DashboardMetrics {
  totalActive: number;
  byEnrollmentStatus: { status: EnrollmentStatus; count: number }[];
  byPaymentStatus: { status: PaymentStatus; count: number }[];
  todayAttendanceCount: number;
}

export interface KanbanCard {
  id: string;
  studentNo: string;
  name: string;
  phone: string;
  paymentStatus: PaymentStatus;
  className?: string;
  enrollmentTeacherName?: string;
}

export interface KanbanData {
  ACTIVE: KanbanCard[];
  WITHDRAWN: KanbanCard[];
  GRADUATED: KanbanCard[];
}

// ---------------------------------------------------------------------------
// Fee Management schemas
// ---------------------------------------------------------------------------
export const FeeRecurrenceEnum = z.enum(["ONE_TIME", "TERM", "ANNUAL"]);
export type FeeRecurrence = z.infer<typeof FeeRecurrenceEnum>;

export const CreateFeeStructureSchema = z.object({
  name: z.string().min(1, "费用名称不能为空"),
  description: z.string().optional(),
  amount: z.number().positive("金额必须大于0"),
  recurrence: FeeRecurrenceEnum,
  academicYear: z.string().min(1, "学年不能为空"),
});
export type CreateFeeStructureInput = z.infer<typeof CreateFeeStructureSchema>;

export const UpdateFeeStructureSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  amount: z.number().positive().optional(),
  recurrence: FeeRecurrenceEnum.optional(),
  academicYear: z.string().min(1).optional(),
});
export type UpdateFeeStructureInput = z.infer<typeof UpdateFeeStructureSchema>;

export const CreateFeeAssignmentSchema = z.discriminatedUnion("targetType", [
  z.object({
    targetType: z.literal("student"),
    feeStructureId: z.string().cuid(),
    studentId: z.string().cuid(),
    dueDate: z.string().datetime(),
  }),
  z.object({
    targetType: z.literal("class"),
    feeStructureId: z.string().cuid(),
    classId: z.string().cuid(),
    dueDate: z.string().datetime(),
  }),
]);
export type CreateFeeAssignmentInput = z.infer<typeof CreateFeeAssignmentSchema>;

export const InvoiceStatusEnum = z.enum(["OUTSTANDING", "PARTIAL", "PAID", "WAIVED"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const WaiveInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  waivedReason: z.string().min(1, "请填写豁免原因"),
});
export type WaiveInvoiceInput = z.infer<typeof WaiveInvoiceSchema>;

export const ListInvoicesSchema = z.object({
  status: InvoiceStatusEnum.optional(),
  academicYear: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ListInvoicesInput = z.infer<typeof ListInvoicesSchema>;

// ---------------------------------------------------------------------------
// Financial / Recruitment Cost schemas
// ---------------------------------------------------------------------------
export const RecruitmentCostRecipientTypeEnum = z.enum(["TEACHER", "AGENT", "RECEPTION_TEACHER"]);
export type RecruitmentCostRecipientType = z.infer<typeof RecruitmentCostRecipientTypeEnum>;

export const CreateRecruitmentCostSchema = z.object({
  studentId: z.string().cuid(),
  amount: z.number().positive("金额必须大于0"),
  paymentDate: z.string().datetime(),
  recipientType: RecruitmentCostRecipientTypeEnum,
  teacherId: z.string().cuid().optional(),
  agentId: z.string().cuid().optional(),
  notes: z.string().optional(),
}).refine(
  (d) => {
    if (d.recipientType === "TEACHER" || d.recipientType === "RECEPTION_TEACHER") return !!d.teacherId;
    if (d.recipientType === "AGENT") return !!d.agentId;
    return true;
  },
  { message: "必须根据收款方类型填写对应的老师或代理", path: ["recipientType"] }
);
export type CreateRecruitmentCostInput = z.infer<typeof CreateRecruitmentCostSchema>;

export const WithdrawStudentSchema = z.object({
  withdrawalDate: z.string().datetime(),
  withdrawalReason: z.string().min(1, "请填写退学原因"),
  refundAmount: z.number().positive("退款金额必须大于0").optional(),
  refundDate: z.string().datetime().optional(),
  refundReason: z.string().min(1, "请填写退款原因").optional(),
  refundInvoiceId: z.string().cuid().optional(),
}).superRefine((data, ctx) => {
  if (data.refundAmount !== undefined) {
    if (!data.refundDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "填写退款金额时必须提供退款日期", path: ["refundDate"] });
    }
    if (!data.refundReason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "填写退款金额时必须提供退款原因", path: ["refundReason"] });
    }
  }
});
export type WithdrawStudentInput = z.infer<typeof WithdrawStudentSchema>;

export const CreateRefundRecordSchema = z.object({
  studentId: z.string().cuid(),
  invoiceId: z.string().cuid().optional(),
  amount: z.number().positive("金额必须大于0"),
  reason: z.string().min(1, "请填写退费原因"),
  refundDate: z.string().datetime(),
});
export type CreateRefundRecordInput = z.infer<typeof CreateRefundRecordSchema>;

export const FinancialSummaryFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  classId: z.string().cuid().optional(),
  year: z.coerce.number().int().optional(),
});
export type FinancialSummaryFilters = z.infer<typeof FinancialSummaryFiltersSchema>;

export interface FinancialSummary {
  totalIncome: number;
  totalCosts: number;
  totalRefunded: number;
  netIncome: number;
}

export interface MonthlyFinancialEntry {
  month: number;
  label: string;
  tuitionIncome: number;
  recruitmentCost: number;
  refundAmount: number;
  netIncome: number;
}

export interface StudentFinancialSummary {
  studentId: string;
  studentNo: string;
  name: string;
  totalTuition: number;
  totalRecruitmentCost: number;
  totalRefunded: number;
  netContribution: number;
}
