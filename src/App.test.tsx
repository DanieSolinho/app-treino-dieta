// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { useDayStore } from './stores/useDayStore';
import { useWorkoutStore } from './stores/useWorkoutStore';
import { useDietStore } from './stores/useDietStore';
import { samplePlan } from './data/samplePlan';
import { sampleWorkouts } from './data/sampleWorkouts';

// Os testes usam sempre os dados de exemplo, mesmo com src/data/private/ presente
beforeEach(() => {
  useDayStore.setState({ swaps: {}, mealsDone: {}, waterLog: {}, variants: {} });
  useDietStore.setState({ plan: samplePlan });
  useWorkoutStore.setState({ workouts: sampleWorkouts, sessions: [], active: null });
});
afterEach(cleanup);

const nav = () => screen.getByRole('navigation', { name: 'Navegação principal' });

describe('App', () => {
  it('abre no painel Hoje', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Água' })).toBeTruthy();
    expect(screen.getByLabelText('0 dias seguidos cumpridos')).toBeTruthy();
  });

  it('soma e desfaz água', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '+500 ml' }));
    fireEvent.click(screen.getByRole('button', { name: '+250 ml' }));
    expect(screen.getByText('0,75 L')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer último' }));
    expect(screen.getByText('0,5 L')).toBeTruthy();
  });

  it('vai para a Dieta e mostra o botão de troca', () => {
    render(<App />);
    fireEvent.click(within(nav()).getByRole('button', { name: /Dieta/ }));
    expect(screen.getByRole('heading', { name: 'Dieta' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trocar Arroz branco' })).toBeTruthy();
  });

  it('faz um treino completo e mostra a carga nova no resumo', () => {
    window.confirm = () => true;
    useWorkoutStore.setState({
      sessions: [],
      active: null,
      workouts: [
        {
          id: 'teste',
          name: 'Treino Teste',
          weekDays: [],
          exercises: [
            { id: 'e1', name: 'Supino', sets: 2, repMin: 8, repMax: 12, restSeconds: 60, increment: 2.5, currentLoad: 20 },
          ],
        },
      ],
    });
    render(<App />);
    fireEvent.click(within(nav()).getByRole('button', { name: /Treinos/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }));

    expect(screen.getByRole('heading', { name: 'Supino' })).toBeTruthy();
    // reps começam no topo da faixa (12) e carga na atual (20 kg)
    fireEvent.click(screen.getByRole('button', { name: 'Concluir série' }));
    expect(screen.getByRole('timer', { name: 'Descanso' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Concluir série' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar treino' }));

    expect(screen.getByText('Treino concluído')).toBeTruthy();
    expect(screen.getByText('Sobe para 22,5 kg')).toBeTruthy();
    expect(useWorkoutStore.getState().workouts[0].exercises[0].currentLoad).toBe(22.5);
  });

  it('troca um alimento por um do grupo, na porção certa, e alterna a versão da refeição', () => {
    render(<App />);
    fireEvent.click(within(nav()).getByRole('button', { name: /Dieta/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Trocar Arroz branco' }));

    const dialog = screen.getByRole('dialog');
    // opção da refeição + grupo carboidratos × 4 porções (1 fatia de 40 g → 4 fatias, 160 g)
    expect(within(dialog).getByText('Macarrão integral cozido')).toBeTruthy();
    expect(within(dialog).getByText('4 fatia(s) pequena(s) (160 g)')).toBeTruthy();
    fireEvent.click(within(dialog).getByText('Batata-doce cozida'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar troca' }));
    expect(screen.getByText(/no lugar de arroz branco/)).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Sem feijão' }));
    expect(screen.queryByText('Feijão')).toBeNull();
    expect(screen.getByText('6 colher(es) de sopa cheia(s) (150 g)')).toBeTruthy();
  });

  it('mostra o cardio opcional depois do exercício indicado e deixa pular', () => {
    window.confirm = () => true;
    useWorkoutStore.setState({
      workouts: [
        {
          id: 'h',
          name: 'Treino Híbrido',
          weekDays: [],
          cardio: [{ afterExercise: 1, minutes: 4, intensity: 'intenso' }],
          exercises: [
            { id: 'h1', name: 'Remada', sets: 1, repMin: 8, repMax: 12, restSeconds: 60, increment: 5, currentLoad: 20 },
            { id: 'h2', name: 'Puxada', sets: 1, repMin: 8, repMax: 12, restSeconds: 60, increment: 5, currentLoad: 20 },
          ],
        },
      ],
    });
    render(<App />);
    fireEvent.click(within(nav()).getByRole('button', { name: /Treinos/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir série' }));

    expect(screen.getByRole('heading', { name: '4 min intensos' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Próximo exercício' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pular cardio' }));
    expect(useWorkoutStore.getState().active?.cardio).toEqual({ 1: 0 });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo exercício' }));
    expect(screen.getByRole('heading', { name: 'Puxada' })).toBeTruthy();
  });

  it('refeição sem horário não mostra hora', () => {
    render(<App />);
    fireEvent.click(within(nav()).getByRole('button', { name: /Dieta/ }));
    expect(screen.queryByText(/\d\d:\d\d/)).toBeNull();
  });

  it('marca uma refeição na Dieta sem travar a tela', () => {
    render(<App />);
    fireEvent.click(within(nav()).getByRole('button', { name: /Dieta/ }));
    const almoco = screen.getAllByRole('checkbox')[2] as HTMLInputElement;
    fireEvent.click(almoco);
    expect(almoco.checked).toBe(true);
  });
});
