import {
  CreateStudentSchema,
  UpdateStudentSchema,
  CreatePaymentSchema,
  CreateAdjustmentSchema,
  AttendanceTimeSchema,
  CreateClassSchema,
  CreateTeacherSchema,
  CreateAgentSchema,
  CreateUserSchema,
} from "@/types/index";

describe("CreateStudentSchema", () => {
  const base = {
    name: "张三",
    phone: "13800000001",
    guardianPhone: "13800000002",
    enrollmentDate: new Date().toISOString(),
  };

  it("accepts a valid minimal student", () => {
    expect(CreateStudentSchema.safeParse(base).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(CreateStudentSchema.safeParse({ ...base, name: "" }).success).toBe(false);
  });

  it("rejects empty phone", () => {
    expect(CreateStudentSchema.safeParse({ ...base, phone: "" }).success).toBe(false);
  });

  it("rejects TEACHER channel without recruitmentTeacherId", () => {
    const result = CreateStudentSchema.safeParse({
      ...base,
      recruitmentChannelType: "TEACHER",
    });
    expect(result.success).toBe(false);
  });

  it("accepts TEACHER channel with recruitmentTeacherId", () => {
    const result = CreateStudentSchema.safeParse({
      ...base,
      recruitmentChannelType: "TEACHER",
      recruitmentTeacherId: "clxxxxxxxxxxxxxxxxxxxxxx",
    });
    expect(result.success).toBe(true);
  });

  it("rejects AGENT channel without recruitmentAgentId", () => {
    const result = CreateStudentSchema.safeParse({
      ...base,
      recruitmentChannelType: "AGENT",
    });
    expect(result.success).toBe(false);
  });

  it("accepts AGENT channel with recruitmentAgentId", () => {
    const result = CreateStudentSchema.safeParse({
      ...base,
      recruitmentChannelType: "AGENT",
      recruitmentAgentId: "clxxxxxxxxxxxxxxxxxxxxxx",
    });
    expect(result.success).toBe(true);
  });
});

describe("CreatePaymentSchema", () => {
  it("accepts valid payment", () => {
    expect(
      CreatePaymentSchema.safeParse({
        studentId: "clxxxxxxxxxxxxxxxxxxxxxx",
        amount: 1000,
        paymentDate: new Date().toISOString(),
        paymentType: "CASH",
      }).success
    ).toBe(true);
  });

  it("rejects zero amount", () => {
    expect(
      CreatePaymentSchema.safeParse({
        studentId: "clxxxxxxxxxxxxxxxxxxxxxx",
        amount: 0,
        paymentDate: new Date().toISOString(),
        paymentType: "CASH",
      }).success
    ).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(
      CreatePaymentSchema.safeParse({
        studentId: "clxxxxxxxxxxxxxxxxxxxxxx",
        amount: -100,
        paymentDate: new Date().toISOString(),
        paymentType: "CASH",
      }).success
    ).toBe(false);
  });

  it("rejects invalid payment type", () => {
    expect(
      CreatePaymentSchema.safeParse({
        studentId: "clxxxxxxxxxxxxxxxxxxxxxx",
        amount: 500,
        paymentDate: new Date().toISOString(),
        paymentType: "CREDIT_CARD",
      }).success
    ).toBe(false);
  });
});

describe("AttendanceTimeSchema", () => {
  it("accepts valid date and time", () => {
    expect(
      AttendanceTimeSchema.safeParse({
        studentId: "clxxxxxxxxxxxxxxxxxxxxxx",
        date: "2026-03-14",
        time: "09:30",
      }).success
    ).toBe(true);
  });

  it("rejects invalid date format", () => {
    expect(
      AttendanceTimeSchema.safeParse({
        studentId: "clxxxxxxxxxxxxxxxxxxxxxx",
        date: "14/03/2026",
        time: "09:30",
      }).success
    ).toBe(false);
  });

  it("rejects invalid time format", () => {
    expect(
      AttendanceTimeSchema.safeParse({
        studentId: "clxxxxxxxxxxxxxxxxxxxxxx",
        date: "2026-03-14",
        time: "9:30",
      }).success
    ).toBe(false);
  });
});

describe("CreateClassSchema", () => {
  it("accepts valid class", () => {
    expect(CreateClassSchema.safeParse({ name: "一班", capacity: 30 }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(CreateClassSchema.safeParse({ name: "", capacity: 30 }).success).toBe(false);
  });

  it("rejects zero capacity", () => {
    expect(CreateClassSchema.safeParse({ name: "一班", capacity: 0 }).success).toBe(false);
  });
});

describe("CreateTeacherSchema", () => {
  it("accepts valid teacher", () => {
    expect(
      CreateTeacherSchema.safeParse({ name: "李老师", phone: "13900000001" }).success
    ).toBe(true);
  });

  it("rejects empty name", () => {
    expect(CreateTeacherSchema.safeParse({ name: "", phone: "13900000001" }).success).toBe(
      false
    );
  });
});

describe("CreateAgentSchema", () => {
  it("accepts valid agent with optional agencyName", () => {
    expect(
      CreateAgentSchema.safeParse({ name: "王代理", phone: "13700000001" }).success
    ).toBe(true);
  });

  it("accepts agent with agencyName", () => {
    expect(
      CreateAgentSchema.safeParse({
        name: "王代理",
        agencyName: "优学教育",
        phone: "13700000001",
      }).success
    ).toBe(true);
  });
});

describe("CreateUserSchema", () => {
  it("accepts valid user", () => {
    expect(
      CreateUserSchema.safeParse({
        name: "管理员",
        email: "admin@school.com",
        password: "password123",
        role: "ADMIN",
      }).success
    ).toBe(true);
  });

  it("rejects short password", () => {
    expect(
      CreateUserSchema.safeParse({
        name: "管理员",
        email: "admin@school.com",
        password: "123",
        role: "ADMIN",
      }).success
    ).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(
      CreateUserSchema.safeParse({
        name: "管理员",
        email: "not-an-email",
        password: "password123",
        role: "ADMIN",
      }).success
    ).toBe(false);
  });

  it("rejects invalid role", () => {
    expect(
      CreateUserSchema.safeParse({
        name: "管理员",
        email: "admin@school.com",
        password: "password123",
        role: "SUPERUSER",
      }).success
    ).toBe(false);
  });
});
