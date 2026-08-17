'use client';

import type { ARTracker, ARPose } from './types';
import { OneEuroVec3 } from './OneEuroFilter';

/**
 * Wrist tracker built on MediaPipe HandLandmarker. We derive orientation from
 * three landmarks because the wrist itself is a single point:
 *
 *   wrist (0), index-MCP (5), pinky-MCP (17)
 *
 * The triangle's normal gives the back-of-hand direction; tangent (wrist→middle of
 * MCPs) gives "forward". One-Euro smoothing damps jitter on each component.
 *
 * For ring tracking we reuse this tracker but pick different landmarks (index PIP/MCP).
 *
 * NOTE: The MediaPipe Tasks API loads the WASM runtime + model on demand. We
 * gracefully resolve with `null` if the runtime fails to load — the AR shell
 * will then fall back to PhotoOverlay.
 */
export class HandTracker implements ARTracker {
  private landmarker: unknown = null;
  private raf: number | null = null;
  private filtered = new OneEuroVec3();

  async start(video: HTMLVideoElement, onPose: (p: ARPose | null) => void) {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { FilesetResolver, HandLandmarker } = vision;
      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      );
      this.landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });
    } catch {
      onPose(null);
      return;
    }

    const loop = () => {
      const lm = this.landmarker as { detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks?: { x: number; y: number; z: number }[][] } } | null;
      if (!lm) return;
      const ts = performance.now();
      const res = lm.detectForVideo(video, ts);
      const hand = res.landmarks?.[0];
      if (hand) {
        const wrist = hand[0];
        const indexMcp = hand[5];
        const pinkyMcp = hand[17];
        const cx = (wrist.x + indexMcp.x + pinkyMcp.x) / 3;
        const cy = (wrist.y + indexMcp.y + pinkyMcp.y) / 3;
        const cz = (wrist.z + indexMcp.z + pinkyMcp.z) / 3;
        const smoothed = this.filtered.filter({ x: cx, y: cy, z: cz }, ts / 1000);

        // Forward = wrist → midpoint of MCPs
        const fx = (indexMcp.x + pinkyMcp.x) / 2 - wrist.x;
        const fy = (indexMcp.y + pinkyMcp.y) / 2 - wrist.y;
        const fz = (indexMcp.z + pinkyMcp.z) / 2 - wrist.z;
        // Right = index − pinky
        const rx = indexMcp.x - pinkyMcp.x;
        const ry = indexMcp.y - pinkyMcp.y;
        const rz = indexMcp.z - pinkyMcp.z;
        // Up = forward × right
        const ux = fy * rz - fz * ry;
        const uy = fz * rx - fx * rz;
        const uz = fx * ry - fy * rx;
        const q = quatFromAxes(rx, ry, rz, ux, uy, uz, fx, fy, fz);

        onPose({
          position: smoothed,
          quaternion: q,
          confidence: 0.9,
        });
      } else {
        onPose(null);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf != null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.landmarker = null;
  }
}

/** Build a quaternion from three orthogonal-ish axis vectors. We re-orthogonalise. */
function quatFromAxes(
  rx: number, ry: number, rz: number,
  ux: number, uy: number, uz: number,
  fx: number, fy: number, fz: number,
): [number, number, number, number] {
  const norm = (a: number, b: number, c: number) => Math.hypot(a, b, c) || 1;
  const nr = norm(rx, ry, rz);
  rx /= nr; ry /= nr; rz /= nr;
  const nu = norm(ux, uy, uz);
  ux /= nu; uy /= nu; uz /= nu;
  const nf = norm(fx, fy, fz);
  fx /= nf; fy /= nf; fz /= nf;

  // Matrix → quaternion
  const m00 = rx, m01 = ux, m02 = fx;
  const m10 = ry, m11 = uy, m12 = fy;
  const m20 = rz, m21 = uz, m22 = fz;
  const trace = m00 + m11 + m22;
  let x: number, y: number, z: number, w: number;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1.0) * 2;
    w = 0.25 * s;
    x = (m21 - m12) / s;
    y = (m02 - m20) / s;
    z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
    w = (m21 - m12) / s;
    x = 0.25 * s;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = 0.25 * s;
    z = (m12 + m21) / s;
  } else {
    const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = 0.25 * s;
  }
  return [x, y, z, w];
}
