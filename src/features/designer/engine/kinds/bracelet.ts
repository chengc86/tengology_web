import type { JewelryKind } from '../types';

export const bracelet: JewelryKind = {
  id: 'bracelet',
  label: 'Bracelet',
  layout: 'closed-loop',
  beadSizesMm: [4, 6, 8, 10, 12, 14],
  preview3d: {
    scene: '/models/wrist.glb',
    camera: { position: [0, 0.05, 0.18], target: [0, 0, 0], fov: 35 },
  },
  ar: { tracker: 'hand', fallback: 'photo-overlay' },
  defaults: {
    sizing: { kind: 'bracelet', wristMm: 145 },
    findings: { kind: 'bracelet', band: 'elastic' },
    beadSizeMm: 8,
    seedCrystalSlug: 'clear-quartz',
  },
};
