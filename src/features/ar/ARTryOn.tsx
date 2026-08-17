'use client';

import { useState } from 'react';
import { Sparkles, Camera } from 'lucide-react';
import type { KindId } from '@/features/designer/engine/types';
import { Button } from '@/components/ui/button';
import { PhotoOverlay } from './PhotoOverlay';
import { LiveAR } from './LiveAR';

/**
 * AR shell. Photo overlay is the default; live tracking is opt-in (beta) per the plan.
 */
export function ARTryOn({ kind }: { kind: KindId }) {
  const [mode, setMode] = useState<'photo' | 'live'>('photo');
  return (
    <div className="relative w-full h-full">
      <div className="panel absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg p-1 text-xs">
        <Button
          variant={mode === 'photo' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('photo')}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Photo
        </Button>
        <Button
          variant={mode === 'live' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('live')}
        >
          <Camera className="w-3.5 h-3.5" />
          Live <span className="opacity-60 ml-1">(beta)</span>
        </Button>
      </div>
      {mode === 'photo' ? <PhotoOverlay /> : <LiveAR kind={kind} />}
    </div>
  );
}
