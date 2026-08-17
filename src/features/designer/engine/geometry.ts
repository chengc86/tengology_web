import type { Bead, DesignState, KindId } from './types';
import { pathLengthMm } from './sizing';

export interface BeadPlacement {
  index: number;
  angle: number;            // radians, for closed loops; t∈[0,1] mapped to angle
  position: { x: number; y: number; z: number };
  /** Quaternion components (x, y, z, w). For closed loops, beads face the loop centre. */
  rotation: [number, number, number, number];
}

const TAU = Math.PI * 2;

/* ----------------- Quaternion helpers (no Three dep) ----------------- */
function quatFromAxisAngle(ax: number, ay: number, az: number, theta: number): [number, number, number, number] {
  const h = theta / 2;
  const s = Math.sin(h);
  return [ax * s, ay * s, az * s, Math.cos(h)];
}

/* ---------------- Closed-loop placement (bracelet, necklace, ring) ----------------
 * Beads sit on a closed circle whose circumference equals the path length. Each bead
 * occupies arc space proportional to its diameter, so mixed-size beads pack without
 * overlap. originIndex rotates which bead lands at the seam (12 o'clock) without
 * touching the array order.
 */
function placeClosedLoop(
  beads: Bead[],
  originIndex: number,
  pathLenMm: number,
): BeadPlacement[] {
  const n = beads.length;
  if (n === 0 || pathLenMm <= 0) return [];
  const radius = pathLenMm / TAU;
  const seam = -Math.PI / 2;

  // Walk around the loop in display order (seam first), placing rotated[k] at slot k.
  // arcCursor accumulates as we traverse; each bead's centre sits at cursor + r.
  const out: BeadPlacement[] = new Array(n);
  let arcCursor = 0;
  for (let k = 0; k < n; k++) {
    const sourceIdx = (k + originIndex) % n;
    const b = beads[sourceIdx];
    const centreArc = arcCursor + b.sizeMm / 2;
    const angle = seam + (centreArc / pathLenMm) * TAU;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const rotation = quatFromAxisAngle(0, 0, 1, angle + Math.PI / 2);
    out[sourceIdx] = { index: sourceIdx, angle, position: { x, y, z: 0 }, rotation };
    arcCursor += b.sizeMm;
  }
  return out;
}

/* ---------------- Open-strand placement (earrings — per side) ----------------
 * Beads hang vertically from a hook anchor at origin, stepping down by bead diameter.
 * `side` is -1 (left) or +1 (right). The pair is mirrored horizontally.
 */
function placeOpenStrand(
  beads: Bead[],
  side: -1 | 1,
  hookOffsetMm: number,
): BeadPlacement[] {
  let cursorY = -hookOffsetMm;
  return beads.map((b, i) => {
    cursorY -= b.sizeMm / 2;
    const pos = { x: side * 0, y: cursorY, z: 0 };
    cursorY -= b.sizeMm / 2;
    return {
      index: i,
      angle: 0,
      position: pos,
      rotation: [0, 0, 0, 1] as [number, number, number, number],
    };
  });
}

/* ---------------- Public placement entry point ---------------- */
export function placeBeads(state: DesignState): BeadPlacement[] {
  const len = pathLengthMm(state);
  switch (state.kind) {
    case 'bracelet':
    case 'necklace':
    case 'ring':
      return placeClosedLoop(state.beads, state.originIndex, len);
    case 'earrings':
      return placeOpenStrand(state.beads, 1, 4);
  }
}

/* ---------------- Earring pair (left + right) ----------------
 * For earrings the canvas renders two mirrored strands. If `mirror` is true (default),
 * the right side reuses the same bead array; otherwise the second strand is empty and
 * the user is expected to design it independently in a later iteration.
 */
export function placeEarringPair(state: DesignState): { left: BeadPlacement[]; right: BeadPlacement[] } {
  if (state.kind !== 'earrings') {
    throw new Error('placeEarringPair requires kind=earrings');
  }
  const left = placeOpenStrand(state.beads, -1, 4);
  const right = (state.mirror ?? true) ? placeOpenStrand(state.beads, 1, 4) : [];
  return { left, right };
}

/* ---------------- 2D bounds for the Konva canvas ---------------- */
export function pathBoundsMm(kind: KindId, pathLenMm: number, dropMm = 0): { width: number; height: number } {
  if (kind === 'earrings') {
    return { width: 40, height: Math.max(40, dropMm + 20) };
  }
  const diameter = pathLenMm / Math.PI;
  return { width: diameter, height: diameter };
}
