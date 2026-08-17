'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useDesignerStore } from '../store/designerStore';
import { encodeDesign } from '../engine/serialize';
import { Button } from '@/components/ui/button';

export function ShareModal({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const design = useDesignerStore((s) => s.design);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const encoded = encodeDesign(design);
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    setUrl(`${origin}/designer/${design.kind}?d=${encoded}`);
  }, [open, design]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center"
      onClick={() => onOpenChange(false)}
    >
      <div className="panel w-full max-w-md space-y-4 rounded-lg p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="font-heading text-xl">Share your design</div>
          <div className="text-xs text-muted-foreground mt-1">
            Anyone with the link can open and remix it.
          </div>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-white px-3 text-xs"
          />
          <Button
            size="icon"
            variant="default"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </div>
  );
}
