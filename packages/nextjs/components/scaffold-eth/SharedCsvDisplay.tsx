"use client";

import { useSharedCsvData } from "~~/hooks/useSharedCsvData";

// Utility function to get relative time (e.g., "2 hours ago", "3 days ago")
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

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
}

export const SharedCsvDisplay = ({ className = "" }: SharedCsvDisplayProps) => {
  const { loading, error, refetch, hasData, transactionCount, fileName, uploadedAt } = useSharedCsvData();

  if (loading) {
    return (
      <div className={`${className}`}>
        {/* Compact Status Bar - Same height as normal state */}
        <div className="bg-base-100 border border-base-300 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span className="font-medium">Shared Data:</span>
              <span className="loading loading-spinner loading-xs"></span>
              <span className="text-sm opacity-70">Loading...</span>
            </div>
            <button className="btn btn-xs btn-outline" onClick={refetch} disabled>
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {/* Compact Status Bar - Same height as normal state */}
        <div className="bg-base-100 border border-base-300 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span className="font-medium">Shared Data:</span>
              <span className="text-sm text-error">Error: {error}</span>
            </div>
            <button className="btn btn-xs btn-outline" onClick={refetch}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={`${className}`}>
        {/* Compact Status Bar - Same height as normal state */}
        <div className="bg-base-100 border border-base-300 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span className="font-medium">Shared Data:</span>
              <span className="text-sm opacity-70">No data available</span>
            </div>
            <button className="btn btn-xs btn-outline" onClick={refetch}>
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Compact Status Bar */}
      <div className="bg-base-100 border border-base-300 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📊</span>
            <span className="font-medium">Shared Data:</span>
            <span className="text-sm opacity-70">{fileName}</span>
            <span className="text-primary font-semibold">({transactionCount} transactions)</span>
            <span className="text-xs opacity-50">•</span>
            <span className="text-xs opacity-70">
              {uploadedAt ? `Uploaded ${getRelativeTime(new Date(uploadedAt))}` : "Unknown"}
            </span>
          </div>
          <button className="btn btn-xs btn-outline" onClick={refetch}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
