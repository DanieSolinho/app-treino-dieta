import { useEffect, useRef, useState } from 'react';
import type { Food, MealItem } from '../../types/diet';
import { useDietStore } from '../../stores/useDietStore';
import { useDayStore } from '../../stores/useDayStore';
import { formatAmount, formatPortions, sameFood, substitutesFor } from '../../lib/food';
import { toDateKey } from '../../lib/date';
import { ScanLabel } from './ScanLabel';

interface Props {
  item: MealItem | null;
  mealName: string;
  onClose: () => void;
}

function Option({ food, checked, tag, onPick }: { food: Food; checked: boolean; tag?: string; onPick: () => void }) {
  return (
    <label className={`option ${checked ? 'option--checked' : ''}`}>
      <input type="radio" name="troca" checked={checked} onChange={onPick} />
      <span className="option__text">
        <span className="option__name">
          {food.name}
          {tag && <span className="muted"> · {tag}</span>}
        </span>
        <span className="option__amount">{formatAmount(food)}</span>
      </span>
    </label>
  );
}

export function SubstitutionSheet({ item, mealName, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const groups = useDietStore((s) => s.plan.groups);
  const date = toDateKey();
  const current = useDayStore((s) => (item ? s.swaps[date]?.[item.id] : undefined));
  const swap = useDayStore((s) => s.swap);
  const undoSwap = useDayStore((s) => s.undoSwap);
  const [selected, setSelected] = useState<Food | null>(null);

  // abre/fecha o <dialog> nativo (foco e tecla Esc já vêm de graça)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (item && !dialog.open) {
      setSelected(current ?? item.food);
      dialog.showModal();
    }
    if (!item && dialog.open) dialog.close();
  }, [item, current]);

  if (!item) return <dialog ref={dialogRef} className="sheet" />;

  const { fromMeal, fromGroup, group, portions } = substitutesFor(item, groups);
  const isChecked = (food: Food) => (selected ? sameFood(selected, food) : false);

  function confirm() {
    if (!item || !selected) return;
    if (sameFood(selected, item.food)) undoSwap(date, item.id);
    else swap(date, item.id, selected);
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="sheet__body">
        <div className="sheet__handle" aria-hidden="true" />
        <header className="sheet__header">
          <div>
            <p className="eyebrow">{mealName}</p>
            <h2 id="sheet-title" className="sheet__title">
              Trocar {item.food.name.toLowerCase()}
            </h2>
            <p className="muted">Equivalentes do seu plano alimentar</p>
          </div>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="sheet__scroll">
          <fieldset className="options">
            <legend className="sr-only">Escolha um equivalente</legend>
            <Option food={item.food} checked={isChecked(item.food)} tag="original" onPick={() => setSelected(item.food)} />
            {fromMeal.map((food) => (
              <Option key={`m-${food.name}`} food={food} checked={isChecked(food)} onPick={() => setSelected(food)} />
            ))}

            {group && fromGroup.length > 0 && (
              <p className="options__divider">
                Ou {formatPortions(portions ?? 1)} do {group.name.toLowerCase()}
              </p>
            )}
            {fromGroup.map((food) => (
              <Option key={`g-${food.name}`} food={food} checked={isChecked(food)} onPick={() => setSelected(food)} />
            ))}
          </fieldset>

          <ScanLabel
            key={item.id}
            item={item}
            groupName={group?.name}
            onUse={(food) => {
              swap(date, item.id, food);
              onClose();
            }}
          />
        </div>

        <p className="note">A troca vale só para hoje. Seu plano continua igual.</p>

        <button type="button" className="btn btn--dark" onClick={confirm}>
          Confirmar troca
        </button>
      </div>
    </dialog>
  );
}
