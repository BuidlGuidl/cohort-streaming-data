import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { ponderRequest } from "~~/services/ponder/graphqlClient";

interface UsePonderQueryOptions<T> extends Omit<UseQueryOptions<T>, "queryFn"> {
  query: string;
  variables?: any;
}

/**
 * Custom hook for querying Ponder GraphQL API using React Query
 * @param options - Query options including GraphQL query string and variables
 * @returns React Query result
 */
export function usePonderQuery<T = any>({ query, variables, queryKey, ...options }: UsePonderQueryOptions<T>) {
  return useQuery<T>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey, variables],
    queryFn: () => ponderRequest<T>(query, variables),
    ...options,
  });
}

/**
 * Hook for querying events by contract address
 */
export function usePonderEvents(contractAddress: string, eventName?: string) {
  const query = `
    query GetEvents($contractAddress: String!, $eventName: String) {
      events(
        where: { 
          address: $contractAddress
          ${eventName ? ", eventName: $eventName" : ""}
        }
        orderBy: blockNumber
        orderDirection: desc
        first: 100
      ) {
        id
        blockNumber
        blockTimestamp
        transactionHash
        logIndex
        address
        eventName
        args
      }
    }
  `;

  return usePonderQuery({
    queryKey: ["ponder-events", contractAddress, eventName],
    query,
    variables: { contractAddress, eventName },
    enabled: !!contractAddress,
  });
}

/**
 * Hook for querying transfer events
 */
export function usePonderTransfers(tokenAddress?: string, userAddress?: string) {
  const query = `
    query GetTransfers($tokenAddress: String, $userAddress: String) {
      transfers(
        where: {
          ${tokenAddress ? "tokenAddress: $tokenAddress," : ""}
          ${userAddress ? "or: [{ from: $userAddress }, { to: $userAddress }]," : ""}
        }
        orderBy: blockTimestamp
        orderDirection: desc
        first: 50
      ) {
        id
        from
        to
        value
        tokenAddress
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `;

  return usePonderQuery({
    queryKey: ["ponder-transfers", tokenAddress, userAddress],
    query,
    variables: { tokenAddress, userAddress },
    enabled: !!(tokenAddress || userAddress),
  });
}

/**
 * Hook for querying block data
 */
export function usePonderBlocks(limit = 10) {
  const query = `
    query GetBlocks($limit: Int!) {
      blocks(
        orderBy: number
        orderDirection: desc
        first: $limit
      ) {
        number
        timestamp
        hash
        parentHash
        gasUsed
        gasLimit
        transactionCount
      }
    }
  `;

  return usePonderQuery({
    queryKey: ["ponder-blocks", limit],
    query,
    variables: { limit },
  });
}
