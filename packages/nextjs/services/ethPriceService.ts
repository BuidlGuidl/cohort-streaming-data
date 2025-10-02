// ETH price fetching service based on the script logic
// Uses CoinGecko API to get historical ETH prices

interface ETHPriceCache {
  [date: string]: number;
}

class ETHPriceService {
  private cache: ETHPriceCache = {};
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  // Helper function to delay requests (rate limiting)
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Format date as dd-mm-yyyy for CoinGecko API
  private formatDateForAPI(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Get ETH price for a specific date
  private async fetchETHPrice(date: Date): Promise<number | null> {
    const dateKey = date.toISOString().split("T")[0];

    // Check cache first
    if (this.cache[dateKey]) {
      return this.cache[dateKey];
    }

    const formattedDate = this.formatDateForAPI(date);
    console.log(`Making API request for date: ${formattedDate}`);

    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/history?date=${formattedDate}`);
      console.log(`API response status: ${response.status}`);

      if (!response.ok) {
        console.error(`ETH price API request failed with status ${response.status}`);

        // If we hit rate limit, wait and retry
        if (response.status === 429) {
          console.log("Rate limit hit, waiting 60 seconds before retrying...");
          await this.delay(60000);
          return this.fetchETHPrice(date);
        }
        return null;
      }

      const data = await response.json();
      console.log(`API response data:`, data);

      if (!data.market_data?.current_price?.usd) {
        console.error("No price data found in response:", data);
        return null;
      }

      const price = data.market_data.current_price.usd;
      console.log(`Successfully fetched ETH price: $${price} for ${formattedDate}`);
      this.cache[dateKey] = price;

      // Add delay to respect rate limits
      await this.delay(1500);

      return price;
    } catch (error) {
      console.error(`Failed to fetch ETH price for ${date}:`, error);
      return null;
    }
  }

  // Process queue of price requests
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
      }
    }

    this.isProcessingQueue = false;
  }

  // Get ETH price for a date (with queuing for rate limiting)
  async getETHPrice(date: Date): Promise<number | null> {
    const dateKey = date.toISOString().split("T")[0];

    // Check cache first
    if (this.cache[dateKey]) {
      console.log(`Using cached ETH price for ${dateKey}: $${this.cache[dateKey]}`);
      return this.cache[dateKey];
    }

    console.log(`Fetching ETH price for ${dateKey}...`);

    // Add to queue
    return new Promise(resolve => {
      this.requestQueue.push(async () => {
        const price = await this.fetchETHPrice(date);
        console.log(`ETH price result for ${dateKey}:`, price);
        resolve(price);
      });

      // Process queue
      this.processQueue();
    });
  }

  // Get ETH prices for multiple dates
  async getETHPricesForDates(dates: Date[]): Promise<{ [dateKey: string]: number | null }> {
    const results: { [dateKey: string]: number | null } = {};

    // Process dates in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);

      const batchPromises = batch.map(async date => {
        const dateKey = date.toISOString().split("T")[0];
        const price = await this.getETHPrice(date);
        results[dateKey] = price;
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  // Clear cache
  clearCache(): void {
    this.cache = {};
  }
}

// Export singleton instance
export const ethPriceService = new ETHPriceService();
