import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getCumulativeOffsets, sumMeasurements } from "@/features/sheet-metal/geometry";
import type { SideConfig, SideKey } from "@/features/sheet-metal/types";

const mitreLabels: Record<SideKey, { start: string; end: string }> = {
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
  onAddFlange: () => void;
  onAddFrez: () => void;
  onChangeFlange: (index: number, value: number) => void;
  onChangeFrez: (index: number, value: number) => void;
  onRemoveFlange: (index: number) => void;
  onRemoveFrez: (index: number) => void;
  onSetMitre: (position: "start" | "end", value: boolean) => void;
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
        type="number"
        min={1}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
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
  onAddFlange,
  onAddFrez,
  onChangeFlange,
  onChangeFrez,
  onRemoveFlange,
  onRemoveFrez,
  onSetMitre,
}: SideEditorProps) {
  const flangeOffsets = getCumulativeOffsets(config.flanges);
  const frezOffsets = getCumulativeOffsets(config.frezLines);

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
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white cursor-pointer transition-colors">
              <Checkbox 
                checked={config.mitreStart} 
                onCheckedChange={(c) => onSetMitre("start", !!c)} 
                className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              Mitre {mitreLabels[side].start} Corner
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white cursor-pointer transition-colors">
              <Checkbox 
                checked={config.mitreEnd} 
                onCheckedChange={(c) => onSetMitre("end", !!c)} 
                className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              Mitre {mitreLabels[side].end} Corner
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inner FREZ</p>
              <p className="text-[11px] text-muted-foreground">Max in: {inwardLimit} mm</p>
            </div>
            <p className="font-mono text-xs text-foreground">{sumMeasurements(config.frezLines)} mm in</p>
          </div>
          {config.frezLines.length > 0 ? (
            config.frezLines.map((frez, index) => (
              <MeasurementRow
                key={frez.id}
                label="FREZ"
                index={index}
                value={frez.amount}
                cumulative={frezOffsets[index] ?? 0}
                unitLabel="in"
                tintClass="text-fuchsia-300"
                onChange={(value) => onChangeFrez(index, value)}
                onRemove={() => onRemoveFrez(index)}
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-2 text-sm text-muted-foreground">
              No inner FREZ steps.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
