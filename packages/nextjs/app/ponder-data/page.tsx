"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { BuilderStats, PonderEvents, PonderTransfers } from "~~/components/scaffold-eth";

const PonderDemo: NextPage = () => {
  const [activeTab, setActiveTab] = useState("builders");

  const tabs = [
    { id: "builders", label: "👨‍💻 Builder Stats", icon: "👨‍💻" },
    { id: "events", label: "📡 Events", icon: "📡" },
    { id: "transfers", label: "💸 Transfers", icon: "💸" },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🔍 Ponder Data</h1>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Explore indexed blockchain data using the Ponder GraphQL API. Real-time data from BuidlGuidl cohorts, events,
          and transfers.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="tabs tabs-boxed">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "builders" && <BuilderStats className="w-full" />}

        {activeTab === "events" && (
          <div className="space-y-6">
            <PonderEvents className="w-full" />
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">📋 How to Use Events</h3>
                <ul className="list-disc list-inside space-y-1 text-sm opacity-80">
                  <li>Enter a contract address to see all events emitted by that contract</li>
                  <li>Optionally filter by event name (e.g., &quot;Transfer&quot;, &quot;Approval&quot;)</li>
                  <li>Results are ordered by block number (newest first)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transfers" && (
          <div className="space-y-6">
            <PonderTransfers className="w-full" />
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">📋 How to Use Transfers</h3>
                <ul className="list-disc list-inside space-y-1 text-sm opacity-80">
                  <li>Enter a token address to see all transfers for that token</li>
                  <li>Enter a user address to see all transfers they&apos;ve made or received</li>
                  <li>You can combine both filters for more specific results</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Info */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">🔗 API Information</h2>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Ponder GraphQL Endpoint:</span>
              <code className="ml-2 text-xs bg-base-200 px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_PONDER_API || "https://bg-ponder-indexer-production.up.railway.app/graphql"}
              </code>
            </div>
            <div className="text-sm opacity-70">
              This interface uses 100% Ponder data with no external API dependencies for the best performance and
              reliability.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PonderDemo;
