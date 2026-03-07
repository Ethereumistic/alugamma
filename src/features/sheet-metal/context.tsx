import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { buildDxf } from "@/features/sheet-metal/dxf";
import { computeSheetMetalGeometry } from "@/features/sheet-metal/geometry";
import { presetLibrary } from "@/features/sheet-metal/presets";
import {
  createFrezMeasurement,
  createFlangeMeasurement,
  normalizeSheetMetalModel,
  type CornerKey,
  type CornerReliefAxis,
  type FrezMode,
  type FrezNotchPosition,
  type Measurement,
  type SheetMetalModel,
  type SideKey,
} from "@/features/sheet-metal/types";
import { useWorkspace } from "@/features/workspace/context";

function replaceMeasurement<T extends { amount: number }>(items: T[], index: number, amount: number) {
  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, amount: Math.max(0, Math.round(amount)) } : item,
  );
}

function removeMeasurement<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

type SavedDesignSummary = {
  id: Id<"designs">;
  name: string;
  exportName: string;
  model: SheetMetalModel;
  updatedAt: number;
  lastExportedAt: number | null;
  updatedByName: string;
};

type SheetMetalStatus = {
  tone: "info" | "success" | "error";
  message: string;
};

type SheetMetalContextType = {
  model: SheetMetalModel;
  designName: string;
  setDesignName: (name: string) => void;
  geometry: ReturnType<typeof computeSheetMetalGeometry>;
  selectedDesignId: Id<"designs"> | null;
  savedDesigns: SavedDesignSummary[];
  isSaving: boolean;
  status: SheetMetalStatus | null;
  setBaseValue: (key: "baseWidth" | "baseHeight", value: number) => void;
  setOffsetCut: (value: number) => void;
  setInvert: (axis: "invertX" | "invertY", value: boolean) => void;
  addFlange: (side: SideKey) => void;
  addFrez: (side: SideKey) => void;
  updateFlange: (side: SideKey, index: number, amount: number) => void;
  updateFrez: (side: SideKey, index: number, amount: number) => void;
  removeFlange: (side: SideKey, index: number) => void;
  removeFrez: (side: SideKey, index: number) => void;
  setFrezMode: (side: SideKey, mode: FrezMode) => void;
  setFrezNotch: (side: SideKey, index: number, position: FrezNotchPosition, value: boolean) => void;
  setFlangeRelief: (side: SideKey, index: number, position: "start" | "end", value: boolean) => void;
  setCornerRelief: (corner: CornerKey, axis: CornerReliefAxis, value: boolean) => void;
  loadPreset: (index: number) => void;
  startNewDesign: () => void;
  loadSavedDesign: (designId: Id<"designs">) => void;
  saveDesign: (options?: { markExported?: boolean }) => Promise<Id<"designs"> | null>;
  exportDxf: () => Promise<Id<"designs"> | null>;
  clearStatus: () => void;
};

const SheetMetalContext = createContext<SheetMetalContextType | null>(null);

function cloneModel(model: SheetMetalModel) {
  return structuredClone(normalizeSheetMetalModel(model));
}

function buildPresetDraft(index: number) {
  const preset = presetLibrary[index] ?? presetLibrary[0];

  return {
    model: cloneModel(preset.model),
    designName: preset.name,
  };
}

function sanitizeFileName(name: string) {
  return name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "-") || "alugamma";
}

export function useSheetMetal() {
  const context = useContext(SheetMetalContext);
  if (!context) {
    throw new Error("useSheetMetal must be used within a SheetMetalProvider");
  }
  return context;
}

export function SheetMetalProvider({ children }: { children: ReactNode }) {
  const { selectedProjectId } = useWorkspace();
  const defaultDraft = buildPresetDraft(1);
  const [model, setModel] = useState<SheetMetalModel>(() => defaultDraft.model);
  const [designName, setDesignName] = useState(defaultDraft.designName);
  const [selectedDesignId, setSelectedDesignId] = useState<Id<"designs"> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<SheetMetalStatus | null>(null);
  const saveDesignMutation = useMutation(api.designs.saveDesign);
  const rawSavedDesigns =
    (useQuery(api.designs.listByProject, selectedProjectId ? { projectId: selectedProjectId } : "skip") as
      | SavedDesignSummary[]
      | undefined) ?? [];
  const savedDesigns = useMemo(
    () => rawSavedDesigns.map((design) => ({ ...design, model: normalizeSheetMetalModel(design.model) })),
    [rawSavedDesigns],
  );
  const geometry = computeSheetMetalGeometry(model);

  useEffect(() => {
    const nextDraft = selectedProjectId ? buildPresetDraft(0) : buildPresetDraft(1);
    setModel(nextDraft.model);
    setDesignName(nextDraft.designName);
    setSelectedDesignId(null);
    setStatus(null);
  }, [selectedProjectId]);

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

  function setOffsetCut(value: number) {
    setModel((current) => ({
      ...current,
      offsetCut: value,
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
      return { ...draft, flanges: [...draft.flanges, createFlangeMeasurement(amount)] };
    });
  }

  function addFrez(side: SideKey) {
    patchSide(side, (draft) => ({ ...draft, frezLines: [...draft.frezLines, createFrezMeasurement(24)] }));
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

  function setFrezMode(side: SideKey, mode: FrezMode) {
    patchSide(side, (draft) => ({ ...draft, frezMode: mode }));
  }

  function setFrezNotch(side: SideKey, index: number, position: FrezNotchPosition, value: boolean) {
    patchSide(side, (draft) => ({
      ...draft,
      frezLines: draft.frezLines.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              notches: {
                ...line.notches,
                [position]: value,
              },
            }
          : line,
      ),
    }));
  }

  function setFlangeRelief(side: SideKey, index: number, position: "start" | "end", value: boolean) {
    patchSide(side, (draft) => ({
      ...draft,
      flanges: draft.flanges.map((flange, flangeIndex) =>
        flangeIndex === index
          ? {
              ...flange,
              reliefs: {
                ...flange.reliefs,
                [position]: value,
              },
            }
          : flange,
      ),
    }));
  }

  function setCornerRelief(corner: CornerKey, axis: CornerReliefAxis, value: boolean) {
    setModel((current) => ({
      ...current,
      cornerReliefs: {
        ...current.cornerReliefs,
        [corner]: {
          ...current.cornerReliefs[corner],
          [axis]: value,
        },
      },
    }));
  }

  function loadPreset(index: number) {
    const draft = buildPresetDraft(index);
    setModel(draft.model);
    setDesignName(draft.designName);
    setSelectedDesignId(null);
    setStatus({ tone: "info", message: `Loaded preset \"${draft.designName}\".` });
  }

  function startNewDesign() {
    const draft = buildPresetDraft(0);
    setModel(draft.model);
    setDesignName(draft.designName);
    setSelectedDesignId(null);
    setStatus({ tone: "info", message: "Started a new blank design draft." });
  }

  function loadSavedDesign(designId: Id<"designs">) {
    const design = savedDesigns.find((item) => item.id === designId);

    if (!design) {
      setStatus({ tone: "error", message: "Saved design not found in the selected project." });
      return;
    }

    setModel(cloneModel(design.model));
    setDesignName(design.name);
    setSelectedDesignId(design.id);
    setStatus({ tone: "success", message: `Loaded \"${design.name}\".` });
  }

  async function saveDesign(options?: { markExported?: boolean }) {
    if (!selectedProjectId) {
      setStatus({ tone: "error", message: "Select a project before saving or exporting." });
      return null;
    }

    const trimmedDesignName = designName.trim();

    if (trimmedDesignName.length < 2) {
      setStatus({ tone: "error", message: "Design name must be at least 2 characters." });
      return null;
    }

    const normalizedModel = normalizeSheetMetalModel(model);

    setIsSaving(true);
    setStatus({
      tone: "info",
      message: options?.markExported ? "Saving design and recording export..." : "Saving design...",
    });

    try {
      const result = await saveDesignMutation({
        designId: selectedDesignId ?? undefined,
        projectId: selectedProjectId,
        name: trimmedDesignName,
        exportName: trimmedDesignName,
        model: normalizedModel,
        markExported: options?.markExported ?? false,
      });

      setModel(normalizedModel);
      setSelectedDesignId(result.designId);
      setStatus({
        tone: "success",
        message: options?.markExported ? "Design saved and export registered." : "Design saved.",
      });

      return result.designId;
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to save the current design.",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function exportDxf() {
    const persistedDesignId = await saveDesign({ markExported: true });
    if (!persistedDesignId) {
      return null;
    }

    const contents = buildDxf(geometry.shapes);
    const blob = new Blob([contents], { type: "application/dxf" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFileName(designName)}.dxf`;
    link.click();
    URL.revokeObjectURL(link.href);

    return persistedDesignId;
  }

  return (
    <SheetMetalContext.Provider
      value={{
        model,
        designName,
        setDesignName,
        geometry,
        selectedDesignId,
        savedDesigns,
        isSaving,
        status,
        setBaseValue,
        setOffsetCut,
        setInvert,
        addFlange,
        addFrez,
        updateFlange,
        updateFrez,
        removeFlange,
        removeFrez,
        setFrezMode,
        setFrezNotch,
        setFlangeRelief,
        setCornerRelief,
        loadPreset,
        startNewDesign,
        loadSavedDesign,
        saveDesign,
        exportDxf,
        clearStatus: () => setStatus(null),
      }}
    >
      {children}
    </SheetMetalContext.Provider>
  );
}
