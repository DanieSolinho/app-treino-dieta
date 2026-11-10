import { useEffect, useRef, useState } from 'react';
import type { Food, MealItem } from '../../types/diet';
import { useDietStore } from '../../stores/useDietStore';
import { useDayStore } from '../../stores/useDayStore';
import { formatAmount, sameFood } from '../../lib/food';
import { toDateKey } from '../../lib/date';

interface Props {
  item: MealItem | null;
  mealName: string;
  onClose: () => void;
}

export function SubstitutionSheet({ item, mealName, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const getGroup = useDietStore((s) => s.getGroup);
  const date = toDateKey();
  const current = useDayStore((s) => (item ? s.swaps[date]?.[item.id] : undefined));
  const swap = useDayStore((s) => s.swap);
  const undoSwap = useDayStore((s) => s.undoSwap);

  const group = item?.groupId ? getGroup(item.groupId) : undefined;
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

  // o original sempre aparece primeiro, mesmo se não estiver na lista do grupo
  const options = group
    ? [item.food, ...group.options.filter((o) => !sameFood(o, item.food) && o.name !== item.food.name)]
    : [item.food];

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
            <p className="eyebrow">
              {mealName} · {group?.name ?? 'Sem grupo'}
            </p>
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

        <fieldset className="options">
          <legend className="sr-only">Escolha um equivalente</legend>
          {options.map((food, i) => {
            const checked = selected ? sameFood(selected, food) : false;
            return (
              <label key={`${food.name}-${i}`} className={`option ${checked ? 'option--checked' : ''}`}>
                <input type="radio" name="troca" checked={checked} onChange={() => setSelected(food)} />
                <span className="option__name">
                  {food.name}
                  {i === 0 && <span className="muted"> · original</span>}
                </span>
                <span className="option__amount">{formatAmount(food)}</span>
              </label>
            );
          })}
        </fieldset>

        <p className="note">A troca vale só para hoje. Seu plano continua igual.</p>

        <button type="button" className="btn btn--dark" onClick={confirm}>
          Confirmar troca
        </button>
      </div>
    </dialog>
  );
}
