"use client";

import { useSharedCsvData } from "~~/hooks/useSharedCsvData";

// Utility function to format ETH amounts (remove leading zero for amounts < 1)
const formatEthAmount = (amount: number): string => {
  const formatted = amount.toFixed(2);
  return formatted.startsWith("0.") ? formatted.substring(1) : formatted;
};

// Utility function to format FIAT amounts with commas
const formatFiatAmount = (amount: number): string => {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface SharedCsvDisplayProps {
  className?: string;
}

export const SharedCsvDisplay = ({ className = "" }: SharedCsvDisplayProps) => {
  const { data, loading, error, refetch, hasData, transactionCount, fileName, uploadedAt } = useSharedCsvData();

  // Filter data based on date range if available
  const filteredData = data?.data || [];
  const internalCohortData = filteredData; // You can add date filtering logic here if needed

  if (loading) {
    return (
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          <h2 className="card-title">📊 Shared CSV Data</h2>
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-2">Loading shared data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          <h2 className="card-title">📊 Shared CSV Data</h2>
          <div className="alert alert-warning">
            <span>{error}</span>
            <button className="btn btn-sm btn-outline ml-2" onClick={refetch}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          <h2 className="card-title">📊 Shared CSV Data</h2>
          <div className="alert alert-info">
            <span>No shared CSV data is currently available. An admin needs to upload data first.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Data Status */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <h2 className="card-title">📊 Shared CSV Data</h2>
            <button className="btn btn-sm btn-outline" onClick={refetch}>
              Refresh
            </button>
          </div>

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
              <div className="stat-value text-primary">{transactionCount}</div>
            </div>

            <div className="stat">
              <div className="stat-title">Internal Cohort Streams</div>
              <div className="stat-value text-secondary">{internalCohortData.length}</div>
              <div className="stat-desc">Available for analysis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {internalCohortData.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">👀 Preview: Shared Transaction Data</h3>
            <p className="text-sm opacity-70">Showing first 10 transactions from shared data</p>

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
                  {internalCohortData.slice(0, 10).map((transaction, index) => (
                    <tr key={index}>
                      <td className="font-mono">{formatEthAmount(transaction.ethOut)}</td>
                      <td className="font-mono">${formatFiatAmount(transaction.fiatOut)}</td>
                      <td className="font-mono text-xs">{transaction.to}</td>
                      <td className="font-mono text-xs">{transaction.from}</td>
                      <td className="text-xs">{transaction.account}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {internalCohortData.length > 10 && (
              <div className="text-center text-sm opacity-70 mt-2">
                ... and {internalCohortData.length - 10} more transactions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
