'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { BookOpen, Gem, Ruler, Share2, SlidersHorizontal, Sparkles, ShoppingBag } from 'lucide-react';
import { DesignStateSchema, type DesignState, type KindId } from '../engine/types';
import { useDesignerStore } from '../store/designerStore';
import { CrystalPalette } from './CrystalPalette';
import { BeadInspector } from './BeadInspector';
import { SizingPanel } from './SizingPanel';
import { HistoryControls } from './HistoryControls';
import { KindTabs } from './KindTabs';
import { PreviewToggle } from './PreviewToggle';
import { ShareModal } from './ShareModal';
import { Button } from '@/components/ui/button';
import { tryDecodeDesign, encodeDesign } from '../engine/serialize';
import { priceDesign } from '../engine/pricing';
import { innerCircumferenceMm } from '../engine/wristFit';
import { cn, formatCents, centsToPounds } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';

// Konva is browser-only.
const KonvaCanvas2D = dynamic(
  () => import('./KonvaCanvas2D').then((m) => m.KonvaCanvas2D),
  { ssr: false, loading: () => <div className="w-full h-full" /> },
);

const ThreePreview = dynamic(
  () => import('@/features/preview-3d/ThreePreview').then((m) => m.ThreePreview),
  { ssr: false, loading: () => <div className="w-full h-full" /> },
);

const ARTryOn = dynamic(
  () => import('@/features/ar/ARTryOn').then((m) => m.ARTryOn),
  { ssr: false, loading: () => <div className="w-full h-full" /> },
);

const AISuggestPanel = dynamic(
  () => import('../ai/AISuggestPanel').then((m) => m.AISuggestPanel),
  { ssr: false },
);

interface Props {
  kind: KindId;
  encodedDesign?: string;
  /** Anchor product every bespoke cart line points at. See lib/bespoke.ts. */
  bespokeProductId: string;
}

type MobilePanel = 'crystals' | 'details' | 'size';

const LOCAL_DRAFT_KEY_PREFIX = 'tengology:designer:draft:';

function localDraftKey(kind: KindId) {
  return `${LOCAL_DRAFT_KEY_PREFIX}${kind}`;
}

function readLocalDraft(kind: KindId): DesignState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(localDraftKey(kind));
    if (!raw) return null;
    const parsed = DesignStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.kind !== kind) {
      window.localStorage.removeItem(localDraftKey(kind));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLocalDraft(design: DesignState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(localDraftKey(design.kind), JSON.stringify(design));
  } catch {
    // Browsers can reject storage in private mode or when quota is exceeded.
  }
}

export function DesignerShell({ kind, encodedDesign, bespokeProductId }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const reset = useDesignerStore((s) => s.reset);
  const load = useDesignerStore((s) => s.load);
  const design = useDesignerStore((s) => s.design);
  const view = useDesignerStore((s) => s.view);
  const selectedIndex = useDesignerStore((s) => s.selectedIndex);
  const [shareOpen, setShareOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('crystals');

  // Sync URL/local draft -> store: share links win, otherwise restore this device's draft.
  useEffect(() => {
    setDraftHydrated(false);
    const decoded = tryDecodeDesign(encodedDesign ?? null);
    if (decoded && decoded.kind === kind) {
      load(decoded);
      setDraftHydrated(true);
      return;
    }

    const localDraft = readLocalDraft(kind);
    if (localDraft) {
      load(localDraft);
    } else if (useDesignerStore.getState().design.kind !== kind) {
      reset(kind);
    }
    setDraftHydrated(true);
  }, [kind, encodedDesign, load, reset]);

  useEffect(() => {
    if (!draftHydrated || design.kind !== kind) return;
    writeLocalDraft(design);
  }, [design, draftHydrated, kind]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const syncPanel = () => {
      if (media.matches) setMobilePanel((current) => (current === 'crystals' ? 'size' : current));
    };
    syncPanel();
    media.addEventListener('change', syncPanel);
    return () => media.removeEventListener('change', syncPanel);
  }, []);

  // Track canvas container size.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setStageSize({ width: Math.max(1, r.width), height: Math.max(1, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const price = priceDesign(design);

  // The customer must add enough beads to reach their entered wrist/neck size
  // before they can check out. Other kinds aren't gated here.
  const requiredStrandMm =
    design.sizing.kind === 'bracelet'
      ? design.sizing.wristMm
      : design.sizing.kind === 'necklace'
      ? design.sizing.neckMm
      : 0;
  const currentInnerMm = innerCircumferenceMm(design.beads);
  const ready = requiredStrandMm === 0 || currentInnerMm >= requiredStrandMm;

  // Hand the design to the storefront cart. The share code is the line's
  // identity, so two different designs stay two lines; price is converted
  // from the engine's cents to the pounds the cart and orders use.
  function addDesignToBag() {
    if (!ready || design.beads.length === 0) return;
    const encoded = encodeDesign(design);
    const label = kind.charAt(0).toUpperCase() + kind.slice(1);
    addItem({
      productId: bespokeProductId,
      title: `Bespoke ${label} — ${design.beads.length} crystals`,
      price: centsToPounds(price.totalCents),
      design: { kind, encoded, beadCount: design.beads.length },
    });
    toast.success('Added to your bag', {
      description: `Your bespoke ${kind} is saved in your bag.`,
    });
  }

  const mobileTabs: {
    id: MobilePanel;
    label: string;
    icon: ComponentType<{ className?: string }>;
    disabled?: boolean;
    className?: string;
  }[] = [
    { id: 'crystals', label: 'Crystals', icon: Gem, className: 'lg:hidden' },
    { id: 'details', label: 'Selected', icon: SlidersHorizontal, disabled: selectedIndex == null },
    { id: 'size', label: 'Size', icon: Ruler },
  ];

  return (
    // Sits beneath the storefront header, so the tool fills the remaining
    // viewport rather than claiming the whole screen.
    <div className="atelier-wash flex h-[calc(100dvh-6rem)] min-h-[560px] flex-col overflow-hidden bg-background text-foreground lg:h-[calc(100dvh-7rem)]">
      {/* Tool bar. Site identity and primary nav come from the storefront
          header above; this row carries only designer controls. */}
      <header className="z-30 shrink-0 px-3 py-3 sm:px-4">
        <div className="panel flex h-14 items-center gap-3 rounded-lg px-3 sm:px-4">
          <div className="hidden min-w-0 flex-1 xl:block">
            <KindTabs active={kind} />
          </div>
          <Link
            href="/encyclopedia"
            className="hidden h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground md:inline-flex"
          >
            <BookOpen className="h-4 w-4" />
            Crystal guide
          </Link>
          <div className="ml-auto hidden shrink-0 items-center gap-1.5 sm:flex">
            <div className="hidden sm:block">
              <HistoryControls />
            </div>
            <PreviewToggle />
            <Button
              size="icon"
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={() => setAiOpen(true)}
              aria-label="AI stylist"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => setShareOpen(true)}
              aria-label="Share design"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Compact kind tabs */}
      <div className="designer-kind-tabs border-y border-border bg-card/68 px-3 py-2 backdrop-blur-sm xl:hidden">
        <KindTabs active={kind} />
      </div>

      {/* Main */}
      <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_auto] xl:grid-cols-[300px_minmax(0,1fr)_320px] xl:grid-rows-1">
        {/* Palette */}
        <aside className="hidden overflow-hidden border-r border-border bg-card/52 backdrop-blur-sm lg:row-span-2 lg:block xl:row-span-1">
          <CrystalPalette />
        </aside>

        {/* Stage */}
        <section ref={stageRef} className="designer-stage relative min-h-0 overflow-hidden">
          {view === '2d' && <KonvaCanvas2D width={stageSize.width} height={stageSize.height} />}
          {view === '3d' && <ThreePreview />}
          {view === 'ar' && <ARTryOn kind={kind} />}
        </section>

        {/* Right panel */}
        <aside className="hidden flex-col gap-3 overflow-y-auto border-l border-border bg-card/52 p-4 backdrop-blur-sm scrollbar-thin xl:flex">
          <BeadInspector />
          <SizingPanel />
          <PricePanel total={price.totalCents} count={design.beads.length} ready={ready} onAdd={addDesignToBag} />
        </aside>

        {/* Mobile/tablet controls */}
        <div className="designer-mobile-panel pb-safe flex max-h-[46dvh] min-h-0 flex-col border-t border-border bg-card/88 shadow-[0_-18px_48px_rgba(17,24,23,0.1)] backdrop-blur-md lg:col-start-2 lg:max-h-80 xl:hidden">
          <div className="shrink-0 border-b border-border p-2">
            <PricePanel total={price.totalCents} count={design.beads.length} ready={ready} onAdd={addDesignToBag} compact />
            <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/90 p-1 lg:grid-cols-2">
              {mobileTabs.map((tab) => {
                const Icon = tab.icon;
                const active = mobilePanel === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={tab.disabled}
                    onClick={() => setMobilePanel(tab.id)}
                    className={cn(
                      'inline-flex h-10 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
                      active ? 'bg-rose-dark text-white shadow-sm' : 'text-muted-foreground hover:bg-card/80 hover:text-foreground',
                      tab.className,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="designer-mobile-panel-content min-h-0 flex-1 overflow-y-auto p-3 scrollbar-thin">
            {mobilePanel === 'crystals' && (
              <div className="h-[34dvh] min-h-64 max-h-[360px] lg:hidden">
                <CrystalPalette />
              </div>
            )}
            {mobilePanel === 'details' && (
              selectedIndex == null ? (
                <div className="rounded-lg border border-border bg-card/76 p-4 text-sm text-muted-foreground shadow-sm">
                  No bead selected
                </div>
              ) : (
                <BeadInspector />
              )
            )}
            {mobilePanel === 'size' && <SizingPanel />}
          </div>
        </div>
      </main>

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} />
      <AISuggestPanel open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}

function PricePanel({
  total,
  count,
  ready,
  onAdd,
  compact = false,
}: {
  total: number;
  count: number;
  ready: boolean;
  onAdd: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cn('designer-price-panel panel flex items-center justify-between gap-3 rounded-lg', compact ? 'p-3' : 'p-4')}>
      <div>
        <div className="designer-price-meta text-[11px] font-semibold uppercase tracking-wider text-rose-dark">Total</div>
        <div className={cn('designer-price-total font-heading', compact ? 'text-xl' : 'text-2xl')}>{formatCents(total)}</div>
        <div className="designer-price-meta text-[11px] text-muted-foreground">{count} bead{count === 1 ? '' : 's'}</div>
        <div className="designer-price-meta mt-1 max-w-40 text-[10px] leading-snug text-muted-foreground">
          Handmade in Britain · Oxfordshire studio · 2-3 days
        </div>
      </div>
      <Button
        size={compact ? 'sm' : 'default'}
        className="shrink-0"
        onClick={onAdd}
        disabled={!ready || count === 0}
        title={ready ? undefined : 'Add more crystals to reach your size first'}
      >
        <ShoppingBag className="w-4 h-4" />
        {compact ? (
          <>
            <span className="min-[390px]:hidden">Bag</span>
            <span className="hidden min-[390px]:inline">Add to bag</span>
          </>
        ) : (
          <span>Add to bag</span>
        )}
      </Button>
    </div>
  );
}
