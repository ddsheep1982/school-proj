/**
 * Jest globalTeardown — runs once after all integration test suites.
 * Prisma connections are closed per-suite in afterAll; nothing extra needed here.
 */
module.exports = async function globalTeardown() {
  // Individual test suites call prisma.$disconnect() in afterAll.
};
