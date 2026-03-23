-- DropIndex
DROP INDEX IF EXISTS "Class_name_key";

-- AlterTable
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "gradeId" TEXT;

-- CreateTable (already applied directly)
CREATE TABLE IF NOT EXISTS "Campus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Grade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Campus_name_key" ON "Campus"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Grade_name_campusId_key" ON "Grade"("name", "campusId");
CREATE UNIQUE INDEX IF NOT EXISTS "Class_name_gradeId_key" ON "Class"("name", "gradeId");

ALTER TABLE "Grade" ADD CONSTRAINT IF NOT EXISTS "Grade_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Class" ADD CONSTRAINT IF NOT EXISTS "Class_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
