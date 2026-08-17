import { DesignStateSchema, type DesignState } from './types';

/**
 * Compact, URL-safe encoding of a DesignState for share links.
 *
 *   /designer/[kind]?d=<base64url(JSON.stringify(state))>
 *
 * v1 format is JSON-based for readability; a future v2 may switch to a binary frame.
 * The schema version inside the payload (`version: 1`) guards forward compat.
 */
const VERSION_PREFIX = 'v1:';

function base64UrlEncode(input: string): string {
  const b64 = (typeof window === 'undefined'
    ? Buffer.from(input, 'utf-8').toString('base64')
    : btoa(unescape(encodeURIComponent(input))));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (input.length % 4)) % 4);
  if (typeof window === 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf-8');
  }
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeDesign(state: DesignState): string {
  const validated = DesignStateSchema.parse(state);
  return VERSION_PREFIX + base64UrlEncode(JSON.stringify(validated));
}

export function tryDecodeDesign(encoded: string | null | undefined): DesignState | null {
  if (!encoded) return null;
  if (!encoded.startsWith(VERSION_PREFIX)) return null;
  try {
    const json = base64UrlDecode(encoded.slice(VERSION_PREFIX.length));
    const parsed = DesignStateSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
