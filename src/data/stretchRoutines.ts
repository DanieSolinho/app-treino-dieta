export interface StretchStep {
  name: string;
  instruction?: string;
  seconds?: number; // posição com tempo: o app conta e avança sozinho
  reps?: string; // movimento por repetições: "10 movimentos para cada lado" — você toca em "Feito"
  bothSides?: boolean; // só para posições com tempo: repete o tempo para o outro lado
  image?: string; // foto em src/data/private/images (sem extensão)
}

export interface StretchRoutine {
  id: string;
  name: string;
  focus: string;
  steps: StretchStep[];
}

/** Rotinas genéricas de exemplo. Alongue até sentir tensão leve, nunca dor. */
export const sampleStretches: StretchRoutine[] = [
  {
    id: 'ombros',
    name: 'Ombros e peito',
    focus: 'Depois de treino de superiores',
    steps: [
      { name: 'Rotação de ombros', instruction: 'Gire os ombros para trás em círculos amplos, devagar.', seconds: 30 },
      { name: 'Braço cruzado', instruction: 'Puxe um braço esticado em frente ao peito com a outra mão.', seconds: 30, bothSides: true },
      { name: 'Peito na parede', instruction: 'Apoie o antebraço na parede e gire o tronco para o lado oposto.', seconds: 30, bothSides: true },
      { name: 'Gato e vaca', instruction: 'De quatro apoios, arredonde e arqueie as costas.', reps: '10 movimentos' },
    ],
  },
  {
    id: 'pernas',
    name: 'Pernas pós-treino',
    focus: 'Depois de treino de inferiores',
    steps: [
      { name: 'Quadríceps em pé', instruction: 'Segure o pé atrás do corpo, joelhos juntos.', seconds: 30, bothSides: true },
      { name: 'Posterior sentado', instruction: 'Perna esticada à frente, incline o tronco com a coluna reta.', seconds: 40, bothSides: true },
      { name: 'Afundo baixo', instruction: 'Joelho de trás no chão, empurre o quadril para a frente.', seconds: 30, bothSides: true },
    ],
  },
];

export type PlayerStep = StretchStep & { side?: 'Direito' | 'Esquerdo' };

/** Expande as posições com tempo "dos dois lados" em dois passos, para o player seguir em linha. */
export function expandSteps(routine: StretchRoutine): PlayerStep[] {
  return routine.steps.flatMap((s) =>
    s.bothSides && s.seconds ? [{ ...s, side: 'Direito' as const }, { ...s, side: 'Esquerdo' as const }] : [s],
  );
}

/** Duração estimada (passos por repetição contam ~30 s). */
export const totalSeconds = (routine: StretchRoutine) =>
  expandSteps(routine).reduce((sum, s) => sum + (s.seconds ?? 30), 0);
