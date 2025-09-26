"use client";

import { useMemo, useState } from "react";
import {
  BuilderWithdrawStats,
  processBuilderWithdrawals,
  useCohortBuilders,
  useCohortInformation,
  useCohortWithdrawals,
} from "~~/hooks/ponder";

interface BuilderStatsProps {
  className?: string;
}

export const BuilderStats = ({ className = "" }: BuilderStatsProps) => {
  // Date range state (default to last 3 months)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  });

  // Fetch data
  const { data: cohortInfo, isLoading: isLoadingCohorts } = useCohortInformation();
  const { data: buildersData, isLoading: isLoadingBuilders } = useCohortBuilders();
  const {
    data: withdrawalsData,
    isLoading: isLoadingWithdrawals,
    error,
    refetch,
  } = useCohortWithdrawals(startDate, endDate);

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
  const totalWithdrawals = builderStats.reduce((sum, builder) => sum + builder.withdrawalCount, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">👨‍💻 Builder Withdrawal Stats</h2>
          <p className="text-sm opacity-70">
            Withdraw statistics for BuidlGuidl cohort builders using pure Ponder data
          </p>

          {/* Date Range Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <button className="btn btn-primary w-full" onClick={() => refetch()} disabled={isLoading}>
                {isLoading ? "Loading..." : "Fetch Data"}
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {builderStats.length > 0 && (
            <div className="stats shadow mt-4">
              <div className="stat">
                <div className="stat-title">Total Builders</div>
                <div className="stat-value text-primary">{builderStats.length}</div>
              </div>

              <div className="stat">
                <div className="stat-title">Total Withdrawals</div>
                <div className="stat-value text-secondary">{totalWithdrawals}</div>
              </div>

              <div className="stat">
                <div className="stat-title">Total Amount</div>
                <div className="stat-value text-accent">{totalAmount.toFixed(4)} ETH</div>
              </div>
            </div>
          )}
        </div>
      </div>

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
            <h3 className="card-title">Builder Rankings (by Total Amount)</h3>

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
          <div className="font-semibold">{builder.displayName}</div>
        </td>
        <td className="text-center">
          <div className="font-mono font-bold text-lg">{builder.totalAmount.toFixed(4)} ETH</div>
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
