import Link from 'next/link';
import type { Crystal } from '@/lib/crystals/types';
import { minRetailPriceCentsForCrystal } from '@/lib/crystals/retailPricing';
import { formatCents } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export function CrystalCard({ crystal }: { crystal: Crystal }) {
  const fromPriceCents = minRetailPriceCentsForCrystal(crystal);

  return (
    <Link
      href={`/encyclopedia/${crystal.slug}`}
      className="group flex min-h-72 flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-rose hover:shadow-lg"
    >
      <div className="grid aspect-[4/3] place-items-center bg-muted p-5">
        <img
          src={crystal.paletteImage ?? crystal.images[0]}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full max-h-32 w-full object-contain transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-heading text-2xl leading-none text-foreground">{crystal.name}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {crystal.color}
            </div>
          </div>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition group-hover:border-rose group-hover:text-rose-dark">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{crystal.blurb}</p>
        <div className="mt-auto flex w-full items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-wrap gap-1.5">
            {crystal.chakra.slice(0, 2).map((c) => (
              <span key={c} className="rounded-md bg-muted px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                {c.replace('-', ' ')}
              </span>
            ))}
          </div>
          <span className="shrink-0 text-xs font-semibold text-foreground">{formatCents(fromPriceCents)}</span>
        </div>
      </div>
    </Link>
  );
}
