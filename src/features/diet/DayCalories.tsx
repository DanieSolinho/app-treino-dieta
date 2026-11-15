import { useMemo, useState, type FormEvent } from 'react';
import type { Food, OffPlanEntry } from '../../types/diet';
import { useDietStore } from '../../stores/useDietStore';
import { useDayStore } from '../../stores/useDayStore';
import { dayCalories, formatKcal, kcalGoal } from '../../lib/calories';
import { toDateKey } from '../../lib/date';

// Referências fixas: objetos novos a cada render fazem o Zustand 5 entrar em loop
const NONE: string[] = [];
const NO_MAP: Record<string, never> = {};
const NO_ENTRIES: OffPlanEntry[] = [];

/** "Fora da dieta": o que comi + calorias (pesquisadas por você). */
function OffPlanCard() {
  const date = toDateKey();
  const entries = useDayStore((s) => s.offPlan[date] ?? NO_ENTRIES);
  const add = useDayStore((s) => s.addOffPlan);
  const remove = useDayStore((s) => s.removeOffPlan);
  const [open, setOpen] = useState(false);
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

      {open ? (
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
        <button type="button" className="btn-sm btn-sm--outline offplan__add" onClick={() => setOpen(true)}>
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
