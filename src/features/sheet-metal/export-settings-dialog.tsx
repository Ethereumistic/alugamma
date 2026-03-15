import { Settings2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SheetMetalModel, SideKey } from "@/features/sheet-metal/types";

const allSideKeys: SideKey[] = ["top", "right", "bottom", "left"];

type ExportSettingsDialogProps = {
  model: SheetMetalModel;
  onSetIncludeName: (value: boolean) => void;
  onSetIncludeArrow: (value: boolean) => void;
  onSetArrowDirection: (direction: SideKey) => void;
};

export function ExportSettingsDialog({
  model,
  onSetIncludeName,
  onSetIncludeArrow,
  onSetArrowDirection,
}: ExportSettingsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-white"
          title="Export settings"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-card/95 backdrop-blur-xl sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Export Settings</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure DXF export options for this design.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/6 bg-black/20 p-3 transition-colors hover:bg-white/[0.03]">
            <span className="text-sm text-foreground">Include sheet name</span>
            <Checkbox
              checked={model.includeName}
              onCheckedChange={(checked) => onSetIncludeName(checked === true)}
              className="h-4 w-4 border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
            />
          </label>

          <div className="space-y-2 rounded-lg border border-white/6 bg-black/20 p-3">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-sm text-foreground">Include directional arrow</span>
              <Checkbox
                checked={model.includeArrow}
                onCheckedChange={(checked) => onSetIncludeArrow(checked === true)}
                className="h-4 w-4 border-white/20 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
              />
            </label>

            {model.includeArrow && (
              <div className="mt-3 flex gap-2">
                {allSideKeys.map((dir) => (
                  <Button
                    key={dir}
                    variant={model.arrowDirection === dir ? "default" : "secondary"}
                    size="sm"
                    className={`flex-1 capitalize ${model.arrowDirection === dir ? "bg-blue-600 text-white hover:bg-blue-500" : ""}`}
                    onClick={() => onSetArrowDirection(dir)}
                  >
                    {dir}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
