import { useMemo } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { plannedFor } from '../../lib/schedule';

interface Props {
  goTo: (tab: 'dieta' | 'treinos') => void;
}

export function TodayWorkoutCard({ goTo }: Props) {
  const workouts = useWorkoutStore((s) => s.workouts);
  const activeName = useWorkoutStore((s) => s.workouts.find((w) => w.id === s.active?.workoutId)?.name);
  const startSession = useWorkoutStore((s) => s.startSession);
  const schedule = useWorkoutStore((s) => s.schedule);
  const plan = useMemo(() => plannedFor(new Date(), workouts, schedule), [workouts, schedule]);

  if (activeName) {
    return (
      <section className="card card--dark">
        <p className="eyebrow eyebrow--lime">Treino em andamento</p>
        <h2 className="card--dark__title">{activeName}</h2>
        <button type="button" className="btn btn--lime" onClick={() => goTo('treinos')}>
          Continuar treino
        </button>
      </section>
    );
  }

  if (plan.workouts.length === 0) {
    return (
      <section className="card card--dark">
        <p className="eyebrow eyebrow--lime">Hoje</p>
        <h2 className="card--dark__title">Dia de descanso</h2>
        <p className="card--dark__text">
          {plan.fromSchedule ? 'Off, yoga ou alongamento — você escolhe.' : 'Nenhuma ficha marcada para hoje.'}
        </p>
        <button type="button" className="btn btn--outline-light" onClick={() => goTo('treinos')}>
          Ver alongamentos
        </button>
      </section>
    );
  }

  const start = (id: string) => {
    startSession(id);
    goTo('treinos');
  };

  return (
    <section className="card card--dark">
      <p className="eyebrow eyebrow--lime">{plan.workouts.length > 1 ? 'Treino de hoje · escolha um' : 'Treino de hoje'}</p>
      {plan.workouts.map((w, i) => (
        <div key={w.id} className="today-workout">
          <h2 className="card--dark__title">{w.name}</h2>
          <p className="card--dark__text">{w.exercises.length} exercícios</p>
          <button type="button" className={i === 0 ? 'btn btn--lime' : 'btn btn--outline-light'} onClick={() => start(w.id)}>
            Começar {plan.workouts.length > 1 ? w.name.split(' ·')[0] : 'treino'}
          </button>
        </div>
      ))}
    </section>
  );
}
