import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CRYSTALS, CRYSTAL_SLUGS } from '@/lib/crystals/catalog';
import { KINDS } from '@/features/designer/engine/kinds';
import type { KindId } from '@/features/designer/engine/types';

export const SuggestRequest = z.object({
  kind: z.enum(['bracelet', 'necklace', 'ring', 'earrings']),
  intent: z.string().max(280).optional(),
  birthDate: z.string().optional(),         // ISO date
  mood: z.string().max(80).optional(),
  excludeSlugs: z.array(z.string()).optional(),
});
export type SuggestRequest = z.infer<typeof SuggestRequest>;

export const SuggestResponse = z.object({
  beads: z.array(
    z.object({
      slug: z.enum(CRYSTAL_SLUGS as [string, ...string[]]),
      reason: z.string(),
    }),
  ).min(1).max(20),
  rationale: z.string(),
});
export type SuggestResponse = z.infer<typeof SuggestResponse>;

/**
 * Build the system prompt once at module-init. The crystal catalog is large and
 * static, so we mark it as a cache breakpoint via Anthropic's prompt caching —
 * subsequent calls in the 5-minute window hit the cache.
 */
function systemPrompt(): string {
  const lines = CRYSTALS.map(
    (c) =>
      `- ${c.slug} · ${c.name} · chakras=${c.chakra.join('/')} · zodiac=${c.zodiac.join('/')} · intention=${c.intention.join('/')} · element=${c.element ?? '-'}`,
  );
  return [
    'You are the Tengology studio stylist, a discerning crystal-jewellery adviser trained on traditional crystal lore,',
    'mineralogy, chakra theory and Western astrology. Be specific, gentle, and grounded — avoid',
    'overclaiming therapeutic effects. Recommend crystals from the catalog only; never invent',
    'crystal slugs. Tailor recommendations to the jewelry kind requested.',
    '',
    'Catalog (slug · name · properties):',
    ...lines,
  ].join('\n');
}

const SYSTEM = systemPrompt();
const MODEL = 'claude-sonnet-4-6';

export async function suggestBeads(req: SuggestRequest): Promise<SuggestResponse> {
  const client = new Anthropic();
  const k = KINDS[req.kind as KindId];

  const userPayload = [
    `Jewelry kind: ${k.label} (layout: ${k.layout}).`,
    req.intent ? `User intent: "${req.intent}".` : null,
    req.mood ? `Mood: "${req.mood}".` : null,
    req.birthDate ? `Birth date: ${req.birthDate} (use zodiac correspondences).` : null,
    req.excludeSlugs?.length ? `Avoid: ${req.excludeSlugs.join(', ')}.` : null,
    `Recommend between 6 and ${k.id === 'earrings' ? 4 : 16} beads in an order that complements visually and energetically.`,
  ]
    .filter(Boolean)
    .join('\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM,
        // Prompt caching — system prompt is large + static.
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [
      {
        name: 'submit_design',
        description: 'Submit a recommended sequence of beads for the requested jewelry piece.',
        input_schema: {
          type: 'object',
          properties: {
            beads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  slug: { type: 'string', enum: CRYSTAL_SLUGS as unknown as string[] },
                  reason: { type: 'string' },
                },
                required: ['slug', 'reason'],
              },
            },
            rationale: { type: 'string' },
          },
          required: ['beads', 'rationale'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_design' },
    messages: [{ role: 'user', content: userPayload }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not call the submit_design tool.');
  }
  const parsed = SuggestResponse.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`AI returned invalid schema: ${parsed.error.message}`);
  }
  // Final safety filter: drop unknown slugs.
  const cleaned = {
    ...parsed.data,
    beads: parsed.data.beads.filter((b) => CRYSTAL_SLUGS.includes(b.slug)),
  };
  if (cleaned.beads.length === 0) {
    throw new Error('AI returned no recognised crystals.');
  }
  return cleaned;
}
