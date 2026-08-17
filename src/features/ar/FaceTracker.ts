'use client';

import type { ARTracker, ARPose } from './types';
import { OneEuroVec3 } from './OneEuroFilter';

/**
 * Face tracker for necklace + earrings. Uses MediaPipe FaceLandmarker to extract
 * specific anchor points:
 *
 *   • Necklace: midpoint between chin (152) and a point below the jawline.
 *   • Earrings: two ear-region landmarks — mesh points 234 (left ear) / 454 (right ear).
 *
 * The component picks the anchor via `mode`. Both share the same MediaPipe model.
 */
export type FaceMode = 'neck' | 'ear';

export class FaceTracker implements ARTracker {
  private landmarker: unknown = null;
  private raf: number | null = null;
  private filtered = new OneEuroVec3();

  constructor(private mode: FaceMode) {}

  async start(video: HTMLVideoElement, onPose: (p: ARPose | null) => void) {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { FilesetResolver, FaceLandmarker } = vision;
      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      );
      this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        },
        runningMode: 'VIDEO',
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        numFaces: 1,
      });
    } catch {
      onPose(null);
      return;
    }

    const loop = () => {
      const lm = this.landmarker as { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks?: { x: number; y: number; z: number }[][] } } | null;
      if (!lm) return;
      const ts = performance.now();
      const res = lm.detectForVideo(video, ts);
      const face = res.faceLandmarks?.[0];
      if (face) {
        let anchor: { x: number; y: number; z: number };
        if (this.mode === 'neck') {
          // Approx jaw-line midpoint, offset down: chin (152) + a bit.
          const chin = face[152];
          anchor = { x: chin.x, y: chin.y + 0.06, z: chin.z };
        } else {
          // Earrings: midpoint of left+right ear anchors (234, 454).
          const l = face[234];
          const r = face[454];
          anchor = { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2, z: (l.z + r.z) / 2 };
        }
        const smoothed = this.filtered.filter(anchor, ts / 1000);
        onPose({
          position: smoothed,
          quaternion: [0, 0, 0, 1],
          confidence: 0.85,
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
