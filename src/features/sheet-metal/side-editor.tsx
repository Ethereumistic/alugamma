import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getCumulativeOffsets, sumMeasurements } from "@/features/sheet-metal/geometry";
import type { FrezMode, FrezNotchPosition, SideConfig, SideKey } from "@/features/sheet-metal/types";

const cornerLabels: Record<SideKey, { start: string; end: string }> = {
  top: { start: "Left", end: "Right" },
  bottom: { start: "Left", end: "Right" },
  left: { start: "Top", end: "Bottom" },
  right: { start: "Top", end: "Bottom" },
};

const cornerAxisLabel: Record<SideKey, string> = {
  top: "horizontal",
  bottom: "horizontal",
  left: "vertical",
  right: "vertical",
};

type SideEditorProps = {
  side: SideKey;
  label: string;
  accentClass: string;
  config: SideConfig;
  inwardLimit: number;
  outwardLimit: number;
  onAddFlange: () => void;
  onAddFrez: () => void;
  onChangeFlange: (index: number, value: number) => void;
  onChangeFrez: (index: number, value: number) => void;
  onRemoveFlange: (index: number) => void;
  onRemoveFrez: (index: number) => void;
  onSetFrezMode: (mode: FrezMode) => void;
  onSetFrezNotch: (index: number, position: FrezNotchPosition, value: boolean) => void;
  onSetFlangeRelief: (index: number, position: "start" | "end", value: boolean) => void;
};

function MeasurementRow({
  label,
  index,
  value,
  tintClass,
  onChange,
  onRemove,
  controls,
}: {
  label: string;
  index: number;
  value: number;
  tintClass: string;
  onChange: (value: number) => void;
  onRemove: () => void;
  controls?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-black/10 px-2.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="min-w-[50px]">
          <div className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${tintClass}`}>{label}</div>
          <div className="text-[10px] text-muted-foreground">Step {index + 1}</div>
        </div>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value === 0 ? "" : value.toString()}
          onChange={(event) => {
            const raw = event.target.value.replace(/[^0-9]/g, "");
            onChange(raw === "" ? 0 : Number(raw));
          }}
          className="h-8 w-[64px] px-2 text-sm font-mono transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500"
        />
        <div className="flex flex-1 items-center justify-end gap-3 px-1">
          {controls}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SideEditor({
  side,
  label,
  accentClass,
  config,
  inwardLimit,
  outwardLimit,
  onAddFlange,
  onAddFrez,
  onChangeFlange,
  onChangeFrez,
  onRemoveFlange,
  onRemoveFrez,
  onSetFrezMode,
  onSetFrezNotch,
  onSetFlangeRelief,
}: SideEditorProps) {
  const flangeOffsets = getCumulativeOffsets(config.flanges);
  const frezOffsets = getCumulativeOffsets(config.frezLines);
  const frezUnitLabel = config.frezMode === "inner" ? "in" : "out";
  const frezLimit = config.frezMode === "inner" ? inwardLimit : outwardLimit;

  return (
    <Card className="overflow-hidden border-white/10 bg-card/80">
      <CardHeader className="gap-3 border-b border-white/6 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className={`text-lg ${accentClass}`}>{label}</CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onAddFlange}>
              Add flange
            </Button>
            <Button size="sm" className="bg-fuchsia-600 text-white hover:bg-fuchsia-500" onClick={onAddFrez}>
              Add FREZ
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Flanges</p>
            <p className="font-mono text-xs text-foreground">{sumMeasurements(config.flanges)} mm out</p>
          </div>
          {config.flanges.length > 0 ? (
            config.flanges.map((flange, index) => (
              <MeasurementRow
                key={flange.id}
                label="Flange"
                index={index}
                value={flange.amount}
                tintClass="text-emerald-300"
                onChange={(value) => onChangeFlange(index, value)}
                onRemove={() => onRemoveFlange(index)}
                controls={
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-white">
                      <Checkbox
                        checked={flange.reliefs.start}
                        onCheckedChange={(checked) => onSetFlangeRelief(index, "start", !!checked)}
                        className="h-3.5 w-3.5 border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                      />
                      {cornerLabels[side].start} V-notch
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-white">
                      <Checkbox
                        checked={flange.reliefs.end}
                        onCheckedChange={(checked) => onSetFlangeRelief(index, "end", !!checked)}
                        className="h-3.5 w-3.5 border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                      />
                      {cornerLabels[side].end} V-notch
                    </label>
                  </div>
                }
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-2 text-sm text-muted-foreground">
              No flange steps.
            </p>
          )}
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">FREZ</p>
              <p className="text-[11px] text-muted-foreground">Max {frezUnitLabel}: {frezLimit} mm</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 p-1">
              <Button
                type="button"
                size="sm"
                variant={config.frezMode === "inner" ? "secondary" : "ghost"}
                className="h-8 rounded-full px-3"
                onClick={() => onSetFrezMode("inner")}
              >
                Inner
              </Button>
              <Button
                type="button"
                size="sm"
                variant={config.frezMode === "outer" ? "secondary" : "ghost"}
                className="h-8 rounded-full px-3"
                onClick={() => onSetFrezMode("outer")}
              >
                Outer
              </Button>
            </div>
            <p className="font-mono text-xs text-foreground">{sumMeasurements(config.frezLines)} mm {frezUnitLabel}</p>
          </div>
          {config.frezLines.length > 0 ? (
            config.frezLines.map((frez, index) => (
              <MeasurementRow
                key={frez.id}
                label="FREZ"
                index={index}
                value={frez.amount}
                tintClass="text-fuchsia-300"
                onChange={(value) => onChangeFrez(index, value)}
                onRemove={() => onRemoveFrez(index)}
                controls={
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-white">
                      <Checkbox
                        checked={frez.notches.start}
                        onCheckedChange={(checked) => onSetFrezNotch(index, "start", !!checked)}
                        className="h-3.5 w-3.5 border-white/20 data-[state=checked]:border-fuchsia-500 data-[state=checked]:bg-fuchsia-500"
                      />
                      {cornerLabels[side].start} V-notch
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-white">
                      <Checkbox
                        checked={frez.notches.end}
                        onCheckedChange={(checked) => onSetFrezNotch(index, "end", !!checked)}
                        className="h-3.5 w-3.5 border-white/20 data-[state=checked]:border-fuchsia-500 data-[state=checked]:bg-fuchsia-500"
                      />
                      {cornerLabels[side].end} V-notch
                    </label>
                  </div>
                }
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-2 text-sm text-muted-foreground">
              No FREZ steps.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
