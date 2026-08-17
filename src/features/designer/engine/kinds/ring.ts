import type { JewelryKind } from '../types';

export const ring: JewelryKind = {
  id: 'ring',
  label: 'Ring',
  layout: 'closed-loop',
  beadSizesMm: [4, 6, 8, 10, 12, 14],
  preview3d: {
    scene: '/models/finger.glb',
    camera: { position: [0, 0.01, 0.05], target: [0, 0, 0], fov: 30 },
  },
  ar: { tracker: 'finger', fallback: 'photo-overlay' },
  defaults: {
    sizing: { kind: 'ring', ukSize: 'M' },
    findings: { kind: 'ring', band: 'elastic' },
    beadSizeMm: 6,
    seedCrystalSlug: 'clear-quartz',
  },
};
