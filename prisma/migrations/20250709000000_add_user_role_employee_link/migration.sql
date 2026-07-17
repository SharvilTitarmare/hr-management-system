-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Admin', 'Employee');

-- AlterTable: give LeaveRequest.status a default of Pending
ALTER TABLE "LeaveRequest" ALTER COLUMN "status" SET DEFAULT 'Pending';

-- AlterTable: add role + employeeId to users
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'Employee';
ALTER TABLE "users" ADD COLUMN "employeeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
