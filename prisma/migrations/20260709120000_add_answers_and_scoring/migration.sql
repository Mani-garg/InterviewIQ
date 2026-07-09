-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "overallScore" INTEGER,
ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Answer_interviewId_idx" ON "Answer"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_interviewId_questionIndex_key" ON "Answer"("interviewId", "questionIndex");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;