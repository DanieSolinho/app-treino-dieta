import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  waterGoalMl: number;
  setWaterGoal: (ml: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      waterGoalMl: 2500,
      setWaterGoal: (ml) => set({ waterGoalMl: Math.max(500, Math.round(ml / 250) * 250) }),
    }),
    { name: 'settings' },
  ),
);
