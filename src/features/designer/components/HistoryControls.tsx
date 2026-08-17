'use client';

import { Undo2, Redo2 } from 'lucide-react';
import { useDesignerStore, designerSelectors } from '../store/designerStore';
import { Button } from '@/components/ui/button';

export function HistoryControls({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const canUndo = useDesignerStore(designerSelectors.canUndo);
  const canRedo = useDesignerStore(designerSelectors.canRedo);
  const undo = useDesignerStore((s) => s.undo);
  const redo = useDesignerStore((s) => s.redo);
  const darkButtonClass = tone === 'dark' ? 'text-white/72 hover:bg-card/10 hover:text-white disabled:text-white/25' : undefined;

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="icon" className={darkButtonClass} disabled={!canUndo} onClick={undo} aria-label="Undo">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className={darkButtonClass} disabled={!canRedo} onClick={redo} aria-label="Redo">
        <Redo2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
