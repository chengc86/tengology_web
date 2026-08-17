'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { useDesignerStore } from '@/features/designer/store/designerStore';
import { getKind } from '@/features/designer/engine/kinds';
import { BraceletLoop } from './BraceletLoop';
import { NecklaceStrand } from './NecklaceStrand';
import { RingLoop } from './RingLoop';
import { EarringPair } from './EarringPair';

/**
 * The 3D preview reuses the *same* DesignState as the 2D editor. Per-kind components
 * sample the curve, instance beads, and render a cord. We deliberately don't apply
 * AR/world pose here — that's the AR layer's job.
 */
export function ThreePreview() {
  const design = useDesignerStore((s) => s.design);
  const k = getKind(design.kind);
  const cam = k.preview3d.camera;

  return (
    <Canvas
      camera={{ position: cam.position, fov: cam.fov }}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={['#fdfbfa']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 2]} intensity={1.0} />
      <directionalLight position={[-2, 1, -1]} intensity={0.35} color="#d5a2a5" />

      <Suspense fallback={null}>
        <Environment preset="studio" />
        {design.kind === 'bracelet' && <BraceletLoop />}
        {design.kind === 'necklace' && <NecklaceStrand />}
        {design.kind === 'ring' && <RingLoop />}
        {design.kind === 'earrings' && <EarringPair />}
      </Suspense>

      <OrbitControls
        target={cam.target}
        enablePan={false}
        minDistance={0.05}
        maxDistance={1}
        enableDamping
      />
    </Canvas>
  );
}
