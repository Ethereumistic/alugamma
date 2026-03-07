import {
  sideKeys,
  type GeometryResult,
  type LineShape,
  type Measurement,
  type SheetMetalModel,
  type SideKey,
} from "@/features/sheet-metal/types";

type HorizontalNotch = {
  apexX: number;
  apexY: number;
  shoulderY: number;
};

function addLine(
  shapes: LineShape[],
  layer: LineShape["layer"],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  if (x1 === x2 && y1 === y2) {
    return;
  }

  shapes.push({ type: "line", layer, x1, y1, x2, y2 });
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

function getFlangeDepths(model: SheetMetalModel): Record<SideKey, number> {
  return {
    top: sumMeasurements(model.sides.top.flanges),
    right: sumMeasurements(model.sides.right.flanges),
    bottom: sumMeasurements(model.sides.bottom.flanges),
    left: sumMeasurements(model.sides.left.flanges),
  };
}

function getFrezOffsets(model: SheetMetalModel) {
  return {
    top: getCumulativeOffsets(model.sides.top.frezLines),
    right: getCumulativeOffsets(model.sides.right.frezLines),
    bottom: getCumulativeOffsets(model.sides.bottom.frezLines),
    left: getCumulativeOffsets(model.sides.left.frezLines),
  };
}

function getResolvedFrezPositions(
  model: SheetMetalModel,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  frezOffsets: Record<SideKey, number[]>,
) {
  return {
    top: frezOffsets.top.map((offset) => (model.sides.top.frezMode === "inner" ? y1 - offset : y1 + offset)),
    right: frezOffsets.right.map((offset) => (model.sides.right.frezMode === "inner" ? x1 - offset : x1 + offset)),
    bottom: frezOffsets.bottom.map((offset) => (model.sides.bottom.frezMode === "inner" ? y0 + offset : y0 - offset)),
    left: frezOffsets.left.map((offset) => (model.sides.left.frezMode === "inner" ? x0 + offset : x0 - offset)),
  };
}

function collectWarnings(model: SheetMetalModel, flangeDepths: Record<SideKey, number>) {
  const warnings: string[] = [];

  for (const side of sideKeys) {
    const offsets = getCumulativeOffsets(model.sides[side].frezLines);
    if (offsets.length === 0) {
      continue;
    }

    const limit =
      model.sides[side].frezMode === "inner"
        ? side === "left" || side === "right"
          ? model.baseWidth
          : model.baseHeight
        : flangeDepths[side];

    if (limit <= 0) {
      warnings.push(`${side[0].toUpperCase()}${side.slice(1)} outer FREZ needs flange depth on that side.`);
      continue;
    }

    if (offsets.some((value) => value >= limit)) {
      const scope = model.sides[side].frezMode === "inner" ? "base size" : "flange depth";
      warnings.push(`${side[0].toUpperCase()}${side.slice(1)} FREZ depth reaches past the ${scope}.`);
    }
  }

  return warnings;
}

function addHorizontalCutEdge(
  shapes: LineShape[],
  yEdge: number,
  startX: number,
  endX: number,
  notches: HorizontalNotch[],
) {
  const sorted = [...notches]
    .filter((notch) => notch.apexX > startX && notch.apexX < endX)
    .sort((left, right) => left.apexX - right.apexX);

  if (sorted.length === 0) {
    addLine(shapes, "CUT", startX, yEdge, endX, yEdge);
    return;
  }

  let cursor = startX;

  for (const notch of sorted) {
    const halfWidth = Math.abs(notch.shoulderY - notch.apexY);
    const leftShoulder = Math.max(startX, notch.apexX - halfWidth);
    const rightShoulder = Math.min(endX, notch.apexX + halfWidth);

    if (rightShoulder <= cursor) {
      continue;
    }

    if (cursor < leftShoulder) {
      addLine(shapes, "CUT", cursor, yEdge, leftShoulder, yEdge);
    }

    if (notch.shoulderY !== yEdge) {
      addLine(shapes, "CUT", leftShoulder, yEdge, leftShoulder, notch.shoulderY);
    }

    addLine(shapes, "CUT", leftShoulder, notch.shoulderY, notch.apexX, notch.apexY);
    addLine(shapes, "CUT", notch.apexX, notch.apexY, rightShoulder, notch.shoulderY);

    if (notch.shoulderY !== yEdge) {
      addLine(shapes, "CUT", rightShoulder, notch.shoulderY, rightShoulder, yEdge);
    }

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

function getCornerShoulderOffset(items: Measurement[]) {
  if (items.length === 0) {
    return 0;
  }

  return items.length > 1 ? items[0].amount : sumMeasurements(items);
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

  const frezOffsets = getFrezOffsets(model);
  const frezPositions = getResolvedFrezPositions(model, x0, y0, x1, y1, frezOffsets);

  const topSpanStart = model.cornerReliefs.topLeft ? outerLeft : x0;
  const topSpanEnd = model.cornerReliefs.topRight ? outerRight : x1;
  const bottomSpanStart = model.cornerReliefs.bottomLeft ? outerLeft : x0;
  const bottomSpanEnd = model.cornerReliefs.bottomRight ? outerRight : x1;
  const leftSpanTop = model.cornerReliefs.topLeft ? outerTop : y1;
  const leftSpanBottom = model.cornerReliefs.bottomLeft ? outerBottom : y0;
  const rightSpanTop = model.cornerReliefs.topRight ? outerTop : y1;
  const rightSpanBottom = model.cornerReliefs.bottomRight ? outerBottom : y0;

  if (model.sides.top.flanges.length > 0) {
    addLine(shapes, "FREZ", topSpanStart, y1, topSpanEnd, y1);
    const offsets = getCumulativeOffsets(model.sides.top.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", topSpanStart, y1 + offsets[i], topSpanEnd, y1 + offsets[i]);
    }
  }

  if (model.sides.bottom.flanges.length > 0) {
    addLine(shapes, "FREZ", bottomSpanStart, y0, bottomSpanEnd, y0);
    const offsets = getCumulativeOffsets(model.sides.bottom.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", bottomSpanStart, y0 - offsets[i], bottomSpanEnd, y0 - offsets[i]);
    }
  }

  if (model.sides.left.flanges.length > 0) {
    addLine(shapes, "FREZ", x0, leftSpanBottom, x0, leftSpanTop);
    const offsets = getCumulativeOffsets(model.sides.left.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", x0 - offsets[i], leftSpanBottom, x0 - offsets[i], leftSpanTop);
    }
  }

  if (model.sides.right.flanges.length > 0) {
    addLine(shapes, "FREZ", x1, rightSpanBottom, x1, rightSpanTop);
    const offsets = getCumulativeOffsets(model.sides.right.flanges);
    for (let i = 0; i < offsets.length - 1; i++) {
      addLine(shapes, "FREZ", x1 + offsets[i], rightSpanBottom, x1 + offsets[i], rightSpanTop);
    }
  }

  for (const y of frezPositions.top) {
    const startX = model.sides.top.frezMode === "outer" ? topSpanStart : x0;
    const endX = model.sides.top.frezMode === "outer" ? topSpanEnd : x1;
    addLine(shapes, "FREZ", startX, y, endX, y);
  }

  for (const y of frezPositions.bottom) {
    const startX = model.sides.bottom.frezMode === "outer" ? bottomSpanStart : x0;
    const endX = model.sides.bottom.frezMode === "outer" ? bottomSpanEnd : x1;
    addLine(shapes, "FREZ", startX, y, endX, y);
  }

  for (const x of frezPositions.left) {
    const startY = model.sides.left.frezMode === "outer" ? leftSpanBottom : y0;
    const endY = model.sides.left.frezMode === "outer" ? leftSpanTop : y1;
    addLine(shapes, "FREZ", x, startY, x, endY);
  }

  for (const x of frezPositions.right) {
    const startY = model.sides.right.frezMode === "outer" ? rightSpanBottom : y0;
    const endY = model.sides.right.frezMode === "outer" ? rightSpanTop : y1;
    addLine(shapes, "FREZ", x, startY, x, endY);
  }

  const topNotches: HorizontalNotch[] = [
    ...frezPositions.left.map((apexX) => ({ apexX, apexY: y1, shoulderY: outerTop })),
    ...frezPositions.right.map((apexX) => ({ apexX, apexY: y1, shoulderY: outerTop })),
  ];

  const bottomNotches: HorizontalNotch[] = [
    ...frezPositions.left.map((apexX) => ({ apexX, apexY: y0, shoulderY: outerBottom })),
    ...frezPositions.right.map((apexX) => ({ apexX, apexY: y0, shoulderY: outerBottom })),
  ];

  if (model.cornerReliefs.topLeft && outerTop > y1) {
    topNotches.push({
      apexX: x0,
      apexY: y1,
      shoulderY: y1 + getCornerShoulderOffset(model.sides.top.flanges),
    });
  }

  if (model.cornerReliefs.topRight && outerTop > y1) {
    topNotches.push({
      apexX: x1,
      apexY: y1,
      shoulderY: y1 + getCornerShoulderOffset(model.sides.top.flanges),
    });
  }

  if (model.cornerReliefs.bottomLeft && outerBottom < y0) {
    bottomNotches.push({
      apexX: x0,
      apexY: y0,
      shoulderY: y0 - getCornerShoulderOffset(model.sides.bottom.flanges),
    });
  }

  if (model.cornerReliefs.bottomRight && outerBottom < y0) {
    bottomNotches.push({
      apexX: x1,
      apexY: y0,
      shoulderY: y0 - getCornerShoulderOffset(model.sides.bottom.flanges),
    });
  }

  addHorizontalCutEdge(shapes, outerTop, topSpanStart, topSpanEnd, topNotches);
  addHorizontalCutEdge(shapes, outerBottom, bottomSpanStart, bottomSpanEnd, bottomNotches);
  addVerticalCutEdge(shapes, outerRight, x1, rightSpanTop, rightSpanBottom, [...frezPositions.top, ...frezPositions.bottom]);
  addVerticalCutEdge(shapes, outerLeft, x0, leftSpanTop, leftSpanBottom, [...frezPositions.top, ...frezPositions.bottom]);

  if (!model.cornerReliefs.topRight) {
    if (outerTop > y1) addLine(shapes, "CUT", x1, outerTop, x1, y1);
    if (outerRight > x1) addLine(shapes, "CUT", x1, y1, outerRight, y1);
  }

  if (!model.cornerReliefs.bottomRight) {
    if (outerRight > x1) addLine(shapes, "CUT", outerRight, y0, x1, y0);
    if (outerBottom < y0) addLine(shapes, "CUT", x1, y0, x1, outerBottom);
  }

  if (!model.cornerReliefs.bottomLeft) {
    if (outerBottom < y0) addLine(shapes, "CUT", x0, outerBottom, x0, y0);
    if (outerLeft < x0) addLine(shapes, "CUT", x0, y0, outerLeft, y0);
  }

  if (!model.cornerReliefs.topLeft) {
    if (outerLeft < x0) addLine(shapes, "CUT", outerLeft, y1, x0, y1);
    if (outerTop > y1) addLine(shapes, "CUT", x0, y1, x0, outerTop);
  }

  if (model.invertX) {
    shapes.forEach((shape) => {
      shape.x1 = outerRight - (shape.x1 - outerLeft);
      shape.x2 = outerRight - (shape.x2 - outerLeft);
    });
  }

  if (model.invertY) {
    shapes.forEach((shape) => {
      shape.y1 = outerTop - (shape.y1 - outerBottom);
      shape.y2 = outerTop - (shape.y2 - outerBottom);
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
    warnings: collectWarnings(model, flangeDepths),
  };
}

export function getSideTotal(model: SheetMetalModel, side: SideKey, kind: "flanges" | "frezLines") {
  return sumMeasurements(model.sides[side][kind]);
}

export function countShapes(shapes: LineShape[], layer: LineShape["layer"]) {
  return shapes.filter((shape) => shape.layer === layer).length;
}

export { sideKeys };
