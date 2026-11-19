import { useMemo } from 'react';
import { useDayStore, waterTotal } from '../../stores/useDayStore';
import { useDietStore } from '../../stores/useDietStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { countStreak } from '../../lib/streak';
import { isDayDone } from '../../lib/dayDone';
import { kcalGoal } from '../../lib/calories';
import { toDateKey } from '../../lib/date';

/** Dias seguidos cumpridos (regras em lib/dayDone.ts). */
export function useStreak(): number {
  const plan = useDietStore((s) => s.plan);
  const goal = useSettingsStore((s) => s.waterGoalMl);
  const sessions = useWorkoutStore((s) => s.sessions);
  const day = useDayStore();

  return useMemo(() => {
    const trainedDays = new Set(sessions.filter((s) => s.finishedAt).map((s) => toDateKey(new Date(s.startedAt))));
    const kcal = kcalGoal(plan);
    return countStreak((date) =>
      isDayDone({
        meals: plan.meals,
        mealsDone: day.mealsDone[date] ?? [],
        variants: day.variants[date] ?? {},
        swaps: day.swaps[date] ?? {},
        amounts: day.amounts[date] ?? {},
        offPlan: day.offPlan[date] ?? [],
        waterMl: waterTotal(day.waterLog[date]),
        waterGoal: goal,
        kcalGoal: kcal,
        trained: trainedDays.has(date),
      }),
    );
  }, [plan, goal, sessions, day.mealsDone, day.variants, day.swaps, day.amounts, day.offPlan, day.waterLog]);
}
