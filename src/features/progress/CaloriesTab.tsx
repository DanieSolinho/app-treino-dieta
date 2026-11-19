import { useMemo } from 'react';
import { useDietStore } from '../../stores/useDietStore';
import { useDayStore } from '../../stores/useDayStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { formatKcal, kcalGoal } from '../../lib/calories';
import { lastDays, weekCalories, weekStats } from '../../lib/weekCalories';

const WEEKDAY = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const W = 320;
const H = 170;
const PAD = { top: 18, bottom: 26, left: 8, right: 8 };

export function CaloriesTab() {
  const plan = useDietStore((s) => s.plan);
  const mealsDone = useDayStore((s) => s.mealsDone);
  const variants = useDayStore((s) => s.variants);
  const swaps = useDayStore((s) => s.swaps);
  const amounts = useDayStore((s) => s.amounts);
  const offPlan = useDayStore((s) => s.offPlan);
  const sessions = useWorkoutStore((s) => s.sessions);
  const goal = kcalGoal(plan);

  const days = useMemo(
    () => weekCalories(plan, { mealsDone, variants, swaps, amounts, offPlan }, sessions, lastDays(7)),
    [plan, mealsDone, variants, swaps, amounts, offPlan, sessions],
  );
  const stats = weekStats(days, goal);

  const max = Math.max(goal ?? 0, ...days.map((d) => d.eaten), 1) * 1.1;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = (W - PAD.left - PAD.right) / days.length;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  return (
    <section className="card stack-sm" aria-labelledby="week-kcal-title">
      <h2 id="week-kcal-title" className="card__title">
        Últimos 7 dias
      </h2>
      <figure className="chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Calorias comidas por dia, últimos 7 dias${goal ? `, meta de ${goal} kcal` : ''}`}>
          {days.map((d, i) => {
            const x = PAD.left + i * slot + slot * 0.2;
            const w = slot * 0.6;
            const over = goal !== undefined && d.eaten > goal;
            const date = new Date(`${d.date}T12:00:00`);
            return (
              <g key={d.date}>
                {d.eaten > 0 ? (
                  <rect x={x} y={y(d.eaten)} width={w} height={y(0) - y(d.eaten)} rx={6} className={over ? 'bar bar--over' : 'bar'} />
                ) : (
                  <rect x={x} y={y(0) - 3} width={w} height={3} rx={1.5} className="bar bar--empty" />
                )}
                {d.eaten > 0 && (
                  <text x={x + w / 2} y={y(d.eaten) - 5} textAnchor="middle" className="bar__value">
                    {d.eaten}
                  </text>
                )}
                <text x={x + w / 2} y={H - 8} textAnchor="middle" className="bar__label">
                  {i === days.length - 1 ? 'hoje' : WEEKDAY[date.getDay()]}
                </text>
              </g>
            );
          })}
          {goal !== undefined && (
            <>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(goal)} y2={y(goal)} className="goal-line" />
              <text x={W - PAD.right} y={y(goal) - 4} textAnchor="end" className="goal-line__label">
                meta {goal}
              </text>
            </>
          )}
        </svg>
      </figure>

      <dl className="week-stats">
        <div>
          <dt>Média por dia</dt>
          <dd>{stats.logged ? formatKcal(stats.avgEaten) : '—'}</dd>
        </div>
        {stats.withinGoal !== undefined && (
          <div>
            <dt>Dentro da meta</dt>
            <dd>
              {stats.withinGoal} de {stats.logged} dias
            </dd>
          </div>
        )}
        <div>
          <dt>Proteína média</dt>
          <dd>
            {stats.logged ? `${stats.avgProtein} g` : '—'}
            {plan.proteinGoal !== undefined && stats.logged > 0 && <span className="muted"> / {plan.proteinGoal} g</span>}
          </dd>
        </div>
        <div>
          <dt>Gasto nos treinos</dt>
          <dd>{stats.burned ? formatKcal(stats.burned) : '—'}</dd>
        </div>
      </dl>
      <p className="muted week-stats__note">A média conta só os dias com algo registrado. O gasto nos treinos vem do relógio e não muda a meta.</p>
    </section>
  );
}
