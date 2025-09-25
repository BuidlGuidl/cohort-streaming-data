import { GraphQLClient } from "graphql-request";

// Cache for the GraphQL client instance
let ponderClient: GraphQLClient | null = null;

// Fallback URL if environment variable isn't loaded
const FALLBACK_PONDER_URL = "https://bg-ponder-indexer-production.up.railway.app/graphql";

// Lazy client creation function
function getPonderClient(): GraphQLClient {
  if (!ponderClient) {
    // Try environment variable first, fallback to hardcoded URL
    const PONDER_API_URL = process.env.NEXT_PUBLIC_PONDER_API || FALLBACK_PONDER_URL;

    // Log for debugging (remove in production)
    console.log("🔗 Ponder API URL:", PONDER_API_URL);
    console.log("📊 Environment variable available:", !!process.env.NEXT_PUBLIC_PONDER_API);

    ponderClient = new GraphQLClient(PONDER_API_URL, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return ponderClient;
}

// Helper function to make GraphQL requests with error handling
export async function ponderRequest<T = any>(query: string, variables?: any): Promise<T> {
  try {
    const client = getPonderClient();
    return await client.request<T>(query, variables);
  } catch (error) {
    console.error("Ponder GraphQL request failed:", error);

    // Provide more helpful error messages
    if (error instanceof Error && error.message.includes("NEXT_PUBLIC_PONDER_API")) {
      throw new Error("Ponder API configuration error: " + error.message);
    }

    throw error;
  }
}

// Export a function to get the client for advanced usage
export const getPonderClientInstance = getPonderClient;
