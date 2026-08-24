import { ENCYCLOPEDIA_CRYSTALS } from '@/lib/crystals/catalog';
import { EncyclopediaFilters } from '@/features/encyclopedia/EncyclopediaFilters';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export const metadata = { title: 'Crystal Encyclopedia' };

const materialArchive = {
  image: '/lookbook/encyclopedia-library-ai.jpg',
  title: 'Material archive',
  body: 'A clean library of the crystals, carved stones and fossil coral materials we use in the studio.',
};

export default function EncyclopediaPage() {
  const crystals = [...ENCYCLOPEDIA_CRYSTALS];
  const colorCount = new Set(crystals.map((c) => c.colorGroup)).size;
  const intentionCount = new Set(crystals.flatMap((c) => c.intention)).size;

  return (
    <div className="overflow-hidden bg-background text-foreground">
      {/* Image-backed hero. The scrim is warm (Tengology's foreground brown)
          rather than the original cool near-black, so it sits with the rest
          of the site. Nav lives in the storefront header above. */}
      <section className="relative isolate overflow-hidden bg-foreground text-background">
        <img
          src="/lookbook/encyclopedia-library-ai.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.44]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.215_0.012_55/0.92)_0%,oklch(0.215_0.012_55/0.78)_46%,oklch(0.215_0.012_55/0.48)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.215_0.012_55/0.10)_0%,oklch(0.215_0.012_55/0.14)_54%,oklch(0.215_0.012_55/0.62)_100%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-3 sm:px-6 sm:pb-12 sm:pt-4">
          <header className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div className="min-w-0 max-w-3xl">
              <p className="eyebrow inline-flex items-center gap-2 !text-background/70">
                <BookOpen className="h-3.5 w-3.5" />
                Stone library
              </p>
              <h1 className="mt-4 max-w-full break-words font-heading text-4xl leading-[0.95] min-[420px]:text-5xl sm:text-6xl lg:text-7xl">
                Crystal Encyclopedia
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/76 sm:text-lg">
                A focused archive of crystals and stones we turn into handmade British jewelry in our Oxfordshire studio.
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-3 gap-px overflow-hidden border border-white/16 bg-card/16 text-white backdrop-blur-sm">
              <Metric value={crystals.length} label="stones" />
              <Metric value={colorCount} label="colors" />
              <Metric value={intentionCount} label="intentions" />
            </div>
          </header>
        </div>
      </section>

      <section className="border-b border-border bg-card/72">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm leading-relaxed text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-3xl">
            Browse by stone family, or search by name, colour or origin.
          </p>
          <p className="font-medium text-foreground">
            Handmade in Britain · Made to order in Oxfordshire · Usually crafted in 2-3 days
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <VisualStory {...materialArchive} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:pb-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Browse materials</p>
            <h2 className="mt-2 font-heading text-4xl leading-none text-foreground sm:text-5xl">
              Find the right stone
            </h2>
          </div>
          <Link
            href="/designer/bracelet"
            className="eyebrow inline-flex h-11 w-fit items-center gap-2 border border-foreground px-4 text-foreground transition hover:bg-foreground hover:text-background"
          >
            Open studio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <EncyclopediaFilters crystals={crystals} />
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 bg-foreground/50 px-3 py-4 sm:px-4">
      <div className="font-heading text-3xl leading-none">{value}</div>
      <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/56 sm:tracking-[0.18em]">{label}</div>
    </div>
  );
}

function VisualStory({
  image,
  title,
  body,
}: {
  image: string;
  title: string;
  body: string;
}) {
  return (
    <article className="group">
      <div className="relative overflow-hidden bg-foreground">
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-[16/11] w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:aspect-[16/8] lg:aspect-[16/6]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.215_0.012_55/0.78)_0%,oklch(0.215_0.012_55/0.40)_52%,oklch(0.215_0.012_55/0.12)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
          <div className="max-w-xl">
            <div className="eyebrow !text-background/70">Material archive</div>
            <div className="mt-2 font-heading text-3xl leading-none sm:text-4xl">{title}</div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/76 sm:text-base">{body}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
