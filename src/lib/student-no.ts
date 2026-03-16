import { prisma } from "@/lib/prisma";

/**
 * Generates the next student number in the format "S<YEAR><4-digit-seq>".
 * e.g. "S20260001", "S20260002", ...
 * Uses the current year and counts existing students in that year to determine sequence.
 */
export async function generateStudentNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `S${year}`;

  // Find the highest existing student number for this year
  const last = await prisma.student.findFirst({
    where: { studentNo: { startsWith: prefix } },
    orderBy: { studentNo: "desc" },
    select: { studentNo: true },
  });

  let seq = 1;
  if (last) {
    const lastSeq = parseInt(last.studentNo.slice(prefix.length), 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}
