import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// LlamaPay stream data structure
export interface LlamaPayStream {
  address: string;
  ens: string;
  displayName: string;
  monthlyDaiRate: number; // DAI per 30 days
  dailyDaiRate: number; // DAI per day
  startDate: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format, undefined if still active
  rateChanges: Array<{
    date: string; // YYYY-MM-DD format
    newRate: number; // DAI per 30 days
  }>;
}

export interface LlamaPayStoreState {
  includeLlamaPay: boolean;
  setIncludeLlamaPay: (include: boolean) => void;
  getLlamaPayData: () => LlamaPayStream[];
  calculateLlamaPayForBuilder: (builderAddress: string, startDate: string, endDate: string) => number;
  getLlamaPayDisplayName: (builderAddress: string) => string;
}

// Hardcoded LlamaPay stream data
const LLAMAPAY_STREAMS: LlamaPayStream[] = [
  {
    address: "0x45334f41aaa464528cd5bc0f582acadc49eb0cd1", // 0xrinat.eth
    ens: "0xrinat.eth",
    displayName: "0xrinat.eth",
    monthlyDaiRate: 5000, // Current rate
    dailyDaiRate: 5000 / 30,
    startDate: "2025-04-30",
    rateChanges: [
      { date: "2025-04-30", newRate: 4000 }, // Initial rate
      { date: "2025-08-29", newRate: 5000 }, // Updated from 4000 to 5000
    ],
  },
  {
    address: "0x699bfac97c962db31238b429ceaf6734c492d61c", // baluu.eth
    ens: "baluuu.eth",
    displayName: "baluuu.eth",
    monthlyDaiRate: 6000, // Current rate
    dailyDaiRate: 6000 / 30,
    startDate: "2025-02-15",
    rateChanges: [
      { date: "2025-02-15", newRate: 2500 }, // Initial rate
      { date: "2025-04-29", newRate: 6000 }, // Updated from 2500 to 6000
    ],
  },
  {
    address: "0x1a2d838c4bbd1e73d162d0777d142c1d783cb831", // shivbhonde.eth
    ens: "shivbhonde.eth",
    displayName: "shivbhonde.eth",
    monthlyDaiRate: 5000,
    dailyDaiRate: 5000 / 30,
    startDate: "2025-04-30", // Started on 4/30/2025
    rateChanges: [
      { date: "2025-04-30", newRate: 5000 }, // Initial rate (no changes)
    ],
  },
  {
    address: "0xb4f53bd85c00ef22946d24ae26bc38ac64f5e7b1", // pabl0cks.eth
    ens: "pabl0cks.eth",
    displayName: "pabl0cks.eth",
    monthlyDaiRate: 6000, // Current rate
    dailyDaiRate: 6000 / 30,
    startDate: "2025-01-01", // Started at beginning of 2025
    rateChanges: [
      { date: "2025-01-01", newRate: 2500 }, // Initial rate
      { date: "2025-04-29", newRate: 6000 }, // Updated from 2500 to 6000
    ],
  },
  {
    address: "0x1990a6bcdb13d33463cba884a1ae6020292523e8", // inc.carletex.eth
    ens: "carletex.eth", // Display as carletex.eth
    displayName: "carletex.eth",
    monthlyDaiRate: 10000, // Current rate
    dailyDaiRate: 10000 / 30,
    startDate: "2025-01-01", // Started at beginning of 2025
    rateChanges: [
      { date: "2025-01-01", newRate: 7500 }, // Initial rate
      { date: "2025-04-29", newRate: 10000 }, // Updated from 7500 to 10000
    ],
  },
  {
    address: "0x38c772b96d73733f425746bd368b4b4435a37967", // spencerfaber.eth
    ens: "spencerfaber.eth",
    displayName: "spencerfaber.eth",
    monthlyDaiRate: 2500,
    dailyDaiRate: 2500 / 30,
    startDate: "2025-01-01", // Started at beginning of 2025
    rateChanges: [
      { date: "2025-01-01", newRate: 2500 }, // Initial rate (no changes)
    ],
  },
  {
    address: "0x53e90aa7eddedb58a2da1698028501c56c53978f", // frogbaseball.eth
    ens: "zakgriffith.eth", // Display as zakgriffith.eth
    displayName: "zakgriffith.eth",
    monthlyDaiRate: 6000,
    dailyDaiRate: 6000 / 30,
    startDate: "2025-01-01", // Started at beginning of 2025
    rateChanges: [
      { date: "2025-01-01", newRate: 6000 }, // Initial rate (no changes)
    ],
  },
  {
    address: "0x4cbe80191e63567191668d860acabaf15dac5512", // andrealbiac.eth
    ens: "andrealbiac.eth", // Display as andrealbiac.eth
    displayName: "andrealbiac.eth",
    monthlyDaiRate: 1000,
    dailyDaiRate: 1000 / 30,
    startDate: "2025-04-30",
    rateChanges: [
      { date: "2025-04-30", newRate: 1000 }, // Initial rate (no changes)
    ],
  },
  // gnole.eth stream that ended on 6/16/2025
  {
    address: "0x5f97cf9dd2cb7b53c47f6b1c26ab4bd143325d45", // gnole.eth
    ens: "gnole.eth",
    displayName: "gnole.eth",
    monthlyDaiRate: 6000,
    dailyDaiRate: 6000 / 30,
    startDate: "2025-01-01", // Assuming it started earlier
    endDate: "2025-06-16",
    rateChanges: [
      { date: "2025-01-01", newRate: 6000 }, // Initial rate (no changes)
    ],
  },
];

// Address mappings for combining streams from same person
const ADDRESS_MAPPINGS: Record<string, string> = {
  "0x1990a6bcdb13d33463cba884a1ae6020292523e8": "carletex.eth", // inc.carletex.eth -> carletex.eth
  "0x53e90aa7eddedb58a2da1698028501c56c53978f": "zakgriffith.eth", // frogbaseball.eth -> zakgriffith.eth
  "0xfe952cb6f4b8f4acd5337153da5c7c93dc3e44e1": "zakgriffith.eth", // zakgriffith.eth -> zakgriffith.eth (same person as frogbaseball.eth)
  "0x4cbe80191e63567191668d860acabaf15dac5512": "andrealbiac.eth", // andrealbiac.eth -> andrealbiac.eth
  "0xd04981840264a63df979064cbd6e4f7041df3f0e": "andrealbiac.eth", // andrealb.eth -> andrealbiac.eth
};

// Helper function to get the effective rate for a given date
const getEffectiveRate = (stream: LlamaPayStream, date: string): number => {
  const streamDate = new Date(date);

  // Check if stream has ended
  if (stream.endDate && streamDate > new Date(stream.endDate)) {
    return 0;
  }

  // Check if stream has started
  if (streamDate < new Date(stream.startDate)) {
    return 0;
  }

  // Find the most recent rate change before or on the given date
  // Start with the initial rate from the first rate change
  let currentRate = stream.rateChanges.length > 0 ? stream.rateChanges[0].newRate : stream.monthlyDaiRate;

  // Sort rate changes by date to ensure proper chronological order
  const sortedRateChanges = [...stream.rateChanges].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  for (const change of sortedRateChanges) {
    if (streamDate >= new Date(change.date)) {
      currentRate = change.newRate;
    }
  }

  return currentRate / 30; // Convert to daily rate
};

// Helper function to calculate total DAI for a date range
const calculateTotalDai = (stream: LlamaPayStream, startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let totalDai = 0;

  // Iterate through each day in the range
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dailyRate = getEffectiveRate(stream, dateStr);
    totalDai += dailyRate;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalDai;
};

export const useLlamaPayStore = create<LlamaPayStoreState>()(
  persist(
    set => ({
      includeLlamaPay: false,
      setIncludeLlamaPay: (include: boolean) => set({ includeLlamaPay: include }),

      getLlamaPayData: () => LLAMAPAY_STREAMS,

      calculateLlamaPayForBuilder: (builderAddress: string, startDate: string, endDate: string): number => {
        const streams = LLAMAPAY_STREAMS;
        let totalDai = 0;

        // Find all streams for this builder (including address mappings)
        const relevantStreams = streams.filter(stream => {
          const normalizedAddress = builderAddress.toLowerCase();
          // Match by exact address, address mappings, or if the builder address maps to this stream's display name
          return (
            stream.address.toLowerCase() === normalizedAddress ||
            ADDRESS_MAPPINGS[stream.address]?.toLowerCase() === normalizedAddress ||
            ADDRESS_MAPPINGS[normalizedAddress] === stream.displayName.toLowerCase()
          );
        });

        // Calculate total DAI for all relevant streams
        for (const stream of relevantStreams) {
          totalDai += calculateTotalDai(stream, startDate, endDate);
        }

        return totalDai;
      },

      getLlamaPayDisplayName: (builderAddress: string): string => {
        const streams = LLAMAPAY_STREAMS;
        const normalizedAddress = builderAddress.toLowerCase();

        // Find the stream for this builder
        const stream = streams.find(
          s =>
            s.address.toLowerCase() === normalizedAddress ||
            ADDRESS_MAPPINGS[s.address]?.toLowerCase() === normalizedAddress,
        );

        return stream?.displayName || builderAddress;
      },
    }),
    {
      name: "llamapay-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
