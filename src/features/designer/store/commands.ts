import type { Bead, DesignState, FocalPiece, FindingsValue, SizingValue } from '../engine/types';
import { getCrystal } from '@/lib/crystals/catalog';
import { uid } from '@/lib/utils';

export type Command =
  | { type: 'INSERT_BEAD'; at: number; bead: Bead }
  | { type: 'REMOVE_BEAD'; at: number; prev: Bead }
  | { type: 'REPLACE_BEAD'; at: number; next: Bead; prev: Bead }
  | { type: 'MOVE_BEAD'; from: number; to: number }
  | { type: 'SET_BEADS'; next: Bead[]; prev: Bead[]; nextOrigin: number; prevOrigin: number }
  | { type: 'ROTATE_LOOP'; delta: number; prevOrigin: number }
  | { type: 'SET_FINDINGS'; next: FindingsValue; prev: FindingsValue }
  | { type: 'SET_SIZING'; next: SizingValue; prev: SizingValue }
  | { type: 'SET_FOCAL'; next: FocalPiece | undefined; prev: FocalPiece | undefined }
  | { type: 'SET_MIRROR'; next: boolean; prev: boolean };

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const copy = arr.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

export function applyCommand(state: DesignState, cmd: Command): DesignState {
  switch (cmd.type) {
    case 'INSERT_BEAD': {
      const beads = state.beads.slice();
      beads.splice(cmd.at, 0, cmd.bead);
      return { ...state, beads };
    }
    case 'REMOVE_BEAD': {
      if (state.beads.length === 0) return state;
      const beads = state.beads.slice();
      beads.splice(cmd.at, 1);
      const originIndex = beads.length === 0 ? 0 : (state.originIndex >= beads.length ? 0 : state.originIndex);
      return { ...state, beads, originIndex };
    }
    case 'REPLACE_BEAD': {
      const beads = state.beads.slice();
      beads[cmd.at] = cmd.next;
      return { ...state, beads };
    }
    case 'MOVE_BEAD': {
      return { ...state, beads: moveItem(state.beads, cmd.from, cmd.to) };
    }
    case 'SET_BEADS': {
      return { ...state, beads: cmd.next.slice(), originIndex: cmd.nextOrigin };
    }
    case 'ROTATE_LOOP': {
      const n = state.beads.length || 1;
      const next = ((state.originIndex + cmd.delta) % n + n) % n;
      return { ...state, originIndex: next };
    }
    case 'SET_FINDINGS':
      return { ...state, findings: cmd.next };
    case 'SET_SIZING':
      return { ...state, sizing: cmd.next };
    case 'SET_FOCAL':
      return { ...state, focal: cmd.next };
    case 'SET_MIRROR':
      return { ...state, mirror: cmd.next };
  }
}

export function invertCommand(cmd: Command): Command {
  switch (cmd.type) {
    case 'INSERT_BEAD':
      return { type: 'REMOVE_BEAD', at: cmd.at, prev: cmd.bead };
    case 'REMOVE_BEAD':
      return { type: 'INSERT_BEAD', at: cmd.at, bead: cmd.prev };
    case 'REPLACE_BEAD':
      return { type: 'REPLACE_BEAD', at: cmd.at, next: cmd.prev, prev: cmd.next };
    case 'MOVE_BEAD':
      return { type: 'MOVE_BEAD', from: cmd.to, to: cmd.from };
    case 'SET_BEADS':
      return {
        type: 'SET_BEADS',
        next: cmd.prev,
        prev: cmd.next,
        nextOrigin: cmd.prevOrigin,
        prevOrigin: cmd.nextOrigin,
      };
    case 'ROTATE_LOOP':
      return { type: 'ROTATE_LOOP', delta: -cmd.delta, prevOrigin: cmd.prevOrigin };
    case 'SET_FINDINGS':
      return { type: 'SET_FINDINGS', next: cmd.prev, prev: cmd.next };
    case 'SET_SIZING':
      return { type: 'SET_SIZING', next: cmd.prev, prev: cmd.next };
    case 'SET_FOCAL':
      return { type: 'SET_FOCAL', next: cmd.prev, prev: cmd.next };
    case 'SET_MIRROR':
      return { type: 'SET_MIRROR', next: cmd.prev, prev: cmd.next };
  }
}

export function newBead(crystalSlug: string, sizeMm: number): Bead {
  const crystal = getCrystal(crystalSlug);
  const n = crystal?.images.length ?? 1;
  // Roll a random image variant if the crystal has natural variation; pinned
  // on the bead so subsequent renders stay stable.
  const variantIndex = n > 1 ? Math.floor(Math.random() * n) : undefined;
  return { id: uid('bead'), crystalSlug, sizeMm, variantIndex };
}
