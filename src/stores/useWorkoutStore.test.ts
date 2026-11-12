import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkoutStore } from './useWorkoutStore';
import { sampleWorkouts } from '../data/sampleWorkouts';

const load = (exerciseId: string) =>
  useWorkoutStore.getState().workouts.find((w) => w.id === 'treino-a')!.exercises.find((e) => e.id === exerciseId)!
    .currentLoad;

describe('sessões de treino', () => {
  beforeEach(() => useWorkoutStore.setState({ workouts: sampleWorkouts, sessions: [], active: null }));

  it('ao finalizar, aplica a carga sugerida na ficha', () => {
    const { startSession, logSet, finishSession } = useWorkoutStore.getState();
    startSession('treino-a');
    for (let i = 0; i < 4; i++) logSet('a1', { load: 30, reps: 12, effort: 'ok' }); // 4 séries no topo
    logSet('a2', { load: 12, reps: 9, effort: 'ok' }); // incompleto

    const finished = finishSession();

    expect(finished?.suggestions?.a1).toEqual({ action: 'aumentar', load: 32.5 });
    expect(load('a1')).toBe(32.5);
    expect(load('a2')).toBe(12);
    expect(load('a3')).toBe(25); // não feito: carga igual
    expect(useWorkoutStore.getState().active).toBeNull();
    expect(useWorkoutStore.getState().sessions).toHaveLength(1);
  });

  it('usa a sessão anterior para decidir reduzir', () => {
    const run = (reps: number) => {
      const { startSession, logSet, finishSession } = useWorkoutStore.getState();
      startSession('treino-a');
      for (let i = 0; i < 4; i++) logSet('a1', { load: 30, reps, effort: 'dificil' });
      return finishSession();
    };
    expect(run(6)?.suggestions?.a1.action).toBe('manter');
    expect(run(6)?.suggestions?.a1.action).toBe('reduzir');
    expect(load('a1')).toBe(27.5);
  });

  it('desfaz a última série e cancela sem salvar', () => {
    const { startSession, logSet, undoSet, cancelSession } = useWorkoutStore.getState();
    startSession('treino-a');
    logSet('a1', { load: 30, reps: 10 });
    logSet('a1', { load: 30, reps: 9 });
    undoSet('a1');
    expect(useWorkoutStore.getState().active?.logs.a1).toHaveLength(1);
    cancelSession();
    expect(useWorkoutStore.getState().active).toBeNull();
    expect(useWorkoutStore.getState().sessions).toHaveLength(0);
  });
});
