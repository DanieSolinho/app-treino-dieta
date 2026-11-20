// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CardioSession } from './CardioSession';
import { useWorkoutStore } from '../../stores/useWorkoutStore';

beforeEach(() => useWorkoutStore.setState({ sessions: [], active: null }));
afterEach(cleanup);

describe('cardio avulso', () => {
  it('pede as calorias do relógio ao terminar', () => {
    render(<CardioSession onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Já fiz · só registrar/ }));
    fireEvent.change(screen.getByLabelText('Calorias gastas (do relógio)'), { target: { value: '180' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(useWorkoutStore.getState().sessions[0].kcal).toBe(180);
  });
});
