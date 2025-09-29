import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Try to fetch the shared data from Vercel Blobs
    const response = await fetch(
      `${
        process.env.VERCEL_BLOB_READ_WRITE_TOKEN
          ? `https://blob.vercel-storage.com/shared-csv-data.json`
          : `https://public.blob.vercel-storage.com/shared-csv-data.json`
      }`,
    );

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
