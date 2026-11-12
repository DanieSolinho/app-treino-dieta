import { useState } from 'react';
import type { Food, MealItem } from '../../types/diet';
import type { AnalyzeResponse } from '../../../api/analyze-label';
import { f, formatAmount } from '../../lib/food';
import { fileToJpegBase64 } from '../../lib/image';
import { macroLabel } from '../../lib/labelMath';

interface Props {
  item: MealItem;
  groupName?: string;
  onUse: (food: Food) => void;
}

type Mode = 'rotulo' | 'alimento';
type Status = { kind: 'idle' } | { kind: 'loading'; preview: string } | { kind: 'done'; preview: string; result: AnalyzeResponse } | { kind: 'error'; message: string };

const CODE_KEY = 'scan-access-code';
const readCode = () => {
  try {
    return localStorage.getItem(CODE_KEY) ?? '';
  } catch {
    return '';
  }
};
const saveCode = (code: string) => {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* navegador sem storage: o código vale só nesta sessão */
  }
};

const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** "Tenho outro alimento": foto do rótulo (ou do alimento) → quanto dá para comer no lugar da porção do plano. */
export function ScanLabel({ item, groupName, onUse }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [code, setCode] = useState(readCode);
  const [askCode, setAskCode] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<{ file: File; mode: Mode } | null>(null);

  const grams = item.food.grams;
  if (!grams) return null; // itens "à vontade" não têm porção para comparar

  async function analyze(file: File, mode: Mode, accessCode = code) {
    setLastPhoto({ file, mode });
    try {
      const photo = await fileToJpegBase64(file);
      setStatus({ kind: 'loading', preview: photo.preview });
      const res = await fetch('/api/analyze-label', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-access-code': accessCode },
        body: JSON.stringify({
          image: photo.base64,
          mediaType: photo.mediaType,
          mode,
          reference: { name: item.food.name, grams, amountText: formatAmount(item.food), groupName },
        }),
      });
      const data = await res.json().catch(() => ({ error: 'Resposta inválida do servidor.' }));
      if (res.status === 401) {
        setAskCode(true);
        setStatus({ kind: 'error', message: 'Digite o código de acesso para usar o escaneamento.' });
        return;
      }
      if (!res.ok) {
        setStatus({ kind: 'error', message: data.error ?? 'Não consegui analisar a foto.' });
        return;
      }
      setStatus({ kind: 'done', preview: photo.preview, result: data as AnalyzeResponse });
    } catch {
      setStatus({ kind: 'error', message: 'Sem conexão com o servidor. Confira a internet e tente de novo.' });
    }
  }

  const pick = (mode: Mode) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite escolher a mesma foto de novo
    if (file) void analyze(file, mode);
  };

  return (
    <section className="scan" aria-labelledby="scan-title">
      <h3 id="scan-title" className="scan__title">Tem outro alimento?</h3>
      <p className="muted">Fotografe e eu calculo quanto equivale a {formatAmount(item.food)}.</p>

      <div className="scan__buttons">
        <label className="btn-sm btn-sm--dark scan__pick">
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick('rotulo')} />
          Foto do rótulo
        </label>
        <label className="btn-sm btn-sm--outline scan__pick">
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick('alimento')} />
          Foto do alimento
        </label>
      </div>

      {askCode && (
        <form
          className="scan__code"
          onSubmit={(e) => {
            e.preventDefault();
            saveCode(code);
            setAskCode(false);
            if (lastPhoto) void analyze(lastPhoto.file, lastPhoto.mode, code);
          }}
        >
          <label className="field field--sm">
            <span className="field__label">Código de acesso</span>
            <input className="input" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <button type="submit" className="btn-sm btn-sm--dark">
            Salvar
          </button>
        </form>
      )}

      {status.kind === 'loading' && (
        <div className="scan__result" aria-live="polite">
          <img className="scan__preview" src={status.preview} alt="" />
          <p className="muted">Lendo a foto…</p>
        </div>
      )}

      {status.kind === 'error' && (
        <p className="error" role="alert">
          {status.message}
        </p>
      )}

      {status.kind === 'done' && <ScanResult result={status.result} preview={status.preview} onUse={onUse} />}
    </section>
  );
}

function ScanResult({ result, preview, onUse }: { result: AnalyzeResponse; preview: string; onUse: (food: Food) => void }) {
  const { reading, reference, equivalence: eq } = result;
  const rows: [string, number, number][] = [
    ['Calorias (kcal)', reference.nutrients.kcal, eq.nutrients.kcal],
    ['Carboidratos (g)', reference.nutrients.carbs, eq.nutrients.carbs],
    ['Proteínas (g)', reference.nutrients.protein, eq.nutrients.protein],
    ['Gorduras (g)', reference.nutrients.fat, eq.nutrients.fat],
  ];

  return (
    <div className="scan__result" aria-live="polite">
      <div className="scan__head">
        <img className="scan__preview" src={preview} alt="" />
        <div>
          <p className="eyebrow">{reading.foodName}</p>
          <p className="scan__amount">
            ≈ {eq.grams} {reading.unit}
          </p>
          {eq.servings !== undefined && reading.servingText && (
            <p className="muted">
              {num(eq.servings)} da porção do rótulo ({reading.servingText})
            </p>
          )}
        </div>
      </div>

      <table className="table scan__table">
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">Seu plano</th>
            <th scope="col">{num(eq.grams)} {reading.unit}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, a, b]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{num(a)}</td>
              <td>{num(b)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {eq.macroGap && (
        <p className="note note--warn">
          Mesmas calorias, mas bem menos/mais {macroLabel[eq.macroGap.macro]} ({num(eq.macroGap.equivalent)} g contra{' '}
          {num(eq.macroGap.reference)} g). Não é uma troca equivalente de verdade.
        </p>
      )}
      {reading.confidence !== 'alta' && (
        <p className="note note--warn">
          Confiança {reading.confidence === 'media' ? 'média' : 'baixa'}: {reading.notes ?? 'alguns valores foram estimados.'}
        </p>
      )}
      <p className="muted scan__disclaimer">
        Estimativa feita por IA a partir da foto. Para alimentos fora da sua lista, confirme com sua nutricionista.
      </p>

      <button
        type="button"
        className="btn btn--dark"
        onClick={() => onUse(f(reading.foodName, null, `${eq.grams} ${reading.unit} · calculado pelo rótulo`))}
      >
        Usar como troca de hoje
      </button>
    </div>
  );
}
