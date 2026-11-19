// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SessionKcal } from './SessionKcal';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useDayStore } from '../../stores/useDayStore';
import { useDietStore } from '../../stores/useDietStore';
import { samplePlan } from '../../data/samplePlan';
import { sampleWorkouts } from '../../data/sampleWorkouts';
import { sessionToRow, rowToSession } from '../../services/sync/rows';
import { DietPage } from '../diet/DietPage';
import type { WorkoutSession } from '../../types/workout';

const now = new Date();
const session: WorkoutSession = {
  id: 's1',
  workoutId: sampleWorkouts[0].id,
  startedAt: now.toISOString(), // começa "agora": o teste não depende da hora em que roda
  finishedAt: now.toISOString(),
  logs: {},
};

beforeEach(() => {
  useWorkoutStore.setState({ workouts: sampleWorkouts, sessions: [session], active: null });
  useDayStore.setState({ swaps: {}, mealsDone: {}, waterLog: {}, variants: {}, amounts: {}, offPlan: {} });
  useDietStore.setState({ plan: { ...samplePlan, kcalGoal: 1300 } });
});
afterEach(cleanup);

describe('calorias gastas no treino', () => {
  it('salva o valor do relógio e deixa editar', () => {
    render(<SessionKcal sessionId="s1" />);
    fireEvent.change(screen.getByLabelText('Calorias gastas (do relógio)'), { target: { value: '320' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(useWorkoutStore.getState().sessions[0].kcal).toBe(320);
    expect(screen.getByText('320 kcal')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'editar' }));
    fireEvent.change(screen.getByLabelText('Calorias gastas (do relógio)'), { target: { value: '355' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(useWorkoutStore.getState().sessions[0].kcal).toBe(355);
  });

  it('aparece na Dieta como linha separada, sem mudar o que falta', () => {
    useWorkoutStore.getState().setSessionKcal('s1', 320);
    render(<DietPage />);
    expect(screen.getByText('320 kcal gastas')).toBeTruthy();
    expect(screen.getByText('Faltam').nextSibling!.textContent).toBe('1.300 kcal');
  });

  it('vai e volta do servidor', () => {
    const withKcal = { ...session, kcal: 410 };
    expect(rowToSession({ ...sessionToRow('u', withKcal), updated_at: '' } as never)).toEqual(withKcal);
    expect(rowToSession({ ...sessionToRow('u', session), updated_at: '' } as never)).toEqual(session);
  });
});
