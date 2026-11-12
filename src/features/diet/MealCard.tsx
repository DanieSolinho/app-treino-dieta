import type { Meal, MealItem } from '../../types/diet';
import { useDayStore, useFoodForDay } from '../../stores/useDayStore';
import { formatAmount, hasSubstitutes } from '../../lib/food';
import { toDateKey } from '../../lib/date';

interface Props {
  meal: Meal;
  done: boolean;
  onToggle: () => void;
  onSwap: (item: MealItem) => void;
}

function MealItemRow({ item, onSwap }: { item: MealItem; onSwap: (item: MealItem) => void }) {
  const { food, isSwapped } = useFoodForDay(item);
  const undoSwap = useDayStore((s) => s.undoSwap);

  return (
    <li className="item">
      <div className="item__text">
        <span className={isSwapped ? 'item__name item__name--swapped' : 'item__name'}>{food.name}</span>
        <span className="item__amount">{formatAmount(food)}</span>
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
