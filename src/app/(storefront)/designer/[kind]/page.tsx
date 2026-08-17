import { notFound } from 'next/navigation';
import { DesignerShell } from '@/features/designer/components/DesignerShell';
import { KindId } from '@/features/designer/engine/types';
import { KIND_IDS } from '@/features/designer/engine/kinds';
import { ensureBespokeProduct } from '@/lib/bespoke';

export function generateStaticParams() {
  return KIND_IDS.map((k) => ({ kind: k }));
}

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!KIND_IDS.includes(kind as KindId)) return {};
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  return { title: `${label} Designer — Handmade in Oxford` };
}

export default async function DesignerKindPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { kind } = await params;
  const { d } = await searchParams;
  if (!KIND_IDS.includes(kind as KindId)) notFound();

  // The cart needs a product id to hang bespoke lines off; see lib/bespoke.
  const bespoke = await ensureBespokeProduct();

  return (
    <DesignerShell
      kind={kind as KindId}
      encodedDesign={d}
      bespokeProductId={bespoke.id}
    />
  );
}
