import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

/**
 * Overwrites a PNG in `public/beads/` with the bytes posted from the
 * bg-extractor tool. Refuses path-traversal and non-PNG names; blocked in
 * production builds.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as
    | { filename?: unknown; dataUrl?: unknown }
    | null;
  const filename = body?.filename;
  const dataUrl = body?.dataUrl;

  if (typeof filename !== 'string' || !/^[a-zA-Z0-9_-]+\.png$/.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
    return NextResponse.json({ error: 'Invalid dataUrl' }, { status: 400 });
  }

  const base64 = dataUrl.slice('data:image/png;base64,'.length);
  const buf = Buffer.from(base64, 'base64');
  const target = path.join(process.cwd(), 'public', 'beads', filename);
  await fs.writeFile(target, buf);
  return NextResponse.json({ ok: true, bytes: buf.length });
}
