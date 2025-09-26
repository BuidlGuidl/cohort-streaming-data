"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { AccountingBuilderStats, CsvUpload } from "~~/components/scaffold-eth/AccountingData";

const AccountingData: NextPage = () => {
  const [activeTab, setActiveTab] = useState("builders");

  const tabs = [
    { id: "builders", label: "👨‍💻 Builder Stats", icon: "👨‍💻" },
    { id: "upload", label: "📁 Upload CSV", icon: "📁" },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🧮 Accounting Data</h1>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Explore builder data from your accounting software CSV uploads. Compare with Ponder data for accuracy
          verification.
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
        {activeTab === "builders" && <AccountingBuilderStats className="w-full" />}

        {activeTab === "upload" && (
          <div className="space-y-6">
            <CsvUpload className="w-full" />
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">📋 CSV Format Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-sm opacity-80">
                  <li>Required columns: ETH Out, FIAT Out, To, From, Account</li>
                  <li>Rows tagged as &quot;Internal Cohort Streams&quot; in the Account column will be processed</li>
                  <li>Data should include withdrawal transactions from cohort streams</li>
                  <li>FIAT Out column should contain USD equivalent values</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">ℹ️ About Accounting Data</h2>
          <div className="space-y-2">
            <div className="text-sm opacity-70">
              This interface allows you to upload CSV data from your accounting software to compare with Ponder
              blockchain data. The CSV data persists while you navigate between Ponder Data and Accounting Data tabs for
              easy comparison.
            </div>
            <div className="text-sm opacity-70">
              Only transactions marked as &quot;Internal Cohort Streams&quot; will be displayed in the builder
              statistics.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingData;
