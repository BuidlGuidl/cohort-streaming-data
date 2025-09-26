"use client";

import type { NextPage } from "next";
import { BuilderStats } from "~~/components/scaffold-eth";

const PonderDemo: NextPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Builder Stats Content */}
      <div className="min-h-[600px]">
        <BuilderStats className="w-full" />
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
