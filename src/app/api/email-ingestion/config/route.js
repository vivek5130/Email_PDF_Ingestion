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


// export async function PUT(request) {
//   const { searchParams } = new URL(request.url);
//   const id = searchParams.get("id");

//   if (!id) {
//     return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
//   }

//   let data;
//   try {
//     data = await request.json();
//   } catch (parseError) {
//     console.error("Error parsing request body:", parseError);
//     return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
//   }

//   try {
//     // Ensure the config exists before updating
//     const existingConfig = await prisma.emailIngestionConfig.findUnique({
//       where: { id },
//     });

//     if (!existingConfig) {
//       return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
//     }

//     const updatedConfig = await prisma.emailIngestionConfig.update({
//       where: { id }, // Keep ID as a string
//       data: {
//         email: data.emailAddress,
//         connectionType: data.connectionType,
//         username: data.username,
//         password: data.password,
//         host: data.host,
//       },
//     });

//     return NextResponse.json(updatedConfig);
//   } catch (err) {
//     console.error("Error updating email config:", err);
//     return NextResponse.json({ error: "Failed to update email configuration" }, { status: 500 });
//   }
// }

export async function PUT(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim(); // Ensure ID is formatted correctly

  if (!id) {
    return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
  }

  let data;
  try {
    data = await request.json();
    if (!data || typeof data !== "object") {
      throw new Error("Invalid payload");
    }
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  try {
    // Check if the configuration exists
    const existingConfig = await prisma.emailIngestionConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    const updatedConfig = await prisma.emailIngestionConfig.update({
      where: { id },
      data: {
        email: data.emailAddress,
        connectionType: data.connectionType,
        username: data.username,
        password: data.password,
        host: data.host,
      },
    });

    return NextResponse.json(updatedConfig);
  } catch (err) {
    console.error("Error updating email config:", err);
    return NextResponse.json({ error: "Failed to update email configuration" }, { status: 500 });
  }
}



export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim(); // Ensure ID is not null or undefined

    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    // Verify if the ID exists before deletion
    const existingConfig = await prisma.emailIngestionConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    // Delete the config
    await prisma.emailIngestionConfig.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Configuration deleted successfully" });

  } catch (err) {
    console.error("Error deleting email config:", err);
    
    // Prisma error handling
    if (err.code === 'P2025') {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete email configuration" }, { status: 500 });
  }
}
