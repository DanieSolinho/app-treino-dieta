/**
 * POST /api/analyze-label — função de back-end (Vercel Functions).
 *
 * Recebe a foto de um rótulo (ou de um alimento) + a porção do plano que você quer trocar.
 * 1. Pede ao Claude para LER a tabela nutricional e estimar a porção de referência (TACO).
 * 2. Faz a conta da equivalência em código (src/lib/labelMath.ts).
 *
 * Variáveis de ambiente (nunca no front-end, nunca no Git):
 *   ANTHROPIC_API_KEY   chave da API do Claude (obrigatória)
 *   SCAN_ACCESS_CODE    código que o app precisa enviar — impede que estranhos usem sua chave
 *   ANTHROPIC_MODEL     opcional; padrão claude-haiku-5-5 (rápido e barato, lê imagens)
 */
import { equivalentPortion, type Equivalence, type LabelReading, type ReferencePortion } from '../src/lib/labelMath';

export interface AnalyzeRequest {
  image: string; // base64, sem o prefixo "data:"
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  mode: 'rotulo' | 'alimento';
  reference: { name: string; grams: number; amountText: string; groupName?: string };
}

export interface AnalyzeResponse {
  reading: LabelReading;
  reference: ReferencePortion;
  equivalence: Equivalence;
}

type Env = Record<string, string | undefined>;
type FetchFn = typeof fetch;

const MAX_IMAGE_BASE64 = 4_000_000; // ~3 MB de imagem; o app reduz antes de enviar

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const nutrientsSchema = {
  type: 'object',
  properties: {
    kcal: { type: 'number' },
    carbs: { type: 'number', description: 'carboidratos em g' },
    protein: { type: 'number', description: 'proteínas em g' },
    fat: { type: 'number', description: 'gorduras totais em g' },
    fiber: { type: 'number', description: 'fibras em g, se houver' },
  },
  required: ['kcal', 'carbs', 'protein', 'fat'],
};

/** A IA responde preenchendo esta "ferramenta": garante um JSON no formato certo. */
const tool = {
  name: 'registrar_leitura',
  description: 'Registra os valores nutricionais lidos na imagem e a estimativa da porção de referência.',
  input_schema: {
    type: 'object',
    properties: {
      legivel: { type: 'boolean', description: 'false se a imagem não permite ler/identificar o alimento' },
      motivo: { type: 'string', description: 'se ilegível, explique em uma frase curta em português' },
      leitura: {
        type: 'object',
        properties: {
          foodName: { type: 'string' },
          unit: { type: 'string', enum: ['g', 'ml'] },
          basis: { type: 'string', enum: ['por100', 'porcao'] },
          servingSize: { type: 'number', description: 'tamanho de 1 porção do rótulo em g ou ml' },
          servingText: { type: 'string', description: 'porção em medida caseira, como está no rótulo' },
          nutrients: nutrientsSchema,
          confidence: { type: 'string', enum: ['alta', 'media', 'baixa'] },
          notes: { type: 'string', description: 'observação curta em português (ex.: valores estimados, açúcar adicionado alto)' },
        },
        required: ['foodName', 'unit', 'basis', 'nutrients', 'confidence'],
      },
      referencia: {
        type: 'object',
        description: 'valores estimados da porção do plano, pela Tabela TACO',
        properties: { nutrients: nutrientsSchema },
        required: ['nutrients'],
      },
    },
    required: ['legivel', 'referencia'],
  },
};

function prompt(req: AnalyzeRequest) {
  const ref = `${req.reference.name} — ${req.reference.amountText} (${req.reference.grams} g)${req.reference.groupName ? `, do ${req.reference.groupName}` : ''}`;
  const task =
    req.mode === 'rotulo'
      ? 'A imagem é uma tabela nutricional (rótulo brasileiro ou europeu). Leia exatamente os valores impressos. Use basis "por100" se houver coluna por 100 g/ml; senão "porcao" com servingSize. Não invente valores que não estão legíveis.'
      : 'A imagem é de um alimento sem rótulo. Identifique o alimento e use valores por 100 g da Tabela TACO (basis "por100"). Confidence no máximo "media".';
  return `${task}

Porção do plano alimentar que será trocada: ${ref}.
Em "referencia", estime as calorias e macros dessa porção exata pela Tabela TACO.

Responda chamando a ferramenta registrar_leitura. Se a foto não estiver legível ou não for comida, use legivel=false.`;
}

/** Lógica testável: recebe o corpo, as variáveis de ambiente e o fetch (trocado por um falso nos testes). */
export async function analyze(body: unknown, env: Env, accessCode: string | null, fetchFn: FetchFn = fetch): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) return json(501, { error: 'A função não está configurada: falta ANTHROPIC_API_KEY.' });
  if (env.SCAN_ACCESS_CODE && accessCode !== env.SCAN_ACCESS_CODE) return json(401, { error: 'Código de acesso inválido.' });

  const req = body as Partial<AnalyzeRequest>;
  if (
    !req?.image ||
    typeof req.image !== 'string' ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(req.mediaType ?? '') ||
    !['rotulo', 'alimento'].includes(req.mode ?? '') ||
    !req.reference?.name ||
    !(Number(req.reference.grams) > 0)
  ) {
    return json(400, { error: 'Pedido incompleto: envie a foto, o tipo e a porção de referência.' });
  }
  if (req.image.length > MAX_IMAGE_BASE64) return json(413, { error: 'Foto grande demais.' });

  const apiRes = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
      max_tokens: 1024,
      tools: [tool],
      tool_choice: { type: 'tool', name: tool.name },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: req.mediaType, data: req.image } },
            { type: 'text', text: prompt(req as AnalyzeRequest) },
          ],
        },
      ],
    }),
  });

  if (!apiRes.ok) {
    const detail = await apiRes.text().catch(() => '');
    console.error('Claude API', apiRes.status, detail.slice(0, 500));
    return json(502, { error: 'Não consegui analisar a foto agora. Tente de novo em instantes.' });
  }

  const data = (await apiRes.json()) as { content?: { type: string; name?: string; input?: Record<string, unknown> }[] };
  const call = data.content?.find((c) => c.type === 'tool_use' && c.name === tool.name)?.input as
    | { legivel: boolean; motivo?: string; leitura?: LabelReading; referencia?: { nutrients: ReferencePortion['nutrients'] } }
    | undefined;

  if (!call) return json(502, { error: 'A análise veio num formato inesperado.' });
  if (!call.legivel || !call.leitura || !call.referencia) {
    return json(422, { error: call.motivo || 'Não deu para ler a foto. Tente com mais luz e a tabela inteira enquadrada.' });
  }

  const reference: ReferencePortion = { name: req.reference.name, grams: Number(req.reference.grams), nutrients: call.referencia.nutrients };
  try {
    const equivalence = equivalentPortion(reference, call.leitura);
    return json(200, { reading: call.leitura, reference, equivalence } satisfies AnalyzeResponse);
  } catch (e) {
    return json(422, { error: (e as Error).message });
  }
}

/** Handler da Vercel (formato Web padrão: Request → Response). */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'JSON inválido.' });
  }
  return analyze(body, process.env, request.headers.get('x-access-code'));
}
