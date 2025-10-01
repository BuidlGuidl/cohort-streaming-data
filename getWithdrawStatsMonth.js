/**
 * Generates a CSV with yearly withdraw stats including ETH/USD price at time of withdraw.
 * Generates a CSV with yearly withdraw stats.
 */
import { bgv3Database } from "../../services/bgv3Database.js";
import fs from "fs";
import fetch from "node-fetch"; // You may need to install this

// Add this mapping at the top of the file after imports
const LLAMAPAY_MONTHLY_DAI = {
  'pablocks.eth': 2500,
  'spencerfaber.eth': 2500,
  'gnole.eth': 6000,
  'inc.carletex.eth': 7500,
  'frogbaseball.eth': 6000
};

// Add this helper function to calculate daily DAI amount
function calculateDailyAmount(monthlyAmount) {
  return monthlyAmount / 30; // Simple daily rate
}

// Add back the helper functions after the calculateDailyAmount function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to get ETH price for a specific date
async function getETHPrice(date) {
  try {
    // Format date as dd-mm-yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    
    console.log(`Fetching price for date: ${formattedDate}`);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${formattedDate}`
    );
    
    // Add 1.5 second delay after each API call
    await delay(1500);
    
    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      console.error(`Response: ${await response.text()}`);
      
      // If we hit rate limit, wait longer and try again
      if (response.status === 429) {
        console.log('Rate limit hit, waiting 60 seconds before retrying...');
        await delay(60000);
        return getETHPrice(date); // Retry the request
      }
      return null;
    }
    
    const data = await response.json();
    
    if (!data.market_data?.current_price?.usd) {
      console.error('No price data found in response:', data);
      return null;
    }
    
    const price = data.market_data.current_price.usd;
    console.log(`Successfully got price for ${formattedDate}: $${price}`);
    return price;
  } catch (error) {
    console.error(`Failed to fetch price for ${date}:`, error);
    return null;
  }
}

const exportFilepath = "./withdraws-cursor-test.csv";
const exportTotalsFilepath = "./withdraws-totals.csv";

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

const main = async () => {
  const startTime = Date.now();

  const allUsers = await bgv3Database.collection("users").get();
  const AllUsersData = allUsers.docs.map((doc) => {
    return { id: doc.id, ...doc.data() };
  });

  const allUsersIndexed = AllUsersData.reduce((finalObject, user) => {
    return {
      ...finalObject,
      [user.id]: user,
    };
  }, {});

  const startDate = new Date('2024-09-30');
  const endDate = new Date('2024-12-30');
  
  // Get all dates in range
  const allDates = getDatesInRange(startDate, endDate);
  
  // Get ETH withdrawals
  const withdrawEventsQuery = await bgv3Database
    .collection("events")
    .where("type", "==", "stream.withdraw")
    .get();
  const withdrawEvents = withdrawEventsQuery.docs.map((doc) => doc.data());
  const withdrawCohortsEventsQuery = await bgv3Database
    .collection("events")
    .where("type", "==", "cohort.withdraw")
    .get();
  const withdrawCohortsEvents = withdrawCohortsEventsQuery.docs.map((doc) =>
    doc.data()
  );

  const allEvents = withdrawEvents.concat(withdrawCohortsEvents);
  const filteredEvents = allEvents.filter((withdrawEvent) => {
    const eventDate = new Date(withdrawEvent.timestamp);
    return eventDate >= startDate && eventDate <= endDate;
  });

  // Create a map to store user totals and reasons
  const userTotals = {};

  fs.writeFileSync(
    exportFilepath,
    "ENS,userAddress,streamAddress,cohort,date,amountETH,amountUSD,amountDAI,reason\n"
  );

  // First, process ETH withdrawals
  for (const withdrawEvent of filteredEvents) {
    const builderAddress = withdrawEvent.payload.userAddress;
    const date = new Date(withdrawEvent.timestamp);
    const formattedDate = date.toLocaleDateString("en-US");
    const amountETH = withdrawEvent.payload.amount;
    const builderENS = allUsersIndexed[builderAddress]?.ens ?? "-";
    
    // Get ETH price for this date
    const ethPrice = await getETHPrice(date);
    const amountUSD = ethPrice ? (parseFloat(amountETH) * ethPrice).toFixed(2) : "-";

    // Add to userTotals for the summary CSV
    if (!userTotals[builderAddress]) {
      userTotals[builderAddress] = {
        ens: builderENS,
        totalETH: 0,
        totalDAI: 0,
        totalUSD: 0,
        reasons: [],
      };
    }
    userTotals[builderAddress].totalETH += parseFloat(amountETH);
    userTotals[builderAddress].totalUSD += ethPrice ? parseFloat(amountETH) * ethPrice : 0;
    userTotals[builderAddress].reasons.push(withdrawEvent.payload.reason);

    // Write to detailed CSV
    const row = [
      builderENS,
      builderAddress,
      withdrawEvent.payload.streamAddress,
      withdrawEvent.payload.cohortName ?? "-",
      formattedDate,
      amountETH,
      amountUSD, // Now using the calculated USD amount
      "0", // No DAI for ETH withdrawal rows
      `"${withdrawEvent.payload.reason}"`,
    ];

    fs.appendFileSync(exportFilepath, row.join(","));
    fs.appendFileSync(exportFilepath, "\n");
  }

  // Process DAI payments
  const numberOfDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  for (const [ens, monthlyAmount] of Object.entries(LLAMAPAY_MONTHLY_DAI)) {
    const dailyAmount = calculateDailyAmount(monthlyAmount);
    const totalAmount = dailyAmount * numberOfDays;
    
    // Find user address from ENS
    const userAddress = Object.values(allUsersIndexed).find(user => user.ens === ens)?.id ?? "-";
    
    // Add to userTotals for the summary CSV
    if (!userTotals[userAddress]) {
      userTotals[userAddress] = {
        ens,
        totalETH: 0,
        totalDAI: 0,
        totalUSD: 0,
        reasons: [],
      };
    }
    userTotals[userAddress].totalDAI += totalAmount;
    userTotals[userAddress].totalUSD += totalAmount;
    userTotals[userAddress].reasons.push("LlamaPay DAI payment");

    // Write to detailed CSV
    const row = [
      ens,
      userAddress,
      "llamapay",
      "-",
      `${startDate.toLocaleDateString("en-US")} - ${endDate.toLocaleDateString("en-US")}`,
      "0",
      totalAmount.toFixed(2),
      totalAmount.toFixed(2),
      `"LlamaPay DAI payment"`,
    ];

    fs.appendFileSync(exportFilepath, row.join(","));
    fs.appendFileSync(exportFilepath, "\n");
  }

  // Create the totals CSV
  // Find the maximum number of withdraws any user has made
  const maxReasons = Math.max(...Object.values(userTotals).map(user => user.reasons.length));

  // Write totals CSV header
  const headers = [
    "ENS",
    "userAddress",
    "totalETH",
    "totalDAI",
    "totalUSD",
    ...Array(maxReasons).fill(0).map((_, index) => `withdraw${index + 1}`)
  ];
  
  fs.writeFileSync(exportTotalsFilepath, headers.join(",") + "\n");

  // Write totals data rows
  for (const [address, data] of Object.entries(userTotals)) {
    const reasonColumns = Array(maxReasons).fill('"-"').map((defaultValue, index) => 
      data.reasons[index] ? `"${data.reasons[index]}"` : defaultValue
    );
    
    const row = [
      data.ens,
      address,
      data.totalETH.toFixed(6),
      data.totalDAI.toFixed(2),
      data.totalUSD.toFixed(2),
      ...reasonColumns
    ];

    fs.appendFileSync(exportTotalsFilepath, row.join(",") + "\n");
  }

  const endTime = Date.now();
  const durationInSeconds = (endTime - startTime) / 1000;
  
  // Format duration into days, hours, minutes, seconds
  let duration;
  if (durationInSeconds < 60) {
    duration = `${durationInSeconds.toFixed(2)} seconds`;
  } else {
    const days = Math.floor(durationInSeconds / (24 * 60 * 60));
    const hours = Math.floor((durationInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((durationInSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    
    duration = parts.join(', ');
  }
  
  console.log("🚀 Exported withdraws to", exportFilepath);
  console.log("🚀 Exported total withdraws to", exportTotalsFilepath);
  console.log(`✨ Script completed in ${duration}`);
};

main();
