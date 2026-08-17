export interface ARPose {
  position: { x: number; y: number; z: number };
  /** Quaternion (x,y,z,w) describing rotation. */
  quaternion: [number, number, number, number];
  /** 0..1 confidence in the pose (e.g. landmark visibility average). */
  confidence: number;
}

export interface ARTracker {
  start(video: HTMLVideoElement, onPose: (pose: ARPose | null) => void): Promise<void>;
  stop(): void;
}
