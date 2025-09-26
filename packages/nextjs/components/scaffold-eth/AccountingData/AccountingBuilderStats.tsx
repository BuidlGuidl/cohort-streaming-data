"use client";

import { useMemo, useState } from "react";
import { useCsvStore } from "~~/services/store/csvStore";

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
  const internalCohortData = getInternalCohortStreams();

  // Process CSV data into builder stats
  const builderStats = useMemo(() => {
    const builderMap = new Map<string, AccountingBuilderData>();

    internalCohortData.forEach(transaction => {
      const builderAddress = transaction.to?.toLowerCase() || "";

      if (!builderAddress) return;

      if (!builderMap.has(builderAddress)) {
        builderMap.set(builderAddress, {
          address: builderAddress,
          displayName: builderAddress.slice(0, 6) + "..." + builderAddress.slice(-4),
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

    // Sort by total ETH amount (descending)
    return Array.from(builderMap.values()).sort((a, b) => b.totalEthAmount - a.totalEthAmount);
  }, [internalCohortData]);

  // Calculate summary stats
  const totalEthAmount = builderStats.reduce((sum, builder) => sum + builder.totalEthAmount, 0);
  const totalFiatAmount = builderStats.reduce((sum, builder) => sum + builder.totalFiatAmount, 0);
  const totalWithdrawals = builderStats.reduce((sum, builder) => sum + builder.withdrawalCount, 0);

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
      {/* Header */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">👨‍💻 Accounting Builder Stats</h2>
          <p className="text-sm opacity-70">
            Builder withdrawal statistics from your accounting software CSV data (Internal Cohort Streams only)
          </p>

          {/* Summary Stats */}
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
              <div className="stat-title">Total ETH</div>
              <div className="stat-value text-accent">{totalEthAmount.toFixed(4)} ETH</div>
            </div>

            <div className="stat">
              <div className="stat-title">Total FIAT</div>
              <div className="stat-value text-success">${totalFiatAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Builder Stats Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Builder Rankings (by Total ETH Amount)</h3>

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
          <div className="font-semibold">{builder.displayName}</div>
          <div className="text-xs opacity-70 font-mono">{builder.address}</div>
        </td>
        <td className="text-center">
          <div className="font-mono font-bold text-lg">{builder.totalEthAmount.toFixed(4)} ETH</div>
        </td>
        <td className="text-center">
          <div className="font-mono font-bold text-lg">${builder.totalFiatAmount.toFixed(2)}</div>
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
                  {builder.withdrawals.map((withdrawal, idx) => (
                    <div key={idx} className="bg-base-100 p-3 rounded-lg border border-base-300 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="badge badge-success font-mono font-bold">
                          {withdrawal.ethAmount.toFixed(4)} ETH
                        </span>
                        <span className="badge badge-info font-mono font-bold">
                          ${withdrawal.fiatAmount.toFixed(2)}
                        </span>
                        <span className="badge badge-ghost text-xs">From: {withdrawal.from?.slice(0, 10)}...</span>
                      </div>
                      <div className="text-sm text-base-content/70 font-mono">To: {withdrawal.to}</div>
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
