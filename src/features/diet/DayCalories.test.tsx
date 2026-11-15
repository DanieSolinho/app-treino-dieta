// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DietPage } from './DietPage';
import { useDayStore } from '../../stores/useDayStore';
import { useDietStore } from '../../stores/useDietStore';
import { samplePlan } from '../../data/samplePlan';

beforeEach(() => {
  useDayStore.setState({ swaps: {}, mealsDone: {}, waterLog: {}, variants: {}, amounts: {}, offPlan: {} });
  useDietStore.setState({ plan: { ...samplePlan, kcalGoal: 1300 } });
});
afterEach(cleanup);

const total = () => screen.getByText(/de 1\.300 kcal/).parentElement!.textContent;

describe('Calorias do dia', () => {
  it('soma a quantidade digitada e a refeição fora da dieta', () => {
    render(<DietPage />);
    expect(total()).toContain('0 kcal');

    // ovos mexidos: 167 kcal/100 g → 150 g = 251 kcal
    fireEvent.change(screen.getByLabelText('Quanto comi de ovos mexidos, em g'), { target: { value: '150' } });
    expect(screen.getAllByText('251 kcal').length).toBeGreaterThan(0);
    expect(total()).toContain('251 kcal');

    fireEvent.click(screen.getByRole('button', { name: '+ Registrar refeição fora da dieta' }));
    fireEvent.change(screen.getByLabelText('O que comi'), { target: { value: 'Pastel de queijo' } });
    fireEvent.change(screen.getByLabelText('Calorias (kcal)'), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('Pastel de queijo')).toBeTruthy();
    expect(total()).toContain('551 kcal');
    expect(screen.getByText('Faltam').nextSibling!.textContent).toBe('749 kcal');

    fireEvent.click(screen.getByRole('button', { name: 'Apagar Pastel de queijo' }));
    expect(total()).toContain('251 kcal');
  });

  it('não deixa adicionar sem descrição ou calorias', () => {
    render(<DietPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Registrar refeição fora da dieta' }));
    fireEvent.change(screen.getByLabelText('O que comi'), { target: { value: 'Brigadeiro' } });
    expect((screen.getByRole('button', { name: 'Adicionar' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
