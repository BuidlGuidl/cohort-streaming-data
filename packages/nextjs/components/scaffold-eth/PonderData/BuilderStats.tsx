"use client";

import { useMemo, useState } from "react";
import {
  BuilderWithdrawStats,
  processBuilderWithdrawals,
  useCohortBuilders,
  useCohortInformation,
  useCohortWithdrawals,
} from "~~/hooks/ponder";
import { useDateStore } from "~~/services/store/dateStore";
import { useLlamaPayStore } from "~~/services/store/llamapayStore";

type SortField = "name" | "eth" | "dai" | "withdrawals";
type SortDirection = "asc" | "desc";

// Utility function to format ETH amounts (remove leading zero for amounts < 1)
const formatEthAmount = (amount: number): string => {
  const formatted = amount.toFixed(2);
  return formatted.startsWith("0.") ? formatted.substring(1) : formatted;
};

// Utility function to format DAI amounts
const formatDaiAmount = (amount: number): string => {
  return Math.round(amount).toLocaleString("en-US");
};

interface BuilderStatsProps {
  className?: string;
}

export const BuilderStats = ({ className = "" }: BuilderStatsProps) => {
  // Use shared date store
  const { startDate, endDate } = useDateStore();
  const { includeLlamaPay, calculateLlamaPayForBuilder } = useLlamaPayStore();
  const [sortField, setSortField] = useState<SortField>("eth");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Fetch data
  const { data: cohortInfo, isLoading: isLoadingCohorts } = useCohortInformation();
  const { data: buildersData, isLoading: isLoadingBuilders } = useCohortBuilders();
  const { data: withdrawalsData, isLoading: isLoadingWithdrawals, error } = useCohortWithdrawals(startDate, endDate);

  // Process data
  const { cohortNamesMap, builderStats } = useMemo(() => {
    // Create cohort names mapping
    const cohortNamesMap =
      cohortInfo?.cohortInformations.items.reduce(
        (acc, cohort) => {
          acc[cohort.address.toLowerCase()] = cohort.name;
          return acc;
        },
        {} as Record<string, string>,
      ) || {};

    // Create ENS names mapping
    const ensNamesMap =
      buildersData?.cohortBuilders.items.reduce(
        (acc, builder) => {
          if (builder.ens) {
            acc[builder.address.toLowerCase()] = builder.ens;
          }
          return acc;
        },
        {} as Record<string, string>,
      ) || {};

    // Process withdrawals
    const withdrawals = withdrawalsData?.cohortWithdrawals.items || [];
    const builderStats = processBuilderWithdrawals(withdrawals, cohortNamesMap, ensNamesMap);

    // Add LlamaPay data if enabled
    if (includeLlamaPay) {
      builderStats.forEach(builder => {
        const llamapayDai = calculateLlamaPayForBuilder(builder.address, startDate, endDate);
        (builder as any).llamapayDai = llamapayDai;
      });
    }

    return { cohortNamesMap, builderStats };
  }, [cohortInfo, buildersData, withdrawalsData, includeLlamaPay, calculateLlamaPayForBuilder, startDate, endDate]);

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
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case "dai":
          aValue = (a as any).llamapayDai || 0;
          bValue = (b as any).llamapayDai || 0;
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
  }, [builderStats, sortField, sortDirection]);

  const isLoading = isLoadingCohorts || isLoadingBuilders || isLoadingWithdrawals;

  // Calculate summary stats
  const totalAmount = sortedBuilderStats.reduce((sum, builder) => sum + builder.totalAmount, 0);
  const totalLlamaPayDai = includeLlamaPay
    ? sortedBuilderStats.reduce((sum, builder) => sum + ((builder as any).llamapayDai || 0), 0)
    : 0;

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <span>Error: {error instanceof Error ? error.message : "Failed to fetch data"}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Builder Stats Table */}
      {sortedBuilderStats.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col gap-4">
              <h3 className="card-title mb-0">Ponder Cohort Data</h3>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-primary badge-lg">Total ETH: {formatEthAmount(totalAmount)}</span>
                {includeLlamaPay && totalLlamaPayDai > 0 && (
                  <span className="badge badge-success badge-lg">Total DAI: {formatDaiAmount(totalLlamaPayDai)}</span>
                )}
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
                      onClick={() => handleSort("withdrawals")}
                    >
                      Withdrawals {sortField === "withdrawals" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBuilderStats.map((builder, index) => (
                    <BuilderRow
                      key={builder.address}
                      builder={builder}
                      rank={index + 1}
                      cohortNamesMap={cohortNamesMap}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {sortedBuilderStats.length === 0 && !isLoading && !error && (
        <div className="alert alert-info">
          <span>No withdrawals found for the selected date range</span>
        </div>
      )}
    </div>
  );
};

interface BuilderRowProps {
  builder: BuilderWithdrawStats;
  rank: number;
  cohortNamesMap: Record<string, string>;
}

const BuilderRow = ({ builder }: BuilderRowProps) => {
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
          <div className="font-mono font-bold text-lg">{formatEthAmount(builder.totalAmount)}</div>
        </td>
        {includeLlamaPay && (
          <td className="text-center">
            {(builder as any).llamapayDai > 0 && (
              <div className="font-mono font-bold text-lg text-green-600">
                {formatDaiAmount((builder as any).llamapayDai)}
              </div>
            )}
          </td>
        )}
        <td className="text-center">
          <span className="badge badge-primary">{builder.withdrawalCount}</span>
        </td>
      </tr>

      {showDetails && (
        <tr>
          <td colSpan={includeLlamaPay ? 4 : 3}>
            <div className="bg-base-200 p-4 rounded-lg border-2 border-primary/20 my-2">
              <h4 className="font-semibold mb-3 flex items-center">
                <span className="mr-2">📋</span>
                Withdrawal History ({builder.withdrawalCount} withdrawals)
              </h4>
              <div className="max-h-64 overflow-y-auto pr-2">
                <div className="space-y-3">
                  {builder.withdrawals.map((withdrawal, idx) => (
                    <div key={idx} className="bg-base-100 p-3 rounded-lg border border-base-300 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="badge badge-success font-mono font-bold">{withdrawal.amount} ETH</span>
                        <span className="badge badge-info">{withdrawal.cohortDisplayName}</span>
                        <span className="badge badge-ghost text-xs">{withdrawal.date}</span>
                      </div>
                      <div className="text-sm text-base-content/70 italic">&quot;{withdrawal.reason}&quot;</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
