import { usePonderQuery } from "./usePonderQuery";

// GraphQL queries based on the script
const COHORT_WITHDRAWALS_QUERY = `
  query CohortWithdrawals($startTime: BigInt!, $endTime: BigInt!, $after: String) {
    cohortWithdrawals(
      where: { timestamp_gte: $startTime, timestamp_lte: $endTime }
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: 1000
      after: $after
    ) {
      items {
        id
        builder
        amount
        reason
        timestamp
        cohortContractAddress
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const COHORT_INFORMATION_QUERY = `
  query CohortInformations {
    cohortInformations {
      items {
        address
        name
        url
        chainId
      }
    }
  }
`;

const COHORT_BUILDERS_QUERY = `
  query CohortBuilders($after: String) {
    cohortBuilders(
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: 1000
      after: $after
    ) {
      items {
        address
        ens
        cohortContractAddress
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Types for the builder data
export interface CohortWithdrawal {
  id: string;
  builder: string;
  amount: string;
  reason: string;
  timestamp: string;
  cohortContractAddress: string;
}

export interface CohortInfo {
  address: string;
  name: string;
  url: string;
  chainId: number;
}

export interface CohortBuilder {
  address: string;
  ens: string | null;
  cohortContractAddress: string;
}

export interface BuilderWithdrawStats {
  displayName: string;
  address: string;
  totalAmount: number;
  withdrawalCount: number;
  withdrawals: Array<{
    amount: string;
    cohortDisplayName: string;
    cohortContractAddress: string;
    reason: string;
    date: string;
  }>;
}

// Hook for fetching cohort information
export function useCohortInformation() {
  return usePonderQuery<{ cohortInformations: { items: CohortInfo[] } }>({
    queryKey: ["cohort-information"],
    query: COHORT_INFORMATION_QUERY,
  });
}

// Hook for fetching all builders (with pagination handled)
export function useCohortBuilders() {
  return usePonderQuery<{ cohortBuilders: { items: CohortBuilder[]; pageInfo: any } }>({
    queryKey: ["cohort-builders"],
    query: COHORT_BUILDERS_QUERY,
  });
}

// Hook for fetching withdrawals in a date range
export function useCohortWithdrawals(startDate: string, endDate: string) {
  const startTime = Math.floor(new Date(startDate).getTime() / 1000).toString();
  const endTime = Math.floor(new Date(endDate).getTime() / 1000).toString();

  return usePonderQuery<{ cohortWithdrawals: { items: CohortWithdrawal[]; pageInfo: any } }>({
    queryKey: ["cohort-withdrawals", startDate, endDate],
    query: COHORT_WITHDRAWALS_QUERY,
    variables: { startTime, endTime },
    enabled: !!(startDate && endDate),
  });
}

// Helper functions (converted from the script)
export const formatDate = (timestamp: string) => {
  const date = new Date(Number(timestamp) * 1000);
  return date
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/(\d+)\/(\d+)\/(\d+)/, "$3/$1/$2");
};

export const getCohortDisplayName = (contractAddress: string, cohortNamesMap: Record<string, string>) => {
  const lowerAddress = contractAddress.toLowerCase();

  // First try the Ponder cohort names
  if (cohortNamesMap[lowerAddress]) {
    return cohortNamesMap[lowerAddress];
  }

  // Final fallback to contract address
  return `Contract:${contractAddress.slice(0, 8)}...`;
};

export const getBuilderDisplayName = (builderAddress: string, ensNamesMap: Record<string, string>) => {
  const lowerAddress = builderAddress.toLowerCase();

  // First try the Ponder ENS names
  if (ensNamesMap[lowerAddress]) {
    return ensNamesMap[lowerAddress];
  }

  // Fallback to shortened address
  return `${builderAddress.slice(0, 6)}...${builderAddress.slice(-4)}`;
};

// Process withdrawals into builder stats
export const processBuilderWithdrawals = (
  withdrawals: CohortWithdrawal[],
  cohortNamesMap: Record<string, string>,
  ensNamesMap: Record<string, string>,
): BuilderWithdrawStats[] => {
  const builderWithdraws = withdrawals.reduce(
    (acc, event) => {
      const builderAddress = event.builder.toLowerCase();

      if (!acc[builderAddress]) {
        acc[builderAddress] = {
          displayName: getBuilderDisplayName(event.builder, ensNamesMap),
          address: event.builder,
          totalAmount: 0,
          withdrawalCount: 0,
          withdrawals: [],
        };
      }

      const cohortDisplayName = getCohortDisplayName(event.cohortContractAddress, cohortNamesMap);
      const amount = parseFloat(event.amount);

      acc[builderAddress].totalAmount += amount;
      acc[builderAddress].withdrawalCount += 1;
      acc[builderAddress].withdrawals.push({
        amount: event.amount,
        cohortDisplayName,
        cohortContractAddress: event.cohortContractAddress,
        reason: event.reason,
        date: formatDate(event.timestamp),
      });

      return acc;
    },
    {} as Record<string, BuilderWithdrawStats>,
  );

  // Convert to array and sort by total amount (descending)
  return Object.values(builderWithdraws).sort((a, b) => b.totalAmount - a.totalAmount);
};
