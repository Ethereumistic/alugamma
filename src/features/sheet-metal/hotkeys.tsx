import { useNavigate } from "react-router-dom";
import { useHotkey, useHotkeySequence } from "@tanstack/react-hotkeys";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useSheetMetal } from "./context";
import { useSelectedSide } from "./selected-side-context";
import { useDesignDelete } from "@/features/workspace/design-delete-context";
import { useWorkspace } from "@/features/workspace/context";
import type { SideKey } from "./types";

type SheetMetalHotkeysProps = {
  previewCanvasRef?: React.RefObject<{ centerView: () => void }>;
};

export function SheetMetalHotkeys({ previewCanvasRef }: SheetMetalHotkeysProps) {
  const navigate = useNavigate();
  const { saveDesign, exportDxf, startNewDesign, model, selectedDesignId, setRubberband, addFlange, addFrez, setFlangeRelief } = useSheetMetal();
  const { selectedSide, setSelectedSide } = useSelectedSide();
  const { setDesignToDelete } = useDesignDelete();
  const { selectedProjectId } = useWorkspace();
  const deleteDesign = useMutation(api.designs.deleteDesign);
  const duplicateDesign = useMutation(api.designs.duplicateDesign);

  const isSideSelected = selectedSide !== null;
  const canSave = selectedProjectId !== null;

  useHotkey("Mod+S", () => {
    if (canSave) {
      saveDesign();
    }
  });

  useHotkey("Mod+N", () => {
    startNewDesign();
    navigate("/sheet-metal/new");
  });

  useHotkey("Mod+Delete", () => {
    if (selectedDesignId) {
      setDesignToDelete(selectedDesignId);
    }
  });

  useHotkey("Mod+Shift+Delete", async () => {
    if (selectedDesignId) {
      await deleteDesign({ designId: selectedDesignId });
      navigate("/sheet-metal/new");
    }
  });

  useHotkey("Mod+R", () => {
    setRubberband(!model.rubberband);
  });

  useHotkey("Mod+F", () => {
    previewCanvasRef?.current?.centerView();
  });

  useHotkeySequence(["Mod+S", "D"], async () => {
    const designId = await saveDesign();
    if (designId && selectedProjectId) {
      const newId = await duplicateDesign({ designId });
      navigate(`/sheet-metal/${newId}`);
    }
  });

  useHotkeySequence(["Mod+S", "E"], async () => {
    await exportDxf();
  });

  useHotkey("W", () => setSelectedSide("top"), { ignoreInputs: true });
  useHotkey("A", () => setSelectedSide("left"), { ignoreInputs: true });
  useHotkey("S", () => setSelectedSide("bottom"), { ignoreInputs: true });
  useHotkey("D", () => setSelectedSide("right"), { ignoreInputs: true });

  useHotkey("Escape", () => setSelectedSide(null));

  useHotkey("F", () => {
    if (isSideSelected) {
      addFlange(selectedSide);
      setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-side="${selectedSide}"] input[type="text"]`);
        if (inputs.length > 0) {
          (inputs[inputs.length - 1] as HTMLInputElement).focus();
        }
      }, 0);
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  useHotkey("Z", () => {
    if (isSideSelected) {
      addFrez(selectedSide);
      setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-side="${selectedSide}"] input[type="text"]`);
        if (inputs.length > 0) {
          (inputs[inputs.length - 1] as HTMLInputElement).focus();
        }
      }, 0);
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  useHotkey("Q", () => {
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      if (sideConfig.flanges.length > 0) {
        setFlangeRelief(selectedSide, sideConfig.flanges.length - 1, "start", !sideConfig.flanges[sideConfig.flanges.length - 1].reliefs.start);
      }
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  useHotkey("E", () => {
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      if (sideConfig.flanges.length > 0) {
        setFlangeRelief(selectedSide, sideConfig.flanges.length - 1, "end", !sideConfig.flanges[sideConfig.flanges.length - 1].reliefs.end);
      }
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  return null;
}
