import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DietPlan, SubstitutionGroup } from '../types/diet';
import { defaultPlan } from '../data';

interface DietState {
  plan: DietPlan;
  setPlan: (plan: DietPlan) => void;
  getGroup: (groupId: string) => SubstitutionGroup | undefined;
}

export const useDietStore = create<DietState>()(
  persist(
    (set, get) => ({
      plan: defaultPlan,
      setPlan: (plan) => set({ plan }),
      getGroup: (groupId) => get().plan.groups.find((g) => g.id === groupId),
    }),
    {
      name: 'diet-plan',
      version: 2,
      partialize: (s) => ({ plan: s.plan }),
      // v2 mudou o formato dos alimentos: planos salvos antes são trocados pelo atual
      migrate: () => ({ plan: defaultPlan }) as DietState,
    },
  ),
);
