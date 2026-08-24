import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ENCYCLOPEDIA_CRYSTALS, getCrystal } from '@/lib/crystals/catalog';
import { minRetailPriceCentsForCrystal } from '@/lib/crystals/retailPricing';
import { ScienceVsLore } from '@/features/encyclopedia/ScienceVsLore';
import { formatCents } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Gem, Sparkles } from 'lucide-react';

export const dynamicParams = false;

export function generateStaticParams() {
  return ENCYCLOPEDIA_CRYSTALS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCrystal(slug);
  if (!c || c.category !== 'crystal') return {};
  return { title: c.name, description: c.blurb };
}

export default async function CrystalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCrystal(slug);
  if (!c || c.category !== 'crystal') notFound();
  const fromPriceCents = minRetailPriceCentsForCrystal(c);

  return (
    <div className="overflow-hidden bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-foreground text-background">
        <img
          src="/lookbook/encyclopedia-detail-ai.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.36]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.215_0.012_55/0.92)_0%,oklch(0.215_0.012_55/0.78)_46%,oklch(0.215_0.012_55/0.55)_100%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-3 sm:px-6 sm:pb-12 sm:pt-4">
          <nav className="flex h-16 items-center justify-between gap-3 border border-white/14 bg-foreground/60 px-3 backdrop-blur-md sm:px-4">
            <Link href="/encyclopedia" className="inline-flex h-10 items-center gap-2 px-2 text-sm text-white/76 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span>All stones</span>
            </Link>
            <Link
              href="/designer/bracelet"
              className="eyebrow inline-flex h-10 items-center justify-center gap-2 border border-background/40 bg-background px-3 !text-foreground transition hover:bg-transparent hover:!text-background sm:px-4"
            >
              <span>Designer</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>

          <header className="grid gap-7 py-10 md:grid-cols-[280px_minmax(0,1fr)] md:items-center lg:grid-cols-[340px_minmax(0,1fr)] lg:py-14">
            <div className="grid aspect-square place-items-center border border-white/16 bg-white/[0.08] p-8 backdrop-blur-sm">
              <img
                src={c.paletteImage ?? c.images[0]}
                alt=""
                loading="eager"
                className="h-full max-h-64 w-full object-contain md:max-h-72"
              />
            </div>
            <div>
              <p className="eyebrow inline-flex items-center gap-2 !text-background/70">
                <Gem className="h-3.5 w-3.5" />
                {c.color}
              </p>
              <h1 className="mt-4 font-heading text-5xl leading-[0.92] sm:text-6xl lg:text-7xl">{c.name}</h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/78 sm:text-lg">{c.blurb}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                {c.chakra.map((k) => (
                  <span key={k} className="inline-flex h-8 items-center border border-white/16 bg-white/[0.08] px-2.5 capitalize text-white/76">
                    {k.replace('-', ' ')} chakra
                  </span>
                ))}
                {c.zodiac.map((z) => (
                  <span key={z} className="inline-flex h-8 items-center border border-white/16 bg-white/[0.08] px-2.5 capitalize text-white/76">
                    {z}
                  </span>
                ))}
                {c.element && (
                  <span className="inline-flex h-8 items-center border border-white/16 bg-white/[0.08] px-2.5 capitalize text-white/76">
                    {c.element}
                  </span>
                )}
              </div>
              <div className="mt-5 text-sm text-background/70">From {formatCents(fromPriceCents)} per bead</div>
            </div>
          </header>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-7 px-4 py-10 sm:px-6 lg:space-y-9 lg:py-14">
        <ScienceVsLore
          science={
            <>
              <p>
                {c.name} is a {c.formation ?? 'naturally occurring'} mineral
                {c.hardness ? `, Mohs hardness ${c.hardness},` : ''} typically sourced from{' '}
                {c.origin.length ? c.origin.join(', ') : 'multiple regions worldwide'}.
              </p>
              {c.sourcing.length > 0 && (
                <p className="mt-2 text-muted-foreground">
                  Our supply chain: {c.sourcing.map((s) => `${s.region} (${s.method}${s.fairTradeCertified ? ', fair-trade certified' : ''})`).join('; ')}.
                </p>
              )}
            </>
          }
          lore={
            <>
              <p>
                Across traditions {c.name.toLowerCase()} has been associated with{' '}
                <em>{c.intention.join(', ')}</em>. We share these correspondences as cultural tradition,
                not medical claim.
              </p>
              {c.zodiac.length > 0 && (
                <p className="mt-2 text-muted-foreground">
                  Often gifted to those born under {c.zodiac.join(' and ')}.
                </p>
              )}
            </>
          }
        />

        <section className="grid gap-3 md:grid-cols-2">
          <ImageNote image="/lookbook/encyclopedia-detail-ai.jpg" title="Material detail" />
          <ImageNote image="/lookbook/encyclopedia-pairings-ai.jpg" title="Pairing context" />
        </section>

        <section className="border p-4 text-sm sm:p-5">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-moss" />
            Use in your design
          </div>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Designs are handmade in Britain after ordering, usually crafted in our Oxfordshire studio within 2-3 days.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {(['bracelet', 'necklace', 'ring', 'earrings'] as const).map((k) => (
              <Link
                key={k}
                href={`/designer/${k}`}
                className="eyebrow inline-flex h-11 items-center justify-center border border-foreground bg-foreground px-3 capitalize text-background transition hover:bg-transparent hover:text-foreground"
              >
                Add to {k}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ImageNote({ image, title }: { image: string; title: string }) {
  return (
    <figure className="relative overflow-hidden bg-foreground">
      <img src={image} alt="" loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover" />
      <figcaption className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(180deg,oklch(0.215_0.012_55/0),oklch(0.215_0.012_55/0.72))] px-4 pb-4 pt-12 font-heading text-2xl leading-none text-white">
        {title}
      </figcaption>
    </figure>
  );
}
