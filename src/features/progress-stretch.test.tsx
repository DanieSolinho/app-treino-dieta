// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';
import { useBodyStore } from '../stores/useBodyStore';
import { expandSteps, sampleStretches } from '../data/stretchRoutines';
import { StretchPlayer } from './workouts/StretchPlayer';

const nav = () => screen.getByRole('navigation', { name: 'Navegação principal' });

beforeEach(() => useBodyStore.setState({ entries: [] }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Progresso', () => {
  it('registra peso e mostra a variação', () => {
    useBodyStore.getState().saveEntry({ date: '2026-10-01', weightKg: 70 });
    render(<App />);
    fireEvent.click(within(nav()).getByRole('button', { name: /Progresso/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Novo registro de peso e medidas' }));
    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '68,4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar registro' }));

    expect(screen.getByText('68,4 kg')).toBeTruthy();
    expect(screen.getByText(/-1,6 kg desde 1 out/)).toBeTruthy();
  });

  it('não salva registro vazio', () => {
    render(<App />);
    fireEvent.click(within(nav()).getByRole('button', { name: /Progresso/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Novo registro de peso e medidas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar registro' }));
    expect(screen.getByRole('alert').textContent).toContain('Preencha o peso');
    expect(useBodyStore.getState().entries).toHaveLength(0);
  });

  it('salvar duas vezes no mesmo dia junta peso e medidas', () => {
    const { saveEntry } = useBodyStore.getState();
    saveEntry({ date: '2026-11-10', weightKg: 68 });
    saveEntry({ date: '2026-11-10', measures: { cintura: 72 } });
    expect(useBodyStore.getState().entries).toEqual([
      expect.objectContaining({ date: '2026-11-10', weightKg: 68, measures: { cintura: 72 } }),
    ]);
  });
});

describe('Alongamento', () => {
  it('passos dos dois lados viram dois passos', () => {
    const ombros = sampleStretches.find((r) => r.id === 'ombros')!;
    expect(expandSteps(ombros)).toHaveLength(6); // 1 + 2 + 2 + 1 (o de repetições não divide)
  });

  it('o timer avança sozinho para a próxima posição', () => {
    vi.useFakeTimers();
    render(<StretchPlayer routine={sampleStretches[0]} onClose={() => {}} />);

    expect(screen.getByRole('heading', { name: 'Rotação de ombros' })).toBeTruthy();
    act(() => vi.advanceTimersByTime(31_000));
    expect(screen.getByRole('heading', { name: 'Braço cruzado' })).toBeTruthy();
    expect(screen.getByText('Lado direito')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText('Lado direito')).toBeTruthy(); // pausado não avança
  });

  it('movimento por repetições espera o "Feito"', () => {
    vi.useFakeTimers();
    const routine = { ...sampleStretches[0], steps: [sampleStretches[0].steps[3]] }; // Gato e vaca · 10 movimentos
    render(<StretchPlayer routine={routine} onClose={() => {}} />);
    expect(screen.getByText('10 movimentos')).toBeTruthy();
    act(() => vi.advanceTimersByTime(120_000));
    expect(screen.getByRole('heading', { name: 'Gato e vaca' })).toBeTruthy(); // não avança sozinho
    fireEvent.click(screen.getByRole('button', { name: 'Feito' }));
    expect(screen.getByText('Alongamento concluído')).toBeTruthy();
  });
});
