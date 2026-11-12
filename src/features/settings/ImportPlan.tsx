import { useRef, useState } from 'react';
import { useDietStore } from '../../stores/useDietStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useAuth } from '../../services/auth';
import { uploadPlanImages } from '../../services/images';
import { applyPlan, parsePlanFile, summarize, type CurrentPlan, type PlanFile, type PlanSummary } from '../../lib/planImport';

const currentPlan = (): CurrentPlan => {
  const w = useWorkoutStore.getState();
  return { diet: useDietStore.getState().plan, workouts: w.workouts, schedule: w.schedule, stretches: w.stretches };
};

/** FileReader funciona em todos os navegadores (inclusive os mais antigos do celular). */
const readText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

type Step =
  | { kind: 'idle' }
  | { kind: 'preview'; plan: PlanFile; summary: PlanSummary; fileName: string }
  | { kind: 'applying' }
  | { kind: 'done'; message: string; warning?: string };

function Block({ title, lines }: { title: string; lines?: string[] | string }) {
  if (!lines) return null;
  const list = Array.isArray(lines) ? lines : [lines];
  return (
    <div className="import__block">
      <h3 className="import__title">{title}</h3>
      <ul className="import__list">
        {list.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ajustes › Plano: recebe o arquivo .json do plano novo, mostra o que muda e só aplica
 * depois da confirmação. O que mudar sobe sozinho para a conta (sincronização).
 */
export function ImportPlan() {
  const input = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [error, setError] = useState('');
  const hasActive = useWorkoutStore((s) => s.active !== null);
  const userId = useAuth((s) => s.user?.id);

  async function onFile(file: File | undefined) {
    setError('');
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) return setError('Arquivo grande demais (máximo 30 MB).');
    const result = parsePlanFile(await readText(file), currentPlan());
    if (!result.ok) return setError(result.error);
    setStep({ kind: 'preview', plan: result.plan, summary: summarize(result.plan, currentPlan()), fileName: file.name });
  }

  async function apply(plan: PlanFile) {
    if (useWorkoutStore.getState().active) return setError('Termine ou cancele o treino em andamento antes de importar.');
    setStep({ kind: 'applying' });
    const next = applyPlan(plan, currentPlan());
    if (plan.diet) useDietStore.setState({ plan: next.diet });
    useWorkoutStore.setState({ workouts: next.workouts, schedule: next.schedule, stretches: next.stretches });

    let warning: string | undefined;
    if (plan.images?.length) {
      const failed = userId ? await uploadPlanImages(userId, plan.images) : plan.images.length;
      if (failed)
        warning = userId
          ? `${failed} foto(s) não foram enviadas. Com internet, importe o mesmo arquivo de novo para completar.`
          : 'As fotos só podem ser guardadas com a conta conectada.';
    }
    const kept = next.keptExercises;
    setStep({
      kind: 'done',
      message: `Plano atualizado${kept ? `. ${kept} exercício(s) continuam com o seu histórico e a sua carga` : ''}.`,
      warning,
    });
  }

  return (
    <section className="card stack-sm" aria-labelledby="import-title">
      <h2 id="import-title" className="card__title">
        Plano
      </h2>

      {step.kind === 'idle' && (
        <>
          <p className="muted">Recebeu treino ou dieta novos? Importe o arquivo do plano (.json) e confira o que muda antes de aplicar.</p>
          {hasActive ? (
            <p className="muted">Termine ou cancele o treino em andamento para importar.</p>
          ) : (
            <button type="button" className="btn-sm btn-sm--outline" onClick={() => input.current?.click()}>
              Importar plano
            </button>
          )}
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            hidden
            aria-label="Arquivo do plano"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </>
      )}

      {step.kind === 'preview' && (
        <>
          <p className="muted">
            {step.plan.label ?? step.fileName}: confira o que vai mudar.
          </p>
          <Block title="Dieta" lines={step.summary.diet} />
          <Block title="Treinos" lines={step.summary.workouts} />
          <Block title="Agenda" lines={step.summary.schedule} />
          <Block title="Alongamentos" lines={step.summary.stretches} />
          <Block title="Fotos" lines={step.summary.images} />
          <p className="muted import__note">Seus treinos feitos, a água, o peso e as medidas não mudam.</p>
          <div className="workout__actions">
            <button type="button" className="btn-sm btn-sm--outline" onClick={() => setStep({ kind: 'idle' })}>
              Cancelar
            </button>
            <button type="button" className="btn-sm btn-sm--dark" onClick={() => void apply(step.plan)}>
              Aplicar plano
            </button>
          </div>
        </>
      )}

      {step.kind === 'applying' && <p className="muted" role="status">Aplicando…</p>}

      {step.kind === 'done' && (
        <>
          <p role="status">{step.message}</p>
          {step.warning && <p className="error">{step.warning}</p>}
          <button type="button" className="link-btn" onClick={() => setStep({ kind: 'idle' })}>
            OK
          </button>
        </>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
