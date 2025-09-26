"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { AccountingBuilderStats, CsvUpload } from "~~/components/scaffold-eth/AccountingData";
import { useCsvStore } from "~~/services/store/csvStore";

const AccountingData: NextPage = () => {
  const { csvData, fileName, uploadedAt, clearCsvData } = useCsvStore();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const hasData = csvData.length > 0;

  const handleUploadNewCsv = () => {
    setShowUploadModal(true);
  };

  const handleClearData = () => {
    clearCsvData();
    setShowUploadModal(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="lg:text-left">
            <h1 className="text-4xl font-bold mb-2">🧮 Accounting Data</h1>
            <p className="text-lg opacity-80 max-w-2xl">
              {hasData
                ? "View builder statistics from your uploaded CSV data. Compare with Ponder data for accuracy verification."
                : "Upload CSV data from your accounting software and view builder statistics. Compare with Ponder data for accuracy verification."}
            </p>
          </div>

          {hasData && (
            <div className="flex flex-col gap-3 lg:flex-shrink-0">
              {/* Current File Info */}
              <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-success">📊 Current CSV File</div>
                    <div className="text-sm font-medium">{fileName}</div>
                    <div className="text-xs opacity-70">
                      {uploadedAt ? new Date(uploadedAt).toLocaleString() : "Unknown upload time"} • {csvData.length}{" "}
                      transactions
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button className="btn btn-primary btn-outline" onClick={handleUploadNewCsv}>
                  <span className="mr-2">📁</span>
                  Upload New CSV
                </button>
                <button className="btn btn-error btn-outline btn-sm" onClick={handleClearData}>
                  <span className="mr-1">🗑️</span>
                  Clear Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conditional Content */}
      {!hasData ? (
        <>
          {/* CSV Upload Section */}
          <CsvUpload className="w-full" />

          {/* CSV Format Requirements */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">📋 CSV Format Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-sm opacity-80">
                <li>
                  Required columns: Token Amount Out, Fiat Value Out, To Wallet, From Wallet, Account (or similar names)
                </li>
                <li>Rows containing &quot;Internal Cohort Streams&quot; in the Account column will be processed</li>
                <li>Data should include withdrawal transactions from cohort streams</li>
                <li>The system will automatically detect column names that contain relevant keywords</li>
              </ul>
            </div>
          </div>

          {/* Info */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">ℹ️ About Accounting Data</h2>
              <div className="space-y-2">
                <div className="text-sm opacity-70">
                  This interface allows you to upload CSV data from your accounting software to compare with Ponder
                  blockchain data. The CSV data persists while you navigate between Ponder Data and Accounting Data tabs
                  for easy comparison.
                </div>
                <div className="text-sm opacity-70">
                  Only transactions marked as &quot;Internal Cohort Streams&quot; will be displayed in the builder
                  statistics.
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Builder Stats Section - Now has more space */}
          <AccountingBuilderStats className="w-full" />
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <>
          <div className="modal modal-open">
            <div className="modal-box max-w-4xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">📁 Upload New CSV File</h3>
                <button className="btn btn-ghost btn-circle" onClick={() => setShowUploadModal(false)}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <CsvUpload className="w-full" onUploadSuccess={() => setShowUploadModal(false)} />

              <div className="modal-action">
                <button className="btn" onClick={() => setShowUploadModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowUploadModal(false)}></div>
        </>
      )}
    </div>
  );
};

export default AccountingData;
