import { v } from "convex/values";

export const organizationRoleValidator = v.union(v.literal("owner"), v.literal("admin"), v.literal("member"));
export const projectRoleValidator = v.union(v.literal("owner"), v.literal("editor"));
export const inviteStatusValidator = v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked"), v.literal("expired"));
export const frezModeValidator = v.union(v.literal("inner"), v.literal("outer"));
export const cornerReliefAxesValidator = v.object({
  horizontal: v.boolean(),
  vertical: v.boolean(),
});
export const cornerReliefEntryValidator = v.union(
  cornerReliefAxesValidator,
  v.literal("none"),
  v.literal("horizontal"),
  v.literal("vertical"),
  v.boolean(),
);
export const frezLineNotchesValidator = v.object({
  start: v.boolean(),
  end: v.boolean(),
});
export const measurementValidator = v.object({
  id: v.string(),
  amount: v.number(),
});
export const frezMeasurementValidator = v.union(
  measurementValidator,
  v.object({
    id: v.string(),
    amount: v.number(),
    notches: frezLineNotchesValidator,
  }),
);

export const sideConfigValidator = v.object({
  flanges: v.array(measurementValidator),
  frezLines: v.array(frezMeasurementValidator),
  frezMode: frezModeValidator,
});

export const sheetModelValidator = v.object({
  baseWidth: v.number(),
  baseHeight: v.number(),
  invertX: v.boolean(),
  invertY: v.boolean(),
  sides: v.object({
    top: sideConfigValidator,
    right: sideConfigValidator,
    bottom: sideConfigValidator,
    left: sideConfigValidator,
  }),
  cornerReliefs: v.object({
    topLeft: cornerReliefEntryValidator,
    topRight: cornerReliefEntryValidator,
    bottomRight: cornerReliefEntryValidator,
    bottomLeft: cornerReliefEntryValidator,
  }),
});
