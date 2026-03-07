import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSheetMetal } from "@/features/sheet-metal/context";
import { countShapes, getSideTotal } from "@/features/sheet-metal/geometry";
import { PreviewCanvas } from "@/features/sheet-metal/preview-canvas";
import { SideEditor } from "@/features/sheet-metal/side-editor";
import { type SideKey } from "@/features/sheet-metal/types";

const sideMeta: Record<SideKey, { label: string; accentClass: string }> = {
  top: { label: "Top side", accentClass: "text-sky-400" },
  right: { label: "Right side", accentClass: "text-amber-400" },
  bottom: { label: "Bottom side", accentClass: "text-emerald-400" },
  left: { label: "Left side", accentClass: "text-violet-400" },
};

const sideKeysTopBottom: SideKey[] = ["top", "bottom"];
const sideKeysLeftRight: SideKey[] = ["left", "right"];
const allSideKeys: SideKey[] = ["top", "right", "bottom", "left"];

export default function SheetMetalApp() {
  const {
    model,
    geometry,
    addFlange,
    addFrez,
    updateFlange,
    updateFrez,
    removeFlange,
    removeFrez,
    setMitre,
  } = useSheetMetal();

  if (!model || !geometry) return null;

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-6 px-4 py-6 lg:px-8">
      {/* 
        MAIN CONTENT LAYOUT:
        Left Column: Totals + Top Side Edge + Bottom Side Edge
        Right Column: STICKY Live Preview + Left Side Edge + Right Side Edge
      */}
      <div className="grid gap-6 xl:grid-cols-[400px,minmax(0,1fr)] items-start">

        {/* LEFT COLUMN: Top / Bottom Side Editors */}
        <aside className="flex flex-col gap-6">


          {sideKeysTopBottom.map((side) => (
            <SideEditor
              key={side}
              side={side}
              label={sideMeta[side].label}
              accentClass={sideMeta[side].accentClass}
              config={model.sides[side]}
              inwardLimit={side === "left" || side === "right" ? model.baseWidth : model.baseHeight}
              onAddFlange={() => addFlange(side)}
              onAddFrez={() => addFrez(side)}
              onChangeFlange={(index, value) => updateFlange(side, index, value)}
              onChangeFrez={(index, value) => updateFrez(side, index, value)}
              onRemoveFlange={(index) => removeFlange(side, index)}
              onRemoveFrez={(index) => removeFrez(side, index)}
              onSetMitre={(position, value) => setMitre(side, position, value)}
            />
          ))}
          <Card className="border-white/10 bg-card/80">
            <CardHeader className="pb-3 border-b border-white/5 bg-white/[0.02]">
              <CardTitle>Current totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {allSideKeys.map((side) => (
                <div key={side} className="flex justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm">
                  <span className={`font-medium ${sideMeta[side].accentClass}`}>{sideMeta[side].label}</span>
                  <span className="font-mono text-muted-foreground">
                    {getSideTotal(model, side, "flanges")}/{getSideTotal(model, side, "frezLines")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* RIGHT COLUMN: Sticky Preview & Left / Right Side Editors */}
        <main className="flex flex-col gap-6">

          {/* STICKY LIVE PREVIEW */}
          <div className="sticky top-6 z-20">
            <Card className="overflow-hidden border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl">
              <CardHeader className="flex flex-col gap-4 border-b border-white/6 bg-white/[0.02] pb-4 md:flex-row md:items-end md:justify-between px-5 pt-5">
                <CardTitle>Live Preview</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="cut">CUT ({countShapes(geometry.shapes, "CUT")})</Badge>
                  <Badge variant="frez">FREZ ({countShapes(geometry.shapes, "FREZ")})</Badge>
                  <Badge variant="outline">{geometry.totalWidth} x {geometry.totalHeight} mm</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="panel-grid relative overflow-hidden rounded-[1.25rem] border border-white/8 bg-[#090d16] p-2">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_34%)]" />
                  <div className="relative h-[480px] w-full">
                    {/* Kept height slightly shorter to allow viewing the cards clearly below it on 1080p screens */}
                    <PreviewCanvas geometry={geometry} />
                  </div>
                </div>

                {geometry.warnings.length > 0 && (
                  <div className="mt-4 rounded-xl relative overflow-hidden border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                    <strong className="font-semibold block mb-1">Geometry warnings</strong>
                    <ul className="list-inside list-disc opacity-90">
                      {geometry.warnings.map(w => <li key={w}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* BELOW PREVIEW: Left & Right Side Editors */}
          <div className="grid gap-6 2xl:grid-cols-2">
            {sideKeysLeftRight.map((side) => (
              <SideEditor
                key={side}
                side={side}
                label={sideMeta[side].label}
                accentClass={sideMeta[side].accentClass}
                config={model.sides[side]}
                inwardLimit={side === "left" || side === "right" ? model.baseWidth : model.baseHeight}
                onAddFlange={() => addFlange(side)}
                onAddFrez={() => addFrez(side)}
                onChangeFlange={(index, value) => updateFlange(side, index, value)}
                onChangeFrez={(index, value) => updateFrez(side, index, value)}
                onRemoveFlange={(index) => removeFlange(side, index)}
                onRemoveFrez={(index) => removeFrez(side, index)}
                onSetMitre={(position, value) => setMitre(side, position, value)}
              />
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
