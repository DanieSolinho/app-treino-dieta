// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScanLabel } from './ScanLabel';
import { f } from '../../lib/food';

// canvas não existe no jsdom: a redução da foto é simulada
vi.mock('../../lib/image', () => ({
  fileToJpegBase64: async () => ({ base64: 'aGVsbG8=', mediaType: 'image/jpeg', preview: 'data:image/jpeg;base64,aGVsbG8=' }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const item = { id: 'lan-pao', food: f('Pão de forma integral', 1, 'fatia(s)', 25), group: { id: '12', portions: 1 } };

const ok = {
  reading: { foodName: 'Torrada integral', unit: 'g', basis: 'porcao', servingSize: 30, servingText: '3 torradas', nutrients: { kcal: 120, carbs: 21, protein: 4, fat: 2 }, confidence: 'alta' },
  reference: { name: 'Pão de forma integral', grams: 25, nutrients: { kcal: 62, carbs: 12, protein: 2.5, fat: 0.9 } },
  equivalence: { grams: 15, servings: 0.5, nutrients: { kcal: 60, carbs: 10.5, protein: 2, fat: 1 }, basis: 'kcal' },
};

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const photo = () => new File(['x'], 'rotulo.jpg', { type: 'image/jpeg' });

describe('Escanear rótulo', () => {
  it('pede o código, tenta de novo e mostra quanto comer', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(401, { error: 'Código de acesso inválido.' }))
      .mockResolvedValueOnce(reply(200, ok));
    vi.stubGlobal('fetch', fetchMock);
    const onUse = vi.fn();
    render(<ScanLabel item={item} groupName="Grupo 12 · Pães e fibras" onUse={onUse} />);

    fireEvent.change(screen.getByLabelText('Foto do rótulo'), { target: { files: [photo()] } });
    await screen.findByLabelText('Código de acesso');
    fireEvent.change(screen.getByLabelText('Código de acesso'), { target: { value: 'meu-codigo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await screen.findByText('≈ 15 g');
    expect(screen.getByText(/0,5 da porção do rótulo \(3 torradas\)/)).toBeTruthy();

    const second = fetchMock.mock.calls[1][1] as RequestInit;
    expect((second.headers as Record<string, string>)['x-access-code']).toBe('meu-codigo');
    expect(JSON.parse(second.body as string).reference).toEqual({
      name: 'Pão de forma integral',
      grams: 25,
      amountText: '1 fatia(s) (25 g)',
      groupName: 'Grupo 12 · Pães e fibras',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Usar como troca de hoje' }));
    expect(onUse).toHaveBeenCalledWith(f('Torrada integral', null, '15 g · calculado pelo rótulo'));
  });

  it('mostra o erro do servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(422, { error: 'A tabela está cortada.' })));
    render(<ScanLabel item={item} onUse={() => {}} />);
    fireEvent.change(screen.getByLabelText('Foto do alimento'), { target: { files: [photo()] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('A tabela está cortada.'));
  });

  it('não aparece para itens à vontade', () => {
    render(<ScanLabel item={{ id: 'x', food: f('Alface', null, 'à vontade') }} onUse={() => {}} />);
    expect(screen.queryByText('Tem outro alimento?')).toBeNull();
  });
});
