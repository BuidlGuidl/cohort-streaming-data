"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { usePonderTransfers } from "~~/hooks/ponder";

interface PonderTransfersProps {
  tokenAddress?: string;
  userAddress?: string;
  className?: string;
}

export const PonderTransfers = ({ tokenAddress = "", userAddress = "", className = "" }: PonderTransfersProps) => {
  const [token, setToken] = useState(tokenAddress);
  const [user, setUser] = useState(userAddress);

  const { data: transfers, isLoading, error, refetch } = usePonderTransfers(token, user);

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <h2 className="card-title">💸 Token Transfers</h2>

        {/* Input controls */}
        <div className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Token Address (optional)</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">User Address (optional)</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full"
              value={user}
              onChange={e => setUser(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={() => refetch()} disabled={(!token && !user) || isLoading}>
            {isLoading ? "Loading..." : "Fetch Transfers"}
          </button>
        </div>

        {/* Results */}
        {error && (
          <div className="alert alert-error">
            <span>Error: {error instanceof Error ? error.message : "Failed to fetch transfers"}</span>
          </div>
        )}

        {transfers && transfers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Value</th>
                  <th>Token</th>
                  <th>Tx</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer: any) => (
                  <tr key={transfer.id}>
                    <td>
                      <div className="font-mono text-sm">#{transfer.blockNumber.toString()}</div>
                      <div className="text-xs opacity-70">
                        {new Date(Number(transfer.blockTimestamp) * 1000).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <Address address={transfer.from} size="sm" />
                    </td>
                    <td>
                      <Address address={transfer.to} size="sm" />
                    </td>
                    <td>
                      <div className="font-mono text-sm">{formatEther(BigInt(transfer.value))} ETH</div>
                    </td>
                    <td>
                      <Address address={transfer.tokenAddress} size="sm" />
                    </td>
                    <td>
                      <a
                        href={`/blockexplorer/transaction/${transfer.transactionHash}`}
                        className="link link-primary font-mono text-xs"
                      >
                        {transfer.transactionHash.slice(0, 8)}...
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transfers && transfers.length === 0 && (token || user) && (
          <div className="alert alert-info">
            <span>No transfers found</span>
          </div>
        )}

        {!token && !user && (
          <div className="alert alert-warning">
            <span>Please provide either a token address or user address to search</span>
          </div>
        )}
      </div>
    </div>
  );
};
