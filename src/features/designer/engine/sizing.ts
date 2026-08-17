import type { DesignState, SizingValue, KindId } from './types';
import { strandLengthMm } from './wristFit';

/**
 * UK ring sizes A–Z (whole + half), mapped to inside finger circumference in mm.
 * Source: UK ring sizing standard (BS EN 28653).
 * Each step is +0.4mm in diameter, ≈ +1.26mm in circumference.
 * A = 37.8mm circumference (Ø 12.04mm); Z = 68.5mm (Ø 21.81mm).
 */
function buildRingTable(): Record<string, number> {
  const sizes: string[] = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  for (const L of letters) {
    sizes.push(L);
    if (L !== 'Z') sizes.push(`${L}½`);
  }
  const table: Record<string, number> = {};
  const startCircumferenceMm = 37.8; // size A
  const stepMm = (68.5 - 37.8) / (sizes.length - 1);
  sizes.forEach((s, i) => {
    table[s] = Number((startCircumferenceMm + stepMm * i).toFixed(2));
  });
  return table;
}

export const UK_RING_SIZE_TABLE: Readonly<Record<string, number>> = Object.freeze(buildRingTable());
export const UK_RING_SIZES: ReadonlyArray<string> = Object.keys(UK_RING_SIZE_TABLE);

export function ukRingCircumferenceMm(size: string): number {
  const v = UK_RING_SIZE_TABLE[size];
  if (v === undefined) throw new Error(`Unknown UK ring size: ${size}`);
  return v;
}

/**
 * The geometric path length (mm) that beads sit along. For bracelet/necklace this
 * is now driven by the strand itself — each bead's along-strand contact width —
 * so non-round beads contribute their real threaded footprint. Ring is fixed by
 * UK size; earrings by drop.
 */
export function pathLengthMm(design: DesignState): number {
  switch (design.sizing.kind) {
    case 'bracelet':
    case 'necklace':
      return strandLengthMm(design.beads);
    case 'ring':
      return ukRingCircumferenceMm(design.sizing.ukSize);
    case 'earrings':
      return design.sizing.dropMm;
  }
}

/**
 * Initial bead count for kinds whose size is *not* driven by the strand (ring, earrings).
 * Bracelet/necklace start empty and grow as the user adds beads.
 */
export function initialBeadCount(
  sizing: SizingValue,
  beadSizeMm: number,
  options?: { maxBeadsPerSide?: number },
): number {
  switch (sizing.kind) {
    case 'bracelet':
    case 'necklace':
      return 0;
    case 'ring':
      return Math.max(1, Math.floor(ukRingCircumferenceMm(sizing.ukSize) / beadSizeMm));
    case 'earrings':
      return Math.min(
        Math.floor(sizing.dropMm / beadSizeMm),
        options?.maxBeadsPerSide ?? 4,
      );
  }
}

export function defaultSizingFor(kind: KindId): SizingValue {
  switch (kind) {
    case 'bracelet':
      return { kind: 'bracelet', wristMm: 145 };
    case 'necklace':
      return { kind: 'necklace', neckMm: 360, length: 'princess' };
    case 'ring':
      return { kind: 'ring', ukSize: 'M' };
    case 'earrings':
      return { kind: 'earrings', dropMm: 30, style: 'dangle' };
  }
}
