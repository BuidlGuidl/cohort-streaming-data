import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CsvTransaction {
  ethOut: number;
  fiatOut: number;
  to: string;
  from: string;
  account: string;
  // Additional fields that might be present in CSV
  [key: string]: any;
}

export interface CsvStoreState {
  csvData: CsvTransaction[];
  fileName: string | null;
  uploadedAt: Date | null;
  setCsvData: (data: CsvTransaction[], fileName: string) => void;
  clearCsvData: () => void;
  getInternalCohortStreams: (startDate?: string, endDate?: string) => CsvTransaction[];
}

export const useCsvStore = create<CsvStoreState>()(
  persist(
    (set, get) => ({
      csvData: [],
      fileName: null,
      uploadedAt: null,
      setCsvData: (data: CsvTransaction[], fileName: string) =>
        set({
          csvData: data,
          fileName,
          uploadedAt: new Date(),
        }),
      clearCsvData: () =>
        set({
          csvData: [],
          fileName: null,
          uploadedAt: null,
        }),
      getInternalCohortStreams: (startDate?: string, endDate?: string) => {
        const { csvData } = get();
        let filtered = csvData.filter(transaction =>
          transaction.account?.toLowerCase().includes("internal cohort streams"),
        );

        // Apply date filtering if dates are provided
        if (startDate || endDate) {
          filtered = filtered.filter(transaction => {
            // Try to extract date from the transaction - look for a Date Time field or similar
            const dateField =
              transaction["Date Time"] || transaction["date"] || transaction["Date"] || transaction["timestamp"];
            if (!dateField) return true; // If no date field found, include the transaction

            // Parse the date (assuming ISO format like "2025-09-23T05:48:23.000-06:00")
            const transactionDate = new Date(dateField).toISOString().split("T")[0];

            if (startDate && transactionDate < startDate) return false;
            if (endDate && transactionDate > endDate) return false;

            return true;
          });
        }

        return filtered;
      },
    }),
    {
      name: "csv-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
