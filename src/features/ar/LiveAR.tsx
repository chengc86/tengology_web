'use client';

import { useEffect, useRef, useState } from 'react';
import type { KindId } from '@/features/designer/engine/types';
import { HandTracker } from './HandTracker';
import { FaceTracker } from './FaceTracker';
import type { ARTracker, ARPose } from './types';
import { PhotoOverlay } from './PhotoOverlay';

/**
 * Live camera tracker. We deliberately gate this behind explicit user click,
 * and if MediaPipe fails to load or the camera is denied we fall back to PhotoOverlay.
 */
export function LiveAR({ kind }: { kind: KindId }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pose, setPose] = useState<ARPose | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trackerRef = useRef<ARTracker | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function init() {
      const video = videoRef.current;
      if (!video) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 1280, height: 720 },
          audio: false,
        });
        if (cancelled) return;
        video.srcObject = stream;
        await video.play();
      } catch {
        setError('Camera access denied. Use the photo mode instead.');
        return;
      }

      const tracker: ARTracker =
        kind === 'bracelet' || kind === 'ring'
          ? new HandTracker()
          : new FaceTracker(kind === 'earrings' ? 'ear' : 'neck');
      trackerRef.current = tracker;
      await tracker.start(video, (p) => {
        if (!cancelled) setPose(p);
      });
    }

    init();
    return () => {
      cancelled = true;
      trackerRef.current?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [kind]);

  // Draw a placeholder overlay where the pose lands.
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (!pose) return;
    const cx = pose.position.x * w;
    const cy = pose.position.y * h;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(184,164,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(184,164,255,0.15)';
    ctx.fill();
  }, [pose]);

  if (error) return <PhotoOverlay />;

  return (
    <div className="relative w-full h-full bg-black">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-foreground/80 panel rounded-full px-3 py-1">
        Live AR is a preview — hold steady. Lighting and sleeves affect accuracy.
      </div>
    </div>
  );
}
