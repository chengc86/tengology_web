'use client';

import * as THREE from 'three';
import { useMemo } from 'react';
import { useDesignerStore } from '@/features/designer/store/designerStore';
import { getCrystalOrThrow } from '@/lib/crystals/catalog';
import { useLoopCurve, placeBeadsOnLoop } from './useLoopCurve';

/**
 * Renders all beads as individual meshes (good enough for ≤30 beads and gives us
 * per-bead colour without extra plumbing). For galleries showing many designs at
 * once we'd switch to <Instances> from drei.
 */
export function ClosedLoopBeads() {
  const design = useDesignerStore((s) => s.design);
  const { curve } = useLoopCurve(design);
  const placements = useMemo(
    () => placeBeadsOnLoop(curve, design.beads.length, design.originIndex),
    [curve, design.beads.length, design.originIndex],
  );

  return (
    <group>
      {design.beads.map((b, i) => {
        const p = placements[i];
        if (!p) return null;
        const crystal = getCrystalOrThrow(b.crystalSlug);
        const radius = b.sizeMm / 2 / 1000; // mm → m
        return (
          <mesh
            key={b.id}
            position={p.position}
            quaternion={p.quaternion}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[radius, 32, 32]} />
            <meshPhysicalMaterial
              color={new THREE.Color(crystal.hex)}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.6}
              clearcoatRoughness={0.2}
              transmission={crystal.slug === 'clear-quartz' ? 0.4 : 0}
              ior={1.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function CordTube({ radius = 0.0008 }: { radius?: number }) {
  const design = useDesignerStore((s) => s.design);
  const { curve } = useLoopCurve(design);
  const geom = useMemo(() => new THREE.TubeGeometry(curve, 96, radius, 8, true), [curve, radius]);
  return (
    <mesh geometry={geom}>
      <meshPhysicalMaterial color="#cfc4e6" roughness={0.7} metalness={0.05} clearcoat={0.3} />
    </mesh>
  );
}
