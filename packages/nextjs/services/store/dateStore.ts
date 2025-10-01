import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DateStoreState {
  startDate: string;
  endDate: string;
  currentPreset: string | null;
  setDateRange: (startDate: string, endDate: string) => void;
  setPreset: (preset: string) => void;
  setCustomRange: (startDate: string, endDate: string) => void;
}

// Helper function to get date presets
const getDatePreset = (preset: string): DateRange => {
  const today = new Date();
  // Use UTC for consistent date calculations across timezones
  const utcToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  // Add one day to ensure today is included in the range
  const tomorrow = new Date(utcToday);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const endDate = tomorrow.toISOString().split("T")[0];

  switch (preset) {
    case "1m":
      const oneMonthAgo = new Date(utcToday);
      oneMonthAgo.setUTCMonth(oneMonthAgo.getUTCMonth() - 1);
      oneMonthAgo.setUTCDate(oneMonthAgo.getUTCDate() + 1); // Add one day to make it inclusive
      return { startDate: oneMonthAgo.toISOString().split("T")[0], endDate };

    case "2m":
      const twoMonthsAgo = new Date(utcToday);
      twoMonthsAgo.setUTCMonth(twoMonthsAgo.getUTCMonth() - 2);
      twoMonthsAgo.setUTCDate(twoMonthsAgo.getUTCDate() + 1); // Add one day to make it inclusive
      return { startDate: twoMonthsAgo.toISOString().split("T")[0], endDate };

    case "3m":
      const threeMonthsAgo = new Date(utcToday);
      threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3);
      threeMonthsAgo.setUTCDate(threeMonthsAgo.getUTCDate() + 1); // Add one day to make it inclusive
      return { startDate: threeMonthsAgo.toISOString().split("T")[0], endDate };

    case "6m":
      const sixMonthsAgo = new Date(utcToday);
      sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
      sixMonthsAgo.setUTCDate(sixMonthsAgo.getUTCDate() + 1); // Add one day to make it inclusive
      return { startDate: sixMonthsAgo.toISOString().split("T")[0], endDate };

    case "9m":
      const nineMonthsAgo = new Date(utcToday);
      nineMonthsAgo.setUTCMonth(nineMonthsAgo.getUTCMonth() - 9);
      nineMonthsAgo.setUTCDate(nineMonthsAgo.getUTCDate() + 1); // Add one day to make it inclusive
      return { startDate: nineMonthsAgo.toISOString().split("T")[0], endDate };

    case "1y":
      const oneYearAgo = new Date(utcToday);
      oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
      oneYearAgo.setUTCDate(oneYearAgo.getUTCDate() + 1); // Add one day to make it inclusive
      return { startDate: oneYearAgo.toISOString().split("T")[0], endDate };

    case "2025":
      return { startDate: "2025-01-01", endDate };

    default:
      // Default to last 3 months
      const defaultStart = new Date(utcToday);
      defaultStart.setUTCMonth(defaultStart.getUTCMonth() - 3);
      return { startDate: defaultStart.toISOString().split("T")[0], endDate };
  }
};

export const useDateStore = create<DateStoreState>()(
  persist(
    set => {
      // Initialize with last 3 months using current logic
      const defaultRange = getDatePreset("3m");

      return {
        startDate: defaultRange.startDate,
        endDate: defaultRange.endDate,
        currentPreset: "3m", // Default preset
        setDateRange: (startDate: string, endDate: string) => set({ startDate, endDate }),
        setPreset: (preset: string) => {
          const range = getDatePreset(preset);
          set({ startDate: range.startDate, endDate: range.endDate, currentPreset: preset });
        },
        setCustomRange: (startDate: string, endDate: string) => {
          set({ startDate, endDate, currentPreset: null });
        },
      };
    },
    {
      name: "date-range-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
