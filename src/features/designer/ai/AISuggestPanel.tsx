'use client';

import { useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDesignerStore } from '../store/designerStore';
import { newBead } from '../store/commands';
import { getCrystalOrThrow } from '@/lib/crystals/catalog';
import type { SuggestResponse } from '@/lib/ai/suggest';

export function AISuggestPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const design = useDesignerStore((s) => s.design);
  const dispatch = useDesignerStore((s) => s.dispatch);
  const [intent, setIntent] = useState('');
  const [mood, setMood] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestResponse | null>(null);

  if (!open) return null;

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: design.kind,
          intent: intent || undefined,
          mood: mood || undefined,
          birthDate: birthDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function applyResult() {
    if (!result) return;
    // Remove all existing beads, then insert the new ones.
    const currentBeads = design.beads.slice();
    for (let i = currentBeads.length - 1; i >= 0; i--) {
      dispatch({ type: 'REMOVE_BEAD', at: i, prev: currentBeads[i] });
    }
    const size = currentBeads[0]?.sizeMm ?? 8;
    result.beads.forEach((b, i) => {
      dispatch({ type: 'INSERT_BEAD', at: i, bead: newBead(b.slug, size) });
    });
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => onOpenChange(false)}>
      <div
        className="panel max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-lg p-4 scrollbar-thin sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-dark" />
          <div className="font-heading text-xl">AI Stylist</div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Intent</label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. calm focus for hard weeks, with a touch of courage"
              className="mt-1 h-24 w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-base sm:h-20 sm:text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Mood</label>
              <input
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="grounded, playful..."
                className="mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Birth date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-base sm:text-sm"
              />
            </div>
          </div>
        </div>

        <Button onClick={submit} disabled={loading} className="w-full">
          <Wand2 className="w-4 h-4" />
          {loading ? 'Composing…' : 'Suggest beads'}
        </Button>

        {error && <div className="text-xs text-rose-600">{error}</div>}

        {result && (
          <div className="space-y-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground italic">{result.rationale}</p>
            <div className="flex flex-wrap gap-2">
              {result.beads.map((b, i) => {
                const c = getCrystalOrThrow(b.slug);
                return (
                  <div key={i} className="panel flex items-center gap-1.5 rounded-lg px-2.5 py-1">
                    <span className="w-3 h-3 rounded-full" style={{ background: c.hex }} aria-hidden />
                    <span className="text-xs">{c.name}</span>
                  </div>
                );
              })}
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              {result.beads.map((b, i) => (
                <li key={i}><strong className="text-foreground">{getCrystalOrThrow(b.slug).name}</strong> — {b.reason}</li>
              ))}
            </ul>
            <Button onClick={applyResult} variant="default" className="w-full">Apply to design</Button>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </div>
  );
}
