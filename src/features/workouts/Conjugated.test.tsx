// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ActiveWorkout } from './ActiveWorkout';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { exerciseParts, partTargets, setVolume } from '../../lib/conjugated';
import type { Workout } from '../../types/workout';

const workout: Workout = {
  id: 'B',
  name: 'Treino B · Superior',
  weekDays: [],
  exercises: [
    {
      id: 'B3',
      name: 'Facepull + bíceps na corda (cross)',
      sets: 3,
      repMin: 12,
      repMax: 15,
      restSeconds: 75,
      increment: 2.5,
      currentLoad: 20,
      progression: 'piramide',
      setTargets: ['12–15 facepull (2 s atrás) + 10–12 bíceps pesadas', '10–12 facepull + 8–10 bíceps', '10–12 facepull + 8–10 bíceps'],
    },
  ],
};

beforeEach(() => {
  useWorkoutStore.setState({ workouts: [workout], sessions: [], active: null, stretches: [] });
  useWorkoutStore.getState().startSession('B');
});
afterEach(cleanup);

describe('exercícios conjugados', () => {
  it('separa as partes pelo nome e a meta de cada uma', () => {
    expect(exerciseParts(workout.exercises[0])).toEqual(['Facepull', 'Bíceps na corda (cross)']);
    expect(exerciseParts({ name: 'Supino reto' })).toEqual(['Supino reto']);
    expect(partTargets('12 facepull + 10 bíceps', 2)).toEqual(['12 facepull', '10 bíceps']);
    expect(partTargets('12–15 com pausa', 2)).toEqual([undefined, undefined]);
    expect(setVolume({ load: 20, reps: 12, parts: [{ load: 10, reps: 10 }] })).toBe(340);
  });

  it('cada parte tem a sua carga e as suas repetições', () => {
    render(<ActiveWorkout onFinished={() => {}} />);
    expect(screen.getByText('Bíceps na corda (cross)')).toBeTruthy();

    // bíceps: começa em 0 kg e 10 reps (da meta "10–12 bíceps")
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: 'Aumentar carga · bíceps na corda (cross)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir série' }));

    const [set] = useWorkoutStore.getState().active!.logs.B3;
    expect(set).toMatchObject({ load: 20, reps: 12, parts: [{ load: 10, reps: 10 }] });
    expect(screen.getByText('20 kg + 10 kg')).toBeTruthy();
    expect(screen.getByText(/12 \+ 10 reps/)).toBeTruthy();
  });

  it('sugere carga também para o 2º exercício e começa a próxima série com ela', () => {
    const { logSet, finishSession } = useWorkoutStore.getState();
    // bíceps bateu o topo da faixa (12) na 1ª série sem "difícil" → sobe
    logSet('B3', { load: 20, reps: 15, effort: 'ok', parts: [{ load: 10, reps: 12 }] });
    logSet('B3', { load: 22.5, reps: 12, effort: 'ok', parts: [{ load: 10, reps: 10 }] });
    const done = finishSession()!;
    expect(done.suggestions!.B3.parts).toEqual([{ action: 'aumentar', load: 12.5 }]);
    expect(useWorkoutStore.getState().workouts[0].exercises[0].partLoads).toEqual([12.5]);

    useWorkoutStore.getState().startSession('B');
    render(<ActiveWorkout onFinished={() => {}} />);
    expect(screen.getByRole('group', { name: 'Carga · Bíceps na corda (cross)' }).textContent).toContain('12,5 kg');
  });
});

