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

// Utility function to format ETH amounts (remove leading zero for amounts < 1)
const formatEthAmount = (amount: number): string => {
  const formatted = amount.toFixed(2);
  return formatted.startsWith("0.") ? formatted.substring(1) : formatted;
};

interface BuilderStatsProps {
  className?: string;
}

export const BuilderStats = ({ className = "" }: BuilderStatsProps) => {
  // Use shared date store
  const { startDate, endDate } = useDateStore();

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

    return { cohortNamesMap, builderStats };
  }, [cohortInfo, buildersData, withdrawalsData]);

  const isLoading = isLoadingCohorts || isLoadingBuilders || isLoadingWithdrawals;

  // Calculate summary stats
  const totalAmount = builderStats.reduce((sum, builder) => sum + builder.totalAmount, 0);

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
      {builderStats.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">
              Ponder Cohort Data
              <span className="badge badge-primary badge-lg ml-4">Total: {formatEthAmount(totalAmount)} ETH</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Builder</th>
                    <th className="text-center">Total Amount</th>
                    <th className="text-center">Withdrawals</th>
                  </tr>
                </thead>
                <tbody>
                  {builderStats.map((builder, index) => (
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

      {builderStats.length === 0 && !isLoading && !error && (
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
          <div className="font-mono font-bold text-lg">{formatEthAmount(builder.totalAmount)} ETH</div>
        </td>
        <td className="text-center">
          <span className="badge badge-primary">{builder.withdrawalCount}</span>
        </td>
      </tr>

      {showDetails && (
        <tr>
          <td colSpan={3}>
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
