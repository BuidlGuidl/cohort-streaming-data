"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { type CsvTransaction, useCsvStore } from "~~/services/store/csvStore";

interface CsvUploadProps {
  className?: string;
}

export const CsvUpload = ({ className = "" }: CsvUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { csvData, fileName, uploadedAt, setCsvData, clearCsvData, getInternalCohortStreams } = useCsvStore();

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

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

            // Validate required columns
            const requiredColumns = ["ETH Out", "FIAT Out", "To", "From", "Account"];
            const headers = Object.keys(data[0] || {});
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));

            if (missingColumns.length > 0) {
              throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
            }

            // Process and normalize data
            const processedData: CsvTransaction[] = data.map((row: any) => ({
              ethOut: parseFloat(row["ETH Out"]) || 0,
              fiatOut: parseFloat(row["FIAT Out"]) || 0,
              to: row["To"] || "",
              from: row["From"] || "",
              account: row["Account"] || "",
              ...row, // Keep any additional fields
            }));

            setCsvData(processedData, file.name);
            setUploadSuccess(`Successfully uploaded ${processedData.length} transactions from ${file.name}`);

            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
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
    [setCsvData],
  );

  const handleClearData = () => {
    clearCsvData();
    setUploadSuccess(null);
    setUploadError(null);
  };

  const internalCohortData = getInternalCohortStreams();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">📁 Upload CSV File</h2>
          <p className="text-sm opacity-70">Upload your accounting software CSV file with transaction data</p>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Select CSV File</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="file-input file-input-bordered w-full"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <div className="flex items-center gap-2 mt-4">
              <span className="loading loading-spinner loading-sm"></span>
              <span>Processing CSV file...</span>
            </div>
          )}

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
                    <th>ETH Out</th>
                    <th>FIAT Out</th>
                    <th>To</th>
                    <th>From</th>
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
