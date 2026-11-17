import { useMemo, useState, type FormEvent } from 'react';
import type { Food, OffPlanEntry } from '../../types/diet';
import { useDietStore } from '../../stores/useDietStore';
import { useDayStore } from '../../stores/useDayStore';
import { dayCalories, formatKcal, kcalFor, kcalGoal, normalizeName } from '../../lib/calories';
import { formatAmount } from '../../lib/food';
import { toDateKey } from '../../lib/date';

// Referências fixas: objetos novos a cada render fazem o Zustand 5 entrar em loop
const NONE: string[] = [];
const NO_MAP: Record<string, never> = {};
const NO_ENTRIES: OffPlanEntry[] = [];

interface DietOption {
  key: string;
  group: string;
  food: Food;
  kcal: number;
}

/** Alimentos da lista de substituição que têm gramas e calorias, por grupo. */
function useDietOptions(): DietOption[] {
  const groups = useDietStore((s) => s.plan.groups);
  return useMemo(
    () =>
      groups.flatMap((g) =>
        g.options.flatMap((food) => {
          const kcal = kcalFor(food, food.grams);
          return kcal === undefined ? [] : [{ key: `${g.id}-${food.name}`, group: g.name, food, kcal }];
        }),
      ),
    [groups],
  );
}

const unitOf = (food: Food) => food.unit ?? 'g';
const parseNumber = (text: string) => Number(text.replace(',', '.'));

/** Escolher um alimento da dieta: mostra a porção sugerida e calcula as calorias da quantidade. */
function FromDietForm({ onAdd, onCancel }: { onAdd: (entry: Omit<OffPlanEntry, 'id'>) => void; onCancel: () => void }) {
  const options = useDietOptions();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<DietOption | null>(null);
  const [grams, setGrams] = useState('');

  const q = normalizeName(query);
  const visible = q ? options.filter((o) => normalizeName(o.food.name).includes(q)) : options;
  const amount = parseNumber(grams);
  const valid = picked !== null && grams.trim() !== '' && Number.isFinite(amount) && amount > 0;
  const kcal = valid ? kcalFor(picked.food, amount) : undefined;

  function pick(o: DietOption) {
    setPicked(o);
    setGrams(String(o.food.grams).replace('.', ','));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || kcal === undefined) return;
    const qty = `${amount.toLocaleString('pt-BR')} ${unitOf(picked.food)}`;
    onAdd({ text: `${picked.food.name} · ${qty}`, kcal });
  }

  let lastGroup = '';
  return (
    <form className="stack-sm" onSubmit={submit}>
      <label className="field">
        <span className="field__label">Buscar na lista da dieta</span>
        <input className="input" type="search" placeholder="Ex.: banana, picanha, whey" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      <fieldset className="options offplan__list">
        <legend className="sr-only">Alimentos da dieta</legend>
        {visible.length === 0 && <p className="muted">Nada encontrado. Use "Outro alimento".</p>}
        {visible.map((o) => {
          const header = o.group !== lastGroup ? <p className="options__divider">{o.group}</p> : null;
          lastGroup = o.group;
          const checked = picked?.key === o.key;
          return (
            <div key={o.key} className="offplan__opt">
              {header}
              <label className={`option ${checked ? 'option--checked' : ''}`}>
                <input type="radio" name="da-dieta" checked={checked} onChange={() => pick(o)} />
                <span className="option__text">
                  <span className="option__name">{o.food.name}</span>
                  <span className="option__amount">
                    {formatAmount(o.food)} · {formatKcal(o.kcal)}
                  </span>
                </span>
              </label>
            </div>
          );
        })}
      </fieldset>

      {picked && (
        <div className="offplan__picked">
          <p className="offplan__picked-name">{picked.food.name}</p>
          <p className="muted">
            Sugestão: {formatAmount(picked.food)} · {formatKcal(picked.kcal)}
          </p>
          <div className="amount">
            <input
              className="amount__input"
              type="text"
              inputMode="decimal"
              value={grams}
              aria-label={`Quantidade de ${picked.food.name.toLowerCase()} fora da dieta, em ${unitOf(picked.food)}`}
              onChange={(e) => setGrams(e.target.value)}
            />
            <span className="amount__unit">{unitOf(picked.food)}</span>
            {kcal !== undefined && <span className="amount__kcal amount__kcal--typed">{formatKcal(kcal)}</span>}
          </div>
        </div>
      )}

      <div className="row">
        <button type="button" className="btn-sm btn-sm--outline" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-sm btn-sm--dark" disabled={!valid}>
          Adicionar
        </button>
      </div>
    </form>
  );
}

/** "Fora da dieta": um alimento da lista da dieta, ou outro com as calorias pesquisadas por você. */
function OffPlanCard() {
  const date = toDateKey();
  const entries = useDayStore((s) => s.offPlan[date] ?? NO_ENTRIES);
  const add = useDayStore((s) => s.addOffPlan);
  const remove = useDayStore((s) => s.removeOffPlan);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'dieta' | 'outro'>('dieta');
  const [text, setText] = useState('');
  const [kcal, setKcal] = useState('');
  const kcalNumber = Number(kcal.replace(',', '.'));
  const valid = text.trim() !== '' && kcal.trim() !== '' && Number.isFinite(kcalNumber) && kcalNumber >= 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    add(date, { text: text.trim(), kcal: Math.round(kcalNumber) });
    setText('');
    setKcal('');
    setOpen(false);
  }

  return (
    <section className="card stack-sm" aria-labelledby="offplan-title">
      <h2 id="offplan-title" className="card__title">
        Fora da dieta
      </h2>

      {entries.length > 0 && (
        <ul className="offplan">
          {entries.map((e) => (
            <li key={e.id} className="offplan__item">
              <span className="offplan__text">{e.text}</span>
              <span className="offplan__kcal">{formatKcal(e.kcal)}</span>
              <button type="button" className="link-btn" aria-label={`Apagar ${e.text}`} onClick={() => remove(date, e.id)}>
                apagar
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="variant offplan__modes" role="radiogroup" aria-label="De onde vem o alimento">
          {(
            [
              ['dieta', 'Da lista da dieta'],
              ['outro', 'Outro alimento'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              className={`variant__opt ${mode === id ? 'variant__opt--on' : ''}`}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {open && mode === 'dieta' ? (
        <FromDietForm
          onCancel={() => setOpen(false)}
          onAdd={(entry) => {
            add(date, entry);
            setOpen(false);
          }}
        />
      ) : open ? (
        <form className="stack-sm" onSubmit={submit}>
          <label className="field">
            <span className="field__label">O que comi</span>
            <textarea
              className="input offplan__textarea"
              rows={2}
              placeholder="Ex.: 2 fatias de pizza de calabresa e 1 lata de Coca"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            <span className="field__label">Calorias (kcal)</span>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="Ex.: 650"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
            />
          </label>
          <div className="row">
            <button type="button" className="btn-sm btn-sm--outline" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-sm btn-sm--dark" disabled={!valid}>
              Adicionar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn-sm btn-sm--outline offplan__add"
          onClick={() => {
            setMode('dieta');
            setOpen(true);
          }}
        >
          + Registrar refeição fora da dieta
        </button>
      )}
    </section>
  );
}

/** Resumo do dia: plano + fora da dieta, comparado com a meta. */
function TotalCard() {
  const date = toDateKey();
  const plan = useDietStore((s) => s.plan);
  const mealsDone = useDayStore((s) => s.mealsDone[date] ?? NONE);
  const variants = useDayStore((s) => s.variants[date] ?? NO_MAP);
  const swaps = useDayStore((s) => (s.swaps[date] ?? NO_MAP) as Record<string, Food>);
  const amounts = useDayStore((s) => s.amounts[date] ?? NO_MAP);
  const offPlan = useDayStore((s) => s.offPlan[date] ?? NO_ENTRIES);

  const c = useMemo(
    () => dayCalories({ meals: plan.meals, mealsDone, variants, swaps, amounts, offPlan }),
    [plan.meals, mealsDone, variants, swaps, amounts, offPlan],
  );
  const goal = kcalGoal(plan);
  const left = goal !== undefined ? goal - c.total : undefined;

  return (
    <section className="card card--dark kcal" aria-labelledby="kcal-title">
      <p id="kcal-title" className="eyebrow eyebrow--lime">
        Calorias de hoje
      </p>
      <p className="kcal__total">
        {formatKcal(c.total)}
        {goal !== undefined && <span className="kcal__goal"> de {formatKcal(goal)}</span>}
      </p>
      {goal !== undefined && (
        <div className="kcal__bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={c.total} aria-label="Calorias da meta">
          <span className={c.total > goal ? 'kcal__fill kcal__fill--over' : 'kcal__fill'} style={{ width: `${Math.min(100, (c.total / goal) * 100)}%` }} />
        </div>
      )}
      <dl className="kcal__parts">
        <div>
          <dt>Plano</dt>
          <dd>{formatKcal(c.plan)}</dd>
        </div>
        <div>
          <dt>Fora da dieta</dt>
          <dd>{formatKcal(c.offPlan)}</dd>
        </div>
        {left !== undefined && (
          <div>
            <dt>{left >= 0 ? 'Faltam' : 'Passou'}</dt>
            <dd>{formatKcal(Math.abs(left))}</dd>
          </div>
        )}
      </dl>
      <p className="kcal__note">
        Conta as refeições marcadas como feitas e os itens em que você digitou a quantidade. Valores aproximados.
        {c.unknown.length > 0 && ` Sem calorias cadastradas: ${[...new Set(c.unknown)].join(', ').toLowerCase()}.`}
      </p>
    </section>
  );
}

export function DayCalories() {
  return (
    <>
      <OffPlanCard />
      <TotalCard />
    </>
  );
}
