"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { type CsvTransaction, useCsvStore } from "~~/services/store/csvStore";
import { useDateStore } from "~~/services/store/dateStore";

interface CsvUploadProps {
  className?: string;
  onUploadSuccess?: () => void;
}

export const CsvUpload = ({ className = "", onUploadSuccess }: CsvUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { csvData, fileName, uploadedAt, setCsvData, clearCsvData, getInternalCohortStreams } = useCsvStore();
  const { startDate, endDate } = useDateStore();

  const processFile = useCallback(
    (file: File) => {
      // Validate file type
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setUploadError("Please upload a CSV file");
        return;
      }

      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
          try {
            if (results.errors.length > 0) {
              throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(", ")}`);
            }

            const data = results.data as any[];

            // Validate that we have data
            if (data.length === 0) {
              throw new Error("CSV file appears to be empty");
            }

            const headers = Object.keys(data[0] || {});

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
            const processedData: CsvTransaction[] = data.map((row: any) => ({
              ethOut: parseFloat(row[ethOutColumn!]) || 0,
              fiatOut: parseFloat(row[fiatOutColumn!]) || 0,
              to: row[toColumn!] || "",
              from: row[fromColumn!] || "",
              account: row[accountColumn!] || "",
              ...row, // Keep any additional fields
            }));

            setCsvData(processedData, file.name);
            setUploadSuccess(`Successfully uploaded ${processedData.length} transactions from ${file.name}`);

            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }

            // Call onUploadSuccess callback if provided
            if (onUploadSuccess) {
              setTimeout(() => {
                onUploadSuccess();
              }, 1500); // Give time to show success message
            }
          } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Failed to process CSV file");
          } finally {
            setIsUploading(false);
          }
        },
        error: error => {
          setUploadError(`Failed to parse CSV: ${error.message}`);
          setIsUploading(false);
        },
      });
    },
    [setCsvData, onUploadSuccess],
  );

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

  const handleClearData = () => {
    clearCsvData();
    setUploadSuccess(null);
    setUploadError(null);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const internalCohortData = getInternalCohortStreams(startDate, endDate);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">📁 Upload CSV File</h2>
          <p className="text-sm opacity-70">Upload your accounting software CSV file with transaction data</p>

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
                    <div className="font-semibold">Processing CSV file...</div>
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

      {/* Current Data Status */}
      {csvData.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">📊 Current Data Status</h3>

            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">File Name</div>
                <div className="stat-value text-sm">{fileName}</div>
                <div className="stat-desc">
                  Uploaded: {uploadedAt ? new Date(uploadedAt).toLocaleString() : "Unknown"}
                </div>
              </div>

              <div className="stat">
                <div className="stat-title">Total Transactions</div>
                <div className="stat-value text-primary">{csvData.length}</div>
              </div>

              <div className="stat">
                <div className="stat-title">Internal Cohort Streams</div>
                <div className="stat-value text-secondary">{internalCohortData.length}</div>
                <div className="stat-desc">Filtered for builder analysis</div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="btn btn-error btn-sm" onClick={handleClearData}>
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {internalCohortData.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">👀 Preview: Internal Cohort Streams</h3>
            <p className="text-sm opacity-70">Showing first 5 transactions that will be used for builder analysis</p>

            <div className="overflow-x-auto">
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th>Token Amount Out</th>
                    <th>Fiat Value Out</th>
                    <th>To Wallet</th>
                    <th>From Wallet</th>
                    <th>Account</th>
                  </tr>
                </thead>
                <tbody>
                  {internalCohortData.slice(0, 5).map((transaction, index) => (
                    <tr key={index}>
                      <td className="font-mono">{transaction.ethOut.toFixed(4)}</td>
                      <td className="font-mono">${transaction.fiatOut.toFixed(2)}</td>
                      <td className="font-mono text-xs">{transaction.to}</td>
                      <td className="font-mono text-xs">{transaction.from}</td>
                      <td className="text-xs">{transaction.account}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {internalCohortData.length > 5 && (
              <div className="text-center text-sm opacity-70 mt-2">
                ... and {internalCohortData.length - 5} more transactions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
