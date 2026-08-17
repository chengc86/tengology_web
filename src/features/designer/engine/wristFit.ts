import type { Bead } from './types';
import { getCrystal } from '@/lib/crystals/catalog';

export const MIN_WRIST_MM = 110;
export const MIN_NECK_MM = 280;
export const ELASTIC_TOLERANCE_MM = 10;

function canonicalSizeMm(bead: Bead): number {
  const crystal = getCrystal(bead.crystalSlug);
  return crystal?.availableSizesMm?.[0] ?? bead.sizeMm;
}

function scaledConfiguredMm(bead: Bead, valueMm: number | undefined): number | undefined {
  if (!valueMm) return undefined;
  return valueMm * (bead.sizeMm / canonicalSizeMm(bead));
}

export function beadThicknessMm(bead: Bead): number {
  const crystal = getCrystal(bead.crystalSlug);
  if (!crystal?.thicknessMm) return bead.sizeMm;
  return bead.sizeMm * (crystal.thicknessMm / canonicalSizeMm(bead));
}

export function beadSourceWidthMm(bead: Bead): number {
  return beadThicknessMm(bead);
}

export function beadSourceHeightMm(bead: Bead): number {
  return bead.sizeMm;
}

export function beadVisualWidthMm(bead: Bead): number {
  return scaledConfiguredMm(bead, getCrystal(bead.crystalSlug)?.renderWidthMm) ?? beadSourceWidthMm(bead);
}

export function beadVisualHeightMm(bead: Bead): number {
  return scaledConfiguredMm(bead, getCrystal(bead.crystalSlug)?.renderHeightMm) ?? beadSourceHeightMm(bead);
}

export function beadThreadAxis(bead: Bead): 'x' | 'y' {
  return getCrystal(bead.crystalSlug)?.threadAxis ?? 'x';
}

export function beadViewportRotationOffsetDeg(bead: Bead): number {
  const crystal = getCrystal(bead.crystalSlug);
  const axisOffset = crystal?.threadAxis === 'y' ? -90 : 0;
  return axisOffset + (crystal?.renderRotationOffsetDeg ?? 0);
}

function projectedSizeMm(bead: Bead, axis: 'tangent' | 'radial'): number {
  // Project the source-image physical box onto the bracelet tangent/radial
  // axes after the same rotation used in the viewport. This is what lets a
  // head-to-foot bear use its body width for the inner opening, while a heart
  // still uses its height.
  const widthMm = beadSourceWidthMm(bead);
  const heightMm = beadSourceHeightMm(bead);
  const theta = (beadViewportRotationOffsetDeg(bead) * Math.PI) / 180;
  const tangentMm = Math.abs(widthMm * Math.cos(theta)) + Math.abs(heightMm * Math.sin(theta));
  const radialMm = Math.abs(widthMm * Math.sin(theta)) + Math.abs(heightMm * Math.cos(theta));
  return axis === 'tangent' ? tangentMm : radialMm;
}

export function beadThreadLengthMm(bead: Bead): number {
  return projectedSizeMm(bead, 'tangent');
}

export function beadRadialSizeMm(bead: Bead): number {
  return projectedSizeMm(bead, 'radial');
}

export function beadContactWidthMm(bead: Bead): number | undefined {
  const crystal = getCrystal(bead.crystalSlug);
  if (!crystal?.contactWidthMm) return undefined;
  return bead.sizeMm * (crystal.contactWidthMm / canonicalSizeMm(bead));
}

export function beadSameCrystalContactWidthMm(bead: Bead): number | undefined {
  const crystal = getCrystal(bead.crystalSlug);
  if (!crystal?.sameCrystalContactWidthMm) return undefined;
  return bead.sizeMm * (crystal.sameCrystalContactWidthMm / canonicalSizeMm(bead));
}

export function beadFootprintMm(bead: Bead): number {
  return Math.max(
    beadSourceWidthMm(bead),
    beadSourceHeightMm(bead),
    beadVisualWidthMm(bead),
    beadVisualHeightMm(bead),
    beadThreadLengthMm(bead),
    beadRadialSizeMm(bead),
  );
}

export function beadStrandWidthMm(bead: Bead): number {
  return beadContactWidthMm(bead) ?? beadThreadLengthMm(bead);
}

function beadPairSpacingMm(prev: Bead, next: Bead): number {
  if (prev.crystalSlug === next.crystalSlug) {
    const sameCrystalWidth = beadSameCrystalContactWidthMm(prev) ?? beadSameCrystalContactWidthMm(next);
    if (sameCrystalWidth != null) return sameCrystalWidth;
  }
  return (beadStrandWidthMm(prev) + beadStrandWidthMm(next)) / 2;
}

export function strandLengthMm(beads: Bead[]): number {
  if (beads.length === 0) return 0;
  if (beads.length === 1) return beadStrandWidthMm(beads[0]);
  return beads.reduce((sum, bead, i) => sum + beadPairSpacingMm(bead, beads[(i + 1) % beads.length]), 0);
}

export function avgRadialSizeMm(beads: Bead[]): number {
  return beads.length === 0 ? 0 : beads.reduce((sum, bead) => sum + beadRadialSizeMm(bead), 0) / beads.length;
}

export const avgDiameterMm = avgRadialSizeMm;

/**
 * Inner circumference of a closed bead loop. The centreline length follows each
 * bead's along-strand contact width; the inner wrist opening is roughly one
 * average radial bead circumference shorter.
 */
export function innerCircumferenceMm(beads: Bead[]): number {
  if (beads.length < 3) return 0;
  return Math.max(0, strandLengthMm(beads) - Math.PI * avgRadialSizeMm(beads));
}

export function fitsWristMm(beads: Bead[]): { minMm: number; maxMm: number } | null {
  const c = innerCircumferenceMm(beads);
  if (c <= 0) return null;
  return { minMm: Math.max(0, c - ELASTIC_TOLERANCE_MM), maxMm: c };
}
