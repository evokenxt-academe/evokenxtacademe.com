"use client";

import * as React from "react";
import type { DashboardSearchItem } from "@/components/dashboard-search-command";

const DashboardSearchContext = React.createContext<{
  items: DashboardSearchItem[];
  setItems: (items: DashboardSearchItem[]) => void;
}>({
  items: [],
  setItems: () => {},
});

export function DashboardSearchProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<DashboardSearchItem[]>([]);
  const value = React.useMemo(() => ({ items, setItems }), [items]);
  return (
    <DashboardSearchContext.Provider value={value}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

export function useDashboardSearchItems() {
  return React.useContext(DashboardSearchContext);
}
