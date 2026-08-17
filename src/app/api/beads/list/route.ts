import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

/**
 * Lists every PNG currently in `public/beads/` so the bg-extractor tool can
 * populate its picker. Dev-only convenience endpoint.
 */
export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'beads');
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.png'))
    .map((e) => e.name)
    .sort();
  return NextResponse.json({ files });
}
