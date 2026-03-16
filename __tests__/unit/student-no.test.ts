/**
 * Unit tests for generateStudentNo.
 * These tests mock the prisma client to avoid DB dependency.
 */

import { generateStudentNo } from "@/lib/student-no";

// Mock the prisma module
jest.mock("@/lib/prisma", () => ({
  prisma: {
    student: {
      findFirst: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockFindFirst = prisma.student.findFirst as jest.Mock;

describe("generateStudentNo", () => {
  const year = new Date().getFullYear();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates S<YEAR>0001 when no students exist for this year", async () => {
    mockFindFirst.mockResolvedValue(null);
    const no = await generateStudentNo();
    expect(no).toBe(`S${year}0001`);
  });

  it("increments from the last student number", async () => {
    mockFindFirst.mockResolvedValue({ studentNo: `S${year}0005` });
    const no = await generateStudentNo();
    expect(no).toBe(`S${year}0006`);
  });

  it("pads sequence to 4 digits", async () => {
    mockFindFirst.mockResolvedValue({ studentNo: `S${year}0099` });
    const no = await generateStudentNo();
    expect(no).toBe(`S${year}0100`);
  });

  it("handles sequence over 9999 gracefully", async () => {
    mockFindFirst.mockResolvedValue({ studentNo: `S${year}9999` });
    const no = await generateStudentNo();
    expect(no).toBe(`S${year}10000`);
  });

  it("returns a string starting with S followed by the current year", async () => {
    mockFindFirst.mockResolvedValue(null);
    const no = await generateStudentNo();
    expect(no).toMatch(new RegExp(`^S${year}\\d+$`));
  });
});
