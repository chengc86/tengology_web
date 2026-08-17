'use client';

import { Box, Layers, Camera } from 'lucide-react';
import { useDesignerStore, type ViewMode } from '../store/designerStore';
import { cn } from '@/lib/utils';

const ITEMS: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: '2d', label: '2D', icon: Layers },
  { id: '3d', label: '3D', icon: Box },
  { id: 'ar', label: 'AR', icon: Camera },
];

export function PreviewToggle({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const view = useDesignerStore((s) => s.view);
  const setView = useDesignerStore((s) => s.setView);
  const dark = tone === 'dark';

  return (
    <div className={cn('inline-flex items-center rounded-lg p-1', dark ? 'border border-white/12 bg-card/10' : 'panel')}>
      {ITEMS.map((it) => {
        const Icon = it.icon;
        const active = view === it.id;
        return (
          <button
            key={it.id}
            aria-label={`${it.label} preview`}
            onClick={() => setView(it.id)}
            className={cn(
              'inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors sm:px-3',
              active
                ? dark
                  ? 'bg-rose-dark text-white shadow-sm'
                  : 'bg-rose-dark text-white'
                : dark
                ? 'text-white/72 hover:bg-card/10 hover:text-white'
                : 'text-muted-foreground hover:bg-card/60',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
