import { createContext, useContext, useState, ReactNode } from "react";

import { buildDxf } from "@/features/sheet-metal/dxf";
import { computeSheetMetalGeometry } from "@/features/sheet-metal/geometry";
import { presetLibrary } from "@/features/sheet-metal/presets";
import {
  createMeasurement,
  type Measurement,
  type SheetMetalModel,
  type SideKey,
} from "@/features/sheet-metal/types";

function replaceMeasurement(items: Measurement[], index: number, amount: number) {
  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, amount: Math.max(0, Math.round(amount)) } : item
  );
}

function removeMeasurement(items: Measurement[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

type SheetMetalContextType = {
  model: SheetMetalModel;
  exportName: string;
  setExportName: (name: string) => void;
  geometry: ReturnType<typeof computeSheetMetalGeometry>;
  setBaseValue: (key: "baseWidth" | "baseHeight", value: number) => void;
  setInvert: (axis: "invertX" | "invertY", value: boolean) => void;
  addFlange: (side: SideKey) => void;
  addFrez: (side: SideKey) => void;
  updateFlange: (side: SideKey, index: number, amount: number) => void;
  updateFrez: (side: SideKey, index: number, amount: number) => void;
  removeFlange: (side: SideKey, index: number) => void;
  removeFrez: (side: SideKey, index: number) => void;
  setMitre: (side: SideKey, position: "start" | "end", value: boolean) => void;
  loadPreset: (index: number) => void;
  exportDxf: () => void;
};

const SheetMetalContext = createContext<SheetMetalContextType | null>(null);

export function useSheetMetal() {
  const context = useContext(SheetMetalContext);
  if (!context) {
    throw new Error("useSheetMetal must be used within a SheetMetalProvider");
  }
  return context;
}

export function SheetMetalProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<SheetMetalModel>(() => structuredClone(presetLibrary[1].model));
  const [exportName, setExportName] = useState("alugamma-sheet-metal");
  const geometry = computeSheetMetalGeometry(model);

  function setBaseValue(key: "baseWidth" | "baseHeight", value: number) {
    setModel((current) => ({
      ...current,
      [key]: Math.max(1, Math.round(value)),
    }));
  }

  function setInvert(axis: "invertX" | "invertY", value: boolean) {
    setModel((current) => ({
      ...current,
      [axis]: value,
    }));
  }

  function patchSide(
    side: SideKey,
    updater: (draft: SheetMetalModel["sides"][SideKey]) => SheetMetalModel["sides"][SideKey],
  ) {
    setModel((current) => ({
      ...current,
      sides: { ...current.sides, [side]: updater(current.sides[side]) },
    }));
  }

  function addFlange(side: SideKey) {
    patchSide(side, (draft) => {
      const amount = draft.flanges.length === 0 ? 25 : 20;
      return { ...draft, flanges: [...draft.flanges, createMeasurement(amount)] };
    });
  }

  function addFrez(side: SideKey) {
    patchSide(side, (draft) => ({ ...draft, frezLines: [...draft.frezLines, createMeasurement(24)] }));
  }

  function updateFlange(side: SideKey, index: number, amount: number) {
    patchSide(side, (draft) => ({ ...draft, flanges: replaceMeasurement(draft.flanges, index, amount) }));
  }

  function updateFrez(side: SideKey, index: number, amount: number) {
    patchSide(side, (draft) => ({ ...draft, frezLines: replaceMeasurement(draft.frezLines, index, amount) }));
  }

  function removeFlange(side: SideKey, index: number) {
    patchSide(side, (draft) => ({ ...draft, flanges: removeMeasurement(draft.flanges, index) }));
  }

  function removeFrez(side: SideKey, index: number) {
    patchSide(side, (draft) => ({ ...draft, frezLines: removeMeasurement(draft.frezLines, index) }));
  }

  function setMitre(side: SideKey, position: "start" | "end", value: boolean) {
    const key = position === "start" ? "mitreStart" : "mitreEnd";
    patchSide(side, (draft) => ({ ...draft, [key]: value }));
  }

  function loadPreset(index: number) {
    setModel(structuredClone(presetLibrary[index].model));
  }

  function exportDxf() {
    const contents = buildDxf(geometry.shapes);
    const blob = new Blob([contents], { type: "application/dxf" });
    const link = document.createElement("a");

    const safeName = exportName.trim() || "alugamma-sheet-metal";
    link.href = URL.createObjectURL(blob);
    link.download = `${safeName}-${geometry.totalWidth}x${geometry.totalHeight}.dxf`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <SheetMetalContext.Provider
      value={{
        model,
        exportName,
        setExportName,
        geometry,
        setBaseValue,
        setInvert,
        addFlange,
        addFrez,
        updateFlange,
        updateFrez,
        removeFlange,
        removeFrez,
        setMitre,
        loadPreset,
        exportDxf,
      }}
    >
      {children}
    </SheetMetalContext.Provider>
  );
}
