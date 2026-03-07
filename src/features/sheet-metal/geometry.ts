import {
  sideKeys,
  type GeometryResult,
  type LineShape,
  type Measurement,
  type SheetMetalModel,
  type SideKey,
} from "@/features/sheet-metal/types";

function addLine(
  shapes: LineShape[],
  layer: LineShape["layer"],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  shapes.push({ type: "line", layer, x1, y1, x2, y2 });
}

function addRect(
  shapes: LineShape[],
  layer: LineShape["layer"],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  addLine(shapes, layer, x0, y0, x1, y0);
  addLine(shapes, layer, x1, y0, x1, y1);
  addLine(shapes, layer, x1, y1, x0, y1);
  addLine(shapes, layer, x0, y1, x0, y0);
}

export function sumMeasurements(items: Measurement[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function getCumulativeOffsets(items: Measurement[]) {
  const offsets: number[] = [];
  let total = 0;

  for (const item of items) {
    total += item.amount;
    offsets.push(total);
  }

  return offsets;
}

function collectWarnings(model: SheetMetalModel) {
  const warnings: string[] = [];

  const verticalLimit = model.baseWidth;
  const horizontalLimit = model.baseHeight;
  const leftRightOffsets = [
    ...getCumulativeOffsets(model.sides.left.frezLines),
    ...getCumulativeOffsets(model.sides.right.frezLines),
  ];
  const topBottomOffsets = [
    ...getCumulativeOffsets(model.sides.top.frezLines),
    ...getCumulativeOffsets(model.sides.bottom.frezLines),
  ];

  if (leftRightOffsets.some((value) => value >= verticalLimit)) {
    warnings.push("One or more vertical FREZ depths reach past the base width.");
  }

  if (topBottomOffsets.some((value) => value >= horizontalLimit)) {
    warnings.push("One or more horizontal FREZ depths reach past the base height.");
  }

  return warnings;
}

function addHorizontalCutEdge(
  shapes: LineShape[],
  yEdge: number,
  innerY: number,
  startX: number,
  endX: number,
  notchXs: number[],
) {
  const depth = Math.abs(yEdge - innerY);
  const sorted = [...notchXs]
    .filter((x) => x > startX && x < endX)
    .sort((left, right) => left - right);

  if (depth <= 0 || sorted.length === 0) {
    addLine(shapes, "CUT", startX, yEdge, endX, yEdge);
    return;
  }

  let cursor = startX;

  for (const x of sorted) {
    const leftShoulder = Math.max(startX, x - depth);
    const rightShoulder = Math.min(endX, x + depth);

    if (cursor < leftShoulder) {
      addLine(shapes, "CUT", cursor, yEdge, leftShoulder, yEdge);
    }

    addLine(shapes, "CUT", leftShoulder, yEdge, x, innerY);
    addLine(shapes, "CUT", x, innerY, rightShoulder, yEdge);
    cursor = rightShoulder;
  }

  if (cursor < endX) {
    addLine(shapes, "CUT", cursor, yEdge, endX, yEdge);
  }
}

function addVerticalCutEdge(
  shapes: LineShape[],
  xEdge: number,
  innerX: number,
  startY: number,
  endY: number,
  notchYs: number[],
) {
  const depth = Math.abs(xEdge - innerX);
  const sorted = [...notchYs]
    .filter((y) => y < startY && y > endY)
    .sort((top, bottom) => bottom - top);

  if (depth <= 0 || sorted.length === 0) {
    addLine(shapes, "CUT", xEdge, startY, xEdge, endY);
    return;
  }

  let cursor = startY;

  for (const y of sorted) {
    const upperShoulder = Math.min(startY, y + depth);
    const lowerShoulder = Math.max(endY, y - depth);

    if (cursor > upperShoulder) {
      addLine(shapes, "CUT", xEdge, cursor, xEdge, upperShoulder);
    }

    addLine(shapes, "CUT", xEdge, upperShoulder, innerX, y);
    addLine(shapes, "CUT", innerX, y, xEdge, lowerShoulder);
    cursor = lowerShoulder;
  }

  if (cursor > endY) {
    addLine(shapes, "CUT", xEdge, cursor, xEdge, endY);
  }
}

function getFlangeDepths(model: SheetMetalModel): Record<SideKey, number> {
  return {
    top: sumMeasurements(model.sides.top.flanges),
    right: sumMeasurements(model.sides.right.flanges),
    bottom: sumMeasurements(model.sides.bottom.flanges),
    left: sumMeasurements(model.sides.left.flanges),
  };
}

export function computeSheetMetalGeometry(model: SheetMetalModel): GeometryResult {
  const shapes: LineShape[] = [];
  const flangeDepths = getFlangeDepths(model);

  const x0 = flangeDepths.left;
  const y0 = flangeDepths.bottom;
  const x1 = x0 + model.baseWidth;
  const y1 = y0 + model.baseHeight;

  const outerLeft = 0;
  const outerBottom = 0;
  const outerRight = model.baseWidth + flangeDepths.left + flangeDepths.right;
  const outerTop = model.baseHeight + flangeDepths.bottom + flangeDepths.top;

  const frezOffsets = {
    top: getCumulativeOffsets(model.sides.top.frezLines),
    right: getCumulativeOffsets(model.sides.right.frezLines),
    bottom: getCumulativeOffsets(model.sides.bottom.frezLines),
    left: getCumulativeOffsets(model.sides.left.frezLines),
  };

  // 1. FREZ Lines for FLANGES
  // - Base fold is only drawn if flanges exist
  // - Intermediate folds are drawn from offsets EXCEPT the last one (which is the CUT edge)
  // - All these folds span ONLY the base width/height to avoid extending into corner cutouts
  if (model.sides.top.flanges.length > 0) {
    addLine(shapes, "FREZ", x0, y1, x1, y1);
    const offsets = getCumulativeOffsets(model.sides.top.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", x0, y1 + offsets[i], x1, y1 + offsets[i]);
    }
  }

  if (model.sides.bottom.flanges.length > 0) {
    addLine(shapes, "FREZ", x0, y0, x1, y0);
    const offsets = getCumulativeOffsets(model.sides.bottom.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", x0, y0 - offsets[i], x1, y0 - offsets[i]);
    }
  }

  if (model.sides.left.flanges.length > 0) {
    addLine(shapes, "FREZ", x0, y0, x0, y1);
    const offsets = getCumulativeOffsets(model.sides.left.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", x0 - offsets[i], y0, x0 - offsets[i], y1);
    }
  }

  if (model.sides.right.flanges.length > 0) {
    addLine(shapes, "FREZ", x1, y0, x1, y1);
    const offsets = getCumulativeOffsets(model.sides.right.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", x1 + offsets[i], y0, x1 + offsets[i], y1);
    }
  }

  // 2. INNER FREZ Lines (Notches/Reliefs)
  for (const offset of frezOffsets.top) {
    addLine(shapes, "FREZ", x0, y1 - offset, x1, y1 - offset);
  }

  for (const offset of frezOffsets.bottom) {
    addLine(shapes, "FREZ", x0, y0 + offset, x1, y0 + offset);
  }

  for (const offset of frezOffsets.left) {
    addLine(shapes, "FREZ", x0 + offset, y0, x0 + offset, y1);
  }

  for (const offset of frezOffsets.right) {
    addLine(shapes, "FREZ", x1 - offset, y0, x1 - offset, y1);
  }

  const verticalReliefs = [
    ...frezOffsets.left.map((offset) => x0 + offset),
    ...frezOffsets.right.map((offset) => x1 - offset),
  ];
  const horizontalReliefs = [
    ...frezOffsets.top.map((offset) => y1 - offset),
    ...frezOffsets.bottom.map((offset) => y0 + offset),
  ];

  // 3. OUTER CUT LINES (Edges up to the base corners)
  addHorizontalCutEdge(shapes, outerTop, y1, x0, x1, verticalReliefs);
  addHorizontalCutEdge(shapes, outerBottom, y0, x0, x1, verticalReliefs);
  addVerticalCutEdge(shapes, outerRight, x1, y1, y0, horizontalReliefs);
  addVerticalCutEdge(shapes, outerLeft, x0, y1, y0, horizontalReliefs);

  // 4. L-SHAPED CORNER CUTS (Inward toward base rectangle)
  // Top-Right
  if (outerTop > y1) addLine(shapes, "CUT", x1, outerTop, x1, y1);
  if (outerRight > x1) addLine(shapes, "CUT", x1, y1, outerRight, y1);

  // Bottom-Right
  if (outerRight > x1) addLine(shapes, "CUT", outerRight, y0, x1, y0);
  if (outerBottom < y0) addLine(shapes, "CUT", x1, y0, x1, outerBottom);

  // Bottom-Left
  if (outerBottom < y0) addLine(shapes, "CUT", x0, outerBottom, x0, y0);
  if (outerLeft < x0) addLine(shapes, "CUT", x0, y0, outerLeft, y0);

  // Top-Left
  if (outerLeft < x0) addLine(shapes, "CUT", outerLeft, y1, x0, y1);
  if (outerTop > y1) addLine(shapes, "CUT", x0, y1, x0, outerTop);

  // Handle Model Inversion
  if (model.invertX) {
    shapes.forEach((s) => {
      s.x1 = outerRight - (s.x1 - outerLeft);
      s.x2 = outerRight - (s.x2 - outerLeft);
    });
  }
  
  if (model.invertY) {
    shapes.forEach((s) => {
      s.y1 = outerTop - (s.y1 - outerBottom);
      s.y2 = outerTop - (s.y2 - outerBottom);
    });
  }

  return {
    shapes,
    baseRect: { x0, y0, x1, y1 },
    bounds: { x0: outerLeft, y0: outerBottom, x1: outerRight, y1: outerTop },
    totalWidth: outerRight - outerLeft,
    totalHeight: outerTop - outerBottom,
    flangeDepths,
    frezOffsets,
    warnings: collectWarnings(model),
  };
}

export function getSideTotal(model: SheetMetalModel, side: SideKey, kind: "flanges" | "frezLines") {
  return sumMeasurements(model.sides[side][kind]);
}

export function countShapes(shapes: LineShape[], layer: LineShape["layer"]) {
  return shapes.filter((shape) => shape.layer === layer).length;
}

export { sideKeys };
