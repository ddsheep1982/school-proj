/**
 * Jest globalSetup — runs once before all integration test suites.
 * Applies Prisma migrations against the test database.
 *
 * Prerequisites:
 *   psql -c "CREATE DATABASE school_mgmt_test;"
 */
const { execSync } = require("child_process");

module.exports = async function globalSetup() {
  const testDbUrl =
    "postgresql://postgres:postgres@localhost:5432/school_mgmt_test?schema=public";

  console.log("\n▶ Running Prisma migrations against test database...");
  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "inherit",
    });
    console.log("✓ Migrations applied.\n");
  } catch (err) {
    console.warn(
      "\n⚠️  Could not apply Prisma migrations. Ensure the test database exists:\n" +
        '   psql -c "CREATE DATABASE school_mgmt_test;"\n' +
        "   DATABASE_URL='" +
        testDbUrl +
        "' npx prisma migrate deploy\n"
    );
    // Do not throw — let individual tests fail with informative DB errors.
  }
};
