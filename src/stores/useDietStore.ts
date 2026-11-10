import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DietPlan, SubstitutionGroup } from '../types/diet';
import { samplePlan } from '../data/samplePlan';

interface DietState {
  plan: DietPlan;
  setPlan: (plan: DietPlan) => void;
  getGroup: (groupId: string) => SubstitutionGroup | undefined;
}

export const useDietStore = create<DietState>()(
  persist(
    (set, get) => ({
      plan: samplePlan,
      setPlan: (plan) => set({ plan }),
      getGroup: (groupId) => get().plan.groups.find((g) => g.id === groupId),
    }),
    { name: 'diet-plan', partialize: (s) => ({ plan: s.plan }) },
  ),
);
