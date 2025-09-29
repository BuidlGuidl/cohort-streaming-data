import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET() {
  try {
    // List all blobs to find the shared CSV data
    const { blobs } = await list({ token: process.env.VERCEL_BLOB_TOKEN });

    // Find the shared-csv-data.json blob
    const sharedDataBlob = blobs.find(blob => blob.pathname === "shared-csv-data.json");

    if (!sharedDataBlob) {
      return NextResponse.json({
        exists: false,
        message: "No shared data found",
      });
    }

    // Fetch the blob data
    const response = await fetch(sharedDataBlob.url);

    if (!response.ok) {
      return NextResponse.json({
        exists: false,
        message: "No shared data found",
      });
    }

    const data = await response.json();

    return NextResponse.json({
      exists: true,
      fileName: data.fileName,
      transactionCount: data.metadata?.transactionCount || data.data?.length || 0,
      uploadedAt: data.uploadedAt,
      metadata: data.metadata,
    });
  } catch (error) {
    console.error("Error checking shared data:", error);
    return NextResponse.json({
      exists: false,
      message: "Failed to check shared data",
    });
  }
}
