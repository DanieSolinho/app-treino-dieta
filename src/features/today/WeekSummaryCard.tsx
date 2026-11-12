import { useMemo } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useDayStore, waterTotal } from '../../stores/useDayStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { weekSummary } from '../../lib/achievements';

/** Segunda a quarta: como foi a semana passada, em números seus. */
export function WeekSummaryCard({ today = new Date() }: { today?: Date }) {
  const sessions = useWorkoutStore((s) => s.sessions);
  const waterLog = useDayStore((s) => s.waterLog);
  const goal = useSettingsStore((s) => s.waterGoalMl);
  const day = today.getDay(); // 1 = segunda
  const show = day >= 1 && day <= 3;
  const r = useMemo(() => weekSummary(sessions, (d) => waterTotal(waterLog[d]), goal, today), [sessions, waterLog, goal, today]);

  if (!show || (r.workouts === 0 && r.waterDays === 0)) return null;

  const title =
    r.workouts >= 4 ? 'Semana forte!' : r.workouts >= 2 ? 'Boa semana!' : r.workouts === 1 ? 'Semana começada' : 'Nova semana, novo começo';

  return (
    <section className="card week-summary" aria-labelledby="week-summary-title">
      <p className="eyebrow">Semana passada</p>
      <h2 id="week-summary-title" className="card__title">
        {title}
      </h2>
      <div className="week-summary__stats">
        <span>
          <strong>{r.workouts}</strong> {r.workouts === 1 ? 'treino' : 'treinos'}
        </span>
        <span>
          <strong>{r.waterDays}</strong> de 7 dias na meta de água
        </span>
        {r.loadUps > 0 && (
          <span>
            <strong>{r.loadUps}</strong> {r.loadUps === 1 ? 'exercício com carga maior' : 'exercícios com carga maior'}
          </span>
        )}
      </div>
    </section>
  );
}
