import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Imap from 'imap';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const PDF_DIR = "./pdfs/";

if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }

// Helper function to recursively extract attachments from the IMAP message structure
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
        tlsOptions: { rejectUnauthorized: false } // For self-signed certs; remove in production.
      });

      imap.once('ready', () => {
        console.log(`IMAP connection ready for config: ${config.id}`);
        imap.openBox('INBOX', false, async (err, box) => {
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
                stream.on('data', chunk => (buffer += chunk.toString()));
                stream.on('end', () => {
                  fromAddress = buffer.match(/From: (.*)/i)?.[1] || "Unknown";
                  subject = buffer.match(/Subject: (.*)/i)?.[1] || "No Subject";
                  dateReceived = new Date(buffer.match(/Date: (.*)/i)?.[1] || new Date());
                  console.log(`Email details - From: ${fromAddress}, Subject: ${subject}`);
                });
              });

              msg.on('attributes', async (attrs) => {
                // Use recursive helper to find attachments
                const attachments = getAttachments(attrs.struct);
                console.log(`Email #${seqno} has ${attachments.length} attachment(s)`);
                
                for (const att of attachments) {
                  const fileName = att.disposition.params.filename;
                  if (!fileName.endsWith('.pdf')) continue;

                  console.log(`Processing PDF attachment: ${fileName} from email #${seqno}`);
                  const filePath = path.join(PDF_DIR, fileName);
                  const fetchAttachment = imap.fetch(attrs.uid, { bodies: [att.partID], struct: true });

                  fetchAttachment.on('message', (attachmentMsg) => {
                    attachmentMsg.on('body', (stream) => {
                      stream.pipe(fs.createWriteStream(filePath));
                      console.log(`Downloading and saving attachment: ${fileName} to ${filePath}`);
                    });

                    attachmentMsg.once('end', async () => {
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
                    });
                  });
                }
              });
            });
            fetch.once('end', () => {
              console.log(`Finished processing emails for config: ${config.id}`);
              imap.end();
            });
          });
        });
      });

      imap.once('error', err => console.error(`IMAP Error for config: ${config.id}`, err));
      imap.connect();
    }

    return NextResponse.json({ message: "Emails checked successfully" });
  } catch (error) {
    console.error("Error checking emails:", error);
    return NextResponse.json({ error: "Failed to check emails" }, { status: 500 });
  }
}
