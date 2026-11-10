import { useDayStore, waterTotal } from '../../stores/useDayStore';
import { useDietStore } from '../../stores/useDietStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { countStreak } from '../../lib/streak';

/** Dia cumprido = todas as refeições marcadas + meta de água batida. */
export function useStreak(): number {
  const mealCount = useDietStore((s) => s.plan.meals.length);
  const goal = useSettingsStore((s) => s.waterGoalMl);

  // o seletor devolve um número, então não há risco de loop de render
  return useDayStore((s) =>
    countStreak(
      (date) =>
        (s.mealsDone[date]?.length ?? 0) >= mealCount && waterTotal(s.waterLog[date]) >= goal,
    ),
  );
}
