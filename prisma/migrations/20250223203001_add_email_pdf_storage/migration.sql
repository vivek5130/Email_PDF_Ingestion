/*
  Warnings:

  - The primary key for the `EmailIngestionConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `emailAddress` on the `EmailIngestionConfig` table. All the data in the column will be lost.
  - You are about to drop the `PdfAttachment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `EmailIngestionConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `EmailIngestionConfig` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PdfAttachment" DROP CONSTRAINT "PdfAttachment_emailConfigId_fkey";

-- AlterTable
ALTER TABLE "EmailIngestionConfig" DROP CONSTRAINT "EmailIngestionConfig_pkey",
DROP COLUMN "emailAddress",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "EmailIngestionConfig_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "EmailIngestionConfig_id_seq";

-- DropTable
DROP TABLE "PdfAttachment";

-- CreateTable
CREATE TABLE "PdfMetadata" (
    "id" TEXT NOT NULL,
    "emailConfigId" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "attachmentFileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,

    CONSTRAINT "PdfMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailIngestionConfig_email_key" ON "EmailIngestionConfig"("email");

-- AddForeignKey
ALTER TABLE "PdfMetadata" ADD CONSTRAINT "PdfMetadata_emailConfigId_fkey" FOREIGN KEY ("emailConfigId") REFERENCES "EmailIngestionConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
