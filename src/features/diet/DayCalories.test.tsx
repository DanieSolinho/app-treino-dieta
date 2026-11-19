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
    fireEvent.click(screen.getByRole('radio', { name: 'Outro alimento' }));
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
    fireEvent.click(screen.getByRole('radio', { name: 'Outro alimento' }));
    fireEvent.change(screen.getByLabelText('O que comi'), { target: { value: 'Brigadeiro' } });
    expect((screen.getByRole('button', { name: 'Adicionar' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('registra um alimento da lista da dieta com a porção sugerida ou outra quantidade', () => {
    render(<DietPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Registrar refeição fora da dieta' }));
    // a lista da dieta abre primeiro, com porção e calorias de cada alimento
    expect(screen.getByText(/1 unidade\(s\) média\(s\) \(65 g\) · 64 kcal/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Buscar na lista da dieta'), { target: { value: 'banana' } });
    expect(screen.queryByRole('radio', { name: /Maçã/ })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Banana prata/ }));

    const qty = screen.getByLabelText('Quantidade de banana prata fora da dieta, em g') as HTMLInputElement;
    expect(qty.value).toBe('65');
    fireEvent.change(qty, { target: { value: '130' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('Banana prata · 130 g')).toBeTruthy();
    expect(total()).toContain('127 kcal');
  });

  it('os alimentos já usados fora da dieta aparecem primeiro', () => {
    useDayStore.setState({ offPlan: { '2026-11-01': [{ id: 'x', text: 'Maçã · 90 g', kcal: 50 }] } });
    render(<DietPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Registrar refeição fora da dieta' }));
    const list = screen.getByRole('group', { name: 'Alimentos da dieta' });
    expect(list.querySelector('.options__divider')!.textContent).toBe('Mais usados');
    expect(list.querySelectorAll('.option__name')[0].textContent).toBe('Maçã');
  });
});

