'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { CRYSTALS } from '@/lib/crystals/catalog';
import { retailPriceCentsForCrystal } from '@/lib/crystals/retailPricing';
import { useDesignerStore } from '../store/designerStore';
import { getKind } from '../engine/kinds';
import type { ColorGroup, Crystal, ProductCategory } from '@/lib/crystals/types';
import { cn, formatCents } from '@/lib/utils';

type LifestylePhoto = { src: string; alt: string };

const ALPHABET_PHOTOS: LifestylePhoto[] = [
  { src: '/lookbook/gold-alphabet-reference.jpg', alt: '18K gold alphabet connector spacer charms arranged in a product grid' },
  { src: '/beads/gold-alphabet-grid.png', alt: 'Transparent 18K gold alphabet charms with open jump rings' },
];

// Lifestyle "worn on the wrist" photos per crystal, surfaced in the hover preview.
// Each entry is a short list of public-relative paths. Crystals not listed get no
// preview gallery (just the name + blurb).
const LIFESTYLE_PHOTOS: Record<string, LifestylePhoto[]> = {
  'clear-quartz': [
    { src: '/lookbook/clear-quartz-worn-1.jpg', alt: 'Clear quartz bracelet on a wrist, close-up' },
    { src: '/lookbook/clear-quartz-worn-2.jpg', alt: 'Clear quartz bracelet styled with a white linen outfit' },
  ],
  'howlite': [
    { src: '/lookbook/howlite-worn-1.jpg', alt: 'Three howlite bracelets stacked on a wrist' },
    { src: '/lookbook/howlite-worn-2.jpg', alt: 'Howlite bracelet held in the palm of a hand' },
  ],
  'yanyuan-agate': [
    { src: '/lookbook/yanyuan-agate-worn-1.jpg', alt: 'Yanyuan agate beads showing the natural colour range across fingertips' },
    { src: '/lookbook/yanyuan-agate-worn-2.jpg', alt: 'Yanyuan agate donut beads stacked vertically on a hand' },
  ],
  'coral-jade-moon': [
    { src: '/lookbook/coral-jade-moon-detail-1.jpg', alt: 'Coral jade moon beads showing carved crescent shapes and floral coral patterning' },
    { src: '/lookbook/coral-jade-moon-detail-2.jpg', alt: 'Assorted coral jade moon beads arranged on a light surface' },
  ],
  'coral-jade-star': [
    { src: '/lookbook/coral-jade-star-detail-1.jpg', alt: 'Coral jade star beads showing assorted colours and fossil coral patterning' },
    { src: '/lookbook/coral-jade-star-detail-2.jpg', alt: 'Close-up of glossy coral jade star beads arranged on a light surface' },
  ],
  'rose-dark-rose': [
    { src: '/lookbook/rose-dark-rose-detail-1.jpg', alt: 'Rose quartz carved rose beads showing the front flower detail' },
    { src: '/lookbook/rose-dark-rose-detail-2.jpg', alt: 'Rose quartz carved rose beads showing the side carving and glossy surface' },
  ],
  'citrine-nugget': [
    { src: '/lookbook/citrine-nugget-detail-1.jpg', alt: 'Citrine nugget beads showing irregular honey-yellow shapes and natural inclusions' },
    { src: '/lookbook/citrine-nugget-detail-2.jpg', alt: 'Close-up of glossy citrine nugget beads arranged on a light surface' },
  ],
  'red-tigers-eye': [
    { src: '/lookbook/red-tigers-eye-detail-1.jpg', alt: "Red tiger's eye bracelet arranged on a light surface" },
    { src: '/lookbook/red-tigers-eye-worn-1.jpg', alt: "Red tiger's eye bracelet worn on a wrist" },
  ],
  'red-agate': [
    { src: '/lookbook/red-agate-detail-1.jpg', alt: 'Red agate bracelet held in a hand, showing translucent wine-red round beads' },
    { src: '/lookbook/red-agate-worn-1.jpg', alt: 'Red agate bracelet worn on a wrist' },
  ],
  'ice-obsidian': [
    { src: '/lookbook/ice-obsidian-held-1.jpg', alt: 'Ice obsidian bracelet held in a hand, showing smoky transparent beads and horizontal drill channels' },
    { src: '/lookbook/ice-obsidian-detail-1.jpg', alt: 'Ice obsidian bracelet arranged on a fabric tray, showing the full strand shape' },
  ],
  'silver-sheen-obsidian': [
    { src: '/lookbook/silver-sheen-obsidian-detail-1.jpg', alt: 'Silver sheen obsidian faceted bead bracelets held in the palm of a hand' },
    { src: '/lookbook/silver-sheen-obsidian-worn-1.jpg', alt: 'Silver sheen obsidian faceted bead bracelet worn on a wrist' },
  ],
  'silver-sheen-obsidian-heart': [
    { src: '/lookbook/silver-sheen-obsidian-heart-worn-1.jpg', alt: 'Silver sheen obsidian heart bead bracelet worn on a wrist' },
    { src: '/lookbook/silver-sheen-obsidian-heart-detail-1.jpg', alt: 'Silver sheen obsidian heart bead bracelet arranged on a fabric tray' },
  ],
  'silver-sheen-obsidian-square': [
    { src: '/lookbook/silver-sheen-obsidian-square-detail-1.jpg', alt: 'Silver sheen obsidian square beads held in the palm of a hand' },
    { src: '/lookbook/silver-sheen-obsidian-square-detail-2.jpg', alt: 'Silver sheen obsidian square beads arranged on a white surface' },
  ],
  'silver-sheen-obsidian-cat': [
    { src: '/lookbook/silver-sheen-obsidian-cat-detail-1.jpg', alt: 'Silver sheen obsidian cat bead bracelet arranged on a white surface' },
    { src: '/lookbook/silver-sheen-obsidian-cat-worn-1.jpg', alt: 'Silver sheen obsidian cat bead bracelet worn on a wrist' },
  ],
  'silver-sheen-obsidian-rondelle': [
    { src: '/lookbook/silver-sheen-obsidian-rondelle-detail-1.jpg', alt: 'Silver sheen obsidian rondelle bracelets held in the palm of a hand' },
    { src: '/lookbook/silver-sheen-obsidian-rondelle-worn-1.jpg', alt: 'Silver sheen obsidian rondelle bracelet worn on a wrist' },
  ],
};

const LIFESTYLE_PHOTOS_BY_SIZE: Record<string, Record<number, LifestylePhoto[]>> = {
  'tigers-eye': {
    [8.5]: [
      { src: '/lookbook/tigers-eye-8-5mm-detail.jpg', alt: "Tiger's eye 8.5mm bracelet arranged on a fabric tray" },
      { src: '/lookbook/tigers-eye-8-5mm-worn.jpg', alt: "Tiger's eye 8.5mm bracelet worn on a wrist" },
    ],
    [10.5]: [
      { src: '/lookbook/tigers-eye-10-5mm-detail.jpg', alt: "Tiger's eye 10.5mm bracelet arranged on a fabric tray" },
      { src: '/lookbook/tigers-eye-10-5mm-worn.jpg', alt: "Tiger's eye 10.5mm bracelet worn on a wrist" },
    ],
  },
  'blue-tigers-eye': {
    [10.5]: [
      { src: '/lookbook/blue-tigers-eye-10-5mm-worn.jpg', alt: "Blue tiger's eye 10.5mm strands held in the palm of a hand" },
      { src: '/lookbook/blue-tigers-eye-10-5mm-detail.jpg', alt: "Blue tiger's eye 10.5mm bracelets arranged on a white display surface" },
    ],
  },
  'blue-tigers-eye-premium': {
    12: [
      { src: '/lookbook/blue-tigers-eye-premium-12mm-worn.jpg', alt: "Premium blue tiger's eye 12mm bracelet held in the palm of a hand" },
      { src: '/lookbook/blue-tigers-eye-premium-12mm-detail.jpg', alt: "Premium blue tiger's eye 12mm bracelet arranged on a fabric tray" },
    ],
  },
  'yellow-agate-round': {
    [6.5]: [
      { src: '/lookbook/yellow-agate-round-6-5mm-worn.jpg', alt: 'Yellow agate round 6.5mm bracelets worn on a wrist' },
      { src: '/lookbook/yellow-agate-round-6-5mm-detail.jpg', alt: 'Yellow agate round 6.5mm bead strands arranged on a white surface' },
    ],
    [8.5]: [
      { src: '/lookbook/yellow-agate-round-8-5mm-worn.jpg', alt: 'Yellow agate round 8.5mm bracelet worn on a wrist' },
      { src: '/lookbook/yellow-agate-round-8-5mm-detail.jpg', alt: 'Yellow agate round 8.5mm bracelet arranged on a fabric tray' },
    ],
  },
  'green-agate': {
    [6.3]: [
      { src: '/lookbook/green-agate-6-3mm-held.jpg', alt: 'Green agate 6.3mm bracelet strands held in the palm of a hand' },
      { src: '/lookbook/green-agate-6-3mm-worn.jpg', alt: 'Green agate 6.3mm bracelet strands worn on a wrist' },
    ],
    10: [
      { src: '/lookbook/green-agate-10mm-held.jpg', alt: 'Green agate 10mm bracelet held in the palm of a hand' },
      { src: '/lookbook/green-agate-10mm-worn.jpg', alt: 'Green agate 10mm bracelet worn on a wrist' },
    ],
  },
  'blue-agate': {
    [6.3]: [
      { src: '/lookbook/blue-agate-6-3mm-worn.jpg', alt: 'Blue agate 6.3mm bracelet strands worn on a wrist' },
      { src: '/lookbook/blue-agate-6-3mm-detail.jpg', alt: 'Blue agate 6.3mm bracelet strands arranged on a white surface' },
    ],
    [10.2]: [
      { src: '/lookbook/blue-agate-10-2mm-worn.jpg', alt: 'Blue agate 10.2mm bracelet worn on a wrist' },
      { src: '/lookbook/blue-agate-10-2mm-detail.jpg', alt: 'Blue agate 10.2mm bracelet arranged on a fabric tray' },
    ],
    [11.7]: [
      { src: '/lookbook/blue-agate-11-7mm-worn.jpg', alt: 'Blue agate 11.7mm bracelet worn on a wrist' },
      { src: '/lookbook/blue-agate-11-7mm-detail.jpg', alt: 'Blue agate 11.7mm bracelet arranged on a white surface' },
    ],
  },
  'lychee-jelly': {
    6: [
      { src: '/lookbook/lychee-jelly-6mm-held.jpg', alt: 'Lychee jelly 6mm bracelet strands held in the palm of a hand' },
      { src: '/lookbook/lychee-jelly-6mm-worn.jpg', alt: 'Lychee jelly 6mm bracelet strands worn on a wrist' },
    ],
    8: [
      { src: '/lookbook/lychee-jelly-8mm-held.jpg', alt: 'Lychee jelly 8mm bracelet strands held in the palm of a hand' },
      { src: '/lookbook/lychee-jelly-8mm-worn.jpg', alt: 'Lychee jelly 8mm bracelet strands worn on a wrist' },
    ],
    10: [
      { src: '/lookbook/lychee-jelly-10mm-held.jpg', alt: 'Lychee jelly 10mm bracelet strands held in the palm of a hand' },
      { src: '/lookbook/lychee-jelly-10mm-worn.jpg', alt: 'Lychee jelly 10mm bracelet strands worn on a wrist' },
    ],
    12: [
      { src: '/lookbook/lychee-jelly-12mm-worn.jpg', alt: 'Lychee jelly 12mm bracelet strands held in the palm of a hand' },
      { src: '/lookbook/lychee-jelly-12mm-detail.jpg', alt: 'Lychee jelly 12mm bracelet strands arranged on a fabric tray' },
    ],
  },
  'silver-sheen-obsidian': {
    10: [
      { src: '/lookbook/silver-sheen-obsidian-10mm-detail.jpg', alt: 'Silver sheen obsidian 10mm faceted bracelet arranged on a fabric tray' },
      { src: '/lookbook/silver-sheen-obsidian-10mm-worn.jpg', alt: 'Silver sheen obsidian 10mm faceted bracelet worn on a wrist' },
    ],
  },
  'silver-sheen-obsidian-round': {
    6: [
      { src: '/lookbook/silver-sheen-obsidian-round-6mm-worn.jpg', alt: 'Silver sheen obsidian 6mm round bracelet worn on a wrist' },
      { src: '/lookbook/silver-sheen-obsidian-round-6mm-detail.jpg', alt: 'Silver sheen obsidian 6mm round bracelet arranged on a fabric tray' },
    ],
    8: [
      { src: '/lookbook/silver-sheen-obsidian-round-8mm-worn.jpg', alt: 'Silver sheen obsidian 8mm round bracelet worn on a wrist' },
      { src: '/lookbook/silver-sheen-obsidian-round-8mm-detail.jpg', alt: 'Silver sheen obsidian 8mm round bracelet arranged on a white surface' },
    ],
    12: [
      { src: '/lookbook/silver-sheen-obsidian-round-12mm-worn.jpg', alt: 'Silver sheen obsidian 12mm round bracelet worn on a wrist' },
      { src: '/lookbook/silver-sheen-obsidian-round-12mm-detail.jpg', alt: 'Silver sheen obsidian 12mm round beads arranged on a fabric tray' },
    ],
  },
  aquamarine: {
    10: [
      { src: '/lookbook/aquamarine-10mm-worn.jpg', alt: 'Aquamarine 10mm bracelet worn on a wrist' },
      { src: '/lookbook/aquamarine-10mm-detail.jpg', alt: 'Aquamarine 10mm round bead bracelet arranged on a fabric tray' },
    ],
    12: [
      { src: '/lookbook/aquamarine-12mm-worn.jpg', alt: 'Aquamarine 12mm bracelet worn on a wrist' },
      { src: '/lookbook/aquamarine-12mm-detail.jpg', alt: 'Aquamarine 12mm bracelets arranged on a fabric tray' },
    ],
  },
};

const CATEGORY_FILTERS: { id: ProductCategory | null; label: string }[] = [
  { id: null, label: 'All' },
  { id: 'crystal', label: 'Crystals' },
  { id: 'alphabet', label: 'Alphabet' },
];

const COLOR_GROUPS: { id: ColorGroup; label: string; swatch: string }[] = [
  { id: 'black',  label: 'Black',  swatch: '#252221' },
  { id: 'red',    label: 'Red',    swatch: '#c33a3a' },
  { id: 'orange', label: 'Orange', swatch: '#e08020' },
  { id: 'yellow', label: 'Yellow', swatch: '#e7cb50' },
  { id: 'green',  label: 'Green',  swatch: '#3a8a4a' },
  { id: 'teal',   label: 'Teal',   swatch: '#2ea5a1' },
  { id: 'blue',   label: 'Blue',   swatch: '#3c74b0' },
  { id: 'purple', label: 'Purple', swatch: '#7a4ca0' },
  { id: 'pink',   label: 'Pink',   swatch: '#f0a8b8' },
  { id: 'white',  label: 'White',  swatch: '#e8e8f0' },
];

function priceCentsFor(crystal: Crystal, sizeMm: number): number {
  return retailPriceCentsForCrystal(crystal, sizeMm);
}

function formatPrice(cents: number): string {
  return formatCents(cents);
}

export function CrystalPalette() {
  const addAtEnd = useDesignerStore((s) => s.addBeadAtEnd);
  const kindId = useDesignerStore((s) => s.design.kind);
  const kindSizes = getKind(kindId).beadSizesMm;

  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | null>(null);
  const [colorFilter, setColorFilter] = useState<ColorGroup | null>(null);
  const [query, setQuery] = useState('');
  const [hoverPreview, setHoverPreview] = useState<{ crystal: Crystal; sizeMm: number; x: number; y: number } | null>(null);

  const filtered = CRYSTALS.filter((c) => {
    if (categoryFilter && c.category !== categoryFilter) return false;
    if (colorFilter && c.colorGroup !== colorFilter) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  // Flatten into (crystal, size) variants so the user picks both in one tap.
  // A crystal's own `availableSizesMm` reflects real inventory and overrides
  // the kind's generic size list when present.
  const variants = filtered.flatMap((c) => {
    const sizes = (c.availableSizesMm ?? kindSizes).slice().sort((a, b) => a - b);
    return sizes.map((sizeMm) => ({ crystal: c, sizeMm, priceCents: priceCentsFor(c, sizeMm) }));
  });

  const maxSize = variants.length > 0 ? Math.max(...variants.map((v) => v.sizeMm)) : Math.max(...kindSizes);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-dark">Materials</div>
          <div className="mt-1 font-heading text-2xl leading-none text-foreground">Crystal palette</div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search materials..."
            className="h-11 w-full rounded-lg border border-border bg-card/86 pl-10 pr-3 text-base shadow-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 sm:text-sm"
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-border bg-card/70 p-1 shadow-sm">
          {CATEGORY_FILTERS.map((filter) => {
            const active = categoryFilter === filter.id;
            return (
              <button
                key={filter.label}
                onClick={() => setCategoryFilter(filter.id)}
                className={cn(
                  'h-8 rounded-md text-xs font-medium transition-colors',
                  active
                    ? 'bg-rose-dark text-white'
                    : 'text-muted-foreground hover:bg-white hover:text-foreground',
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        <div className="-mx-1 overflow-x-auto px-1 scrollbar-thin">
          <div className="flex w-max gap-1.5 pt-3 lg:w-auto lg:flex-wrap">
            <button
              onClick={() => setColorFilter(null)}
              className={cn(
                'h-9 rounded-lg border px-3 text-xs font-medium transition-colors',
                colorFilter === null
                  ? 'border-rose-dark bg-rose-dark text-white'
                  : 'border-border bg-card/70 text-muted-foreground hover:bg-white hover:text-foreground',
              )}
            >
              All
            </button>
            {COLOR_GROUPS.map((g) => {
              const active = colorFilter === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setColorFilter(active ? null : g.id)}
                  title={g.label}
                  aria-label={g.label}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-rose bg-white text-foreground'
                      : 'border-border bg-card/70 text-muted-foreground hover:bg-white hover:text-foreground',
                  )}
                >
                  <span
                    aria-hidden
                    className="w-3.5 h-3.5 rounded-full ring-1 ring-white/15"
                    style={{ background: g.swatch }}
                  />
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-3 scrollbar-thin">
        <div className="grid grid-cols-2 gap-2 min-[430px]:grid-cols-3 lg:grid-cols-2">
          {variants.map(({ crystal, sizeMm, priceCents }) => {
            const ratio = sizeMm / maxSize;
            const tileImgPx = Math.round(56 * ratio + 24);
            return (
              <button
                key={`${crystal.slug}-${sizeMm}`}
                onClick={() => addAtEnd(crystal.slug, sizeMm)}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setHoverPreview({ crystal, sizeMm, x: rect.right + 12, y: rect.top });
                }}
                onMouseLeave={() => setHoverPreview(null)}
                className="group flex min-h-36 flex-col items-center gap-2 rounded-lg border border-border bg-card/72 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose hover:bg-white hover:shadow-md"
              >
                <div className="flex h-20 w-full items-center justify-center rounded-md bg-muted/45 px-2">
                  <img
                    src={crystal.paletteImage ?? crystal.images[0]}
                    alt={`${crystal.name} ${sizeMm}mm`}
                    width={tileImgPx}
                    height={tileImgPx}
                    loading="lazy"
                    decoding="async"
                    style={{ width: `${tileImgPx}px`, height: `${tileImgPx}px` }}
                    className="object-contain drop-shadow-md transition-transform group-hover:scale-110"
                  />
                </div>
                <div className="text-center leading-tight">
                  <div className="text-xs text-foreground font-medium">{crystal.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {sizeMm}mm · <span className="text-foreground font-semibold">{formatPrice(priceCents)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {variants.length === 0 && (
          <div className="rounded-lg border border-border bg-card/72 py-8 text-center text-sm text-muted-foreground shadow-sm">
            No materials match.
          </div>
        )}
      </div>

      {hoverPreview && <HoverPreview {...hoverPreview} />}
    </div>
  );
}

function HoverPreview({ crystal, sizeMm, x, y }: { crystal: Crystal; sizeMm: number; x: number; y: number }) {
  if (typeof document === 'undefined') return null;

  const photos = LIFESTYLE_PHOTOS_BY_SIZE[crystal.slug]?.[sizeMm]
    ?? LIFESTYLE_PHOTOS[crystal.slug]
    ?? (crystal.category === 'alphabet' ? ALPHABET_PHOTOS : []);
  // Clamp inside the viewport so the card never gets cut off at the right edge.
  const CARD_WIDTH = 640;
  const CARD_HEIGHT = 560;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : CARD_WIDTH + 24;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : CARD_HEIGHT + 24;
  const cardWidth = Math.min(CARD_WIDTH, viewportWidth - 24);
  const left = Math.max(12, Math.min(x, viewportWidth - cardWidth - 12));
  const top = Math.max(12, Math.min(y, viewportHeight - CARD_HEIGHT - 12));

  return createPortal(
    <div
      role="tooltip"
      aria-label={`${crystal.name} details`}
      style={{ position: 'fixed', left, top, width: cardWidth, zIndex: 1000 }}
      className="pointer-events-none space-y-3 rounded-lg border border-border bg-card/96 p-4 shadow-2xl backdrop-blur animate-fade-in"
    >
      <div>
        <h3 className="font-heading text-lg text-foreground leading-tight">{crystal.name}</h3>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
          {crystal.color}
        </p>
      </div>

      {photos.length > 0 && (
        <div className={cn('grid gap-2', photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {photos.map((p) => (
            <img
              key={p.src}
              src={p.src}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              className="h-64 w-full rounded-md object-cover"
            />
          ))}
        </div>
      )}

      <p className="text-xs text-foreground leading-relaxed">{crystal.blurb}</p>
    </div>,
    document.body,
  );
}
