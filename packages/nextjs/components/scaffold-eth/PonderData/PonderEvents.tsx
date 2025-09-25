"use client";

import { useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { usePonderEvents } from "~~/hooks/ponder";

interface PonderEventsProps {
  contractAddress?: string;
  eventName?: string;
  className?: string;
}

export const PonderEvents = ({ contractAddress = "", eventName = "", className = "" }: PonderEventsProps) => {
  const [address, setAddress] = useState(contractAddress);
  const [event, setEvent] = useState(eventName);

  const { data: events, isLoading, error, refetch } = usePonderEvents(address, event);

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <h2 className="card-title">📡 Ponder Events</h2>

        {/* Input controls */}
        <div className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Contract Address</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Event Name (optional)</span>
            </label>
            <input
              type="text"
              placeholder="Transfer, Approval, etc."
              className="input input-bordered w-full"
              value={event}
              onChange={e => setEvent(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={() => refetch()} disabled={!address || isLoading}>
            {isLoading ? "Loading..." : "Fetch Events"}
          </button>
        </div>

        {/* Results */}
        {error && (
          <div className="alert alert-error">
            <span>Error: {error instanceof Error ? error.message : "Failed to fetch events"}</span>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Event</th>
                  <th>Address</th>
                  <th>Transaction</th>
                  <th>Args</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event: any) => (
                  <tr key={event.id}>
                    <td>
                      <div className="font-mono text-sm">#{event.blockNumber.toString()}</div>
                      <div className="text-xs opacity-70">
                        {new Date(Number(event.blockTimestamp) * 1000).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{event.eventName}</span>
                    </td>
                    <td>
                      <Address address={event.address} size="sm" />
                    </td>
                    <td>
                      <a
                        href={`/blockexplorer/transaction/${event.transactionHash}`}
                        className="link link-primary font-mono text-xs"
                      >
                        {event.transactionHash.slice(0, 10)}...
                      </a>
                    </td>
                    <td>
                      <details className="dropdown">
                        <summary className="btn btn-xs">View</summary>
                        <div className="dropdown-content bg-base-200 rounded-box p-2 shadow max-w-xs">
                          <pre className="text-xs overflow-auto">{JSON.stringify(event.args, null, 2)}</pre>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {events && events.length === 0 && address && (
          <div className="alert alert-info">
            <span>No events found for this contract</span>
          </div>
        )}
      </div>
    </div>
  );
};
