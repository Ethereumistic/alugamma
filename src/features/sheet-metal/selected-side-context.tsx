import { createContext, useContext, useState, type ReactNode } from "react";

import type { SideKey } from "./types";

type SelectedSideContextValue = {
  selectedSide: SideKey | null;
  setSelectedSide: (side: SideKey | null) => void;
};

const SelectedSideContext = createContext<SelectedSideContextValue | null>(null);

export function useSelectedSide() {
  const context = useContext(SelectedSideContext);
  if (!context) {
    throw new Error("useSelectedSide must be used within a SelectedSideProvider");
  }
  return context;
}

export function SelectedSideProvider({ children }: { children: ReactNode }) {
  const [selectedSide, setSelectedSide] = useState<SideKey | null>(null);

  return (
    <SelectedSideContext.Provider value={{ selectedSide, setSelectedSide }}>
      {children}
    </SelectedSideContext.Provider>
  );
}
