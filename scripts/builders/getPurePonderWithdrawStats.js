/**
 * Generates a CSV with withdraw stats using ONLY Ponder as data source.
 *
 * This script:
 * - Fetches withdraw events from Ponder within a specified date range
 * - Groups withdrawals by builder
 * - Uses contract addresses as fallbacks for cohort names
 * - Uses builder addresses as fallbacks for ENS names
 * - Calculates total amount per builder
 * - Exports results to a CSV file
 *
 * NO DEPENDENCIES ON BUIDLGUIDL API - 100% Ponder data
 *
 * Usage:
 * 1. Configure the date range (START_DATE and END_DATE)
 * 2. Run the script: node scripts/builders/getPurePonderWithdrawStats.js
 * 3. Find the results in the generated CSV file
 */
import { request, gql } from "graphql-request";
import fs from "fs";
import "dotenv/config";

// ======= Configuration =======
// Date range for withdraw events (YYYY-MM-DD format)
const START_DATE = "2025-06-12";
const END_DATE = "2025-09-12";

// Output configuration
const exportFilepath = "./pure-ponder-withdraws-grouped.csv";
const SORT_BY = "totalAmount"; // Options: 'totalAmount', 'address', 'none'
const SORT_DIRECTION = "desc"; // Options: 'asc', 'desc'

// ======= API Endpoints =======
const PONDER_URL = process.env.PONDER_API;

if (!PONDER_URL) {
  console.error(
    "❌ Error: Missing required environment variable. Please check your .env file."
  );
  console.error("Required variable: PONDER_API");
  process.exit(1);
}

// ======= Known Contract Mappings (for better UX, but optional) =======
// These are hard-coded fallbacks for known contracts to provide better names
const KNOWN_CONTRACTS = {
  "0x2ea63c9c9c114ae85b1027697a906420a23e8572": "OldSandGarden",
  // Add more known contracts here as needed
};

// ======= GraphQL Queries =======
const WithdrawalsQuery = gql`
  query Withdrawals($startTime: BigInt!, $endTime: BigInt!, $after: String) {
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

const CohortInfoQuery = gql`
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

const BuildersQuery = gql`
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

// ======= Helper Functions =======
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/(\d+)\/(\d+)\/(\d+)/, "$3/$1/$2");
};

const escapeCSV = (field) => {
  if (field === null || field === undefined) {
    return '""';
  }
  const stringField = String(field).replace(/"/g, '""');
  return `"${stringField}"`;
};

const getCohortDisplayName = (contractAddress, cohortNamesMap) => {
  const lowerAddress = contractAddress.toLowerCase();
  
  // First try the Ponder cohort names
  if (cohortNamesMap[lowerAddress]) {
    return cohortNamesMap[lowerAddress];
  }
  
  // Fallback to known contracts
  if (KNOWN_CONTRACTS[lowerAddress]) {
    return KNOWN_CONTRACTS[lowerAddress];
  }
  
  // Final fallback to contract address
  return `Contract:${contractAddress.slice(0, 8)}...`;
};

const getBuilderDisplayName = (builderAddress, ensNamesMap) => {
  const lowerAddress = builderAddress.toLowerCase();
  
  // First try the Ponder ENS names
  if (ensNamesMap[lowerAddress]) {
    return ensNamesMap[lowerAddress];
  }
  
  // Fallback to shortened address
  return `${builderAddress.slice(0, 6)}...${builderAddress.slice(-4)}`;
};

const sortBuilderWithdraws = (builderWithdraws) => {
  const entries = Object.entries(builderWithdraws);
  if (SORT_BY === "none") return entries;

  return entries.sort((a, b) => {
    let valueA, valueB;
    
    switch (SORT_BY) {
      case "totalAmount":
        valueA = a[1].totalAmount;
        valueB = b[1].totalAmount;
        break;
      case "address":
        valueA = a[0].toLowerCase();
        valueB = b[0].toLowerCase();
        break;
      default:
        return entries; // No sorting for unknown sort type
    }
    
    if (SORT_DIRECTION === "desc") {
      return valueB > valueA ? 1 : -1;
    } else {
      return valueA > valueB ? 1 : -1;
    }
  });
};

// ======= Main Function =======
const main = async () => {
  try {
    console.log("🚀 Starting pure Ponder withdraw stats generation...");
    console.log("📝 Note: Using ONLY Ponder data - no external API calls");

    // First, fetch cohort information to get real cohort names
    console.log("📊 Fetching cohort information from Ponder...");
    const cohortInfoResponse = await request(PONDER_URL, CohortInfoQuery);
    
    // Create cohort names mapping
    const cohortNamesMap = cohortInfoResponse.cohortInformations.items.reduce((acc, cohort) => {
      acc[cohort.address.toLowerCase()] = cohort.name;
      return acc;
    }, {});
    
    console.log(`✅ Found ${Object.keys(cohortNamesMap).length} cohorts with real names`);

    // Fetch all builders to get ENS names
    console.log("👤 Fetching builder ENS names from Ponder...");
    let allBuilders = [];
    let hasNextBuilderPage = true;
    let builderCursor = null;

    while (hasNextBuilderPage) {
      const buildersResponse = await request(PONDER_URL, BuildersQuery, {
        after: builderCursor,
      });

      const { items, pageInfo } = buildersResponse.cohortBuilders;
      allBuilders = allBuilders.concat(items);

      hasNextBuilderPage = pageInfo.hasNextPage;
      builderCursor = pageInfo.endCursor;
    }

    // Create ENS names mapping
    const ensNamesMap = allBuilders.reduce((acc, builder) => {
      if (builder.ens) {
        acc[builder.address.toLowerCase()] = builder.ens;
      }
      return acc;
    }, {});
    
    console.log(`✅ Found ${Object.keys(ensNamesMap).length} builders with ENS names`);

    // Parse dates from configuration
    const startDate = new Date(START_DATE);
    const endDate = new Date(END_DATE);

    console.log(`📅 Date range: ${START_DATE} to ${END_DATE}`);

    let allWithdrawEvents = [];
    let hasNextPage = true;
    let cursor = null;

    // Fetch all withdraw events from Ponder
    console.log("📥 Fetching withdraw events from Ponder...");
    while (hasNextPage) {
      const response = await request(PONDER_URL, WithdrawalsQuery, {
        startTime: Math.floor(startDate.getTime() / 1000).toString(),
        endTime: Math.floor(endDate.getTime() / 1000).toString(),
        after: cursor,
      });

      const { items, pageInfo } = response.cohortWithdrawals;
      allWithdrawEvents = allWithdrawEvents.concat(items);

      // Log progress for multiple pages
      if (pageInfo.hasNextPage) {
        console.log(
          `📥 Fetched ${allWithdrawEvents.length} withdraw events so far...`
        );
      }

      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
    }

    console.log(`✅ Total withdraw events fetched: ${allWithdrawEvents.length}`);

    // Group events by builder
    const builderWithdraws = allWithdrawEvents.reduce((acc, event) => {
      const builderAddress = event.builder.toLowerCase();
      
      if (!acc[builderAddress]) {
        acc[builderAddress] = {
          displayName: getBuilderDisplayName(event.builder, ensNamesMap),
          totalAmount: 0,
          withdrawals: [],
        };
      }

      const cohortDisplayName = getCohortDisplayName(event.cohortContractAddress, cohortNamesMap);
      const amount = parseFloat(event.amount);
      
      acc[builderAddress].totalAmount += amount;
      acc[builderAddress].withdrawals.push({
        amount: event.amount,
        cohortDisplayName,
        cohortContractAddress: event.cohortContractAddress,
        reason: event.reason,
        date: formatDate(event.timestamp),
      });

      return acc;
    }, {});

    console.log("📊 Processing and writing data to CSV...");

    // Write CSV header
    fs.writeFileSync(
      exportFilepath,
      "builderDisplayName,builderAddress,totalAmount,withdrawalCount,withdrawalDetails\n"
    );

    // Sort and write data
    const sortedEntries = sortBuilderWithdraws(builderWithdraws);
    
    sortedEntries.forEach(([address, data]) => {
      const withdrawalDetails = data.withdrawals
        .map((w) => `[${w.amount} ETH from ${w.cohortDisplayName} on ${w.date} - ${w.reason}]`)
        .join(" | ");

      const row = [
        escapeCSV(data.displayName),
        escapeCSV(address),
        escapeCSV(data.totalAmount.toFixed(4)),
        escapeCSV(data.withdrawals.length),
        escapeCSV(withdrawalDetails),
      ];

      fs.appendFileSync(exportFilepath, row.join(",") + "\n");
    });

    console.log("✨ Pure Ponder withdraw stats generation complete!");
    console.log(`📊 Processed: ${allWithdrawEvents.length} events → ${sortedEntries.length} unique builders`);
    
    if (SORT_BY !== "none") {
      console.log(`🔄 Sorted by: ${SORT_BY} (${SORT_DIRECTION})`);
    }

    console.log(`💾 CSV file saved to: ${exportFilepath}`);
    console.log("🎯 Data source: 100% Ponder (no external API dependencies)");
    
    // Summary stats
    const totalAmount = sortedEntries.reduce((sum, [, data]) => sum + data.totalAmount, 0);
    console.log(`💰 Total amount withdrawn: ${totalAmount.toFixed(4)} ETH`);
    
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("💡 Make sure your PONDER_API environment variable is set correctly");
  }
};

main();
