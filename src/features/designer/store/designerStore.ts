'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Bead,
  DesignState,
  FindingsValue,
  FocalPiece,
  KindId,
  SizingValue,
} from '../engine/types';
import { getKind } from '../engine/kinds';
import { initialBeadCount } from '../engine/sizing';
import { applyCommand, invertCommand, newBead, type Command } from './commands';

const HISTORY_LIMIT = 50;

export type ViewMode = '2d' | '3d' | 'ar';

interface DesignerState {
  design: DesignState;
  selectedIndex: number | null;
  view: ViewMode;
  past: Command[];   // commands that *were* applied
  future: Command[]; // commands that have been undone (inverses)

  /* Mutations */
  dispatch: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  reset: (kind: KindId) => void;
  load: (design: DesignState) => void;
  setView: (v: ViewMode) => void;
  setSelected: (i: number | null) => void;

  /* High-level actions */
  addBeadAtEnd: (crystalSlug: string, sizeMm?: number) => void;
  insertBeadAt: (at: number, crystalSlug: string, sizeMm?: number) => void;
  removeAt: (at: number) => void;
  removeSelected: () => void;
  clearAll: () => void;
  replaceSelected: (crystalSlug: string) => void;
  rotateLoop: (delta: number) => void;
  setSizing: (sizing: SizingValue) => void;
  setFindings: (findings: FindingsValue) => void;
  setFocal: (focal: FocalPiece | undefined) => void;
  setMirror: (mirror: boolean) => void;
}

function createInitialDesign(kind: KindId): DesignState {
  const k = getKind(kind);
  const target = initialBeadCount(k.defaults.sizing, k.defaults.beadSizeMm, {
    maxBeadsPerSide: k.maxBeadsPerSide,
  });
  const beads: Bead[] = Array.from({ length: target }, () =>
    newBead(k.defaults.seedCrystalSlug, k.defaults.beadSizeMm),
  );
  return {
    version: 1,
    kind,
    beads,
    originIndex: 0,
    sizing: k.defaults.sizing,
    findings: k.defaults.findings,
    mirror: kind === 'earrings' ? true : undefined,
  };
}

export const useDesignerStore = create<DesignerState>()(
  subscribeWithSelector((set, get) => ({
    design: createInitialDesign('bracelet'),
    selectedIndex: null,
    view: '2d',
    past: [],
    future: [],

    dispatch: (cmd) => {
      const { design, past } = get();
      const next = applyCommand(design, cmd);
      const trimmed = past.length >= HISTORY_LIMIT ? past.slice(1) : past;
      set({ design: next, past: [...trimmed, cmd], future: [] });
    },

    undo: () => {
      const { design, past, future } = get();
      if (past.length === 0) return;
      const last = past[past.length - 1];
      const inverse = invertCommand(last);
      const next = applyCommand(design, inverse);
      set({
        design: next,
        past: past.slice(0, -1),
        future: [...future, last],
      });
    },

    redo: () => {
      const { design, past, future } = get();
      if (future.length === 0) return;
      const cmd = future[future.length - 1];
      const next = applyCommand(design, cmd);
      set({
        design: next,
        past: [...past, cmd],
        future: future.slice(0, -1),
      });
    },

    reset: (kind) =>
      set({ design: createInitialDesign(kind), selectedIndex: null, past: [], future: [] }),

    load: (design) =>
      set({ design, selectedIndex: null, past: [], future: [] }),

    setView: (v) => set({ view: v }),
    setSelected: (i) => set({ selectedIndex: i }),

    addBeadAtEnd: (crystalSlug, sizeMm) => {
      const { design, dispatch } = get();
      const size = sizeMm ?? (design.beads[0]?.sizeMm ?? getKind(design.kind).defaults.beadSizeMm);
      dispatch({ type: 'INSERT_BEAD', at: design.beads.length, bead: newBead(crystalSlug, size) });
    },

    insertBeadAt: (at, crystalSlug, sizeMm) => {
      const { design, dispatch } = get();
      const size = sizeMm ?? (design.beads[0]?.sizeMm ?? getKind(design.kind).defaults.beadSizeMm);
      dispatch({ type: 'INSERT_BEAD', at, bead: newBead(crystalSlug, size) });
    },

    removeAt: (at) => {
      const { design, selectedIndex, dispatch } = get();
      const prev = design.beads[at];
      if (!prev) return;
      dispatch({ type: 'REMOVE_BEAD', at, prev });
      if (selectedIndex === at) set({ selectedIndex: null });
    },

    removeSelected: () => {
      const { design, selectedIndex, dispatch } = get();
      if (selectedIndex == null) return;
      const prev = design.beads[selectedIndex];
      if (!prev) return;
      dispatch({ type: 'REMOVE_BEAD', at: selectedIndex, prev });
      set({ selectedIndex: null });
    },

    clearAll: () => {
      const { design, dispatch } = get();
      if (design.beads.length === 0) return;
      dispatch({
        type: 'SET_BEADS',
        next: [],
        prev: design.beads.slice(),
        nextOrigin: 0,
        prevOrigin: design.originIndex,
      });
      set({ selectedIndex: null });
    },

    replaceSelected: (crystalSlug) => {
      const { design, selectedIndex, dispatch } = get();
      if (selectedIndex == null) return;
      const prev = design.beads[selectedIndex];
      if (!prev) return;
      const next = newBead(crystalSlug, prev.sizeMm);
      dispatch({ type: 'REPLACE_BEAD', at: selectedIndex, next, prev });
    },

    rotateLoop: (delta) => {
      const { design, dispatch } = get();
      dispatch({ type: 'ROTATE_LOOP', delta, prevOrigin: design.originIndex });
    },

    setSizing: (sizing) => {
      const { design, dispatch } = get();
      if (design.sizing.kind !== sizing.kind) return;
      dispatch({ type: 'SET_SIZING', next: sizing, prev: design.sizing });
    },

    setFindings: (findings) => {
      const { design, dispatch } = get();
      if (design.findings.kind !== findings.kind) return;
      dispatch({ type: 'SET_FINDINGS', next: findings, prev: design.findings });
    },

    setFocal: (focal) => {
      const { design, dispatch } = get();
      dispatch({ type: 'SET_FOCAL', next: focal, prev: design.focal });
    },

    setMirror: (mirror) => {
      const { design, dispatch } = get();
      const prev = design.mirror ?? true;
      if (prev === mirror) return;
      dispatch({ type: 'SET_MIRROR', next: mirror, prev });
    },
  })),
);

export const designerSelectors = {
  beadCount: (s: DesignerState) => s.design.beads.length,
  canUndo: (s: DesignerState) => s.past.length > 0,
  canRedo: (s: DesignerState) => s.future.length > 0,
};
