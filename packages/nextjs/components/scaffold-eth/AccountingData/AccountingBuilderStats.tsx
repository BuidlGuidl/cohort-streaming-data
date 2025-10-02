"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSharedCsvData } from "~~/hooks/useSharedCsvData";
import { useCsvStore } from "~~/services/store/csvStore";
import { useDateStore } from "~~/services/store/dateStore";
import { ADDRESS_MAPPINGS, useLlamaPayStore } from "~~/services/store/llamapayStore";

type SortField = "name" | "eth" | "dai" | "fiat" | "withdrawals";
type SortDirection = "asc" | "desc";

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

// Utility function to format DAI amounts
const formatDaiAmount = (amount: number): string => {
  return Math.round(amount).toLocaleString("en-US");
};

// Utility function to parse ENS name from Excel hyperlink formula
// Example input: =hyperlink("https://optimistic.etherscan.io/address/0x45334f41aaa464528cd5bc0f582acadc49eb0cd1","oxrinat.eth streams")
// Expected output: "oxrinat.eth"
const parseEnsFromHyperlink = (hyperlinkString: string): string => {
  if (!hyperlinkString) return "";

  // Handle Excel hyperlink format: =HYPERLINK("url","display text")
  const hyperlinkMatch = hyperlinkString.match(/=HYPERLINK\(".*?","(.*)"\)/i);
  if (hyperlinkMatch && hyperlinkMatch[1]) {
    let displayText = hyperlinkMatch[1].trim();

    // Remove common suffixes like " streams", " cohort", etc.
    displayText = displayText.replace(/\s+(streams?|cohorts?|wallet)$/i, "");

    // If it looks like an ENS name (contains .eth), return it
    if (displayText.includes(".eth")) {
      return displayText;
    }

    // If it's not obviously an ENS name but is clean text and reasonable length, return it
    if (
      displayText &&
      !displayText.startsWith("0x") &&
      !displayText.includes("http") &&
      displayText.length < 30 &&
      displayText.length > 2
    ) {
      return displayText;
    }
  }

  // If no hyperlink format, check if it's already an ENS name
  if (hyperlinkString.includes(".eth") && !hyperlinkString.includes("=")) {
    return hyperlinkString.replace(/\s+(streams?|cohorts?|wallet)$/i, "").trim();
  }

  // If it's a plain address, don't try to parse it as ENS
  if (hyperlinkString.startsWith("0x") && hyperlinkString.length >= 10) {
    return ""; // Return empty so we fall back to address display
  }

  // If it contains hyperlink artifacts, return empty
  if (hyperlinkString.includes("=HYPERLINK") || hyperlinkString.includes("https://")) {
    return "";
  }

  // Last resort - return empty to fall back to address
  return "";
};

interface AccountingBuilderStatsProps {
  className?: string;
}

interface AccountingBuilderData {
  address: string;
  displayName: string;
  totalEthAmount: number;
  totalFiatAmount: number;
  llamapayDai?: number;
  withdrawalCount: number;
  withdrawals: Array<{
    ethAmount: number;
    fiatAmount: number;
    [key: string]: any;
  }>;
}

export const AccountingBuilderStats = ({ className = "" }: AccountingBuilderStatsProps) => {
  const csvData = useCsvStore(useShallow(state => state.csvData));
  const { startDate, endDate } = useDateStore();
  const { data: sharedData } = useSharedCsvData();
  const includeLlamaPay = useLlamaPayStore(state => state.includeLlamaPay);
  const calculateLlamaPayForBuilderRaw = useLlamaPayStore(state => state.calculateLlamaPayForBuilder);
  const getLlamaPayDataRaw = useLlamaPayStore(state => state.getLlamaPayData);

  // Wrap in useCallback to ensure stable references
  const calculateLlamaPayForBuilder = useCallback(
    (address: string, start: string, end: string) => {
      return calculateLlamaPayForBuilderRaw(address, start, end);
    },
    [calculateLlamaPayForBuilderRaw],
  );

  const getLlamaPayData = useCallback(() => {
    return getLlamaPayDataRaw();
  }, [getLlamaPayDataRaw]);
  const [sortField, setSortField] = useState<SortField>("eth");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Get local data by filtering csvData directly
  const localInternalCohortData = useMemo(() => {
    let filtered = csvData.filter(transaction => {
      const account = transaction.account || "";
      // Match "09-Internal Cohort Streams" or anything with "internal cohort" in it
      return account.toLowerCase().includes("internal cohort");
    });

    // Filter by date if provided
    if (startDate || endDate) {
      filtered = filtered.filter(transaction => {
        const dateStr = transaction["Date Time"] || transaction["date"] || transaction["Date"] || "";
        if (!dateStr) return true;

        const transactionDate = new Date(dateStr);
        if (isNaN(transactionDate.getTime())) return true;

        if (startDate) {
          const start = new Date(startDate);
          if (transactionDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (transactionDate > end) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [csvData, startDate, endDate]);

  // Filter shared data by date range and internal cohort streams
  const sharedInternalCohortData = useMemo(() => {
    if (!sharedData?.data) return [];

    return sharedData.data.filter(transaction => {
      // Filter for internal cohort streams
      if (!transaction.account?.toLowerCase().includes("internal cohort streams")) {
        return false;
      }

      // Apply date filtering if dates are provided
      if (startDate || endDate) {
        const dateField =
          transaction["Date Time"] || transaction["date"] || transaction["Date"] || transaction["timestamp"];
        if (!dateField) return true; // If no date field found, include the transaction

        // Parse the date (assuming ISO format like "2025-09-23T05:48:23.000-06:00")
        const transactionDate = new Date(dateField).toISOString().split("T")[0];

        if (startDate && transactionDate < startDate) return false;
        if (endDate && transactionDate > endDate) return false;
      }

      return true;
    });
  }, [sharedData?.data, startDate, endDate]);

  // Use local data if available, otherwise use shared data

  const internalCohortData = useMemo(() => {
    return localInternalCohortData.length > 0 ? localInternalCohortData : sharedInternalCohortData;
  }, [localInternalCohortData, sharedInternalCohortData]);

  // Process CSV data into builder stats (without LlamaPay to avoid re-render issues)
  const builderStatsWithoutLlamaPay = useMemo(() => {
    const builderMap = new Map<string, AccountingBuilderData>();

    internalCohortData.forEach(transaction => {
      // Parse the "To" field which might be a hyperlink formula
      const toField = transaction.to || "";

      // Extract Ethereum address from hyperlink if present
      let builderAddress = "";
      const addressMatch = toField.match(/0x[a-fA-F0-9]{40}/);
      if (addressMatch) {
        builderAddress = addressMatch[0].toLowerCase();
      } else if (toField.startsWith("0x")) {
        builderAddress = toField.toLowerCase();
      }

      if (!builderAddress) return;

      // Parse display name (ENS) from the hyperlink
      let displayName = parseEnsFromHyperlink(toField);

      // Apply address mappings to consolidate multiple addresses to one display name
      const mappedDisplayName = ADDRESS_MAPPINGS[builderAddress];
      if (mappedDisplayName) {
        displayName = mappedDisplayName;
      }

      // Use displayName as the key for consolidation (instead of address)
      // This ensures multiple addresses for same person are combined
      let consolidationKey = displayName;

      // Clean up display name - if it's not a valid ENS or clean name, use address as key
      if (
        !displayName ||
        displayName.includes("=HYPERLINK") ||
        displayName.includes("https://") ||
        displayName.length > 50
      ) {
        consolidationKey = builderAddress;
        displayName = builderAddress.slice(0, 6) + "..." + builderAddress.slice(-4);
      }

      if (!builderMap.has(consolidationKey)) {
        builderMap.set(consolidationKey, {
          address: builderAddress,
          displayName: displayName,
          totalEthAmount: 0,
          totalFiatAmount: 0,
          withdrawalCount: 0,
          withdrawals: [],
        });
      }

      const builder = builderMap.get(consolidationKey)!;

      builder.totalEthAmount += transaction.ethOut || 0;
      builder.totalFiatAmount += transaction.fiatOut || 0;
      builder.withdrawalCount += 1;
      builder.withdrawals.push({
        ethAmount: transaction.ethOut,
        fiatAmount: transaction.fiatOut,
        ...transaction,
      });
    });

    // Convert to array (LlamaPay data will be added separately)
    const result = Array.from(builderMap.values());

    // Sort each builder's withdrawals by date (newest first)
    result.forEach(builder => {
      builder.withdrawals.sort((a, b) => {
        const dateA = new Date(a["Date Time"] || a["date"] || a["Date"] || 0).getTime();
        const dateB = new Date(b["Date Time"] || b["date"] || b["Date"] || 0).getTime();
        return dateB - dateA; // Newest first
      });
    });

    return result;
  }, [internalCohortData]);

  // Add LlamaPay data separately to avoid re-render loop
  const builderStats = useMemo(() => {
    if (!includeLlamaPay) {
      return builderStatsWithoutLlamaPay;
    }

    // Create a copy and add LlamaPay data
    const statsWithLlamaPay = builderStatsWithoutLlamaPay.map(builder => {
      const llamapayDai = calculateLlamaPayForBuilder(builder.address, startDate, endDate);
      return {
        ...builder,
        llamapayDai,
      };
    });

    // Add builders who only have LlamaPay streams
    const llamapayStreams = getLlamaPayData();
    const processedDisplayNames = new Set(statsWithLlamaPay.map(b => b.displayName));

    llamapayStreams.forEach(stream => {
      const streamAddress = stream.address.toLowerCase();
      const llamapayDai = calculateLlamaPayForBuilder(streamAddress, startDate, endDate);

      if (llamapayDai > 0 && !processedDisplayNames.has(stream.displayName)) {
        statsWithLlamaPay.push({
          address: stream.address,
          displayName: stream.displayName,
          totalEthAmount: 0,
          totalFiatAmount: 0,
          llamapayDai: llamapayDai,
          withdrawalCount: 0,
          withdrawals: [],
        });
        processedDisplayNames.add(stream.displayName);
      }
    });

    // Sort by total ETH amount (descending), then by LlamaPay DAI if ETH amounts are equal
    return statsWithLlamaPay.sort((a, b) => {
      if (b.totalEthAmount !== a.totalEthAmount) {
        return b.totalEthAmount - a.totalEthAmount;
      }
      return (b.llamapayDai || 0) - (a.llamapayDai || 0);
    });
  }, [builderStatsWithoutLlamaPay, includeLlamaPay, calculateLlamaPayForBuilder, getLlamaPayData, startDate, endDate]);

  // Sort builder stats
  const sortedBuilderStats = useMemo(() => {
    const sorted = [...builderStats].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "name":
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
          break;
        case "eth":
          aValue = a.totalEthAmount;
          bValue = b.totalEthAmount;
          break;
        case "dai":
          aValue = a.llamapayDai || 0;
          bValue = b.llamapayDai || 0;
          break;
        case "fiat":
          aValue = a.totalFiatAmount + (includeLlamaPay ? a.llamapayDai || 0 : 0);
          bValue = b.totalFiatAmount + (includeLlamaPay ? b.llamapayDai || 0 : 0);
          break;
        case "withdrawals":
          aValue = a.withdrawalCount;
          bValue = b.withdrawalCount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [builderStats, sortField, sortDirection, includeLlamaPay]);

  // Calculate summary stats
  const totalEthAmount = sortedBuilderStats.reduce((sum, builder) => sum + builder.totalEthAmount, 0);
  const totalFiatAmount = sortedBuilderStats.reduce((sum, builder) => sum + builder.totalFiatAmount, 0);
  const totalLlamaPayDai = includeLlamaPay
    ? sortedBuilderStats.reduce((sum, builder) => sum + (builder.llamapayDai || 0), 0)
    : 0;
  const totalFiatWithLlamaPay = totalFiatAmount + totalLlamaPayDai; // 1 DAI = 1 USD

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (internalCohortData.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">👨‍💻 Accounting Builder Stats</h2>
            <p className="text-lg opacity-70">No CSV data uploaded yet</p>
            <p className="text-sm opacity-50">
              Upload a CSV file in the Upload CSV tab to see builder statistics from your accounting software
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Builder Stats Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="flex flex-col gap-4">
              <h3 className="card-title mb-0">Accounting Cohort Data</h3>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-primary badge-lg">Total ETH: {formatEthAmount(totalEthAmount)}</span>
                {includeLlamaPay && totalLlamaPayDai > 0 && (
                  <span className="badge badge-primary badge-lg">Total DAI: {formatDaiAmount(totalLlamaPayDai)}</span>
                )}
                <span className="badge badge-success badge-lg">
                  Total FIAT: ${formatFiatAmount(includeLlamaPay ? totalFiatWithLlamaPay : totalFiatAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="cursor-pointer hover:bg-base-200 select-none" onClick={() => handleSort("name")}>
                    Builder {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-center cursor-pointer hover:bg-base-200 select-none"
                    onClick={() => handleSort("eth")}
                  >
                    Total ETH {sortField === "eth" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  {includeLlamaPay && (
                    <th
                      className="text-center cursor-pointer hover:bg-base-200 select-none"
                      onClick={() => handleSort("dai")}
                    >
                      Total DAI {sortField === "dai" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  <th
                    className="text-center cursor-pointer hover:bg-base-200 select-none"
                    onClick={() => handleSort("fiat")}
                  >
                    Total FIAT {sortField === "fiat" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-center cursor-pointer hover:bg-base-200 select-none"
                    onClick={() => handleSort("withdrawals")}
                  >
                    Withdrawals {sortField === "withdrawals" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedBuilderStats.map((builder, index) => (
                  <AccountingBuilderRow key={builder.displayName} builder={builder} rank={index + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AccountingBuilderRowProps {
  builder: AccountingBuilderData;
  rank: number;
}

const AccountingBuilderRow = ({ builder }: AccountingBuilderRowProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { includeLlamaPay } = useLlamaPayStore();

  return (
    <>
      <tr
        className="cursor-pointer bg-base-200/50 hover:!bg-base-300 dark:hover:!bg-base-content/20 transition-colors border-b border-base-300"
        onClick={() => setShowDetails(!showDetails)}
      >
        <td>
          {builder.displayName === builder.address.slice(0, 6) + "..." + builder.address.slice(-4) ? (
            // No ENS name - show only the full shortened address
            <div className="font-semibold text-lg font-mono">{builder.displayName}</div>
          ) : (
            // Has ENS name - show ENS with address below
            <>
              <div className="font-semibold text-lg">{builder.displayName}</div>
              <div className="text-xs opacity-70 font-mono">
                {builder.address.slice(0, 6)}...{builder.address.slice(-4)}
              </div>
            </>
          )}
        </td>
        <td className="text-center">
          <div className="font-mono font-bold text-lg">{formatEthAmount(builder.totalEthAmount)} ETH</div>
        </td>
        {includeLlamaPay && (
          <td className="text-center">
            {builder.llamapayDai && builder.llamapayDai > 0 && (
              <div className="font-mono font-bold text-lg">{formatDaiAmount(builder.llamapayDai)}</div>
            )}
          </td>
        )}
        <td className="text-center">
          <div className="font-mono font-bold text-lg">
            ${formatFiatAmount(builder.totalFiatAmount + (includeLlamaPay ? builder.llamapayDai || 0 : 0))}
          </div>
        </td>
        <td className="text-center">
          <span className="badge badge-primary">{builder.withdrawalCount}</span>
        </td>
      </tr>

      {showDetails && (
        <tr>
          <td colSpan={includeLlamaPay ? 5 : 4}>
            <div className="bg-base-200 p-4 rounded-lg border-2 border-primary/20 my-2">
              <h4 className="font-semibold mb-3 flex items-center">
                <span className="mr-2">📋</span>
                Withdrawal History ({builder.withdrawalCount} withdrawals)
              </h4>
              <div className="max-h-64 overflow-y-auto pr-2">
                <div className="space-y-3">
                  {builder.withdrawals.map((withdrawal, idx) => {
                    // Parse clean names from hyperlink formulas
                    const fromName = parseEnsFromHyperlink(withdrawal.from || "") || "Unknown Source";
                    const toName = parseEnsFromHyperlink(withdrawal.to || "") || builder.displayName;
                    const dateField = withdrawal["Date Time"] || withdrawal["date"] || withdrawal["Date"];
                    const formattedDate = dateField ? new Date(dateField).toLocaleDateString() : "Unknown Date";
                    const account = withdrawal.account || "Unknown Account";

                    return (
                      <div key={idx} className="bg-base-100 p-3 rounded-lg border border-base-300 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="badge badge-success font-mono font-bold">
                            {formatEthAmount(withdrawal.ethAmount)} ETH
                          </span>
                          <span className="badge badge-info font-mono font-bold">
                            ${formatFiatAmount(withdrawal.fiatAmount)}
                          </span>
                          <span className="badge badge-ghost text-xs">{formattedDate}</span>
                        </div>
                        <div className="text-sm text-base-content/70">
                          <div className="mb-1">
                            <span className="font-medium">From:</span> {fromName}
                          </div>
                          <div className="mb-1">
                            <span className="font-medium">To:</span> {toName}
                          </div>
                          <div className="italic">
                            <span className="font-medium">Account:</span> {account}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
