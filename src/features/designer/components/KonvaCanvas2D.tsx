'use client';

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Circle, Line, Text, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { Crosshair, Trash2 } from 'lucide-react';
import { useDesignerStore } from '../store/designerStore';
import { placeEarringPair, pathBoundsMm } from '../engine/geometry';
import type { Bead } from '../engine/types';
import { pathLengthMm, ukRingCircumferenceMm } from '../engine/sizing';
import {
  MIN_WRIST_MM,
  beadContactWidthMm,
  beadFootprintMm,
  beadRadialSizeMm,
  beadSameCrystalContactWidthMm,
  beadThicknessMm,
  beadThreadAxis,
  beadThreadLengthMm,
  beadVisualHeightMm,
  beadVisualWidthMm,
  beadViewportRotationOffsetDeg,
  innerCircumferenceMm,
} from '../engine/wristFit';
import { CRYSTALS, getCrystal, getCrystalOrThrow } from '@/lib/crystals/catalog';
import type { BeadPlacement } from '../engine/geometry';
import { cn } from '@/lib/utils';

const TAU = Math.PI * 2;
const CONTOUR_PROFILE_SAMPLES = 72;
const CONTOUR_THREADLINE_BAND_RATIO = 0.14;
const CONTOUR_THREADLINE_CONTACT_QUANTILE = 0.55;
const CONTOUR_TOUCH_BUFFER_MM = 0;
const MIN_CONTOUR_SPACING_RATIO = 0.24;
const CONTOUR_ALPHA_THRESHOLD = 160;
const BEAD_SHADOW_COLOR = '#000';
const BEAD_SHADOW_BLUR = 3;
const BEAD_SHADOW_OPACITY = 0.35;
const SELECTED_HALO_COLOR = '#9b5e62';
const SELECTED_HALO_BLUR = 16;
const SELECTED_HALO_OPACITY = 0.72;

/**
 * Place beads on the user-sized viewport ring. Adjacent spacing uses each
 * bead image's alpha contour when available, falling back to threading
 * thickness for unloaded images or simple round beads.
 */
function beadRotationOffsetDeg(bead: Bead): number {
  return beadViewportRotationOffsetDeg(bead);
}

interface AlphaProfile {
  left: Array<number | null>;
  right: Array<number | null>;
}

interface BeadPackingMetrics {
  crystalSlug: string;
  widthMm: number;
  heightMm: number;
  nominalWidthMm: number;
  contactWidthMm?: number;
  sameCrystalContactWidthMm?: number;
  roundOutline: boolean;
  profile?: AlphaProfile;
}

function fallbackPackingMetrics(bead: Bead): BeadPackingMetrics {
  const crystal = getCrystal(bead.crystalSlug);
  const widthMm = beadThreadLengthMm(bead);
  const heightMm = beadRadialSizeMm(bead);
  const contactWidthMm = beadContactWidthMm(bead);
  const sameCrystalContactWidthMm = beadSameCrystalContactWidthMm(bead);
  return {
    crystalSlug: bead.crystalSlug,
    widthMm,
    heightMm,
    nominalWidthMm: contactWidthMm ?? widthMm,
    contactWidthMm,
    sameCrystalContactWidthMm,
    roundOutline: !crystal?.thicknessMm,
  };
}

function packingMetricsForBead(bead: Bead, asset?: CrystalImageAsset): BeadPackingMetrics {
  const crystal = getCrystal(bead.crystalSlug);
  const widthMm = beadThreadLengthMm(bead);
  const heightMm = beadRadialSizeMm(bead);
  const contactWidthMm = beadContactWidthMm(bead);
  const sameCrystalContactWidthMm = beadSameCrystalContactWidthMm(bead);
  const roundOutline = !crystal?.thicknessMm;
  const profile = beadThreadAxis(bead) === 'y' ? asset?.threadAxisYProfile : asset?.profile;
  if (!profile || roundOutline) {
    return {
      crystalSlug: bead.crystalSlug,
      widthMm,
      heightMm,
      nominalWidthMm: contactWidthMm ?? widthMm,
      contactWidthMm,
      sameCrystalContactWidthMm,
      roundOutline,
      profile: roundOutline ? undefined : profile,
    };
  }

  const rowWidths = profile.left
    .map((left, i) => {
      const right = profile.right[i];
      return left == null || right == null ? null : right - left;
    })
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  const contourWidth = threadlineWidth(profile) ?? quantile(rowWidths, CONTOUR_THREADLINE_CONTACT_QUANTILE) ?? 1;

  return {
    crystalSlug: bead.crystalSlug,
    widthMm,
    heightMm,
    nominalWidthMm: contactWidthMm ?? Math.max(widthMm * contourWidth, widthMm * MIN_CONTOUR_SPACING_RATIO),
    contactWidthMm,
    sameCrystalContactWidthMm,
    roundOutline,
    profile,
  };
}

function quantile(values: number[], q: number): number | null {
  if (values.length === 0) return null;
  const index = Math.max(0, Math.min(values.length - 1, Math.round((values.length - 1) * q)));
  return values[index];
}

function threadlineWidth(profile: AlphaProfile): number | null {
  const mid = (profile.left.length - 1) / 2;
  const radius = Math.max(1, Math.round(profile.left.length * CONTOUR_THREADLINE_BAND_RATIO * 0.5));
  const widths: number[] = [];
  for (let i = Math.floor(mid - radius); i <= Math.ceil(mid + radius); i++) {
    const left = profile.left[i];
    const right = profile.right[i];
    if (left == null || right == null) continue;
    widths.push(right - left);
  }
  return quantile(widths.sort((a, b) => a - b), CONTOUR_THREADLINE_CONTACT_QUANTILE);
}

function contourSpanAtY(metrics: BeadPackingMetrics, yMm: number): { leftMm: number; rightMm: number } | null {
  const profile = metrics.profile;
  if (!profile || metrics.heightMm <= 0) {
    return {
      leftMm: -metrics.widthMm / 2,
      rightMm: metrics.widthMm / 2,
    };
  }

  const normalizedY = yMm / metrics.heightMm + 0.5;
  if (normalizedY < 0 || normalizedY > 1) return null;

  const index = Math.max(0, Math.min(profile.left.length - 1, Math.round(normalizedY * (profile.left.length - 1))));
  const left = profile.left[index];
  const right = profile.right[index];
  if (left == null || right == null) return null;

  return {
    leftMm: (left - 0.5) * metrics.widthMm,
    rightMm: (right - 0.5) * metrics.widthMm,
  };
}

function contourSpacingMm(prev: BeadPackingMetrics, next: BeadPackingMetrics): number {
  if (prev.crystalSlug === next.crystalSlug) {
    const sameCrystalWidth = prev.sameCrystalContactWidthMm ?? next.sameCrystalContactWidthMm;
    if (sameCrystalWidth != null) return sameCrystalWidth;
  }
  const fallback = ((prev.contactWidthMm ?? prev.widthMm) + (next.contactWidthMm ?? next.widthMm)) / 2;
  if (prev.roundOutline && next.roundOutline) return fallback;
  if (prev.contactWidthMm != null || next.contactWidthMm != null) return fallback;
  if (!prev.profile && !next.profile) return fallback;

  const halfOverlapHeight = Math.min(prev.heightMm, next.heightMm) * CONTOUR_THREADLINE_BAND_RATIO * 0.5;
  if (halfOverlapHeight <= 0) return fallback;

  let required = 0;
  const requiredDistances: number[] = [];
  for (let i = 0; i < CONTOUR_PROFILE_SAMPLES; i++) {
    const t = i / (CONTOUR_PROFILE_SAMPLES - 1);
    const yMm = -halfOverlapHeight + t * halfOverlapHeight * 2;
    const prevSpan = contourSpanAtY(prev, yMm);
    const nextSpan = contourSpanAtY(next, yMm);
    if (!prevSpan || !nextSpan) continue;
    requiredDistances.push(prevSpan.rightMm - nextSpan.leftMm);
  }

  const contactDistance = quantile(requiredDistances.sort((a, b) => a - b), CONTOUR_THREADLINE_CONTACT_QUANTILE);
  if (contactDistance == null) return fallback;

  const lowerBound = Math.min(prev.widthMm, next.widthMm) * MIN_CONTOUR_SPACING_RATIO;
  return Math.min(fallback, Math.max(lowerBound, contactDistance + CONTOUR_TOUCH_BUFFER_MM));
}

interface DisplayBeadPlacement extends BeadPlacement {
  centerArc: number;
}

function angleToArcMm(angle: number, loopLenMm: number): number {
  let t = (angle - -Math.PI / 2) / TAU;
  t = ((t % 1) + 1) % 1;
  return t * loopLenMm;
}

function circularArcDistanceMm(a: number, b: number, loopLenMm: number): number {
  const direct = Math.abs(a - b) % loopLenMm;
  return Math.min(direct, loopLenMm - direct);
}

function normalizeAngleRad(angle: number): number {
  return ((angle + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

function shortestAngleDeltaRad(from: number, to: number): number {
  return normalizeAngleRad(to - from);
}

function orderedPackingEntries(beads: Bead[], originIndex: number, metrics: BeadPackingMetrics[]) {
  return Array.from({ length: beads.length }, (_, k) => {
    const sourceIdx = (k + originIndex) % beads.length;
    const bead = beads[sourceIdx];
    return {
      sourceIdx,
      bead,
      metrics: metrics[sourceIdx] ?? fallbackPackingMetrics(bead),
    };
  });
}

function cyclicPackingSpacingsMm(beads: Bead[], originIndex: number, metrics: BeadPackingMetrics[]): number[] {
  const ordered = orderedPackingEntries(beads, originIndex, metrics);
  return ordered.map((entry, k) => contourSpacingMm(entry.metrics, ordered[(k + 1) % ordered.length].metrics));
}

function cyclicPackingLengthMm(beads: Bead[], originIndex: number, metrics: BeadPackingMetrics[]): number {
  if (beads.length === 0) return 0;
  if (beads.length === 1) return metrics[0]?.nominalWidthMm ?? fallbackPackingMetrics(beads[0]).nominalWidthMm;
  return cyclicPackingSpacingsMm(beads, originIndex, metrics).reduce((sum, spacing) => sum + spacing, 0);
}

function placeOnDisplayRing(
  beads: Bead[],
  originIndex: number,
  loopLenMm: number,
  metrics: BeadPackingMetrics[],
  snapClosedAtMm = loopLenMm,
  forceClosed = false,
  distributeExtraGap = false,
): DisplayBeadPlacement[] {
  const n = beads.length;
  if (n === 0 || loopLenMm <= 0) return [];
  const radius = loopLenMm / TAU;
  const seam = -Math.PI / 2;
  const out: DisplayBeadPlacement[] = new Array(n);

  const ordered = orderedPackingEntries(beads, originIndex, metrics);
  const cyclicSpacings = cyclicPackingSpacingsMm(beads, originIndex, metrics);
  const cyclicLengthMm = cyclicSpacings.reduce((sum, spacing) => sum + spacing, 0);
  const isClosed = n >= 3 && (forceClosed || cyclicLengthMm >= snapClosedAtMm);

  if (isClosed || distributeExtraGap) {
    const availableGapMm = Math.max(0, loopLenMm - cyclicLengthMm);
    const spacingScale = isClosed ? loopLenMm / cyclicLengthMm : 1;
    const extraGapPerSlotMm = distributeExtraGap && !isClosed ? availableGapMm / n : 0;
    let centreArc = (cyclicSpacings[n - 1] * spacingScale + extraGapPerSlotMm) / 2;
    for (let k = 0; k < n; k++) {
      if (k > 0) centreArc += cyclicSpacings[k - 1] * spacingScale + extraGapPerSlotMm;
      const { sourceIdx } = ordered[k];
      const angle = seam + (centreArc / loopLenMm) * TAU;
      out[sourceIdx] = {
        index: sourceIdx,
        angle,
        centerArc: centreArc,
        position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: 0 },
        rotation: [0, 0, 0, 1],
      };
    }
    return out;
  }

  let prevMetrics: BeadPackingMetrics | null = null;
  let centreArc = 0;
  for (let k = 0; k < n; k++) {
    const { sourceIdx, metrics: currentMetrics } = ordered[k];
    centreArc = prevMetrics
      ? centreArc + contourSpacingMm(prevMetrics, currentMetrics)
      : currentMetrics.nominalWidthMm / 2;
    const angle = seam + (centreArc / loopLenMm) * TAU;
    out[sourceIdx] = {
      index: sourceIdx,
      angle,
      centerArc: centreArc,
      position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: 0 },
      rotation: [0, 0, 0, 1],
    };
    prevMetrics = currentMetrics;
  }
  return out;
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CrystalImageAsset {
  image: HTMLImageElement;
  crop?: CropRect;
  profile?: AlphaProfile;
  threadAxisYProfile?: AlphaProfile;
}

function assetAspectRatio(asset: CrystalImageAsset): number | null {
  const width = asset.crop?.width ?? asset.image.naturalWidth ?? asset.image.width;
  const height = asset.crop?.height ?? asset.image.naturalHeight ?? asset.image.height;
  if (width <= 0 || height <= 0) return null;
  return width / height;
}

function beadRenderSizeMm(bead: Bead, asset?: CrystalImageAsset): { widthMm: number; heightMm: number } {
  const widthMm = beadVisualWidthMm(bead);
  const heightMm = beadVisualHeightMm(bead);
  const crystal = getCrystal(bead.crystalSlug);
  if (!crystal?.preserveImageAspectRatio || !asset) {
    return { widthMm, heightMm };
  }

  const aspect = assetAspectRatio(asset);
  if (!aspect) return { widthMm, heightMm };

  return {
    widthMm,
    heightMm: widthMm / aspect,
  };
}

function alphaGeometryForImage(img: HTMLImageElement): Pick<CrystalImageAsset, 'crop' | 'profile' | 'threadAxisYProfile'> {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (width <= 0 || height <= 0) return {};

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return {};

  try {
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha <= CONTOUR_ALPHA_THRESHOLD) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) return {};

    const crop = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    const left: Array<number | null> = Array.from({ length: CONTOUR_PROFILE_SAMPLES }, () => null);
    const right: Array<number | null> = Array.from({ length: CONTOUR_PROFILE_SAMPLES }, () => null);
    const threadAxisYLeft: Array<number | null> = Array.from({ length: CONTOUR_PROFILE_SAMPLES }, () => null);
    const threadAxisYRight: Array<number | null> = Array.from({ length: CONTOUR_PROFILE_SAMPLES }, () => null);

    for (let sample = 0; sample < CONTOUR_PROFILE_SAMPLES; sample++) {
      const y0 = crop.y + Math.floor((sample / CONTOUR_PROFILE_SAMPLES) * crop.height);
      const y1 = crop.y + Math.floor(((sample + 1) / CONTOUR_PROFILE_SAMPLES) * crop.height);
      let rowMinX = width;
      let rowMaxX = -1;
      for (let y = y0; y <= Math.max(y0, y1); y++) {
        if (y < crop.y || y > maxY) continue;
        for (let x = crop.x; x <= maxX; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha <= CONTOUR_ALPHA_THRESHOLD) continue;
          rowMinX = Math.min(rowMinX, x);
          rowMaxX = Math.max(rowMaxX, x);
        }
      }
      if (rowMaxX >= rowMinX) {
        left[sample] = (rowMinX - crop.x) / crop.width;
        right[sample] = (rowMaxX - crop.x + 1) / crop.width;
      }

      const x0 = crop.x + Math.floor((sample / CONTOUR_PROFILE_SAMPLES) * crop.width);
      const x1 = crop.x + Math.floor(((sample + 1) / CONTOUR_PROFILE_SAMPLES) * crop.width);
      let colMinY = height;
      let colMaxY = -1;
      for (let x = x0; x <= Math.max(x0, x1); x++) {
        if (x < crop.x || x > maxX) continue;
        for (let y = crop.y; y <= maxY; y++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha <= CONTOUR_ALPHA_THRESHOLD) continue;
          colMinY = Math.min(colMinY, y);
          colMaxY = Math.max(colMaxY, y);
        }
      }
      if (colMaxY >= colMinY) {
        threadAxisYLeft[sample] = (colMinY - crop.y) / crop.height;
        threadAxisYRight[sample] = (colMaxY - crop.y + 1) / crop.height;
      }
    }

    return {
      crop: crop.x === 0 && crop.y === 0 && crop.width === width && crop.height === height ? undefined : crop,
      profile: { left, right },
      threadAxisYProfile: { left: threadAxisYLeft, right: threadAxisYRight },
    };
  } catch {
    return {};
  }
}

function shouldUseFullImageFrame(url: string): boolean {
  return url.includes('/beads/gold-alphabet-');
}

/** Pre-load every crystal image variant once and cache HTMLImageElement by URL.
 * For crystals with natural variation (e.g. howlite), this preloads all 15
 * texture variants upfront so beads can be rendered with whichever one was
 * randomly assigned at creation. */
function useCrystalImages(): Record<string, CrystalImageAsset> {
  const [imgs, setImgs] = useState<Record<string, CrystalImageAsset>>({});
  useEffect(() => {
    let cancelled = false;
    const urls = Array.from(new Set(CRYSTALS.flatMap((c) => c.images)));
    Promise.all(
      urls.map(
        (url) =>
          new Promise<[string, CrystalImageAsset]>((resolve) => {
            const el = new window.Image();
            el.onload = () => {
              const geometry = shouldUseFullImageFrame(url) ? {} : alphaGeometryForImage(el);
              resolve([url, { image: el, ...geometry }]);
            };
            el.onerror = () => resolve([url, { image: el }]);
            el.src = url;
          }),
      ),
    ).then((entries) => {
      if (!cancelled) setImgs(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return imgs;
}

interface Props {
  width: number;
  height: number;
}

interface Placements {
  loop?: BeadPlacement[];
  left?: BeadPlacement[];
  right?: BeadPlacement[];
}

/**
 * 2D editor canvas. Beads are drawn at positions computed by the engine and scaled
 * to fit the viewport. The viewport's world frame is centred at (cx, cy).
 *
 * Interactions:
 *   • Tap a bead             → select
 *   • Drag a bead            → if released over the trash icon, remove. Otherwise,
 *                              reorder around the loop based on the drag's angular
 *                              position (slot derived from the cumulative-arc layout).
 *   • Drag outside the loop   → rotate the bracelet/necklace view with the pointer.
 */
export function KonvaCanvas2D({ width, height }: Props) {
  const design = useDesignerStore((s) => s.design);
  const selected = useDesignerStore((s) => s.selectedIndex);
  const setSelected = useDesignerStore((s) => s.setSelected);
  const dispatch = useDesignerStore((s) => s.dispatch);
  const removeAt = useDesignerStore((s) => s.removeAt);

  const stageRef = useRef<Konva.Stage | null>(null);
  const trashRef = useRef<HTMLButtonElement | null>(null);
  const [isDraggingBead, setIsDraggingBead] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [isRotatingLoop, setIsRotatingLoop] = useState(false);
  const [loopRotationRad, setLoopRotationRad] = useState(0);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const beadImages = useCrystalImages();
  const clearAll = useDesignerStore((s) => s.clearAll);

  // Live drag preview: while a bead is being dragged we shift the other beads to
  // make room for its target slot. `dragState` is null when no drag is active.
  const [dragState, setDragState] = useState<{ from: number; previewTo: number } | null>(null);

  // Konva nodes per bead.id — used by the tween effect below to imperatively
  // animate position changes without React-Konva resetting attrs on each render.
  const beadRefs = useRef<Map<string, Konva.Node>>(new Map());
  const refCallbacks = useRef<Map<string, (node: Konva.Node | null) => void>>(new Map());
  const prevTargets = useRef<Map<string, { x: number; y: number; rotationDeg: number }>>(new Map());
  // Track the active tween per bead so we can destroy it before starting another
  // (Konva.Node.to() does NOT cancel a previous tween on the same node — calling
  // .to() repeatedly stacks tweens that fight each other, which is what makes
  // beads stop half-way during rapid interaction).
  const activeTweens = useRef<Map<string, Konva.Tween>>(new Map());
  const loopRotateDragRef = useRef<{ lastAngle: number; moved: boolean } | null>(null);
  // Hold the latest beadTargets in a ref so the stable ref callback below can
  // read the freshest target without being recreated each render.
  const beadTargetsRef = useRef<Map<string, { x: number; y: number; rotationDeg: number }>>(new Map());

  // Stable ref callback per bead.id so React doesn't call it null→new on every
  // render. Two responsibilities:
  //   1. Register/unregister the Konva node in beadRefs.
  //   2. On mount, snap the node to its current target IMMEDIATELY. Konva
  //      defaults a fresh node to (x=0, y=0); if we wait for useLayoutEffect
  //      the user can see the bead flash near the viewport's top-left (or
  //      anywhere the layer origin lands after a non-1 stage zoom) before
  //      snapping into place. Doing it here closes that gap.
  function getBeadRef(id: string) {
    let cb = refCallbacks.current.get(id);
    if (!cb) {
      cb = (node: Konva.Node | null) => {
        if (node) {
          beadRefs.current.set(id, node);
          // Position the node before the next Konva draw. Skip if the bead
          // already has a recorded position (re-attach, not a fresh mount).
          if (!prevTargets.current.has(id)) {
            const t = beadTargetsRef.current.get(id);
            if (t) {
              node.x(t.x);
              node.y(t.y);
              node.rotation(t.rotationDeg);
            }
          }
        } else {
          activeTweens.current.get(id)?.destroy();
          activeTweens.current.delete(id);
          beadRefs.current.delete(id);
          prevTargets.current.delete(id);
          // Keep the callback in refCallbacks so React doesn't see the ref
          // function identity change on the next render (which would cause
          // an extra null→new cycle). GC in the effect below when the bead is
          // truly gone from the design.
        }
      };
      refCallbacks.current.set(id, cb);
    }
    return cb;
  }

  const len = pathLengthMm(design);
  const dropMm = design.sizing.kind === 'earrings' ? design.sizing.dropMm : 0;
  const isClosedLoop = design.kind !== 'earrings';
  const isEmpty = isClosedLoop && design.beads.length === 0;
  // User-entered inner circumference. This is the same threshold the sizing
  // panel uses to decide whether the bracelet/necklace is ready.
  const requiredStrandMm = (() => {
    if (design.sizing.kind === 'bracelet') return design.sizing.wristMm;
    if (design.sizing.kind === 'necklace') return design.sizing.neckMm;
    return 0;
  })();
  const currentInnerCircumferenceMm = isClosedLoop ? innerCircumferenceMm(design.beads) : 0;

  // The visible loop is the bead centreline. For a target inner circumference,
  // the centreline needs one average radial bead circumference of allowance.
  const maxBeadFootprintMm = isClosedLoop
    ? design.beads.reduce((m, b) => Math.max(m, beadFootprintMm(b)), 0)
    : 0;
  const defaultBeadRadialMm = maxBeadFootprintMm || design.beads[0]?.sizeMm || 8;
  const averageBeadRadialMm = design.beads.length > 0
    ? design.beads.reduce((sum, bead) => sum + beadRadialSizeMm(bead), 0) / design.beads.length
    : defaultBeadRadialMm;

  // While a drag is active, splice the dragged bead to its preview slot so the
  // OTHER beads relayout (the dragged one's visible position is controlled by
  // Konva's drag system and skipped by the tween effect below).
  const previewBeads = useMemo(() => {
    if (!dragState || dragState.from === dragState.previewTo) return design.beads;
    const arr = design.beads.slice();
    const [b] = arr.splice(dragState.from, 1);
    arr.splice(dragState.previewTo, 0, b);
    return arr;
  }, [design.beads, dragState]);

  const previewPackingMetrics = useMemo(
    () =>
      previewBeads.map((bead) => {
        const crystal = getCrystalOrThrow(bead.crystalSlug);
        const asset = beadImages[crystal.images[bead.variantIndex ?? 0]];
        return packingMetricsForBead(bead, asset);
      }),
    [previewBeads, beadImages],
  );

  const designPackingMetrics = useMemo(
    () =>
      design.beads.map((bead) => {
        const crystal = getCrystalOrThrow(bead.crystalSlug);
        const asset = beadImages[crystal.images[bead.variantIndex ?? 0]];
        return packingMetricsForBead(bead, asset);
      }),
    [design.beads, beadImages],
  );
  const strandMeetsRequiredLength = requiredStrandMm > 0 && currentInnerCircumferenceMm >= requiredStrandMm;
  const shouldDistributeShortStrand = requiredStrandMm > 0 && !strandMeetsRequiredLength;
  const previewPackingLengthMm = useMemo(
    () => cyclicPackingLengthMm(previewBeads, design.originIndex, previewPackingMetrics),
    [previewBeads, design.originIndex, previewPackingMetrics],
  );

  const baseLoopMm = (() => {
    if (!isClosedLoop) return len;
    const radialAllowanceMm = Math.PI * averageBeadRadialMm;
    if (design.sizing.kind === 'bracelet') return design.sizing.wristMm + radialAllowanceMm;
    if (design.sizing.kind === 'necklace') return design.sizing.neckMm + radialAllowanceMm;
    if (design.sizing.kind === 'ring') return ukRingCircumferenceMm(design.sizing.ukSize) + radialAllowanceMm;
    return len;
  })();
  const displayLoopMm = isClosedLoop ? Math.max(baseLoopMm, previewPackingLengthMm) : baseLoopMm;
  const bounds = pathBoundsMm(design.kind, displayLoopMm, dropMm);
  const fitBounds = isClosedLoop
    ? { width: bounds.width + maxBeadFootprintMm, height: bounds.height + maxBeadFootprintMm }
    : bounds;

  const margin = 48;
  const scale = useMemo(() => {
    if (fitBounds.width === 0 || fitBounds.height === 0) return 1;
    const sx = (width - margin * 2) / fitBounds.width;
    const sy = (height - margin * 2) / fitBounds.height;
    return Math.min(sx, sy);
  }, [width, height, fitBounds.width, fitBounds.height]);

  const cx = width / 2;
  const cy = height / 2;

  const placements: Placements = useMemo(() => {
    if (design.kind === 'earrings') {
      const { left, right } = placeEarringPair(design);
      return { left, right };
    }
    return {
      loop: placeOnDisplayRing(
        previewBeads,
        design.originIndex,
        displayLoopMm,
        previewPackingMetrics,
        baseLoopMm,
        strandMeetsRequiredLength,
        shouldDistributeShortStrand,
      ),
    };
  }, [
    design,
    previewBeads,
    displayLoopMm,
    baseLoopMm,
    previewPackingMetrics,
    requiredStrandMm,
    strandMeetsRequiredLength,
    shouldDistributeShortStrand,
  ]);

  // Map bead.id → target screen position. Keyed by id (stable across reorders)
  // so the tween effect can look up where each Konva node should animate to.
  const beadTargets = useMemo(() => {
    const map = new Map<string, { x: number; y: number; rotationDeg: number }>();
    if (design.kind === 'earrings') return map;
    const loop = placements.loop;
    if (!loop) return map;
    previewBeads.forEach((bead, i) => {
      const p = loop[i];
      if (!p) return;
      // Rotate each bead so its configured drill-hole axis stays tangent to
      // the ring. At the seam (angle = -π/2, 12 o'clock), an x-axis bead has
      // rotation 0; a y-axis bead gets an extra -90° pre-rotation.
      const displayAngle = p.angle + loopRotationRad;
      const radiusPx = (displayLoopMm / TAU) * scale;
      const rotationDeg = ((displayAngle + Math.PI / 2) * 180) / Math.PI + beadRotationOffsetDeg(bead);
      map.set(bead.id, {
        x: cx + Math.cos(displayAngle) * radiusPx,
        y: cy + Math.sin(displayAngle) * radiusPx,
        rotationDeg,
      });
    });
    return map;
  }, [previewBeads, placements, cx, cy, scale, design.kind, displayLoopMm, loopRotationRad]);

  // Keep the ref-callback's view of beadTargets fresh.
  beadTargetsRef.current = beadTargets;

  // GC stale ref callbacks for beads that are no longer in the design.
  useEffect(() => {
    const live = new Set(design.beads.map((b) => b.id));
    refCallbacks.current.forEach((_, id) => {
      if (!live.has(id)) refCallbacks.current.delete(id);
    });
  }, [design.beads]);

  // Tween each non-dragged bead from its previous position to the new target.
  // useLayoutEffect runs before browser paint so Konva's next batchDraw sees
  // either the initial position (first mount) or the tween's current value.
  useLayoutEffect(() => {
    design.beads.forEach((bead, i) => {
      if (dragState?.from === i) return; // Konva drag controls this node's pos.
      const node = beadRefs.current.get(bead.id);
      if (!node) return;
      const target = beadTargets.get(bead.id);
      if (!target) return;
      const prev = prevTargets.current.get(bead.id);
      if (!prev || isRotatingLoop) {
        // First placement — snap (no animation for entry). While rotating the
        // whole loop from empty canvas space, also snap so the strand follows
        // the pointer directly instead of chasing it with tween lag.
        activeTweens.current.get(bead.id)?.destroy();
        activeTweens.current.delete(bead.id);
        node.x(target.x);
        node.y(target.y);
        node.rotation(target.rotationDeg);
      } else {
        // Compare the node's *actual* current position to the target, not the
        // last stored target. This is what fixes the "doesn't snap back" bug:
        // when a user drags a bead and drops it on the same slot, prev == target
        // but the node is at the drop point, so we still need to tween it home.
        const currentX = node.x();
        const currentY = node.y();
        const currentRot = node.rotation();
        let rotDelta = target.rotationDeg - currentRot;
        rotDelta = ((rotDelta + 180) % 360 + 360) % 360 - 180;
        const posChanged = Math.abs(currentX - target.x) > 0.5 || Math.abs(currentY - target.y) > 0.5;
        const rotChanged = Math.abs(rotDelta) > 0.5;
        if (posChanged || rotChanged) {
          // Destroy any tween already running on this node so multiple .to()s
          // don't stack and fight each other for x/y/rotation each frame —
          // that's what was leaving beads stranded mid-flight when the user
          // dragged or added beads rapidly.
          activeTweens.current.get(bead.id)?.destroy();
          const tween = new Konva.Tween({
            node,
            x: target.x,
            y: target.y,
            rotation: currentRot + rotDelta,
            duration: 0.18,
            easing: Konva.Easings.EaseOut,
            onFinish: () => {
              if (activeTweens.current.get(bead.id) === tween) {
                activeTweens.current.delete(bead.id);
              }
            },
          });
          tween.play();
          activeTweens.current.set(bead.id, tween);
        }
      }
      prevTargets.current.set(bead.id, target);
    });
  }, [design.beads, beadTargets, dragState, isRotatingLoop]);

  const innerC = currentInnerCircumferenceMm;
  const tooSmall = isClosedLoop && innerC > 0 && innerC < MIN_WRIST_MM;

  const showAddMoreWarning =
    isClosedLoop && requiredStrandMm > 0 && innerC < requiredStrandMm && design.beads.length > 0;
  // Too-long: bracelet exceeds the entered wrist size by more than 1cm. Use the
  // same inner-circumference calculation as the sizing panel so irregular beads
  // count by their along-strand contact and perpendicular/radial footprint.
  const WRIST_LOOSE_TOLERANCE_MM = 10;
  const showTooLongWarning =
    design.sizing.kind === 'bracelet' &&
    innerC > design.sizing.wristMm + WRIST_LOOSE_TOLERANCE_MM &&
    design.beads.length > 0;

  /* --- Trash hit testing ---
   * Reads the *current* pointer position from the stage rather than relying on the
   * event payload (touchend has empty touches[]; mouseup is fine but unified path
   * is simpler).
   */
  function pointerOverTrash(): boolean {
    const trash = trashRef.current;
    const stage = stageRef.current;
    if (!trash || !stage) return false;
    const pointer = stage.getPointerPosition();
    if (!pointer) return false;
    const stageRect = stage.container().getBoundingClientRect();
    const clientX = stageRect.left + pointer.x;
    const clientY = stageRect.top + pointer.y;
    const r = trash.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  /* --- Closed-loop drag ---
   * The dragged bead is free to follow the cursor while the rest of the loop
   * holds its positions. On drop we compute which slot the bead's final angular
   * position belongs to, then commit a single MOVE_BEAD. Trash is checked first.
   */
  function handleBeadDragStart(i: number) {
    setIsDraggingBead(true);
    setDragState({ from: i, previewTo: i });
  }

  function handleBeadDragMove(i: number, e: Konva.KonvaEventObject<DragEvent>) {
    setIsOverTrash(pointerOverTrash());
    if (design.kind === 'earrings') return;
    // 1. Snap dragged node to ring perimeter (imperative — see comment above).
    const node = e.target;
    const dx = node.x() - cx;
    const dy = node.y() - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) {
      node.x(cx + ringRadiusPx);
      node.y(cy);
    } else {
      node.x(cx + (dx / dist) * ringRadiusPx);
      node.y(cy + (dy / dist) * ringRadiusPx);
    }
    // Keep the bead's drill-hole tangent to the ring while it's being dragged,
    // not just at its final slot.
    const liveAngle = Math.atan2(node.y() - cy, node.x() - cx);
    node.rotation(((liveAngle + Math.PI / 2) * 180) / Math.PI + beadRotationOffsetDeg(design.beads[i]));
    // 2. Live preview: compute which slot the bead's angular position belongs
    // to, and update dragState only when it actually changes (avoids re-rendering
    // every pixel). previewBeads then reorders → tween effect animates others.
    const n = design.beads.length;
    if (n < 2) return;
    const slot = angleToSlot(liveAngle);
    const targetIndex = (slot + design.originIndex) % n;
    setDragState((prev) => {
      if (!prev || prev.previewTo === targetIndex) return prev;
      return { ...prev, previewTo: targetIndex };
    });
  }

  function angleToSlot(angle: number): number {
    const n = design.beads.length;
    if (n === 0 || displayLoopMm <= 0) return 0;
    const targetArc = angleToArcMm(angle - loopRotationRad, displayLoopMm);

    if (shouldDistributeShortStrand) {
      const slotPlacements = placeOnDisplayRing(
        design.beads,
        design.originIndex,
        displayLoopMm,
        designPackingMetrics,
        baseLoopMm,
        strandMeetsRequiredLength,
        true,
      );
      let bestSlot = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let k = 0; k < n; k++) {
        const sourceIdx = (k + design.originIndex) % n;
        const slot = slotPlacements[sourceIdx];
        if (!slot) continue;
        const distance = circularArcDistanceMm(targetArc, slot.centerArc, displayLoopMm);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSlot = k;
        }
      }
      return bestSlot;
    }

    let cursor = 0;
    for (let k = 0; k < n; k++) {
      const sourceIdx = (k + design.originIndex) % n;
      const width = designPackingMetrics[sourceIdx]?.nominalWidthMm ?? beadThicknessMm(design.beads[sourceIdx]);
      if (targetArc < cursor + width) return k;
      cursor += width;
    }
    return n - 1;
  }

  /** Constrain the dragged bead to the ring's perimeter so it visibly snaps
   * as the user moves the cursor, instead of floating freely off the loop. */
  const ringRadiusPx = (displayLoopMm / TAU) * scale;
  const maxBeadRadiusPx = (maxBeadFootprintMm / 2) * scale;
  function ringDragBound(pos: { x: number; y: number }): { x: number; y: number } {
    if (design.kind === 'earrings') return pos;
    const dx = pos.x - cx;
    const dy = pos.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return { x: cx + ringRadiusPx, y: cy };
    return { x: cx + (dx / dist) * ringRadiusPx, y: cy + (dy / dist) * ringRadiusPx };
  }

  function stagePointerPolar(): { angle: number; distancePx: number } | null {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return null;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    return { angle: Math.atan2(dy, dx), distancePx: Math.hypot(dx, dy) };
  }

  function pointerIsOutsideLoop(): boolean {
    const stage = stageRef.current;
    const polar = stagePointerPolar();
    if (!stage || !polar) return false;
    const stageScale = stage.scaleX() || 1;
    const outerRadiusPx = (ringRadiusPx + maxBeadRadiusPx + 12) * stageScale;
    return polar.distancePx >= outerRadiusPx;
  }

  function setStageCursor(cursor: string) {
    const stage = stageRef.current;
    if (!stage) return;
    stage.container().style.cursor = cursor;
  }

  function handleStagePointerDown(e: Konva.KonvaEventObject<PointerEvent>) {
    if (!isClosedLoop || design.beads.length === 0 || isDraggingBead) return;
    if (e.target !== e.target.getStage()) return;
    const polar = stagePointerPolar();
    if (!polar || !pointerIsOutsideLoop()) return;
    e.evt.preventDefault();
    loopRotateDragRef.current = { lastAngle: polar.angle, moved: false };
    setIsRotatingLoop(true);
    setStageCursor('grabbing');
  }

  function handleStagePointerMove(e: Konva.KonvaEventObject<PointerEvent>) {
    const rotateDrag = loopRotateDragRef.current;
    if (!rotateDrag) {
      if (e.target === e.target.getStage() && isClosedLoop && design.beads.length > 0 && pointerIsOutsideLoop()) {
        setStageCursor('grab');
      } else if (!isDraggingBead) {
        setStageCursor('');
      }
      return;
    }

    const polar = stagePointerPolar();
    if (!polar) return;
    e.evt.preventDefault();
    const delta = shortestAngleDeltaRad(rotateDrag.lastAngle, polar.angle);
    if (Math.abs(delta) < 0.001) return;
    rotateDrag.lastAngle = polar.angle;
    rotateDrag.moved = true;
    setLoopRotationRad((current) => normalizeAngleRad(current + delta));
  }

  function endLoopRotateDrag() {
    if (!loopRotateDragRef.current) return;
    loopRotateDragRef.current = null;
    setIsRotatingLoop(false);
    setStageCursor('');
  }

  function handleBeadDragEnd(i: number) {
    const dropOnTrash = pointerOverTrash();
    const state = dragState;
    setIsDraggingBead(false);
    setIsOverTrash(false);
    setDragState(null);
    if (dropOnTrash) {
      removeAt(i);
      return;
    }
    if (design.kind === 'earrings' || !state) return;
    if (state.from !== state.previewTo) {
      dispatch({ type: 'MOVE_BEAD', from: state.from, to: state.previewTo });
    }
    // After dragState clears, the tween effect picks up the dragged bead with
    // prev = its old slot and target = its new slot, animating it into place.
  }

  /* --- Keyboard: Delete / Backspace removes the hovered or selected bead;
   *               Escape dismisses the clear-confirm popover. --- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmingClear) {
          e.preventDefault();
          setConfirmingClear(false);
        }
        return;
      }
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      const idx = hoveredIndex ?? selected;
      if (idx == null) return;
      e.preventDefault();
      removeAt(idx);
      setHoveredIndex(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hoveredIndex, selected, removeAt, confirmingClear]);

  /* --- Pinch / wheel zoom ---
   * Two rules requested by the user:
   *   1. The design centre is always pinned to the viewport centre (no horizontal
   *      or vertical drift). Stage.x/y is fully derived from scale.
   *   2. Max zoom-in is capped at the point where the ring + the largest bead
   *      would exit the viewport — so a bead can never get clipped.
   * The wheel handler reads `zoomBoundsRef` (kept fresh by the assignment a few
   * lines above) so the listener doesn't have to be rebound on every render. */
  const zoomBoundsRef = useRef({
    layerScale: 1,
    displayLoopMm: 0,
    maxBeadRadiusMm: 0,
  });
  zoomBoundsRef.current = {
    layerScale: scale,
    displayLoopMm,
    maxBeadRadiusMm: design.beads.reduce((m, b) => Math.max(m, beadFootprintMm(b) / 2), 0),
  };

  // Re-pin design centre when the canvas itself resizes (window/orientation
   // change). Without this, a non-1 zoom would visibly drift after a resize.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = stage.scaleX();
    stage.position({ x: (width / 2) * (1 - s), y: (height / 2) * (1 - s) });
  }, [width, height]);

  function applyZoom(targetScale: number) {
    const stage = stageRef.current;
    if (!stage) return;
    const w = stage.width();
    const h = stage.height();
    const { layerScale, displayLoopMm: lm, maxBeadRadiusMm } = zoomBoundsRef.current;
    const ringRadiusPxAtUnit = (lm / TAU) * layerScale;
    const beadRadiusPxAtUnit = maxBeadRadiusMm * layerScale;
    const designOuterPxAtUnit = ringRadiusPxAtUnit + beadRadiusPxAtUnit;
    // Strict fit cap: outer edge of the largest bead ≤ min(w,h)/2 − safety.
    const safetyPx = 4;
    const fitMax = (Math.min(w, h) / 2 - safetyPx) / Math.max(1, designOuterPxAtUnit);
    const minStage = 0.5;
    const maxStage = Math.max(minStage, fitMax);
    const next = Math.min(maxStage, Math.max(minStage, targetScale));
    // Pin design centre (w/2, h/2 in layer coords) to viewport centre.
    stage.scale({ x: next, y: next });
    stage.position({ x: (w / 2) * (1 - next), y: (h / 2) * (1 - next) });
  }

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const oldScale = stage.scaleX();
      const stepped = oldScale * (e.deltaY < 0 ? 1.1 : 0.9);
      applyZoom(stepped);
    };
    const container = stage.container();
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, []);

  /* --- Reset viewport ---
   * Tweens stage to the largest scale that still keeps everything inside the
   * viewport (capped at 1 so we never zoom in on reset). Centre stays pinned. */
  function resetViewport() {
    const stage = stageRef.current;
    if (!stage) return;
    const w = stage.width();
    const h = stage.height();
    const { layerScale, displayLoopMm: lm, maxBeadRadiusMm } = zoomBoundsRef.current;
    const designOuterPxAtUnit = ((lm / TAU) + maxBeadRadiusMm) * layerScale;
    const safetyPx = 4;
    const fitMax = (Math.min(w, h) / 2 - safetyPx) / Math.max(1, designOuterPxAtUnit);
    const targetScale = Math.min(1, Math.max(0.5, fitMax));
    stage.to({
      x: (w / 2) * (1 - targetScale),
      y: (h / 2) * (1 - targetScale),
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 0.28,
      easing: Konva.Easings.EaseOut,
    });
  }

  const earringBaseY = cy - height / 2 + 40;
  const earringDropPx = dropMm * scale;

  return (
    <div className="relative w-full h-full">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        className="touch-none"
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={endLoopRotateDrag}
        onPointerLeave={endLoopRotateDrag}
        onPointerCancel={endLoopRotateDrag}
      >
        <Layer listening={false}>
          {isClosedLoop && (
            <>
              {/* Transparent-elastic-cord look on the atelier canvas.
                  1. drop shadow: a softly blurred dark ring offset down — the
                     cord is "floating" above the surface.
                  2. cord body: a translucent deep-ink line — the main visible
                     stroke. Low opacity reads as "you can see through it".
                  3. inner highlight: a thin warm-gold line on top of the
                     body — the glossy edge that picks up light along the cord.
                  Below the minimum wrist size, the trio tints amber. */}
              <Circle
                x={cx}
                y={cy + 1.5}
                radius={(displayLoopMm / TAU) * scale}
                stroke="#1a0e0c"
                strokeWidth={3}
                opacity={0.08}
                shadowColor="#1a0e0c"
                shadowBlur={8}
                shadowOpacity={0.18}
              />
              <Circle
                x={cx}
                y={cy}
                radius={(displayLoopMm / TAU) * scale}
                stroke={tooSmall ? '#b45309' : '#9b5e62'}
                strokeWidth={1.6}
                opacity={tooSmall ? 0.45 : 0.35}
              />
              <Circle
                x={cx}
                y={cy}
                radius={(displayLoopMm / TAU) * scale}
                stroke={tooSmall ? '#f59e0b' : '#d5a2a5'}
                strokeWidth={0.5}
                opacity={tooSmall ? 0.75 : 0.55}
              />
            </>
          )}
          {design.kind === 'earrings' && (
            <>
              <Line
                points={[cx - 30, earringBaseY, cx - 30, earringBaseY + earringDropPx]}
                stroke="#a8938f"
                strokeWidth={1.5}
                dash={[4, 4]}
              />
              <Line
                points={[cx + 30, earringBaseY, cx + 30, earringBaseY + earringDropPx]}
                stroke="#a8938f"
                strokeWidth={1.5}
                dash={[4, 4]}
              />
            </>
          )}
        </Layer>

        <Layer>
          {isClosedLoop && design.beads.map((bead, i) => {
            const target = beadTargets.get(bead.id);
            if (!target) return null;
            const crystal = getCrystalOrThrow(bead.crystalSlug);
            // Render at the crystal's configured visual size. Some cutouts
            // preserve their source aspect ratio while packing still uses their
            // physical thread/contact width.
            const isSelected = selected === i;
            const img = beadImages[crystal.images[bead.variantIndex ?? 0]];
            const renderSize = beadRenderSizeMm(bead, img);
            const renderWidthPx = renderSize.widthMm * scale;
            const renderHeightPx = renderSize.heightMm * scale;
            const rh = renderHeightPx / 2;
            const anchorX = renderWidthPx * (crystal.viewportAnchorXRatio ?? 0.5);
            const anchorY = renderHeightPx * (crystal.viewportAnchorYRatio ?? 0.5);
            const select = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
              e.cancelBubble = true;
              setSelected(isSelected ? null : i);
            };
            return (
              <Fragment key={bead.id}>
                {img ? (
                  <KonvaImage
                    ref={getBeadRef(bead.id)}
                    image={img.image}
                    crop={img.crop}
                    width={renderWidthPx}
                    height={renderHeightPx}
                    offsetX={anchorX}
                    offsetY={anchorY}
                    shadowColor={isSelected ? SELECTED_HALO_COLOR : BEAD_SHADOW_COLOR}
                    shadowBlur={isSelected ? SELECTED_HALO_BLUR : BEAD_SHADOW_BLUR}
                    shadowOpacity={isSelected ? SELECTED_HALO_OPACITY : BEAD_SHADOW_OPACITY}
                    draggable
                    dragBoundFunc={ringDragBound}
                    onDragStart={() => handleBeadDragStart(i)}
                    onDragMove={(e) => handleBeadDragMove(i, e)}
                    onDragEnd={() => handleBeadDragEnd(i)}
                    onClick={select}
                    onTap={select}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex((cur) => (cur === i ? null : cur))}
                  />
                ) : (
                  <Circle
                    ref={getBeadRef(bead.id)}
                    radius={rh}
                    fill={crystal.hex}
                    shadowColor={isSelected ? SELECTED_HALO_COLOR : BEAD_SHADOW_COLOR}
                    shadowBlur={isSelected ? SELECTED_HALO_BLUR : BEAD_SHADOW_BLUR}
                    shadowOpacity={isSelected ? SELECTED_HALO_OPACITY : BEAD_SHADOW_OPACITY}
                    draggable
                    onDragStart={() => handleBeadDragStart(i)}
                    onDragMove={(e) => handleBeadDragMove(i, e)}
                    onDragEnd={() => handleBeadDragEnd(i)}
                    onClick={select}
                    onTap={select}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex((cur) => (cur === i ? null : cur))}
                  />
                )}
              </Fragment>
            );
          })}

          {placements.left?.map((p, i) => {
            const bead = design.beads[i];
            if (!bead) return null;
            const crystal = getCrystalOrThrow(bead.crystalSlug);
            const baseX = cx - 30;
            const x = baseX + p.position.x * scale;
            const y = earringBaseY + Math.abs(p.position.y) * scale;
            const r = (bead.sizeMm / 2) * scale;
            const isSelected = selected === i;
            const img = beadImages[crystal.images[bead.variantIndex ?? 0]];
            const select = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
              e.cancelBubble = true;
              setSelected(isSelected ? null : i);
            };
            return (
              <>
                {isSelected && (
                  <Circle key={`L-${bead.id}-sel`} x={x} y={y} radius={r + 2} stroke="#9b5e62" strokeWidth={2.5} listening={false} />
                )}
                {img ? (
                  <KonvaImage
                    key={`L-${bead.id}`}
                    image={img.image}
                    crop={img.crop}
                    x={x}
                    y={y}
                    width={r * 2}
                    height={r * 2}
                    offsetX={r}
                    offsetY={r}
                    onClick={select}
                    onTap={select}
                  />
                ) : (
                  <Circle key={`L-${bead.id}`} x={x} y={y} radius={r} fill={crystal.hex} onClick={select} onTap={select} />
                )}
              </>
            );
          })}

          {placements.right?.map((p, i) => {
            const bead = design.beads[i];
            if (!bead) return null;
            const crystal = getCrystalOrThrow(bead.crystalSlug);
            const baseX = cx + 30;
            const x = baseX + p.position.x * scale;
            const y = earringBaseY + Math.abs(p.position.y) * scale;
            const r = (bead.sizeMm / 2) * scale;
            const img = beadImages[crystal.images[bead.variantIndex ?? 0]];
            return img ? (
              <KonvaImage
                key={`R-${bead.id}`}
                image={img.image}
                crop={img.crop}
                x={x}
                y={y}
                width={r * 2}
                height={r * 2}
                offsetX={r}
                offsetY={r}
                opacity={0.85}
              />
            ) : (
              <Circle
                key={`R-${bead.id}`}
                x={x}
                y={y}
                radius={r}
                fill={crystal.hex}
                stroke="rgba(28,23,51,0.35)"
                strokeWidth={1}
                opacity={0.85}
              />
            );
          })}
        </Layer>

        <Layer listening={false}>
          {isEmpty && (
            <Text
              x={0}
              y={cy - 8}
              width={width}
              align="center"
              text="Pick a crystal to start"
              fill="#6c605e"
              fontSize={14}
            />
          )}
        </Layer>
      </Stage>

      {showAddMoreWarning && (
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 max-w-[calc(100%-1rem)] -translate-x-1/2 sm:top-4">
          <div className="whitespace-nowrap rounded-lg border border-amber-700 bg-amber-600 px-2.5 py-1 text-[11px] font-semibold leading-none text-white shadow-md sm:rounded-full sm:px-4 sm:py-1.5 sm:text-sm sm:leading-normal">
            Please add more crystals
          </div>
        </div>
      )}

      {showTooLongWarning && (
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 max-w-[calc(100%-1rem)] -translate-x-1/2 sm:top-4">
          <div className="whitespace-nowrap rounded-lg border border-amber-700 bg-amber-600 px-2.5 py-1 text-[11px] font-semibold leading-none text-white shadow-md sm:rounded-full sm:px-4 sm:py-1.5 sm:text-sm sm:leading-normal">
            Too big — it may feel a little loose.
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Reset view"
        title="Reset view"
        onClick={resetViewport}
        className={cn(
          'absolute bottom-4 left-4 w-12 h-12 rounded-full',
          'flex items-center justify-center border-2 transition-all select-none',
          'bg-card/76 border-border text-muted-foreground shadow-sm backdrop-blur-sm',
          'hover:bg-white hover:text-foreground',
        )}
      >
        <Crosshair className="w-5 h-5" />
      </button>

      {isClosedLoop && design.beads.length > 0 && (
        <div className="absolute bottom-4 right-4">
          {confirmingClear && (
            <div
              role="dialog"
              aria-label="Clear all beads?"
              className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-border bg-card/94 p-3 shadow-xl backdrop-blur"
            >
              <div className="text-sm text-foreground mb-2">Clear all beads?</div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearAll();
                    setConfirmingClear(false);
                  }}
                  className="rounded-lg bg-red-500/80 px-3 py-1.5 text-xs text-white hover:bg-red-500"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
          <button
            ref={trashRef}
            type="button"
            aria-label="Clear all beads"
            onClick={() => setConfirmingClear((v) => !v)}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all select-none',
              isDraggingBead && isOverTrash
                ? 'bg-red-500/25 border-red-500 scale-110 text-red-700'
                : isDraggingBead
                ? 'bg-card/90 border-border text-foreground'
                : confirmingClear
                ? 'bg-white border-border text-foreground'
                : 'bg-card/76 border-border text-muted-foreground hover:bg-white hover:text-foreground',
            )}
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
