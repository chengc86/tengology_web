'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDesignerStore } from '@/features/designer/store/designerStore';
import { placeBeads, pathBoundsMm } from '@/features/designer/engine/geometry';
import { pathLengthMm } from '@/features/designer/engine/sizing';
import { getCrystalOrThrow } from '@/lib/crystals/catalog';

/**
 * Safe-by-default AR mode: user uploads a photo, we composite a draggable, rotatable
 * 2D projection of their design over it. No live tracker — no jitter — no broken
 * AR illusion. The plan calls this out as the primary AR experience.
 */
export function PhotoOverlay() {
  const design = useDesignerStore((s) => s.design);
  const [photo, setPhoto] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1, rot: 0 });
  const fileInput = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPhoto(url);
    setTransform({ x: 0, y: 0, scale: 1, rot: 0 });
  }

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo);
    };
  }, [photo]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setTransform((t) => ({
      ...t,
      x: dragRef.current!.tx + (e.clientX - dragRef.current!.x),
      y: dragRef.current!.ty + (e.clientY - dragRef.current!.y),
    }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {!photo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <input ref={fileInput} type="file" accept="image/*" onChange={onFile} className="hidden" />
          <Button onClick={() => fileInput.current?.click()}>
            <Upload className="w-4 h-4" />
            Upload a photo
          </Button>
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            Hand for bracelets and rings; face for necklaces and earrings.
          </p>
        </div>
      )}

      {photo && (
        <>
          <img src={photo} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          <DraggableOverlay
            transform={transform}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <div className="panel absolute inset-x-3 bottom-3 grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg px-3 py-2 sm:left-1/2 sm:right-auto sm:flex sm:w-auto sm:-translate-x-1/2">
            <Move className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="range" min={0.4} max={2.5} step={0.05}
              value={transform.scale}
              onChange={(e) => setTransform((t) => ({ ...t, scale: Number(e.target.value) }))}
              className="min-w-0 accent-rose-dark"
            />
            <input
              type="range" min={-180} max={180} step={1}
              value={transform.rot}
              onChange={(e) => setTransform((t) => ({ ...t, rot: Number(e.target.value) }))}
              className="col-span-2 min-w-0 accent-rose-dark sm:col-span-1"
            />
            <Button variant="ghost" size="sm" className="col-span-2 sm:col-span-1" onClick={() => setPhoto(null)}>Replace</Button>
          </div>
        </>
      )}

      <div className="panel absolute right-3 top-3 hidden rounded-lg px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground/80 sm:block">
        Preview — final piece may vary
      </div>
    </div>
  );
}

function DraggableOverlay({
  transform,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  transform: { x: number; y: number; scale: number; rot: number };
  onPointerDown: React.PointerEventHandler;
  onPointerMove: React.PointerEventHandler;
  onPointerUp: React.PointerEventHandler;
}) {
  const design = useDesignerStore((s) => s.design);
  const len = pathLengthMm(design);
  const dropMm = design.sizing.kind === 'earrings' ? design.sizing.dropMm : 0;
  const bounds = pathBoundsMm(design.kind, len, dropMm);
  const pxPerMm = 2; // arbitrary base; user scales further
  const w = bounds.width * pxPerMm;
  const h = bounds.height * pxPerMm;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="absolute touch-none cursor-grab active:cursor-grabbing"
      style={{
        left: `calc(50% - ${w / 2}px + ${transform.x}px)`,
        top: `calc(50% - ${h / 2}px + ${transform.y}px)`,
        width: w,
        height: h,
        transform: `scale(${transform.scale}) rotate(${transform.rot}deg)`,
        transformOrigin: 'center',
      }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {design.kind === 'earrings' ? (
          <>
            <EarringStrand design={design} side={-1} w={w} h={h} pxPerMm={pxPerMm} />
            {(design.mirror ?? true) && (
              <EarringStrand design={design} side={1} w={w} h={h} pxPerMm={pxPerMm} />
            )}
          </>
        ) : (
          <LoopOverlay design={design} w={w} h={h} pxPerMm={pxPerMm} />
        )}
      </svg>
    </div>
  );
}

function LoopOverlay({ design, w, h, pxPerMm }: { design: ReturnType<typeof useDesignerStore.getState>['design']; w: number; h: number; pxPerMm: number }) {
  const cx = w / 2, cy = h / 2;
  const placements = placeBeads(design);
  return (
    <g>
      {placements.map((p, i) => {
        const bead = design.beads[i];
        if (!bead) return null;
        const crystal = getCrystalOrThrow(bead.crystalSlug);
        return (
          <circle
            key={bead.id}
            cx={cx + p.position.x * pxPerMm}
            cy={cy + p.position.y * pxPerMm}
            r={(bead.sizeMm / 2) * pxPerMm}
            fill={crystal.hex}
            stroke="#0008"
            strokeWidth={0.5}
          />
        );
      })}
    </g>
  );
}

function EarringStrand({ design, side, w, pxPerMm }: { design: ReturnType<typeof useDesignerStore.getState>['design']; side: -1 | 1; w: number; h: number; pxPerMm: number }) {
  if (design.kind !== 'earrings') return null;
  const baseX = w / 2 + side * 12;
  let y = 8;
  return (
    <g>
      {design.beads.map((b) => {
        const crystal = getCrystalOrThrow(b.crystalSlug);
        const r = (b.sizeMm / 2) * pxPerMm;
        y += r;
        const cy = y;
        y += r;
        return <circle key={b.id + side} cx={baseX} cy={cy} r={r} fill={crystal.hex} stroke="#0008" strokeWidth={0.5} />;
      })}
    </g>
  );
}
