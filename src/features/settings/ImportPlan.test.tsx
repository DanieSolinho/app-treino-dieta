// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImportPlan } from './ImportPlan';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useDietStore } from '../../stores/useDietStore';
import { sampleWorkouts } from '../../data/sampleWorkouts';
import { samplePlan } from '../../data/samplePlan';
import { PLAN_FORMAT } from '../../lib/planImport';

const pick = (content: string) => {
  const file = new File([content], 'plano-dez.json', { type: 'application/json' });
  fireEvent.change(screen.getByLabelText('Arquivo do plano'), { target: { files: [file] } });
};

afterEach(cleanup);

beforeEach(() => {
  useWorkoutStore.setState({ workouts: sampleWorkouts, schedule: {}, active: null });
  useDietStore.setState({ plan: samplePlan });
});

describe('Importar plano', () => {
  it('mostra o que muda e só aplica depois de confirmar', async () => {
    render(<ImportPlan />);
    const workouts = structuredClone(sampleWorkouts).slice(0, 1);
    pick(JSON.stringify({ format: PLAN_FORMAT, version: 1, label: 'Plano de dezembro', workouts, schedule: { '2026-12-01': ['treino-a'] } }));

    expect(await screen.findByText(/Plano de dezembro/)).toBeTruthy();
    expect(screen.getByText('Treino A · Peito e tríceps: mesmos exercícios')).toBeTruthy();
    expect(useWorkoutStore.getState().workouts).toHaveLength(sampleWorkouts.length); // ainda não aplicou

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar plano' }));
    await waitFor(() => expect(screen.getByText(/Plano atualizado/)).toBeTruthy());
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
    expect(useWorkoutStore.getState().schedule).toEqual({ '2026-12-01': ['treino-a'] });
    expect(useDietStore.getState().plan).toBe(samplePlan); // dieta não veio no arquivo
  });

  it('arquivo inválido mostra o motivo e não muda nada', async () => {
    render(<ImportPlan />);
    pick(JSON.stringify({ format: PLAN_FORMAT, version: 1, schedule: { '2026-12-01': ['treino-x'] } }));
    expect((await screen.findByRole('alert')).textContent).toContain('treino-x');
    expect(useWorkoutStore.getState().schedule).toEqual({});
  });

  it('com treino em andamento não deixa importar', () => {
    useWorkoutStore.getState().startSession('treino-a');
    render(<ImportPlan />);
    expect(screen.queryByRole('button', { name: 'Importar plano' })).toBeNull();
  });
});
