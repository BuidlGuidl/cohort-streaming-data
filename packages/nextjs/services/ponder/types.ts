// Common Ponder GraphQL response types
export interface PonderResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: Array<string | number>;
  }>;
}

// Common blockchain event fields that Ponder typically indexes
export interface BaseEvent {
  id: string;
  blockNumber: bigint;
  blockTimestamp: bigint;
  transactionHash: string;
  logIndex: number;
  chainId: number;
}

// Example event type - customize based on your actual Ponder schema
export interface ContractEvent extends BaseEvent {
  address: string;
  args: Record<string, any>;
  eventName: string;
}

// Example transfer event type
export interface TransferEvent extends BaseEvent {
  from: string;
  to: string;
  value: bigint;
  tokenAddress: string;
}

// Pagination types for Ponder queries
export interface PaginationArgs {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

// Generic paginated response
export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
  totalCount: number;
}
