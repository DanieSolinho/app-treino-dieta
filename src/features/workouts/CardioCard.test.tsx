// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CardioCard } from './CardioCard';

afterEach(cleanup);

describe('Bloco de cardio do treino híbrido', () => {
  it('escolhe o aparelho antes de começar e registra junto com os minutos', () => {
    const onDone = vi.fn();
    render(<CardioCard block={{ afterExercise: 1, minutes: 4, intensity: 'intenso' }} onDone={onDone} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Simulador de escada' }));
    fireEvent.click(screen.getByRole('button', { name: 'Começar 4 min' }));
    expect(screen.queryByRole('radio')).toBeNull(); // durante o cardio, só o cronômetro
    expect(screen.getByText(/Simulador de escada/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Terminar agora' }));
    expect(onDone).toHaveBeenCalledWith(1, 'escada');
  });

  it('pular registra 0 minutos', () => {
    const onDone = vi.fn();
    render(<CardioCard block={{ afterExercise: 2, minutes: 8, intensity: 'moderado' }} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pular cardio' }));
    expect(onDone).toHaveBeenCalledWith(0, expect.any(String));
  });
});
