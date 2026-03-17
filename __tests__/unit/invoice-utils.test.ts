import { computeInvoiceStatus } from "@/lib/invoice.utils";

const makeInvoice = (
  amountDue: number,
  payments: number[],
  waivedAt: Date | null = null
) => ({
  amountDue,
  waivedAt,
  payments: payments.map((amount) => ({ amount })),
});

describe("computeInvoiceStatus", () => {
  it("returns OUTSTANDING when no payments and not waived", () => {
    expect(computeInvoiceStatus(makeInvoice(100, []))).toBe("OUTSTANDING");
  });

  it("returns PARTIAL when some payment but less than amountDue", () => {
    expect(computeInvoiceStatus(makeInvoice(100, [50]))).toBe("PARTIAL");
  });

  it("returns PARTIAL when multiple payments sum is less than amountDue", () => {
    expect(computeInvoiceStatus(makeInvoice(100, [30, 40]))).toBe("PARTIAL");
  });

  it("returns PAID when payments equal amountDue", () => {
    expect(computeInvoiceStatus(makeInvoice(100, [100]))).toBe("PAID");
  });

  it("returns PAID when payments exceed amountDue", () => {
    expect(computeInvoiceStatus(makeInvoice(100, [60, 60]))).toBe("PAID");
  });

  it("returns WAIVED when waivedAt is set, regardless of payments", () => {
    expect(computeInvoiceStatus(makeInvoice(100, [], new Date()))).toBe("WAIVED");
    expect(computeInvoiceStatus(makeInvoice(100, [50], new Date()))).toBe("WAIVED");
    expect(computeInvoiceStatus(makeInvoice(100, [100], new Date()))).toBe("WAIVED");
  });

  it("handles Decimal-like objects with toNumber()", () => {
    const invoice = {
      amountDue: { toNumber: () => 100 },
      waivedAt: null,
      payments: [{ amount: { toNumber: () => 40 } }, { amount: { toNumber: () => 30 } }],
    };
    expect(computeInvoiceStatus(invoice)).toBe("PARTIAL");
  });
});
