'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Crystal } from '@/lib/crystals/types';
import { CrystalCard } from './CrystalCard';
import { Gem, Search, X } from 'lucide-react';

type MaterialTypeId = 'quartz' | 'obsidian' | 'fossil-coral' | 'agate' | 'beryl' | 'howlite' | 'carved';

const MATERIAL_TYPES: Array<{
  id: MaterialTypeId;
  label: string;
  body: string;
  matches: (crystal: Crystal) => boolean;
}> = [
  {
    id: 'quartz',
    label: 'Quartz family',
    body: 'Quartz, citrine and tiger eye',
    matches: (c) => /quartz|citrine|tiger/i.test(c.name),
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    body: 'Black, silver sheen and ice obsidian',
    matches: (c) => /obsidian/i.test(c.name),
  },
  {
    id: 'fossil-coral',
    label: 'Fossil coral',
    body: 'Coral jade carved forms',
    matches: (c) => c.slug.startsWith('coral-jade'),
  },
  {
    id: 'agate',
    label: 'Agate',
    body: 'Layered agate materials',
    matches: (c) => /agate/i.test(c.name),
  },
  {
    id: 'beryl',
    label: 'Beryl',
    body: 'Aquamarine and related stones',
    matches: (c) => /aquamarine/i.test(c.name),
  },
  {
    id: 'howlite',
    label: 'Howlite',
    body: 'White veined howlite',
    matches: (c) => /howlite/i.test(c.name),
  },
  {
    id: 'carved',
    label: 'Carved shapes',
    body: 'Hearts, moons, stars and sculptural beads',
    matches: (c) => /heart|moon|star|rose|bear|cat|square|rondelle|nugget/i.test(c.name),
  },
];

export function EncyclopediaFilters({ crystals }: { crystals: Crystal[] }) {
  const [materialType, setMaterialType] = useState<MaterialTypeId | null>(null);
  const [query, setQuery] = useState('');
  const hasFilters = Boolean(materialType || query);

  const materialOptions = useMemo(
    () =>
      MATERIAL_TYPES.map((type) => ({
        ...type,
        count: crystals.filter(type.matches).length,
      })).filter((type) => type.count > 0),
    [crystals],
  );

  const filtered = useMemo(
    () =>
      crystals.filter((c) => {
        if (materialType && !MATERIAL_TYPES.find((type) => type.id === materialType)?.matches(c)) return false;
        if (query) {
          // Colour is no longer a filter, but it stays searchable as free text.
          const haystack = [c.name, c.color, c.blurb, ...c.origin].join(' ').toLowerCase();
          if (!haystack.includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [crystals, materialType, query],
  );

  return (
    <>
      <div className="mb-6 rounded-lg border border-border bg-card/76 p-3 shadow-sm backdrop-blur-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Filter</div>
            <div className="mt-1 font-heading text-2xl leading-none text-foreground">
              {filtered.length} stone{filtered.length === 1 ? '' : 's'}
            </div>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setMaterialType(null);
                setQuery('');
              }}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition hover:border-rose hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crystals..."
            className="h-12 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-base shadow-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 sm:text-sm"
          />
        </label>

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Gem className="h-3.5 w-3.5 text-rose-dark" />
            Stone type
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {materialOptions.map((type) => {
              const active = materialType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setMaterialType(active ? null : type.id)}
                  className={cn(
                    'rounded-lg border px-3 py-3 text-left transition-colors',
                    active
                      ? 'border-rose-dark bg-rose-dark text-white'
                      : 'border-border bg-card/72 text-muted-foreground hover:border-rose hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-current">{type.label}</span>
                    <span className={cn('text-[11px]', active ? 'text-white/72' : 'text-muted-foreground')}>
                      {type.count}
                    </span>
                  </span>
                  <span className={cn('mt-1 block text-xs leading-snug', active ? 'text-white/76' : 'text-muted-foreground')}>
                    {type.body}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {filtered.map((c) => <CrystalCard key={c.slug} crystal={c} />)}
      </div>
      {filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-card/72 py-12 text-center text-sm text-muted-foreground">
          No crystals match these filters.
        </div>
      )}
    </>
  );
}
