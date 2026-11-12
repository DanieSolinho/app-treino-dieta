import { useState } from 'react';
import type { MealItem } from '../../types/diet';
import { useDietStore } from '../../stores/useDietStore';
import { useDayStore } from '../../stores/useDayStore';
import { formatLongDate, toDateKey } from '../../lib/date';
import { MealCard } from './MealCard';
import { SubstitutionSheet } from './SubstitutionSheet';

// Referência fixa: um `[]` novo a cada render faz o Zustand 5 entrar em loop
const NO_MEALS: string[] = [];

export function DietPage() {
  const meals = useDietStore((s) => s.plan.meals);
  const title = useDietStore((s) => s.plan.title);
  const date = toDateKey();
  const done = useDayStore((s) => s.mealsDone[date] ?? NO_MEALS);
  const swapsToday = useDayStore((s) => Object.keys(s.swaps[date] ?? {}).length);
  const toggleMeal = useDayStore((s) => s.toggleMeal);

  const [swapping, setSwapping] = useState<{ item: MealItem; mealName: string } | null>(null);

  return (
    <main className="page">
      <header className="page__header">
        <div>
          <p className="muted">{formatLongDate()}</p>
          <h1 className="page__title">Dieta</h1>
        </div>
        <span className="pill">
          {done.length} de {meals.length}
        </span>
      </header>

      {title && <p className="muted">{title}</p>}

      {swapsToday > 0 && (
        <p className="note">
          {swapsToday} {swapsToday === 1 ? 'troca feita' : 'trocas feitas'} hoje
        </p>
      )}

      <div className="stack">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            done={done.includes(meal.id)}
            onToggle={() => toggleMeal(date, meal.id)}
            onSwap={(item) => setSwapping({ item, mealName: meal.name })}
          />
        ))}
      </div>

      <SubstitutionSheet
        item={swapping?.item ?? null}
        mealName={swapping?.mealName ?? ''}
        onClose={() => setSwapping(null)}
      />
    </main>
  );
}
