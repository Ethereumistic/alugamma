import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
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
  const { saveDesign, exportDxf, startNewDesign, model, selectedDesignId, setRubberband, addFlange, addFrez, setFlangeRelief, undo, removeFlange, removeFrez } = useSheetMetal();
  const { selectedSide, setSelectedSide, selectedFlangeIndex, setSelectedFlangeIndex } = useSelectedSide();
  const { setDesignToDelete } = useDesignDelete();
  const { selectedProjectId } = useWorkspace();
  const deleteDesign = useMutation(api.designs.deleteDesign);
  const duplicateDesign = useMutation(api.designs.duplicateDesign);

  const isSideSelected = selectedSide !== null;
  const canSave = selectedProjectId !== null;

  useHotkey("Mod+S", (e) => {
    e.preventDefault();
    if (canSave) {
      saveDesign();
    }
  });

  useHotkey("Mod+N", (e) => {
    e.preventDefault();
    startNewDesign();
    navigate("/sheet-metal/new");
  });

  useHotkey("Mod+D", (e) => {
    // Prevent standard browser bookmarking behavior everywhere inside the sheet metal app
    e.preventDefault();
  });

  useHotkey("Mod+Z", (e) => {
    e.preventDefault();
    undo();
  });

  useHotkey("Mod+Delete", (e) => {
    e.preventDefault();
    if (selectedDesignId) {
      setDesignToDelete(selectedDesignId);
    }
  });

  useHotkey("Mod+Shift+Delete", async (e) => {
    e.preventDefault();
    if (selectedDesignId) {
      await deleteDesign({ designId: selectedDesignId });
      navigate("/sheet-metal/new");
    }
  });

  useHotkey("Mod+R", (e) => {
    e.preventDefault();
    setRubberband(!model.rubberband);
  });

  useHotkey("Mod+F", (e) => {
    e.preventDefault();
    previewCanvasRef?.current?.centerView();
  });

  useHotkeySequence(["Mod+S", "D"], async (e) => {
    // Note: react-hotkeys doesn't pass the react event to sequence handlers sometimes, but we prevented default in Mod+S anyway
    const designId = await saveDesign();
    if (designId && selectedProjectId) {
      const newId = await duplicateDesign({ designId });
      navigate(`/sheet-metal/${newId}`);
    }
  });

  useHotkeySequence(["Mod+S", "E"], async () => {
    await exportDxf();
  });

  // Numbers 1-9 to select a flange in the selected side
  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  for (let i = 0; i < numbers.length; i++) {
    const num = numbers[i];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkey(`Mod+${num}` as any, (e) => {
      e.preventDefault();
      if (isSideSelected) {
        const sideConfig = model.sides[selectedSide];
        if (sideConfig.flanges.length > i) {
          flushSync(() => {
             setSelectedFlangeIndex(i);
          });
          const inputs = document.querySelectorAll(`[data-side="${selectedSide}"] input[type="text"]`);
          if (inputs.length > i) {
            const el = inputs[i] as HTMLInputElement;
            el.focus();
            el.select();
          }
        }
      }
    });
  }

  useHotkey("W", () => setSelectedSide("top"), { ignoreInputs: true });
  useHotkey("A", () => setSelectedSide("left"), { ignoreInputs: true });
  useHotkey("S", () => setSelectedSide("bottom"), { ignoreInputs: true });
  useHotkey("D", () => setSelectedSide("right"), { ignoreInputs: true });

  useHotkey("Escape", () => setSelectedSide(null));

  useHotkey("F", () => {
    if (isSideSelected) {
      flushSync(() => {
        addFlange(selectedSide);
        setSelectedFlangeIndex(model.sides[selectedSide].flanges.length); // The new one will be at current length
      });
      const inputs = document.querySelectorAll(`[data-side="${selectedSide}"] input[type="text"]`);
      if (inputs.length > 0) {
        const el = inputs[inputs.length - 1] as HTMLInputElement;
        el.focus();
        el.select();
      }
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  useHotkey("Z", () => {
    if (isSideSelected) {
      flushSync(() => {
        addFrez(selectedSide);
      });
      const inputs = document.querySelectorAll(`[data-side="${selectedSide}"] input[type="text"]`);
      if (inputs.length > 0) {
        const el = inputs[inputs.length - 1] as HTMLInputElement;
        el.focus();
        el.select();
      }
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  useHotkey("Shift+F", () => {
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      if (sideConfig.flanges.length > 0) {
        removeFlange(selectedSide, sideConfig.flanges.length - 1);
        if (selectedFlangeIndex === sideConfig.flanges.length - 1) {
           setSelectedFlangeIndex(sideConfig.flanges.length - 2 >= 0 ? sideConfig.flanges.length - 2 : null);
        }
      }
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  useHotkey("Shift+Z", () => {
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      if (sideConfig.frezLines.length > 0) {
        removeFrez(selectedSide, sideConfig.frezLines.length - 1);
      }
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  useHotkey("Q", () => {
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      const targetIndex = selectedFlangeIndex !== null && selectedFlangeIndex < sideConfig.flanges.length 
        ? selectedFlangeIndex 
        : sideConfig.flanges.length - 1;

      if (targetIndex >= 0) {
        setFlangeRelief(selectedSide, targetIndex, "start", !sideConfig.flanges[targetIndex].reliefs.start);
      }
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  useHotkey("E", () => {
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      const targetIndex = selectedFlangeIndex !== null && selectedFlangeIndex < sideConfig.flanges.length 
        ? selectedFlangeIndex 
        : sideConfig.flanges.length - 1;

      if (targetIndex >= 0) {
        setFlangeRelief(selectedSide, targetIndex, "end", !sideConfig.flanges[targetIndex].reliefs.end);
      }
    }
  }, { ignoreInputs: true, enabled: isSideSelected });

  return null;
}
