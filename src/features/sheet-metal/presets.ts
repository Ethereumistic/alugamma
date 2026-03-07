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
          mitreStart: false,
          mitreEnd: false,
        },
        right: {
          flanges: [createMeasurement(28)],
          frezLines: [],
          mitreStart: false,
          mitreEnd: false,
        },
        bottom: {
          flanges: [createMeasurement(142)],
          frezLines: [createMeasurement(116)],
          mitreStart: false, // User mentioned left corner of bottom side
          mitreEnd: false,
        },
        left: {
          flanges: [createMeasurement(30)],
          frezLines: [createMeasurement(220)],
          mitreStart: false,
          mitreEnd: false,
        },
      },
    })),
  },
];
