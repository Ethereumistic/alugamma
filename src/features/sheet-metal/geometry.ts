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

  const f_top_1 = model.sides.top.flanges[0]?.amount || 0;
  const f_bot_1 = model.sides.bottom.flanges[0]?.amount || 0;
  const f_left_1 = model.sides.left.flanges[0]?.amount || 0;
  const f_right_1 = model.sides.right.flanges[0]?.amount || 0;

  // We only shift the horizontal/vertical boundary if there is exactly 1 flange
  // If there are multiple flanges, the outer cut edge connects back to x0/y0 perfectly.
  const topStartX = x0 + (model.sides.top.mitreStart && outerTop === y1 + f_top_1 ? f_top_1 : 0);
  const topEndX   = x1 - (model.sides.top.mitreEnd && outerTop === y1 + f_top_1 ? f_top_1 : 0);
  
  const botStartX = x0 + (model.sides.bottom.mitreStart && outerBottom === y0 - f_bot_1 ? f_bot_1 : 0);
  const botEndX   = x1 - (model.sides.bottom.mitreEnd && outerBottom === y0 - f_bot_1 ? f_bot_1 : 0);
  
  const leftStartY = y1 - (model.sides.left.mitreStart && outerLeft === x0 - f_left_1 ? f_left_1 : 0);
  const leftEndY   = y0 + (model.sides.left.mitreEnd && outerLeft === x0 - f_left_1 ? f_left_1 : 0);
  
  const rightStartY = y1 - (model.sides.right.mitreStart && outerRight === x1 + f_right_1 ? f_right_1 : 0);
  const rightEndY   = y0 + (model.sides.right.mitreEnd && outerRight === x1 + f_right_1 ? f_right_1 : 0);

  const frezOffsets = {
    top:  getCumulativeOffsets(model.sides.top.frezLines),
    right: getCumulativeOffsets(model.sides.right.frezLines),
    bottom: getCumulativeOffsets(model.sides.bottom.frezLines),
    left:  getCumulativeOffsets(model.sides.left.frezLines),
  };

  // 1. FREZ Lines for FLANGES
  if (model.sides.top.flanges.length > 0) {
    addLine(shapes, "FREZ", x0, y1, x1, y1);
    const offsets = getCumulativeOffsets(model.sides.top.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", topStartX, y1 + offsets[i], topEndX, y1 + offsets[i]);
    }
  }

  if (model.sides.bottom.flanges.length > 0) {
    addLine(shapes, "FREZ", x0, y0, x1, y0);
    const offsets = getCumulativeOffsets(model.sides.bottom.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", botStartX, y0 - offsets[i], botEndX, y0 - offsets[i]);
    }
  }

  if (model.sides.left.flanges.length > 0) {
    addLine(shapes, "FREZ", x0, y0, x0, y1);
    const offsets = getCumulativeOffsets(model.sides.left.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", x0 - offsets[i], leftStartY, x0 - offsets[i], leftEndY);
    }
  }

  if (model.sides.right.flanges.length > 0) {
    addLine(shapes, "FREZ", x1, y0, x1, y1);
    const offsets = getCumulativeOffsets(model.sides.right.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", x1 + offsets[i], rightStartY, x1 + offsets[i], rightEndY);
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
  addHorizontalCutEdge(shapes, outerTop, y1, topStartX, topEndX, verticalReliefs);
  addHorizontalCutEdge(shapes, outerBottom, y0, botStartX, botEndX, verticalReliefs);
  addVerticalCutEdge(shapes, outerRight, x1, rightStartY, rightEndY, horizontalReliefs);
  addVerticalCutEdge(shapes, outerLeft, x0, leftStartY, leftEndY, horizontalReliefs);

  // 4. L-SHAPED AND MITRE CORNER CUTS 
  // Top-Right
  if (outerTop > y1) {
    if (model.sides.top.mitreEnd) {
      addLine(shapes, "CUT", x1, y1, x1 - f_top_1, y1 + f_top_1);
      if (outerTop > y1 + f_top_1) {
        addLine(shapes, "CUT", x1 - f_top_1, y1 + f_top_1, x1, y1 + f_top_1);
        addLine(shapes, "CUT", x1, y1 + f_top_1, x1, outerTop);
      }
    } else {
      addLine(shapes, "CUT", x1, y1, x1, outerTop);
    }
  }

  if (outerRight > x1) {
    if (model.sides.right.mitreStart) {
      addLine(shapes, "CUT", x1, y1, x1 + f_right_1, y1 - f_right_1);
      if (outerRight > x1 + f_right_1) {
        addLine(shapes, "CUT", x1 + f_right_1, y1 - f_right_1, x1 + f_right_1, y1);
        addLine(shapes, "CUT", x1 + f_right_1, y1, outerRight, y1);
      }
    } else {
      addLine(shapes, "CUT", x1, y1, outerRight, y1);
    }
  }

  // Bottom-Right
  if (outerRight > x1) {
    if (model.sides.right.mitreEnd) {
      addLine(shapes, "CUT", x1, y0, x1 + f_right_1, y0 + f_right_1);
      if (outerRight > x1 + f_right_1) {
        addLine(shapes, "CUT", x1 + f_right_1, y0 + f_right_1, x1 + f_right_1, y0);
        addLine(shapes, "CUT", x1 + f_right_1, y0, outerRight, y0);
      }
    } else {
      addLine(shapes, "CUT", x1, y0, outerRight, y0);
    }
  }

  if (outerBottom < y0) {
    if (model.sides.bottom.mitreEnd) {
      addLine(shapes, "CUT", x1, y0, x1 - f_bot_1, y0 - f_bot_1);
      if (outerBottom < y0 - f_bot_1) {
        addLine(shapes, "CUT", x1 - f_bot_1, y0 - f_bot_1, x1, y0 - f_bot_1);
        addLine(shapes, "CUT", x1, y0 - f_bot_1, x1, outerBottom);
      }
    } else {
      addLine(shapes, "CUT", x1, y0, x1, outerBottom);
    }
  }

  // Bottom-Left
  if (outerBottom < y0) {
    if (model.sides.bottom.mitreStart) {
      addLine(shapes, "CUT", x0, y0, x0 + f_bot_1, y0 - f_bot_1);
      if (outerBottom < y0 - f_bot_1) {
        addLine(shapes, "CUT", x0 + f_bot_1, y0 - f_bot_1, x0, y0 - f_bot_1);
        addLine(shapes, "CUT", x0, y0 - f_bot_1, x0, outerBottom);
      }
    } else {
      addLine(shapes, "CUT", x0, y0, x0, outerBottom);
    }
  }

  if (outerLeft < x0) {
    if (model.sides.left.mitreEnd) {
      addLine(shapes, "CUT", x0, y0, x0 - f_left_1, y0 + f_left_1);
      if (outerLeft < x0 - f_left_1) {
        addLine(shapes, "CUT", x0 - f_left_1, y0 + f_left_1, x0 - f_left_1, y0);
        addLine(shapes, "CUT", x0 - f_left_1, y0, outerLeft, y0);
      }
    } else {
      addLine(shapes, "CUT", x0, y0, outerLeft, y0);
    }
  }

  // Top-Left
  if (outerLeft < x0) {
    if (model.sides.left.mitreStart) {
      addLine(shapes, "CUT", x0, y1, x0 - f_left_1, y1 - f_left_1);
      if (outerLeft < x0 - f_left_1) {
        addLine(shapes, "CUT", x0 - f_left_1, y1 - f_left_1, x0 - f_left_1, y1);
        addLine(shapes, "CUT", x0 - f_left_1, y1, outerLeft, y1);
      }
    } else {
      addLine(shapes, "CUT", x0, y1, outerLeft, y1);
    }
  }

  if (outerTop > y1) {
    if (model.sides.top.mitreStart) {
      addLine(shapes, "CUT", x0, y1, x0 + f_top_1, y1 + f_top_1);
      if (outerTop > y1 + f_top_1) {
        addLine(shapes, "CUT", x0 + f_top_1, y1 + f_top_1, x0, y1 + f_top_1);
        addLine(shapes, "CUT", x0, y1 + f_top_1, x0, outerTop);
      }
    } else {
      addLine(shapes, "CUT", x0, y1, x0, outerTop);
    }
  }

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
