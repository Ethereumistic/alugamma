import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSheetMetal } from "@/features/sheet-metal/context";
import { presetLibrary } from "@/features/sheet-metal/presets";
import { useWorkspace } from "@/features/workspace/context";

function NavNumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value === 0 ? "" : value.toString()}
          onChange={(event) => {
            const raw = event.target.value.replace(/[^0-9]/g, "");
            onChange(raw === "" ? 0 : Number(raw));
          }}
          className="h-8 w-[80px] bg-black/20 px-2 pr-6 font-mono text-xs transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500"
        />
        <span className="absolute right-2 top-1.5 text-[10px] font-medium text-muted-foreground">mm</span>
      </div>
    </div>
  );
}

export function AppNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSheetMetal = location.pathname.startsWith("/sheet-metal");
  const {
    model,
    designName,
    setDesignName,
    setBaseValue,
    setOffsetCut,
    setInvert,
    loadPreset,
    exportDxf,
    saveDesign,
    isSaving,
  } = useSheetMetal();
  const { selectedProject } = useWorkspace();

  async function handleSave() {
    const designId = await saveDesign();
    if (designId) {
      navigate(`/sheet-metal/${designId}`, { replace: true });
    }
  }

  async function handleExport() {
    const designId = await exportDxf();
    if (designId) {
      navigate(`/sheet-metal/${designId}`, { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-white/5 bg-card/60 px-6 backdrop-blur">
      <SidebarTrigger className="text-muted-foreground hover:text-white" />

      {isSheetMetal && (
        <div className="flex flex-1 items-center gap-4 overflow-x-auto">


          <div className="min-w-[240px] max-w-[340px] flex-1 items-center gap-2 md:flex">
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:block">Design</span>
            <Input
              value={designName}
              onChange={(event) => setDesignName(event.target.value)}
              placeholder="e.g. facade-panel-01"
              className="h-8 border-white/10 bg-black/20 text-xs"
            />
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preset</span>
            <Select
              onValueChange={(value) => {
                loadPreset(Number(value));
                navigate("/sheet-metal");
              }}
            >
              <SelectTrigger className="h-8 w-[170px] border-white/10 bg-black/20 text-xs hover:bg-white/5 focus:ring-1 focus:ring-emerald-500">
                <SelectValue placeholder="Select preset..." />
              </SelectTrigger>
              <SelectContent>
                {presetLibrary.map((preset, index) => (
                  <SelectItem key={preset.name} value={index.toString()}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden h-4 w-px bg-white/10 lg:block" />

          <div className="hidden items-center gap-4 xl:flex">
            <NavNumberField label="W" value={model.baseWidth} onChange={(value) => setBaseValue("baseWidth", value)} />
            <span className="mb-0.5 font-bold text-muted-foreground/30">×</span>
            <NavNumberField label="H" value={model.baseHeight} onChange={(value) => setBaseValue("baseHeight", value)} />
          </div>

          <div className="hidden h-4 w-px bg-white/10 xl:block" />

          <div className="hidden items-center gap-4 2xl:flex">
            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-white">
              <Checkbox
                checked={model.invertX}
                onCheckedChange={(checked) => setInvert("invertX", !!checked)}
                className="h-3.5 w-3.5 border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
              />
              Invert X
            </label>
            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-white">
              <Checkbox
                checked={model.invertY}
                onCheckedChange={(checked) => setInvert("invertY", !!checked)}
                className="h-3.5 w-3.5 border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
              />
              Invert Y
            </label>
            <div className="mx-2 h-4 w-px bg-white/10" />
            <NavNumberField label="OFFSET CUT" value={model.offsetCut} onChange={(value) => setOffsetCut(value)} />
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" className="h-8 px-4 text-xs" onClick={() => void handleSave()} disabled={!selectedProject || isSaving}>
              Save
            </Button>
            <Button
              size="sm"
              className="h-8 px-4 text-xs shadow-[0_0_15px_rgba(20,180,100,0.15)]"
              onClick={() => void handleExport()}
              disabled={!selectedProject || isSaving}
            >
              {isSaving ? "Saving..." : "Save + Export DXF"}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
