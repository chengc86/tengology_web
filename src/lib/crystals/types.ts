import { z } from 'zod';

export const Chakra = z.enum([
  'root',
  'sacral',
  'solar-plexus',
  'heart',
  'throat',
  'third-eye',
  'crown',
]);
export type Chakra = z.infer<typeof Chakra>;

export const Zodiac = z.enum([
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]);
export type Zodiac = z.infer<typeof Zodiac>;

export const Element = z.enum(['fire', 'water', 'earth', 'air', 'spirit']);
export type Element = z.infer<typeof Element>;

export const Intention = z.enum([
  'calm', 'focus', 'love', 'protection', 'abundance', 'creativity',
  'intuition', 'grounding', 'energy', 'healing', 'clarity', 'courage',
  'compassion', 'communication', 'manifestation', 'balance', 'growth',
]);
export type Intention = z.infer<typeof Intention>;

export const ColorGroup = z.enum([
  'black', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'white',
]);
export type ColorGroup = z.infer<typeof ColorGroup>;

export const ProductCategory = z.enum(['crystal', 'alphabet']);
export type ProductCategory = z.infer<typeof ProductCategory>;

export const SourcingRegion = z.object({
  region: z.string(),
  method: z.enum(['artisanal', 'small-scale', 'large-scale', 'lab-grown']),
  fairTradeCertified: z.boolean().default(false),
});
export type SourcingRegion = z.infer<typeof SourcingRegion>;

export const CrystalSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  color: z.string(),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  category: ProductCategory.default('crystal'),
  // One or more image variants for the bracelet/canvas view. Crystals with
  // natural variation (howlite veining, donut sides) provide multiple; uniform
  // crystals provide a single-element array.
  images: z.array(z.string()).min(1),
  // Optional dedicated image for the LEFT palette tile. Useful when the canvas
  // wants a side/threaded view (donut beads) but the palette should show the
  // recognizable front. Falls back to `images[0]` if absent.
  paletteImage: z.string().optional(),
  colorGroup: ColorGroup,
  chakra: z.array(Chakra).default([]),
  zodiac: z.array(Zodiac).default([]),
  element: Element.optional(),
  intention: z.array(Intention).default([]),
  hardness: z.number().min(1).max(10).optional(),
  formation: z.enum(['igneous', 'metamorphic', 'sedimentary', 'biogenic']).optional(),
  origin: z.array(z.string()).default([]),
  sourcing: z.array(SourcingRegion).default([]),
  priceCents: z.number().int().nonnegative(),
  // Per-crystal stocked bead sizes (mm). When set, the palette offers exactly
  // these sizes for this crystal, overriding the kind's default size list.
  availableSizesMm: z.array(z.number().positive()).nonempty().optional(),
  // Source image width in mm. For the default left-to-right thread axis this is
  // also the bead thickness along the strand. If `threadAxis` is 'y', `sizeMm`
  // is the along-strand head-to-foot dimension and this is the cross-axis body
  // width.
  thicknessMm: z.number().positive().optional(),
  // Which source-image axis the drill hole follows. Defaults to horizontal
  // ('x'), matching ordinary round beads, discs, hearts, moons and stars.
  threadAxis: z.enum(['x', 'y']).optional(),
  // Extra source-image rotation in the bracelet/ring viewport, in degrees.
  // This is useful for flat disc beads whose source image shows the diameter
  // along x, but whose center hole/string direction is the short axis.
  renderRotationOffsetDeg: z.number().optional(),
  // Optional tighter visual contact width along the threading axis. This keeps
  // the rendered width from thicknessMm, but lets deeply curved silhouettes
  // (e.g. hearts) pack until their visible bodies touch.
  contactWidthMm: z.number().positive().optional(),
  // Optional even tighter contact width when two beads of this same crystal
  // are adjacent. Useful for mirrored carved shapes whose sides visually open
  // up against each other more than they do against round beads.
  sameCrystalContactWidthMm: z.number().positive().optional(),
  // Preserve the bead PNG's crop aspect ratio when rendering. Packing/contact
  // still uses the physical threading dimensions above.
  preserveImageAspectRatio: z.boolean().optional(),
  // Optional viewport-only physical size for cutouts whose rendered asset
  // includes extra hardware beyond the listed bead/charm body size.
  renderWidthMm: z.number().positive().optional(),
  renderHeightMm: z.number().positive().optional(),
  // Anchor point inside the cropped image, expressed as a ratio of rendered
  // width/height. The anchor is placed on the strand/loop line.
  viewportAnchorXRatio: z.number().min(0).max(1).optional(),
  viewportAnchorYRatio: z.number().min(0).max(1).optional(),
  blurb: z.string(),
});
export type CrystalInput = z.input<typeof CrystalSchema>;
export type Crystal = z.infer<typeof CrystalSchema>;
