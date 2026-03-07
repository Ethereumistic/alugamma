import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSheetMetal } from "@/features/sheet-metal/context";
import { presetLibrary } from "@/features/sheet-metal/presets";

// Using the same NumberField implementation but stylized for nav height
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
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{label}</label>
      <div className="relative">
        <Input
          type="number"
          min={1}
          step={1}
          value={value === 0 ? "" : value}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === "" ? 0 : Number(raw));
          }}
          className="h-8 w-[80px] font-mono bg-black/20 text-xs px-2 pr-6 transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500"
        />
        <span className="absolute right-2 top-1.5 text-[10px] font-medium text-muted-foreground">mm</span>
      </div>
    </div>
  );
}

export function AppNavbar() {
  const location = useLocation();
  const isSheetMetal = location.pathname === "/sheet-metal";
  
  const { model, setBaseValue, setInvert, exportName, setExportName, loadPreset, exportDxf } = isSheetMetal 
    ? useSheetMetal() 
    : { model: null, setBaseValue: null, setInvert: null, exportName: "", setExportName: null, loadPreset: null, exportDxf: null };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-white/5 bg-card/60 px-6 backdrop-blur">
      <SidebarTrigger className="text-muted-foreground hover:text-white" />
      
      {isSheetMetal && model && setBaseValue && setInvert && setExportName && loadPreset && exportDxf && (
        <div className="ml-auto flex flex-1 items-center justify-end gap-6 overflow-x-auto">
          {/* Presets */}
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preset</span>
            <Select onValueChange={(val) => loadPreset(Number(val))}>
              <SelectTrigger className="h-8 w-[180px] text-xs bg-black/20 border-white/10 hover:bg-white/5 focus:ring-1 focus:ring-emerald-500">
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

          <div className="h-4 w-px bg-white/10 hidden lg:block" />

          {/* Model Dimensions */}
          <div className="flex items-center gap-4">
            <NavNumberField
              label="W"
              value={model.baseWidth}
              onChange={(val) => setBaseValue("baseWidth", val)}
            />
            <span className="text-muted-foreground/30 font-bold mb-0.5">×</span>
            <NavNumberField
              label="H"
              value={model.baseHeight}
              onChange={(val) => setBaseValue("baseHeight", val)}
            />
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Invert Controls */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-white cursor-pointer transition-colors whitespace-nowrap">
              <Checkbox 
                checked={model.invertX} 
                onCheckedChange={(c) => setInvert("invertX", !!c)} 
                className="h-3.5 w-3.5 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              Invert X
            </label>
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-white cursor-pointer transition-colors whitespace-nowrap">
              <Checkbox 
                checked={model.invertY} 
                onCheckedChange={(c) => setInvert("invertY", !!c)} 
                className="h-3.5 w-3.5 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              Invert Y
            </label>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Export Controls */}
          <div className="flex items-center gap-3">
             <Input 
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                placeholder="e.g. front-panel-01"
                className="h-8 w-[180px] text-xs bg-black/20"
              />
              <Button size="sm" className="h-8 text-xs px-4 shadow-[0_0_15px_rgba(20,180,100,0.15)]" onClick={exportDxf}>
                Export DXF
              </Button>
          </div>
        </div>
      )}
    </header>
  );
}
