// /app/api/email-ingestion/config/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const configs = await prisma.emailIngestionConfig.findMany();
    return NextResponse.json({ configs });
  } catch (err) {
    console.error("Error fetching configs:", err);
    return NextResponse.json({ error: "Failed to fetch configurations" }, { status: 500 });
  }
}

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: "Payload must be an object" }, { status: 400 });
  }

  try {
    const newConfig = await prisma.emailIngestionConfig.create({
      data: {
        email: data.emailAddress,  // Use the correct field name from your UI
        connectionType: data.connectionType,
        username: data.username,
        password: data.password,
        host: data.host,
      },
    });
    return NextResponse.json(newConfig);
  } catch (err) {
    console.error("Error saving email config:", err);
    return NextResponse.json({ error: "Failed to save email configuration" }, { status: 500 });
  }
}
