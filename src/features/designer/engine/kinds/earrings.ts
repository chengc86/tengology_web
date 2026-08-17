import type { JewelryKind } from '../types';

export const earrings: JewelryKind = {
  id: 'earrings',
  label: 'Earrings',
  layout: 'dual-strand',
  beadSizesMm: [4, 6, 8, 10, 12, 14],
  maxBeadsPerSide: 4,
  preview3d: {
    scene: '/models/ear.glb',
    camera: { position: [0, 0.02, 0.18], target: [0, -0.01, 0], fov: 35 },
  },
  ar: { tracker: 'ear', fallback: 'photo-overlay' },
  defaults: {
    sizing: { kind: 'earrings', dropMm: 30, style: 'dangle' },
    findings: { kind: 'earrings', hook: 'french-hook' },
    beadSizeMm: 6,
    seedCrystalSlug: 'clear-quartz',
  },
};
