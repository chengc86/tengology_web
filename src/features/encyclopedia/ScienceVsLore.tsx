import { Atom, Sparkles } from 'lucide-react';

/**
 * Signature differentiator vs. ASTRIS — every crystal page contrasts a sober,
 * mineralogical "Science" panel with a "Lore" panel of cultural/spiritual
 * tradition. We give both equal weight and never present lore as medical claim.
 */
export function ScienceVsLore({ science, lore }: { science: React.ReactNode; lore: React.ReactNode }) {
  return (
    <div className="not-prose grid gap-3 md:grid-cols-2">
      <section className="panel p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Atom className="w-3.5 h-3.5" /> Science
        </div>
        <div className="mt-2 text-sm text-foreground/90 leading-relaxed">{science}</div>
      </section>
      <section className="panel p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-moss-dark">
          <Sparkles className="w-3.5 h-3.5" /> Lore
        </div>
        <div className="mt-2 text-sm text-foreground/90 leading-relaxed">{lore}</div>
      </section>
    </div>
  );
}
