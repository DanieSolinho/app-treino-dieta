// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ScheduleEditor } from './ScheduleEditor';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { sampleWorkouts } from '../../data/sampleWorkouts';
import { monthGrid } from '../../lib/schedule';
import { toDateKey } from '../../lib/date';

afterEach(cleanup);
beforeEach(() => useWorkoutStore.setState({ workouts: sampleWorkouts, schedule: {} }));

describe('monthGrid', () => {
  it('dezembro de 2026 começa na terça e tem 5 semanas', () => {
    const weeks = monthGrid(2026, 11);
    expect(weeks[0].slice(0, 2)).toEqual([null, null]);
    expect(weeks[0][2]?.getDate()).toBe(1);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
});

describe('Editor da agenda', () => {
  it('marca ficha, várias fichas, descanso e limpa o dia', () => {
    render(<ScheduleEditor onDone={() => {}} />);
    const today = toDateKey(new Date());
    const day = () => useWorkoutStore.getState().schedule[today];

    fireEvent.click(screen.getByRole('button', { name: 'Treino A · Peito e tríceps' }));
    expect(day()).toEqual(['treino-a']);
    fireEvent.click(screen.getByRole('button', { name: 'Treino B · Pernas' }));
    expect(day()).toEqual(['treino-a', 'treino-b']);
    expect(screen.getByText('Você escolhe uma das fichas no dia.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Descanso' }));
    expect(day()).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Limpar dia' }));
    expect(day()).toBeUndefined();
  });

  it('"Próximo dia" avança a seleção', () => {
    render(<ScheduleEditor onDone={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descanso' }));
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(useWorkoutStore.getState().schedule[toDateKey(tomorrow)]).toEqual([]);
  });
});
