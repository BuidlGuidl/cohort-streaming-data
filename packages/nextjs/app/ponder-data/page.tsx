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
    </div>
  );
};

export default PonderDemo;
