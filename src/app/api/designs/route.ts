import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DesignStateSchema } from '@/features/designer/engine/types';
import { toSavedDesignDTO } from '@/features/designer/engine/persistence';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ designs: [] });
  const designs = await prisma.savedDesign.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ designs: designs.map(toSavedDesignDTO) });
}

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = DesignStateSchema.safeParse(body?.state);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid design', issues: parsed.error.issues }, { status: 400 });
  }
  const saved = await prisma.savedDesign.create({
    data: {
      userId: session?.user ? (session.user as { id: string }).id : null,
      kind: parsed.data.kind,
      state: parsed.data,
      thumbnailUrl: typeof body?.thumbnailUrl === 'string' ? body.thumbnailUrl : null,
    },
  });
  return NextResponse.json({ design: toSavedDesignDTO(saved) });
}
