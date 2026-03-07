import makerjs from "makerjs";
import type { LineShape } from "@/features/sheet-metal/types";

export function buildDxf(shapes: LineShape[]) {
  const model: makerjs.IModel = {
    paths: {},
  };

  shapes.forEach((shape, i) => {
    // Preserve the native web Y coordinates. Web canvas already computes Y upwards in Cartesian space!
    const line = new makerjs.paths.Line([shape.x1, shape.y1], [shape.x2, shape.y2]) as makerjs.IPath;
    line.layer = shape.layer;
    model.paths![`shape_${i}`] = line;
  });

  const dxfString = makerjs.exporter.toDXF(model, {
    units: makerjs.unitType.Millimeter,
    layerOptions: {
      CUT: { color: 3 }, // green
      FREZ: { color: 6 }, // magenta
    },
  });

  return dxfString;
}

