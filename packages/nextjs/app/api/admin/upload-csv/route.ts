import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const { data, fileName, uploadedAt } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Create a JSON blob with the CSV data
    const jsonData = {
      data,
      fileName,
      uploadedAt,
      metadata: {
        transactionCount: data.length,
        uploadedBy: "admin",
        version: "1.0",
      },
    };

    // Upload to Vercel Blobs
    const blob = await put(`shared-csv-data.json`, JSON.stringify(jsonData, null, 2), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      token: process.env.VERCEL_BLOB_TOKEN,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      transactionCount: data.length,
      fileName,
      blobUrl: blob.url, // Store the actual blob URL
    });
  } catch (error) {
    console.error("Error uploading CSV to Vercel Blobs:", error);
    return NextResponse.json({ error: "Failed to upload CSV data" }, { status: 500 });
  }
}
