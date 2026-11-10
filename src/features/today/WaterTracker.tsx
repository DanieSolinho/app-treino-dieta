import { ProgressRing } from '../../components/ui/ProgressRing';
import { useDayStore, waterTotal } from '../../stores/useDayStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { toDateKey } from '../../lib/date';

const liters = (ml: number) => (ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export function WaterTracker() {
  const date = toDateKey();
  const total = useDayStore((s) => waterTotal(s.waterLog[date]));
  const hasEntries = useDayStore((s) => (s.waterLog[date]?.length ?? 0) > 0);
  const addWater = useDayStore((s) => s.addWater);
  const undoWater = useDayStore((s) => s.undoWater);
  const goal = useSettingsStore((s) => s.waterGoalMl);

  const reached = total >= goal;
  const missing = Math.max(goal - total, 0);

  return (
    <section className="card water" aria-labelledby="water-title">
      <ProgressRing value={total} max={goal} label={`${liters(total)} de ${liters(goal)} litros`}>
        <span className="water__value">{liters(total)} L</span>
        <span className="water__goal">de {liters(goal)} L</span>
      </ProgressRing>

      <div className="water__side">
        <div>
          <h2 id="water-title" className="card__title">Água</h2>
          <p className="muted" aria-live="polite">
            {reached ? 'Meta batida hoje!' : `Faltam ${liters(missing)} L`}
          </p>
        </div>
        <div className="water__buttons">
          <button type="button" className="btn-sm btn-sm--soft" onClick={() => addWater(date, 250)}>
            +250 ml
          </button>
          <button type="button" className="btn-sm btn-sm--water" onClick={() => addWater(date, 500)}>
            +500 ml
          </button>
        </div>
        {hasEntries && (
          <button type="button" className="link-btn" onClick={() => undoWater(date)}>
            Desfazer último
          </button>
        )}
      </div>
    </section>
  );
}
