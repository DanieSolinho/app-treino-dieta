import { useEffect, useMemo, useState } from 'react';
import { expandSteps, type StretchRoutine } from '../../data/stretchRoutines';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { mmss } from '../../hooks/useCountdown';
import { useImage } from '../../services/images';

interface Props {
  routine: StretchRoutine;
  onClose: () => void;
}

/**
 * Player de alongamento.
 * - Posição com tempo: o app conta e avança sozinho.
 * - Movimento por repetições: mostra quantas fazer e espera você tocar em "Feito".
 */
export function StretchPlayer({ routine, onClose }: Props) {
  const steps = useMemo(() => expandSteps(routine), [routine]);
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(steps[0].seconds ?? 0);
  const [paused, setPaused] = useState(false);
  const finished = index >= steps.length;
  const step = steps[Math.min(index, steps.length - 1)];
  const photo = useImage(step.image);
  const timed = step.seconds !== undefined;

  useEffect(() => {
    if (paused || finished || !timed) return;
    const id = window.setInterval(() => setLeft((l) => l - 1), 1000);
    return () => window.clearInterval(id);
  }, [paused, finished, timed, index]);

  function goTo(i: number) {
    if (i >= steps.length) {
      setIndex(steps.length);
      return;
    }
    if (i < 0) return;
    setPaused(false);
    setIndex(i);
    setLeft(steps[i].seconds ?? 0);
  }

  useEffect(() => {
    if (!timed || left > 0 || finished) return;
    navigator.vibrate?.(150);
    goTo(index + 1);
  }, [left, timed, finished, index]); // eslint-disable-line react-hooks/exhaustive-deps

  if (finished) {
    return (
      <div className="active active--center">
        <main className="active__body stretch-done">
          <p className="eyebrow eyebrow--lime">Alongamento concluído</p>
          <h1 className="active__title">{routine.name}</h1>
          <p className="active__meta">{steps.length} movimentos. Bom trabalho!</p>
          <button type="button" className="btn btn--lime" onClick={onClose}>
            Voltar
          </button>
        </main>
      </div>
    );
  }

  const next = steps[index + 1];

  return (
    <div className="active">
      <header className="active__header">
        <button type="button" className="icon-btn icon-btn--ghost" aria-label="Sair do alongamento" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span className="active__workout">{routine.name}</span>
        <span className="active__workout">
          {index + 1}/{steps.length}
        </span>
      </header>

      <div className="progress" aria-hidden="true">
        {steps.map((_, i) => (
          <span key={i} className={`progress__bar ${i < index ? 'progress__bar--done' : ''} ${i === index ? 'progress__bar--current' : ''}`} />
        ))}
      </div>

      <main className={`active__body stretch ${photo ? 'stretch--photo' : ''}`}>
        {photo && <img className="photo photo--stretch" src={photo} alt={`Exemplo: ${step.name}`} />}
        <div className="stretch__ring">
          {timed ? (
            <ProgressRing value={step.seconds! - left} max={step.seconds!} size={photo ? 132 : 200} stroke={photo ? 10 : 14} color="var(--lime)" track="#2e3537" label={`${left} segundos restantes`}>
              <span className="stretch__time" role="timer">
                {mmss(left)}
              </span>
              {step.side && <span className="stretch__side">Lado {step.side.toLowerCase()}</span>}
            </ProgressRing>
          ) : (
            <div className="stretch__reps">
              <span className="stretch__reps-label">Faça</span>
              <span className="stretch__reps-value">{step.reps}</span>
            </div>
          )}
        </div>

        <div className="stretch__text">
          <h1 className="active__title">{step.name}</h1>
          {step.instruction && <p className="active__meta stretch__instruction">{step.instruction}</p>}
        </div>

        <div className="stretch__controls">
          <button type="button" className="icon-btn icon-btn--ghost" aria-label="Movimento anterior" disabled={index === 0} onClick={() => goTo(index - 1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          {timed ? (
            <button type="button" className="play-btn" aria-label={paused ? 'Continuar' : 'Pausar'} onClick={() => setPaused((p) => !p)}>
              {paused ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M9 5v14M15 5v14" /></svg>
              )}
            </button>
          ) : (
            <button type="button" className="play-btn" aria-label="Feito" onClick={() => goTo(index + 1)}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
            </button>
          )}
          <button type="button" className="icon-btn icon-btn--ghost" aria-label="Próximo movimento" onClick={() => goTo(index + 1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {next && (
          <p className="stretch__next">
            A seguir: {next.name}
            {next.side ? ` · ${next.side.toLowerCase()}` : ''}
          </p>
        )}
      </main>
    </div>
  );
}
