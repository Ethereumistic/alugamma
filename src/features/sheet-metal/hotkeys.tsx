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

function isTextInput(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

function isInsideFlangeInput(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  return isTextInput(e) && target.hasAttribute("data-side");
}

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
      // Ensure mod key is actually pressed to avoid swallowing regular digit typing in inputs
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (isSideSelected) {
        const sideConfig = model.sides[selectedSide];
        if (sideConfig.flanges.length > i) {
          flushSync(() => {
            setSelectedFlangeIndex(i);
          });
          const inputs = document.querySelectorAll<HTMLInputElement>(`input[data-side="${selectedSide}"]`);
          if (inputs.length > i) {
            const el = inputs[i] as HTMLInputElement;
            el.focus();
            el.select();
          }
        }
      }
    });
  }

  useHotkey("W", (e) => { if (isTextInput(e) && !isInsideFlangeInput(e)) return; e.preventDefault(); setSelectedSide("top"); }, { ignoreInputs: false });
  useHotkey("A", (e) => { if (isTextInput(e) && !isInsideFlangeInput(e)) return; e.preventDefault(); setSelectedSide("left"); }, { ignoreInputs: false });
  useHotkey("S", (e) => { if (isTextInput(e) && !isInsideFlangeInput(e)) return; e.preventDefault(); setSelectedSide("bottom"); }, { ignoreInputs: false });
  useHotkey("D", (e) => { if (isTextInput(e) && !isInsideFlangeInput(e)) return; e.preventDefault(); setSelectedSide("right"); }, { ignoreInputs: false });

  useHotkey("Escape", (e) => {
    if (isTextInput(e)) {
      (e.target as HTMLElement).blur();
    } else {
      setSelectedSide(null);
    }
  });

  useHotkey("F", (e) => {
    if (isTextInput(e) && !isInsideFlangeInput(e)) return;
    e.preventDefault();
    if (isSideSelected) {
      // Blur BEFORE flushSync so the browser releases focus ownership
      // before React mutates the DOM — otherwise .focus() on the new
      // input is ignored because the browser still owns the old one.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const newFlangeIndex = model.sides[selectedSide].flanges.length;
      flushSync(() => {
        addFlange(selectedSide);
        setSelectedFlangeIndex(newFlangeIndex);
      });
      setTimeout(() => {
        // data-side is on the <input> itself, not a wrapper — select it directly.
        const inputs = document.querySelectorAll<HTMLInputElement>(`input[data-side="${selectedSide}"]`);
        if (inputs.length > 0) {
          const el = inputs[inputs.length - 1];
          el.focus();
          el.select();
        }
      }, 0);
    }
  }, { ignoreInputs: false, enabled: isSideSelected });

  useHotkey("Z", (e) => {
    if (isTextInput(e) && !isInsideFlangeInput(e)) return;
    e.preventDefault();
    if (isSideSelected) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      flushSync(() => {
        addFrez(selectedSide);
      });
      setTimeout(() => {
        // data-side is on the <input> itself, not a wrapper — select it directly.
        const inputs = document.querySelectorAll<HTMLInputElement>(`input[data-side="${selectedSide}"]`);
        if (inputs.length > 0) {
          const el = inputs[inputs.length - 1];
          el.focus();
          el.select();
        }
      }, 0);
    }
  }, { ignoreInputs: false, enabled: isSideSelected });

  useHotkey("Shift+F", (e) => {
    if (isTextInput(e) && !isInsideFlangeInput(e)) return;
    e.preventDefault();
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      if (sideConfig.flanges.length > 0) {
        removeFlange(selectedSide, sideConfig.flanges.length - 1);
        if (selectedFlangeIndex === sideConfig.flanges.length - 1) {
          setSelectedFlangeIndex(sideConfig.flanges.length - 2 >= 0 ? sideConfig.flanges.length - 2 : null);
        }
      }
    }
  }, { ignoreInputs: false, enabled: isSideSelected });

  useHotkey("Shift+Z", (e) => {
    if (isTextInput(e) && !isInsideFlangeInput(e)) return;
    e.preventDefault();
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      if (sideConfig.frezLines.length > 0) {
        removeFrez(selectedSide, sideConfig.frezLines.length - 1);
      }
    }
  }, { ignoreInputs: false, enabled: isSideSelected });

  useHotkey("Q", (e) => {
    if (isTextInput(e) && !isInsideFlangeInput(e)) return;
    e.preventDefault();
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      const targetIndex = selectedFlangeIndex !== null && selectedFlangeIndex < sideConfig.flanges.length
        ? selectedFlangeIndex
        : sideConfig.flanges.length - 1;

      if (targetIndex >= 0) {
        setFlangeRelief(selectedSide, targetIndex, "start", !sideConfig.flanges[targetIndex].reliefs.start);
      }
    }
  }, { ignoreInputs: false, enabled: isSideSelected });

  useHotkey("E", (e) => {
    if (isTextInput(e) && !isInsideFlangeInput(e)) return;
    e.preventDefault();
    if (isSideSelected) {
      const sideConfig = model.sides[selectedSide];
      const targetIndex = selectedFlangeIndex !== null && selectedFlangeIndex < sideConfig.flanges.length
        ? selectedFlangeIndex
        : sideConfig.flanges.length - 1;

      if (targetIndex >= 0) {
        setFlangeRelief(selectedSide, targetIndex, "end", !sideConfig.flanges[targetIndex].reliefs.end);
      }
    }
  }, { ignoreInputs: false, enabled: isSideSelected });

  return null;
}