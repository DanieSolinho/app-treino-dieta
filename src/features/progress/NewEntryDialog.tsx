import { useEffect, useRef, useState } from 'react';
import { useBodyStore } from '../../stores/useBodyStore';
import { measureLabels, type MeasureKey } from '../../types/body';
import { toDateKey } from '../../lib/date';

interface Props {
  open: boolean;
  onClose: () => void;
}

const keys = Object.keys(measureLabels) as MeasureKey[];
const toNumber = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return s.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
};

export function NewEntryDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const saveEntry = useBodyStore((s) => s.saveEntry);
  const [date, setDate] = useState(toDateKey());
  const [weight, setWeight] = useState('');
  const [measures, setMeasures] = useState<Record<MeasureKey, string>>({ cintura: '', quadril: '', braco: '', coxa: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setDate(toDateKey());
      setWeight('');
      setMeasures({ cintura: '', quadril: '', braco: '', coxa: '' });
      setError('');
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  function save() {
    const weightKg = toNumber(weight);
    const parsed = Object.fromEntries(
      keys.map((k) => [k, toNumber(measures[k])]).filter(([, v]) => v !== undefined),
    ) as Partial<Record<MeasureKey, number>>;
    if (weightKg === undefined && Object.keys(parsed).length === 0) {
      setError('Preencha o peso ou pelo menos uma medida.');
      return;
    }
    saveEntry({ date, weightKg, measures: parsed });
    onClose();
  }

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="entry-title" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="sheet__body">
        <div className="sheet__handle" aria-hidden="true" />
        <header className="sheet__header">
          <h2 id="entry-title" className="sheet__title">Novo registro</h2>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="form-grid">
          <label className="field">
            <span className="field__label">Data</span>
            <input className="input" type="date" value={date} max={toDateKey()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Peso (kg)</span>
            <input className="input" inputMode="decimal" placeholder="Ex.: 68,4" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
        </div>

        <fieldset className="field">
          <legend className="field__label">Medidas (cm) — opcional</legend>
          <div className="form-grid">
            {keys.map((k) => (
              <label key={k} className="field field--sm">
                <span className="field__label">{measureLabels[k]}</span>
                <input
                  className="input"
                  inputMode="decimal"
                  value={measures[k]}
                  onChange={(e) => setMeasures((m) => ({ ...m, [k]: e.target.value }))}
                />
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className="btn btn--dark" onClick={save}>
          Salvar registro
        </button>
      </div>
    </dialog>
  );
}
