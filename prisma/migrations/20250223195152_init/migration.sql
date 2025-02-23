/*
  Warnings:

  - You are about to drop the `EmailConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PdfMetadata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PdfMetadata" DROP CONSTRAINT "PdfMetadata_emailId_fkey";

-- DropTable
DROP TABLE "EmailConfig";

-- DropTable
DROP TABLE "PdfMetadata";

-- CreateTable
CREATE TABLE "EmailIngestionConfig" (
    "id" SERIAL NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "host" TEXT NOT NULL,

    CONSTRAINT "EmailIngestionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfAttachment" (
    "id" SERIAL NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "attachmentFileName" TEXT NOT NULL,
    "emailConfigId" INTEGER NOT NULL,

    CONSTRAINT "PdfAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PdfAttachment" ADD CONSTRAINT "PdfAttachment_emailConfigId_fkey" FOREIGN KEY ("emailConfigId") REFERENCES "EmailIngestionConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
