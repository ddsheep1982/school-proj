-- AlterEnum
ALTER TYPE "RecruitmentCostRecipientType" ADD VALUE 'RECEPTION_TEACHER';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "receptionTeacherId" TEXT,
ADD COLUMN     "withdrawalDate" TIMESTAMP(3),
ADD COLUMN     "withdrawalReason" TEXT;

-- CreateTable
CREATE TABLE "RefundRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "refundDate" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefundRecord_studentId_idx" ON "RefundRecord"("studentId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_receptionTeacherId_fkey" FOREIGN KEY ("receptionTeacherId") REFERENCES "EnrollmentTeacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
