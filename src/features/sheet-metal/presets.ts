import {
  createEmptyModel,
  createMeasurement,
  type Preset,
  type SheetMetalModel,
} from "@/features/sheet-metal/types";

function makeModel(builder: (model: SheetMetalModel) => SheetMetalModel) {
  return builder(createEmptyModel());
}

export const presetLibrary: Preset[] = [
  {
    name: "Blank panel",
    description: "Base rectangle only. Start from zero operations.",
    model: createEmptyModel(),
  },
  {
    name: "Prototype relief",
    description: "Approximates the screenshot with one vertical and one horizontal relief.",
    model: makeModel((model) => ({
      ...model,
      baseWidth: 1040,
      baseHeight: 610,
      invertX: false,
      invertY: false,
      sides: {
        top: {
          flanges: [createMeasurement(26)],
          frezLines: [],
          frezMode: "inner",
        },
        right: {
          flanges: [createMeasurement(28)],
          frezLines: [],
          frezMode: "inner",
        },
        bottom: {
          flanges: [createMeasurement(142)],
          frezLines: [createMeasurement(116)],
          frezMode: "inner",
        },
        left: {
          flanges: [createMeasurement(30)],
          frezLines: [createMeasurement(220)],
          frezMode: "inner",
        },
      },
      cornerReliefs: {
        topLeft: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
      },
    })),
  },
];
