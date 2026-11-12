import { useMemo } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { WEEKDAYS, formatWeekDays } from './weekdays';
import { totalSeconds } from '../../data/stretchRoutines';
import { defaultSchedule, stretchRoutines } from '../../data';
import { plannedFor, upcoming } from '../../lib/schedule';

/** Letra curta da ficha para a faixa da semana: "Treino A · …" → "A". */
const shortName = (name: string) => name.match(/^Treino\s+(\S+)/)?.[1] ?? name.slice(0, 1);

interface Props {
  onEdit: (id: string | null) => void; // null = nova ficha
  onStretch: (routineId: string) => void;
}

export function WorkoutList({ onEdit, onStretch }: Props) {
  const workouts = useWorkoutStore((s) => s.workouts);
  const startSession = useWorkoutStore((s) => s.startSession);
  const lastSession = useWorkoutStore((s) => s.sessions[0]);
  const week = useMemo(() => upcoming(new Date(), 7, workouts, defaultSchedule), [workouts]);
  const todayIds = useMemo(() => plannedFor(new Date(), workouts, defaultSchedule).workouts.map((w) => w.id), [workouts]);
  const hasPlan = week.some((d) => d.plan.fromSchedule || d.plan.workouts.length > 0);

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Treinos</h1>
        <button type="button" className="icon-btn icon-btn--dark" aria-label="Nova ficha" onClick={() => onEdit(null)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      {hasPlan && (
        <section aria-label="Próximos 7 dias" className="week">
          {week.map(({ date, plan }, i) => {
            const names = plan.workouts.map((w) => shortName(w.name));
            return (
              <div key={i} className={`week__day ${i === 0 ? 'week__day--today' : ''} ${names.length ? '' : 'week__day--rest'}`}>
                <span className="week__label">{i === 0 ? 'Hoje' : WEEKDAYS[date.getDay()]}</span>
                <span className="week__date">{date.getDate()}</span>
                <span className="week__workout">{names.length ? names.join('/') : 'off'}</span>
              </div>
            );
          })}
        </section>
      )}

      {lastSession && (
        <p className="note">
          Último treino: {workouts.find((w) => w.id === lastSession.workoutId)?.name ?? 'ficha removida'} em{' '}
          {new Date(lastSession.startedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
        </p>
      )}

      <div className="stack">
        {workouts.map((w) => {
          const isToday = todayIds.includes(w.id);
          return (
            <article key={w.id} className={`card workout ${isToday ? 'workout--today' : ''}`}>
              <div className="workout__info">
                {isToday && <p className="eyebrow">Hoje</p>}
                <h2 className="card__title">{w.name}</h2>
                <p className="muted">
                  {w.exercises.length} exercícios
                  {w.weekDays.length > 0 && ` · ${formatWeekDays(w.weekDays)}`}
                </p>
              </div>
              <div className="workout__actions">
                <button type="button" className="btn-sm btn-sm--outline" onClick={() => onEdit(w.id)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-sm btn-sm--dark"
                  disabled={w.exercises.length === 0}
                  onClick={() => startSession(w.id)}
                >
                  Começar
                </button>
              </div>
            </article>
          );
        })}
        {workouts.length === 0 && <p className="muted">Nenhuma ficha ainda. Toque no + para criar a primeira.</p>}
      </div>

      <section className="stack" aria-labelledby="stretch-title">
        <h2 id="stretch-title" className="section-title">Alongamento</h2>
        {stretchRoutines.map((r) => (
          <button key={r.id} type="button" className="card stretch-card" onClick={() => onStretch(r.id)}>
            <span className="stretch-card__icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="4.5" r="2" />
                <path d="M12 7v6l-4 7M12 13l4 7M5 10l7-1 7 1" />
              </svg>
            </span>
            <span className="stretch-card__text">
              <span className="card__title">{r.name}</span>
              <span className="muted">
                {r.focus} · {Math.round(totalSeconds(r) / 60)} min
              </span>
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ))}
      </section>
    </main>
  );
}
