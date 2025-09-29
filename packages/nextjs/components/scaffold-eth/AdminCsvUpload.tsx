"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { type CsvTransaction } from "~~/services/store/csvStore";

interface AdminCsvUploadProps {
  className?: string;
}

export const AdminCsvUpload = ({ className = "" }: AdminCsvUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please upload a CSV file");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Parse CSV file
      const csvData = await new Promise<any[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: results => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(", ")}`));
              return;
            }
            resolve(results.data as any[]);
          },
          error: error => {
            reject(new Error(`Failed to parse CSV: ${error.message}`));
          },
        });
      });

      // Validate that we have data
      if (csvData.length === 0) {
        throw new Error("CSV file appears to be empty");
      }

      const headers = Object.keys(csvData[0] || {});

      // Find the relevant columns using flexible matching
      const ethOutColumn = headers.find(
        h =>
          h.toLowerCase().includes("token amount out") ||
          h.toLowerCase().includes("amount out") ||
          h.toLowerCase().includes("eth out"),
      );

      const fiatOutColumn = headers.find(
        h =>
          h.toLowerCase().includes("fiat value out") ||
          h.toLowerCase().includes("fiat out") ||
          h.toLowerCase().includes("usd out"),
      );

      const toColumn = headers.find(
        h =>
          h.toLowerCase().includes("to wallet") ||
          h.toLowerCase().includes("to") ||
          h.toLowerCase().includes("recipient"),
      );

      const fromColumn = headers.find(
        h =>
          h.toLowerCase().includes("from wallet") ||
          h.toLowerCase().includes("from") ||
          h.toLowerCase().includes("sender"),
      );

      const accountColumn = headers.find(
        h => h.toLowerCase().includes("account") || h.toLowerCase().includes("category"),
      );

      // Validate that we found the essential columns
      const missingColumns = [];
      if (!ethOutColumn) missingColumns.push("Token Amount Out / ETH Out");
      if (!fiatOutColumn) missingColumns.push("Fiat Value Out / FIAT Out");
      if (!toColumn) missingColumns.push("To Wallet / To");
      if (!fromColumn) missingColumns.push("From Wallet / From");
      if (!accountColumn) missingColumns.push("Account");

      if (missingColumns.length > 0) {
        throw new Error(
          `Could not find columns for: ${missingColumns.join(", ")}. Available columns: ${headers.join(", ")}`,
        );
      }

      // Process and normalize data
      const processedData: CsvTransaction[] = csvData.map((row: any) => ({
        ethOut: parseFloat(row[ethOutColumn!]) || 0,
        fiatOut: parseFloat(row[fiatOutColumn!]) || 0,
        to: row[toColumn!] || "",
        from: row[fromColumn!] || "",
        account: row[accountColumn!] || "",
        ...row, // Keep any additional fields
      }));

      // Upload to Vercel Blobs
      const response = await fetch("/api/admin/upload-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: processedData,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload CSV to Vercel Blobs");
      }

      const result = await response.json();
      setUploadSuccess(
        `Successfully uploaded ${processedData.length} transactions to shared storage. Blob URL: ${result.url}`,
      );

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to process CSV file");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile],
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const csvFile = files.find(file => file.name.toLowerCase().endsWith(".csv"));

      if (!csvFile) {
        setUploadError("Please drop a CSV file");
        return;
      }

      if (files.length > 1) {
        setUploadError("Please drop only one CSV file at a time");
        return;
      }

      processFile(csvFile);
    },
    [processFile],
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">📁 Upload CSV to Shared Storage</h2>
          <p className="text-sm opacity-70">
            Upload your CSV file to Vercel Blobs. This will be available to all users visiting the site.
          </p>

          {/* Drag and Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
              ${isDragOver ? "border-primary bg-primary/5 scale-105" : "border-gray-300 hover:border-primary"}
              ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!isUploading ? handleBrowseClick : undefined}
          >
            <div className="space-y-4">
              <div className="text-6xl">{isDragOver ? "⬇️" : isUploading ? "⏳" : "📄"}</div>
              <div>
                {isUploading ? (
                  <div className="space-y-2">
                    <div className="font-semibold">Uploading to Vercel Blobs...</div>
                    <div className="flex justify-center">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  </div>
                ) : isDragOver ? (
                  <div className="font-semibold text-primary">Drop your CSV file here!</div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-semibold">Drag & drop your CSV file here</div>
                    <div className="text-sm opacity-70">or click to browse</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />

          {/* Alternative File Input (for accessibility) */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Or select CSV file manually</span>
            </label>
            <input
              type="file"
              accept=".csv"
              className="file-input file-input-bordered w-full"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>

          {uploadError && (
            <div className="alert alert-error mt-4">
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="alert alert-success mt-4">
              <span>{uploadSuccess}</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Shared Data Status */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">📊 Shared Data Status</h3>
          <p className="text-sm opacity-70">Check the current status of shared CSV data available to all users.</p>

          <div className="mt-4">
            <button
              className="btn btn-outline btn-sm"
              onClick={async () => {
                try {
                  const response = await fetch("/api/admin/check-shared-data");
                  const data = await response.json();
                  if (data.exists) {
                    setUploadSuccess(`Shared data exists: ${data.fileName} (${data.transactionCount} transactions)`);
                  } else {
                    setUploadError("No shared data found");
                  }
                } catch {
                  setUploadError("Failed to check shared data status");
                }
              }}
            >
              Check Shared Data Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
