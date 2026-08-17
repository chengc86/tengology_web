import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { toSavedDesignDTO } from '@/features/designer/engine/persistence';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await prisma.savedDesign.findUnique({ where: { id } });
  if (!design) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ design: toSavedDesignDTO(design) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { id } = await params;
  const design = await prisma.savedDesign.findUnique({ where: { id } });
  if (!design) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (design.userId !== (session.user as { id: string }).id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await prisma.savedDesign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
