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
  getInternalCohortStreams: () => CsvTransaction[];
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
      getInternalCohortStreams: () => {
        const { csvData } = get();
        return csvData.filter(transaction => transaction.account?.toLowerCase() === "internal cohort streams");
      },
    }),
    {
      name: "csv-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
