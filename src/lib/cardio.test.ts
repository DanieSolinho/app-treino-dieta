import { describe, expect, it } from 'vitest';
import { cardioMinutesBetween, cardioText } from './cardio';
import { weekSummary } from './achievements';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { sessionToRow, rowToSession } from '../services/sync/rows';
import type { WorkoutSession } from '../types/workout';

const s = (p: Partial<WorkoutSession>): WorkoutSession => ({
  id: 'x', workoutId: 'treino-a', startedAt: '2026-11-03T18:00:00Z', finishedAt: '2026-11-03T19:00:00Z', logs: {}, ...p,
});

describe('cardio', () => {
  it('texto por aparelho, somando blocos do mesmo aparelho', () => {
    expect(cardioText(s({ cardio: { 1: 4, 2: 8, 4: 0 }, cardioMachines: { 1: 'esteira', 2: 'esteira' } }))).toBe('12 min na esteira');
    expect(cardioText(s({ cardio: { 1: 5, 3: 10 }, cardioMachines: { 1: 'bike', 3: 'escada' } }))).toBe('5 min na bike + 10 min no simulador de escada');
    expect(cardioText(s({ cardio: { 1: 6 } }))).toBe('6 min'); // sessões antigas, sem aparelho
  });

  it('cardio avulso vira sessão finalizada própria e sincroniza o aparelho', () => {
    useWorkoutStore.setState({ sessions: [] });
    const session = useWorkoutStore.getState().logStandaloneCardio('transport', 25, new Date('2026-11-04T08:30:00Z'));
    expect(session).toMatchObject({ workoutId: 'cardio', cardio: { 0: 25 }, cardioMachines: { 0: 'transport' }, startedAt: '2026-11-04T08:05:00.000Z' });
    expect(useWorkoutStore.getState().sessions[0].id).toBe(session.id);
    expect(rowToSession({ ...sessionToRow('u', session), updated_at: '' } as never)).toEqual(session);
  });

  it('resumo da semana separa treinos de musculação e minutos de cardio', () => {
    const list = [
      s({ id: 'a', cardio: { 1: 8 }, cardioMachines: { 1: 'esteira' } }),
      s({ id: 'b', workoutId: 'cardio', startedAt: '2026-11-04T08:00:00Z', cardio: { 0: 30 }, cardioMachines: { 0: 'bike' } }),
    ];
    const r = weekSummary(list, () => 0, 2500, new Date(2026, 10, 12));
    expect(r.workouts).toBe(1);
    expect(r.cardioMinutes).toBe(38);
    expect(cardioMinutesBetween(list, '2026-11-02', '2026-11-08')).toBe(38);
  });
});
