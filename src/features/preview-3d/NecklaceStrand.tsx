'use client';
import { ClosedLoopBeads, CordTube } from './BeadInstance';

/**
 * Beaded-strand necklaces are also a closed loop (the elastic comes back to itself);
 * the visual difference is just the size — the loop curve already accounts for it
 * via pathLengthMm(). When chain+pendant ships, this becomes a different layout.
 */
export function NecklaceStrand() {
  return (
    <group>
      <CordTube radius={0.0006} />
      <ClosedLoopBeads />
    </group>
  );
}
