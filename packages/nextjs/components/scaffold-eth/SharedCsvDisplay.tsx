"use client";

import { useSharedCsvData } from "~~/hooks/useSharedCsvData";
import { useCsvStore } from "~~/services/store/csvStore";

// Utility function to get relative time (e.g., "2 hours ago", "3 days ago")
const getRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }
};

interface SharedCsvDisplayProps {
  className?: string;
  onUploadLocalCsv?: () => void;
  onClearLocalData?: () => void;
}

export const SharedCsvDisplay = ({ className = "", onUploadLocalCsv, onClearLocalData }: SharedCsvDisplayProps) => {
  const { loading, error, refetch, hasData, transactionCount, fileName, uploadedAt } = useSharedCsvData();
  const { csvData, fileName: localFileName, uploadedAt: localUploadedAt } = useCsvStore();

  const hasLocalData = csvData.length > 0;

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="bg-base-100 border border-base-300 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span className="font-medium">Data Source:</span>
              <span className="loading loading-spinner loading-xs"></span>
              <span className="text-sm opacity-70">Loading shared data...</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-xs btn-outline" onClick={refetch} disabled>
                Refresh
              </button>
              {onUploadLocalCsv && (
                <button className="btn btn-xs btn-success" onClick={onUploadLocalCsv}>
                  📁 Upload Local CSV
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have local data, show that as the primary data source regardless of shared data status
  if (hasLocalData) {
    return (
      <div className={`${className}`}>
        <div className="bg-base-100 border border-base-300 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Active Local Data */}
              <div className="flex items-center space-x-2">
                <span className="text-lg">💾</span>
                <span className="font-medium">Data Source:</span>
                <span className="text-sm opacity-70">Local CSV: {localFileName}</span>
                <span className="text-success font-semibold">({csvData.length} transactions)</span>
                <span className="text-xs opacity-50">•</span>
                <span className="text-xs opacity-70">
                  {localUploadedAt ? `Uploaded ${getRelativeTime(localUploadedAt)}` : "Unknown"}
                </span>
                <span className="badge badge-success badge-sm">ACTIVE</span>
              </div>

              {/* Shared Data Status (if available) */}
              {hasData && (
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📊</span>
                  <span className="font-medium">Shared:</span>
                  <span className="text-sm opacity-70">{fileName}</span>
                  <span className="text-primary font-semibold">({transactionCount} transactions)</span>
                  <span className="text-xs opacity-50">•</span>
                  <span className="text-xs opacity-70">
                    {uploadedAt ? `Uploaded ${getRelativeTime(new Date(uploadedAt))}` : "Unknown"}
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button className="btn btn-xs btn-outline" onClick={refetch}>
                Refresh Shared
              </button>
              {onUploadLocalCsv && (
                <button className="btn btn-xs btn-success" onClick={onUploadLocalCsv}>
                  📁 Upload New Local CSV
                </button>
              )}
              {onClearLocalData && (
                <button className="btn btn-xs btn-error btn-outline" onClick={onClearLocalData}>
                  🗑️ Clear Local Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-base-100 border border-base-300 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span className="font-medium">Data Source:</span>
              <span className="text-sm opacity-70">No shared CSV data available</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-xs btn-outline" onClick={refetch}>
                Refresh
              </button>
              {onUploadLocalCsv && (
                <button className="btn btn-xs btn-success" onClick={onUploadLocalCsv}>
                  📁 Upload Local CSV
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData && !hasLocalData) {
    return (
      <div className={`${className}`}>
        <div className="bg-base-100 border border-base-300 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span className="font-medium">Data Source:</span>
              <span className="text-sm opacity-70">No shared CSV data available</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-xs btn-outline" onClick={refetch}>
                Refresh
              </button>
              {onUploadLocalCsv && (
                <button className="btn btn-xs btn-success" onClick={onUploadLocalCsv}>
                  📁 Upload Local CSV
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only shared data available (no local data)
  return (
    <div className={`${className}`}>
      <div className="bg-base-100 border border-base-300 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Shared Data Status */}
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span className="font-medium">Data Source:</span>
              <span className="text-sm opacity-70">Shared: {fileName}</span>
              <span className="text-primary font-semibold">({transactionCount} transactions)</span>
              <span className="text-xs opacity-50">•</span>
              <span className="text-xs opacity-70">
                {uploadedAt ? `Uploaded ${getRelativeTime(new Date(uploadedAt))}` : "Unknown"}
              </span>
              <span className="badge badge-primary badge-sm">ACTIVE</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button className="btn btn-xs btn-outline" onClick={refetch}>
              Refresh
            </button>
            {onUploadLocalCsv && (
              <button className="btn btn-xs btn-success" onClick={onUploadLocalCsv}>
                📁 Upload Local CSV
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
