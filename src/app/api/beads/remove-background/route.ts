import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BRIA_REMOVE_BACKGROUND_URL = 'https://engine.prod.bria-api.com/v2/image/edit/remove_background';

interface BriaErrorBody {
  error?: {
    message?: string;
    details?: string;
  };
  message?: string;
  request_id?: string;
}

interface BriaSuccessBody {
  result?: {
    image_url?: string;
  };
  request_id?: string;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function extractBriaError(body: BriaErrorBody | null, fallback: string) {
  return body?.error?.message ?? body?.error?.details ?? body?.message ?? fallback;
}

/**
 * Runs BRIA RMBG 2.0 against a local bead PNG and returns a transparent PNG
 * preview. This endpoint intentionally does not write files; the existing save
 * route remains the explicit overwrite step.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return jsonError('Disabled in production', 403);
  }

  const apiToken = process.env.BRIA_API_TOKEN;
  if (!apiToken) {
    return jsonError('Missing BRIA_API_TOKEN in your environment.', 500);
  }

  const body = (await req.json().catch(() => null)) as { filename?: unknown } | null;
  const filename = body?.filename;

  if (typeof filename !== 'string' || !/^[a-zA-Z0-9_-]+\.png$/.test(filename)) {
    return jsonError('Invalid filename');
  }

  const sourcePath = path.join(process.cwd(), 'public', 'beads', filename);
  let source: Buffer;
  try {
    source = await fs.readFile(sourcePath);
  } catch {
    return jsonError('Source file not found', 404);
  }

  const briaResponse = await fetch(BRIA_REMOVE_BACKGROUND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      api_token: apiToken,
    },
    body: JSON.stringify({
      image: source.toString('base64'),
      preserve_alpha: true,
      sync: true,
      visual_input_content_moderation: false,
      visual_output_content_moderation: false,
    }),
  });

  const briaBody = (await briaResponse.json().catch(() => null)) as
    | BriaSuccessBody
    | BriaErrorBody
    | null;

  if (!briaResponse.ok) {
    return jsonError(extractBriaError(briaBody, `BRIA request failed with ${briaResponse.status}`), briaResponse.status);
  }

  const imageUrl = (briaBody as BriaSuccessBody | null)?.result?.image_url;
  if (!imageUrl) {
    return jsonError('BRIA did not return an image URL.', 502);
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    return jsonError(`Could not download BRIA result (${imageResponse.status}).`, 502);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  return NextResponse.json({
    ok: true,
    filename,
    requestId: briaBody?.request_id ?? null,
    bytes: imageBuffer.length,
    dataUrl: `data:image/png;base64,${imageBuffer.toString('base64')}`,
  });
}
