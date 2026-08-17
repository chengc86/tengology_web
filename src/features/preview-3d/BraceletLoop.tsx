'use client';
import { ClosedLoopBeads, CordTube } from './BeadInstance';

export function BraceletLoop() {
  return (
    <group>
      <CordTube radius={0.0008} />
      <ClosedLoopBeads />
    </group>
  );
}
