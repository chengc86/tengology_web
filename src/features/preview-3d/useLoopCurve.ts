import { useMemo } from 'react';
import * as THREE from 'three';
import type { DesignState } from '@/features/designer/engine/types';
import { pathLengthMm } from '@/features/designer/engine/sizing';

/**
 * Builds a closed planar circle as a CatmullRomCurve3, scaled to the design's path length.
 * Returns the curve, radius (metres), and a stable basis for orienting beads.
 *
 * Important: we use a fixed up-vector (Y axis) rather than Frenet frames so beads
 * keep a consistent orientation around the loop. Frenet frames flip at points of
 * zero curvature on a planar loop, which would cause visible twist-pops when the
 * user reorders beads.
 */
export function useLoopCurve(design: DesignState) {
  return useMemo(() => {
    const lenMm = pathLengthMm(design);
    const radius = lenMm > 0 ? (lenMm / (2 * Math.PI)) / 1000 : 0;
    const samples = 64;
    const points = Array.from({ length: samples }, (_, i) => {
      const t = (i / samples) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius);
    });
    const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0);
    return { curve, radius };
  }, [design]);
}

/**
 * Per-bead position + quaternion along a closed loop. Uses a stable frame:
 *   tangent  = curve derivative
 *   up       = world Y
 *   normal   = up × tangent (re-orthogonalised)
 * The bead's local +Z points along the tangent; the cord goes through its centre.
 */
export function placeBeadsOnLoop(
  curve: THREE.CatmullRomCurve3,
  count: number,
  originIndex: number,
): { position: THREE.Vector3; quaternion: THREE.Quaternion }[] {
  if (count === 0) return [];
  const out: { position: THREE.Vector3; quaternion: THREE.Quaternion }[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const rotated = ((i - originIndex) % count + count) % count;
    const t = rotated / count;
    const position = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    // Stable frame: project up onto plane orthogonal to tangent.
    const normal = up.clone().sub(tangent.clone().multiplyScalar(up.dot(tangent))).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const m = new THREE.Matrix4().makeBasis(binormal, normal, tangent);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(m);
    out.push({ position, quaternion });
  }
  return out;
}
