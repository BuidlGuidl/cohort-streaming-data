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
