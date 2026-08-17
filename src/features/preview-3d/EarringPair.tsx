'use client';

import * as THREE from 'three';
import { useDesignerStore } from '@/features/designer/store/designerStore';
import { getCrystalOrThrow } from '@/lib/crystals/catalog';

export function EarringPair() {
  const design = useDesignerStore((s) => s.design);
  if (design.kind !== 'earrings') return null;
  const mirror = design.mirror ?? true;
  return (
    <group>
      <Strand beads={design.beads} side={-1} />
      {mirror && <Strand beads={design.beads} side={1} />}
    </group>
  );
}

function Strand({ beads, side }: { beads: ReturnType<typeof useDesignerStore.getState>['design']['beads']; side: -1 | 1 }) {
  const xOffset = (side * 0.025); // 25mm apart
  let cursorY = 0;
  return (
    <group position={[xOffset, 0, 0]}>
      {/* Hook anchor */}
      <mesh position={[0, 0.012, 0]}>
        <torusGeometry args={[0.006, 0.0008, 8, 24]} />
        <meshPhysicalMaterial color="#d6c98e" metalness={0.9} roughness={0.25} />
      </mesh>
      {beads.map((b) => {
        const r = b.sizeMm / 2 / 1000;
        cursorY -= r;
        const y = cursorY;
        cursorY -= r;
        const crystal = getCrystalOrThrow(b.crystalSlug);
        return (
          <mesh key={b.id} position={[0, y, 0]} castShadow>
            <sphereGeometry args={[r, 32, 32]} />
            <meshPhysicalMaterial
              color={new THREE.Color(crystal.hex)}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.6}
              clearcoatRoughness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}
