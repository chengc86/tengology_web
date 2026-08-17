/**
 * One-Euro filter — adaptive low-pass that's gentle on slow motion and quick to
 * respond to fast motion. Used to smooth MediaPipe landmark jitter without
 * introducing visible lag.
 *
 * Reference: Casiez et al., "1€ Filter: A Simple Speed-based Low-pass Filter
 * for Noisy Input in Interactive Systems" (CHI 2012).
 */
function lowPass(alpha: number, x: number, xPrev: number): number {
  return alpha * x + (1 - alpha) * xPrev;
}
function alphaFromCutoff(cutoffHz: number, dtSec: number): number {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dtSec);
}

export class OneEuroFilter {
  private xPrev = 0;
  private dxPrev = 0;
  private tPrev = 0;
  private initialised = false;

  constructor(
    private minCutoff = 1.0,
    private beta = 0.007,
    private dCutoff = 1.0,
  ) {}

  reset() {
    this.initialised = false;
  }

  filter(value: number, timestampSec: number): number {
    if (!this.initialised) {
      this.xPrev = value;
      this.dxPrev = 0;
      this.tPrev = timestampSec;
      this.initialised = true;
      return value;
    }
    const dt = Math.max(1e-6, timestampSec - this.tPrev);
    const dx = (value - this.xPrev) / dt;
    const aD = alphaFromCutoff(this.dCutoff, dt);
    const edx = lowPass(aD, dx, this.dxPrev);
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const a = alphaFromCutoff(cutoff, dt);
    const x = lowPass(a, value, this.xPrev);
    this.xPrev = x;
    this.dxPrev = edx;
    this.tPrev = timestampSec;
    return x;
  }
}

export class OneEuroVec3 {
  fx = new OneEuroFilter();
  fy = new OneEuroFilter();
  fz = new OneEuroFilter();
  filter(v: { x: number; y: number; z: number }, tSec: number) {
    return {
      x: this.fx.filter(v.x, tSec),
      y: this.fy.filter(v.y, tSec),
      z: this.fz.filter(v.z, tSec),
    };
  }
}
