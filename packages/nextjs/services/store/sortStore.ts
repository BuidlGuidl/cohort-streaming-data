import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SortField = "name" | "eth" | "dai" | "fiat" | "withdrawals";
export type SortDirection = "asc" | "desc";

interface SortStoreState {
  sortField: SortField;
  sortDirection: SortDirection;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSort: (field: SortField) => void;
}

export const useSortStore = create<SortStoreState>()(
  persist(
    (set, get) => ({
      sortField: "eth",
      sortDirection: "desc",
      setSortField: (field: SortField) => set({ sortField: field }),
      setSortDirection: (direction: SortDirection) => set({ sortDirection: direction }),
      toggleSort: (field: SortField) => {
        const currentField = get().sortField;
        const currentDirection = get().sortDirection;

        if (currentField === field) {
          // Toggle direction if same field
          set({ sortDirection: currentDirection === "asc" ? "desc" : "asc" });
        } else {
          // New field, default to descending
          set({ sortField: field, sortDirection: "desc" });
        }
      },
    }),
    {
      name: "sort-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
