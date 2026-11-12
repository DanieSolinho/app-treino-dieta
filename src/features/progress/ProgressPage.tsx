import { useMemo, useState } from 'react';
import { useBodyStore } from '../../stores/useBodyStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { LineChart } from '../../components/ui/LineChart';
import { change, exerciseHistory, formatShortDate, measureSeries, personalRecords, weightSeries } from '../../lib/progress';
import { formatKg } from '../../lib/loadSuggestion';
import { measureLabels, type MeasureKey } from '../../types/body';
import { NewEntryDialog } from './NewEntryDialog';
import { BadgesTab } from './BadgesTab';

type Tab = 'peso' | 'medidas' | 'cargas' | 'medalhas';
const tabs: { id: Tab; label: string }[] = [
  { id: 'peso', label: 'Peso' },
  { id: 'medidas', label: 'Medidas' },
  { id: 'cargas', label: 'Cargas' },
  { id: 'medalhas', label: 'Medalhas' },
];

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const weeksBetween = (a: string, b: string) => {
  const days = Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  if (days < 14) return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  return `${Math.round(days / 7)} semanas`;
};
const signed = (n: number, unit: string) => `${n > 0 ? '+' : ''}${fmt(n)} ${unit}`;

function WeightTab() {
  const entries = useBodyStore((s) => s.entries);
  const series = useMemo(() => weightSeries(entries), [entries]);
  const diff = change(series);
  const current = series.at(-1);

  return (
    <section className="card stack-sm" aria-labelledby="weight-title">
      <div className="summary-row">
        <div>
          <h2 id="weight-title" className="muted">Peso atual</h2>
          <p className="big-number">{current ? `${fmt(current.value)} kg` : '—'}</p>
        </div>
        {diff !== null && (
          <span className="pill pill--soft">
            {signed(diff, 'kg')} desde {formatShortDate(series[0].date)}
          </span>
        )}
      </div>
      <LineChart points={series} unit="kg" label={`Evolução do peso, ${series.length} registros`} />
    </section>
  );
}

function MeasuresTab() {
  const entries = useBodyStore((s) => s.entries);
  const deleteEntry = useBodyStore((s) => s.deleteEntry);
  const [key, setKey] = useState<MeasureKey>('cintura');
  const series = useMemo(() => measureSeries(entries, key), [entries, key]);
  const diff = change(series);

  return (
    <>
      <section className="card stack-sm">
        <div className="chips chips--light" role="radiogroup" aria-label="Medida">
          {(Object.keys(measureLabels) as MeasureKey[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={key === k} className={`chip ${key === k ? 'chip--on' : ''}`} onClick={() => setKey(k)}>
              {measureLabels[k]}
            </button>
          ))}
        </div>
        {diff !== null && <p className="muted">{signed(diff, 'cm')} desde o primeiro registro</p>}
        <LineChart points={series} unit="cm" label={`Evolução de ${measureLabels[key].toLowerCase()}`} color="var(--water)" />
      </section>

      {entries.length > 0 && (
        <section className="card" aria-label="Histórico de registros">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Peso</th>
                  {(Object.keys(measureLabels) as MeasureKey[]).map((k) => (
                    <th key={k} scope="col">{measureLabels[k]}</th>
                  ))}
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((e) => (
                  <tr key={e.id}>
                    <td>{formatShortDate(e.date)}</td>
                    <td>{e.weightKg !== undefined ? fmt(e.weightKg) : '—'}</td>
                    {(Object.keys(measureLabels) as MeasureKey[]).map((k) => (
                      <td key={k}>{e.measures?.[k] !== undefined ? fmt(e.measures[k]!) : '—'}</td>
                    ))}
                    <td>
                      <button type="button" className="table__delete" aria-label={`Apagar registro de ${formatShortDate(e.date)}`} onClick={() => deleteEntry(e.id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function LoadsTab() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const sessions = useWorkoutStore((s) => s.sessions);
  const exercises = useMemo(() => workouts.flatMap((w) => w.exercises), [workouts]);
  const records = useMemo(() => personalRecords(sessions, exercises.map((e) => e.id)), [sessions, exercises]);
  const withHistory = exercises.filter((e) => sessions.some((s) => s.logs[e.id]?.length));
  const [selected, setSelected] = useState(withHistory[0]?.id ?? '');
  const series = useMemo(() => exerciseHistory(sessions, selected), [sessions, selected]);
  const name = (id: string) => exercises.find((e) => e.id === id)?.name ?? 'Exercício';

  if (withHistory.length === 0) {
    return (
      <section className="card">
        <p className="muted">Finalize um treino para ver a evolução das suas cargas aqui.</p>
      </section>
    );
  }

  return (
    <>
      {records.length > 0 && (
        <section className="card card--dark" aria-labelledby="records-title">
          <h2 id="records-title" className="card__title">Recordes</h2>
          <ul className="next-list">
            {records.slice(0, 5).map((r) => (
              <li key={r.exerciseId} className="next-list__row">
                <span className="next-list__name">
                  {name(r.exerciseId)}
                  <br />
                  <small className="muted-dark">
                    {formatKg(r.first)} → {formatKg(r.best)}
                  </small>
                </span>
                <span className="badge">+{fmt(r.best - r.first)} kg</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card stack-sm">
        <label className="field">
          <span className="field__label">Exercício</span>
          <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {withHistory.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        {series.length > 1 && (
          <p className="muted" role="status">
            {formatKg(series[0].value)} → {formatKg(series.at(-1)!.value)}
            {change(series) ? ` (${signed(change(series)!, 'kg')})` : ''} em {weeksBetween(series[0].date, series.at(-1)!.date)}
          </p>
        )}
        <LineChart points={series} unit="kg" label={`Maior carga por treino em ${name(selected)}`} />
      </section>
    </>
  );
}

export function ProgressPage() {
  const [tab, setTab] = useState<Tab>('peso');
  const [adding, setAdding] = useState(false);

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Progresso</h1>
        <button type="button" className="icon-btn icon-btn--dark" aria-label="Novo registro de peso e medidas" onClick={() => setAdding(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      <div className="segmented" role="tablist" aria-label="Tipo de progresso">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`segmented__item ${tab === t.id ? 'segmented__item--on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'peso' && <WeightTab />}
      {tab === 'medidas' && <MeasuresTab />}
      {tab === 'cargas' && <LoadsTab />}
      {tab === 'medalhas' && <BadgesTab />}

      <NewEntryDialog open={adding} onClose={() => setAdding(false)} />
    </main>
  );
}
