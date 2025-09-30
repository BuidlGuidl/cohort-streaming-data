"use client";

import { useMemo, useState } from "react";
import { useSharedCsvData } from "~~/hooks/useSharedCsvData";
import { useCsvStore } from "~~/services/store/csvStore";
import { useDateStore } from "~~/services/store/dateStore";

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
  withdrawalCount: number;
  withdrawals: Array<{
    ethAmount: number;
    fiatAmount: number;
    [key: string]: any;
  }>;
}

export const AccountingBuilderStats = ({ className = "" }: AccountingBuilderStatsProps) => {
  const { getInternalCohortStreams } = useCsvStore();
  const { startDate, endDate } = useDateStore();
  const { data: sharedData } = useSharedCsvData();

  // Get local data first, then fall back to shared data
  const localInternalCohortData = getInternalCohortStreams(startDate, endDate);
  const sharedInternalCohortData =
    sharedData?.data?.filter(transaction => transaction.account?.toLowerCase().includes("internal cohort streams")) ||
    [];

  // Use local data if available, otherwise use shared data
  const internalCohortData = localInternalCohortData.length > 0 ? localInternalCohortData : sharedInternalCohortData;

  // Process CSV data into builder stats
  const builderStats = useMemo(() => {
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
      const displayName = parseEnsFromHyperlink(toField);

      if (!builderMap.has(builderAddress)) {
        // Clean up display name - if it's not a valid ENS or clean name, fall back to address
        let cleanDisplayName = displayName;
        if (
          !cleanDisplayName ||
          cleanDisplayName.includes("=HYPERLINK") ||
          cleanDisplayName.includes("https://") ||
          cleanDisplayName.length > 50
        ) {
          cleanDisplayName = builderAddress.slice(0, 6) + "..." + builderAddress.slice(-4);
        }

        builderMap.set(builderAddress, {
          address: builderAddress,
          displayName: cleanDisplayName,
          totalEthAmount: 0,
          totalFiatAmount: 0,
          withdrawalCount: 0,
          withdrawals: [],
        });
      }

      const builder = builderMap.get(builderAddress)!;
      builder.totalEthAmount += transaction.ethOut;
      builder.totalFiatAmount += transaction.fiatOut;
      builder.withdrawalCount += 1;
      builder.withdrawals.push({
        ethAmount: transaction.ethOut,
        fiatAmount: transaction.fiatOut,
        ...transaction,
      });
    });

    // Sort by total ETH amount (descending) and sort each builder's withdrawals by date (newest first)
    const result = Array.from(builderMap.values()).sort((a, b) => b.totalEthAmount - a.totalEthAmount);

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

  // Calculate summary stats
  const totalEthAmount = builderStats.reduce((sum, builder) => sum + builder.totalEthAmount, 0);
  const totalFiatAmount = builderStats.reduce((sum, builder) => sum + builder.totalFiatAmount, 0);

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
                <span className="badge badge-success badge-lg">Total FIAT: ${formatFiatAmount(totalFiatAmount)}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Builder</th>
                  <th className="text-center">Total ETH</th>
                  <th className="text-center">Total FIAT</th>
                  <th className="text-center">Withdrawals</th>
                </tr>
              </thead>
              <tbody>
                {builderStats.map((builder, index) => (
                  <AccountingBuilderRow key={builder.address} builder={builder} rank={index + 1} />
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
        <td className="text-center">
          <div className="font-mono font-bold text-lg">${formatFiatAmount(builder.totalFiatAmount)}</div>
        </td>
        <td className="text-center">
          <span className="badge badge-primary">{builder.withdrawalCount}</span>
        </td>
      </tr>

      {showDetails && (
        <tr>
          <td colSpan={4}>
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
