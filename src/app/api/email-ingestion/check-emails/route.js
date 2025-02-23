import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Imap from 'imap';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const PDF_DIR = "./pdfs/";

// Ensure the PDF directory exists
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// Helper function to recursively extract attachments from a message structure
function getAttachments(struct) {
  let attachments = [];
  for (const part of struct) {
    if (Array.isArray(part)) {
      attachments = attachments.concat(getAttachments(part));
    } else if (
      part.disposition &&
      part.disposition.type &&
      part.disposition.type.toUpperCase() === 'ATTACHMENT'
    ) {
      attachments.push(part);
    }
  }
  return attachments;
}

export async function POST(request) {
  try {
    const configs = await prisma.emailIngestionConfig.findMany();
    console.log(`Found ${configs.length} configuration(s) to process`);

    for (const config of configs) {
      console.log(`Processing configuration: ${config.id} (${config.email})`);

      const imap = new Imap({
        user: config.username,
        password: config.password,
        host: config.host,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      imap.once('ready', () => {
        console.log(`IMAP connection ready for config: ${config.id}`);
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error(`Error opening INBOX for config: ${config.id}`, err);
            imap.end();
            return;
          }

          imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
            if (err) {
              console.error(`Error searching emails for config: ${config.id}`, err);
              imap.end();
              return;
            }
            if (!results || results.length === 0) {
              console.log(`No new emails for config: ${config.id}`);
              imap.end();
              return;
            }

            console.log(`Found ${results.length} new email(s) for config: ${config.id}`);
            const fetch = imap.fetch(results, { bodies: '', struct: true });
            fetch.on('message', (msg, seqno) => {
              console.log(`Processing email #${seqno} for config: ${config.id}`);
              let fromAddress = "";
              let subject = "";
              let dateReceived = new Date();

              msg.on('body', (stream) => {
                let buffer = '';
                stream.on('data', (chunk) => buffer += chunk.toString());
                stream.on('end', () => {
                  fromAddress = buffer.match(/From: (.*)/i)?.[1] || "Unknown";
                  subject = buffer.match(/Subject: (.*)/i)?.[1] || "No Subject";
                  dateReceived = new Date(buffer.match(/Date: (.*)/i)?.[1] || new Date());
                  console.log(`Email details - From: ${fromAddress}, Subject: ${subject}`);
                });
              });

              msg.on('attributes', (attrs) => {
                const attachments = getAttachments(attrs.struct);
                console.log(`Email #${seqno} has ${attachments.length} attachment(s)`);
                attachments.forEach(att => {
                  const fileName = att.disposition.params.filename;
                  if (!fileName.endsWith('.pdf')) return;

                  console.log(`Processing PDF attachment: ${fileName} from email #${seqno}`);
                  const filePath = path.join(PDF_DIR, fileName);

                  // Disable automatic decoding by setting decode: false
                  const fetchAttachment = imap.fetch(attrs.uid, {
                    bodies: [att.partID],
                    markSeen: true,
                    decode: false
                  });
                  fetchAttachment.on('message', (attachmentMsg) => {
                    attachmentMsg.on('body', (stream) => {
                      let data = '';
                      stream.on('data', (chunk) => {
                        data += chunk.toString('utf8'); // accumulate as base64 string
                      });
                      stream.on('end', async () => {
                        // Manually decode the accumulated base64 string into a Buffer
                        const buffer = Buffer.from(data, 'base64');
                        fs.writeFile(filePath, buffer, async (err) => {
                          if (err) {
                            console.error(`Error writing file ${fileName}:`, err);
                          } else {
                            console.log(`Finished writing file: ${fileName}`);
                            try {
                              await prisma.pdfMetadata.create({
                                data: {
                                  emailConfigId: config.id,
                                  fromAddress,
                                  dateReceived,
                                  subject,
                                  attachmentFileName: fileName,
                                  filePath,
                                },
                              });
                              console.log(`Saved PDF metadata for attachment: ${fileName}`);
                            } catch (dbErr) {
                              console.error(`Error saving PDF metadata for ${fileName}:`, dbErr);
                            }
                          }
                        });
                      });
                    });
                  });
                });
              });
            });
            fetch.once('end', () => {
              console.log(`Finished processing emails for config: ${config.id}`);
              imap.end();
            });
          });
        });
      });

      imap.once('error', (err) =>
        console.error(`IMAP Error for config: ${config.id}`, err)
      );
      imap.connect();
    }

    return NextResponse.json({ message: "Emails checked successfully" });
  } catch (error) {
    console.error("Error checking emails:", error);
    return NextResponse.json({ error: "Failed to check emails" }, { status: 500 });
  }
}
