'use client';

import { Trash2, RotateCw, ChevronUp, ChevronDown } from 'lucide-react';
import { useDesignerStore } from '../store/designerStore';
import { getCrystalOrThrow } from '@/lib/crystals/catalog';
import { Button } from '@/components/ui/button';

export function BeadInspector() {
  const selected = useDesignerStore((s) => s.selectedIndex);
  const design = useDesignerStore((s) => s.design);
  const remove = useDesignerStore((s) => s.removeSelected);
  const setSelected = useDesignerStore((s) => s.setSelected);
  const rotate = useDesignerStore((s) => s.rotateLoop);
  const dispatch = useDesignerStore((s) => s.dispatch);

  if (selected == null) return null;
  const bead = design.beads[selected];
  if (!bead) return null;
  const crystal = getCrystalOrThrow(bead.crystalSlug);

  function moveSelected(delta: number) {
    if (selected == null) return;
    const to = (selected + delta + design.beads.length) % design.beads.length;
    dispatch({ type: 'MOVE_BEAD', from: selected, to });
    setSelected(to);
  }

  return (
    <div className="panel space-y-3 rounded-lg p-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-dark">Selected bead</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 p-1.5 shadow-sm">
          <img
            src={crystal.paletteImage ?? crystal.images[0]}
            alt={crystal.name}
            width={44}
            height={44}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain drop-shadow-md"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate font-heading text-xl leading-none text-foreground">{crystal.name}</div>
          <div className="text-[11px] text-muted-foreground">
            Bead {selected + 1} of {design.beads.length} · {bead.sizeMm}mm
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{crystal.blurb}</p>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <Button variant="ghost" size="icon" onClick={() => moveSelected(-1)} aria-label="Move earlier">
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => moveSelected(1)} aria-label="Move later">
          <ChevronDown className="w-4 h-4" />
        </Button>
        {design.kind !== 'earrings' && (
          <Button variant="ghost" size="icon" onClick={() => rotate(1)} aria-label="Rotate loop">
            <RotateCw className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto"
          onClick={remove}
          disabled={design.beads.length <= 1}
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}
