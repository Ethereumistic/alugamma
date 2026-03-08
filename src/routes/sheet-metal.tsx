import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useSheetMetal } from "@/features/sheet-metal/context";
import { countShapes, getSideTotal } from "@/features/sheet-metal/geometry";
import { PreviewCanvas } from "@/features/sheet-metal/preview-canvas";
import { SideEditor } from "@/features/sheet-metal/side-editor";
import { type CornerKey, type CornerReliefAxis, type SideKey } from "@/features/sheet-metal/types";
import { useWorkspace } from "@/features/workspace/context";
import type { Id } from "../../convex/_generated/dataModel";

const sideMeta: Record<SideKey, { label: string; accentClass: string }> = {
  top: { label: "Top side", accentClass: "text-sky-400" },
  right: { label: "Right side", accentClass: "text-amber-400" },
  bottom: { label: "Bottom side", accentClass: "text-emerald-400" },
  left: { label: "Left side", accentClass: "text-violet-400" },
};

const sideCornerMap: Record<SideKey, { start: CornerKey; end: CornerKey }> = {
  top: { start: "topLeft", end: "topRight" },
  right: { start: "topRight", end: "bottomRight" },
  bottom: { start: "bottomLeft", end: "bottomRight" },
  left: { start: "topLeft", end: "bottomLeft" },
};

const sideCornerAxis: Record<SideKey, CornerReliefAxis> = {
  top: "horizontal",
  right: "vertical",
  bottom: "horizontal",
  left: "vertical",
};

const sideKeysTopBottom: SideKey[] = ["top", "bottom"];
const sideKeysLeftRight: SideKey[] = ["left", "right"];
const allSideKeys: SideKey[] = ["top", "right", "bottom", "left"];

export default function SheetMetalApp() {
  const { designId } = useParams<{ designId?: string }>();
  const isNewDesign = !designId || designId === "new";
  const {
    model,
    geometry,
    selectedDesignId,
    savedDesigns,
    status,
    addFlange,
    addFrez,
    updateFlange,
    updateFrez,
    removeFlange,
    removeFrez,
    setFrezMode,
    setFrezNotch,
    setFlangeRelief,
    setIncludeName,
    setIncludeArrow,
    setArrowDirection,
    startNewDesign,
    loadSavedDesign,
  } = useSheetMetal();
  const {
    authenticated,
    isLoadingWorkspace,
    projects,
    selectedProject,
    selectedProjectId,
    setSelectedOrganizationId,
    setSelectedProjectId,
  } = useWorkspace();

  const routedProject = designId ? projects.find((project) => project.designs.some((design) => design.id === designId)) ?? null : null;

  useEffect(() => {
    if (!designId || designId === "new" || !routedProject) {
      return;
    }

    if (selectedProjectId !== routedProject.id) {
      setSelectedOrganizationId(routedProject.organizationId);
      setSelectedProjectId(routedProject.id);
    }
  }, [designId, routedProject, selectedProjectId, setSelectedOrganizationId, setSelectedProjectId]);

  useEffect(() => {
    if (isNewDesign) {
      if (selectedDesignId !== null) {
        startNewDesign();
      }
      return;
    }

    if (!routedProject || selectedProjectId !== routedProject.id) {
      return;
    }

    if (selectedDesignId === designId) {
      return;
    }

    if (savedDesigns.some((design) => design.id === designId)) {
      loadSavedDesign(designId as Id<"designs">);
    }
  }, [designId, isNewDesign, loadSavedDesign, routedProject, savedDesigns, selectedDesignId, selectedProjectId, startNewDesign]);

  if (isLoadingWorkspace) {
    return (
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-6 px-4 py-6 lg:px-8">
        <Card className="border-white/10 bg-card/80">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading project workspace...</CardContent>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
        <Card className="border-white/10 bg-card/85">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>The editor is available, but saving DXF design data requires a signed-in Convex workspace account.</p>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Open workspace dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (designId && designId !== "new" && !routedProject) {
    return (
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
        <Card className="border-white/10 bg-card/85">
          <CardHeader>
            <CardTitle>Design not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>This design ID does not exist in your accessible projects, or you no longer have access to it.</p>
            <Button asChild>
              <Link to="/">Go to workspace dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedProjectId || !selectedProject) {
    return (
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
        <Card className="border-white/10 bg-card/85">
          <CardHeader>
            <CardTitle>Select a project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>DXF exports are stored as reusable design data inside a project. Choose or create a project first.</p>
            <Button asChild>
              <Link to="/">Go to workspace dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-6 px-4 py-6 lg:px-8">
      {status && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${status.tone === "error"
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : status.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              : "border-white/10 bg-black/20 text-slate-200"
            }`}
        >
          {status.message}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[400px,minmax(0,1fr)]">
        <aside className="flex flex-col gap-6">
          {sideKeysTopBottom.map((side) => {
            const axis = sideCornerAxis[side];
            return (
              <SideEditor
                key={side}
                side={side}
                label={sideMeta[side].label}
                accentClass={sideMeta[side].accentClass}
                config={model.sides[side]}
                inwardLimit={side === "left" || side === "right" ? model.baseWidth : model.baseHeight}
                outwardLimit={geometry.flangeDepths[side]}
                onAddFlange={() => addFlange(side)}
                onAddFrez={() => addFrez(side)}
                onChangeFlange={(index, value) => updateFlange(side, index, value)}
                onChangeFrez={(index, value) => updateFrez(side, index, value)}
                onRemoveFlange={(index) => removeFlange(side, index)}
                onRemoveFrez={(index) => removeFrez(side, index)}
                onSetFrezMode={(mode) => setFrezMode(side, mode)}
                onSetFrezNotch={(index, position, value) => setFrezNotch(side, index, position, value)}
                onSetFlangeRelief={(index, position, value) => setFlangeRelief(side, index, position, value)}
              />
            );
          })}
          <Card className="border-white/10 bg-card/80">
            <CardHeader className="border-b border-white/5 bg-white/[0.02] pb-3">
              <CardTitle>Export Options & Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">DXF Export</p>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 p-3 transition-colors hover:bg-white/[0.02]">
                  <span className="text-sm text-foreground">Include sheet name</span>
                  <Checkbox
                    checked={model.includeName}
                    onCheckedChange={(checked) => setIncludeName(checked === true)}
                    className="h-4 w-4 border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                  />
                </label>

                <div className="space-y-2 rounded-lg border border-white/5 bg-black/20 p-3">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="text-sm text-foreground">Include directional arrow</span>
                    <Checkbox
                      checked={model.includeArrow}
                      onCheckedChange={(checked) => setIncludeArrow(checked === true)}
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
                          className={`flex-1 capitalize ${model.arrowDirection === dir ? "bg-blue-600 hover:bg-blue-500 text-white" : ""}`}
                          onClick={() => setArrowDirection(dir)}
                        >
                          {dir}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>


            </CardContent>
          </Card>
        </aside>

        <main className="flex flex-col gap-6">
          <div className="sticky top-6 z-20">
            <Card className="overflow-hidden border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl">
              <CardHeader className="flex flex-col gap-4 border-b border-white/6 bg-white/[0.02] px-5 pb-4 pt-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>Live Preview</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedProject.name} production geometry</p>
                </div>
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
                    <PreviewCanvas geometry={geometry} />
                  </div>
                </div>

                {geometry.warnings.length > 0 && (
                  <div className="relative mt-4 overflow-hidden rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                    <strong className="mb-1 block font-semibold">Geometry warnings</strong>
                    <ul className="list-inside list-disc opacity-90">
                      {geometry.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 2xl:grid-cols-2">
            {sideKeysLeftRight.map((side) => {
              const axis = sideCornerAxis[side];
              return (
                <SideEditor
                  key={side}
                  side={side}
                  label={sideMeta[side].label}
                  accentClass={sideMeta[side].accentClass}
                  config={model.sides[side]}
                  inwardLimit={side === "left" || side === "right" ? model.baseWidth : model.baseHeight}
                  outwardLimit={geometry.flangeDepths[side]}
                  onAddFlange={() => addFlange(side)}
                  onAddFrez={() => addFrez(side)}
                  onChangeFlange={(index, value) => updateFlange(side, index, value)}
                  onChangeFrez={(index, value) => updateFrez(side, index, value)}
                  onRemoveFlange={(index) => removeFlange(side, index)}
                  onRemoveFrez={(index) => removeFrez(side, index)}
                  onSetFrezMode={(mode) => setFrezMode(side, mode)}
                  onSetFrezNotch={(index, position, value) => setFrezNotch(side, index, position, value)}
                  onSetFlangeRelief={(index, position, value) => setFlangeRelief(side, index, position, value)}
                />
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
