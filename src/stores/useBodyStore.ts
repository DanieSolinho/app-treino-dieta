import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BodyEntry } from '../types/body';
import { newId } from '../lib/id';

interface BodyState {
  entries: BodyEntry[]; // ordenadas por data, mais antiga primeiro
  /** Um registro por dia: salvar de novo no mesmo dia junta os valores. */
  saveEntry: (entry: Omit<BodyEntry, 'id'>) => void;
  deleteEntry: (id: string) => void;
}

export const useBodyStore = create<BodyState>()(
  persist(
    (set) => ({
      entries: [],

      saveEntry: (entry) =>
        set((s) => {
          const same = s.entries.find((e) => e.date === entry.date);
          const merged: BodyEntry = same
            ? {
                ...same,
                weightKg: entry.weightKg ?? same.weightKg,
                measures: { ...same.measures, ...entry.measures },
              }
            : { id: newId(), ...entry };
          const others = s.entries.filter((e) => e.date !== entry.date);
          return { entries: [...others, merged].sort((a, b) => a.date.localeCompare(b.date)) };
        }),

      deleteEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
    }),
    { name: 'body' },
  ),
);
