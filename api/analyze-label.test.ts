import { describe, expect, it, vi } from 'vitest';
import { analyze } from './analyze-label';

const env = { ANTHROPIC_API_KEY: 'sk-test', SCAN_ACCESS_CODE: 'segredo' };
const body = {
  image: 'aGVsbG8=',
  mediaType: 'image/jpeg',
  mode: 'rotulo',
  reference: { name: 'Pão de forma integral', grams: 25, amountText: '1 fatia(s)', groupName: 'Grupo 12 · Pães e fibras' },
};

/** Resposta falsa da API do Claude, no formato real (bloco tool_use). */
const claudeReply = (input: unknown) =>
  vi.fn(async () => new Response(JSON.stringify({ content: [{ type: 'tool_use', name: 'registrar_leitura', input }] }), { status: 200 }));

const leitura = {
  foodName: 'Torrada integral',
  unit: 'g',
  basis: 'porcao',
  servingSize: 30,
  servingText: '3 torradas',
  nutrients: { kcal: 120, carbs: 21, protein: 4, fat: 2 },
  confidence: 'alta',
};

describe('POST /api/analyze-label', () => {
  it('lê o rótulo pela IA e faz a conta em código', async () => {
    const fetchFn = claudeReply({ legivel: true, leitura, referencia: { nutrients: { kcal: 62, carbs: 12, protein: 2.5, fat: 0.9 } } });
    const res = await analyze(body, env, 'segredo', fetchFn);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.equivalence.grams).toBe(15);
    expect(data.reading.foodName).toBe('Torrada integral');

    // a chave vai só no cabeçalho para a Anthropic, e a imagem segue em base64
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('sk-test');
    const sent = JSON.parse(init.body as string);
    expect(sent.tool_choice).toEqual({ type: 'tool', name: 'registrar_leitura' });
    expect(sent.messages[0].content[0].source).toEqual({ type: 'base64', media_type: 'image/jpeg', data: 'aGVsbG8=' });
  });

  it('bloqueia sem o código de acesso, sem gastar a API', async () => {
    const fetchFn = vi.fn();
    const res = await analyze(body, env, 'errado', fetchFn as unknown as typeof fetch);
    expect(res.status).toBe(401);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('avisa quando a função não tem chave configurada', async () => {
    const res = await analyze(body, {}, null);
    expect(res.status).toBe(501);
  });

  it('valida o pedido', async () => {
    const res = await analyze({ ...body, reference: { name: 'x', grams: 0 } }, env, 'segredo', vi.fn() as unknown as typeof fetch);
    expect(res.status).toBe(400);
  });

  it('foto ilegível volta com o motivo', async () => {
    const res = await analyze(body, env, 'segredo', claudeReply({ legivel: false, motivo: 'A tabela está cortada.', referencia: { nutrients: { kcal: 62, carbs: 12, protein: 2.5, fat: 0.9 } } }));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe('A tabela está cortada.');
  });

  it('erro da API vira mensagem amigável', async () => {
    const fetchFn = vi.fn(async () => new Response('overloaded', { status: 529 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await analyze(body, env, 'segredo', fetchFn);
    expect(res.status).toBe(502);
  });
});
