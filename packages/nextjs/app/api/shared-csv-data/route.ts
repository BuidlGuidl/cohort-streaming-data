import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET() {
  try {
    // List all blobs to find the shared CSV data
    const { blobs } = await list({ token: process.env.VERCEL_BLOB_TOKEN });

    // Find the shared-csv-data.json blob
    const sharedDataBlob = blobs.find(blob => blob.pathname === "shared-csv-data.json");

    if (!sharedDataBlob) {
      return NextResponse.json({ error: "No shared CSV data available" }, { status: 404 });
    }

    // Fetch the blob data
    const response = await fetch(sharedDataBlob.url);

    if (!response.ok) {
      return NextResponse.json({ error: "No shared CSV data available" }, { status: 404 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      fileName: data.fileName,
      uploadedAt: data.uploadedAt,
      metadata: data.metadata,
    });
  } catch (error) {
    console.error("Error fetching shared CSV data:", error);
    return NextResponse.json({ error: "Failed to fetch shared CSV data" }, { status: 500 });
  }
}
