import type { SuggestionAction } from '../../types/workout';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { formatKg } from '../../lib/loadSuggestion';
import { mmss } from '../../hooks/useCountdown';
import { sessionMilestone, sessionRecords } from '../../lib/achievements';
import { cardioText } from '../../lib/cardio';

interface Props {
  sessionId: string;
  onClose: () => void;
}

const actionText: Record<SuggestionAction, string> = {
  aumentar: 'Sobe para',
  manter: 'Mantém',
  reduzir: 'Ajusta para',
};

export function SessionSummary({ sessionId, onClose }: Props) {
  const session = useWorkoutStore((s) => s.sessions.find((x) => x.id === sessionId));
  const workout = useWorkoutStore((s) => s.workouts.find((w) => w.id === session?.workoutId));
  const sessions = useWorkoutStore((s) => s.sessions);
  if (!session || !workout) return null;

  const records = sessionRecords(session, sessions);
  const milestone = sessionMilestone(session, sessions);
  const exName = (id: string) => workout.exercises.find((e) => e.id === id)?.name ?? 'Exercício';

  const duration = session.finishedAt
    ? Math.round((Date.parse(session.finishedAt) - Date.parse(session.startedAt)) / 1000)
    : 0;
  const allSets = Object.values(session.logs).flat();
  const volume = allSets.reduce((sum, s) => sum + s.load * s.reps, 0);
  const cardioMinutes = Object.values(session.cardio ?? {}).reduce((a, b) => a + b, 0);
  const ups = Object.values(session.suggestions ?? {}).filter((s) => s.action === 'aumentar').length;

  return (
    <main className="page">
      <header>
        <p className="eyebrow">Treino concluído</p>
        <h1 className="page__title">{workout.name}</h1>
      </header>

      {(records.length > 0 || milestone) && (
        <section className="card wins" aria-labelledby="wins-title">
          <h2 id="wins-title" className="card__title">
            {records.length > 0 ? (records.length === 1 ? 'Novo recorde!' : `${records.length} recordes hoje!`) : 'Marco alcançado!'}
          </h2>
          <ul className="wins__list">
            {milestone && <li>{milestone === 1 ? 'Primeiro treino registrado no app. Começou!' : `Este foi o seu ${milestone}º treino no app.`}</li>}
            {records.map((r) => (
              <li key={r.exerciseId}>
                <strong>{exName(r.exerciseId)}</strong>: {formatKg(r.load)} (+{formatKg(r.load - r.previous)})
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="stats">
        <div className="card stat">
          <span className="muted">Duração</span>
          <strong className="stat__value">{mmss(duration)}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Séries</span>
          <strong className="stat__value">{allSets.length}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Volume</span>
          <strong className="stat__value">{Math.round(volume).toLocaleString('pt-BR')} kg</strong>
        </div>
      </div>

      {cardioMinutes > 0 && <p className="note">Cardio: {cardioText(session)}.</p>}

      <section className="card card--dark" aria-labelledby="next-title">
        <h2 id="next-title" className="card__title">
          Próximo treino {ups > 0 && <span className="badge">{ups} com carga nova</span>}
        </h2>
        <ul className="next-list">
          {workout.exercises
            .filter((ex) => session.suggestions?.[ex.id])
            .map((ex) => {
              const s = session.suggestions![ex.id];
              return (
                <li key={ex.id} className="next-list__row">
                  <span className="next-list__name">{ex.name}</span>
                  <span className={`next-list__load next-list__load--${s.action}`}>
                    {actionText[s.action]} {formatKg(s.load)}
                  </span>
                </li>
              );
            })}
        </ul>
      </section>

      <button type="button" className="btn btn--dark" onClick={onClose}>
        Voltar aos treinos
      </button>
    </main>
  );
}
