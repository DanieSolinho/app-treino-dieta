import { useState } from 'react';
import type { Exercise, Workout } from '../../types/workout';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { newId } from '../../lib/id';
import { WEEKDAYS } from './weekdays';

interface Props {
  workoutId: string | null; // null = nova ficha
  onDone: () => void;
}

const blankExercise = (): Exercise => ({
  id: newId(),
  name: '',
  sets: 3,
  repMin: 8,
  repMax: 12,
  restSeconds: 90,
  increment: 2.5,
  currentLoad: 0,
});

type NumField = 'sets' | 'repMin' | 'repMax' | 'restSeconds' | 'increment' | 'currentLoad';

const numFields: { key: NumField; label: string; step: string }[] = [
  { key: 'sets', label: 'Séries', step: '1' },
  { key: 'repMin', label: 'Reps mín.', step: '1' },
  { key: 'repMax', label: 'Reps máx.', step: '1' },
  { key: 'currentLoad', label: 'Carga (kg)', step: '0.5' },
  { key: 'increment', label: 'Incremento (kg)', step: '0.5' },
  { key: 'restSeconds', label: 'Descanso (s)', step: '15' },
];

export function WorkoutForm({ workoutId, onDone }: Props) {
  const existing = useWorkoutStore((s) => s.workouts.find((w) => w.id === workoutId));
  const saveWorkout = useWorkoutStore((s) => s.saveWorkout);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);

  const [draft, setDraft] = useState<Workout>(
    () => existing ?? { id: newId(), name: '', weekDays: [], exercises: [blankExercise()] },
  );
  const [error, setError] = useState('');

  const update = (patch: Partial<Workout>) => setDraft((d) => ({ ...d, ...patch }));
  const updateExercise = (id: string, patch: Partial<Exercise>) =>
    update({ exercises: draft.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  function toggleDay(day: number) {
    update({
      weekDays: draft.weekDays.includes(day) ? draft.weekDays.filter((d) => d !== day) : [...draft.weekDays, day],
    });
  }

  function save() {
    const exercises = draft.exercises.filter((e) => e.name.trim());
    if (!draft.name.trim()) return setError('Dê um nome para a ficha.');
    if (exercises.length === 0) return setError('Adicione pelo menos um exercício.');
    if (exercises.some((e) => e.repMin > e.repMax)) return setError('Reps mín. não pode ser maior que reps máx.');
    saveWorkout({ ...draft, name: draft.name.trim(), exercises });
    onDone();
  }

  return (
    <main className="page">
      <header className="page__header">
        <button type="button" className="link-btn link-btn--lg" onClick={onDone}>
          Cancelar
        </button>
        <h1 className="page__title page__title--sm">{existing ? 'Editar ficha' : 'Nova ficha'}</h1>
        <button type="button" className="link-btn link-btn--lg link-btn--strong" onClick={save}>
          Salvar
        </button>
      </header>

      <label className="field">
        <span className="field__label">Nome</span>
        <input
          className="input"
          value={draft.name}
          placeholder="Treino A · Peito e tríceps"
          onChange={(e) => update({ name: e.target.value })}
        />
      </label>

      <fieldset className="field">
        <legend className="field__label">Dias da semana</legend>
        <div className="days">
          {WEEKDAYS.map((label, day) => (
            <button
              key={label}
              type="button"
              className={`day ${draft.weekDays.includes(day) ? 'day--on' : ''}`}
              aria-pressed={draft.weekDays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="stack">
        {draft.exercises.map((ex, i) => (
          <fieldset key={ex.id} className="card exercise-form">
            <legend className="sr-only">Exercício {i + 1}</legend>
            <div className="exercise-form__top">
              <input
                className="input"
                aria-label={`Nome do exercício ${i + 1}`}
                value={ex.name}
                placeholder={`Exercício ${i + 1}`}
                onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remover exercício ${i + 1}`}
                onClick={() => update({ exercises: draft.exercises.filter((e) => e.id !== ex.id) })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </div>
            <div className="exercise-form__grid">
              {numFields.map((f) => (
                <label key={f.key} className="field field--sm">
                  <span className="field__label">{f.label}</span>
                  <input
                    className="input"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step={f.step}
                    value={ex[f.key]}
                    onChange={(e) => updateExercise(ex.id, { [f.key]: Number(e.target.value) || 0 })}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        className="btn btn--outline"
        onClick={() => update({ exercises: [...draft.exercises, blankExercise()] })}
      >
        + Adicionar exercício
      </button>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {existing && (
        <button
          type="button"
          className="link-btn link-btn--danger"
          onClick={() => {
            if (window.confirm(`Apagar a ficha "${existing.name}"?`)) {
              deleteWorkout(existing.id);
              onDone();
            }
          }}
        >
          Apagar ficha
        </button>
      )}
    </main>
  );
}
