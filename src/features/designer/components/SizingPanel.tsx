'use client';

import { useState } from 'react';
import { useDesignerStore } from '../store/designerStore';
import { UK_RING_SIZES } from '../engine/sizing';
import { innerCircumferenceMm } from '../engine/wristFit';
import type { Bead } from '../engine/types';
import { cn } from '@/lib/utils';

type Unit = 'cm' | 'inch';

const MM_PER_CM = 10;
const MM_PER_INCH = 25.4;
const WRIST_MIN_MM = 110;
const WRIST_MAX_MM = 210;
const NECK_MIN_MM = 280;
const NECK_MAX_MM = 450;

function mmToUnit(mm: number, unit: Unit): number {
  return unit === 'cm' ? mm / MM_PER_CM : mm / MM_PER_INCH;
}

function unitToMm(value: number, unit: Unit): number {
  return unit === 'cm' ? value * MM_PER_CM : value * MM_PER_INCH;
}

function formatNum(n: number): string {
  return n.toFixed(1);
}

export function SizingPanel() {
  const design = useDesignerStore((s) => s.design);
  const setSizing = useDesignerStore((s) => s.setSizing);

  return (
    <div className="panel space-y-5 rounded-lg p-4 sm:p-5">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-dark">Sizing</div>
        <div className="mt-1 font-heading text-2xl leading-none text-foreground">Fit details</div>
      </div>

      {design.sizing.kind === 'bracelet' && (
        <WristInput
          mm={design.sizing.wristMm}
          beads={design.beads}
          onChange={(mm) => setSizing({ kind: 'bracelet', wristMm: mm })}
        />
      )}
      {design.sizing.kind === 'necklace' && (
        <NeckInput
          mm={design.sizing.neckMm}
          length={design.sizing.length}
          beads={design.beads}
          onChange={(mm) =>
            setSizing({
              kind: 'necklace',
              neckMm: mm,
              length: design.sizing.kind === 'necklace' ? design.sizing.length : 'princess',
            })
          }
        />
      )}

      {design.sizing.kind === 'ring' && (
        <div className="space-y-2">
          <label className="text-base">UK ring size</label>
          <select
            value={design.sizing.ukSize}
            onChange={(e) => setSizing({ kind: 'ring', ukSize: e.target.value })}
            className="h-11 w-full rounded-lg border border-border bg-white px-3 text-base shadow-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
          >
            {UK_RING_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {design.sizing.kind === 'earrings' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-base">Drop length</label>
            <span className="text-base font-medium">{design.sizing.dropMm}mm</span>
          </div>
          <input
            type="range"
            min={0}
            max={120}
            step={1}
            value={design.sizing.dropMm}
            onChange={(e) =>
              setSizing({
                kind: 'earrings',
                dropMm: Number(e.target.value),
                style: design.sizing.kind === 'earrings' ? design.sizing.style : 'dangle',
              })
            }
            className="w-full accent-rose-dark"
          />
        </div>
      )}
    </div>
  );
}

interface SizeInputProps {
  mm: number;
  beads: Bead[];
  onChange: (mm: number) => void;
  minMm: number;
  maxMm: number;
  label: string;
  helper: string;
  looseToleranceMm?: number;
}

function SizeInput({ mm, beads, onChange, minMm, maxMm, label, helper, looseToleranceMm }: SizeInputProps) {
  const [unit, setUnit] = useState<Unit>('cm');
  const [draft, setDraft] = useState<string>(formatNum(mmToUnit(mm, 'cm')));

  // When the store value or unit changes, refresh the input draft from the store.
  // We keep a local draft so the user can type freely (incl. partial values).
  function syncFromMm(nextMm: number, nextUnit: Unit) {
    setDraft(formatNum(mmToUnit(nextMm, nextUnit)));
  }

  function commitDraft(next: string) {
    const v = Number(next);
    if (!Number.isFinite(v) || v <= 0) {
      syncFromMm(mm, unit);
      return;
    }
    const nextMm = Math.round(unitToMm(v, unit));
    const clamped = Math.max(minMm, Math.min(maxMm, nextMm));
    onChange(clamped);
    syncFromMm(clamped, unit);
  }

  function switchUnit(next: Unit) {
    if (next === unit) return;
    setUnit(next);
    syncFromMm(mm, next);
  }

  const innerMm = innerCircumferenceMm(beads);
  const shortMm = Math.max(0, mm - innerMm);
  const shortUnitVal = mmToUnit(shortMm, unit);
  const tooShort = innerMm < mm;
  const tooLoose = looseToleranceMm != null && innerMm > mm + looseToleranceMm;
  const fits = !tooShort && !tooLoose;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-base text-muted-foreground">{label}</label>
        <div className="flex items-stretch gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={mmToUnit(minMm, unit).toFixed(1)}
            max={mmToUnit(maxMm, unit).toFixed(1)}
            step={unit === 'cm' ? 0.5 : 0.25}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commitDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-white px-3 text-lg shadow-sm focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
          />
          <div className="inline-flex shrink-0 overflow-hidden rounded-lg border border-border bg-white">
            {(['cm', 'inch'] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => switchUnit(u)}
                className={cn(
                  'px-3 text-sm font-medium transition-colors',
                  unit === u ? 'bg-rose-dark text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{helper}</p>
      </div>

      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Inner circumference</span>
        <span className="font-heading text-lg text-foreground">
          {formatNum(mmToUnit(innerMm, unit))} {unit}
        </span>
      </div>

      {tooShort ? (
        <div className="rounded-lg border border-amber-400/60 bg-amber-50 px-3 py-2 text-sm font-semibold leading-relaxed text-amber-900">
          Add about <span className="font-heading text-base">{formatNum(shortUnitVal)} {unit}</span> more crystals to reach your size.
        </div>
      ) : tooLoose ? (
        <div className="rounded-lg border border-amber-400/60 bg-amber-50 px-3 py-2 text-sm font-semibold leading-relaxed text-amber-900">
          Too big — it may feel a little loose.
        </div>
      ) : (
        <div className="rounded-lg border border-rose bg-rose/10 px-3 py-2 text-sm font-semibold text-rose-dark">
          Length looks good — ready to add to bag.
        </div>
      )}
      <p className="sr-only">{fits ? 'fits' : tooShort ? 'too short' : 'too loose'}</p>
    </div>
  );
}

function WristInput({
  mm,
  beads,
  onChange,
}: {
  mm: number;
  beads: Bead[];
  onChange: (mm: number) => void;
}) {
  return (
    <SizeInput
      mm={mm}
      beads={beads}
      onChange={onChange}
      minMm={WRIST_MIN_MM}
      maxMm={WRIST_MAX_MM}
      label="Your wrist size"
      helper="Measure the narrowest part of your wrist with a soft tape."
      looseToleranceMm={10}
    />
  );
}

function NeckInput({
  mm,
  beads,
  onChange,
}: {
  mm: number;
  length: string;
  beads: Bead[];
  onChange: (mm: number) => void;
}) {
  return (
    <SizeInput
      mm={mm}
      beads={beads}
      onChange={onChange}
      minMm={NECK_MIN_MM}
      maxMm={NECK_MAX_MM}
      label="Your neck size"
      helper="Measure where the necklace will rest."
    />
  );
}
