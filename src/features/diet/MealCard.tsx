import { useEffect, useState } from 'react';
import type { Food, Meal, MealItem } from '../../types/diet';
import { useDayStore, useFoodForDay } from '../../stores/useDayStore';
import { formatAmount, hasSubstitutes } from '../../lib/food';
import { formatKcal, kcalFor } from '../../lib/calories';
import { toDateKey } from '../../lib/date';

interface Props {
  meal: Meal;
  done: boolean;
  onToggle: () => void;
  onSwap: (item: MealItem) => void;
}

/** Campo "quanto comi": vazio = a quantidade do plano (aparece como dica). */
function AmountInput({ itemId, food }: { itemId: string; food: Food }) {
  const date = toDateKey();
  const typed = useDayStore((s) => s.amounts[date]?.[itemId]);
  const setAmount = useDayStore((s) => s.setAmount);
  const [text, setText] = useState(typed === undefined ? '' : String(typed).replace('.', ','));

  // a troca de alimento zera a quantidade no store: o campo acompanha
  useEffect(() => {
    if (typed === undefined) setText('');
  }, [typed]);

  const unit = food.unit ?? 'g';
  const kcal = kcalFor(food, typed ?? food.grams);

  function change(value: string) {
    setText(value);
    const n = Number(value.replace(',', '.'));
    if (value.trim() === '') setAmount(date, itemId, null);
    else if (Number.isFinite(n) && n >= 0) setAmount(date, itemId, n);
  }

  return (
    <span className="amount">
      <input
        className="amount__input"
        type="text"
        inputMode="decimal"
        placeholder={food.grams !== undefined ? String(food.grams) : ''}
        value={text}
        aria-label={`Quanto comi de ${food.name.toLowerCase()}, em ${unit}`}
        onChange={(e) => change(e.target.value)}
      />
      <span className="amount__unit">{unit}</span>
      {kcal !== undefined && <span className={typed === undefined ? 'amount__kcal' : 'amount__kcal amount__kcal--typed'}>{formatKcal(kcal)}</span>}
    </span>
  );
}

function MealItemRow({ item, onSwap }: { item: MealItem; onSwap: (item: MealItem) => void }) {
  const { food, isSwapped } = useFoodForDay(item);
  const undoSwap = useDayStore((s) => s.undoSwap);
  const measurable = food.grams !== undefined;

  return (
    <li className="item">
      <div className="item__text">
        <span className={isSwapped ? 'item__name item__name--swapped' : 'item__name'}>{food.name}</span>
        <span className="item__amount">{formatAmount(food)}</span>
        {measurable && <AmountInput key={food.name} itemId={item.id} food={food} />}
        {isSwapped && (
          <span className="item__swap-info">
            no lugar de {item.food.name.toLowerCase()} ·{' '}
            <button type="button" className="link-btn" onClick={() => undoSwap(toDateKey(), item.id)}>
              desfazer
            </button>
          </span>
        )}
      </div>
      {hasSubstitutes(item) && (
        <button type="button" className="swap-btn" aria-label={`Trocar ${food.name}`} onClick={() => onSwap(item)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
          </svg>
        </button>
      )}
    </li>
  );
}

/** Itens da versão escolhida para o dia (ex.: almoço "Sem feijão"). */
export function useMealItems(meal: Meal) {
  const date = toDateKey();
  const variantId = useDayStore((s) => s.variants[date]?.[meal.id]);
  const variant = meal.variants?.find((v) => v.id === variantId);
  return { items: variant?.items ?? meal.items, variantId: variant?.id ?? null };
}

export function MealCard({ meal, done, onToggle, onSwap }: Props) {
  const { items, variantId } = useMealItems(meal);
  const chooseVariant = useDayStore((s) => s.chooseVariant);
  const date = toDateKey();

  return (
    <article className={`card meal ${done ? 'meal--done' : ''}`}>
      <header className="meal__header">
        <label className="meal__check">
          <input type="checkbox" checked={done} onChange={onToggle} />
          <span className="meal__name">{meal.name}</span>
        </label>
        {meal.time && <span className="muted">{meal.time}</span>}
      </header>

      {meal.variants?.length ? (
        <div className="variant" role="radiogroup" aria-label={`Versão do ${meal.name.toLowerCase()}`}>
          {[{ id: null, label: meal.defaultLabel ?? 'Principal' }, ...meal.variants].map((v) => (
            <button
              key={v.id ?? 'principal'}
              type="button"
              role="radio"
              aria-checked={variantId === v.id}
              className={`variant__opt ${variantId === v.id ? 'variant__opt--on' : ''}`}
              onClick={() => chooseVariant(date, meal.id, v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="items">
        {items.map((item) => (
          <MealItemRow key={item.id} item={item} onSwap={onSwap} />
        ))}
      </ul>
    </article>
  );
}
