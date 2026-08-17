'use client';
import { ClosedLoopBeads, CordTube } from './BeadInstance';

export function RingLoop() {
  return (
    <group>
      <CordTube radius={0.0004} />
      <ClosedLoopBeads />
    </group>
  );
}
