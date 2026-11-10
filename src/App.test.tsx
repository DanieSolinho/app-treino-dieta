// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { useDayStore } from './stores/useDayStore';

beforeEach(() => useDayStore.setState({ swaps: {}, mealsDone: {}, waterLog: {} }));
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

  it('marca uma refeição na Dieta sem travar a tela', () => {
    render(<App />);
    fireEvent.click(within(nav()).getByRole('button', { name: /Dieta/ }));
    const almoco = screen.getAllByRole('checkbox')[2] as HTMLInputElement;
    fireEvent.click(almoco);
    expect(almoco.checked).toBe(true);
  });
});
