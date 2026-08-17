import type { JewelryKind } from '../types';

export const necklace: JewelryKind = {
  id: 'necklace',
  label: 'Necklace',
  layout: 'closed-loop',
  beadSizesMm: [4, 6, 8, 10, 12, 14],
  preview3d: {
    scene: '/models/neck-bust.glb',
    camera: { position: [0, 0.05, 0.6], target: [0, -0.05, 0], fov: 40 },
  },
  ar: { tracker: 'face', fallback: 'photo-overlay' },
  defaults: {
    sizing: { kind: 'necklace', neckMm: 360, length: 'princess' },
    findings: { kind: 'necklace', band: 'elastic' },
    beadSizeMm: 6,
    seedCrystalSlug: 'clear-quartz',
  },
};

export const NECKLACE_LENGTH_MM: Record<'choker' | 'princess' | 'matinee' | 'opera', number> = {
  choker: 360,
  princess: 460,
  matinee: 560,
  opera: 760,
};
