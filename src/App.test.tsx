// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('abre na tela Dieta e mostra o botão de troca', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Dieta' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trocar Arroz branco' })).toBeTruthy();
  });

  it('marca uma refeição sem travar a tela', () => {
    render(<App />);
    const almoco = screen.getAllByRole('checkbox')[2];
    fireEvent.click(almoco);
    expect((almoco as HTMLInputElement).checked).toBe(true);
  });
});
