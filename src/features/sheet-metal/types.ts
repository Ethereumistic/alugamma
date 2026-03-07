export const sideKeys = ["top", "right", "bottom", "left"] as const;
export const cornerKeys = ["topLeft", "topRight", "bottomRight", "bottomLeft"] as const;

export type SideKey = (typeof sideKeys)[number];
export type CornerKey = (typeof cornerKeys)[number];
export type Layer = "CUT" | "FREZ";
export type FrezMode = "inner" | "outer";

export type Measurement = {
  id: string;
  amount: number;
};

export type SideConfig = {
  flanges: Measurement[];
  frezLines: Measurement[];
  frezMode: FrezMode;
};

export type SheetMetalModel = {
  baseWidth: number;
  baseHeight: number;
  invertX: boolean;
  invertY: boolean;
  sides: Record<SideKey, SideConfig>;
  cornerReliefs: Record<CornerKey, boolean>;
};

export type Rect = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type LineShape = {
  type: "line";
  layer: Layer;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type GeometryResult = {
  shapes: LineShape[];
  baseRect: Rect;
  bounds: Rect;
  totalWidth: number;
  totalHeight: number;
  flangeDepths: Record<SideKey, number>;
  frezOffsets: Record<SideKey, number[]>;
  warnings: string[];
};

export type Preset = {
  name: string;
  description: string;
  model: SheetMetalModel;
};

let measurementCounter = 0;

export function createMeasurement(amount = 20): Measurement {
  measurementCounter += 1;

  return {
    id: `m-${measurementCounter}`,
    amount,
  };
}

export function createEmptySide(): SideConfig {
  return {
    flanges: [],
    frezLines: [],
    frezMode: "inner",
  };
}

export function createEmptyModel(): SheetMetalModel {
  return {
    baseWidth: 900,
    baseHeight: 520,
    invertX: false,
    invertY: false,
    sides: {
      top: createEmptySide(),
      right: createEmptySide(),
      bottom: createEmptySide(),
      left: createEmptySide(),
    },
    cornerReliefs: {
      topLeft: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
    },
  };
}
