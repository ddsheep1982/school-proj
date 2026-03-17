-- CreateEnum
CREATE TYPE "RecruitmentCostRecipientType" AS ENUM ('TEACHER', 'AGENT');

-- CreateTable
CREATE TABLE "RecruitmentCost" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "recipientType" "RecruitmentCostRecipientType" NOT NULL,
    "teacherId" TEXT,
    "agentId" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecruitmentCost_studentId_idx" ON "RecruitmentCost"("studentId");

-- CreateIndex
CREATE INDEX "RecruitmentCost_teacherId_idx" ON "RecruitmentCost"("teacherId");

-- CreateIndex
CREATE INDEX "RecruitmentCost_agentId_idx" ON "RecruitmentCost"("agentId");

-- CreateIndex
CREATE INDEX "RecruitmentCost_paymentDate_idx" ON "RecruitmentCost"("paymentDate");

-- AddForeignKey
ALTER TABLE "RecruitmentCost" ADD CONSTRAINT "RecruitmentCost_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCost" ADD CONSTRAINT "RecruitmentCost_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "EnrollmentTeacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCost" ADD CONSTRAINT "RecruitmentCost_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "RecruitmentAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCost" ADD CONSTRAINT "RecruitmentCost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
