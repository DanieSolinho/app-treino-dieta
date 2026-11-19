import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DietPlan, SubstitutionGroup } from '../types/diet';
import { defaultPlan } from '../data';

/** Carimba o plano como "novo agora": só esta versão (ou outra mais nova) pode ir para o servidor. */
export const stampPlan = (plan: DietPlan): DietPlan => ({ ...plan, version: Date.now() });

/** O plano A é mais novo que o B? (sem versão = mais antigo de todos) */
export const isNewerPlan = (a: DietPlan | undefined, b: DietPlan | undefined) => (a?.version ?? 0) > (b?.version ?? 0);

/** Pode enviar o plano local? Só se o servidor não tiver um plano com versão mais nova ou igual. */
export const canPushPlan = (local: DietPlan, remote: DietPlan | undefined) =>
  !remote || (remote.version ?? 0) === 0 || isNewerPlan(local, remote);

interface DietState {
  plan: DietPlan;
  setPlan: (plan: DietPlan) => void;
  getGroup: (groupId: string) => SubstitutionGroup | undefined;
}

export const useDietStore = create<DietState>()(
  persist(
    (set, get) => ({
      plan: defaultPlan,
      setPlan: (plan) => set({ plan: stampPlan(plan) }),
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
