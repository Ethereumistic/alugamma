import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getCumulativeOffsets, sumMeasurements } from "@/features/sheet-metal/geometry";
import type { FrezMode, SideConfig, SideKey } from "@/features/sheet-metal/types";

const cornerLabels: Record<SideKey, { start: string; end: string }> = {
  top: { start: "Left", end: "Right" },
  bottom: { start: "Left", end: "Right" },
  left: { start: "Top", end: "Bottom" },
  right: { start: "Top", end: "Bottom" },
};

type SideEditorProps = {
  side: SideKey;
  label: string;
  accentClass: string;
  config: SideConfig;
  inwardLimit: number;
  outwardLimit: number;
  cornerState: { start: boolean; end: boolean };
  onAddFlange: () => void;
  onAddFrez: () => void;
  onChangeFlange: (index: number, value: number) => void;
  onChangeFrez: (index: number, value: number) => void;
  onRemoveFlange: (index: number) => void;
  onRemoveFrez: (index: number) => void;
  onSetFrezMode: (mode: FrezMode) => void;
  onSetCornerRelief: (position: "start" | "end", value: boolean) => void;
};

function MeasurementRow({
  label,
  index,
  value,
  cumulative,
  unitLabel,
  tintClass,
  onChange,
  onRemove,
}: {
  label: string;
  index: number;
  value: number;
  cumulative: number;
  unitLabel: string;
  tintClass: string;
  onChange: (value: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[auto,108px,1fr,auto] items-center gap-3 rounded-xl border border-white/6 bg-black/10 px-3 py-2">
      <div className="min-w-0">
        <div className={`text-xs font-semibold uppercase tracking-[0.16em] ${tintClass}`}>{label}</div>
        <div className="text-[11px] text-muted-foreground">Step {index + 1}</div>
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
        className="h-9 font-mono transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500"
      />
      <div className="text-right text-xs text-muted-foreground">
        <div className="font-mono text-sm text-foreground">{cumulative} mm</div>
        <div>{unitLabel}</div>
      </div>
      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onRemove}>
        Remove
      </Button>
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
  cornerState,
  onAddFlange,
  onAddFrez,
  onChangeFlange,
  onChangeFrez,
  onRemoveFlange,
  onRemoveFrez,
  onSetFrezMode,
  onSetCornerRelief,
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
        {config.flanges.length > 0 && (
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-white">
              <Checkbox
                checked={cornerState.start}
                onCheckedChange={(checked) => onSetCornerRelief("start", !!checked)}
                className="border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
              />
              V-notch {cornerLabels[side].start} Corner Relief
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-white">
              <Checkbox
                checked={cornerState.end}
                onCheckedChange={(checked) => onSetCornerRelief("end", !!checked)}
                className="border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
              />
              V-notch {cornerLabels[side].end} Corner Relief
            </label>
          </div>
        )}
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
                cumulative={flangeOffsets[index] ?? 0}
                unitLabel="out"
                tintClass="text-emerald-300"
                onChange={(value) => onChangeFlange(index, value)}
                onRemove={() => onRemoveFlange(index)}
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
                cumulative={frezOffsets[index] ?? 0}
                unitLabel={frezUnitLabel}
                tintClass="text-fuchsia-300"
                onChange={(value) => onChangeFrez(index, value)}
                onRemove={() => onRemoveFrez(index)}
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
