import { useMemo } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useDayStore, waterTotal } from '../../stores/useDayStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { badges } from '../../lib/achievements';

function Medal({ on }: { on: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2l2 6M16 2l-2 6" />
      <circle cx="12" cy="14" r="6" fill={on ? 'currentColor' : 'none'} />
      <path d="M12 11.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" stroke={on ? 'var(--ink)' : 'currentColor'} strokeWidth="1.2" />
    </svg>
  );
}

export function BadgesTab() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const workouts = useWorkoutStore((s) => s.workouts);
  const waterLog = useDayStore((s) => s.waterLog);
  const goal = useSettingsStore((s) => s.waterGoalMl);

  const list = useMemo(
    () =>
      badges({
        sessions,
        waterDates: Object.keys(waterLog),
        waterByDate: (d) => waterTotal(waterLog[d]),
        waterGoal: goal,
        exerciseIds: workouts.flatMap((w) => w.exercises.map((e) => e.id)),
      }),
    [sessions, waterLog, goal, workouts],
  );
  const won = list.filter((b) => b.unlocked).length;

  return (
    <section className="card stack-sm" aria-labelledby="badges-title">
      <h2 id="badges-title" className="card__title">
        Medalhas {won > 0 && <span className="muted">· {won} conquistada{won > 1 ? 's' : ''}</span>}
      </h2>
      <p className="muted">Constância e força: elas vêm do que você faz, não da balança.</p>
      <ul className="badges">
        {list.map((b) => (
          <li key={b.id} className={`badge-item ${b.unlocked ? 'badge-item--on' : ''}`}>
            <span className="badge-item__icon">
              <Medal on={b.unlocked} />
            </span>
            <span className="badge-item__text">
              <strong>{b.title}</strong>
              <small>{b.description}</small>
            </span>
            <span className="badge-item__progress">{b.progress}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
