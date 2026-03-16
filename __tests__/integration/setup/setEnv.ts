/**
 * Runs in each test worker process (via setupFiles) to ensure
 * DATABASE_URL points to the test database before any modules are imported.
 */
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/school_mgmt_test?schema=public";
process.env.NEXTAUTH_SECRET = "test-secret-for-integration-tests-32chars";
process.env.NEXTAUTH_URL = "http://localhost:3000";
