import { z } from 'zod';

export const KindId = z.enum(['bracelet', 'necklace', 'ring', 'earrings']);
export type KindId = z.infer<typeof KindId>;

export const BeadSchema = z.object({
  id: z.string(),
  crystalSlug: z.string(),
  sizeMm: z.number().positive(),
  // Index into Crystal.images. Captured at creation so a bead keeps the same
  // texture across renders even when its crystal has multiple variants.
  variantIndex: z.number().int().nonnegative().optional(),
});
export type Bead = z.infer<typeof BeadSchema>;

export const FocalPieceSchema = z.object({
  type: z.enum(['charm', 'pendant', 'center-stone']),
  slug: z.string(),
});
export type FocalPiece = z.infer<typeof FocalPieceSchema>;

/* ----------------------- Sizing (discriminated by kind) ----------------------- */
export const NecklaceLength = z.enum(['choker', 'princess', 'matinee', 'opera']);
export type NecklaceLength = z.infer<typeof NecklaceLength>;

export const EarringStyle = z.enum(['stud', 'dangle']);
export type EarringStyle = z.infer<typeof EarringStyle>;

export const EarringHook = z.enum(['french-hook', 'leverback', 'post-stud']);
export type EarringHook = z.infer<typeof EarringHook>;

export const SizingValue = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('bracelet'), wristMm: z.number().min(110).max(210) }),
  z.object({
    kind: z.literal('necklace'),
    neckMm: z.number().min(280).max(450),
    length: NecklaceLength,
  }),
  z.object({ kind: z.literal('ring'), ukSize: z.string() }),
  z.object({
    kind: z.literal('earrings'),
    dropMm: z.number().min(0).max(120),
    style: EarringStyle,
  }),
]);
export type SizingValue = z.infer<typeof SizingValue>;

/* ----------------------- Findings (discriminated by kind) ----------------------- */
export const FindingsValue = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('bracelet'), band: z.literal('elastic') }),
  z.object({ kind: z.literal('necklace'), band: z.literal('elastic') }),
  z.object({ kind: z.literal('ring'), band: z.literal('elastic') }),
  z.object({ kind: z.literal('earrings'), hook: EarringHook }),
]);
export type FindingsValue = z.infer<typeof FindingsValue>;

/* ----------------------- DesignState ----------------------- */
export const DesignStateSchema = z.object({
  version: z.literal(1),
  kind: KindId,
  beads: z.array(BeadSchema),
  originIndex: z.number().int().nonnegative(),
  sizing: SizingValue,
  findings: FindingsValue,
  focal: FocalPieceSchema.optional(),
  mirror: z.boolean().optional(),
});
export type DesignState = z.infer<typeof DesignStateSchema>;

/* ----------------------- Kind configuration ----------------------- */
export type Layout = 'closed-loop' | 'open-strand' | 'dual-strand';
export type ARTracker = 'hand' | 'face' | 'finger' | 'ear';
export type SceneModel = '/models/wrist.glb' | '/models/neck-bust.glb' | '/models/finger.glb' | '/models/ear.glb';

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface JewelryKind {
  id: KindId;
  label: string;
  layout: Layout;
  beadSizesMm: number[];          // discrete allowed sizes
  maxBeadsPerSide?: number;       // earrings-specific
  preview3d: { scene: SceneModel; camera: CameraPreset };
  ar: { tracker: ARTracker; fallback: 'photo-overlay' };
  defaults: {
    sizing: SizingValue;
    findings: FindingsValue;
    beadSizeMm: number;
    seedCrystalSlug: string;
  };
}
