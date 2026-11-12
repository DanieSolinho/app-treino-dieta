import { useMemo, useState } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { monthGrid, plannedFor, shortName } from '../../lib/schedule';
import { toDateKey } from '../../lib/date';

const WEEK_HEAD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const monthTitle = (y: number, m: number) => {
  const t = new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const dayTitle = (d: Date) => {
  const t = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

interface Props {
  onDone: () => void;
}

/**
 * Agenda por data: toque no dia e escolha a ficha (ou mais de uma, para "D ou E"), descanso,
 * ou "Sem agenda" — aí vale o dia da semana marcado em cada ficha.
 */
export function ScheduleEditor({ onDone }: Props) {
  const workouts = useWorkoutStore((s) => s.workouts);
  const schedule = useWorkoutStore((s) => s.schedule);
  const setDay = useWorkoutStore((s) => s.setScheduleDay);

  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<Date>(today);
  const weeks = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);

  const key = toDateKey(selected);
  const ids = schedule[key];
  const plan = plannedFor(selected, workouts, schedule);

  const move = (delta: number) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const toggle = (id: string) => {
    const current = ids ?? [];
    setDay(key, current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  /** Pula para o dia seguinte (agiliza marcar vários dias em sequência). */
  const next = () => {
    const d = new Date(selected);
    d.setDate(d.getDate() + 1);
    setSelected(d);
    if (d.getMonth() !== cursor.m) setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <main className="page">
      <header className="page__header">
        <button type="button" className="link-btn link-btn--lg" onClick={onDone}>
          Voltar
        </button>
        <h1 className="page__title page__title--sm">Agenda</h1>
        <span className="agenda__spacer" aria-hidden="true" />
      </header>

      <section className="card agenda" aria-label={monthTitle(cursor.y, cursor.m)}>
        <div className="agenda__month">
          <button type="button" className="icon-btn" aria-label="Mês anterior" onClick={() => move(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <h2 className="card__title">{monthTitle(cursor.y, cursor.m)}</h2>
          <button type="button" className="icon-btn" aria-label="Próximo mês" onClick={() => move(1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="agenda__grid" role="grid">
          <div className="agenda__row" role="row">
            {WEEK_HEAD.map((d, i) => (
              <span key={i} className="agenda__head" role="columnheader">
                {d}
              </span>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="agenda__row" role="row">
              {week.map((date, di) => {
                if (!date) return <span key={di} className="agenda__cell agenda__cell--empty" role="gridcell" />;
                const k = toDateKey(date);
                const p = plannedFor(date, workouts, schedule);
                const label = p.workouts.length ? p.workouts.map((w) => shortName(w.name)).join('/') : p.fromSchedule ? 'off' : '';
                const cls = [
                  'agenda__cell',
                  k === key && 'agenda__cell--selected',
                  k === toDateKey(today) && 'agenda__cell--today',
                  !p.fromSchedule && 'agenda__cell--weekly',
                  p.fromSchedule && !p.workouts.length && 'agenda__cell--rest',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <button
                    key={di}
                    type="button"
                    role="gridcell"
                    className={cls}
                    aria-selected={k === key}
                    aria-label={`${dayTitle(date)}: ${p.workouts.length ? p.workouts.map((w) => w.name).join(' ou ') : p.fromSchedule ? 'descanso' : 'sem agenda'}`}
                    onClick={() => setSelected(date)}
                  >
                    <span className="agenda__date">{date.getDate()}</span>
                    <span className="agenda__label">{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="muted agenda__legend">Letras claras: sem agenda nesse dia, vale o dia da semana da ficha.</p>
      </section>

      <section className="card stack-sm" aria-labelledby="day-title">
        <h2 id="day-title" className="card__title">
          {dayTitle(selected)}
        </h2>
        <p className="muted">
          {ids === undefined
            ? plan.workouts.length
              ? `Sem agenda: vale o dia da semana (${plan.workouts.map((w) => shortName(w.name)).join(' ou ')}).`
              : 'Sem agenda e nenhuma ficha marcada para este dia da semana.'
            : ids.length === 0
              ? 'Descanso.'
              : ids.length > 1
                ? 'Você escolhe uma das fichas no dia.'
                : 'Ficha do dia.'}
        </p>

        <div className="agenda__options" role="group" aria-label="Fichas do dia">
          {workouts.map((w) => {
            const on = ids?.includes(w.id) ?? false;
            return (
              <button key={w.id} type="button" className={`agenda__option ${on ? 'agenda__option--on' : ''}`} aria-pressed={on} onClick={() => toggle(w.id)}>
                {w.name}
              </button>
            );
          })}
          <button
            type="button"
            className={`agenda__option ${ids?.length === 0 ? 'agenda__option--on' : ''}`}
            aria-pressed={ids?.length === 0}
            onClick={() => setDay(key, [])}
          >
            Descanso
          </button>
        </div>

        <div className="workout__actions">
          <button type="button" className="btn-sm btn-sm--outline" disabled={ids === undefined} onClick={() => setDay(key, null)}>
            Limpar dia
          </button>
          <button type="button" className="btn-sm btn-sm--dark" onClick={next}>
            Próximo dia
          </button>
        </div>
      </section>
    </main>
  );
}
