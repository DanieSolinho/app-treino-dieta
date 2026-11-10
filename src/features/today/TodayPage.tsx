import { useDietStore } from '../../stores/useDietStore';
import { useDayStore } from '../../stores/useDayStore';
import { formatLongDate, toDateKey } from '../../lib/date';
import { WaterTracker } from './WaterTracker';
import { useStreak } from './useStreak';

const NO_MEALS: string[] = [];

interface Props {
  goTo: (tab: 'dieta' | 'treinos') => void;
}

function greeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Bom dia';
  if (hour < 19) return 'Boa tarde';
  return 'Boa noite';
}

export function TodayPage({ goTo }: Props) {
  const date = toDateKey();
  const meals = useDietStore((s) => s.plan.meals);
  const done = useDayStore((s) => s.mealsDone[date] ?? NO_MEALS);
  const toggleMeal = useDayStore((s) => s.toggleMeal);
  const streak = useStreak();

  const nextMeal = meals.find((m) => !done.includes(m.id));

  return (
    <main className="page">
      <header className="page__header">
        <div>
          <p className="muted">{formatLongDate()}</p>
          <h1 className="page__title">{greeting()}</h1>
        </div>
        <span className="streak" aria-label={`${streak} dias seguidos cumpridos`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z" />
          </svg>
          {streak} {streak === 1 ? 'dia' : 'dias'}
        </span>
      </header>

      <section className="card card--dark">
        <p className="eyebrow eyebrow--lime">Treino de hoje</p>
        <h2 className="card--dark__title">Em breve</h2>
        <p className="card--dark__text">Fichas de treino e sugestão de carga chegam na próxima etapa.</p>
        <button type="button" className="btn btn--lime" onClick={() => goTo('treinos')}>
          Ver treinos
        </button>
      </section>

      <WaterTracker />

      <section className="card" aria-labelledby="meals-title">
        <header className="meal__header">
          <h2 id="meals-title" className="card__title">Refeições</h2>
          <span className="muted">
            {done.length} de {meals.length}
          </span>
        </header>

        {nextMeal ? (
          <label className="meal__check next-meal">
            <input type="checkbox" checked={false} onChange={() => toggleMeal(date, nextMeal.id)} />
            <span className="meal__name">{nextMeal.name}</span>
            <span className="next-meal__time">{nextMeal.time} · próxima</span>
          </label>
        ) : (
          <p className="muted">Todas as refeições de hoje feitas.</p>
        )}

        <button type="button" className="link-btn link-btn--lg" onClick={() => goTo('dieta')}>
          Ver plano completo
        </button>
      </section>

      <p className="muted streak-hint">
        Um dia conta no streak quando você marca todas as refeições e bate a meta de água.
      </p>
    </main>
  );
}
