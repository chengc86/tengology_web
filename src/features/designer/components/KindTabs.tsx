'use client';

import Link from 'next/link';
import { KIND_IDS, KINDS } from '../engine/kinds';
import { cn } from '@/lib/utils';
import type { KindId } from '../engine/types';

export function KindTabs({ active, tone = 'light' }: { active: KindId; tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';

  return (
    <div className="-mx-1 overflow-x-auto px-1 scrollbar-thin">
      <div
        className={cn(
          'flex w-max items-center gap-1 rounded-lg p-1',
          dark ? 'border border-white/12 bg-card/10' : 'panel',
        )}
      >
        {KIND_IDS.map((k) => (
          <Link
            key={k}
            href={`/designer/${k}`}
            className={cn(
              'inline-flex h-10 items-center rounded-md px-3 text-sm transition-colors whitespace-nowrap sm:px-4',
              active === k
                ? dark
                  ? 'bg-rose-dark text-white shadow-sm'
                  : 'bg-rose-dark text-white'
                : dark
                ? 'text-white/72 hover:bg-card/10 hover:text-white'
                : 'text-muted-foreground hover:bg-card/60',
            )}
          >
            {KINDS[k].label}
          </Link>
        ))}
      </div>
    </div>
  );
}
