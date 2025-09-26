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
  const endDate = today.toISOString().split("T")[0];

  switch (preset) {
    case "1m":
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return { startDate: oneMonthAgo.toISOString().split("T")[0], endDate };

    case "2m":
      const twoMonthsAgo = new Date(today);
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      return { startDate: twoMonthsAgo.toISOString().split("T")[0], endDate };

    case "3m":
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return { startDate: threeMonthsAgo.toISOString().split("T")[0], endDate };

    case "6m":
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return { startDate: sixMonthsAgo.toISOString().split("T")[0], endDate };

    case "9m":
      const nineMonthsAgo = new Date(today);
      nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
      return { startDate: nineMonthsAgo.toISOString().split("T")[0], endDate };

    case "1y":
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return { startDate: oneYearAgo.toISOString().split("T")[0], endDate };

    case "2025":
      return { startDate: "2025-01-01", endDate: "2025-12-31" };

    default:
      // Default to last 3 months
      const defaultStart = new Date(today);
      defaultStart.setMonth(defaultStart.getMonth() - 3);
      return { startDate: defaultStart.toISOString().split("T")[0], endDate };
  }
};

export const useDateStore = create<DateStoreState>()(
  persist(
    set => {
      // Initialize with last 3 months
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
