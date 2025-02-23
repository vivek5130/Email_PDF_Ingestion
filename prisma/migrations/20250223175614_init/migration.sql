-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfMetadata" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,

    CONSTRAINT "PdfMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfig_email_key" ON "EmailConfig"("email");

-- AddForeignKey
ALTER TABLE "PdfMetadata" ADD CONSTRAINT "PdfMetadata_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "EmailConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
