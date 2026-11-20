import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { lastScheduledDate } from '../../lib/schedule';
import { toDateKey } from '../../lib/date';

/** Dias de antecedência para avisar que a agenda de treinos está acabando. */
export const PLAN_ENDING_DAYS = 10;

/** Quantos dias faltam para a agenda acabar (0 = acaba hoje), ou undefined se não há agenda ou falta muito. */
export function daysUntilEnd(last: string | undefined, today = new Date()): number | undefined {
  if (!last) return undefined;
  const days = Math.round((Date.parse(`${last}T12:00:00`) - Date.parse(`${toDateKey(today)}T12:00:00`)) / 864e5);
  return days >= 0 && days <= PLAN_ENDING_DAYS ? days : undefined;
}

/** "Seu plano de treino termina em…": hora de pedir a próxima ficha ao personal. */
export function PlanEndingNotice() {
  const schedule = useWorkoutStore((s) => s.schedule);
  const last = lastScheduledDate(schedule);
  const days = daysUntilEnd(last);
  if (days === undefined || !last) return null;
  const when = new Date(`${last}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  return (
    <section className="card plan-ending" aria-labelledby="plan-ending-title">
      <h2 id="plan-ending-title" className="card__title">
        {days === 0 ? 'Seu plano de treino termina hoje' : `Seu plano de treino termina em ${days} ${days === 1 ? 'dia' : 'dias'}`}
      </h2>
      <p className="muted">
        A agenda vai até {when}. Peça a próxima ficha ao seu personal e importe em Ajustes › Plano. Se for repetir as mesmas fichas, marque os
        próximos dias em Treinos › Editar agenda.
      </p>
    </section>
  );
}
