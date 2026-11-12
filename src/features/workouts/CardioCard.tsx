import { useEffect, useState } from 'react';
import { machineLabel, type CardioBlock, type CardioMachine } from '../../types/workout';
import { MachinePicker, lastMachine, rememberMachine } from './MachinePicker';
import { mmss, useCountdown } from '../../hooks/useCountdown';

interface Props {
  block: CardioBlock;
  onDone: (minutes: number, machine: CardioMachine) => void; // 0 = pulou
  onStart?: () => void;
}

/** Bloco de cardio opcional do treino híbrido, com timer próprio. */
export function CardioCard({ block, onDone, onStart }: Props) {
  const timer = useCountdown();
  const [started, setStarted] = useState(false);
  const [machine, setMachine] = useState<CardioMachine>(lastMachine);
  const total = block.minutes * 60;

  // terminou o tempo: registra os minutos completos
  useEffect(() => {
    if (started && !timer.running) onDone(block.minutes, machine);
  }, [started, timer.running]); // eslint-disable-line react-hooks/exhaustive-deps

  const elapsedMinutes = Math.max(1, Math.round((total - timer.remaining) / 60));

  return (
    <section className={`cardio cardio--${block.intensity}`} aria-labelledby="cardio-title">
      <p className="cardio__eyebrow">Cardio opcional · treino híbrido</p>
      <h2 id="cardio-title" className="cardio__title">
        {block.minutes} min {block.intensity === 'intenso' ? 'intensos' : 'moderados'}
      </h2>
      <p className="cardio__text">
        {started ? `${machineLabel(machine)} · ` : block.activity ? `${block.activity} · ` : ''}
        {block.intensity === 'intenso' ? 'ritmo forte, difícil de conversar' : 'ritmo confortável, dá para conversar'}
      </p>
      {!started && <MachinePicker value={machine} onChange={setMachine} dark />}

      {started ? (
        <>
          <p className="cardio__time" role="timer" aria-label="Tempo restante de cardio">
            {mmss(timer.remaining)}
          </p>
          <button type="button" className="btn btn--lime" onClick={() => { timer.stop(); onDone(elapsedMinutes, machine); }}>
            Terminar agora
          </button>
        </>
      ) : (
        <div className="cardio__actions">
          <button type="button" className="btn btn--lime" onClick={() => { onStart?.(); rememberMachine(machine); timer.start(total); setStarted(true); }}>
            Começar {block.minutes} min
          </button>
          <button type="button" className="btn btn--outline-light" onClick={() => onDone(0, machine)}>
            Pular cardio
          </button>
        </div>
      )}
    </section>
  );
}
