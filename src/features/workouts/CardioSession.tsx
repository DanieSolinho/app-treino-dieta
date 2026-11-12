import { useEffect, useState } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { machineLabel, type CardioMachine } from '../../types/workout';
import { mmss, useCountdown } from '../../hooks/useCountdown';
import { NumberStepper } from '../../components/ui/NumberStepper';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { cardioMinutesBetween } from '../../lib/cardio';
import { lastWeekRange } from '../../lib/achievements';
import { toDateKey } from '../../lib/date';
import { MachineIcon, MachinePicker, lastMachine, rememberMachine } from './MachinePicker';

type Step = { kind: 'setup' } | { kind: 'running' } | { kind: 'done'; minutes: number };

/** Cardio avulso: escolhe o aparelho e o tempo, usa o cronômetro ou só registra o que já fez. */
export function CardioSession({ onClose }: { onClose: () => void }) {
  const save = useWorkoutStore((s) => s.logStandaloneCardio);
  const sessions = useWorkoutStore((s) => s.sessions);
  const [machine, setMachine] = useState<CardioMachine>(lastMachine);
  const [minutes, setMinutes] = useState(20);
  const [step, setStep] = useState<Step>({ kind: 'setup' });
  const timer = useCountdown();
  const total = minutes * 60;

  function finish(done: number) {
    if (done <= 0) return setStep({ kind: 'setup' });
    rememberMachine(machine);
    save(machine, done);
    setStep({ kind: 'done', minutes: done });
  }

  // o tempo acabou: registra os minutos completos
  useEffect(() => {
    if (step.kind === 'running' && !timer.running) finish(minutes);
  }, [timer.running]); // eslint-disable-line react-hooks/exhaustive-deps

  if (step.kind === 'done') {
    // semana atual: de segunda até hoje
    const monday = lastWeekRange(new Date()).to;
    monday.setDate(monday.getDate() + 1);
    const week = cardioMinutesBetween(sessions, toDateKey(monday), toDateKey(new Date()));
    return (
      <div className="active active--center">
        <main className="active__body stretch-done">
          <p className="eyebrow eyebrow--lime">Cardio feito</p>
          <h1 className="active__title">
            {step.minutes} min {machine === 'bike' || machine === 'esteira' ? 'na' : 'no'} {machineLabel(machine).toLowerCase()}
          </h1>
          <p className="active__meta">{week > step.minutes ? `Já são ${week} min de cardio nesta semana. Constância é isso.` : 'Primeiro cardio da semana. Bom começo!'}</p>
          <button type="button" className="btn btn--lime" onClick={onClose}>
            Voltar
          </button>
        </main>
      </div>
    );
  }

  if (step.kind === 'running') {
    const elapsed = Math.max(1, Math.round((total - timer.remaining) / 60));
    return (
      <div className="active active--center">
        <main className="active__body cardio-run">
          <p className="eyebrow eyebrow--lime cardio-run__machine">
            <MachineIcon machine={machine} size={18} /> {machineLabel(machine)}
          </p>
          <ProgressRing value={total - timer.remaining} max={total} size={220} stroke={14} color="var(--lime)" track="#2e3537" label={`${timer.remaining} segundos restantes`}>
            <span className="stretch__time" role="timer">
              {mmss(timer.remaining)}
            </span>
          </ProgressRing>
          <p className="active__meta">de {minutes} min</p>
          <button
            type="button"
            className="btn btn--lime"
            onClick={() => {
              timer.stop();
              finish(elapsed);
            }}
          >
            Terminar agora ({elapsed} min)
          </button>
          <button
            type="button"
            className="btn btn--outline-light"
            onClick={() => {
              timer.stop();
              setStep({ kind: 'setup' });
            }}
          >
            Cancelar
          </button>
        </main>
      </div>
    );
  }

  return (
    <main className="page">
      <header className="page__header">
        <button type="button" className="link-btn link-btn--lg" onClick={onClose}>
          Voltar
        </button>
        <h1 className="page__title page__title--sm">Cardio</h1>
        <span className="agenda__spacer" aria-hidden="true" />
      </header>

      <section className="card stack-sm" aria-label="Aparelho">
        <h2 className="card__title">Aparelho</h2>
        <MachinePicker value={machine} onChange={setMachine} />
      </section>

      <section className="card stack-sm" aria-label="Duração">
        <div className="light-stepper">
          <NumberStepper label="Duração" value={minutes} step={5} min={5} format={(n) => `${n} min`} onChange={setMinutes} />
        </div>
      </section>

      <button
        type="button"
        className="btn btn--dark"
        onClick={() => {
          rememberMachine(machine);
          timer.start(total);
          setStep({ kind: 'running' });
        }}
      >
        Começar {minutes} min
      </button>
      <button type="button" className="link-btn link-btn--lg" onClick={() => finish(minutes)}>
        Já fiz · só registrar {minutes} min
      </button>
    </main>
  );
}
