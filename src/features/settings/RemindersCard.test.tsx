// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const saved: unknown[] = [];
vi.mock('../../services/reminders', async (orig) => {
  const real = await orig<typeof import('../../services/reminders')>();
  return {
    ...real,
    pushSupport: () => 'ok',
    loadPrefs: async () => real.defaultPrefs,
    isSubscribed: async () => true,
    savePrefs: async (_: string, p: unknown) => {
      saved.push(p);
      return true;
    },
  };
});

import { RemindersCard } from './RemindersCard';

afterEach(cleanup);

describe('Lembretes', () => {
  it('liga água com intervalo e treino com horário, e salva', async () => {
    render(<RemindersCard userId="u1" />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Água/ }));
    fireEvent.click(screen.getByRole('radio', { name: '1h30' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Treino/ }));
    fireEvent.change(screen.getByLabelText('Avisar a partir das'), { target: { value: '19:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Lembretes salvos.')).toBeTruthy();
    expect(saved.at(-1)).toMatchObject({ water_enabled: true, water_every_min: 90, workout_enabled: true, workout_time: '19:30' });
  });

  it('não salva se o horário de início é depois do fim', async () => {
    render(<RemindersCard userId="u1" />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Água/ }));
    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '23:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('antes do fim');
  });
});
