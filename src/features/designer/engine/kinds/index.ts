import type { JewelryKind, KindId } from '../types';
import { bracelet } from './bracelet';
import { necklace } from './necklace';
import { ring } from './ring';
import { earrings } from './earrings';

export const KINDS: Record<KindId, JewelryKind> = {
  bracelet,
  necklace,
  ring,
  earrings,
};

export const KIND_IDS: KindId[] = ['bracelet', 'necklace', 'ring', 'earrings'];

export function getKind(id: KindId): JewelryKind {
  return KINDS[id];
}

export { bracelet, necklace, ring, earrings };
export { NECKLACE_LENGTH_MM } from './necklace';
