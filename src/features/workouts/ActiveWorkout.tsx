import { useEffect, useState } from 'react';
import type { Effort, Exercise, SetLog } from '../../types/workout';
import { effortLabel, previousLogs, useWorkoutStore } from '../../stores/useWorkoutStore';
import { NumberStepper } from '../../components/ui/NumberStepper';
import { formatKg, targetReps } from '../../lib/loadSuggestion';
import { useImage } from '../../services/images';
import { CardioCard } from './CardioCard';
import { StretchPlayer } from './StretchPlayer';
import { mmss, useCountdown } from '../../hooks/useCountdown';

const NO_SETS: SetLog[] = [];
const efforts: Effort[] = ['facil', 'ok', 'dificil'];

interface Props {
  onFinished: (sessionId: string) => void;
}

/** Texto de apoio: o que o app sabe sobre a última vez desse exercício. */
function lastTimeHint(ex: Exercise, previous?: SetLog[]) {
  if (ex.bodyweight) return null;
  const pyramid = ex.progression === 'piramide';
  const goal = pyramid
    ? `Meta da 1ª série: ${ex.repMax} reps sem marcar "difícil" para a carga subir.`
    : `Meta: ${ex.repMax} reps em todas as séries para a carga subir.`;
  if (!previous?.length) {
    return ex.currentLoad > 0
      ? `Primeira vez com essa ficha: comece com ${formatKg(ex.currentLoad)}. ${goal}`
      : `Primeira vez: escolha uma carga em que a 1ª série fique desafiadora. ${goal}`;
  }
  const prevLoad = previous[0].load;
  if (ex.currentLoad > prevLoad) return `Carga nova na 1ª série: ${formatKg(ex.currentLoad)} (antes ${formatKg(prevLoad)}). ${goal}`;
  if (ex.currentLoad < prevLoad) return `Carga ajustada para ${formatKg(ex.currentLoad)} para recuperar a faixa de reps.`;
  return `Última vez: 1ª série com ${formatKg(prevLoad)} e ${previous[0].reps} reps. ${goal}`;
}

function SetEntry({ ex, done, onLog }: { ex: Exercise; done: SetLog[]; onLog: (s: SetLog) => void }) {
  const last = done.at(-1);
  const target = ex.setTargets?.[done.length];
  const [load, setLoad] = useState(last?.load ?? ex.currentLoad);
  const [reps, setReps] = useState(targetReps(target) ?? last?.reps ?? ex.repMax);
  const [effort, setEffort] = useState<Effort>('ok');

  return (
    <div className="set-entry">
      <p className="set-entry__title">Série {done.length + 1} · agora</p>
      {target && <p className="set-entry__target">{target}</p>}
      <div className="set-entry__steppers">
        {!ex.bodyweight && (
          <NumberStepper label="Carga" value={load} step={ex.increment || 1} format={(n) => formatKg(n)} onChange={setLoad} />
        )}
        <NumberStepper label="Reps" value={reps} step={1} min={1} onChange={setReps} />
      </div>
      <div className="chips" role="radiogroup" aria-label="Esforço">
        {efforts.map((e) => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={effort === e}
            className={`chip ${effort === e ? 'chip--on' : ''}`}
            onClick={() => setEffort(e)}
          >
            {effortLabel[e]}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn--lime" onClick={() => onLog({ load, reps, effort })}>
        Concluir série
      </button>
    </div>
  );
}

export function ActiveWorkout({ onFinished }: Props) {
  const active = useWorkoutStore((s) => s.active);
  const workout = useWorkoutStore((s) => s.workouts.find((w) => w.id === s.active?.workoutId));
  const sessions = useWorkoutStore((s) => s.sessions);
  const { logSet, undoSet, cancelSession, finishSession, logCardio } = useWorkoutStore.getState();
  const rest = useCountdown();
  const stretchRoutines = useWorkoutStore((s) => s.stretches);

  // começa no primeiro exercício ainda incompleto
  const [index, setIndex] = useState(() =>
    Math.max(0, workout?.exercises.findIndex((e) => (active?.logs[e.id]?.length ?? 0) < e.sets) ?? 0),
  );
  const [elapsed, setElapsed] = useState(0);
  const [stretching, setStretching] = useState(false);

  useEffect(() => {
    if (!active) return;
    const started = Date.parse(active.startedAt);
    const tick = () => setElapsed(Math.floor((Date.now() - started) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active?.startedAt]);

  const ex = workout?.exercises[index];
  const done = (ex && active?.logs[ex.id]) || NO_SETS;

  // hooks antes de qualquer return
  const photo = useImage(ex?.image);
  const warmupPhoto = useImage(workout?.warmupImage);

  if (!active || !workout || !ex) return null;

  const stretch = stretchRoutines.find((r) => r.id === workout.stretchRoutineId);
  if (stretching && stretch) return <StretchPlayer routine={stretch} onClose={() => setStretching(false)} />;

  const nothingLogged = Object.values(active.logs).every((l) => l.length === 0);
  const showBefore = nothingLogged && index === 0 && Boolean(workout.warmup || stretch || workout.hybrid);
  const hint = lastTimeHint(ex, previousLogs(sessions, ex.id));
  const total = workout.exercises.length;
  const isLast = index === total - 1;
  const exerciseComplete = done.length >= ex.sets;
  const pendingCardio = exerciseComplete
    ? workout.cardio?.find((c) => c.afterExercise === index + 1 && active.cardio?.[c.afterExercise] === undefined)
    : undefined;
  const cardioTotal = workout.cardio?.length ?? 0;

  function log(set: SetLog) {
    logSet(ex!.id, set);
    if (done.length + 1 < ex!.sets || !isLast) rest.start(ex!.restSeconds);
  }

  function finish() {
    rest.stop();
    const session = finishSession();
    if (session) onFinished(session.id);
  }

  function cancel() {
    if (window.confirm('Sair sem salvar este treino?')) cancelSession();
  }

  return (
    <div className="active">
      <header className="active__header">
        <button type="button" className="icon-btn icon-btn--ghost" aria-label="Sair do treino" onClick={cancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="active__clock">
          <span className="active__workout">{workout.name}</span>
          <span className="active__time" aria-label="Tempo de treino">
            {mmss(elapsed)}
          </span>
        </div>
        <button type="button" className="link-btn link-btn--lime" onClick={finish}>
          Finalizar
        </button>
      </header>

      <div className="progress" aria-label={`Exercício ${index + 1} de ${total}`}>
        {workout.exercises.map((e, i) => {
          const complete = (active.logs[e.id]?.length ?? 0) >= e.sets;
          return (
            <button
              key={e.id}
              type="button"
              aria-label={`Ir para ${e.name}`}
              className={`progress__bar ${complete ? 'progress__bar--done' : ''} ${i === index ? 'progress__bar--current' : ''}`}
              onClick={() => setIndex(i)}
            />
          );
        })}
      </div>

      <main className="active__body">
        {showBefore && (
          <section className="before" aria-labelledby="before-title">
            <h2 id="before-title" className="before__title">Antes de começar</h2>
            {stretch && (
              <button type="button" className="before__stretch" onClick={() => setStretching(true)}>
                <span>
                  <strong>{stretch.name}</strong>
                  <br />
                  <small>{stretch.steps.length} movimentos · guiado</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            )}
            {workout.warmup && <p className="before__text">{workout.warmup}</p>}
            {warmupPhoto && <img className="photo" src={warmupPhoto} alt="Exemplo da ativação muscular" loading="lazy" />}
            {cardioTotal > 0 && (
              <p className="before__text before__text--muted">
                Hoje tem {cardioTotal} blocos de cardio opcional (esteira, bike, transport ou escada) entre os exercícios. O app avisa na hora.
              </p>
            )}
            {workout.hybrid && <p className="before__text before__text--muted">{workout.hybrid}</p>}
          </section>
        )}

        <div>
          <p className="eyebrow eyebrow--muted">
            Exercício {index + 1} de {total}
          </p>
          <h1 className="active__title">{ex.name}</h1>
          <p className="active__meta">
            {ex.sets} séries
            {ex.setTargets ? '' : ` · ${ex.repMin}–${ex.repMax} reps`} · descanso {ex.restSeconds} s
            {ex.notes ? ` · ${ex.notes}` : ''}
          </p>
        </div>

        {photo && <img className="photo" src={photo} alt={`Exemplo de execução: ${ex.name}`} loading="lazy" />}

        {hint && <p className="hint">{hint}</p>}

        <section className="sets" aria-label="Séries">
          {done.map((s, i) => (
            <div key={i} className="sets__row">
              <span>{i + 1}</span>
              <span>{ex.bodyweight ? 'sem carga' : formatKg(s.load)}</span>
              <span>
                {s.reps} reps · {s.effort ? effortLabel[s.effort] : '—'}
              </span>
              {i === done.length - 1 ? (
                <button type="button" className="link-btn link-btn--lime" onClick={() => undoSet(ex.id)}>
                  desfazer
                </button>
              ) : (
                <span className="sets__check" aria-label="Feita">
                  ✓
                </span>
              )}
            </div>
          ))}

          {!exerciseComplete && (
            <SetEntry key={`${ex.id}-${done.length}`} ex={ex} done={done} onLog={log} />
          )}
        </section>

        {pendingCardio && (
          <CardioCard
            key={pendingCardio.afterExercise}
            block={pendingCardio}
            onStart={rest.stop}
            onDone={(minutes, machine) => {
              rest.stop();
              logCardio(pendingCardio.afterExercise, minutes, machine);
            }}
          />
        )}

        {exerciseComplete && !pendingCardio && (
          <button
            type="button"
            className="btn btn--lime"
            onClick={() => (isLast ? finish() : setIndex(index + 1))}
          >
            {isLast ? 'Finalizar treino' : 'Próximo exercício'}
          </button>
        )}
      </main>

      {rest.running && (
        <div className="rest" role="timer" aria-live="off" aria-label="Descanso">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2.5 2M9 2h6" />
          </svg>
          <span className="rest__label">Descanso</span>
          <span className="rest__time">{mmss(rest.remaining)}</span>
          <button type="button" className="btn-sm btn-sm--ghost" onClick={() => rest.add(15)}>
            +15 s
          </button>
          <button type="button" className="btn-sm btn-sm--ghost" onClick={rest.stop}>
            Pular
          </button>
        </div>
      )}
    </div>
  );
}
