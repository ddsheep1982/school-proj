import { jest } from "@jest/globals";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * T068 Performance Smoke Test
 * Seeds 500 students into the test DB and times getDashboardMetrics({}).
 * Validates SC-002: getDashboardMetrics must complete in <2s.
 */

// getDashboardMetrics uses requireAuth indirectly via prisma singleton — no auth mock needed.
// It does NOT call requireAuth itself.

const { getDashboardMetrics } = await import("@/lib/dashboard.queries");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const PERF_TAG = `perf-smoke-${Date.now()}`;
const TARGET_TOTAL = 500;
const THRESHOLD_MS = 2000;

let seededIds: string[] = [];

beforeAll(async () => {
  // Count existing students
  const existing = await prisma.student.count();
  const needed = Math.max(0, TARGET_TOTAL - existing);

  if (needed === 0) {
    console.log(`Already have ${existing} students — skipping bulk seed.`);
    return;
  }

  console.log(`Seeding ${needed} students to reach ${TARGET_TOTAL} total…`);

  const year = new Date().getFullYear();
  const lastStudent = await prisma.student.findFirst({
    orderBy: { studentNo: "desc" },
    where: { studentNo: { startsWith: `S${year}` } },
    select: { studentNo: true },
  });
  let seq = lastStudent ? parseInt(lastStudent.studentNo.slice(5)) + 1 : 1;

  const statuses = ["ACTIVE", "WITHDRAWN", "GRADUATED"] as const;
  const payments = ["PAID", "PARTIAL", "OVERDUE"] as const;
  const BATCH = 50;

  for (let i = 0; i < needed; i += BATCH) {
    const batchSize = Math.min(BATCH, needed - i);
    const data = Array.from({ length: batchSize }, (_, j) => ({
      studentNo: `S${year}${String(seq + i + j).padStart(4, "0")}`,
      name: `PerfStudent ${PERF_TAG} ${i + j + 1}`,
      phone: `138${String(10000000 + i + j).slice(0, 8)}`,
      guardianPhone: `139${String(10000000 + i + j).slice(0, 8)}`,
      enrollmentStatus: statuses[(i + j) % 3],
      paymentStatus: payments[(i + j) % 3],
    }));
    const result = await prisma.student.createManyAndReturn({
      data,
      skipDuplicates: true,
      select: { id: true },
    });
    seededIds.push(...result.map((r) => r.id));
  }

  const total = await prisma.student.count();
  console.log(`Total students in DB after seed: ${total}`);
}, 60_000);

afterAll(async () => {
  if (seededIds.length > 0) {
    await prisma.student.deleteMany({ where: { id: { in: seededIds } } });
    console.log(`Cleaned up ${seededIds.length} seeded students.`);
  }
  await prisma.$disconnect();
}, 30_000);

describe("getDashboardMetrics performance (SC-002)", () => {
  it(`completes in under ${THRESHOLD_MS}ms with 500+ students`, async () => {
    const RUNS = 3;
    const times: number[] = [];

    for (let i = 0; i < RUNS; i++) {
      const t0 = performance.now();
      await getDashboardMetrics({});
      times.push(performance.now() - t0);
    }

    const max = Math.max(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    console.log(
      `getDashboardMetrics — avg: ${avg.toFixed(0)}ms, max: ${max.toFixed(0)}ms (${RUNS} runs)`
    );

    expect(max).toBeLessThan(THRESHOLD_MS);
  }, 30_000);
});
